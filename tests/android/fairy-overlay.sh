#!/usr/bin/env bash
# The fairy living on the phone screen when Asha is closed (run with the workflow's suite=fairy).
# She asks to stay, switches on by herself after Android's permission page, hides while Asha is open,
# flies onto the home screen at reminder time with Taken / Later (one reminder at a time), visits even
# when the floating fairy is off, naps when dropped at the bottom, and comes back after a restart and a kill.
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
setclock() { adb shell "date $1" >/dev/null; log "clock set to $(adb shell date)"; }
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
pop_tap() {
  local f up; f=$(pop_frame); [ -z "$f" ] && { echo ""; return; }
  up=$([ "$1" = taken ] && echo 310 || echo 126)
  set -- $f; local xy="$(( ($1+$3)/2 )) $(( $4-up ))"; adb shell input tap $xy; echo "$xy"
}
pop_title() { grep "AshaFairy" "$OUT/logcat-stream.txt" | tail -1 | sed 's/.*| //'; }

adb root >/dev/null 2>&1; sleep 3; adb wait-for-device
sleep 40
adb shell settings put global hide_error_dialogs 1
adb shell settings put global auto_time 0
adb shell settings put global auto_time_zone 0
adb shell service call alarm 3 s16 Asia/Kolkata >/dev/null
setclock 101507302026.00          # 15 Oct 2026, 07:30 India time
adb shell settings put system screen_off_timeout 1800000
adb shell settings put global animator_duration_scale 1   # the workflow turns animations off; her flight needs them (and the video shows it)
adb install -r "${APK:-Asha.apk}" && log "installed Asha"
adb logcat -c; adb logcat -G 16M 2>/dev/null || true
adb logcat -v time -b main -b system -b crash > "$OUT/logcat-stream.txt" 2>/dev/null &
STREAM_PID=$!

# like a real phone, "Display over other apps" starts off (this emulator image allows it by default)
adb shell appops set $PKG SYSTEM_ALERT_WINDOW deny
flow 01_setup.yaml
flow 02_permissions.yaml
adb shell appops set $PKG SCHEDULE_EXACT_ALARM allow
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 12

# 1. She asks, on Today, if she may stay on the screen
xy=$(find_webview "^Yes, stay with me$")
shot F01-today-she-asks
[ -n "$xy" ] && pass "Today: she asks to stay on the screen" || fail "Today: no 'Yes, stay with me'"
[ "$(overlays)" = "0" ] && pass "no floating fairy before she is allowed" || fail "a floating fairy before permission"

# 2. Yes -> Android's "Display over other apps" page; allowed there; Back -> she switches on by herself
[ -n "$xy" ] && adb shell input tap $xy; sleep 4
shot F02-android-permission-page
adb shell dumpsys activity activities | grep -m1 -E "topResumedActivity|mResumedActivity" > "$OUT/after-yes-activity.txt"
grep -qi "settings" "$OUT/after-yes-activity.txt" && pass "Android's permission page opened" || fail "permission page did not open ($(cat "$OUT/after-yes-activity.txt"))"
adb shell appops set $PKG SYSTEM_ALERT_WINDOW allow && log "turned on Display over other apps (as the user would on that page)"
adb shell input keyevent KEYCODE_BACK; sleep 6
shot F03-back-in-asha
said 2 > "$OUT/said-after-allow.txt"
grep -q "stay on your screen" "$OUT/said-after-allow.txt" && pass "back in Asha she says she will stay" || fail "no happy hello after allowing (see said-after-allow.txt)"
[ -z "$(center_webview '^Yes, stay with me$')" ] && pass "the question is gone" || fail "still asking after she was allowed"
expect_overlays 0 "inside Asha the floating fairy hides (the app's own fairy is there)" in-app

# 3. Home screen: she is there
adb shell input keyevent KEYCODE_HOME; sleep 4
shot F04-home-screen-fairy
expect_overlays 1 "home screen: she is on the screen" home

# 4. 08:00, Metformin and breakfast ring together: she flies in with one, then the other
setclock 101507592026.30          # 07:59:30
adb shell screenrecord --time-limit 60 /sdcard/fairy-pop.mp4 &
REC=$!
sleep 45
shot F05-she-pops-up-at-0800
expect_overlays 1 "08:00: the reminder card is up (the little fairy waits inside it)" pop
FIRST=$(pop_title); log "first card: $FIRST"
xy=$(pop_tap taken)
[ -n "$xy" ] && pass "pop-up is on screen; tapped its Taken/Eaten at $xy" || fail "no pop-up window to tap"
sleep 1
shot F06-taken-happy
sleep 3
shot F07-next-reminder
wait $REC 2>/dev/null; adb pull /sdcard/fairy-pop.mp4 "$OUT/fairy-pop.mp4" >/dev/null 2>&1 && pass "recorded the pop-up video" || log "no video"
SECOND=$(pop_title); log "second card: $SECOND"
[ -n "$SECOND" ] && [ "$SECOND" != "$FIRST" ] && pass "the second 08:00 reminder came next" || fail "no second reminder after Taken (first '$FIRST', then '$SECOND')"
adb shell dumpsys notification --noredact | grep -E "android.title=" > "$OUT/notes-after-taken.txt"
[ -n "$FIRST" ] && grep -qF "$FIRST" "$OUT/notes-after-taken.txt" && fail "Taken on the pop-up left '$FIRST' in the notifications" || pass "Taken on the pop-up cleared its notification"
xy=$(pop_tap later); log "tapped Later at $xy"; sleep 3
shot F08-later-back-to-corner
expect_overlays 1 "after Later she goes back to her spot" after-later

# 5. Drop her at the bottom: she naps (the reminder pop-up still works)
adb shell dumpsys window windows > "$OUT/bubble-windows.txt"
BXY=$(python3 -c '
import re,sys
x=open(sys.argv[1]).read()
for blk in re.split(r"\n  Window #", x):
    if "com.agastyaray.asha}" not in blk.split("\n")[0]: continue
    m=re.search(r" frame=\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]", blk)
    if m and int(m[3])-int(m[1]) < 400: print((int(m[1])+int(m[3]))//2, (int(m[2])+int(m[4]))//2); break
' "$OUT/bubble-windows.txt")
log "little fairy at $BXY"
if [ -n "$BXY" ]; then
  adb shell input swipe $BXY 540 2250 1500; sleep 1
  shot F09-nap-yawn
  sleep 5; shot F10-napping-gone
  expect_overlays 0 "dropped at the bottom: she naps" nap
else fail "could not find the little fairy to drag"; fi

# 6. Floating fairy off: at 19:30 she still visits with the dinner reminder, then leaves
adb shell am force-stop $PKG
setclock 101512002026.00          # noon: nothing due, so no dose spotlight covers Settings
PREFS=/data/data/$PKG/shared_prefs/asha_family.xml
adb shell "sed -i '/name=\"bubble\"/d; /name=\"napUntil\"/d' $PREFS"
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 12
# turn her off in Settings, the way a person would (the switch shows On since she switched on by herself)
xy=$(find_webview "^Settings$"); [ -n "$xy" ] && adb shell input tap $xy; sleep 3
xy=$(find_webview "Floating fairy over other apps"); [ -n "$xy" ] && { adb shell input tap $xy; sleep 2; shot F11-settings-fairy-switch; }
adb shell input keyevent KEYCODE_HOME; sleep 3
shot F12-home-switched-off
expect_overlays 0 "switched off in Settings: no floating fairy" off
setclock 101519292026.40
sleep 45
shot F13-visits-for-dinner-when-off
[ "$(overlays)" -ge 1 ] && pass "switched off, she still comes at 19:30 with the reminder" || fail "switched off: no pop-up at 19:30"
log "19:30 card: $(pop_title)"; xy=$(pop_tap taken); log "tapped Eaten at $xy"; sleep 5
shot F14-visit-over
expect_overlays 0 "after answering, the visit ends (she stays off)" visit-over

# 7. On again; then a restart and a kill: she comes back
adb shell "sed -i '/name=\"bubble\"/d; s#</map>#    <boolean name=\"bubble\" value=\"true\" />\n</map>#' $PREFS"
adb shell am broadcast -f 0x20 -a android.intent.action.BOOT_COMPLETED -n $PKG/.BootReceiver >/dev/null
sleep 8; expect_overlays 1 "after a phone restart she is back" reboot
shot F15-after-restart
pid=$(adb shell pidof $PKG | tr -d '\r'); [ -n "$pid" ] && adb shell kill -9 $pid
sleep 25; expect_overlays 1 "after Android killed Asha she is back" kill
shot F16-after-kill
adb shell am broadcast -f 0x20 -a com.agastyaray.asha.FAIRY_CHECK -n $PKG/.BootReceiver >/dev/null; sleep 4
expect_overlays 1 "half-hourly check leaves one fairy (no duplicates)" check

grep -E "FATAL EXCEPTION" -A10 "$OUT/logcat-stream.txt" | grep -B2 -A8 "$PKG" > "$OUT/crashes.txt" && fail "Asha crashed (see crashes.txt)" || pass "no crash"
kill $STREAM_PID 2>/dev/null || true
find "$OUT" -path "$OUT/maestro-*" -name "[0-9][0-9]*.png" | sort | while read -r f; do cp "$f" "$OUT/"; done
log "done (failed steps: $FAILED)"
exit $FAILED
