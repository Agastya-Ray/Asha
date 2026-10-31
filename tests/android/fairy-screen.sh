#!/usr/bin/env bash
# The fairy living on the phone screen when Asha is closed (run with the workflow input suite=fairy).
# A. She asks to live on the home screen and becomes the live wallpaper with one press (no permission).
# B. On the home screen she turns toward taps; tapping her opens Asha.
# C. At reminder time on a locked phone she fills the screen like an alarm clock, one reminder at a time.
# D. With 'Display over other apps' on she also floats over apps and flies in herself; back after restart/kill.
# E. At night she sleeps on the floor of the home screen.
# V. Whenever she speaks, she is on the screen. A watcher reads every line she says from logcat (Android's voice and
#    the app's voice) and at that moment checks with dumpsys that she is drawn: Asha or her alarm on top, her card or
#    little fairy floating over another app, or her wallpaper on the home or lock screen. Any voice from nowhere FAILS.
#    Covered: in Asha on a screen with no fairy of its own, the home screen, another app, the lock screen, Asha in the
#    background, and after a restart and a kill.
set -u
OUT="${OUT:-$PWD/results}"
FAILED=0
FLOWS="$(cd "$(dirname "$0")" && pwd)/flows"
mkdir -p "$OUT"
export PATH="$HOME/.maestro/bin:$PATH"
PKG=com.agastyaray.asha
log() { echo "== $*" | tee -a "$OUT/steps.log"; }
shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
pass() { log "PASS $*"; }
fail() { FAILED=1; log "FAIL $*"; }
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
find_webview() {
  local xy=""
  for i in 1 2 3 4; do xy=$(center_webview "$1"); [ -n "$xy" ] && break; adb shell input swipe 540 1500 540 900 400; sleep 2; done
  echo "$xy"
}
run_flow() { (cd "$OUT" && maestro test --test-output-dir "$OUT/maestro-${1%.yaml}" "$FLOWS/$1" >> "$OUT/maestro.log" 2>&1); }
flow() { log "flow $1"; run_flow "$1" || { log "flow $1 retry"; run_flow "$1" || { fail "flow $1 (see maestro.log)"; shot "fail-${1%.yaml}"; }; }; }
# The times below are written for 15 Oct 2026 (16 Oct = the next day) but run from tomorrow's date, so the phone's
# 07:30 is never earlier than a server certificate renewed today (on 24 Oct one from 13:22 UTC broke every family call).
DAY0=$(TZ=Asia/Kolkata date -d "+1 day" +%m%d); DAY1=$(TZ=Asia/Kolkata date -d "+2 days" +%m%d); YEAR=$(TZ=Asia/Kolkata date -d "+1 day" +%Y); YEAR1=$(TZ=Asia/Kolkata date -d "+2 days" +%Y)
setclock() {
  local t="$1"
  case "$t" in 1015????2026.*) t="$DAY0${t:4:4}$YEAR${t:12}" ;; 1016????2026.*) t="$DAY1${t:4:4}$YEAR1${t:12}" ;; esac
  adb shell "date $t" >/dev/null; log "clock set to $(adb shell date)"
}
# How many of Asha's overlay windows are drawn right now (the little fairy = 1, plus the reminder card = 2)
overlays() {
  adb shell dumpsys window windows > "$OUT/windows-now.txt" 2>/dev/null
  awk -v p="$PKG" '/^  Window #/{if(inw&&o&&r)n++; inw=index($0, p "}")>0; o=0; r=0} inw&&/ty=APPLICATION_OVERLAY/{o=1} inw&&/isReadyForDisplay\(\)=true/{r=1} inw&&/mViewVisibility=0x8/{r=0} END{if(inw&&o&&r)n++; print n+0}' "$OUT/windows-now.txt"
}
expect_overlays() {
  local want=$1 what=$2 n
  n=$(overlays); cp "$OUT/windows-now.txt" "$OUT/windows-$3.txt"
  [ "$n" = "$want" ] && pass "$what ($n overlay windows)" || fail "$what: wanted $want overlay windows, saw $n"
}
said() { grep "AshaSpeaker" "$OUT/logcat-stream.txt" | tail -${1:-3}; }
# The reminder card is an overlay window, which uiautomator does not list: tap its buttons by where they sit.
# Both buttons are at the bottom of the card: Later 48dp up, Taken 118dp up (Pixel 6: 2.625 px per dp).
pop_frame() {
  adb shell dumpsys window windows > "$OUT/windows-pop-now.txt"
  python3 -c '
import re,sys
x=open(sys.argv[1]).read()
for blk in re.split(r"\n  Window #", x):
    if "com.agastyaray.asha}" not in blk.split("\n")[0]: continue
    m=re.search(r" frame=\[(\d+),(\d+)\]\[(\d+),(\d+)\]", blk)
    if m and "mViewVisibility=0x0" in blk and int(m[3])-int(m[1]) > 600: print(m[1],m[2],m[3],m[4]); break
' "$OUT/windows-pop-now.txt"
}
# her card's buttons, by the position the debug build logs (uiautomator cannot read a screen that keeps moving)
pop_tap() {
  sleep 2
  local line xy; line=$(grep "AshaFairy( *[0-9]*): buttons" "$OUT/logcat-stream.txt" | tail -1)
  [ -z "$line" ] && { echo ""; return; }
  if [ "$1" = taken ]; then xy=$(echo "$line" | sed -E 's/.*taken=([0-9]+),([0-9]+).*/\1 \2/'); else xy=$(echo "$line" | sed -E 's/.*later=([0-9]+),([0-9]+).*/\1 \2/'); fi
  adb shell input tap $xy; echo "$xy"
}
pop_title() { grep "AshaFairy.*: pop " "$OUT/logcat-stream.txt" | tail -1 | sed 's/.*| //'; }

# ---------- V. the voice watcher: is she on the screen at the moment she speaks? ----------
mkdir -p "$OUT/voice"
# her overlay windows that are drawn (same test as overlays(), own file so the main script's files stay untouched)
overlays_now() {
  adb shell dumpsys window windows > "$OUT/voice/windows.txt" 2>/dev/null
  awk -v p="$PKG" '/^  Window #/{if(inw&&o&&r)n++; inw=index($0, p "}")>0; o=0; r=0} inw&&/ty=APPLICATION_OVERLAY/{o=1} inw&&/isReadyForDisplay\(\)=true/{r=1} inw&&/mViewVisibility=0x8/{r=0} END{if(inw&&o&&r)n++; print n+0}' "$OUT/voice/windows.txt"
}
seen_now() {
  local f=$1 wake top focus ov wp
  wake=$(adb shell dumpsys power | grep -m1 -oE "mWakefulness=[A-Za-z]+" | tr -d '\r')
  top=$(adb shell dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity" | tr -d '\r')
  focus=$(adb shell dumpsys window | grep -m1 "mCurrentFocus" | tr -d '\r')
  ov=$(overlays_now)
  wp=$(adb shell dumpsys wallpaper | grep -c "FairyWallpaper")
  printf '%s\n%s\n%s\noverlays=%s wallpaper=%s\n' "$wake" "$top" "$focus" "$ov" "$wp" > "$OUT/voice/$f-state.txt"
  if [ "$wake" != "mWakefulness=Awake" ]; then echo "FAIL(screen off)"
  elif echo "$top" | grep -q "$PKG/.ReminderAlarmActivity"; then echo "PASS(full-screen alarm)"
  elif echo "$top" | grep -q "$PKG/"; then echo "PASS(in Asha)"
  elif [ "${ov:-0}" -ge 1 ] && ! echo "$focus" | grep -qiE "NotificationShade|Keyguard"; then echo "PASS(floating over another app)"
  elif [ "${wp:-0}" -gt 0 ] && echo "$focus" | grep -qiE "launcher|NotificationShade|Keyguard"; then echo "PASS(wallpaper)"
  else echo "FAIL(not on screen: $focus)"; fi
}
voice_watch() {
  local n=0 line f verdict
  adb logcat -v time -T 1 2>/dev/null | grep --line-buffered -E "AshaSpeaker|AshaVoice" | while IFS= read -r line; do
    case "$line" in
      *"AshaSpeaker"*" SAY at="*|*"AshaVoice SAY"*) ;;
      *) echo "info | $line" >> "$OUT/voice-check.log"; continue ;;
    esac
    n=$((n+1)); f=$(printf "V%02d" "$n")
    verdict=$(seen_now "$f")
    # the app's own check: was a fairy drawn on the page as the voice began?
    case "$line" in *"AshaVoice SAY drawn=false"*) verdict="FAIL(in Asha, but no fairy drawn on the page)" ;; esac
    [ "$n" -le 60 ] && adb exec-out screencap -p > "$OUT/voice/$f.png" 2>/dev/null
    echo "$verdict $f | $line" >> "$OUT/voice-check.log"
  done
}
: > "$OUT/voice-check.log"
# lines checked since a mark: "voice_since <mark>" prints the verdict lines written after it
voice_mark() { wc -l < "$OUT/voice-check.log" | tr -d ' '; }
voice_since() { tail -n +"$(( $1 + 1 ))" "$OUT/voice-check.log" | grep -E "^(PASS|FAIL)"; }

top_activity() { adb shell dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity"; }
launch() { adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 10; }

adb root >/dev/null 2>&1; sleep 3; adb wait-for-device
sleep 40
adb shell settings put global hide_error_dialogs 1
adb shell settings put global auto_time 0
adb shell settings put global auto_time_zone 0
adb shell service call alarm 3 s16 Asia/Kolkata >/dev/null
setclock 101507302026.00          # today, 07:30 India time
adb shell settings put system screen_off_timeout 1800000
# Maestro cannot read a screen that never stops moving, so animations stay off for the Maestro flows (the workflow
# turns them off) and come on only for the native parts, where her flight needs them (and the video shows it).
anim() { adb shell settings put global animator_duration_scale $1; }
adb install -r "${APK:-Asha.apk}" && log "installed Asha"
# like a real phone, "Display over other apps" starts off (this emulator image allows it by default)
adb shell appops set $PKG SYSTEM_ALERT_WINDOW deny
adb logcat -c; adb logcat -G 16M 2>/dev/null || true
adb logcat -v time -b main -b system -b crash > "$OUT/logcat-stream.txt" 2>/dev/null &
STREAM_PID=$!
voice_watch &
WATCH_PID=$!

adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null
flow 01_setup.yaml
flow 02_permissions.yaml
adb shell appops set $PKG SCHEDULE_EXACT_ALARM allow
adb shell dumpsys notification | grep -i "fullscreen\|USE_FULL_SCREEN" | head -3 > "$OUT/full-screen-permission.txt"
adb shell appops get $PKG USE_FULL_SCREEN_INTENT >> "$OUT/full-screen-permission.txt" 2>&1
launch

# ---------- A. she asks to live on the home screen: one press, no permission ----------
anim 0
# start from the top of Today: the question sits above the medicine card, and Today keeps its scroll
for i in 1 2 3 4 5 6; do adb shell input swipe 540 700 540 1800 300; done; sleep 2
flow fairy_home_ask.yaml && pass "Today: she asks to live on the home screen, and Yes was pressed"
anim 1
sleep 5
shot F02-wallpaper-preview
top_activity > "$OUT/after-yes-activity.txt"
if grep -qiE "wallpaper" "$OUT/after-yes-activity.txt"; then pass "Android's wallpaper preview opened from the Yes button"
else
  fail "the Yes button did not open the wallpaper preview ($(cat "$OUT/after-yes-activity.txt"))"
  # still check the wallpaper itself: open the same preview the button opens
  adb shell am start -a android.service.wallpaper.CHANGE_LIVE_WALLPAPER --ecn android.service.wallpaper.extra.LIVE_WALLPAPER_COMPONENT $PKG/.FairyWallpaper >/dev/null; sleep 5
  shot F02b-wallpaper-preview-direct
  top_activity | grep -qi wallpaper && log "the preview opens when started directly" || log "the preview does not open even directly ($(top_activity))"
fi
xy=$(center "(?i)^set wallpaper$|^Set$|Apply")
[ -n "$xy" ] && { adb shell input tap $xy; log "tapped Set wallpaper at $xy"; sleep 3; shot F03-home-or-lock; } || fail "no Set wallpaper button"
xy=$(center "(?i)home and lock|home screen and lock")
[ -n "$xy" ] && { adb shell input tap $xy; log "chose home and lock at $xy"; sleep 4; }
adb shell dumpsys wallpaper | grep -m3 -iE "mWallpaperComponent|component" > "$OUT/wallpaper-now.txt"
grep -q "FairyWallpaper" "$OUT/wallpaper-now.txt" && pass "the fairy is the wallpaper" || fail "the fairy is not the wallpaper ($(cat "$OUT/wallpaper-now.txt"))"
grep -E "AshaFairy.*no live wallpaper" "$OUT/logcat-stream.txt" | tail -2 >> "$OUT/after-yes-activity.txt"
top_activity | grep -q "$PKG" || launch
sleep 4; shot F04-back-in-asha
said 2 > "$OUT/said-after-wallpaper.txt"
grep -q "home screen" "$OUT/said-after-wallpaper.txt" && pass "back in Asha she says she lives on the home screen" || log "no happy hello in the phone voice (her cloud voice is not logged; see said-after-wallpaper.txt)"
[ -z "$(center_webview '^Yes, live on my screen$')" ] && pass "the question is gone" || fail "still asking after she became the wallpaper"

# ---------- B. on the home screen, with Asha closed ----------
adb shell input keyevent KEYCODE_HOME; sleep 3
adb shell screenrecord --time-limit 12 /sdcard/fairy-home.mp4; adb pull /sdcard/fairy-home.mp4 "$OUT/fairy-home.mp4" >/dev/null 2>&1 && pass "recorded her on the home screen"
shot F05-home-screen
# tap empty home screen far from her: she turns and hops; tap her: Asha opens
adb shell input tap 150 1500; sleep 1; shot F06-she-turns-to-the-tap
adb shell input tap 540 1250; sleep 4
top_activity | grep -q "$PKG/.MainActivity" && pass "tapping her on the home screen opens Asha" || fail "tapping her did not open Asha ($(top_activity))"
adb shell input keyevent KEYCODE_HOME; sleep 2
adb shell input keyevent KEYCODE_SLEEP; sleep 2; adb shell input keyevent KEYCODE_WAKEUP; sleep 2
shot F07-lock-screen

# ---------- C. 08:00 on a locked, sleeping phone: she fills the screen like an alarm clock ----------
setclock 101507592026.30
adb shell input keyevent KEYCODE_SLEEP
sleep 40
adb shell screenrecord --time-limit 20 /sdcard/fairy-alarm.mp4 &
REC=$!
sleep 8
shot F08-alarm-over-lock-screen
top_activity > "$OUT/alarm-activity.txt"
grep -q "ReminderAlarmActivity" "$OUT/alarm-activity.txt" && pass "08:00: full-screen fairy over the lock screen" || fail "08:00: no full-screen fairy ($(cat "$OUT/alarm-activity.txt"))"
FIRST=$(pop_title); log "first: $FIRST"
xy=$(pop_tap taken); [ -n "$xy" ] && log "tapped Taken/Eaten at $xy" || fail "no Taken on the alarm"
sleep 1; shot F09-alarm-taken-happy
sleep 4; shot F10-alarm-next-reminder
SECOND=$(pop_title); log "second: $SECOND"
[ -n "$SECOND" ] && [ "$SECOND" != "$FIRST" ] && pass "the second 08:00 reminder came next" || fail "no second reminder (first '$FIRST', then '$SECOND')"
xy=$(pop_tap later); [ -n "$xy" ] && log "tapped Later at $xy" || fail "no Later on the alarm"
sleep 3; shot F11-after-later
wait $REC 2>/dev/null; adb pull /sdcard/fairy-alarm.mp4 "$OUT/fairy-alarm.mp4" >/dev/null 2>&1
top_activity | grep -q "ReminderAlarmActivity" && fail "the alarm stayed after Later" || pass "after Later the alarm closes"
adb shell dumpsys notification --noredact | grep -E "android.title=" > "$OUT/notes-after-alarm.txt"
[ -n "$FIRST" ] && grep -qF "$FIRST" "$OUT/notes-after-alarm.txt" && fail "Taken left '$FIRST' in the notifications" || pass "Taken on the alarm cleared its notification"
adb shell wm dismiss-keyguard; sleep 2

# ---------- V1. in Asha on Settings (no fairy of its own there): the 08:00 reminder snoozed with Later rings again ----------
adb shell am start -n $PKG/.MainActivity --es openTab settings >/dev/null 2>&1; sleep 8
M=$(voice_mark)
setclock 101508102026.20          # the 08:00 reminder put off with Later rings again at about 08:10:40
sleep 40
shot V1-in-asha-settings-she-speaks
voice_since $M > "$OUT/voice-V1.txt"
peek=$(center_webview "is talking|बोल रही है")
grep -q "AshaSpeaker.*SAY at=app" "$OUT/voice-V1.txt" && { [ -n "$peek" ] && pass "V1: in Asha on Settings the reminder is spoken and she floats in at the top while she speaks" || fail "V1: spoken on Settings but no fairy drawn on the page"; } \
  || log "V1: the snoozed reminder did not ring on Settings ($(head -c 300 "$OUT/voice-V1.txt"))"

# ---------- V2. on the home screen, no 'Display over other apps': 13:00 lunch, she speaks from her wallpaper ----------
adb shell input keyevent KEYCODE_HOME; sleep 3
M=$(voice_mark)
setclock 101512592026.30
sleep 40
shot V2-home-screen-lunch
voice_since $M > "$OUT/voice-V2.txt"
if grep -q "FAIL" "$OUT/voice-V2.txt"; then fail "V2: home screen, a voice with no fairy on screen ($(grep -m1 FAIL "$OUT/voice-V2.txt"))"
elif grep -q "PASS" "$OUT/voice-V2.txt"; then pass "V2: home screen, she is seen while she speaks ($(grep -m1 -oE "PASS\([^)]*\)" "$OUT/voice-V2.txt"))"
else log "V2: home screen, nothing spoken at 13:00 ($(grep "info" "$OUT/voice-check.log" | tail -2))"; fi

# ---------- V3. Asha left in the background: her timers keep running, but not one word or sound comes out ----------
M=$(voice_mark)
adb shell am start -n $PKG/.MainActivity --es openTab today >/dev/null 2>&1; sleep 4
adb shell input keyevent KEYCODE_HOME
adb shell am start -n $PKG/.MainActivity --es openTab care >/dev/null 2>&1; sleep 2
adb shell am start -a android.settings.SETTINGS >/dev/null 2>&1
sleep 240
shot V3-asha-in-background
voice_since $M > "$OUT/voice-V3.txt"
grep "AshaVoice BLOCKED" "$OUT/voice-check.log" | tail -5 > "$OUT/voice-V3-held-back.txt"
grep -q "FAIL" "$OUT/voice-V3.txt" && fail "V3: a voice came from Asha in the background ($(grep -m1 FAIL "$OUT/voice-V3.txt"))" \
  || pass "V3: 4 minutes with Asha in the background: no voice from nowhere ($(wc -l < "$OUT/voice-V3-held-back.txt") lines held back)"
adb shell input keyevent KEYCODE_HOME; sleep 2

# ---------- D. optional extra: floating over other apps, once 'Display over other apps' is on ----------
adb shell appops set $PKG SYSTEM_ALERT_WINDOW allow && log "Display over other apps: on"
setclock 101519202026.00
launch; sleep 4
# she floats only for people who switch her on in Settings, never by herself
anim 0
flow fairy_float_on.yaml && pass "Settings: Floating fairy switched on"
anim 1
adb shell input keyevent KEYCODE_HOME; sleep 4
shot F12-home-wallpaper-and-floating
expect_overlays 1 "with the permission she also floats over other apps" float
# in another app (the phone app). Not Android's own Settings: it hides every app's floating windows on purpose.
adb shell am start -a android.intent.action.DIAL >/dev/null 2>&1; sleep 3
M=$(voice_mark)
setclock 101519292026.40          # 19:30 dinner, phone in use: she flies in herself, over the other app
sleep 45
shot F13-flies-in-at-1930
[ "$(overlays)" -ge 1 ] && [ -n "$(pop_frame)" ] && pass "19:30, phone in use: the floating fairy flies in with the reminder" || fail "19:30: no pop-up card"
voice_since $M > "$OUT/voice-D-other-app.txt"
grep -q "PASS(floating" "$OUT/voice-D-other-app.txt" && ! grep -q FAIL "$OUT/voice-D-other-app.txt" && pass "V4: over another app, she is on the screen while she speaks" \
  || fail "V4: over another app, voice and fairy did not go together ($(head -c 300 "$OUT/voice-D-other-app.txt"))"
xy=$(pop_tap later); log "tapped Later at $xy"; sleep 5
shot F14-back-to-her-spot
expect_overlays 1 "after Later she is back in her spot" after-pop
PREFS=/data/data/$PKG/shared_prefs/asha_family.xml
adb shell am broadcast -f 0x20 -a android.intent.action.BOOT_COMPLETED -n $PKG/.BootReceiver >/dev/null
sleep 8; expect_overlays 1 "after a phone restart she floats again" reboot
pid=$(adb shell pidof $PKG | tr -d '\r'); [ -n "$pid" ] && adb shell kill -9 $pid
sleep 25; expect_overlays 1 "after Android killed Asha she floats again" kill
# the dinner reminder put off with Later rings again ten minutes on, with Asha killed: she flies in and then speaks
adb shell input keyevent KEYCODE_HOME; sleep 2
M=$(voice_mark)
setclock 101519402026.10
sleep 45
shot V5-after-kill-reminder
voice_since $M > "$OUT/voice-V5.txt"
if grep -q FAIL "$OUT/voice-V5.txt"; then fail "V5: after a kill, a voice with no fairy on screen ($(grep -m1 FAIL "$OUT/voice-V5.txt"))"
elif grep -q PASS "$OUT/voice-V5.txt"; then pass "V5: after a kill, the reminder came with her on screen ($(grep -m1 -oE "PASS\([^)]*\)" "$OUT/voice-V5.txt"))"
else fail "V5: after a kill, the snoozed reminder was not spoken"; fi
xy=$(pop_tap taken); log "tapped Eaten at $xy"; sleep 3

# ---------- E. late at night she sleeps on the floor of the home screen ----------
setclock 101523102026.00
adb shell am broadcast -f 0x20 -a android.intent.action.TIME_SET -n $PKG/.BootReceiver >/dev/null
adb shell appops set $PKG SYSTEM_ALERT_WINDOW deny; pid=$(adb shell pidof $PKG | tr -d '\r'); [ -n "$pid" ] && adb shell kill -9 $pid
sleep 6; adb shell input keyevent KEYCODE_HOME; sleep 4
shot F15-night-asleep-on-home-screen
adb shell screenrecord --time-limit 8 /sdcard/fairy-night.mp4; adb pull /sdcard/fairy-night.mp4 "$OUT/fairy-night.mp4" >/dev/null 2>&1

# ---------- V. the verdict over the whole run ----------
sleep 3; kill $WATCH_PID 2>/dev/null; pkill -f "grep --line-buffered -E AshaSpeaker" 2>/dev/null
SAYS=$(grep -cE "^(PASS|FAIL)" "$OUT/voice-check.log"); BAD=$(grep -cE "^FAIL" "$OUT/voice-check.log")
log "voice check: $SAYS lines spoken, $BAD without her on screen (voice-check.log, screenshots in voice/)"
[ "$BAD" = 0 ] && [ "$SAYS" -ge 3 ] && pass "V: every time she spoke in this run, she was on the screen ($SAYS times)" \
  || fail "V: $BAD of $SAYS spoken lines came with no fairy on the screen (or too few were spoken to judge)"

grep -E "FATAL EXCEPTION" -A10 "$OUT/logcat-stream.txt" | grep -B2 -A8 "$PKG" > "$OUT/crashes.txt" && fail "Asha crashed (see crashes.txt)" || pass "no crash"
kill $STREAM_PID 2>/dev/null || true
find "$OUT" -path "$OUT/maestro-*" -name "[0-9][0-9]*.png" | sort | while read -r f; do cp "$f" "$OUT/"; done
log "done (failed steps: $FAILED)"
exit $FAILED
