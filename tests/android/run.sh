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
flow() { log "flow $1"; (cd "$OUT" && maestro test --test-output-dir "$OUT/maestro-${1%.yaml}" "$FLOWS/$1" >> "$OUT/maestro.log" 2>&1) || { FAILED=1; log "flow $1 had a failing step (see maestro.log)"; shot "fail-${1%.yaml}"; maestro hierarchy > "$OUT/hierarchy-${1%.yaml}.json" 2>/dev/null; }; }
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
        if 250 <= (b+e)//2 <= 1700: print((a+c)//2,(b+e)//2); break
' "$1"
}
setclock() { adb shell "date $1" >/dev/null; log "clock set to $(adb shell date)"; }

adb root >/dev/null 2>&1; sleep 3; adb wait-for-device
sleep 40   # let the freshly booted emulator settle (avoids "Pixel Launcher isn't responding")
adb shell settings put global hide_error_dialogs 1
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null
adb shell settings put global auto_time 0
adb shell settings put global auto_time_zone 0
adb shell service call alarm 3 s16 Asia/Kolkata >/dev/null
setclock 101507302026.00          # 15 Oct 2026, 07:30 India time
adb shell settings put system screen_off_timeout 600000
adb install -r -g "${APK:-Asha.apk}" >/dev/null && log "installed (all permissions pre-granted: no)" || true
# reinstall without auto-grant so the user sees the real permission prompts
adb uninstall $PKG >/dev/null; adb install -r "${APK:-Asha.apk}" && log "installed Asha"
adb logcat -c

# a prescription photo in the gallery for the photo-reading test
if command -v convert >/dev/null; then
  convert -size 900x1200 xc:white -font DejaVu-Sans -pointsize 38 -fill black \
    -annotate +60+120 "Dr. R. Sharma, MBBS, MD" -annotate +60+180 "Patient: Kamla Devi   Age 68" \
    -annotate +60+300 "Rx" -annotate +60+380 "1. Tab Metformin 500 mg   1-0-1   after food" \
    -annotate +60+460 "2. Tab Amlodipine 5 mg   OD   morning" -annotate +60+540 "3. Tab Paracetamol 650 mg   SOS for pain" \
    -annotate +60+640 "x 30 days" -annotate +60+1000 "Sign: R. Sharma" /tmp/rx.jpg
  adb push /tmp/rx.jpg /sdcard/Pictures/prescription.jpg >/dev/null
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/prescription.jpg >/dev/null
fi

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
flow 04_family.yaml
flow 05_prescription.yaml

# --- Help: hold the red SOS button for 2.5 s ---
flow 06_help.yaml
# --- Hindi and the largest text, tapped by screen position (Maestro's text bounds sat under the bottom nav) ---
# the Help flow leaves the app on Help, so relaunch to reach the Today header and its Settings button
adb shell am force-stop $PKG; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 15
xy=$(center_on_screen "^Settings$|^सेटिंग$")
if [ -n "$xy" ]; then adb shell input tap $xy; sleep 3; shot 39a-settings-opened; fi
adb shell input swipe 540 1500 540 900 400; sleep 2
xy=$(center_on_screen "^हिन्दी$")
if [ -n "$xy" ]; then adb shell input tap $xy; log "tapped Hindi at $xy"; sleep 3; else FAILED=1; log "no Hindi switch on screen"; fi
shot 39b-settings-after-hindi
adb shell input swipe 540 1500 540 900 400; sleep 2
xy=$(center_on_screen "^A\\+\\+$")
if [ -n "$xy" ]; then adb shell input tap $xy; log "tapped the largest text size at $xy"; sleep 3; else FAILED=1; log "no largest text button on screen"; fi
shot 40-settings-hindi-largest-text
adb shell input keyevent KEYCODE_BACK; sleep 3
shot 41-today-hindi-largest-text
adb emu geo fix 77.2090 28.6139 >/dev/null 2>&1
xy=$(center "Hold for help|SOS")
if [ -n "$xy" ]; then adb shell input swipe $xy $xy 2600; log "held SOS at $xy"; fi
sleep 3; shot 71-help-after-hold
xy=$(center "Allow|While using the app|Only this time"); [ -n "$xy" ] && { shot 72-help-location-prompt; adb shell input tap $xy; sleep 8; }
shot 73-help-after-location
sleep 5; shot 74-help-call
adb shell input keyevent KEYCODE_ENDCALL; adb shell input keyevent KEYCODE_BACK; sleep 2
shot 75-back-in-asha

adb logcat -d > "$OUT/logcat-full.txt"
grep -iE "chromium|Capacitor|Asha|TextToSpeech|tts|AndroidRuntime|FATAL" "$OUT/logcat-full.txt" > "$OUT/logcat-asha.txt" || true
# Maestro keeps its screenshots under maestro-<flow>/; copy the named ones up beside the adb shots
find "$OUT" -path "$OUT/maestro-*" -name "[0-9][0-9]-*.png" -exec cp {} "$OUT/" \;
log "done (failed steps: $FAILED)"
exit $FAILED
