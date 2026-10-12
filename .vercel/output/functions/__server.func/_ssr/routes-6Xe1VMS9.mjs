import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Pill, c as MessageSquare, d as HeartPulse, f as Droplets, i as Settings, l as MessageCircle, o as Phone, r as Sun, s as Mic, t as Volume2, u as Leaf } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { a as CartesianGrid, i as Line, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as LineChart } from "../_libs/recharts+[...].mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-6Xe1VMS9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var styles = {
	primary: "bg-sage text-paper",
	quiet: "border border-line bg-paper text-ink",
	sos: "bg-sos text-paper",
	ghost: "bg-transparent text-ink"
};
function Button({ variant = "primary", className, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn("inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-lg font-bold transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50", styles[variant], className),
		...props
	});
}
var CONDITIONS = [
	{
		id: "arthritis",
		title: {
			en: "Arthritis",
			hi: "गठिया"
		},
		blurb: {
			en: "Stiff joints, especially in the morning.",
			hi: "जोड़ अकड़ते हैं, खासकर सुबह."
		}
	},
	{
		id: "diabetes",
		title: {
			en: "Diabetes",
			hi: "मधुमेह"
		},
		blurb: {
			en: "Blood sugar, meals, feet, and tablets that go with food.",
			hi: "शुगर, खाना, पैर, और भोजन के साथ वाली दवा."
		}
	},
	{
		id: "pcod",
		title: {
			en: "PCOD",
			hi: "पीसीओडी"
		},
		blurb: {
			en: "Cysts on the ovaries. Not the same chart as PCOS.",
			hi: "अंडाशय पर सिस्ट. पीसीओएस से अलग चार्ट."
		}
	},
	{
		id: "pcos",
		title: {
			en: "PCOS",
			hi: "पीसीओएस"
		},
		blurb: {
			en: "Cycles, and often insulin, skin, or hair riding together.",
			hi: "पीरियड, और अक्सर शुगर, त्वचा या बाल एक साथ."
		}
	},
	{
		id: "heart",
		title: {
			en: "After a heart attack",
			hi: "दिल के दौरे के बाद"
		},
		blurb: {
			en: "Medicines stay. Walking stays gentle. Chest pain is never 'later'.",
			hi: "दवा चलती रहती है. चलना हल्का. सीने का दर्द बाद के लिए नहीं."
		}
	}
];
var PLANS = [
	{
		id: "arthritis",
		title: {
			en: "Arthritis",
			hi: "गठिया"
		},
		plain: {
			en: "This is for stiff, aching joints — knees, hands, hips, or the back. Sharp pain is a stop sign, not a target. Heat can ease a joint that is stiff. Do not put heat on a joint that is hot, red, and swollen.",
			hi: "यह अकड़े, दुखते जोड़ों के लिए है — घुटने, हाथ, कूल्हे या कमर. तेज दर्द रुकने का संकेत है, लक्ष्य नहीं. अकड़े जोड़ पर गरमाहट राहत दे सकती है. जो जोड़ गर्म, लाल और सूजा हो, उस पर गर्मी न लगाएँ."
		},
		plate: {
			en: "A warm plate is easier on sore hands: cooked vegetables, dal or egg or fish, and a small roti or a little rice. If chewing hurts, khichdi, soup, or curd is a proper meal. Turmeric in the pot is a kitchen habit, not a treatment.",
			hi: "गर्म प्लेट दुखते हाथों पर आसान है: पकी सब्ज़ी, दाल या अंडा या मछली, और छोटी रोटी या थोड़ी चावल. चबाने में दर्द हो तो खिचड़ी, सूप या दही भी पूरा खाना है. बर्तन में हल्दी रसोई की आदत है, इलाज नहीं."
		},
		day: {
			en: "Before you stand for long, open and close the hands ten times and circle the ankles. After breakfast, a short walk on flat ground if the knees allow. Stop when pain turns sharp. A chair is not giving up.",
			hi: "देर तक खड़े होने से पहले हाथ दस बार खोलें-बंद करें और टखने घुमाएँ. नाश्ते के बाद समतल ज़मीन पर छोटी चाल, अगर घुटने अनुमति दें. दर्द तेज हो तो रुक जाएँ. कुर्सी हार नहीं है."
		},
		watch: {
			en: "Call the doctor for a joint that is hot and red with a fever, a knee that suddenly will not hold you, or pain that is new and wakes you every night.",
			hi: "डॉक्टर को बताएँ अगर जोड़ बुखार के साथ गर्म और लाल हो, घुटना अचानक भार न सँभाले, या नया दर्द हर रात जगाए."
		}
	},
	{
		id: "diabetes",
		title: {
			en: "Diabetes",
			hi: "मधुमेह"
		},
		plain: {
			en: "Tablets only work if the meals around them are steady. Many people aim for fasting sugar near 80 to 130, and under 180 two hours after food. Your doctor may want different numbers. Write those down and trust them over this screen.",
			hi: "दवा तभी साथ देती है जब आसपास का खाना नियमित हो. कई लोगों का लक्ष्य खाली पेट शुगर 80 से 130 के पास, और खाने के दो घंटे बाद 180 से कम होता है. आपके डॉक्टर के आँकड़े अलग हो सकते हैं. उन्हें लिख लें. इस स्क्रीन से ज़्यादा उन पर भरोसा करें."
		},
		plate: {
			en: "Half the plate is vegetables that are not potato. A palm of dal, eggs, fish, chicken, or paneer. A fist of roti or rice. Fruit, whole, not juice. Sweet tea and mango juice are the usual leaks. If you take insulin or a sulfonylurea such as glimepiride, do not skip the meal.",
			hi: "आधी प्लेट ऐसी सब्ज़ी जो आलू न हो. एक हथेली दाल, अंडा, मछली, चिकन या पनीर. एक मुट्ठी रोटी या चावल. फल पूरा, जूस नहीं. मीठी चाय और आम का जूस अक्सर शुगर बढ़ाते हैं. इंसुलिन या ग्लिमेपिराइड जैसी दवा हो तो खाना न छोड़ें."
		},
		day: {
			en: "Take the tablets the way they were written, especially the ones that belong with food. If you own a meter, check fasting and again two hours after the largest meal. Ten slow minutes of walking after meals helps, if your heart and feet allow. Tonight, look at both feet: cuts, redness, dark spots. Pain is a late messenger.",
			hi: "दवा वैसे लें जैसे लिखी गई है, खासकर जो खाने के साथ है. मीटर हो तो खाली पेट और सबसे बड़े खाने के दो घंटे बाद जाँचें. खाने के बाद दस मिनट की धीमी चाल मदद करती है, अगर दिल और पैर अनुमति दें. आज रात दोनों पैर देखें: कट, लालिमा, काले धब्बे. दर्द देर से खबर देता है."
		},
		watch: {
			en: "Shaky, sweaty, confused, or suddenly very hungry can be low sugar. Sit. Take glucose tablets or a small glass of juice, then tell someone. Vomiting with very high sugar, or breath that smells sweet, is urgent — open Help. Also tell the doctor about sugars often under 70 or over 250, a foot wound, or vision that suddenly blurs.",
			hi: "कंपकंपी, पसीना, उलझन, या अचानक बहुत भूख — शुगर कम हो सकती है. बैठ जाएँ. ग्लूकोज या थोड़ा जूस लें, फिर किसी को बताएँ. बहुत ऊँची शुगर के साथ उल्टी, या साँस में मीठी गंध, तुरंत की बात है — मदद खोलें. डॉक्टर को बताएँ अगर शुगर अक्सर 70 से कम या 250 से ऊपर हो, पैर में घाव हो, या दृष्टि अचानक धुंधली हो."
		}
	},
	{
		id: "pcod",
		title: {
			en: "PCOD",
			hi: "पीसीओडी"
		},
		plain: {
			en: "In many clinics in India, PCOD means cysts on the ovaries. It is not the same as PCOS, even though families mix the words. Asha keeps a separate page so you are not given two diets by accident.",
			hi: "भारत की कई क्लीनिकों में पीसीओडी का मतलब अंडाशय पर सिस्ट है. यह पीसीओएस नहीं है, भले शब्द घर में मिल जाएँ. आशा अलग पन्ना रखती है ताकि गलती से दो डाइट न मिलें."
		},
		plate: {
			en: "Eat breakfast. A long gap and then a very large dinner is harder on cycles for many people. Put protein on the plate — dal, curd, eggs, paneer — and vegetables. Sugary drinks and a packet of biscuits between every meal are the habit to loosen, not your worth.",
			hi: "नाश्ता करें. लंबा अंतराल और फिर बहुत भारी रात का खाना कई लोगों के पीरियड पर भारी पड़ता है. प्लेट पर प्रोटीन रखें — दाल, दही, अंडा, पनीर — और सब्ज़ी. मीठे पेय और हर समय बिस्कुट की आदत ढीली करनी है, आपका मूल्य नहीं."
		},
		day: {
			en: "Walk most days. Sleep at a similar hour. If you still menstruate, note the first day of bleeding in the check-in. Pain that bends you over is not 'just periods'. Write it down.",
			hi: "ज़्यादातर दिन चलें. सोने का समय मिलता-जुलता रखें. अगर माहवारी अब भी होती है, जाँच में खून के पहले दिन को लिखें. जो दर्द झुका दे, वह 'बस पीरियड' नहीं. उसे लिख लें."
		},
		watch: {
			en: "Tell the doctor about bleeding that soaks a pad every hour, sudden severe pain low in the belly, or no period for three months when you are not pregnant and not menopausal.",
			hi: "डॉक्टर को बताएँ अगर हर घंटे पैड भीग जाए, पेट के निचले हिस्से में अचानक तेज दर्द हो, या तीन महीने तक पीरियड न हो और आप गर्भवती या रजोनिवृत्ति में न हों."
		}
	},
	{
		id: "pcos",
		title: {
			en: "PCOS",
			hi: "पीसीओएस"
		},
		plain: {
			en: "PCOS is a pattern: irregular cycles, and often insulin resistance, acne, or thicker facial hair. It can sit beside blood sugar trouble. None of this is a character flaw. If you also selected PCOD, follow this plate once. You do not need two diets.",
			hi: "पीसीओएस एक पैटर्न है: अनियमित पीरियड, और अक्सर इंसुलिन की अड़चन, मुहाँसे, या चेहरे पर घने बाल. यह शुगर के साथ भी रह सकता है. यह चरित्र की कमी नहीं. अगर पीसीओडी भी चुना है, यह प्लेट एक बार अपनाएँ. दो डाइट की ज़रूरत नहीं."
		},
		plate: {
			en: "The diabetes-style plate helps even when sugar tests are still normal: steady meals, protein, vegetables, fewer sugary drinks. You do not need a punishing tiny plate. Skipping breakfast and then craving sweets at night is the loop to step out of.",
			hi: "शुगर की रिपोर्ट सामान्य हो तब भी मधुमेह वाली प्लेट मदद करती है: नियमित खाना, प्रोटीन, सब्ज़ी, कम मीठे पेय. सज़ा जैसी छोटी प्लेट ज़रूरी नहीं. नाश्ता छोड़ना और रात को मीठा खिंचना — यही घेरा तोड़ना है."
		},
		day: {
			en: "Sit down and stand up from a chair, ten times, plus a walk. Strength matters as much as steps. If facial hair or skin bothers you, that is a medical conversation. Note the cycle in the check-in.",
			hi: "कुर्सी पर बैठें और खड़े हों, दस बार, और एक चाल. कदमों जितनी ही ताकत मायने रखती है. चेहरे के बाल या त्वचा परेशान करे तो यह वैद्यकीय बात है. जाँच में पीरियड लिखें."
		},
		watch: {
			en: "Talk to the doctor if you are trying to conceive, if bleeding is very heavy, or if fasting sugar is climbing. Do not start hormone tablets because a relative did.",
			hi: "डॉक्टर से बात करें अगर बच्चा चाहती हैं, खून बहुत ज़्यादा हो, या खाली पेट शुगर बढ़ रही हो. रिश्तेदार की हार्मोन दवा इसलिए शुरू न करें कि उन्हें चली थी."
		}
	},
	{
		id: "heart",
		title: {
			en: "After a heart attack",
			hi: "दिल के दौरे के बाद"
		},
		plain: {
			en: "Your cardiologist's medicines and walking plan outrank this screen. Do not stop aspirin, a statin, or a blood pressure tablet because you feel fine today. If you missed a dose, do not take an extra one to catch up. Mark it skipped and tell the doctor.",
			hi: "आपके हृदय चिकित्सक की दवा और चलने की योजना इस स्क्रीन से ऊपर है. आज ठीक लगने पर एस्प्रिन, स्टैटिन या रक्तचाप की दवा न रोकें. एक खुराक छूट जाए तो पकड़ने के लिए दूसरी न लें. उसे छोड़ा हुआ चिह्नित करें और डॉक्टर को बताएँ."
		},
		plate: {
			en: "Less salt than the rest of the house may like. Taste the food before the salt goes on. Go easy on pickles, papad, namkeen, fried snacks, and heavy ghee. Half the plate vegetables, then dal or fish or chicken, then a small roti. Fruit instead of sweets.",
			hi: "नमक घर के बाकी लोगों से कम. नमक डालने से पहले स्वाद देखें. अचार, पापड़, नमकीन, तली चीज़ें और भारी घी कम करें. आधी प्लेट सब्ज़ी, फिर दाल या मछली या चिकन, फिर छोटी रोटी. मिठाई की जगह फल."
		},
		day: {
			en: "Walk only as far as your rehab team allowed, on flat ground. You should still be able to speak in short sentences. Chest discomfort means stop and sit. If the doctor asked you to watch fluid, weigh yourself in the morning: same scale, shoes off. About two kilos gained in two or three days, new ankle swelling, or needing more pillows to breathe is a call-the-doctor day.",
			hi: "उतना ही चलें जितना रिहैब टीम ने कहा हो, समतल ज़मीन पर. छोटी वाक्य में बोल पाना बाकी रहना चाहिए. सीने में बेचैनी हो तो रुकें और बैठें. डॉक्टर ने पानी की निगरानी कही हो तो सुबह वज़न लें: वही तराज़ू, जूते उतारकर. दो-तीन दिन में करीब दो किलो बढ़ना, टखनों में नई सूजन, या साँस के लिए ज़्यादा तकियों की ज़रूरत — उसी दिन डॉक्टर को फ़ोन."
		},
		watch: {
			en: "Not later: pressure in the chest, pain into the arm, neck, or jaw, cold sweat, nausea with that pressure, or breath you cannot catch. Open Help and call. Chew an aspirin only if your own doctor already told you to do that for chest pain. Asha will not invent that dose. Also report dizziness on a new tablet, a new cough after a new medicine, or a pulse that feels very slow.",
			hi: "बाद में नहीं: सीने में दबाव, दर्द बाँह, गर्दन या जबड़े तक, ठंडा पसीना, उस दबाव के साथ मतली, या साँस जो पकड़ में न आए. मदद खोलें और कॉल करें. एस्प्रिन तभी चबाएँ जब आपके अपने डॉक्टर ने सीने के दर्द के लिए पहले से कहा हो. आशा यह खुराक गढ़ेगी नहीं. नई दवा पर चक्कर, नई दवा के बाद नई खाँसी, या बहुत धीमी नाड़ी भी बताएँ."
		}
	}
];
function planById(id) {
	return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
function text(block, lang) {
	return block[lang];
}
var PLATE_LINE = {
	heart: {
		en: "Today's plate: vegetables first, little salt, a small roti. Fruit if you want something sweet.",
		hi: "आज की प्लेट: पहले सब्ज़ी, कम नमक, छोटी रोटी. मीठा चाहें तो फल."
	},
	diabetes: {
		en: "Today's plate: half vegetables, a palm of protein, a fist of roti or rice. No juice.",
		hi: "आज की प्लेट: आधी सब्ज़ी, एक हथेली प्रोटीन, एक मुट्ठी रोटी या चावल. जूस नहीं."
	},
	pcos: {
		en: "Today's plate: do not skip breakfast. Protein and vegetables. Sweets are not a personality test.",
		hi: "आज की प्लेट: नाश्ता न छोड़ें. प्रोटीन और सब्ज़ी. मिठाई कोई परीक्षा नहीं."
	},
	pcod: {
		en: "Today's plate: breakfast, then protein and vegetables. A long empty gap makes the evening harder.",
		hi: "आज की प्लेट: नाश्ता, फिर प्रोटीन और सब्ज़ी. लंबा खाली अंतराल शाम को भारी करता है."
	},
	arthritis: {
		en: "Today's plate: warm food you can chew without a fight. A soft meal still counts.",
		hi: "आज की प्लेट: गर्म खाना जिसे चबाना लड़ाई न हो. नरम भोजन भी गिनती में है."
	}
};
var ORDER = [
	"heart",
	"diabetes",
	"pcos",
	"pcod",
	"arthritis"
];
function plateLine(conditions, lang) {
	const id = ORDER.find((c) => conditions.includes(c));
	if (!id) return lang === "hi" ? "जब कोई बीमारी चुनी जाएगी, यहाँ प्लेट की एक पंक्ति आएगी." : "When a condition is chosen, one line about the plate shows up here.";
	return text(PLATE_LINE[id], lang);
}
function todayKey(d = /* @__PURE__ */ new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shiftDay(days, from = /* @__PURE__ */ new Date()) {
	const d = new Date(from);
	d.setDate(d.getDate() - days);
	return todayKey(d);
}
function toMin(hhmm) {
	const [h, m] = hhmm.split(":").map(Number);
	if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
	return h * 60 + m;
}
function minutesNow(d = /* @__PURE__ */ new Date()) {
	return d.getHours() * 60 + d.getMinutes();
}
function padTime(h, m) {
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function normTime(raw) {
	const m = raw.trim().match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
	if (!m) return null;
	let h = Number(m[1]);
	const min = Number(m[2]);
	const ap = m[3]?.toLowerCase();
	if (ap === "pm" && h < 12) h += 12;
	if (ap === "am" && h === 12) h = 0;
	if (h > 23 || min > 59) return null;
	return padTime(h, min);
}
var EN_HOURS = [
	"twelve",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven"
];
var HI_HOURS = [
	"बारह",
	"एक",
	"दो",
	"तीन",
	"चार",
	"पाँच",
	"छह",
	"सात",
	"आठ",
	"नौ",
	"दस",
	"ग्यारह"
];
function speakClock(lang, hhmm) {
	const [hRaw, mRaw] = hhmm.split(":").map(Number);
	const h = hRaw ?? 0;
	const m = mRaw ?? 0;
	const h12 = h % 12;
	if (lang === "hi") {
		const p = h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 21 ? "शाम" : "रात";
		const min = m === 0 ? "" : m === 30 ? " तीस" : ` ${m}`;
		return `${p} ${HI_HOURS[h12]} बजे${min}`;
	}
	const p = h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
	const min = m === 0 ? "" : m === 30 ? " thirty" : ` ${String(m).padStart(2, "0")}`;
	return `${EN_HOURS[h12]}${min} in the ${p}`;
}
function clockLabel(lang, d = /* @__PURE__ */ new Date()) {
	return d.toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-US", {
		hour: "numeric",
		minute: "2-digit"
	});
}
function dateLabel(lang, d = /* @__PURE__ */ new Date()) {
	return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long"
	});
}
function shortWeekday(day, lang) {
	const [y, m, d] = day.split("-").map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", { weekday: "short" });
}
function person(name, lang) {
	const n = name.trim();
	if (n) return n;
	return lang === "hi" ? "जी" : "there";
}
function foodSentence(food, lang) {
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
function doseSentence(lang, name, med, time) {
	const who = person(name, lang);
	const when = speakClock(lang, time);
	const food = foodSentence(med.food, lang);
	if (lang === "hi") return `${who}, ${when} हो गए हैं. ${med.name} की बारी है, ${med.dose}. ${food} ले लें, तो हरे बटन को दबा दें.`;
	return `${who}, it's ${when}. Time for your ${med.name}, ${med.dose}. ${food} When you have taken it, press the green button.`;
}
var PRESET_NAME = {
	breakfast: {
		en: "breakfast",
		hi: "नाश्ता"
	},
	lunch: {
		en: "lunch",
		hi: "दोपहर का खाना"
	},
	snack: {
		en: "a small snack",
		hi: "छोटा नाश्ता"
	},
	dinner: {
		en: "dinner",
		hi: "रात का खाना"
	}
};
var PRESET_NOTE = {
	breakfast: {
		en: "Eat before or with morning tablets that need food.",
		hi: "जो सुबह की दवा खाने के साथ है, उसे नाश्ते के साथ लें."
	},
	lunch: {
		en: "Vegetables first, then the rest of the plate.",
		hi: "पहले सब्ज़ी, फिर बाकी प्लेट."
	},
	snack: {
		en: "Tea is fine if something small is with it, not only biscuits.",
		hi: "चाय चलेगी अगर साथ में कुछ छोटा हो, सिर्फ बिस्कुट नहीं."
	},
	dinner: {
		en: "Try to finish a while before you lie down.",
		hi: "लेटकर सोने से कुछ देर पहले खाना खत्म करने की कोशिश करें."
	}
};
function mealTitle(meal, lang) {
	if (meal.name.trim()) return meal.name.trim();
	if (meal.preset) return PRESET_NAME[meal.preset][lang];
	return lang === "hi" ? "खाना" : "a meal";
}
function mealNote(meal, lang) {
	if (meal.note.trim()) return meal.note.trim();
	if (meal.preset) return PRESET_NOTE[meal.preset][lang];
	return "";
}
function mealSentence(lang, name, meal, time) {
	const who = person(name, lang);
	const when = speakClock(lang, time);
	const title = mealTitle(meal, lang);
	const note = mealNote(meal, lang);
	if (lang === "hi") return `${who}, ${when} हो गए हैं. ${title} का समय है. ${note} आराम से खाएँ. खा लें तो हरे बटन को दबा दें.`;
	return `${who}, it's ${when}. Time for ${title}. ${note} Eat slowly. When you finish, press the green button.`;
}
function greeting(lang, name, date) {
	const who = person(name, lang);
	const h = date.getHours();
	const variant = Math.floor(date.getDate()) % 3;
	if (lang === "hi") {
		if (h < 5) return {
			title: `अभी रात है, ${who}.`,
			line: "अगर दिन खत्म हो गया है तो आराम करें. रात की कोई दवा बची हो तो नीचे सूची में है."
		};
		if (h < 12) {
			const lines = [
				"मैं यहाँ हूँ. एक दवा और एक खाना, बस इतना.",
				"आज हम धीरे चलेंगे.",
				"खुश हूँ कि आपने यह खोला."
			];
			return {
				title: `सुप्रभात, ${who}.`,
				line: lines[variant] ?? lines[0]
			};
		}
		if (h < 17) return {
			title: `नमस्ते, ${who}.`,
			line: "दोपहर आधी हो चुकी है. जो बाकी है, वह नीचे है. जो हो चुका, उसे रहने दें."
		};
		if (h < 21) return {
			title: `शुभ संध्या, ${who}.`,
			line: "शाम की दवा और रात का खाना सूची में हैं. जल्दी नहीं है."
		};
		return {
			title: `देर हो गई है, ${who}.`,
			line: "रात की गोली अगर खुली है तो नीचे है. उसके बाद रोशनी कम कर दें."
		};
	}
	if (h < 5) return {
		title: `It's late, ${who}.`,
		line: "If the day is done, rest. A night tablet still open will be on the list below."
	};
	if (h < 12) {
		const lines = [
			"I'm here. One dose and one meal at a time.",
			"We can go slowly today.",
			"I'm glad you opened this."
		];
		return {
			title: `Good morning, ${who}.`,
			line: lines[variant] ?? lines[0]
		};
	}
	if (h < 17) return {
		title: `Hello, ${who}.`,
		line: "The middle of the day is here. What's left is below. What's done can stay done."
	};
	if (h < 21) return {
		title: `Good evening, ${who}.`,
		line: "Evening tablets and dinner are on the list. There is no rush."
	};
	return {
		title: `It's late, ${who}.`,
		line: "If a night tablet is still open, it is below. After that, the lights can go down."
	};
}
function smsBody(lang, name) {
	const who = name.trim() || (lang === "hi" ? "मैं" : "I");
	if (lang === "hi") return `${who} को अभी मदद चाहिए. कृपया फ़ोन करें या आ जाएँ. यह संदेश आशा से है.`;
	return `This is ${who}. I need help right now. Please call me or come if you can. Sent from Asha.`;
}
function defaultMeals() {
	return [
		{
			id: "breakfast",
			preset: "breakfast",
			name: "",
			time: "08:00",
			note: ""
		},
		{
			id: "lunch",
			preset: "lunch",
			name: "",
			time: "13:00",
			note: ""
		},
		{
			id: "snack",
			preset: "snack",
			name: "",
			time: "16:30",
			note: ""
		},
		{
			id: "dinner",
			preset: "dinner",
			name: "",
			time: "19:30",
			note: ""
		}
	];
}
function buildAgenda(state, now = /* @__PURE__ */ new Date()) {
	const day = todayKey(now);
	const nowMin = minutesNow(now);
	const nowMs = now.getTime();
	const items = [];
	for (const med of state.meds) for (const time of med.times) {
		const key = `${day}|med|${med.id}|${time}`;
		const log = state.doseLogs.find((l) => l.day === day && l.medId === med.id && l.time === time);
		const snoozeUntil = state.snooze[key];
		const minutes = toMin(time);
		let agendaState = "later";
		if (log?.status === "taken") agendaState = "taken";
		else if (log?.status === "skipped") agendaState = "skipped";
		else if (snoozeUntil && snoozeUntil > nowMs) agendaState = "snoozed";
		else if (nowMin >= minutes) agendaState = nowMin - minutes <= 45 ? "now" : "open";
		items.push({
			key,
			kind: "med",
			id: med.id,
			time,
			minutes,
			title: med.name,
			detail: `${med.dose}${med.note ? ` · ${med.note}` : ""}`,
			sentence: doseSentence(state.lang, state.name, med, time),
			state: agendaState
		});
	}
	for (const meal of state.meals) {
		const key = `${day}|meal|${meal.id}|${meal.time}`;
		const done = state.mealLogs.some((l) => l.day === day && l.mealId === meal.id);
		const snoozeUntil = state.snooze[key];
		const minutes = toMin(meal.time);
		let agendaState = "later";
		if (done) agendaState = "taken";
		else if (snoozeUntil && snoozeUntil > nowMs) agendaState = "snoozed";
		else if (nowMin >= minutes) agendaState = nowMin - minutes <= 45 ? "now" : "open";
		const note = mealNote(meal, state.lang);
		items.push({
			key,
			kind: "meal",
			id: meal.id,
			time: meal.time,
			minutes,
			title: mealTitle(meal, state.lang),
			detail: note,
			sentence: mealSentence(state.lang, state.name, meal, meal.time),
			state: agendaState
		});
	}
	const rank = {
		now: 0,
		snoozed: 1,
		open: 2,
		later: 3,
		taken: 4,
		skipped: 5
	};
	return items.sort((a, b) => rank[a.state] - rank[b.state] || a.minutes - b.minutes);
}
function shouldSpeak(item, reminded, snooze, now = /* @__PURE__ */ new Date()) {
	if (reminded.includes(item.key)) return false;
	const late = minutesNow(now) - item.minutes;
	const until = snooze[item.key];
	if (item.state === "now" && late >= 0 && late <= 45) return true;
	if (item.state === "now" && until && until <= now.getTime() && late <= 180) return true;
	return false;
}
function todayCheckin(checkins, now = /* @__PURE__ */ new Date()) {
	return checkins.find((c) => c.day === todayKey(now));
}
function doseProgress(meds, logs, now = /* @__PURE__ */ new Date()) {
	const day = todayKey(now);
	let total = 0;
	let marked = 0;
	for (const med of meds) for (const time of med.times) {
		total += 1;
		if (logs.find((l) => l.day === day && l.medId === med.id && l.time === time)) marked += 1;
	}
	return {
		total,
		marked
	};
}
function telHref(phone) {
	return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
function smsHref(phone, body) {
	return `sms:${phone.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(body)}`;
}
function digits(phone) {
	return phone.replace(/\D/g, "");
}
function emptyCheckin(day) {
	return {
		day,
		water: 0
	};
}
var KEY = "asha.v1";
var initialPersist = () => ({
	onboarded: false,
	setupStep: 1,
	name: "",
	lang: "en",
	conditions: [],
	contacts: [],
	emergencyNumber: "",
	meds: [],
	meals: defaultMeals(),
	doseLogs: [],
	mealLogs: [],
	checkins: [],
	pro: false,
	voiceOn: true,
	richVoice: true,
	speakOnOpen: true,
	keepAwake: false,
	reminded: [],
	snooze: {},
	coachDismissed: false,
	sample: false,
	chat: []
});
function uid() {
	return crypto.randomUUID();
}
function prune(p) {
	const keepDays = /* @__PURE__ */ new Set([todayKey(), shiftDay(1)]);
	const reminded = p.reminded.filter((k) => [...keepDays].some((d) => k.startsWith(d)));
	const snooze = {};
	const now = Date.now();
	for (const [k, until] of Object.entries(p.snooze)) if (until > now - 108e5) snooze[k] = until;
	return {
		...p,
		reminded,
		snooze,
		doseLogs: p.doseLogs.slice(-400),
		mealLogs: p.mealLogs.slice(-400),
		checkins: p.checkins.slice(-120),
		chat: p.chat.slice(-24)
	};
}
function snapshot(s) {
	const base = initialPersist();
	const out = { ...base };
	Object.keys(base).forEach((k) => {
		out[k] = s[k];
	});
	return prune(out);
}
function sanitize(raw) {
	const base = initialPersist();
	if (!raw || typeof raw !== "object") return base;
	const r = raw;
	return {
		...base,
		...r,
		lang: r.lang === "hi" ? "hi" : "en",
		conditions: Array.isArray(r.conditions) ? r.conditions.filter(Boolean) : [],
		contacts: Array.isArray(r.contacts) ? r.contacts : [],
		meds: Array.isArray(r.meds) ? r.meds : [],
		meals: Array.isArray(r.meals) && r.meals.length ? r.meals : defaultMeals(),
		doseLogs: Array.isArray(r.doseLogs) ? r.doseLogs : [],
		mealLogs: Array.isArray(r.mealLogs) ? r.mealLogs : [],
		checkins: Array.isArray(r.checkins) ? r.checkins : [],
		reminded: Array.isArray(r.reminded) ? r.reminded : [],
		snooze: r.snooze && typeof r.snooze === "object" ? r.snooze : {},
		chat: Array.isArray(r.chat) ? r.chat : [],
		setupStep: r.setupStep === 2 || r.setupStep === 3 || r.setupStep === 4 ? r.setupStep : 1
	};
}
var useAsha = create((set) => ({
	...initialPersist(),
	hydrated: false,
	tab: "today",
	returnTab: "today",
	hydrate: () => {
		if (typeof window === "undefined") return;
		try {
			const raw = localStorage.getItem(KEY);
			set({
				...raw ? sanitize(JSON.parse(raw)) : initialPersist(),
				hydrated: true
			});
		} catch {
			set({ hydrated: true });
		}
	},
	setTab: (tab) => set({ tab }),
	openSettings: () => set((s) => ({
		returnTab: s.tab === "settings" ? s.returnTab : s.tab,
		tab: "settings"
	})),
	closeSettings: () => set((s) => ({ tab: s.returnTab })),
	setLang: (lang) => set({ lang }),
	setName: (name) => set({ name }),
	toggleCondition: (id) => set((s) => ({ conditions: s.conditions.includes(id) ? s.conditions.filter((c) => c !== id) : [...s.conditions, id] })),
	setConditions: (ids) => set({ conditions: ids }),
	setSetupStep: (setupStep) => set({ setupStep }),
	upsertContact: (contact) => set((s) => ({ contacts: s.contacts.some((c) => c.id === contact.id) ? s.contacts.map((c) => c.id === contact.id ? contact : c) : [...s.contacts, contact] })),
	removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
	setEmergency: (emergencyNumber) => set({ emergencyNumber }),
	setContacts: (contacts) => set({ contacts }),
	saveMed: (med) => set((s) => ({ meds: s.meds.some((m) => m.id === med.id) ? s.meds.map((m) => m.id === med.id ? med : m) : [...s.meds, med] })),
	removeMed: (id) => set((s) => ({ meds: s.meds.filter((m) => m.id !== id) })),
	saveMeds: (meds) => set((s) => ({ meds: [...s.meds, ...meds] })),
	updateMeal: (id, patch) => set((s) => ({ meals: s.meals.map((m) => m.id === id ? {
		...m,
		...patch
	} : m) })),
	logDose: (medId, time, status) => set((s) => {
		const day = todayKey();
		const prev = s.doseLogs.find((l) => l.day === day && l.medId === medId && l.time === time);
		const doseLogs = [...s.doseLogs.filter((l) => !(l.day === day && l.medId === medId && l.time === time)), {
			medId,
			time,
			day,
			status
		}];
		let meds = s.meds;
		if (status === "taken" && prev?.status !== "taken") meds = s.meds.map((m) => m.id === medId && m.pillsLeft !== null ? {
			...m,
			pillsLeft: Math.max(0, m.pillsLeft - 1)
		} : m);
		return {
			doseLogs,
			meds
		};
	}),
	undoDose: (medId, time) => set((s) => {
		const day = todayKey();
		const prev = s.doseLogs.find((l) => l.day === day && l.medId === medId && l.time === time);
		const doseLogs = s.doseLogs.filter((l) => !(l.day === day && l.medId === medId && l.time === time));
		let meds = s.meds;
		if (prev?.status === "taken") meds = s.meds.map((m) => m.id === medId && m.pillsLeft !== null ? {
			...m,
			pillsLeft: m.pillsLeft + 1
		} : m);
		return {
			doseLogs,
			meds
		};
	}),
	logMeal: (mealId) => set((s) => {
		const day = todayKey();
		if (s.mealLogs.some((l) => l.day === day && l.mealId === mealId)) return {};
		return { mealLogs: [...s.mealLogs, {
			mealId,
			day
		}] };
	}),
	undoMeal: (mealId) => set((s) => {
		const day = todayKey();
		return { mealLogs: s.mealLogs.filter((l) => !(l.day === day && l.mealId === mealId)) };
	}),
	snoozeKey: (key, minutes) => set((s) => ({
		snooze: {
			...s.snooze,
			[key]: Date.now() + minutes * 60 * 1e3
		},
		reminded: s.reminded.filter((k) => k !== key)
	})),
	markReminded: (keys) => set((s) => ({ reminded: [.../* @__PURE__ */ new Set([...s.reminded, ...keys])] })),
	patchCheckin: (patch) => set((s) => {
		const day = todayKey();
		const current = s.checkins.find((c) => c.day === day) ?? emptyCheckin(day);
		const next = {
			...current,
			...patch,
			day,
			water: patch.water ?? current.water
		};
		return { checkins: [...s.checkins.filter((c) => c.day !== day), next] };
	}),
	addWater: () => set((s) => {
		const day = todayKey();
		const current = s.checkins.find((c) => c.day === day) ?? emptyCheckin(day);
		const next = {
			...current,
			water: Math.min(12, current.water + 1)
		};
		return { checkins: [...s.checkins.filter((c) => c.day !== day), next] };
	}),
	setPrefs: (patch) => set(patch),
	pushChat: (turn) => set((s) => ({ chat: [...s.chat, turn].slice(-24) })),
	dismissCoach: () => set({ coachDismissed: true }),
	finishSetup: () => set({
		onboarded: true,
		setupStep: 4,
		sample: false
	}),
	loadSample: () => set(sampleDay()),
	eraseAll: () => set({
		...initialPersist(),
		hydrated: true,
		tab: "today"
	})
}));
function sampleDay() {
	const now = /* @__PURE__ */ new Date();
	const nowMin = now.getHours() * 60 + now.getMinutes();
	const meds = [{
		id: "med-metformin",
		name: "Metformin",
		dose: "500 mg",
		times: ["08:00", "20:00"],
		food: "with",
		note: "With breakfast and dinner. Do not double a missed dose.",
		pillsLeft: 6
	}, {
		id: "med-calcium",
		name: "Calcium",
		dose: "500 mg",
		times: ["13:00"],
		food: "after",
		note: "After lunch.",
		pillsLeft: 24
	}];
	const doseLogs = meds.flatMap((med) => med.times.filter((time) => toMinSafe(time) + 60 < nowMin).map((time) => ({
		medId: med.id,
		time,
		day: todayKey(now),
		status: "taken"
	})));
	const meals = defaultMeals();
	const mealLogs = meals.filter((meal) => toMinSafe(meal.time) + 60 < nowMin).map((meal) => ({
		mealId: meal.id,
		day: todayKey(now)
	}));
	const checkins = [
		6,
		5,
		4,
		3,
		2,
		1
	].map((ago, i) => ({
		day: shiftDay(ago, now),
		fastingSugar: [
			118,
			126,
			121,
			134,
			117,
			129
		][i],
		afterSugar: [
			156,
			164,
			149,
			172,
			158,
			151
		][i],
		bpSys: [
			128,
			132,
			126,
			130,
			124,
			129
		][i],
		bpDia: [
			78,
			82,
			76,
			80,
			77,
			79
		][i],
		pain: [
			4,
			5,
			3,
			4,
			6,
			4
		][i],
		mood: [
			3,
			3,
			4,
			2,
			3,
			4
		][i],
		water: 5
	}));
	return {
		...initialPersist(),
		hydrated: true,
		onboarded: true,
		setupStep: 4,
		name: "Meena",
		lang: "en",
		conditions: ["diabetes", "arthritis"],
		contacts: [{
			id: "sample-priya",
			name: "Priya",
			relation: "Daughter",
			phone: ""
		}],
		emergencyNumber: "",
		meds,
		meals,
		doseLogs,
		mealLogs,
		checkins,
		sample: true,
		coachDismissed: false,
		tab: "today"
	};
}
function toMinSafe(hhmm) {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}
if (typeof window !== "undefined") useAsha.subscribe((state) => {
	if (!state.hydrated) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(snapshot(state)));
	} catch {}
});
function newId() {
	return uid();
}
function blankMed() {
	return {
		id: newId(),
		name: "",
		dose: "",
		times: ["08:00"],
		food: "with",
		note: "",
		pillsLeft: null
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var speakRich = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("1c12516e6ed800c1268366585cbba5e8083b963261a38c314758d2ca238202e9"));
var askAsha = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("2f45280120028b4f5e785cdea01809261b0c23c267026d3dac8941335c26da35"));
var readPrescription = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("b802de9a7d086f1680cb610387354b868f89b3a1980073daed767e9454b794fc"));
var SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
var useSpeech = create(() => ({
	active: false,
	lastSaid: "",
	source: null,
	failed: false
}));
var audio = null;
var unlocked = false;
var cache = /* @__PURE__ */ new Map();
function setSpeech(patch) {
	useSpeech.setState(patch);
}
function unlockAudio() {
	if (unlocked || typeof window === "undefined") return;
	unlocked = true;
	const primer = new Audio(SILENCE);
	primer.volume = .01;
	primer.play().catch(() => {
		unlocked = false;
	});
}
var generation = 0;
function stopSpeaking() {
	generation += 1;
	audio?.pause();
	audio = null;
	if (typeof window !== "undefined") window.speechSynthesis?.cancel();
	setSpeech({ active: false });
}
function capAllows() {
	try {
		const raw = localStorage.getItem("asha.tts");
		const parsed = raw ? JSON.parse(raw) : {
			day: todayKey(),
			n: 0
		};
		if (parsed.day !== todayKey()) return true;
		return parsed.n < 24;
	} catch {
		return true;
	}
}
function markCap() {
	try {
		const day = todayKey();
		const raw = localStorage.getItem("asha.tts");
		const parsed = raw ? JSON.parse(raw) : {
			day,
			n: 0
		};
		const n = parsed.day === day ? parsed.n + 1 : 1;
		localStorage.setItem("asha.tts", JSON.stringify({
			day,
			n
		}));
	} catch {}
}
async function loadClip(text, lang) {
	const key = `${lang}|${text}`;
	const hit = cache.get(key);
	if (hit) return hit;
	if (!capAllows()) throw new Error("cap");
	const res = await speakRich({ data: {
		text: text.slice(0, 700),
		language: lang === "hi" ? "hi" : "en"
	} });
	if (!res.ok || !res.audio) throw new Error(res.ok ? "empty" : res.error);
	markCap();
	cache.set(key, res.audio);
	return res.audio;
}
function pickVoice(lang) {
	const voices = window.speechSynthesis?.getVoices?.() ?? [];
	const score = (v) => {
		const n = `${v.name} ${v.lang}`.toLowerCase();
		let s = 0;
		if (lang === "hi" && (n.includes("hi-in") || n.includes("hindi") || n.includes("hi_"))) s += 6;
		if (lang === "en" && (n.includes("en-in") || n.includes("en_in"))) s += 5;
		if (n.includes("en-gb") || n.includes("english female") || n.includes("female")) s += 2;
		if (n.includes("google")) s += 1;
		return s;
	};
	return [...voices].sort((a, b) => score(b) - score(a))[0];
}
function speakDevice(text, lang, mine) {
	return new Promise((resolve) => {
		if (typeof window === "undefined" || !window.speechSynthesis) {
			if (mine === generation) setSpeech({
				active: false,
				failed: true,
				source: "phone"
			});
			resolve();
			return;
		}
		const utter = new SpeechSynthesisUtterance(text);
		utter.lang = lang === "hi" ? "hi-IN" : "en-IN";
		utter.rate = .92;
		utter.pitch = 1;
		const voice = pickVoice(lang);
		if (voice) utter.voice = voice;
		utter.onend = () => {
			if (mine === generation) setSpeech({ active: false });
			resolve();
		};
		utter.onerror = () => {
			if (mine === generation) setSpeech({
				active: false,
				failed: true
			});
			resolve();
		};
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(utter);
		if (mine === generation) setSpeech({
			active: true,
			lastSaid: text,
			source: "phone",
			failed: false
		});
	});
}
async function speak(text, lang, prefer) {
	const clean = text.replace(/\s+/g, " ").trim();
	if (!clean) return;
	const mine = ++generation;
	audio?.pause();
	audio = null;
	if (typeof window !== "undefined") window.speechSynthesis?.cancel();
	setSpeech({
		active: true,
		lastSaid: clean,
		failed: false,
		source: null
	});
	if (prefer === "warm") try {
		const b64 = await loadClip(clean, lang);
		if (mine !== generation) return;
		const next = new Audio(`data:audio/mpeg;base64,${b64}`);
		audio = next;
		next.onended = () => {
			if (audio === next) setSpeech({ active: false });
		};
		await next.play();
		if (mine !== generation) {
			next.pause();
			return;
		}
		setSpeech({
			active: true,
			source: "warm",
			failed: false,
			lastSaid: clean
		});
		return;
	} catch {
		if (mine !== generation) return;
	}
	if (mine !== generation) return;
	await speakDevice(clean, lang, mine);
}
function useNow() {
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 3e4);
		return () => window.clearInterval(id);
	}, []);
	return now;
}
function t(lang, copy) {
	return text(copy, lang);
}
function Card({ className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: cn("rounded-3xl border border-line bg-paper p-4", className),
		children
	});
}
function Hear({ text: line, label }) {
	const lang = useAsha((s) => s.lang);
	const voiceOn = useAsha((s) => s.voiceOn);
	const rich = useAsha((s) => s.richVoice);
	if (!voiceOn) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => void speak(line, lang, rich ? "warm" : "device"),
		className: "inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-linen px-4 text-base font-bold text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
			className: "size-5",
			"aria-hidden": true
		}), label]
	});
}
function FieldLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: "mb-2 block text-lg font-bold text-ink",
		children
	});
}
function Choice({ selected, onClick, title, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-pressed": selected,
		className: cn("w-full rounded-2xl border px-4 py-3 text-left transition-transform duration-150 active:scale-[0.96]", selected ? "border-sage bg-sage-soft" : "border-line bg-paper"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-lg font-bold",
			children: title
		}), detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-base text-quiet",
			children: detail
		}) : null]
	});
}
var MOODS = [
	{
		n: 1,
		en: "Hard day",
		hi: "भारी दिन"
	},
	{
		n: 2,
		en: "Quiet",
		hi: "शांत"
	},
	{
		n: 3,
		en: "Okay",
		hi: "ठीक"
	},
	{
		n: 4,
		en: "Good",
		hi: "अच्छा"
	},
	{
		n: 5,
		en: "Really good",
		hi: "बहुत अच्छा"
	}
];
function CareScreen() {
	const lang = useAsha((s) => s.lang);
	const conditions = useAsha((s) => s.conditions);
	const meals = useAsha((s) => s.meals);
	const updateMeal = useAsha((s) => s.updateMeal);
	const checkins = useAsha((s) => s.checkins);
	const patch = useAsha((s) => s.patchCheckin);
	const checkin = todayCheckin(checkins);
	const [saved, setSaved] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const metrics = [];
	if (conditions.includes("diabetes")) metrics.push("sugar");
	if (conditions.includes("heart") || conditions.includes("diabetes")) metrics.push("bp");
	if (conditions.includes("arthritis")) metrics.push("pain");
	metrics.push("mood");
	const [metric, setMetric] = (0, import_react.useState)(metrics[0] ?? "mood");
	const activeMetric = metrics.includes(metric) ? metric : metrics[0];
	const rows = [...checkins].sort((a, b) => a.day.localeCompare(b.day)).slice(-7).map((c) => ({
		day: c.day,
		label: shortWeekday(c.day, lang),
		fasting: c.fastingSugar ?? null,
		after: c.afterSugar ?? null,
		bp: c.bpSys ?? null,
		pain: c.pain ?? null,
		mood: c.mood ?? null
	}));
	function saveNumber(key, raw, min, max) {
		const trimmed = raw.trim();
		if (!trimmed) {
			patch({ [key]: void 0 });
			setError("");
			setSaved(t(lang, {
				en: "Saved for today.",
				hi: "आज के लिए सहेजा."
			}));
			return;
		}
		const n = Number(trimmed);
		if (!Number.isFinite(n) || n < min || n > max) {
			setSaved("");
			setError(t(lang, {
				en: "That number looks unlikely. Check it, or leave it blank.",
				hi: "यह आँकड़ा अटपटा है. जाँचें, या खाली छोड़ दें."
			}));
			return;
		}
		patch({ [key]: n });
		setError("");
		setSaved(t(lang, {
			en: "Saved for today.",
			hi: "आज के लिए सहेजा."
		}));
	}
	const both = conditions.includes("pcod") && conditions.includes("pcos");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl",
				children: t(lang, {
					en: "Care",
					hi: "देखभाल"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "Meal times, a short check-in, then the chart. Open a condition to read the plate. This is general care, not your doctor's order.",
					hi: "खाने का समय, छोटी जाँच, फिर चार्ट. प्लेट पढ़ने के लिए बीमारी खोलें. यह सामान्य देखभाल है, डॉक्टर का आदेश नहीं."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-2xl font-bold",
				children: t(lang, {
					en: "Meal times",
					hi: "खाने का समय"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-base text-quiet",
				children: t(lang, {
					en: "Change a time and Today follows it.",
					hi: "समय बदलें और आज वाला पन्ना उसी पर चलेगा."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-3",
				children: meals.map((meal) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold capitalize",
						children: mealTitle(meal, lang)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-base text-quiet",
						children: mealNote(meal, lang)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "time",
						className: "field mt-3",
						value: meal.time,
						onChange: (e) => updateMeal(meal.id, { time: e.target.value })
					})
				] }, meal.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-2xl font-bold",
				children: t(lang, {
					en: "How is the body today?",
					hi: "आज शरीर कैसा है?"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
						en: "Mood",
						hi: "मन"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-2",
						children: MOODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": checkin?.mood === m.n,
							onClick: () => {
								patch({ mood: m.n });
								setSaved(t(lang, {
									en: "Saved for today.",
									hi: "आज के लिए सहेजा."
								}));
							},
							className: `min-h-12 rounded-2xl border px-4 text-left text-lg font-bold ${checkin?.mood === m.n ? "border-sage bg-sage-soft" : "border-line"}`,
							children: lang === "hi" ? m.hi : m.en
						}, m.n))
					}),
					conditions.includes("diabetes") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: t(lang, {
								en: "Fasting sugar",
								hi: "खाली पेट शुगर"
							}),
							placeholder: "110",
							initial: checkin?.fastingSugar,
							onCommit: (v) => saveNumber("fastingSugar", v, 40, 500)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: t(lang, {
								en: "After a meal",
								hi: "खाने के बाद"
							}),
							placeholder: "160",
							initial: checkin?.afterSugar,
							onCommit: (v) => saveNumber("afterSugar", v, 40, 500)
						})]
					}) : null,
					conditions.includes("arthritis") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
							en: "Pain, 0 is none and 10 is worst",
							hi: "दर्द, 0 नहीं और 10 सबसे ज़्यादा"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-6 gap-2",
							children: Array.from({ length: 11 }, (_, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": checkin?.pain === n,
								onClick: () => {
									patch({ pain: n });
									setSaved(t(lang, {
										en: "Saved for today.",
										hi: "आज के लिए सहेजा."
									}));
								},
								className: `min-h-12 rounded-xl border text-lg font-bold ${checkin?.pain === n ? "border-sage bg-sage text-paper" : "border-line bg-linen"}`,
								children: n
							}, n))
						})]
					}) : null,
					conditions.includes("heart") || conditions.includes("diabetes") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: t(lang, {
								en: "Blood pressure, top",
								hi: "रक्तचाप, ऊपर"
							}),
							placeholder: "128",
							initial: checkin?.bpSys,
							onCommit: (v) => saveNumber("bpSys", v, 70, 220)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: t(lang, {
								en: "Blood pressure, bottom",
								hi: "रक्तचाप, नीचे"
							}),
							placeholder: "80",
							initial: checkin?.bpDia,
							onCommit: (v) => saveNumber("bpDia", v, 40, 140)
						})]
					}) : null,
					conditions.includes("heart") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
								label: t(lang, {
									en: "Morning weight, kg",
									hi: "सुबह का वज़न, किलो"
								}),
								placeholder: "62",
								initial: checkin?.weightKg,
								onCommit: (v) => saveNumber("weightKg", v, 30, 200)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
								en: "New swelling in the ankles?",
								hi: "टखनों में नई सूजन?"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: checkin?.swelling === true ? "primary" : "quiet",
									onClick: () => patch({ swelling: true }),
									children: t(lang, {
										en: "Yes",
										hi: "हाँ"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: checkin?.swelling === false ? "primary" : "quiet",
									onClick: () => patch({ swelling: false }),
									children: t(lang, {
										en: "No",
										hi: "नहीं"
									})
								})]
							})
						]
					}) : null,
					conditions.includes("pcod") || conditions.includes("pcos") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
							en: "Cycle note",
							hi: "पीरियड का नोट"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							defaultValue: checkin?.cycleNote ?? "",
							placeholder: t(lang, {
								en: "Started today / not today",
								hi: "आज शुरू / आज नहीं"
							}),
							onBlur: (e) => patch({ cycleNote: e.target.value.slice(0, 120) })
						})]
					}) : null,
					saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-lg font-bold text-sage",
						children: saved
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-lg text-clay",
						children: error
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-2xl font-bold",
				children: t(lang, {
					en: "The last seven days",
					hi: "पिछले सात दिन"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: metrics.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setMetric(id),
					className: `min-h-12 rounded-full px-4 text-base font-bold ${activeMetric === id ? "bg-sage text-paper" : "border border-line bg-paper"}`,
					children: id === "sugar" ? t(lang, {
						en: "Sugar",
						hi: "शुगर"
					}) : id === "bp" ? t(lang, {
						en: "Blood pressure",
						hi: "रक्तचाप"
					}) : id === "pain" ? t(lang, {
						en: "Pain",
						hi: "दर्द"
					}) : t(lang, {
						en: "Mood",
						hi: "मन"
					})
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mt-3",
				children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg",
					children: t(lang, {
						en: "Nothing saved yet. The first check-in starts the line.",
						hi: "अभी कुछ सहेजा नहीं. पहली जाँच से रेखा शुरू होगी."
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-56 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: rows,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--color-line)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "label",
									tick: {
										fill: "var(--color-quiet)",
										fontSize: 14
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									width: 40,
									tick: {
										fill: "var(--color-quiet)",
										fontSize: 14
									},
									domain: activeMetric === "pain" || activeMetric === "mood" ? [0, activeMetric === "mood" ? 5 : 10] : ["auto", "auto"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--color-paper)",
									border: "1px solid var(--color-line)",
									borderRadius: 12,
									color: "var(--color-ink)"
								} }),
								activeMetric === "sugar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "fasting",
									name: t(lang, {
										en: "Fasting",
										hi: "खाली पेट"
									}),
									stroke: "var(--color-sage)",
									strokeWidth: 3,
									dot: { r: 4 },
									connectNulls: true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "after",
									name: t(lang, {
										en: "After food",
										hi: "खाने के बाद"
									}),
									stroke: "var(--color-clay)",
									strokeWidth: 3,
									dot: { r: 4 },
									connectNulls: true
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: activeMetric === "bp" ? "bp" : activeMetric,
									name: activeMetric,
									stroke: "var(--color-sage)",
									strokeWidth: 3,
									dot: { r: 4 },
									connectNulls: true
								})
							]
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-base text-quiet",
					children: activeMetric === "sugar" ? `${t(lang, {
						en: "Fasting this week:",
						hi: "इस हफ्ते खाली पेट:"
					})} ${rows.map((r) => r.fasting ?? "—").join(", ")}` : activeMetric === "bp" ? `${t(lang, {
						en: "Top number this week:",
						hi: "इस हफ्ते ऊपर का आँकड़ा:"
					})} ${rows.map((r) => r.bp ?? "—").join(", ")}` : activeMetric === "pain" ? `${t(lang, {
						en: "Pain this week:",
						hi: "इस हफ्ते दर्द:"
					})} ${rows.map((r) => r.pain ?? "—").join(", ")}` : `${t(lang, {
						en: "Mood this week, 1 is hard and 5 is light:",
						hi: "इस हफ्ते मन, 1 भारी और 5 हल्का:"
					})} ${rows.map((r) => r.mood ?? "—").join(", ")}`
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-2xl font-bold",
				children: t(lang, {
					en: "The plate and the day",
					hi: "प्लेट और दिन"
				})
			}),
			both ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg",
				children: t(lang, {
					en: "You selected both PCOD and PCOS. Follow the PCOS plate once. You do not need two diets.",
					hi: "आपने पीसीओडी और पीसीओएस दोनों चुने हैं. पीसीओएस की प्लेट एक बार अपनाएँ. दो डाइट की ज़रूरत नहीं."
				})
			}) : null,
			conditions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "Choose a condition in Settings and a specific page will open here.",
					hi: "सेटिंग में बीमारी चुनें, तब यहाँ उसका पन्ना खुलेगा."
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: conditions.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanBlock, { id }, id))
			})
		]
	});
}
function Num({ label, placeholder, initial, onCommit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: "field",
		inputMode: "decimal",
		placeholder,
		defaultValue: initial ?? "",
		onBlur: (e) => onCommit(e.target.value)
	})] });
}
function PlanBlock({ id }) {
	const lang = useAsha((s) => s.lang);
	const plan = planById(id);
	const known = CONDITIONS.find((c) => c.id === id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "border-b border-line py-3",
		open: id === "heart" || id === "diabetes",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
			className: "min-h-12 cursor-pointer text-xl font-bold",
			children: known ? text(known.title, lang) : id
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 space-y-3 text-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: text(plan.plain, lang) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold",
					children: t(lang, {
						en: "Plate. ",
						hi: "प्लेट. "
					})
				}), text(plan.plate, lang)] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold",
					children: t(lang, {
						en: "Day. ",
						hi: "दिन. "
					})
				}), text(plan.day, lang)] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold",
					children: t(lang, {
						en: "Tell the doctor. ",
						hi: "डॉक्टर को बताएँ. "
					})
				}), text(plan.watch, lang)] })
			]
		})]
	});
}
async function tick() {
	const s = useAsha.getState();
	if (!s.hydrated || !s.onboarded || !s.voiceOn) return;
	if (useSpeech.getState().active) return;
	const next = buildAgenda(s).find((item) => shouldSpeak(item, s.reminded, s.snooze));
	if (!next) return;
	s.markReminded([next.key]);
	if (typeof Notification !== "undefined" && Notification.permission === "granted") try {
		new Notification("Asha", {
			body: next.sentence,
			silent: true
		});
	} catch {}
	await speak(next.sentence, s.lang, s.richVoice ? "warm" : "device");
}
function ReminderEngine() {
	const hydrated = useAsha((s) => s.hydrated);
	const onboarded = useAsha((s) => s.onboarded);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		let wake = null;
		const syncWake = async () => {
			const s = useAsha.getState();
			if (!s.keepAwake || !s.onboarded || !("wakeLock" in navigator)) {
				await wake?.release().catch(() => void 0);
				wake = null;
				return;
			}
			try {
				wake = await navigator.wakeLock.request("screen");
			} catch {
				wake = null;
			}
		};
		syncWake();
		const onVis = () => {
			if (document.visibilityState === "visible") {
				syncWake();
				tick();
			}
		};
		document.addEventListener("visibilitychange", onVis);
		const unsub = useAsha.subscribe((state, prev) => {
			if (state.keepAwake !== prev.keepAwake) syncWake();
		});
		const id = window.setInterval(() => void tick(), 15e3);
		const greetTimer = window.setTimeout(() => {
			const s = useAsha.getState();
			if (!s.onboarded || !s.voiceOn || !s.speakOnOpen) return;
			if (buildAgenda(s).some((item) => shouldSpeak(item, s.reminded, s.snooze))) {
				tick();
				return;
			}
			const g = greeting(s.lang, s.name, /* @__PURE__ */ new Date());
			speak(`${g.title} ${g.line}`, s.lang, "device");
		}, 800);
		return () => {
			window.clearInterval(id);
			window.clearTimeout(greetTimer);
			document.removeEventListener("visibilitychange", onVis);
			unsub();
			wake?.release().catch(() => void 0);
		};
	}, [hydrated, onboarded]);
	return null;
}
var FOODS = [
	"before",
	"with",
	"after",
	"anytime"
];
function foodLabel(food, lang) {
	return t(lang, {
		before: {
			en: "Before food",
			hi: "खाने से पहले"
		},
		with: {
			en: "With food",
			hi: "खाने के साथ"
		},
		after: {
			en: "After food",
			hi: "खाने के बाद"
		},
		anytime: {
			en: "With or without",
			hi: "खाने से फर्क नहीं"
		}
	}[food]);
}
function MedEditor({ initial, submitLabel, onSave, onCancel }) {
	const lang = useAsha((s) => s.lang);
	const saveMed = useAsha((s) => s.saveMed);
	const [med, setMed] = (0, import_react.useState)(initial);
	const [hint, setHint] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
			en: "Medicine name",
			hi: "दवा का नाम"
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "field",
			value: med.name,
			onChange: (e) => setMed({
				...med,
				name: e.target.value
			}),
			placeholder: t(lang, {
				en: "Metformin",
				hi: "मेटफॉर्मिन"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
				en: "How much",
				hi: "कितनी"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				value: med.dose,
				onChange: (e) => setMed({
					...med,
					dose: e.target.value
				}),
				placeholder: t(lang, {
					en: "1 tablet, 500 mg",
					hi: "1 गोली, 500 mg"
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
					en: "Times",
					hi: "समय"
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-2",
					children: med.times.map((time, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							className: "field",
							value: time,
							onChange: (e) => {
								const times = med.times.slice();
								times[index] = e.target.value;
								setMed({
									...med,
									times
								});
							}
						}), med.times.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-14 shrink-0 rounded-2xl border border-line px-4 font-bold",
							onClick: () => setMed({
								...med,
								times: med.times.filter((_, i) => i !== index)
							}),
							children: t(lang, {
								en: "Remove",
								hi: "हटाएँ"
							})
						}) : null]
					}, `${time}-${index}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-2 min-h-12 font-bold text-sage",
					onClick: () => setMed({
						...med,
						times: [...med.times, "20:00"]
					}),
					children: t(lang, {
						en: "Add another time",
						hi: "एक और समय"
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
				en: "Food",
				hi: "खाना"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2",
				children: FOODS.map((food) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": med.food === food,
					onClick: () => setMed({
						...med,
						food
					}),
					className: `min-h-12 rounded-2xl border px-3 text-base font-bold ${med.food === food ? "border-sage bg-sage-soft" : "border-line bg-linen"}`,
					children: foodLabel(food, lang)
				}, food))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
				en: "Note, if you want",
				hi: "नोट, अगर चाहें"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				value: med.note,
				onChange: (e) => setMed({
					...med,
					note: e.target.value
				}),
				placeholder: t(lang, {
					en: "With breakfast",
					hi: "नाश्ते के साथ"
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
					en: "Tablets left at home, optional",
					hi: "घर में बची गोलियाँ, वैकल्पिक"
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					inputMode: "numeric",
					value: med.pillsLeft ?? "",
					placeholder: t(lang, {
						en: "Leave blank to skip",
						hi: "छोड़ना हो तो खाली रखें"
					}),
					onChange: (e) => {
						const raw = e.target.value.trim();
						setMed({
							...med,
							pillsLeft: raw === "" ? null : Number(raw)
						});
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-base text-quiet",
					children: t(lang, {
						en: "Asha mentions a refill when 7 or fewer are left.",
						hi: "7 या कम बचें तो आशा रिफिल कहेगी."
					})
				})
			]
		}),
		hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-lg text-clay",
			children: hint
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 flex flex-col gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => {
					if (!med.name.trim()) {
						setHint(t(lang, {
							en: "The name is the part that matters. Type it.",
							hi: "नाम ज़रूरी है. उसे लिखें."
						}));
						return;
					}
					if (!med.dose.trim()) {
						setHint(t(lang, {
							en: "Add how much. Even '1 tablet' is enough.",
							hi: "कितनी है यह लिखें. '1 गोली' भी काफ़ी है."
						}));
						return;
					}
					const times = med.times.filter(Boolean);
					if (!times.length) {
						setHint(t(lang, {
							en: "Add at least one time.",
							hi: "कम से कम एक समय डालें."
						}));
						return;
					}
					saveMed({
						...med,
						name: med.name.trim(),
						dose: med.dose.trim(),
						times,
						pillsLeft: med.pillsLeft !== null && Number.isFinite(med.pillsLeft) ? Math.max(0, Math.round(med.pillsLeft)) : null
					});
					onSave();
				},
				children: submitLabel
			}), onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "quiet",
				onClick: onCancel,
				children: t(lang, {
					en: "Cancel",
					hi: "रद्द"
				})
			}) : null]
		})
	] });
}
async function fileToJpeg(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas");
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", .72);
}
function MedsScreen() {
	const lang = useAsha((s) => s.lang);
	const meds = useAsha((s) => s.meds);
	const removeMed = useAsha((s) => s.removeMed);
	const saveMeds = useAsha((s) => s.saveMeds);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [reading, setReading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [drafts, setDrafts] = (0, import_react.useState)(null);
	const [caution, setCaution] = (0, import_react.useState)("");
	const fileRef = (0, import_react.useRef)(null);
	async function onFile(file) {
		setError("");
		setReading(true);
		setDrafts(null);
		try {
			const res = await readPrescription({ data: { image: await fileToJpeg(file) } });
			if (!res.ok) {
				setError(res.error);
				return;
			}
			const next = res.medicines.map((m) => {
				const times = m.times.map((raw) => normTime(raw)).filter((x) => Boolean(x));
				const food = [
					"before",
					"with",
					"after",
					"anytime"
				].find((f) => f === m.food) ?? "anytime";
				return {
					id: newId(),
					name: m.name,
					dose: m.dose || (lang === "hi" ? "खुराक लिखें" : "Add the dose"),
					times: times.length ? times : ["08:00"],
					food,
					note: m.note,
					pillsLeft: null,
					keep: true
				};
			});
			setCaution(res.caution);
			if (!next.length) {
				setError(t(lang, {
					en: "No medicine names were clear. Type them, or take the photo again in daylight.",
					hi: "कोई नाम साफ़ नहीं दिखा. उन्हें लिखें, या दिन की रोशनी में फिर फ़ोटो लें."
				}));
				return;
			}
			setDrafts(next);
		} catch {
			setError(t(lang, {
				en: "That photo did not open. Try a JPG, or take the picture again.",
				hi: "वह फ़ोटो नहीं खुली. JPG आज़माएँ, या फिर से फ़ोटो लें."
			}));
		} finally {
			setReading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl",
				children: t(lang, {
					en: "Medicines",
					hi: "दवाइयाँ"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "Green on Today means taken. If a name looks wrong, change it here. A photo can misread handwriting, so you confirm every name.",
					hi: "आज वाले पन्ने पर हरा मतलब ले ली. नाम गलत लगे तो यहीं बदलें. फ़ोटो लिखावट गलत पढ़ सकती है, इसलिए हर नाम आप पक्का करते हैं."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex flex-col gap-3",
				children: meds.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg",
					children: t(lang, {
						en: "No medicines yet. Add one, or photograph the prescription.",
						hi: "अभी कोई दवा नहीं. एक जोड़ें, या पर्ची की फ़ोटो लें."
					})
				}) }) : meds.map((med) => editing === med.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MedEditor, {
					initial: med,
					submitLabel: t(lang, {
						en: "Save changes",
						hi: "बदलाव सहेजें"
					}),
					onCancel: () => setEditing(null),
					onSave: () => setEditing(null)
				}, med.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-bold",
						children: med.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-lg",
						children: med.dose
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-base text-quiet",
						children: [
							med.times.join(" · "),
							" · ",
							foodLabel(med.food, lang)
						]
					}),
					med.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-base text-quiet",
						children: med.note
					}) : null,
					med.pillsLeft !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-base font-bold text-clay",
						children: [
							med.pillsLeft,
							" ",
							t(lang, {
								en: "tablets left in the count",
								hi: "गोलियाँ गिनती में बची हैं"
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => setEditing(med.id),
							children: t(lang, {
								en: "Change",
								hi: "बदलें"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => removeMed(med.id),
							children: t(lang, {
								en: "Remove",
								hi: "हटाएँ"
							})
						})]
					})
				] }, med.id))
			}),
			adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MedEditor, {
					initial: {
						id: newId(),
						name: "",
						dose: "",
						times: ["08:00"],
						food: "with",
						note: "",
						pillsLeft: null
					},
					submitLabel: t(lang, {
						en: "Save this medicine",
						hi: "यह दवा सहेजें"
					}),
					onCancel: () => setAdding(false),
					onSave: () => setAdding(false)
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => setAdding(true),
						children: t(lang, {
							en: "Add a medicine",
							hi: "दवा जोड़ें"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						onClick: () => fileRef.current?.click(),
						disabled: reading,
						children: reading ? t(lang, {
							en: "Reading the page…",
							hi: "पन्ना पढ़ रही हूँ…"
						}) : t(lang, {
							en: "Read a prescription photo",
							hi: "पर्ची की फ़ोटो पढ़ें"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base text-quiet",
						children: t(lang, {
							en: "One page, in daylight, lying flat. Asha suggests names. She does not add them until you say so.",
							hi: "एक पन्ना, दिन की रोशनी में, सीधा रखकर. आशा नाम सुझाएगी. आप कहें तब जोड़ेगी."
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "image/*",
				capture: "environment",
				className: "sr-only",
				onChange: (e) => {
					const file = e.target.files?.[0];
					e.target.value = "";
					if (file) onFile(file);
				}
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-lg text-clay",
				children: error
			}) : null,
			drafts ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display text-3xl",
						children: t(lang, {
							en: "Check these names",
							hi: "इन नामों को जाँचें"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-lg text-quiet",
						children: t(lang, {
							en: "Untick anything wrong. Change a name if a letter looks off. Times that were not written down are a guess.",
							hi: "जो गलत हो उसे हटाएँ. अक्षर अटपटा लगे तो नाम बदलें. जो समय लिखा नहीं था, वह अंदाज़ा है."
						})
					}),
					caution ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg",
						children: caution
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-col gap-3",
						children: drafts.map((draft) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-3 text-lg font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									className: "size-6",
									checked: draft.keep,
									onChange: (e) => setDrafts((list) => list?.map((d) => d.id === draft.id ? {
										...d,
										keep: e.target.checked
									} : d) ?? null)
								}), t(lang, {
									en: "Add this one",
									hi: "इसे जोड़ें"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field mt-3",
								value: draft.name,
								onChange: (e) => setDrafts((list) => list?.map((d) => d.id === draft.id ? {
									...d,
									name: e.target.value
								} : d) ?? null)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field mt-2",
								value: draft.dose,
								onChange: (e) => setDrafts((list) => list?.map((d) => d.id === draft.id ? {
									...d,
									dose: e.target.value
								} : d) ?? null)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-base text-quiet",
								children: [
									draft.times.join(" · "),
									" · ",
									foodLabel(draft.food, lang)
								]
							}),
							draft.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-base text-quiet",
								children: draft.note
							}) : null
						] }, draft.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								const chosen = drafts.filter((d) => d.keep && d.name.trim());
								if (!chosen.length) {
									setError(t(lang, {
										en: "Tick at least one medicine, or cancel.",
										hi: "कम से कम एक दवा चुनें, या रद्द करें."
									}));
									return;
								}
								saveMeds(chosen.map((d) => ({
									id: d.id,
									name: d.name.trim(),
									dose: d.dose,
									times: d.times,
									food: d.food,
									note: d.note,
									pillsLeft: d.pillsLeft
								})));
								setDrafts(null);
								setCaution("");
								setError("");
							},
							children: t(lang, {
								en: "Add the ticked medicines",
								hi: "चुनी हुई दवाएँ जोड़ें"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => setDrafts(null),
							children: t(lang, {
								en: "Do not add these",
								hi: "इन्हें न जोड़ें"
							})
						})]
					})
				]
			}) : null
		]
	});
}
function Onboarding() {
	const lang = useAsha((s) => s.lang);
	const step = useAsha((s) => s.setupStep);
	const name = useAsha((s) => s.name);
	const conditions = useAsha((s) => s.conditions);
	const setLang = useAsha((s) => s.setLang);
	const setName = useAsha((s) => s.setName);
	const toggle = useAsha((s) => s.toggleCondition);
	const setStep = useAsha((s) => s.setSetupStep);
	const setContacts = useAsha((s) => s.setContacts);
	const setEmergency = useAsha((s) => s.setEmergency);
	const finish = useAsha((s) => s.finishSetup);
	const loadSample = useAsha((s) => s.loadSample);
	const [hint, setHint] = (0, import_react.useState)("");
	const [people, setPeople] = (0, import_react.useState)(() => {
		const existing = useAsha.getState().contacts;
		return existing.length ? existing : [{
			id: newId(),
			name: "",
			relation: "",
			phone: ""
		}];
	});
	const [emergency, setEmergencyLocal] = (0, import_react.useState)(() => useAsha.getState().emergencyNumber);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const steps = t(lang, {
		en: "Step",
		hi: "कदम"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-base font-bold text-sage",
				children: [
					steps,
					" ",
					step,
					" / 4"
				]
			}),
			step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "display text-5xl leading-tight",
						children: t(lang, {
							en: "A calm voice for the day.",
							hi: "दिन के लिए एक शांत आवाज़."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-lg text-quiet",
						children: t(lang, {
							en: "Asha speaks medicines and meals in a sentence, not a beep. Help stays at the top. This stays on this phone.",
							hi: "आशा दवा और खाना एक वाक्य में बोलती है, बीप में नहीं. मदद ऊपर रहती है. यह इसी फ़ोन पर रहता है."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setLang("en"),
							className: `min-h-12 rounded-xl text-lg font-bold ${lang === "en" ? "bg-sage text-paper" : "text-ink"}`,
							children: "English"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setLang("hi"),
							className: `min-h-12 rounded-xl text-lg font-bold ${lang === "hi" ? "bg-sage text-paper" : "text-ink"}`,
							children: "हिन्दी"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
								en: "What should Asha call you?",
								hi: "आशा आपको क्या कहे?"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								value: name,
								onChange: (e) => setName(e.target.value),
								placeholder: t(lang, {
									en: "Meena",
									hi: "मीना"
								}),
								autoComplete: "given-name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-base text-quiet",
								children: t(lang, {
									en: "A first name is enough. She will use it when she speaks.",
									hi: "पहला नाम काफ़ी है. बोलते समय वही नाम आएगा."
								})
							})
						]
					}),
					hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-lg text-clay",
						children: hint
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								if (!name.trim()) {
									setHint(t(lang, {
										en: "Type a name first. Even a nickname is fine.",
										hi: "पहले नाम लिखें. उपनाम भी चलेगा."
									}));
									return;
								}
								setHint("");
								setStep(2);
							},
							children: t(lang, {
								en: "Continue",
								hi: "आगे बढ़ें"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => loadSample(),
							children: t(lang, {
								en: "See a sample day first",
								hi: "पहले एक नमूना दिन देखें"
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-base text-quiet",
						children: t(lang, {
							en: "Asha is not a doctor. She does not change a prescription.",
							hi: "आशा डॉक्टर नहीं है. वह पर्ची नहीं बदलती."
						})
					})
				]
			}),
			step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "display text-4xl",
						children: t(lang, {
							en: "Which of these are yours?",
							hi: "इनमें से कौन सी आपकी हैं?"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg text-quiet",
						children: t(lang, {
							en: "Tap every one that applies. You can change this later. None is also allowed.",
							hi: "जो लागू हो उसे छुएँ. बाद में बदल सकते हैं. कोई न चुनना भी ठीक है."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 flex flex-col gap-3",
						children: CONDITIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							selected: conditions.includes(c.id),
							onClick: () => toggle(c.id),
							title: t(lang, c.title),
							detail: t(lang, c.blurb)
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								setStep(3);
							},
							children: t(lang, {
								en: "Continue",
								hi: "आगे बढ़ें"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => setStep(1),
							children: t(lang, {
								en: "Back",
								hi: "पीछे"
							})
						})]
					})
				]
			}),
			step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "display text-4xl",
						children: t(lang, {
							en: "Who should the phone call?",
							hi: "फ़ोन किसे लगना चाहिए?"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg text-quiet",
						children: t(lang, {
							en: "Add at least one number. A daughter, a neighbor, or the emergency number where you live. In India that is often 112. In the US it is 911.",
							hi: "कम से कम एक नंबर डालें. बेटी, पड़ोसी, या इमरजेंसी नंबर. भारत में अक्सर 112. अमेरिका में 911."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
							en: "Emergency number",
							hi: "इमरजेंसी नंबर"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "tel",
							value: emergency,
							onChange: (e) => setEmergencyLocal(e.target.value),
							placeholder: "112"
						})]
					}),
					people.map((person, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 rounded-3xl border border-line bg-paper p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-base font-bold text-quiet",
								children: [
									t(lang, {
										en: "Loved one",
										hi: "अपना व्यक्ति"
									}),
									" ",
									index + 1
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
									en: "Name",
									hi: "नाम"
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: person.name,
									onChange: (e) => setPeople((list) => list.map((p) => p.id === person.id ? {
										...p,
										name: e.target.value
									} : p))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
									en: "Who they are",
									hi: "रिश्ता"
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: person.relation,
									placeholder: t(lang, {
										en: "Daughter",
										hi: "बेटी"
									}),
									onChange: (e) => setPeople((list) => list.map((p) => p.id === person.id ? {
										...p,
										relation: e.target.value
									} : p))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
									en: "Phone",
									hi: "फ़ोन"
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									inputMode: "tel",
									value: person.phone,
									placeholder: "+91",
									onChange: (e) => setPeople((list) => list.map((p) => p.id === person.id ? {
										...p,
										phone: e.target.value
									} : p))
								})]
							})
						]
					}, person.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-4 min-h-12 text-lg font-bold text-sage",
						onClick: () => setPeople((list) => [...list, {
							id: newId(),
							name: "",
							relation: "",
							phone: ""
						}]),
						children: t(lang, {
							en: "Add another person",
							hi: "एक और व्यक्ति जोड़ें"
						})
					}),
					hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-lg text-clay",
						children: hint
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								const kept = people.filter((p) => p.name.trim() || digits(p.phone).length >= 3);
								if (!(digits(emergency).length >= 3 || kept.some((p) => p.name.trim() && digits(p.phone).length >= 3))) {
									setHint(t(lang, {
										en: "Add one real number before going on. Help cannot call an empty line.",
										hi: "आगे बढ़ने से पहले एक असली नंबर डालें. खाली नंबर पर मदद कॉल नहीं कर सकती."
									}));
									return;
								}
								setContacts(kept);
								setEmergency(emergency);
								setHint("");
								setStep(4);
							},
							children: t(lang, {
								en: "Continue",
								hi: "आगे बढ़ें"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => setStep(2),
							children: t(lang, {
								en: "Back",
								hi: "पीछे"
							})
						})]
					})
				]
			}),
			step === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "display text-4xl",
						children: t(lang, {
							en: "Medicines can wait one minute.",
							hi: "दवा एक मिनट रुक सकती है."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg text-quiet",
						children: t(lang, {
							en: "You can type the first one now. Or finish, and on Meds take a photo of the prescription. Asha reads the names and waits for you to check each one. Handwriting is easy to misread.",
							hi: "पहली दवा अभी लिख सकते हैं. या खत्म करें, और दवा वाले पन्ने पर पर्ची की फ़ोटो लें. आशा नाम पढ़ेगी और हर नाम आपकी जाँच का इंतज़ार करेगी. लिखावट आसानी से गलत पढ़ी जाती है."
						})
					}),
					adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MedEditor, {
							initial: blankMed(),
							submitLabel: t(lang, {
								en: "Save this medicine",
								hi: "यह दवा सहेजें"
							}),
							onCancel: () => setAdding(false),
							onSave: () => setAdding(false)
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => finish(),
								children: t(lang, {
									en: "Go to my day",
									hi: "मेरे दिन पर जाएँ"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "quiet",
								onClick: () => setAdding(true),
								children: t(lang, {
									en: "Add one medicine now",
									hi: "अभी एक दवा जोड़ें"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								onClick: () => setStep(3),
								children: t(lang, {
									en: "Back",
									hi: "पीछे"
								})
							})
						]
					})
				]
			})
		]
	});
}
function SettingsScreen() {
	const lang = useAsha((s) => s.lang);
	const name = useAsha((s) => s.name);
	const conditions = useAsha((s) => s.conditions);
	const contacts = useAsha((s) => s.contacts);
	const emergency = useAsha((s) => s.emergencyNumber);
	const voiceOn = useAsha((s) => s.voiceOn);
	const richVoice = useAsha((s) => s.richVoice);
	const speakOnOpen = useAsha((s) => s.speakOnOpen);
	const keepAwake = useAsha((s) => s.keepAwake);
	const pro = useAsha((s) => s.pro);
	const setLang = useAsha((s) => s.setLang);
	const setName = useAsha((s) => s.setName);
	const toggle = useAsha((s) => s.toggleCondition);
	const setEmergency = useAsha((s) => s.setEmergency);
	const upsert = useAsha((s) => s.upsertContact);
	const remove = useAsha((s) => s.removeContact);
	const setPrefs = useAsha((s) => s.setPrefs);
	const erase = useAsha((s) => s.eraseAll);
	const close = useAsha((s) => s.closeSettings);
	const [confirm, setConfirm] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)("");
	async function allowNotes() {
		if (typeof Notification === "undefined") {
			setNote(t(lang, {
				en: "This phone does not show reminders outside the page.",
				hi: "यह फ़ोन पन्ने के बाहर याद नहीं दिलाता."
			}));
			return;
		}
		const result = await Notification.requestPermission();
		setNote(result === "granted" ? t(lang, {
			en: "Allowed. Asha still has to be open to speak. The notice is only a quiet line, not an alarm.",
			hi: "अनुमति मिल गई. बोलने के लिए आशा को खुला रहना होगा. सूचना एक शांत पंक्ति है, अलार्म नहीं."
		}) : t(lang, {
			en: "Not allowed. Speaking on this page still works.",
			hi: "अनुमति नहीं. इस पन्ने पर बोलना फिर भी चलेगा."
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "min-h-12 text-lg font-bold text-sage",
				onClick: () => close(),
				children: t(lang, {
					en: "Back to the day",
					hi: "दिन पर वापस"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display mt-2 text-4xl",
				children: t(lang, {
					en: "Settings",
					hi: "सेटिंग"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "Everything here stays on this phone. Nothing is sent to an account.",
					hi: "यहाँ सब कुछ इसी फ़ोन पर रहता है. किसी खाते में नहीं जाता."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
					en: "Name",
					hi: "नाम"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					value: name,
					onChange: (e) => setName(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-paper p-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setLang("en"),
					className: `min-h-12 rounded-xl text-lg font-bold ${lang === "en" ? "bg-sage text-paper" : ""}`,
					children: "English"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setLang("hi"),
					className: `min-h-12 rounded-xl text-lg font-bold ${lang === "hi" ? "bg-sage text-paper" : ""}`,
					children: "हिन्दी"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-2xl font-bold",
				children: t(lang, {
					en: "Health",
					hi: "सेहत"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: CONDITIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					selected: conditions.includes(c.id),
					onClick: () => toggle(c.id),
					title: t(lang, c.title),
					detail: t(lang, c.blurb)
				}, c.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-2xl font-bold",
				children: t(lang, {
					en: "Voice",
					hi: "आवाज़"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: voiceOn,
						lang,
						label: t(lang, {
							en: "Speak reminders and greetings",
							hi: "याद और अभिवादन बोलें"
						}),
						onClick: () => setPrefs({ voiceOn: !voiceOn })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: richVoice,
						lang,
						label: t(lang, {
							en: "Use the warmer voice when online",
							hi: "ऑनलाइन होने पर गरम आवाज़"
						}),
						onClick: () => setPrefs({ richVoice: !richVoice })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: speakOnOpen,
						lang,
						label: t(lang, {
							en: "Greet me when I open Asha",
							hi: "आशा खुलते ही अभिवादन"
						}),
						onClick: () => setPrefs({ speakOnOpen: !speakOnOpen })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: keepAwake,
						lang,
						label: t(lang, {
							en: "Keep the screen awake. Uses more battery.",
							hi: "स्क्रीन जगाए रखें. बैटरी ज़्यादा लगेगी."
						}),
						onClick: () => setPrefs({ keepAwake: !keepAwake })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: pro,
						lang,
						label: t(lang, {
							en: "Pro on this phone — talk freely",
							hi: "इस फ़ोन पर प्रो — खुलकर बात"
						}),
						onClick: () => setPrefs({ pro: !pro })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "quiet",
					onClick: () => void allowNotes(),
					children: t(lang, {
						en: "Allow a quiet notice",
						hi: "शांत सूचना की अनुमति"
					})
				}), note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-base text-quiet",
					children: note
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-2xl font-bold",
				children: t(lang, {
					en: "Emergency number",
					hi: "इमरजेंसी नंबर"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field mt-3",
				inputMode: "tel",
				value: emergency,
				onChange: (e) => setEmergency(e.target.value),
				placeholder: "112"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-2xl font-bold",
				children: t(lang, {
					en: "Loved ones",
					hi: "अपने लोग"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-3",
				children: contacts.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
						en: "Name",
						hi: "नाम"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field",
						value: person.name,
						onChange: (e) => upsert({
							...person,
							name: e.target.value
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
							en: "Who they are",
							hi: "रिश्ता"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							value: person.relation,
							onChange: (e) => upsert({
								...person,
								relation: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldLabel, { children: t(lang, {
							en: "Phone",
							hi: "फ़ोन"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "tel",
							value: person.phone,
							onChange: (e) => upsert({
								...person,
								phone: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-3 min-h-12 font-bold text-clay",
						onClick: () => remove(person.id),
						children: t(lang, {
							en: "Remove this person",
							hi: "इस व्यक्ति को हटाएँ"
						})
					})
				] }, person.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "quiet",
					onClick: () => upsert({
						id: newId(),
						name: "",
						relation: "",
						phone: ""
					}),
					children: t(lang, {
						en: "Add a person",
						hi: "व्यक्ति जोड़ें"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-2xl font-bold",
				children: t(lang, {
					en: "Erase this phone",
					hi: "इस फ़ोन को मिटाएँ"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "This removes medicines, numbers, and the chart from this phone only.",
					hi: "यह दवा, नंबर और चार्ट सिर्फ इस फ़ोन से हटाता है."
				})
			}),
			confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "sos",
					onClick: () => erase(),
					children: t(lang, {
						en: "Yes, erase",
						hi: "हाँ, मिटाएँ"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "quiet",
					onClick: () => setConfirm(false),
					children: t(lang, {
						en: "Keep my list",
						hi: "मेरी सूची रहने दें"
					})
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "quiet",
					onClick: () => setConfirm(true),
					children: t(lang, {
						en: "Erase everything on this phone",
						hi: "इस फ़ोन की सब चीज़ मिटाएँ"
					})
				})
			})
		]
	});
}
function Toggle({ on, label, onClick, lang }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"aria-pressed": on,
		onClick,
		className: "flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 text-left text-lg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `shrink-0 rounded-full px-3 py-1 text-base font-bold ${on ? "bg-sage text-paper" : "bg-linen text-quiet"}`,
			children: on ? lang === "hi" ? "चालू" : "On" : lang === "hi" ? "बंद" : "Off"
		})]
	});
}
function SosScreen() {
	const lang = useAsha((s) => s.lang);
	const name = useAsha((s) => s.name);
	const contacts = useAsha((s) => s.contacts);
	const emergency = useAsha((s) => s.emergencyNumber);
	const tight = todayCheckin(useAsha((s) => s.checkins))?.chestOk === false;
	const openSettings = useAsha((s) => s.openSettings);
	const body = smsBody(lang, name);
	const people = contacts.filter((c) => digits(c.phone).length >= 3);
	const hasEmergency = digits(emergency).length >= 3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl text-sos",
				children: t(lang, {
					en: "Help",
					hi: "मदद"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-lg",
				children: t(lang, {
					en: "Press a button. Your phone opens the call or message screen. Then press the green call button there. Asha cannot dial by herself.",
					hi: "बटन दबाएँ. फ़ोन कॉल या संदेश की स्क्रीन खोलेगा. वहाँ हरा कॉल बटन दबाएँ. आशा खुद डायल नहीं कर सकती."
				})
			}),
			tight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mt-4 border-sos bg-sos-soft",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg font-bold",
					children: t(lang, {
						en: "Chest tightness was marked today. Call now. Do not wait to see if it passes.",
						hi: "आज सीने की जकड़न चिह्नित है. अभी कॉल करें. गुज़र जाने का इंतज़ार न करें."
					})
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: hasEmergency ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: telHref(emergency),
					className: "inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-sos px-5 text-xl font-bold text-paper",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
							className: "size-6",
							"aria-hidden": true
						}),
						t(lang, {
							en: "Call emergency",
							hi: "इमरजेंसी कॉल"
						}),
						" ",
						emergency
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg",
					children: t(lang, {
						en: "No emergency number yet. Add 112, 911, or the number your family uses.",
						hi: "अभी इमरजेंसी नंबर नहीं. 112, 911, या जो नंबर परिवार इस्तेमाल करे, वह डालें."
					})
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-2xl font-bold",
				children: t(lang, {
					en: "Loved ones",
					hi: "अपने लोग"
				})
			}),
			people.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "No phone numbers saved yet.",
					hi: "अभी कोई फ़ोन नंबर सहेजा नहीं."
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-3",
				children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-bold",
						children: person.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-base text-quiet",
						children: [
							person.relation,
							" · ",
							person.phone
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: telHref(person.phone),
							className: "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sage px-3 text-lg font-bold text-paper",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
								className: "size-5",
								"aria-hidden": true
							}), t(lang, {
								en: "Call",
								hi: "कॉल"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: smsHref(person.phone, body),
							className: "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-3 text-lg font-bold text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
								className: "size-5",
								"aria-hidden": true
							}), t(lang, {
								en: "Message",
								hi: "संदेश"
							})]
						})]
					})
				] }, person.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-base text-quiet",
				children: t(lang, {
					en: "The message says you need help now and asks them to call or come.",
					hi: "संदेश कहता है कि अभी मदद चाहिए और उन्हें कॉल या आने को कहता है."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "quiet",
					onClick: () => openSettings(),
					children: t(lang, {
						en: "Add or change numbers",
						hi: "नंबर जोड़ें या बदलें"
					})
				})
			})
		]
	});
}
var CRISIS = /suicid|kill myself|want to die|end my life|self-harm|hurt myself|don't want to live|do not want to live|मरना|जीना नहीं|खुदकुशी|आत्महत्या/i;
function recognizer() {
	if (typeof window === "undefined") return null;
	const w = window;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
function TalkScreen() {
	const lang = useAsha((s) => s.lang);
	const pro = useAsha((s) => s.pro);
	const setPrefs = useAsha((s) => s.setPrefs);
	const chat = useAsha((s) => s.chat);
	const push = useAsha((s) => s.pushChat);
	const name = useAsha((s) => s.name);
	const conditions = useAsha((s) => s.conditions);
	const meds = useAsha((s) => s.meds);
	const voiceOn = useAsha((s) => s.voiceOn);
	const rich = useAsha((s) => s.richVoice);
	const setTab = useAsha((s) => s.setTab);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [listening, setListening] = (0, import_react.useState)(false);
	const [crisis, setCrisis] = (0, import_react.useState)(false);
	async function send(textIn) {
		const text$1 = (textIn ?? draft).trim();
		if (!text$1 || busy) return;
		setDraft("");
		setError("");
		setCrisis(CRISIS.test(text$1));
		push({
			role: "user",
			text: text$1
		});
		setBusy(true);
		const conditionNames = conditions.map((id) => {
			const c = CONDITIONS.find((x) => x.id === id);
			return c ? text(c.title, "en") : id;
		}).join(", ");
		const context = `Name: ${name || "not given"}. Conditions: ${conditionNames || "none selected"}. Medicines: ${meds.map((m) => `${m.name} ${m.dose} at ${m.times.join(", ")}`).join("; ") || "none listed"}.`;
		const turns = [...chat, {
			role: "user",
			text: text$1
		}].slice(-8).map((turn) => ({
			role: turn.role,
			content: turn.text
		}));
		const res = await askAsha({ data: {
			lang,
			context,
			turns
		} });
		setBusy(false);
		if (!res.ok) {
			setError(res.error);
			return;
		}
		push({
			role: "asha",
			text: res.text
		});
		if (voiceOn) speak(res.text, lang, rich ? "warm" : "device");
	}
	function listen() {
		const Ctor = recognizer();
		if (!Ctor) {
			setError(t(lang, {
				en: "This phone has no speech button. Typing works.",
				hi: "इस फ़ोन पर बोलने का बटन नहीं. लिखना चलता है."
			}));
			return;
		}
		const rec = new Ctor();
		rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
		rec.onresult = (ev) => {
			const said = ev.results[0]?.[0]?.transcript ?? "";
			setDraft(said);
			setListening(false);
		};
		rec.onerror = () => setListening(false);
		rec.onend = () => setListening(false);
		setListening(true);
		try {
			rec.start();
		} catch {
			setListening(false);
		}
	}
	if (!pro) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl",
				children: t(lang, {
					en: "Talk",
					hi: "बात"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "Medicines, meals, the chart, greetings, and Help stay open for everyone.",
					hi: "दवा, खाना, चार्ट, अभिवादन और मदद सबके लिए खुले हैं."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-bold",
						children: t(lang, {
							en: "Talking freely is Pro.",
							hi: "खुलकर बात करना प्रो है."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg",
						children: t(lang, {
							en: "Pro lets her talk about anything — a lonely afternoon, a worry, the news, a memory. Asha answers in a short, human voice. She is still not a doctor.",
							hi: "प्रो में वह कुछ भी बात कर सकती हैं — सूनी दोपहर, चिंता, खबर, कोई याद. आशा छोटे मानवीय वाक्यों में जवाब देती है. वह फिर भी डॉक्टर नहीं."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base text-quiet",
						children: t(lang, {
							en: "There is no charge inside this copy. Pro stays on this phone. A Play Store payment can come later, when you choose it.",
							hi: "इस प्रति में कोई शुल्क नहीं. प्रो इसी फ़ोन पर रहता है. प्ले स्टोर का भुगतान बाद में, जब आप चाहें."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => setPrefs({ pro: true }),
							children: t(lang, {
								en: "Turn on Pro on this phone",
								hi: "इस फ़ोन पर प्रो चालू करें"
							})
						})
					})
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl",
				children: t(lang, {
					en: "Talk with Asha",
					hi: "आशा से बात"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-quiet",
				children: t(lang, {
					en: "You will see the words before they are sent. Then press Send. She speaks the reply if voice is on.",
					hi: "भेजने से पहले शब्द दिखेंगे. फिर भेजें दबाएँ. आवाज़ चालू हो तो वह जवाब बोलेगी."
				})
			}),
			crisis ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-4 border-sos bg-sos-soft",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold",
						children: t(lang, {
							en: "Please call someone now.",
							hi: "कृपया अभी किसी को कॉल करें."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-lg",
						children: t(lang, {
							en: "Open Help and call your person. In India, AASRA is 9820466726. In the US and Canada, call or text 988.",
							hi: "मदद खोलें और अपने व्यक्ति को कॉल करें. भारत में AASRA 9820466726. अमेरिका और कनाडा में 988 पर कॉल या संदेश."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "sos",
							onClick: () => setTab("sos"),
							children: t(lang, {
								en: "Open Help",
								hi: "मदद खोलें"
							})
						})
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-3",
				children: [
					chat.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg",
						children: t(lang, {
							en: "You can start anywhere. How the morning went is enough.",
							hi: "कहीं से भी शुरू करें. सुबह कैसी रही, बस इतना काफ़ी है."
						})
					}) }) : chat.map((turn, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: turn.role === "user" ? "ml-8 rounded-3xl bg-sage-soft px-4 py-3 text-lg" : "mr-6 rounded-3xl border border-line bg-paper px-4 py-3 text-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-base font-bold text-quiet",
							children: turn.role === "user" ? name || t(lang, {
								en: "You",
								hi: "आप"
							}) : "Asha"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1",
							children: turn.text
						})]
					}, `${i}-${turn.role}`)),
					busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg text-quiet",
						children: t(lang, {
							en: "Asha is thinking.",
							hi: "आशा सोच रही है."
						})
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg text-clay",
						children: error
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "field min-h-28",
						value: draft,
						onChange: (e) => setDraft(e.target.value),
						placeholder: t(lang, {
							en: "Type, or use the microphone",
							hi: "लिखें, या माइक दबाएँ"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => void send(),
							disabled: busy,
							children: t(lang, {
								en: "Send",
								hi: "भेजें"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "quiet",
							onClick: listen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, {
								className: "size-5",
								"aria-hidden": true
							}), listening ? t(lang, {
								en: "Listening…",
								hi: "सुन रही हूँ…"
							}) : t(lang, {
								en: "Speak, then check the words",
								hi: "बोलें, फिर शब्द देखें"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base text-quiet",
						children: t(lang, {
							en: "Asha is not a doctor. If something feels urgent, Help is at the top.",
							hi: "आशा डॉक्टर नहीं. अगर कुछ तुरंत लगे, मदद ऊपर है."
						})
					})
				]
			})
		]
	});
}
function TodayScreen() {
	const now = useNow();
	const lang = useAsha((s) => s.lang);
	const name = useAsha((s) => s.name);
	const conditions = useAsha((s) => s.conditions);
	const sample = useAsha((s) => s.sample);
	const coach = useAsha((s) => s.coachDismissed);
	const dismiss = useAsha((s) => s.dismissCoach);
	const meds = useAsha((s) => s.meds);
	const meals = useAsha((s) => s.meals);
	const doseLogs = useAsha((s) => s.doseLogs);
	const mealLogs = useAsha((s) => s.mealLogs);
	const snooze = useAsha((s) => s.snooze);
	const checkins = useAsha((s) => s.checkins);
	useAsha((s) => s.logDose);
	const undoDose = useAsha((s) => s.undoDose);
	useAsha((s) => s.logMeal);
	const undoMeal = useAsha((s) => s.undoMeal);
	useAsha((s) => s.snoozeKey);
	const patchCheckin = useAsha((s) => s.patchCheckin);
	const addWater = useAsha((s) => s.addWater);
	const setTab = useAsha((s) => s.setTab);
	const hello = greeting(lang, name, now);
	const agenda = buildAgenda({
		name,
		lang,
		meds,
		meals,
		doseLogs,
		mealLogs,
		snooze
	}, now);
	const active = agenda.filter((item) => item.state === "now" || item.state === "snoozed" || item.state === "open");
	const later = agenda.filter((item) => item.state === "later");
	const done = agenda.filter((item) => item.state === "taken" || item.state === "skipped");
	const progress = doseProgress(meds, doseLogs, now);
	const checkin = todayCheckin(checkins, now);
	const low = meds.filter((m) => m.pillsLeft !== null && m.pillsLeft <= 7);
	const hour = now.getHours();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-4xl leading-tight",
				children: hello.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-lg text-quiet",
				children: hello.line
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hear, {
					text: `${hello.title} ${hello.line}`,
					label: t(lang, {
						en: "Hear this",
						hi: "इसे सुनें"
					})
				})
			}),
			sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5 border-clay bg-clay-soft",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-base font-bold text-clay",
					children: t(lang, {
						en: "Sample day",
						hi: "नमूना दिन"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-lg",
					children: t(lang, {
						en: "This is a practice day for Meena. It is not a real prescription. Erase it in Settings when you are ready for her name.",
						hi: "यह मीना का अभ्यास दिन है. असली पर्ची नहीं. जब उसका नाम डालना हो, सेटिंग में मिटा दें."
					})
				})]
			}) : null,
			!coach ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold",
						children: t(lang, {
							en: "How today works",
							hi: "आज कैसे चलता है"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-3 list-decimal space-y-2 pl-5 text-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t(lang, {
								en: "When a dose is due, Asha speaks the sentence on the card.",
								hi: "जब दवा का समय हो, आशा कार्ड वाला वाक्य बोलती है."
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t(lang, {
								en: "Press the green button after it is taken. Press it again only if you meant to undo.",
								hi: "ले लेने के बाद हरा बटन दबाएँ. गलती हो तो ही वापस लें."
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t(lang, {
								en: "Help stays at the top. It opens the phone numbers you saved.",
								hi: "मदद ऊपर रहती है. वही आपके सहेजे नंबर खोलती है."
							}) })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base text-quiet",
						children: t(lang, {
							en: "She can speak only while this page is open. Leave it on the table at home, or open it when you sit down to eat.",
							hi: "वह तभी बोलती है जब यह पन्ना खुला हो. घर पर मेज़ पर छोड़ दें, या खाने बैठें तब खोलें."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => dismiss(),
							children: t(lang, {
								en: "I understand",
								hi: "समझ लिया"
							})
						})
					})
				]
			}) : null,
			conditions.includes("heart") && checkin?.chestOk !== true ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5 border-sos bg-sos-soft",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold",
						children: checkin?.chestOk === false ? t(lang, {
							en: "You said there is tightness. Call now.",
							hi: "आपने कहा सीने में जकड़न है. अभी कॉल करें."
						}) : t(lang, {
							en: "Any chest tightness today?",
							hi: "आज सीने में कोई जकड़न?"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-base text-quiet",
						children: t(lang, {
							en: "Pressure, pain into the arm or jaw, cold sweat, or breath you cannot catch is not something to wait out.",
							hi: "दबाव, बाँह या जबड़े तक दर्द, ठंडा पसीना, या साँस जो न आए — इसे बाद पर न छोड़ें."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "sos",
							onClick: () => {
								patchCheckin({ chestOk: false });
								setTab("sos");
							},
							children: t(lang, {
								en: "Yes — open Help",
								hi: "हाँ — मदद खोलें"
							})
						}), checkin?.chestOk !== false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => patchCheckin({ chestOk: true }),
							children: t(lang, {
								en: "No tightness",
								hi: "जकड़न नहीं"
							})
						}) : null]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-lg",
				children: plateLine(conditions, lang)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-base font-bold tracking-wide text-quiet uppercase",
				children: t(lang, {
					en: "Now",
					hi: "अभी"
				})
			}),
			active.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg",
					children: t(lang, {
						en: "Nothing is due this minute. Later today is listed underneath.",
						hi: "इस मिनट कुछ बाकी नहीं. आगे का दिन नीचे है."
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-3",
				children: active.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgendaCard, { item }, item.key))
			}),
			later.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-6 text-base font-bold tracking-wide text-quiet uppercase",
				children: t(lang, {
					en: "Later",
					hi: "बाद में"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: later.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shrink-0 text-base tabular-nums text-quiet",
						children: speakClock(lang, item.time)
					})]
				}, item.key))
			})] }) : null,
			low.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold",
						children: t(lang, {
							en: "Refill soon",
							hi: "जल्द रिफिल"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1 text-lg",
						children: low.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							m.name,
							": ",
							m.pillsLeft,
							" ",
							t(lang, {
								en: "left",
								hi: "बची"
							})
						] }, m.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-base text-quiet",
						children: t(lang, {
							en: "Ask the pharmacy before the bottle is empty.",
							hi: "डिब्बी खाली होने से पहले दवा की दुकान से कहें."
						})
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplets, {
							className: "size-6 text-sage",
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-lg font-bold",
							children: [
								t(lang, {
									en: "Water",
									hi: "पानी"
								}),
								" · ",
								checkin?.water ?? 0,
								" / 8"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-base text-quiet",
						children: t(lang, {
							en: "Tap when you finish a glass. Eight is plenty for most days.",
							hi: "गिलास खत्म हो तो दबाएँ. ज़्यादातर दिनों में आठ काफ़ी हैं."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => addWater(),
							children: t(lang, {
								en: "I drank a glass",
								hi: "एक गिलास पी लिया"
							})
						})
					})
				]
			}),
			conditions.includes("diabetes") && hour >= 18 && !checkin?.footCheck ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-bold",
						children: t(lang, {
							en: "Look at both feet tonight.",
							hi: "आज रात दोनों पैर देखें."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-lg",
						children: t(lang, {
							en: "Cuts, redness, or a dark spot is worth telling the doctor. Do not wait for pain.",
							hi: "कट, लालिमा या काला धब्बा डॉक्टर को बताने लायक है. दर्द का इंतज़ार न करें."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => patchCheckin({ footCheck: true }),
							children: t(lang, {
								en: "I looked",
								hi: "देख लिया"
							})
						})
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-lg",
				children: progress.total === 0 ? t(lang, {
					en: "No doses are on the list yet.",
					hi: "सूची में अभी कोई खुराक नहीं."
				}) : progress.marked === progress.total ? t(lang, {
					en: "Today's doses are marked. That is a good day's work.",
					hi: "आज की खुराकें चिह्नित हैं. यह अच्छे दिन का काम है."
				}) : lang === "hi" ? `आज ${progress.total} में से ${progress.marked} खुराक चिह्नित हैं.` : `You have marked ${progress.marked} of ${progress.total} doses today.`
			}),
			done.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-4 rounded-3xl border border-line bg-paper px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
					className: "min-h-12 cursor-pointer text-lg font-bold",
					children: [
						t(lang, {
							en: "Already marked",
							hi: "पहले से चिह्नित"
						}),
						" (",
						done.length,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-3",
					children: done.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-lg",
							children: [item.title, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-base text-quiet",
								children: item.state === "skipped" ? t(lang, {
									en: "Skipped",
									hi: "छोड़ी"
								}) : t(lang, {
									en: "Taken",
									hi: "ले ली"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-12 shrink-0 font-bold text-sage",
							onClick: () => item.kind === "med" ? undoDose(item.id, item.time) : undoMeal(item.id),
							children: t(lang, {
								en: "Undo",
								hi: "वापस"
							})
						})]
					}, item.key))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg font-bold",
					children: t(lang, {
						en: "Keep Asha on the home screen",
						hi: "आशा को होम स्क्रीन पर रखें"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-base text-quiet",
					children: t(lang, {
						en: "In Chrome, open the menu (three dots), then Install app or Add to Home screen. Open her from that icon.",
						hi: "क्रोम में मेनू खोलें (तीन बिंदु), फिर Install app या होम स्क्रीन में जोड़ें. उसी आइकन से खोलें."
					})
				})]
			})
		]
	});
}
function AgendaCard({ item }) {
	const lang = useAsha((s) => s.lang);
	const logDose = useAsha((s) => s.logDose);
	const logMeal = useAsha((s) => s.logMeal);
	const snoozeKey = useAsha((s) => s.snoozeKey);
	const primary = item.kind === "med" ? t(lang, {
		en: "I took it",
		hi: "ले ली"
	}) : t(lang, {
		en: "I have eaten",
		hi: "खा लिया"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: item.state === "now" ? "border-sage" : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-base font-bold text-sage",
				children: [
					item.kind === "med" ? t(lang, {
						en: "Medicine",
						hi: "दवा"
					}) : t(lang, {
						en: "Meal",
						hi: "खाना"
					}),
					" ·",
					" ",
					speakClock(lang, item.time)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "display mt-1 text-3xl capitalize",
				children: item.title
			}),
			item.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-base text-quiet",
				children: item.detail
			}) : null,
			item.state === "snoozed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-base font-bold",
				children: t(lang, {
					en: "Asha will speak again in a few minutes.",
					hi: "आशा कुछ मिनट में फिर बोलेगी."
				})
			}) : null,
			item.state === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-base font-bold",
				children: t(lang, {
					en: "Still open from earlier. No scolding.",
					hi: "पहले से खुली है. कोई डाँट नहीं."
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-lg",
				children: item.sentence
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hear, {
					text: item.sentence,
					label: t(lang, {
						en: "Hear this",
						hi: "इसे सुनें"
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							if (item.kind === "med") logDose(item.id, item.time, "taken");
							else logMeal(item.id);
						},
						children: primary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						onClick: () => snoozeKey(item.key, 10),
						children: t(lang, {
							en: "Remind me in 10 minutes",
							hi: "10 मिनट में याद दिलाएँ"
						})
					}),
					item.kind === "med" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => logDose(item.id, item.time, "skipped"),
						children: t(lang, {
							en: "Skip today",
							hi: "आज छोड़ें"
						})
					}) : null
				]
			})
		]
	});
}
function AshaApp() {
	const hydrated = useAsha((s) => s.hydrated);
	const hydrate = useAsha((s) => s.hydrate);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-center justify-center bg-linen px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "display text-6xl text-ink",
				children: "Asha"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-lg text-quiet",
				children: "A calm voice for the day."
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {});
}
function Shell() {
	const onboarded = useAsha((s) => s.onboarded);
	const tab = useAsha((s) => s.tab);
	const lang = useAsha((s) => s.lang);
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = lang === "hi" ? "hi" : "en";
	}, [lang]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-linen text-ink",
		onPointerDown: () => unlockAudio(),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex min-h-dvh w-full max-w-lg flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 px-4 pb-36",
					children: !onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboarding, {}) : tab === "meds" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MedsScreen, {}) : tab === "care" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CareScreen, {}) : tab === "talk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TalkScreen, {}) : tab === "sos" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SosScreen, {}) : tab === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsScreen, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayScreen, {})
				})]
			}),
			onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Nav, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Speaking, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReminderEngine, {})
		]
	});
}
function Header() {
	const lang = useAsha((s) => s.lang);
	const onboarded = useAsha((s) => s.onboarded);
	const tab = useAsha((s) => s.tab);
	const setTab = useAsha((s) => s.setTab);
	const openSettings = useAsha((s) => s.openSettings);
	const now = useNow();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-20 border-b border-line bg-linen/95 px-4 py-3 backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-lg items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sage text-paper",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Leaf, {
						className: "size-5",
						"aria-hidden": true
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "display text-2xl leading-none",
						children: "Asha"
					}), onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 truncate text-base text-quiet tabular-nums",
						children: [
							dateLabel(lang, now),
							" · ",
							clockLabel(lang, now)
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-base text-quiet",
						children: t(lang, {
							en: "Set up takes a few minutes.",
							hi: "सेटअप में कुछ मिनट."
						})
					})]
				}),
				onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": t(lang, {
						en: "Settings",
						hi: "सेटिंग"
					}),
					onClick: () => openSettings(),
					className: cn("inline-flex size-12 items-center justify-center rounded-full border border-line", tab === "settings" ? "bg-sage text-paper" : "bg-paper text-ink"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
						className: "size-5",
						"aria-hidden": true
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab("sos"),
					className: cn("min-h-12 rounded-full px-4 text-lg font-bold", tab === "sos" ? "bg-ink text-paper" : "bg-sos text-paper"),
					children: t(lang, {
						en: "Help",
						hi: "मदद"
					})
				})] }) : null
			]
		})
	});
}
var TABS = [
	{
		id: "today",
		en: "Today",
		hi: "आज",
		icon: Sun
	},
	{
		id: "meds",
		en: "Meds",
		hi: "दवा",
		icon: Pill
	},
	{
		id: "care",
		en: "Care",
		hi: "देखभाल",
		icon: HeartPulse
	},
	{
		id: "talk",
		en: "Talk",
		hi: "बात",
		icon: MessageCircle
	}
];
function Nav() {
	const lang = useAsha((s) => s.lang);
	const tab = useAsha((s) => s.tab);
	const setTab = useAsha((s) => s.setTab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": lang === "hi" ? "मुख्य" : "Main",
		className: "dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto grid w-full max-w-lg grid-cols-4",
			children: TABS.map((item) => {
				const Icon = item.icon;
				const on = tab === item.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setTab(item.id),
					className: cn("flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-bold", on ? "text-sage" : "text-quiet"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-5",
						"aria-hidden": true
					}), lang === "hi" ? item.hi : item.en]
				}, item.id);
			})
		})
	});
}
function Speaking() {
	const lang = useAsha((s) => s.lang);
	if (!useSpeech((s) => s.active)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-x-0 bottom-20 z-30 px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-paper",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg",
				children: t(lang, {
					en: "Asha is speaking",
					hi: "आशा बोल रही हैं"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => stopSpeaking(),
				className: "min-h-11 rounded-xl bg-paper px-4 font-bold text-ink",
				children: t(lang, {
					en: "Stop",
					hi: "रोकें"
				})
			})]
		})
	});
}
var SplitComponent = AshaApp;
//#endregion
export { SplitComponent as component };
