import type { ConditionId, Lang } from "@/lib/asha/types";

export type Localized = { en: string; hi: string };

export type Plan = {
  id: ConditionId;
  title: Localized;
  plain: Localized;
  plate: Localized;
  day: Localized;
  watch: Localized;
};

export const CONDITIONS: { id: ConditionId; title: Localized; blurb: Localized }[] = [
  {
    id: "arthritis",
    title: { en: "Arthritis", hi: "गठिया" },
    blurb: {
      en: "Stiff joints, especially in the morning.",
      hi: "जोड़ अकड़ते हैं, खासकर सुबह.",
    },
  },
  {
    id: "diabetes",
    title: { en: "Diabetes", hi: "मधुमेह" },
    blurb: {
      en: "Blood sugar, meals, feet, and tablets that go with food.",
      hi: "शुगर, खाना, पैर, और भोजन के साथ वाली दवा.",
    },
  },
  {
    id: "pcod",
    title: { en: "PCOD", hi: "पीसीओडी" },
    blurb: {
      en: "Cysts on the ovaries. Not the same chart as PCOS.",
      hi: "अंडाशय पर सिस्ट. पीसीओएस से अलग चार्ट.",
    },
  },
  {
    id: "pcos",
    title: { en: "PCOS", hi: "पीसीओएस" },
    blurb: {
      en: "Cycles, and often insulin, skin, or hair riding together.",
      hi: "पीरियड, और अक्सर शुगर, त्वचा या बाल एक साथ.",
    },
  },
  {
    id: "heart",
    title: { en: "After a heart attack", hi: "दिल के दौरे के बाद" },
    blurb: {
      en: "Medicines stay. Walking stays gentle. Chest pain is never 'later'.",
      hi: "दवा चलती रहती है. चलना हल्का. सीने का दर्द बाद के लिए नहीं.",
    },
  },
];

export const PLANS: Plan[] = [
  {
    id: "arthritis",
    title: { en: "Arthritis", hi: "गठिया" },
    plain: {
      en: "This is for stiff, aching joints — knees, hands, hips, or the back. Sharp pain is a stop sign, not a target. Heat can ease a joint that is stiff. Do not put heat on a joint that is hot, red, and swollen.",
      hi: "यह अकड़े, दुखते जोड़ों के लिए है — घुटने, हाथ, कूल्हे या कमर. तेज दर्द रुकने का संकेत है, लक्ष्य नहीं. अकड़े जोड़ पर गरमाहट राहत दे सकती है. जो जोड़ गर्म, लाल और सूजा हो, उस पर गर्मी न लगाएँ.",
    },
    plate: {
      en: "A warm plate is easier on sore hands: cooked vegetables, dal or egg or fish, and a small roti or a little rice. If chewing hurts, khichdi, soup, or curd is a proper meal. Turmeric in the pot is a kitchen habit, not a treatment.",
      hi: "गर्म प्लेट दुखते हाथों पर आसान है: पकी सब्ज़ी, दाल या अंडा या मछली, और छोटी रोटी या थोड़ी चावल. चबाने में दर्द हो तो खिचड़ी, सूप या दही भी पूरा खाना है. बर्तन में हल्दी रसोई की आदत है, इलाज नहीं.",
    },
    day: {
      en: "Before you stand for long, open and close the hands ten times and circle the ankles. After breakfast, a short walk on flat ground if the knees allow. Stop when pain turns sharp. A chair is not giving up.",
      hi: "देर तक खड़े होने से पहले हाथ दस बार खोलें-बंद करें और टखने घुमाएँ. नाश्ते के बाद समतल ज़मीन पर छोटी चाल, अगर घुटने अनुमति दें. दर्द तेज हो तो रुक जाएँ. कुर्सी हार नहीं है.",
    },
    watch: {
      en: "Call the doctor for a joint that is hot and red with a fever, a knee that suddenly will not hold you, or pain that is new and wakes you every night.",
      hi: "डॉक्टर को बताएँ अगर जोड़ बुखार के साथ गर्म और लाल हो, घुटना अचानक भार न सँभाले, या नया दर्द हर रात जगाए.",
    },
  },
  {
    id: "diabetes",
    title: { en: "Diabetes", hi: "मधुमेह" },
    plain: {
      en: "Tablets only work if the meals around them are steady. Many people aim for fasting sugar near 80 to 130, and under 180 two hours after food. Your doctor may want different numbers. Write those down and trust them over this screen.",
      hi: "दवा तभी साथ देती है जब आसपास का खाना नियमित हो. कई लोगों का लक्ष्य खाली पेट शुगर 80 से 130 के पास, और खाने के दो घंटे बाद 180 से कम होता है. आपके डॉक्टर के आँकड़े अलग हो सकते हैं. उन्हें लिख लें. इस स्क्रीन से ज़्यादा उन पर भरोसा करें.",
    },
    plate: {
      en: "Half the plate is vegetables that are not potato. A palm of dal, eggs, fish, chicken, or paneer. A fist of roti or rice. Fruit, whole, not juice. Sweet tea and mango juice are the usual leaks. If you take insulin or a sulfonylurea such as glimepiride, do not skip the meal.",
      hi: "आधी प्लेट ऐसी सब्ज़ी जो आलू न हो. एक हथेली दाल, अंडा, मछली, चिकन या पनीर. एक मुट्ठी रोटी या चावल. फल पूरा, जूस नहीं. मीठी चाय और आम का जूस अक्सर शुगर बढ़ाते हैं. इंसुलिन या ग्लिमेपिराइड जैसी दवा हो तो खाना न छोड़ें.",
    },
    day: {
      en: "Take the tablets the way they were written, especially the ones that belong with food. If you own a meter, check fasting and again two hours after the largest meal. Ten slow minutes of walking after meals helps, if your heart and feet allow. Tonight, look at both feet: cuts, redness, dark spots. Pain is a late messenger.",
      hi: "दवा वैसे लें जैसे लिखी गई है, खासकर जो खाने के साथ है. मीटर हो तो खाली पेट और सबसे बड़े खाने के दो घंटे बाद जाँचें. खाने के बाद दस मिनट की धीमी चाल मदद करती है, अगर दिल और पैर अनुमति दें. आज रात दोनों पैर देखें: कट, लालिमा, काले धब्बे. दर्द देर से खबर देता है.",
    },
    watch: {
      en: "Shaky, sweaty, confused, or suddenly very hungry can be low sugar. Sit. Take glucose tablets or a small glass of juice, then tell someone. Vomiting with very high sugar, or breath that smells sweet, is urgent — open Help. Also tell the doctor about sugars often under 70 or over 250, a foot wound, or vision that suddenly blurs.",
      hi: "कंपकंपी, पसीना, उलझन, या अचानक बहुत भूख — शुगर कम हो सकती है. बैठ जाएँ. ग्लूकोज या थोड़ा जूस लें, फिर किसी को बताएँ. बहुत ऊँची शुगर के साथ उल्टी, या साँस में मीठी गंध, तुरंत की बात है — मदद खोलें. डॉक्टर को बताएँ अगर शुगर अक्सर 70 से कम या 250 से ऊपर हो, पैर में घाव हो, या दृष्टि अचानक धुंधली हो.",
    },
  },
  {
    id: "pcod",
    title: { en: "PCOD", hi: "पीसीओडी" },
    plain: {
      en: "In many clinics in India, PCOD means cysts on the ovaries. It is not the same as PCOS, even though families mix the words. Asha keeps a separate page so you are not given two diets by accident.",
      hi: "भारत की कई क्लीनिकों में पीसीओडी का मतलब अंडाशय पर सिस्ट है. यह पीसीओएस नहीं है, भले शब्द घर में मिल जाएँ. आशा अलग पन्ना रखती है ताकि गलती से दो डाइट न मिलें.",
    },
    plate: {
      en: "Eat breakfast. A long gap and then a very large dinner is harder on cycles for many people. Put protein on the plate — dal, curd, eggs, paneer — and vegetables. Sugary drinks and a packet of biscuits between every meal are the habit to loosen, not your worth.",
      hi: "नाश्ता करें. लंबा अंतराल और फिर बहुत भारी रात का खाना कई लोगों के पीरियड पर भारी पड़ता है. प्लेट पर प्रोटीन रखें — दाल, दही, अंडा, पनीर — और सब्ज़ी. मीठे पेय और हर समय बिस्कुट की आदत ढीली करनी है, आपका मूल्य नहीं.",
    },
    day: {
      en: "Walk most days. Sleep at a similar hour. If you still menstruate, note the first day of bleeding in the check-in. Pain that bends you over is not 'just periods'. Write it down.",
      hi: "ज़्यादातर दिन चलें. सोने का समय मिलता-जुलता रखें. अगर माहवारी अब भी होती है, जाँच में खून के पहले दिन को लिखें. जो दर्द झुका दे, वह 'बस पीरियड' नहीं. उसे लिख लें.",
    },
    watch: {
      en: "Tell the doctor about bleeding that soaks a pad every hour, sudden severe pain low in the belly, or no period for three months when you are not pregnant and not menopausal.",
      hi: "डॉक्टर को बताएँ अगर हर घंटे पैड भीग जाए, पेट के निचले हिस्से में अचानक तेज दर्द हो, या तीन महीने तक पीरियड न हो और आप गर्भवती या रजोनिवृत्ति में न हों.",
    },
  },
  {
    id: "pcos",
    title: { en: "PCOS", hi: "पीसीओएस" },
    plain: {
      en: "PCOS is a pattern: irregular cycles, and often insulin resistance, acne, or thicker facial hair. It can sit beside blood sugar trouble. None of this is a character flaw. If you also selected PCOD, follow this plate once. You do not need two diets.",
      hi: "पीसीओएस एक पैटर्न है: अनियमित पीरियड, और अक्सर इंसुलिन की अड़चन, मुहाँसे, या चेहरे पर घने बाल. यह शुगर के साथ भी रह सकता है. यह चरित्र की कमी नहीं. अगर पीसीओडी भी चुना है, यह प्लेट एक बार अपनाएँ. दो डाइट की ज़रूरत नहीं.",
    },
    plate: {
      en: "The diabetes-style plate helps even when sugar tests are still normal: steady meals, protein, vegetables, fewer sugary drinks. You do not need a punishing tiny plate. Skipping breakfast and then craving sweets at night is the loop to step out of.",
      hi: "शुगर की रिपोर्ट सामान्य हो तब भी मधुमेह वाली प्लेट मदद करती है: नियमित खाना, प्रोटीन, सब्ज़ी, कम मीठे पेय. सज़ा जैसी छोटी प्लेट ज़रूरी नहीं. नाश्ता छोड़ना और रात को मीठा खिंचना — यही घेरा तोड़ना है.",
    },
    day: {
      en: "Sit down and stand up from a chair, ten times, plus a walk. Strength matters as much as steps. If facial hair or skin bothers you, that is a medical conversation. Note the cycle in the check-in.",
      hi: "कुर्सी पर बैठें और खड़े हों, दस बार, और एक चाल. कदमों जितनी ही ताकत मायने रखती है. चेहरे के बाल या त्वचा परेशान करे तो यह वैद्यकीय बात है. जाँच में पीरियड लिखें.",
    },
    watch: {
      en: "Talk to the doctor if you are trying to conceive, if bleeding is very heavy, or if fasting sugar is climbing. Do not start hormone tablets because a relative did.",
      hi: "डॉक्टर से बात करें अगर बच्चा चाहती हैं, खून बहुत ज़्यादा हो, या खाली पेट शुगर बढ़ रही हो. रिश्तेदार की हार्मोन दवा इसलिए शुरू न करें कि उन्हें चली थी.",
    },
  },
  {
    id: "heart",
    title: { en: "After a heart attack", hi: "दिल के दौरे के बाद" },
    plain: {
      en: "Your cardiologist's medicines and walking plan outrank this screen. Do not stop aspirin, a statin, or a blood pressure tablet because you feel fine today. If you missed a dose, do not take an extra one to catch up. Mark it skipped and tell the doctor.",
      hi: "आपके हृदय चिकित्सक की दवा और चलने की योजना इस स्क्रीन से ऊपर है. आज ठीक लगने पर एस्प्रिन, स्टैटिन या रक्तचाप की दवा न रोकें. एक खुराक छूट जाए तो पकड़ने के लिए दूसरी न लें. उसे छोड़ा हुआ चिह्नित करें और डॉक्टर को बताएँ.",
    },
    plate: {
      en: "Less salt than the rest of the house may like. Taste the food before the salt goes on. Go easy on pickles, papad, namkeen, fried snacks, and heavy ghee. Half the plate vegetables, then dal or fish or chicken, then a small roti. Fruit instead of sweets.",
      hi: "नमक घर के बाकी लोगों से कम. नमक डालने से पहले स्वाद देखें. अचार, पापड़, नमकीन, तली चीज़ें और भारी घी कम करें. आधी प्लेट सब्ज़ी, फिर दाल या मछली या चिकन, फिर छोटी रोटी. मिठाई की जगह फल.",
    },
    day: {
      en: "Walk only as far as your rehab team allowed, on flat ground. You should still be able to speak in short sentences. Chest discomfort means stop and sit. If the doctor asked you to watch fluid, weigh yourself in the morning: same scale, shoes off. About two kilos gained in two or three days, new ankle swelling, or needing more pillows to breathe is a call-the-doctor day.",
      hi: "उतना ही चलें जितना रिहैब टीम ने कहा हो, समतल ज़मीन पर. छोटी वाक्य में बोल पाना बाकी रहना चाहिए. सीने में बेचैनी हो तो रुकें और बैठें. डॉक्टर ने पानी की निगरानी कही हो तो सुबह वज़न लें: वही तराज़ू, जूते उतारकर. दो-तीन दिन में करीब दो किलो बढ़ना, टखनों में नई सूजन, या साँस के लिए ज़्यादा तकियों की ज़रूरत — उसी दिन डॉक्टर को फ़ोन.",
    },
    watch: {
      en: "Not later: pressure in the chest, pain into the arm, neck, or jaw, cold sweat, nausea with that pressure, or breath you cannot catch. Open Help and call. Chew an aspirin only if your own doctor already told you to do that for chest pain. Asha will not invent that dose. Also report dizziness on a new tablet, a new cough after a new medicine, or a pulse that feels very slow.",
      hi: "बाद में नहीं: सीने में दबाव, दर्द बाँह, गर्दन या जबड़े तक, ठंडा पसीना, उस दबाव के साथ मतली, या साँस जो पकड़ में न आए. मदद खोलें और कॉल करें. एस्प्रिन तभी चबाएँ जब आपके अपने डॉक्टर ने सीने के दर्द के लिए पहले से कहा हो. आशा यह खुराक गढ़ेगी नहीं. नई दवा पर चक्कर, नई दवा के बाद नई खाँसी, या बहुत धीमी नाड़ी भी बताएँ.",
    },
  },
];

export function planById(id: ConditionId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function text(block: Localized, lang: Lang) {
  return block[lang];
}

const PLATE_LINE: Record<ConditionId, Localized> = {
  heart: {
    en: "Today's plate: vegetables first, little salt, a small roti. Fruit if you want something sweet.",
    hi: "आज की प्लेट: पहले सब्ज़ी, कम नमक, छोटी रोटी. मीठा चाहें तो फल.",
  },
  diabetes: {
    en: "Today's plate: half vegetables, a palm of protein, a fist of roti or rice. No juice.",
    hi: "आज की प्लेट: आधी सब्ज़ी, एक हथेली प्रोटीन, एक मुट्ठी रोटी या चावल. जूस नहीं.",
  },
  pcos: {
    en: "Today's plate: do not skip breakfast. Protein and vegetables. Sweets are not a personality test.",
    hi: "आज की प्लेट: नाश्ता न छोड़ें. प्रोटीन और सब्ज़ी. मिठाई कोई परीक्षा नहीं.",
  },
  pcod: {
    en: "Today's plate: breakfast, then protein and vegetables. A long empty gap makes the evening harder.",
    hi: "आज की प्लेट: नाश्ता, फिर प्रोटीन और सब्ज़ी. लंबा खाली अंतराल शाम को भारी करता है.",
  },
  arthritis: {
    en: "Today's plate: warm food you can chew without a fight. A soft meal still counts.",
    hi: "आज की प्लेट: गर्म खाना जिसे चबाना लड़ाई न हो. नरम भोजन भी गिनती में है.",
  },
};

const ORDER: ConditionId[] = ["heart", "diabetes", "pcos", "pcod", "arthritis"];

export function plateLine(conditions: ConditionId[], lang: Lang) {
  const id = ORDER.find((c) => conditions.includes(c));
  if (!id) {
    return lang === "hi"
      ? "जब कोई बीमारी चुनी जाएगी, यहाँ प्लेट की एक पंक्ति आएगी."
      : "When a condition is chosen, one line about the plate shows up here.";
  }
  return text(PLATE_LINE[id], lang);
}
