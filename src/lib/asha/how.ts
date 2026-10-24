import type { PixieMood } from "@/components/asha/pixie";
import type { Localized } from "@/lib/asha/plans";
import type { Tab } from "@/lib/asha/types";

/**
 * "Ask me how": the fairy shows how to do something by going to the right screen and pointing at the button.
 * Targets are found by their words on screen (or aria-label), so they keep working when the layout changes.
 * A target that cannot be found just shows her bubble without a spotlight.
 */
export type Find = {
  text?: { en: RegExp; hi: RegExp };
  aria?: { en: RegExp; hi: RegExp };
  tour?: string;
  nav?: Tab;
};

export type HowStep = { tab: Tab; find?: Find; line: Localized; mood: PixieMood };

export type HowTopic = { id: string; title: Localized; match: RegExp; steps: HowStep[] };

// "how do I…", "how to…", "show me how", "कैसे करूँ": asking about the app, not "how are you?"
export const HOW =
  /\bhow (do|can|should|would) (i|we|you)\b|\bhow to\b|\bshow me\b|\bteach me\b|कैसे (करूँ|करू|करें|करते|करना|होगा|लें|लूँ|डालूँ|देखूँ|बदलूँ|जोड़ूँ|लिखूँ)|कैसे .{0,20}(जोड़ूँ|बदलूँ|लिखूँ|देखूँ|लूँ)|दिखाओ|सिखाओ/i;
/** Asked for the list itself: "show me how", "what can you show me" */
export const HOW_ANY = /^(show me|teach me)( how)?\??$|what can you show|दिखाओ$|सिखाओ$/i;

export const TOPICS: HowTopic[] = [
  {
    id: "rx-photo",
    title: { en: "Read a prescription photo", hi: "पर्ची की फ़ोटो पढ़वाना" },
    match: /prescription|photo|picture|पर्ची|फ़ोटो|फोटो/i,
    steps: [
      {
        tab: "meds",
        find: { text: { en: /^Photo of prescription$/, hi: /^पर्ची की फ़ोटो लें$/ } },
        line: {
          en: "Press here and take one clear photo, in daylight, with the page lying flat. I read the names, and you tick the right ones.",
          hi: "यहाँ दबाइए और दिन की रोशनी में, पन्ना सीधा रखकर एक साफ़ फ़ोटो लीजिए. मैं नाम पढ़ूँगी, आप सही वाले चुनिए.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "change-med",
    title: { en: "Change or remove a medicine", hi: "दवा बदलना या हटाना" },
    match:
      /(change|edit|fix|remove|delete|stop).*(medicine|tablet|pill|dose|time)|(medicine|tablet|dose).*(change|time)|दवा.*(बदल|हटा)|समय.*बदल/i,
    steps: [
      {
        tab: "meds",
        find: { text: { en: /^Change$/, hi: /^बदलें$/ } },
        line: {
          en: "Press Change under the medicine to fix its name, how much, or its time. Remove stops its reminders.",
          hi: "दवा के नीचे बदलें दबाइए, उसका नाम, मात्रा या समय ठीक करने के लिए. हटाएँ से उसकी याद बंद हो जाती है.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "add-med",
    title: { en: "Add a medicine", hi: "दवा जोड़ना" },
    match: /(add|new|put).*(medicine|tablet|pill|dawa)|(medicine|tablet).*add|दवा.*जोड़|नई दवा/i,
    steps: [
      {
        tab: "meds",
        find: { text: { en: /^Add a medicine$/, hi: /^दवा जोड़ें$/ } },
        line: {
          en: "Press Add a medicine. Then write its name, how much to take, and the time. I remind you at that time.",
          hi: "दवा जोड़ें दबाइए. फिर उसका नाम, कितनी लेनी है, और समय लिखिए. उस समय मैं याद दिलाऊँगी.",
        },
        mood: "point",
      },
      {
        tab: "meds",
        find: { text: { en: /^Photo of prescription$/, hi: /^पर्ची की फ़ोटो लें$/ } },
        line: {
          en: "Or take a photo of the prescription, and I read the names for you to check.",
          hi: "या पर्ची की फ़ोटो लीजिए, मैं नाम पढ़ दूँगी, आप जाँच लीजिए.",
        },
        mood: "happy",
      },
    ],
  },
  {
    id: "taken",
    title: { en: "Mark a medicine as taken", hi: "दवा ले ली, यह बताना" },
    match: /\b(mark|tick|took|taken|done|finished)\b|ले ली|ले लिया|लेने के बाद/i,
    steps: [
      {
        tab: "today",
        find: { text: { en: /^I took it$/, hi: /^ले ली$/ }, tour: "now" },
        line: {
          en: "When a medicine is due, it shows here on Today. Press I took it, and it turns green.",
          hi: "जब दवा का समय होता है, वह यहाँ आज वाले पन्ने पर दिखती है. ले ली दबाइए, वह हरी हो जाएगी.",
        },
        mood: "point",
      },
      {
        tab: "today",
        find: { text: { en: /^Tell Asha$/, hi: /^आशा को बताएँ$/ } },
        line: {
          en: "Or press Tell Asha and just say: I took it.",
          hi: "या आशा को बताएँ दबाइए और बस बोलिए: ले ली.",
        },
        mood: "talk",
      },
    ],
  },
  {
    id: "family-add",
    title: { en: "Save a family member's number", hi: "अपनों का नंबर सहेजना" },
    match:
      /(add|save|put).*(person|number|son|daughter|family|contact|husband|wife)|नंबर.*(जोड़|सहेज|डाल)/i,
    steps: [
      {
        tab: "settings",
        find: { text: { en: /^Add a person$/, hi: /^व्यक्ति जोड़ें$/ } },
        line: {
          en: "In Settings, press Add a person, then write their name and phone number. Help calls them when you need it.",
          hi: "सेटिंग में व्यक्ति जोड़ें दबाइए, फिर उनका नाम और फ़ोन नंबर लिखिए. ज़रूरत पड़ने पर मदद उन्हें कॉल करेगी.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "call",
    title: { en: "Call my family", hi: "अपनों को कॉल करना" },
    match: /\bcall\b|\bring\b|phone|कॉल|फ़ोन|फोन/i,
    steps: [
      {
        tab: "sos",
        find: { text: { en: /^Loved ones$/, hi: /^अपने लोग$/ } },
        line: {
          en: "Your loved ones are here. Press Call under a name, and the phone rings them.",
          hi: "आपके अपने लोग यहाँ हैं. नाम के नीचे कॉल दबाइए, फ़ोन उन्हें मिला देगा.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "help",
    title: { en: "Get help in an emergency", hi: "मुसीबत में मदद लेना" },
    // spoken "help" opens Help straight away, so this one is only on the list
    match: /^$/,
    steps: [
      {
        tab: "today",
        find: { tour: "help" },
        line: {
          en: "If you feel unwell, press Help, at the top on the right. It is always there.",
          hi: "तबीयत ठीक न लगे तो ऊपर दाईं ओर मदद दबाइए. यह हमेशा वहीं रहता है.",
        },
        mood: "point",
      },
      {
        tab: "sos",
        find: { aria: { en: /^Hold for help$/, hi: /^मदद के लिए दबाकर रखें$/ } },
        line: {
          en: "Then hold this big button for two seconds. I find where you are and call your family.",
          hi: "फिर इस बड़े बटन को दो सेकंड दबाकर रखिए. मैं आपकी जगह ढूँढकर आपके अपनों को कॉल करूँगी.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "sugar",
    title: { en: "Write sugar, BP or mood", hi: "शुगर, बीपी या मन लिखना" },
    match: /sugar|pressure|\bbp\b|weight|mood|feel|शुगर|बीपी|वज़न|वजन|मन/i,
    steps: [
      {
        tab: "care",
        find: { text: { en: /^How is the body today\?$/, hi: /^आज शरीर कैसा है\?$/ } },
        line: {
          en: "On Care, write your sugar, blood pressure, or how you feel. Your doctor's report is made from it.",
          hi: "देखभाल में अपनी शुगर, बीपी, या मन कैसा है, लिखिए. डॉक्टर की रिपोर्ट इसी से बनती है.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "text-size",
    title: { en: "Make the letters bigger", hi: "अक्षर बड़े करना" },
    match: /\b(big|bigger|large|larger|size|font|letters|read)\b|अक्षर|बड़ा/i,
    steps: [
      {
        tab: "settings",
        find: { text: { en: /^Text size$/, hi: /^अक्षरों का आकार$/ } },
        line: {
          en: "In Settings, choose A plus or A plus plus here for bigger letters.",
          hi: "सेटिंग में यहाँ A+ या A++ चुनिए, अक्षर बड़े हो जाएँगे.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "language",
    title: { en: "Change the language", hi: "भाषा बदलना" },
    match: /language|hindi|english|भाषा|हिंदी|हिन्दी|अंग्रेज़ी|अंग्रेजी/i,
    steps: [
      {
        tab: "settings",
        find: { text: { en: /^Language$/, hi: /^भाषा$/ } },
        line: {
          en: "Here you choose the words on the screen, and the language I speak. They can be different.",
          hi: "यहाँ आप स्क्रीन के शब्द और मेरी बोली की भाषा चुनते हैं. दोनों अलग भी हो सकती हैं.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "family-circle",
    title: { en: "See messages from family", hi: "परिवार के संदेश देखना" },
    match: /voice note|message|family|परिवार|संदेश|मैसेज/i,
    steps: [
      {
        tab: "today",
        find: { nav: "family" },
        line: {
          en: "Press Family, at the bottom. Messages and voice notes from your family are there.",
          hi: "नीचे परिवार दबाइए. आपके परिवार के संदेश और आवाज़ें वहीं हैं.",
        },
        mood: "point",
      },
    ],
  },
  {
    id: "talk",
    title: { en: "Talk to me", hi: "मुझसे बात करना" },
    match: /\b(talk|chat|ask|question)\b|बात|पूछ/i,
    steps: [
      {
        tab: "today",
        find: { nav: "talk" },
        line: {
          en: "Press Talk, at the bottom, and ask me anything. You can type or speak.",
          hi: "नीचे बात दबाइए और मुझसे कुछ भी पूछिए. लिख भी सकते हैं, बोल भी सकते हैं.",
        },
        mood: "talk",
      },
    ],
  },
];

/** Which topic a spoken or typed "how do I…" is about, if any. */
export function howTopic(said: string) {
  return TOPICS.find((x) => x.match.test(said));
}

/** The element a step points at, if it is on screen. */
export function findTarget(find: Find | undefined, lang: "en" | "hi"): HTMLElement | null {
  if (!find) return null;
  if (find.nav) {
    const nav = document.querySelector('[data-tour="nav"]');
    const label = TAB_LABEL[find.nav]?.[lang];
    const btn = label
      ? [...(nav?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.trim() === label)
      : null;
    if (btn) return btn as HTMLElement;
  }
  if (find.aria) {
    const re = find.aria[lang];
    const el = [...document.querySelectorAll<HTMLElement>("[aria-label]")].find((e) =>
      re.test(e.getAttribute("aria-label") ?? ""),
    );
    if (el) return el;
  }
  if (find.text) {
    const re = find.text[lang];
    const el = [...document.querySelectorAll<HTMLElement>("button, h1, h2, h3, a, label")].find(
      (e) => re.test(e.textContent?.trim() ?? "") && e.offsetParent !== null,
    );
    if (el) return el;
  }
  if (find.tour) return document.querySelector<HTMLElement>(`[data-tour="${find.tour}"]`);
  return null;
}

const TAB_LABEL: Partial<Record<Tab, { en: string; hi: string }>> = {
  today: { en: "Today", hi: "आज" },
  meds: { en: "Meds", hi: "दवा" },
  care: { en: "Care", hi: "देखभाल" },
  family: { en: "Family", hi: "परिवार" },
  talk: { en: "Talk", hi: "बात" },
};
