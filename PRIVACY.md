# Asha — Privacy Policy

_Last updated: 24 October 2026_

Asha is a free reminder and companion app for older adults, made by Agastya Ray. It has no ads, no
tracking, no analytics and no accounts. We keep as little as possible. The public copy of this page is
at **https://asha-rho.vercel.app/privacy.html**.

## What stays on your phone only
- Your name, health conditions you choose, medicines, meal times and readings (sugar, blood pressure, pain, mood, weight)
- Loved ones' names, phone numbers and photos, and the emergency number
- Talk history (the last few messages) and the fairy's settings

This is stored inside the app on your phone. We do not receive a copy. Android may include it in your own
Google backup if you have backup turned on. "Erase everything" in Settings deletes it from the phone.

## What is sent over the internet, and why
Only when you use these features:
- **Prescription photo** — sent to our server and an AI service (xAI or Google Gemini) to read the medicine names. It is not stored.
- **Talk** — your message, your first name, chosen conditions and medicine list are sent to an AI service (xAI or Google Gemini) to write a reply. They are not stored by us.
- **Spoken voice** — the sentence to be spoken is sent to a voice service (ElevenLabs, xAI or Google Cloud Text-to-Speech) to turn it into sound. Not stored by us. The sound is kept on your phone so it does not need to be fetched again.
- **Weather** — for the morning greeting, a rough location (rounded to about 1 km) is sent to Open-Meteo to get the day's weather. Nothing else is sent with it.

These providers process the data under their own terms. A random device number is sent with each
request only to limit overuse; it is not linked to your identity.

## Family Circle (only if you create or join one)
- **What is stored on our server** (Supabase, Mumbai): a random phone ID, the name you chose to show, language,
  quiet hours, your phone's notification address, who is in your circle, and the messages sent in it
  (ready-made texts, typed messages, voice notes, medicine photos, and the updates the elder agreed to share,
  such as which medicines are due and whether they were taken).
- If the elder turns on medicine sharing, the names and doses of their medicines are stored so family can help.
- **What is not stored there:** health readings, contacts or location — except that a Help alert includes a
  map link to where the phone was at that moment.
- Messages, photos and voice notes are **deleted after 90 days**. "Delete my family circle" (Settings) deletes everything at once.
- Typed messages and voice notes are checked for safety (and translated) automatically; they may pass through
  Google's AI service (Gemini) for this. They are not used for anything else.
- Instant delivery uses Google Firebase Cloud Messaging.

## Permissions
- **Microphone** — only while you press a microphone button or talk to the fairy, to turn speech into text.
- **Location** — when you use Help, to put a map link in the message to your loved ones; and, if allowed, for the morning weather.
- **Phone calls** — only if you turn on "Help calls straight away".
- **Notifications, alarms, run after restart** — to show and speak reminders and family messages on time, even after the phone restarts.
- **Display over other apps** — only if you turn on the floating fairy, so she can stay on screen and show reminders when Asha is closed.

Asha does not read your contacts, messages, call log, photos or files. Help texts are written into your own
messages app for you to send.

## Selling and sharing
We do not sell any data, show ads, or share data with anyone except the services named above, only to do what you asked.

## Children
Asha is not meant for children under 13.

## Changes
If this policy changes, the date at the top changes and the new version is posted at the link above.

## Contact
Questions or deletion requests: open an issue at https://github.com/Agastya-Ray/asha/issues, or email the address shown on Asha's Google Play page.
