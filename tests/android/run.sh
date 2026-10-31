#!/usr/bin/env bash
# User-style test of Asha on an Android emulator. Writes screenshots and logs to $OUT.
set -u
OUT="${OUT:-$PWD/results}"
FAILED=0   # set to 1 by any failing step; the script exits non-zero at the end
FLOWS="$(cd "$(dirname "$0")" && pwd)/flows"
mkdir -p "$OUT"
export PATH="$HOME/.maestro/bin:$PATH"
PKG=com.agastyaray.asha
log() { echo "== $*" | tee -a "$OUT/steps.log"; }
shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
# centre of the first on-screen element whose text or content-desc matches $1 (regex)
center() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml | python3 -c '
import re,sys
pat=re.compile(sys.argv[1]); x=sys.stdin.read()
for m in re.finditer(r"<node [^>]*>", x):
    n=m.group(0); t=re.search(r" text=\"([^\"]*)\"", n).group(1); d=re.search(r"content-desc=\"([^\"]*)\"", n).group(1)
    if pat.search(t) or pat.search(d):
        a,b,c,e=map(int,re.search(r"bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"", n).groups()); print((a+c)//2,(b+e)//2); break
' "$1"
}
run_flow() { (cd "$OUT" && maestro test --test-output-dir "$OUT/maestro-${1%.yaml}" "$FLOWS/$1" >> "$OUT/maestro.log" 2>&1); }
# one retry: the emulator sometimes misses a launch, which is not a test failure
flow() { log "flow $1"; run_flow "$1" || { log "flow $1 had a failing step, retrying once"; run_flow "$1" || { FAILED=1; log "flow $1 had a failing step (see maestro.log)"; shot "fail-${1%.yaml}"; maestro hierarchy > "$OUT/hierarchy-${1%.yaml}.json" 2>/dev/null; }; }; }
# the Expand chevron on the row whose title starts with $1 (the group may list other reminders first)
expand_row() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml | python3 -c '
import re,sys
pat=re.compile(sys.argv[1]); x=sys.stdin.read()
def box(n): return tuple(map(int,re.search(r"bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"", n).groups()))
ref=None; ex=[]
for n in re.findall(r"<node [^>]*>", x):
    t=re.search(r" text=\"([^\"]*)\"", n).group(1); d=re.search(r"content-desc=\"([^\"]*)\"", n).group(1)
    if ref is None and pat.search(t): ref=box(n)
    if d=="Expand": ex.append(box(n))
if ref and ex:
    cy=(ref[1]+ref[3])//2
    a,b,c,e=min(ex,key=lambda q: abs((q[1]+q[3])//2-cy)); print((a+c)//2,(b+e)//2)
' "$1"
}
# centre of the first node matching $1 (regex) that is on screen between the header and the bottom nav
center_on_screen() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb exec-out cat /sdcard/ui.xml | python3 -c '
import re,sys
pat=re.compile(sys.argv[1]); x=sys.stdin.read()
for m in re.finditer(r"<node [^>]*>", x):
    n=m.group(0); t=re.search(r" text=\"([^\"]*)\"", n).group(1); d=re.search(r"content-desc=\"([^\"]*)\"", n).group(1)
    if pat.search(t) or pat.search(d):
        a,b,c,e=map(int,re.search(r"bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"", n).groups())
        if 150 <= (b+e)//2 <= 1700: print((a+c)//2,(b+e)//2); break
' "$1"
}
# centre of the first on-screen node matching $1 (regex) in Maestro's hierarchy, which also sees WebView text
center_webview() {
  maestro hierarchy > "$OUT/hierarchy-now.json" 2>/dev/null
  python3 -c '
import json,re,sys
pat=re.compile(sys.argv[1]); data=json.load(open(sys.argv[2]))
def walk(n):
    if isinstance(n,list):
        for c in n: yield from walk(c)
        return
    a=n.get("attributes",{})
    if pat.search(a.get("text","")) or pat.search(a.get("accessibilityText","")):
        yield a.get("bounds","")
    for c in n.get("children",[]): yield from walk(c)
for b in walk(data):
    m=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", b)
    if not m: continue
    a,y1,c,y2=map(int,m.groups())
    if 150 <= (y1+y2)//2 <= 2300: print((a+c)//2,(y1+y2)//2); break
' "$1" "$OUT/hierarchy-now.json"
}
# centre_webview, retried while the page settles and scrolls the control into view
find_webview() {
  local xy=""
  for i in 1 2 3 4; do xy=$(center_webview "$1"); [ -n "$xy" ] && break; adb shell input swipe 540 1500 540 900 400; sleep 2; done
  echo "$xy"
}
# like find_webview, but scrolls on until the control sits above the bottom nav (a tap lower down hits a tab)
find_above_nav() {
  local xy=""
  # from the top of the page: Today keeps its scroll, and with big text a card can sit above the start point
  for i in 1 2 3 4 5 6; do adb shell input swipe 540 750 540 1750 300; done; sleep 2
  for i in $(seq 1 20); do xy=$(center_webview "$1"); [ -n "$xy" ] && [ "${xy#* }" -lt 1900 ] && break; xy=""; adb shell input swipe 540 1750 540 750 500; sleep 2; done
  echo "$xy"
}
# The times below are written for 15 Oct 2026 (16 Oct = the next day) but run from tomorrow's date, so the phone's
# 07:30 is never earlier than a server certificate renewed today (on 24 Oct one from 13:22 UTC broke every family call).
DAY0=$(TZ=Asia/Kolkata date -d "+1 day" +%m%d); DAY1=$(TZ=Asia/Kolkata date -d "+2 days" +%m%d); YEAR=$(TZ=Asia/Kolkata date -d "+1 day" +%Y); YEAR1=$(TZ=Asia/Kolkata date -d "+2 days" +%Y)
setclock() {
  local t="$1"
  case "$t" in 1015????2026.*) t="$DAY0${t:4:4}$YEAR${t:12}" ;; 1016????2026.*) t="$DAY1${t:4:4}$YEAR1${t:12}" ;; esac
  adb shell "date $t" >/dev/null; log "clock set to $(adb shell date)"
}

adb root >/dev/null 2>&1; sleep 3; adb wait-for-device
sleep 40   # let the freshly booted emulator settle (avoids "Pixel Launcher isn't responding")
adb shell settings put global hide_error_dialogs 1
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null
adb shell settings put global auto_time 0
adb shell settings put global auto_time_zone 0
adb shell service call alarm 3 s16 Asia/Kolkata >/dev/null
setclock 101507302026.00          # today, 07:30 India time
adb shell settings put system screen_off_timeout 600000
adb install -r -g "${APK:-Asha.apk}" >/dev/null && log "installed (all permissions pre-granted: no)" || true
# reinstall without auto-grant so the user sees the real permission prompts
adb uninstall $PKG >/dev/null; adb install -r "${APK:-Asha.apk}" && log "installed Asha"
adb logcat -c; adb logcat -G 16M 2>/dev/null || true  # a bigger buffer keeps the family calls from the start of the run
# the app's console (family call timings) in its own file, so the system logs cannot push it out of the buffer
adb logcat -v time Capacitor/Console:I '*:S' > "$OUT/logcat-console.txt" 2>/dev/null &
CONSOLE_PID=$!

# a prescription photo in the gallery for the photo-reading test
if command -v convert >/dev/null; then
  # a printed-style slip on a wide canvas, so every line fits, then a slight tilt and grain like a phone photo
  convert -size 1200x1500 xc:'#f7f4ea' -font DejaVu-Sans -fill '#1b2a4a' \
    -pointsize 44 -annotate +60+120 "Sharma Clinic, Sector 14" \
    -pointsize 30 -annotate +60+180 "Dr. R. Sharma, MBBS, MD  |  Reg. 45821" \
    -annotate +60+230 "Date: 20/10/2026" \
    -stroke '#1b2a4a' -strokewidth 3 -draw "line 60,270 1140,270" -stroke none \
    -pointsize 34 -annotate +60+340 "Patient: Kamla Devi    Age: 68    Wt: 62 kg" \
    -pointsize 52 -annotate +60+450 "Rx" \
    -pointsize 36 -annotate +60+560 "1. Tab Metformin 500 mg    1-0-1    after food" \
    -annotate +60+640 "2. Tab Amlodipine 5 mg    1-0-0    morning" \
    -annotate +60+720 "3. Tab Paracetamol 650 mg    SOS for pain" \
    -annotate +60+800 "4. Tab Atorvastatin 10 mg    0-0-1    at night" \
    -annotate +60+900 "Review after 30 days. Check sugar fasting." \
    -annotate +60+1200 "Signature: R. Sharma" \
    -rotate 1.5 -background '#e4dfd0' -gravity center -extent 1300x1600 \
    -blur 0x0.5 -attenuate 0.15 +noise Gaussian -quality 88 /tmp/rx.jpg
  adb push /tmp/rx.jpg /sdcard/Pictures/prescription.jpg >/dev/null
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/prescription.jpg >/dev/null
fi

MAIN_PID=$$
# watch the emulator itself: if it vanishes mid-run, this shows when, and how much memory the runner had left
( while true; do echo "$(date +%T) $(adb devices | grep -c 'device$') dev | $(free -m | awk '/Mem:/{print "free " $7 " MB"}') | $(pgrep -f qemu-system >/dev/null && echo qemu up || echo qemu GONE)"; sleep 5; done ) > "$OUT/watch.log" 2>&1 &
WATCH_PID=$!
# everything the phone logs, streamed, so a crash of the whole emulator still leaves the last lines behind
adb logcat -v time -b main -b system -b crash -b events > "$OUT/logcat-stream.txt" 2>/dev/null &
STREAM_PID=$!
# when the emulator process dies, keep the host's view of why
( while pgrep -f qemu-system >/dev/null; do sleep 3; done; grep -q '^== done' "$OUT/steps.log" && exit 0; { echo "qemu gone at $(date +%T)"; sudo dmesg | tail -40; ls -la /tmp/android-*/ 2>/dev/null; tail -50 ~/.android/avd/*.avd/*.log 2>/dev/null; } > "$OUT/emulator-death.txt" 2>&1
  # nothing more can run without the emulator; stop now instead of hanging until the job's 60-minute limit
  echo "== the emulator died (see emulator-death.txt)" >> "$OUT/steps.log"; pkill -f maestro; kill $MAIN_PID ) &
flow 01_setup.yaml
flow 02_permissions.yaml
shot 25-today-after-permissions

# --- Lock-screen reminder: Metformin and breakfast are both due at 08:00 ---
log "lock-screen reminder test"
adb shell input keyevent KEYCODE_HOME
setclock 101507582026.40         # 07:58:40, so the 08:00 reminders ring while locked
# exact alarms are a separate switch in Settings ("2. Allow exact times"); the card only opens that page,
# so turn the same permission on here, as the user would
adb shell appops set $PKG SCHEDULE_EXACT_ALARM allow && log "exact alarms allowed"
sleep 2; adb shell input keyevent KEYCODE_SLEEP
sleep 95
adb shell dumpsys notification --noredact | grep -E "pkg=$PKG|android.title=|android.text=" | grep -A2 "pkg=$PKG" > "$OUT/notifications-0800.txt" || true
[ -s "$OUT/notifications-0800.txt" ] || { FAILED=1; log "no Asha notification at 08:00"; }
adb shell input keyevent KEYCODE_WAKEUP; sleep 3
shot 26-lockscreen-at-0800
adb shell wm dismiss-keyguard; sleep 2
adb shell cmd statusbar expand-notifications; sleep 2
shot 27-notification-shade-0800
xy=$(center "Taken")
if [ -z "$xy" ]; then
  # the action buttons only show once the collapsed Asha notification is expanded
  adb exec-out cat /sdcard/ui.xml > "$OUT/shade-ui.xml"
  xy=$(center "Expand|Show more")
  if [ -n "$xy" ]; then adb shell input tap $xy; log "expanded the Asha group at $xy"; sleep 3; shot 27b-notification-expanded; fi
  # the group lists each reminder collapsed too; expand the Metformin one to show its buttons
  xy=$(expand_row "^Metformin")
  if [ -n "$xy" ]; then adb shell input tap $xy; log "expanded the Metformin reminder at $xy"; sleep 3; shot 27c-reminder-expanded; adb exec-out cat /sdcard/ui.xml > "$OUT/shade-expanded-ui.xml"; xy=$(center "Taken"); fi
fi
if [ -n "$xy" ]; then adb shell input tap $xy; log "tapped Taken on the notification at $xy"; sleep 3; else FAILED=1; log "no Taken button found in the shade"; fi
shot 28-after-tapping-taken
adb shell cmd statusbar collapse
# relaunch Asha so it applies any Taken pressed while closed, then show whether the dose is marked on Today
adb shell am force-stop $PKG; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 15
shot 29-today-after-taken
adb shell input swipe 450 1500 450 700 400; sleep 2; shot 29b-today-after-taken-scrolled

# --- every screen, as a user ---
flow 03_tabs.yaml
# can the runner and the phone reach the family server? (on 24 Oct every family call failed in ~0.5 s)
FAM=qheqzgxtzcagpayelfxn.supabase.co
log "family server from the runner: $(curl -s -o /dev/null -w '%{http_code} in %{time_total}s' -X OPTIONS -H 'Origin: https://localhost' -H 'Access-Control-Request-Method: POST' https://$FAM/functions/v1/family 2>&1)"
log "family server certificate: $(echo | timeout 10 openssl s_client -connect $FAM:443 -servername $FAM 2>/dev/null | openssl x509 -noout -issuer -startdate 2>&1 | tr '\n' ' ')"
log "its chain: $(echo | timeout 10 openssl s_client -showcerts -connect $FAM:443 -servername $FAM 2>/dev/null | grep -E '^ *[0-9] s:|i:' | tr '\n' ' ')"
log "family server from the phone: $(adb shell "ping -c 1 -W 3 $FAM 2>&1 | head -2 | tr '\n' ' '")"
adb shell "curl -s -o /dev/null -w '%{http_code}' https://$FAM/functions/v1/family" >/dev/null 2>&1 && log "phone curl: $(adb shell "curl -s -o /dev/null -w '%{http_code}' https://$FAM/functions/v1/family" 2>&1)"
flow 04_family.yaml
flow 05_prescription.yaml

# --- Help: hold the red SOS button for 2.5 s, while the flow has left the app on Help ---
flow 06_help.yaml
adb emu geo fix 77.2090 28.6139 >/dev/null 2>&1
xy=$(center "Hold for help|SOS")
if [ -n "$xy" ]; then adb shell input swipe $xy $xy 2600; log "held SOS at $xy"; else FAILED=1; log "no SOS hold button on the Help screen"; fi
sleep 3; shot 71-help-after-hold
xy=$(center "Allow|While using the app|Only this time"); [ -n "$xy" ] && { shot 72-help-location-prompt; adb shell input tap $xy; sleep 8; }
shot 73-help-after-location
sleep 5; shot 74-help-call
# KEYCODE_ENDCALL with no call active turns the screen off, so wake it again after closing the dialer
adb shell input keyevent KEYCODE_BACK; sleep 2
adb shell am force-stop com.google.android.dialer; adb shell input keyevent KEYCODE_WAKEUP; sleep 2
shot 75-back-in-asha

# --- Quiet mode: "I'm going to an event, be quiet" ---
log "quiet mode test"
setclock 101519202026.00          # 19:20, ten minutes before dinner (lunch and snack ring now, out loud)
sleep 30
adb shell am force-stop $PKG; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 15
flow 07_quiet.yaml                # quiet, then woken early: Android says "I'm back" straight away
sleep 6
grep "AshaSpeaker" "$OUT/logcat-stream.txt" | tail -3 > "$OUT/quiet-early-said.txt"
grep -q "I'm back" "$OUT/quiet-early-said.txt" && log "woken early: she said I'm back" || { FAILED=1; log "woken early: no I'm back"; }
flow 08_quiet_stay.yaml           # quiet for 30 minutes, until about 19:55
adb shell input keyevent KEYCODE_HOME
SAID_BEFORE=$(grep -c "AshaSpeaker.*SAY at=" "$OUT/logcat-stream.txt")
setclock 101519292026.40          # 19:29:40, so dinner comes due while she is quiet
sleep 80
adb shell dumpsys notification --noredact | grep -E "android.title=|android.text=" > "$OUT/quiet-1930-cards.txt" || true
grep -qi "dinner" "$OUT/quiet-1930-cards.txt" && log "19:30 while quiet: silent dinner card shown" || { FAILED=1; log "19:30 while quiet: no dinner card"; }
SAID_QUIET=$(grep -c "AshaSpeaker.*SAY at=" "$OUT/logcat-stream.txt")
[ "$SAID_QUIET" = "$SAID_BEFORE" ] && log "19:30 while quiet: she stayed silent" || { FAILED=1; log "19:30 while quiet: she spoke"; grep "AshaSpeaker" "$OUT/logcat-stream.txt" | tail -3 >> "$OUT/steps.log"; }
adb shell input keyevent KEYCODE_WAKEUP; sleep 2; shot 83-quiet-silent-card
setclock 101520052026.00          # 20:05, past the end of quiet
sleep 40
grep "AshaSpeaker" "$OUT/logcat-stream.txt" | tail -3 > "$OUT/quiet-end-said.txt"
grep -q "I'm back" "$OUT/quiet-end-said.txt" && grep -qi "dinner" "$OUT/quiet-end-said.txt" && log "quiet over: she said I'm back and the dinner" || { FAILED=1; log "quiet over: missing I'm back or dinner (see quiet-end-said.txt)"; }
shot 84-quiet-over
grep -E "FATAL EXCEPTION" -A8 "$OUT/logcat-stream.txt" | grep -B2 -A6 "$PKG" > "$OUT/quiet-crash.txt" && { FAILED=1; log "crash during quiet mode (see quiet-crash.txt)"; } || true

# --- Hindi and the largest text, tapped by screen position (Maestro's text bounds sat under the bottom nav) ---
# the Help flow leaves the app on Help, and a relaunch reopens Help, so go back to Today for its Settings button
adb shell am force-stop $PKG; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 15
xy=$(find_webview "^Today$")
if [ -n "$xy" ]; then adb shell input tap $xy; log "tapped the Today tab at $xy"; sleep 3; else log "no Today tab in the dump; trying Settings anyway"; fi
xy=$(center_webview "^Settings$|^सेटिंग$")
if [ -z "$xy" ]; then log "Settings not found in the dump; using the header gear position"; xy="758 228"; fi
adb shell input tap $xy; sleep 3; shot 39a-settings-opened
adb shell input swipe 540 1500 540 900 400; sleep 2
adb exec-out cat /sdcard/ui.xml > "$OUT/settings-ui.xml"
xy=$(find_above_nav "^हिन्दी$")
if [ -n "$xy" ]; then adb shell input tap $xy; log "tapped Hindi at $xy"; sleep 3; else FAILED=1; log "no Hindi switch on screen"; fi
shot 39b-settings-after-hindi
adb shell input swipe 540 1500 540 900 400; sleep 2
xy=$(find_above_nav "^A\\+\\+$")
if [ -n "$xy" ]; then adb shell input tap $xy; log "tapped the largest text size at $xy"; sleep 3; else FAILED=1; log "no largest text button on screen"; fi
shot 40-settings-hindi-largest-text
adb shell input keyevent KEYCODE_BACK; sleep 3
shot 41-today-hindi-largest-text
# Meds from the bottom nav, then Care (meals and chart), which opens from a card on Today, in Hindi
xy=$(find_webview "^दवा$"); [ -n "$xy" ] && { adb shell input tap $xy; sleep 3; shot 43-meds-hindi-largest-text; } || { FAILED=1; log "no Hindi Meds tab"; }
xy=$(find_webview "^आज$"); [ -n "$xy" ] && { adb shell input tap $xy; sleep 3; } || { FAILED=1; log "no Hindi Today tab"; }
xy=$(find_above_nav "^खाना और मेरा चार्ट खोलें$"); [ -n "$xy" ] && { adb shell input tap $xy; sleep 3; shot 44-care-hindi-largest-text; } || { FAILED=1; log "no Hindi meals and chart card"; }
# ---- the floating fairy: she must come back after a reboot, after Android kills Asha, after a long idle, and sleep at night ----
fairy_check() {
  local name=$1
  adb shell dumpsys activity services $PKG > "$OUT/fairy-$name-services.txt" 2>/dev/null
  adb shell dumpsys window windows > "$OUT/fairy-$name-windows.txt" 2>/dev/null
  shot "fairy-$name"
  # Asha's own overlay window, actually drawn (other apps' overlays, like the system's ShellDropTarget, do not count)
  if awk -v p="$PKG" '/^  Window #/{inw=index($0, p "}")>0} inw&&/ty=APPLICATION_OVERLAY/{o=1} inw&&o&&/isReadyForDisplay\(\)=true/{ok=1} END{exit !ok}' "$OUT/fairy-$name-windows.txt"; then log "fairy $name: floating fairy is on screen"
  else FAILED=1; log "fairy $name: floating fairy is MISSING"; fi
}
adb shell appops set $PKG SYSTEM_ALERT_WINDOW allow && log "fairy: display over other apps allowed"
adb shell input keyevent KEYCODE_HOME; sleep 2
adb shell am force-stop $PKG
# turn the floating fairy on the way the Settings switch does (it saves bubble=true in the app's family prefs)
PREFS=/data/data/$PKG/shared_prefs/asha_family.xml
adb shell "[ -f $PREFS ] || printf '<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\" ?>\n<map>\n</map>\n' > $PREFS"
adb shell "sed -i '/name=\"bubble\"/d; s#</map>#    <boolean name=\"bubble\" value=\"true\" />\n</map>#' $PREFS"
adb shell "chown \$(stat -c %u:%g /data/data/$PKG) $PREFS; chmod 660 $PREFS"
# a phone restart: Android sends BOOT_COMPLETED to an app that is not force-stopped (-f 0x20 stands in for that here)
adb shell am broadcast -f 0x20 -a android.intent.action.BOOT_COMPLETED -n $PKG/.BootReceiver >/dev/null
sleep 8; fairy_check 1-after-reboot
# Android kills the app in the background (low memory): the floating fairy should come back by herself
pid=$(adb shell pidof $PKG | tr -d '\r'); [ -n "$pid" ] && adb shell kill -9 $pid && log "fairy: killed Asha (pid $pid)"
sleep 25; fairy_check 2-after-kill
# long idle with Asha in the background (Android stops idle background services after about a minute)
sleep 90; fairy_check 3-after-idle
# late at night with no new message she sleeps: clock to 23:10, then the time-change broadcast Android sends
setclock 101523102026.00
adb shell am broadcast -f 0x20 -a android.intent.action.TIME_SET -n $PKG/.BootReceiver >/dev/null
sleep 5; fairy_check 4-night

# ---- stress: the user says no to permissions, goes offline, and taps the fairy over and over ----
# Asha must keep running (no crash, no blank screen) and say what is missing in plain words
fatal_count() { adb logcat -d | grep -A3 "FATAL EXCEPTION" | grep -c "Process: $PKG" || true; }
FATAL0=$(fatal_count)
alive() {
  local now; now=$(fatal_count)
  if [ "$now" != "$FATAL0" ]; then FAILED=1; log "stress $1: Asha CRASHED (see logcat-full.txt)"; FATAL0=$now
  elif [ -z "$(adb shell pidof $PKG | tr -d '\r')" ]; then FAILED=1; log "stress $1: Asha is NOT running"
  else log "stress $1: Asha still running"; fi
}
# a dose due in the last 45 minutes opens the full-screen medicine card; close it like a user would, so Today is reachable
close_spotlight() { local xy; for _ in 1 2 3; do xy=$(center_webview '^(Close|बंद करें)$'); [ -n "$xy" ] || break; adb shell input tap $xy; log "closed the medicine card at $xy"; sleep 2; done; }
relaunch() { adb shell am force-stop $PKG; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 15; close_spotlight; }
# (the run is in Hindi by now, so every text below is matched in both languages)
# a morning again, with the floating fairy off so she cannot sit on the controls
setclock 101608302026.00
adb shell "sed -i '/name=\"bubble\"/d' $PREFS"
adb shell am force-stop $PKG

# 1. notifications refused
adb shell pm revoke $PKG android.permission.POST_NOTIFICATIONS && log "stress: notifications refused"
relaunch; shot s1-no-notifications
[ -n "$(find_above_nav 'Allow reminders on screen|स्क्रीन पर याद की अनुमति')" ] && log "stress 1: Today asks again to allow reminders" || { FAILED=1; log "stress 1: no 'Allow reminders on screen' step on Today"; }
alive 1-no-notifications

# 2. exact alarms refused
adb shell appops set $PKG SCHEDULE_EXACT_ALARM deny && log "stress: exact alarms refused"
relaunch; shot s2-no-exact-alarms
[ -n "$(find_above_nav 'Allow exact times|ठीक समय की अनुमति')" ] && log "stress 2: Today asks for exact times" || { FAILED=1; log "stress 2: no 'Allow exact times' step on Today"; }
alive 2-no-exact-alarms

# 3. microphone refused: tap Tell Asha, answer "Don't allow" in the system prompt
# Android stops an app when one of its permissions is taken back, so open Asha again afterwards
adb shell pm revoke $PKG android.permission.RECORD_AUDIO && log "stress: microphone permission reset"
relaunch
# Tell Asha sits below the reminders now, so it can take more than one round of scrolling to reach
xy=$(find_above_nav "^(Tell Asha|आशा को बताएँ)$")
if [ -n "$xy" ]; then
  adb shell input tap $xy; sleep 3; shot s3a-mic-prompt
  xy=$(center "(?i)don.t allow"); [ -n "$xy" ] && { adb shell input tap $xy; log "stress 3: said Don't allow to the microphone"; } || log "stress 3: no microphone prompt shown"
  sleep 3; shot s3b-after-mic-refused
  # and again: Android stops asking after two refusals, so the app must explain it by itself
  xy=$(find_webview "^(Tell Asha|आशा को बताएँ)$"); [ -n "$xy" ] && adb shell input tap $xy; sleep 3
  xy=$(center "(?i)don.t allow"); [ -n "$xy" ] && adb shell input tap $xy
  sleep 3; shot s3c-mic-refused-twice
else FAILED=1; log "stress 3: no Tell Asha button"; fi
alive 3-no-microphone

# 4. location refused: open Help (the SOS button itself is not pressed here)
adb shell pm revoke $PKG android.permission.ACCESS_FINE_LOCATION 2>/dev/null; adb shell pm revoke $PKG android.permission.ACCESS_COARSE_LOCATION 2>/dev/null
log "stress: location refused"
relaunch
xy=$(center_webview "^(Help|मदद)$"); [ -n "$xy" ] && adb shell input tap $xy; sleep 4; shot s4-help-no-location
alive 4-no-location

# 5. "display over other apps" refused while the floating fairy is switched on
adb shell input keyevent KEYCODE_HOME; adb shell am force-stop $PKG
adb shell "sed -i 's#</map>#    <boolean name=\"bubble\" value=\"true\" />\n</map>#' $PREFS"
adb shell appops set $PKG SYSTEM_ALERT_WINDOW deny && log "stress: display over other apps refused"
adb shell am broadcast -f 0x20 -a android.intent.action.BOOT_COMPLETED -n $PKG/.BootReceiver >/dev/null; sleep 8
shot s5-no-overlay-home
relaunch; shot s5-no-overlay-app
alive 5-no-overlay

# 6. offline: no Wi-Fi, no mobile data
adb shell svc wifi disable; adb shell svc data disable; log "stress: phone offline"
relaunch; shot s6a-offline-today
xy=$(find_webview "^(Family|परिवार)$"); [ -n "$xy" ] && { adb shell input tap $xy; sleep 4; shot s6b-offline-family; }
xy=$(find_webview "^(Talk|बात)$"); [ -n "$xy" ] && { adb shell input tap $xy; sleep 3; shot s6c-offline-talk; }
alive 6-offline
adb shell svc wifi enable; adb shell svc data enable; log "stress: phone online again"

# 7. rapid taps: 15 quick taps on the fairy in the app, then on the floating fairy over the home screen
relaunch
xy=$(find_webview "^(Chintu$|Hear the reminder|Tell Asha how you feel|Talk to the fairy|Talk to family|Hear family messages|Well done|याद दिलाना सुनें|आशा को बताएँ आप कैसी हैं|परी से बात करें|परिवार से बात करें|परिवार के संदेश सुनें|शाबाश)")
if [ -n "$xy" ]; then for i in $(seq 15); do adb shell input tap $xy; done; sleep 3; shot s7a-after-rapid-taps-app; log "stress 7: tapped the fairy 15 times at $xy"
else log "stress 7: fairy not found in the app (she may be away)"; shot s7a-no-fairy; fi
alive 7a-rapid-taps-app
adb shell appops set $PKG SYSTEM_ALERT_WINDOW allow
adb shell input keyevent KEYCODE_HOME
adb shell am broadcast -f 0x20 -a android.intent.action.BOOT_COMPLETED -n $PKG/.BootReceiver >/dev/null; sleep 8
adb shell dumpsys window windows > "$OUT/stress-windows.txt" 2>/dev/null
xy=$(awk -v p="$PKG" '/^  Window #/{inw=index($0, p "}")>0; o=0} inw&&/ty=APPLICATION_OVERLAY/{o=1} inw&&o&&match($0,/[Ff]rame=\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]/){f=substr($0,RSTART,RLENGTH); sub(/^[^[]*\[/,"",f); split(f,a,/[^0-9]+/); print int((a[1]+a[3])/2), int((a[2]+a[4])/2); exit}' "$OUT/stress-windows.txt")
if [ -n "$xy" ]; then for i in $(seq 15); do adb shell input tap $xy; done; sleep 4; shot s7b-after-rapid-taps-floating; log "stress 7: tapped the floating fairy 15 times at $xy"
else log "stress 7: floating fairy window not found"; shot s7b-no-floating-fairy; fi
alive 7b-rapid-taps-floating
kill $CONSOLE_PID $WATCH_PID $STREAM_PID 2>/dev/null || true
adb logcat -d > "$OUT/logcat-full.txt"
# the app logs its family-circle config, including a secret; keep it out of the published results
sed -i -E 's/"secret":"[^"]*"/"secret":"REDACTED"/g; s/"x-device-secret":"[^"]*"/"x-device-secret":"REDACTED"/g' "$OUT/logcat-full.txt"
grep -iE "chromium|Capacitor|Asha|TextToSpeech|tts|AndroidRuntime|FATAL" "$OUT/logcat-full.txt" > "$OUT/logcat-asha.txt" || true
# Maestro keeps its screenshots under maestro-<flow>/; copy the named ones up beside the adb shots
# a retried flow leaves an earlier attempt's screenshots beside the newer ones; the sorted paths put the newest attempt last, so its copy wins
find "$OUT" -path "$OUT/maestro-*" -name "[0-9][0-9]*.png" | sort | while read -r f; do cp "$f" "$OUT/"; done
log "done (failed steps: $FAILED)"
exit $FAILED
