// Ready-made warm messages. Shared by the app (to show the choices) and the server (to build the text),
// so a "preset" can never carry anything except these words.
// {from} = the sender's name ("Rahul", or "Maa" when she sends), {elder} = what the family calls her ("Maa").
// No imports here: this file is used by both Deno (server) and Vite (app).

export type Bi = { en: string; hi: string };
export type Preset = { id: string; group: string; text: Bi };

export const GROUPS_TO_ELDER: { id: string; label: Bi }[] = [
  { id: "love", label: { en: "Love", hi: "प्यार" } },
  { id: "day", label: { en: "My day", hi: "मेरा दिन" } },
  { id: "food", label: { en: "Food", hi: "खाना" } },
  { id: "care", label: { en: "Take care", hi: "ख़याल रखना" } },
  { id: "thanks", label: { en: "Thank you", hi: "शुक्रिया" } },
];

/** Family → elder */
export const TO_ELDER: Preset[] = [
  { id: "te_think", group: "love", text: { en: "{from} was thinking of you just now, {elder}.", hi: "{from} अभी-अभी आपको याद कर रहे थे, {elder}." } },
  { id: "te_love", group: "love", text: { en: "{from} says: I love you, {elder}. Always.", hi: "{from} कह रहे हैं: {elder}, आपसे बहुत प्यार है. हमेशा." } },
  { id: "te_miss", group: "love", text: { en: "{from} misses you and can't wait to see you.", hi: "{from} आपको याद करते हैं और जल्दी मिलना चाहते हैं." } },
  { id: "te_hug", group: "love", text: { en: "{from} is sending you a big warm hug, {elder}.", hi: "{from} आपको एक बड़ी सी झप्पी भेज रहे हैं, {elder}." } },
  { id: "te_proud", group: "love", text: { en: "{from} wants you to know how proud they are of you.", hi: "{from} चाहते हैं कि आप जानें — उन्हें आप पर बहुत गर्व है." } },
  { id: "te_smile", group: "love", text: { en: "{from} saw something today that reminded them of your smile.", hi: "{from} ने आज कुछ देखा जो आपकी मुस्कान याद दिला गया." } },
  { id: "te_rain", group: "day", text: { en: "{from} is travelling and it's raining. They're dry and happy — thanks for the raincoat, {elder}!", hi: "{from} सफ़र में हैं और बारिश हो रही है. वो सूखे और खुश हैं — रेनकोट के लिए शुक्रिया, {elder}!" } },
  { id: "te_reached", group: "day", text: { en: "{from} reached safely. Don't worry, {elder}.", hi: "{from} आराम से पहुँच गए. चिंता मत करिए, {elder}." } },
  { id: "te_office", group: "day", text: { en: "{from} had a good day at work and is thinking of you on the way home.", hi: "{from} का दिन अच्छा रहा, घर लौटते हुए आपको याद कर रहे हैं." } },
  { id: "te_busy", group: "day", text: { en: "{from} is busy today but will call you this evening.", hi: "{from} आज व्यस्त हैं, शाम को फ़ोन करेंगे." } },
  { id: "te_good_news", group: "day", text: { en: "{from} has some good news and wants to tell you first. Expect a call!", hi: "{from} के पास अच्छी खबर है, सबसे पहले आपको बताना चाहते हैं. फ़ोन आएगा!" } },
  { id: "te_visit", group: "day", text: { en: "{from} is planning to visit you soon.", hi: "{from} जल्दी ही आपसे मिलने आने का सोच रहे हैं." } },
  { id: "te_rice", group: "food", text: { en: "{from} cooked rice today and wishes you were there to make the dal. They miss you.", hi: "{from} ने आज चावल बनाए और सोच रहे थे काश आप दाल बना देतीं. आपकी याद आई." } },
  { id: "te_your_food", group: "food", text: { en: "{from} says no one cooks like you, {elder}.", hi: "{from} कहते हैं, आपके जैसा खाना कोई नहीं बनाता, {elder}." } },
  { id: "te_recipe", group: "food", text: { en: "{from} tried your recipe today. It was almost as good as yours!", hi: "{from} ने आज आपकी रेसिपी बनाई. लगभग आपके जैसी बनी!" } },
  { id: "te_eat", group: "food", text: { en: "{from} hopes you ate well today. Please don't skip a meal.", hi: "{from} उम्मीद करते हैं आपने अच्छे से खाया. खाना मत छोड़िएगा." } },
  { id: "te_rest", group: "care", text: { en: "{from} says: please rest a little today, {elder}.", hi: "{from} कह रहे हैं: आज थोड़ा आराम करिए, {elder}." } },
  { id: "te_water", group: "care", text: { en: "{from} reminds you to drink a glass of water. With love.", hi: "{from} याद दिला रहे हैं — एक गिलास पानी पी लीजिए. प्यार से." } },
  { id: "te_walk", group: "care", text: { en: "{from} hopes you get a short, gentle walk today.", hi: "{from} चाहते हैं आज आप थोड़ा धीरे-धीरे टहल लें." } },
  { id: "te_meds_proud", group: "care", text: { en: "{from} saw you took your medicines. Well done, {elder}!", hi: "{from} ने देखा आपने दवा ले ली. शाबाश, {elder}!" } },
  { id: "te_gn", group: "care", text: { en: "{from} wishes you a peaceful night, {elder}. Sleep well.", hi: "{from} आपको शुभ रात्रि कह रहे हैं, {elder}. आराम से सोइए." } },
  { id: "te_gm", group: "care", text: { en: "Good morning, {elder}! {from} hopes your day is gentle and happy.", hi: "सुप्रभात, {elder}! {from} चाहते हैं आपका दिन सुकून भरा हो." } },
  { id: "te_thanks", group: "thanks", text: { en: "{from} says thank you for everything you do, {elder}.", hi: "{from} कह रहे हैं, आपने जो कुछ किया उसके लिए शुक्रिया, {elder}." } },
  { id: "te_lucky", group: "thanks", text: { en: "{from} feels so lucky to have you in their life.", hi: "{from} खुद को बहुत भाग्यशाली मानते हैं कि आप उनकी ज़िंदगी में हैं." } },
  { id: "te_advice", group: "thanks", text: { en: "{from} followed your advice today. You were right, {elder}!", hi: "{from} ने आज आपकी सलाह मानी. आप सही थीं, {elder}!" } },
  { id: "te_blessing", group: "thanks", text: { en: "{from} asks for your blessings today.", hi: "{from} आज आपका आशीर्वाद माँग रहे हैं." } },
];

export const GROUPS_FROM_ELDER: { id: string; label: Bi }[] = [
  { id: "love", label: { en: "Love", hi: "प्यार" } },
  { id: "me", label: { en: "How I am", hi: "मैं कैसी हूँ" } },
  { id: "ask", label: { en: "Ask", hi: "पूछना" } },
];

/** Elder → family */
export const FROM_ELDER: Preset[] = [
  { id: "fe_think", group: "love", text: { en: "{from} is thinking of you.", hi: "{from} आपको याद कर रही हैं." } },
  { id: "fe_love", group: "love", text: { en: "{from} says: I love you. Take care of yourself.", hi: "{from} कह रही हैं: बहुत प्यार. अपना ख़याल रखना." } },
  { id: "fe_bless", group: "love", text: { en: "{from} sends you her blessings.", hi: "{from} आपको ढेर सारा आशीर्वाद भेज रही हैं." } },
  { id: "fe_proud", group: "love", text: { en: "{from} is proud of you.", hi: "{from} को आप पर गर्व है." } },
  { id: "fe_miss", group: "love", text: { en: "{from} misses you. Come home soon.", hi: "{from} को आपकी याद आ रही है. जल्दी घर आना." } },
  { id: "fe_good", group: "me", text: { en: "{from} is feeling good today.", hi: "{from} आज अच्छा महसूस कर रही हैं." } },
  { id: "fe_ate", group: "me", text: { en: "{from} has eaten well. Don't worry.", hi: "{from} ने अच्छे से खा लिया है. चिंता मत करना." } },
  { id: "fe_walk", group: "me", text: { en: "{from} went for a little walk today.", hi: "{from} आज थोड़ा टहल कर आईं." } },
  { id: "fe_tired", group: "me", text: { en: "{from} is a little tired today and resting.", hi: "{from} आज थोड़ी थकी हैं और आराम कर रही हैं." } },
  { id: "fe_lonely", group: "me", text: { en: "{from} would love to hear your voice today.", hi: "{from} आज आपकी आवाज़ सुनना चाहती हैं." } },
  { id: "fe_call", group: "ask", text: { en: "{from} asks: please call when you're free.", hi: "{from} कह रही हैं: फ़ुर्सत में फ़ोन करना." } },
  { id: "fe_eat", group: "ask", text: { en: "{from} asks: have you eaten?", hi: "{from} पूछ रही हैं: खाना खाया?" } },
  { id: "fe_reach", group: "ask", text: { en: "{from} asks: did you reach safely?", hi: "{from} पूछ रही हैं: आराम से पहुँच गए?" } },
  { id: "fe_sleep", group: "ask", text: { en: "{from} says: don't stay up too late. Sleep on time.", hi: "{from} कह रही हैं: देर तक मत जागना. समय पर सो जाना." } },
  { id: "fe_umbrella", group: "ask", text: { en: "{from} says: carry an umbrella, it may rain.", hi: "{from} कह रही हैं: छाता ले जाना, बारिश हो सकती है." } },
];

/** Automatic updates (only those the elder agreed to share). {time} and {meal} are filled in. */
export const STATUS: Record<string, Bi> = {
  dose: { en: "{elder} took her {time} medicines. 💊", hi: "{elder} ने {time} की दवा ले ली. 💊" },
  meal: { en: "{elder} had her {meal}. 🍲", hi: "{elder} ने {meal} कर लिया. 🍲" },
  mood_great: { en: "{elder} says today is a really good day! 🌼", hi: "{elder} कह रही हैं आज का दिन बहुत अच्छा है! 🌼" },
  mood_good: { en: "{elder} is doing well today. 🌿", hi: "{elder} आज ठीक हैं. 🌿" },
  mood_okay: { en: "{elder} says today is okay.", hi: "{elder} कह रही हैं आज ठीक-ठाक है." },
  mood_low: { en: "{elder} says today is a quiet, heavy day. A call from you would mean a lot.", hi: "{elder} कह रही हैं आज का दिन थोड़ा भारी है. आपका एक फ़ोन बहुत मायने रखेगा." },
  missed: { en: "{elder} hasn't marked her {time} medicine yet, even after 3 reminders. Maybe give her a gentle call.", hi: "{elder} ने 3 बार याद दिलाने पर भी {time} की दवा चिह्नित नहीं की. एक बार प्यार से फ़ोन कर लें." },
  sos: { en: "🚨 {elder} pressed HELP. Please call her right now. {where}", hi: "🚨 {elder} ने मदद का बटन दबाया. अभी फ़ोन करें. {where}" },
  nudge: { en: "{elder} hasn't opened Asha today. Maybe give her a call?", hi: "{elder} ने आज आशा नहीं खोली. एक फ़ोन कर लें?" },
};

export const MEALS: Record<string, Bi> = {
  breakfast: { en: "breakfast", hi: "नाश्ता" },
  lunch: { en: "lunch", hi: "दोपहर का खाना" },
  snack: { en: "evening snack", hi: "शाम का नाश्ता" },
  dinner: { en: "dinner", hi: "रात का खाना" },
};

export function presetById(id: string): Preset | undefined {
  return TO_ELDER.find((p) => p.id === id) ?? FROM_ELDER.find((p) => p.id === id);
}

export function fill(t: string, vars: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] ?? "").trim()).replace(/\s+/g, " ").replace(/\s([.,!?])/g, "$1").trim();
}
