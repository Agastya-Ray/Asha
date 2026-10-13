# Asha — Privacy Policy

_Last updated: 13 October 2026_

Asha is a reminder and companion app. We keep as little as possible.

## What stays on your phone only
- Your name, health conditions you choose, medicines, meal times, readings (sugar, blood pressure, pain, mood, weight)
- Loved ones' names and phone numbers, and the emergency number
- Talk history (the last few messages)

This information is stored inside the app on your phone. We do not have an account system and we do
not receive a copy. Android may include it in your own Google backup if you have backup turned on.
"Erase everything" in Settings deletes it from the phone.

## What is sent over the internet, and why
Only when you use these features:
- **Prescription photo** — sent to our server and an AI service (xAI or Google Gemini) to read the medicine names. It is not stored.
- **Talk (Pro)** — your message, your first name, chosen conditions and medicine list are sent to an AI service (xAI or Google Gemini) to write a reply. They are not stored by us.
- **Warm voice** — the sentence to be spoken is sent to a voice service (xAI or Google Cloud Text-to-Speech). Not stored by us.

These providers process the data under their own terms. A random device number is sent with each
request only to limit overuse; it is not linked to your identity.

## Family Circle (only if you create or join one)
- **What is stored on our server** (Supabase, Mumbai): a random phone ID, the name you chose to show, language,
  quiet hours, your phone's notification address, who is in your circle, and the messages sent in it
  (ready-made texts, typed messages, voice notes, and the updates the elder agreed to share).
- **What is not stored there:** medicine names, health readings, contacts or location — except that a Help alert
  includes a map link to where the phone was at that moment.
- Messages and voice notes are **deleted after 90 days**. "Delete my family circle" (Settings) deletes everything at once.
- Typed messages and voice notes are checked for safety (and translated) automatically; if a Gemini key is set up,
  they pass through Google's AI service for this. They are not used for anything else.
- Instant delivery uses Google Firebase Cloud Messaging.

## Permissions
- **Microphone** — only while you press a microphone button, to turn speech into text.
- **Location** — only when you use Help, to put a map link in the message to your loved ones.
- **SMS** — only if you turn on "Help texts loved ones" or "Tell family if a medicine is missed".
- **Phone calls** — only if you turn on "Help calls straight away".
- **Notifications, alarms** — to show and speak reminders and family messages on time.
- **Display over other apps** — only if you turn on the floating fairy.

## Children
Asha is not meant for children under 13.

## Contact
Questions: open an issue at github.com/Agastya-Ray/asha/issues (replace with a support email before publishing on Google Play).
