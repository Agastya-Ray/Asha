import type { Food, Lang, Meal, MealPreset, Med } from "@/lib/asha/types";
import { speakClock } from "@/lib/asha/time";

export function person(name: string, lang: Lang) {
  const n = name.trim();
  if (n) return n;
  return lang === "hi" ? "जी" : "there";
}

export function foodSentence(food: Food, lang: Lang) {
  if (lang === "hi") {
    if (food === "before") return "इसे खाने से थोड़ा पहले लें.";
    if (food === "with") return "इसे खाने के साथ लें, खाली पेट नहीं.";
    if (food === "after") return "इसे खाना खा लेने के बाद लें.";
    return "इसे खाने के साथ या बिना, दोनों चलता है.";
  }
  if (food === "before") return "Take it a little before you eat.";
  if (food === "with") return "Take it with food, not on an empty stomach.";
  if (food === "after") return "Take it after you have eaten.";
  return "You can take it with food or without.";
}

export function doseSentence(lang: Lang, name: string, med: Med, time: string) {
  const who = person(name, lang);
  const when = speakClock(lang, time);
  const food = foodSentence(med.food, lang);
  if (lang === "hi") {
    return `${who}, ${when} हो गए हैं. ${med.name} की बारी है, ${med.dose}. ${food} ले लें, तो हरे बटन को दबा दें.`;
  }
  return `${who}, it's ${when}. Time for your ${med.name}, ${med.dose}. ${food} When you have taken it, press the green button.`;
}

const PRESET_NAME: Record<MealPreset, { en: string; hi: string }> = {
  breakfast: { en: "breakfast", hi: "नाश्ता" },
  lunch: { en: "lunch", hi: "दोपहर का खाना" },
  snack: { en: "a small snack", hi: "छोटा नाश्ता" },
  dinner: { en: "dinner", hi: "रात का खाना" },
};

const PRESET_NOTE: Record<MealPreset, { en: string; hi: string }> = {
  breakfast: {
    en: "Eat before or with morning tablets that need food.",
    hi: "जो सुबह की दवा खाने के साथ है, उसे नाश्ते के साथ लें.",
  },
  lunch: {
    en: "Vegetables first, then the rest of the plate.",
    hi: "पहले सब्ज़ी, फिर बाकी प्लेट.",
  },
  snack: {
    en: "Tea is fine if something small is with it, not only biscuits.",
    hi: "चाय चलेगी अगर साथ में कुछ छोटा हो, सिर्फ बिस्कुट नहीं.",
  },
  dinner: {
    en: "Try to finish a while before you lie down.",
    hi: "लेटकर सोने से कुछ देर पहले खाना खत्म करने की कोशिश करें.",
  },
};

export function mealTitle(meal: Meal, lang: Lang) {
  if (meal.name.trim()) return meal.name.trim();
  if (meal.preset) return PRESET_NAME[meal.preset][lang];
  return lang === "hi" ? "खाना" : "a meal";
}

export function mealNote(meal: Meal, lang: Lang) {
  if (meal.note.trim()) return meal.note.trim();
  if (meal.preset) return PRESET_NOTE[meal.preset][lang];
  return "";
}

export function mealSentence(lang: Lang, name: string, meal: Meal, time: string) {
  const who = person(name, lang);
  const when = speakClock(lang, time);
  const title = mealTitle(meal, lang);
  const note = mealNote(meal, lang);
  if (lang === "hi") {
    return `${who}, ${when} हो गए हैं. ${title} का समय है. ${note} आराम से खाएँ. खा लें तो हरे बटन को दबा दें.`;
  }
  return `${who}, it's ${when}. Time for ${title}. ${note} Eat slowly. When you finish, press the green button.`;
}

export function greeting(lang: Lang, name: string, date: Date) {
  const who = person(name, lang);
  const h = date.getHours();
  const variant = Math.floor(date.getDate()) % 3;
  if (lang === "hi") {
    if (h < 5) {
      return {
        title: `अभी रात है, ${who}.`,
        line: "अगर दिन खत्म हो गया है तो आराम करें. रात की कोई दवा बची हो तो नीचे सूची में है.",
      };
    }
    if (h < 12) {
      const lines = [
        "मैं यहाँ हूँ. एक दवा और एक खाना, बस इतना.",
        "आज हम धीरे चलेंगे.",
        "खुश हूँ कि आपने यह खोला.",
      ];
      return { title: `सुप्रभात, ${who}.`, line: lines[variant] ?? lines[0] };
    }
    if (h < 17) {
      return {
        title: `नमस्ते, ${who}.`,
        line: "दोपहर आधी हो चुकी है. जो बाकी है, वह नीचे है. जो हो चुका, उसे रहने दें.",
      };
    }
    if (h < 21) {
      return {
        title: `शुभ संध्या, ${who}.`,
        line: "शाम की दवा और रात का खाना सूची में हैं. जल्दी नहीं है.",
      };
    }
    return {
      title: `देर हो गई है, ${who}.`,
      line: "रात की गोली अगर खुली है तो नीचे है. उसके बाद रोशनी कम कर दें.",
    };
  }
  if (h < 5) {
    return {
      title: `It's late, ${who}.`,
      line: "If the day is done, rest. A night tablet still open will be on the list below.",
    };
  }
  if (h < 12) {
    const lines = [
      "I'm here. One dose and one meal at a time.",
      "We can go slowly today.",
      "I'm glad you opened this.",
    ];
    return { title: `Good morning, ${who}.`, line: lines[variant] ?? lines[0] };
  }
  if (h < 17) {
    return {
      title: `Hello, ${who}.`,
      line: "The middle of the day is here. What's left is below. What's done can stay done.",
    };
  }
  if (h < 21) {
    return {
      title: `Good evening, ${who}.`,
      line: "Evening tablets and dinner are on the list. There is no rush.",
    };
  }
  return {
    title: `It's late, ${who}.`,
    line: "If a night tablet is still open, it is below. After that, the lights can go down.",
  };
}

export function smsBody(lang: Lang, name: string) {
  const who = name.trim() || (lang === "hi" ? "मैं" : "I");
  if (lang === "hi") {
    return `${who} को अभी मदद चाहिए. कृपया फ़ोन करें या आ जाएँ. यह संदेश आशा से है.`;
  }
  return `This is ${who}. I need help right now. Please call me or come if you can. Sent from Asha.`;
}

export function againSentence(lang: Lang, name: string, title: string) {
  const who = person(name, lang);
  if (lang === "hi") return `${who}, ${title} अभी भी बाकी है. ले लें तो हरा बटन दबा दें. कोई जल्दी नहीं.`;
  return `${who}, ${title} is still waiting. When it's done, press the green button. No rush.`;
}

/** The last of the repeat reminders: a softer check-in, and (when family will be told) why. */
export function lastAgainSentence(lang: Lang, name: string, title: string, familyTold: boolean) {
  const who = person(name, lang);
  if (lang === "hi") {
    const fam = familyTold ? " अगर आपसे बात न हो पाई तो मैं परिवार को बता दूँगी, बस ताकि वे चिंता न करें." : "";
    return `${who}, मैं बस आपका हाल देख रही हूँ. ${title} अभी बाकी है. ले ली हो तो हरा बटन दबा दें.${fam}`;
  }
  const fam = familyTold ? " If I don't hear from you, I'll let your family know, just so they don't worry." : "";
  return `${who}, just checking on you. Your ${title} is still waiting. If you've taken it, press the green button.${fam}`;
}

/** Text sent to family when a medicine reminder goes unanswered. Written in the screen language. */
export function missedText(lang: Lang, name: string, medName: string, time: string) {
  const who = name.trim() || (lang === "hi" ? "आपके अपने" : "Your family member");
  if (lang === "hi") return `आशा से संदेश: ${who} ने ${speakClock(lang, time)} की ${medName} अभी तक ली हुई नहीं दिखाई है. एक बार फ़ोन कर लें.`;
  return `Message from Asha: ${who} has not marked their ${speakClock(lang, time)} ${medName} as taken yet. A quick call might help.`;
}

export function morningLine(lang: Lang, name: string) {
  const who = person(name, lang);
  if (lang === "hi") return `सुप्रभात, ${who}. नया दिन है. पानी का एक गिलास पी लें. आज की दवा और खाना मैं याद दिलाती रहूँगी.`;
  return `Good morning, ${who}. A new day. Start with a glass of water. I'll remind you about medicines and meals as the day goes.`;
}

export function nightLine(lang: Lang, name: string) {
  const who = person(name, lang);
  if (lang === "hi") return `शुभ रात्रि, ${who}. आज के लिए बस इतना. आराम से सोइए. कल सुबह मैं फिर यहीं हूँ.`;
  return `Good night, ${who}. That's enough for today. Rest well. I'll be here in the morning.`;
}

export function sosText(lang: Lang, name: string, mapLink: string) {
  const base = smsBody(lang, name);
  if (!mapLink) return base;
  return lang === "hi" ? `${base} मेरी जगह: ${mapLink}` : `${base} Where I am: ${mapLink}`;
}
