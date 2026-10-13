# Asha — a calm voice for medicines, meals and help

Asha is an Android app for older adults (built first for my mom). She **speaks** reminders in a warm
sentence — "Meena, it's eight in the morning. Time for your Metformin, with breakfast" — instead of
beeping, even when the phone is locked. She shows simple food and daily-habit guidance for
**arthritis, diabetes, PCOD, PCOS and life after a heart attack**, keeps a health chart, and has a
big red **Help** button that texts loved ones your location and calls them.

Hindi and English. You can even let Asha **speak Hindi while the screen shows English** (or the other way).

---

## Get the app on a phone (no coding)

1. On the Android phone, open **github.com/Agastya-Ray/asha/releases/latest**
2. Tap **Asha.apk** to download it.
3. Open the download. Android asks to "allow installing unknown apps" — allow it once for Chrome.
4. Open Asha. Watch the short introduction, then set up (about 3 minutes).
5. On the Today screen, if an orange card says **"So Asha never misses a reminder"**, press each button on it.
   On Xiaomi, Vivo, Oppo and Realme phones, step 3 (battery) matters most.

A new APK is built automatically every time code changes on the `main` branch.
Installing a newer APK keeps all of mom's medicines (same signing key every time).

---

## What's inside

| Free for everyone | Pro (talk freely) |
|---|---|
| Spoken medicine + meal reminders (works with the app closed) | Talk about anything, by voice or typing |
| Family Circle: sweet ready-made messages, hearts, updates | Family: your own words + 20-sec voice notes |
| Asks again twice if nothing is pressed | Replies spoken in a warm voice |
| "Tell Asha": say *"I took it"*, *"I have eaten"*, *"a glass of water"*, *"help"* | |
| Read a prescription photo (camera or gallery) | |
| Food plate + daily habits for 5 conditions, health chart | |
| Good-morning and good-night greetings | |
| **Help**: hold 2 s → texts loved ones with location → calls | |
| Optional: text family when a medicine is missed | |
| Doctor summary to send on WhatsApp | |
| Bigger text, Hindi/English, separate voice language | |

> Pro is a free switch for now. Google Play Billing should be added before charging money.

---

## Family Circle and the fairy 🧚

Family members (son, daughter, husband, wife…) install the **same Asha app** and choose **"I'm family"**.
Maa opens the **Family** tab → **Make an invite code** → sends the 6-digit code (WhatsApp button included).
Family types the code once. After that:

- **Family → Maa:** ready-made sweet messages ("Rahul is travelling and it's raining — thanks for the raincoat, Maa!"),
  a one-tap **❤️ Thinking of you**, and (Pro) their own words or a 20-second voice note.
- **Maa → family:** the same, plus automatic little updates **only if she agrees**: medicines taken, meals eaten,
  her mood, "missed a medicine after 3 reminders", and "hasn't opened Asha by 1 pm". She can choose one summary at night instead.
- **Help (SOS)** always alerts family in the app first (free, instant, with a map link), then SMS/call as before.
- Messages arrive in English or Hindi for each person. Asha reads them aloud on Maa's phone (not during quiet hours).
- **The fairy** lives in the app, on the **home screen** (long-press home screen → Widgets → Asha), and optionally
  **floating over other apps** (Settings → Family and the fairy). Her pet **Chintu** tumbles in with an envelope when a message arrives.
- People without the app can still get messages: every ready-made message has a **WhatsApp** button.

### What is set up already
| Piece | Where | Notes |
|---|---|---|
| Database + server function `family` | Supabase project **asha** (`qheqzgxtzcagpayelfxn`, Mumbai, free plan) | Tables are locked; only the function reads them |
| Instant messages | Firebase project **asha-12-10-2026** | `google-services.json` is in this repo (safe to share) |
| Firebase secret key | Supabase → **Vault** → `firebase_service_account` | Never in GitHub or the app |
| Night summary + 1 pm check | Supabase → **Integrations → Cron** → job `asha-family` (every 15 min) | Also deletes messages older than 90 days |

The server code is in `supabase/functions/family/`. Supabase runs the copy pinned to one GitHub commit
(see the one-line `index.ts` in the Supabase dashboard). To update it, change the code here, push, and redeploy with the new commit.

### Optional: switch on translation + safety AI + voice notes (free)
Typed messages are always checked by strict rules (no links, numbers, money/OTP talk, medicine changes, rude words).
To also add an AI check, translation (English ↔ Hindi) and voice notes:
1. Get a free key at **aistudio.google.com** → *Get API key*.
2. Supabase dashboard → project **asha** → **Edge Functions → Secrets** → add `GEMINI_API_KEY` = your key.
   (Or: **Vault** → new secret named `gemini_api_key`.)
That's it — no rebuild needed.

### If the Firebase key ever needs changing
Firebase console → ⚙ Project settings → Service accounts → **Generate new private key**.
Then Supabase → **Vault** → `firebase_service_account` → paste the whole new file. Delete the old key in Firebase.

## How it is built (for whoever fixes things later)

```
src/               the app screens (React + TypeScript + Tailwind)
  components/asha/ each screen: today, meds, care, talk, sos (Help), settings, intro, splash
  lib/asha/        logic: store (saved data), voice, listen, alarms, api, plans (health text)
api/               small server on Vercel: chat, voice (tts), prescription reading (rx), status
native/android/    Asha's own Android code (Java): spoken alarms, phone voice, mic, SMS, calls,
                   family push messages, home-screen fairy widget, floating fairy
supabase/          Family Circle server: database (migrations/) and the "family" function
scripts/           prepare-android.mjs wires native/android into the Android project
assets/            app icon + splash pictures
.github/workflows/ android.yml builds the APK on GitHub
```

The `android/` folder is **not** stored in the repo. GitHub creates it fresh on every build
(`npx cap add android` → `scripts/prepare-android.mjs` → `gradlew`). To change Android behaviour,
edit the files in `native/android/`.

### The voice never goes silent

1. **Warm cloud voice** (needs internet): xAI first, then Google Cloud Text-to-Speech.
2. **Phone's own voice** (free, offline): Android TextToSpeech, on the alarm volume so it is heard
   even when the ringer is on silent.

Reminders when the app is closed always use the phone's own voice, so they work offline too.
Chat and prescription reading try xAI first, then Google Gemini.

---

## Server setup (Vercel) — one time

The app works without the server (reminders, Help, chart, phone voice). The server adds the warm
voice, Talk (Pro) and prescription reading.

1. Go to **vercel.com/new**, import `Agastya-Ray/asha`, press **Deploy** (settings are already in `vercel.json`).
2. In the project → **Settings → Environment Variables**, add any of these (each one is optional):

| Name | What it does | Where to get it | Cost |
|---|---|---|---|
| `GEMINI_API_KEY` | Talk + prescription reading | aistudio.google.com → Get API key | free tier, no card |
| `XAI_API_KEY` | Talk + prescription + warm voice | console.x.ai | paid |
| `GOOGLE_TTS_API_KEY` | warm voice backup | console.cloud.google.com → enable "Cloud Text-to-Speech API" → Credentials → API key | 1M HD + 4M WaveNet characters free each month (billing account needed) |
| `ASHA_APP_KEY` | any long random word; blocks strangers from using your keys | you make it up | — |

3. Redeploy. Open `https://<your-project>.vercel.app/api/status` to see what's switched on.
4. In GitHub → repo **Settings → Secrets and variables → Actions**:
   - **Variables** tab → `ASHA_API_BASE` = `https://<your-project>.vercel.app`
   - **Secrets** tab → `ASHA_APP_KEY` = the same word as in Vercel (if you set one)
5. Re-run the "Build Android app" workflow (Actions tab) so the APK knows the server address.

---

## Putting it on Google Play — checklist

1. **Upload key** (one time): make a keystore and add 4 GitHub secrets:
   `ASHA_KEYSTORE_BASE64` (the .jks file, base64), `ASHA_KEYSTORE_PASSWORD`, `ASHA_KEY_ALIAS`, `ASHA_KEY_PASSWORD`.
   The next build then also produces **Asha-play.aab** (in the run's Artifacts). Back up the .jks file safely.
2. Play Console → create app → upload the .aab to **Internal testing** first.
3. **Privacy policy**: host `PRIVACY.md` (e.g. as a GitHub page) and paste its link.
4. **Data safety form**: health info + photos are sent to the server only to be read, not stored; contacts and
   medicines stay on the phone.
5. **Permissions declarations** Google will ask about:
   - `SEND_SMS` — Google restricts this. Asha uses it only for emergency texts and missed-dose alerts the user turns on.
     If Google rejects it, remove `SEND_SMS` from `scripts/prepare-android.mjs`; Help then opens the messages app with the text ready instead.
   - `SCHEDULE_EXACT_ALARM` — medicine reminders must ring on time.
   - Foreground service (short) — to speak the reminder.
6. Health apps also need the **Health apps declaration** in Play Console.

---

## Known limits (honest list)

- Pro has no payment yet.
- Data lives on one phone (Android backs up app data to Google if backup is on). No caregiver dashboard yet.
- Rate limits on the server are per server copy; for heavy use add a shared store (e.g. Upstash Redis).
- Asha is not a doctor. Health text is general guidance, written to never change a prescription.

## Develop on a computer (optional)

```bash
npm install
npm run dev          # opens the app in a browser at http://localhost:8080
npm run typecheck
```
