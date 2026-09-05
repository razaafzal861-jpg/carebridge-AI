import React, { useState, useEffect, useRef } from "react";
import {
  Mic, Camera, FileText, CheckCircle2, ChevronRight, ChevronLeft,
  ShieldCheck, Volume2, Upload, AlertTriangle, User, Clock, HelpCircle,
  Languages, Check, FilePlus2, Stethoscope, X, MicOff, RefreshCw, LogOut, Lock
} from "lucide-react";
import {
  startSession,
  sendTriageMessage,
  uploadDocumentFile,
  generateSummary,
  fetchDoctorQueue,
  updateConsultation
} from "./api";

/* ---------- Design tokens ---------- */
const T = {
  ink: "#1F2A24", teal: "#1B4B43", teal2: "#2F6E5F", sage: "#F2F6F1",
  paper: "#FFFFFF", marigold: "#E8A33D", marigoldD: "#C97F1E",
  coral: "#D6503F", mist: "#DCE7E1", mistD: "#C3D2CB",
};

const FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Inter:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
    .f-display { font-family: 'Baloo 2', 'Noto Nastaliq Urdu', system-ui, sans-serif; }
    .f-body { font-family: 'Inter', 'Noto Nastaliq Urdu', system-ui, sans-serif; }
    @keyframes breathe { 0%,100% { transform: scale(1); opacity:.55 } 50% { transform: scale(1.16); opacity:.15 } }
    @keyframes bar { 0%,100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
    .ring1 { animation: breathe 2.6s ease-in-out infinite; }
    .ring2 { animation: breathe 2.6s ease-in-out infinite; animation-delay: .5s; }
    .bar { animation: bar 1s ease-in-out infinite; transform-origin: center; }
  `}</style>
);

/* ---------- Languages (only these three; all fully translated) ---------- */
const LANGS = [
  { n: "हिन्दी", e: "Hindi", g: "अ", code: "hi" },
  { n: "English", e: "English", g: "A", code: "en" },
  { n: "اردو", e: "Urdu", g: "ا", code: "ur" },
];

// Web Speech API locale per language
const SPEECH_LOCALE = { hi: "hi-IN", en: "en-IN", ur: "ur-PK" };

/* ---------- i18n strings ---------- */
const STR = {
  hi: {
    brand: "केयरब्रिज", brandSub: "· ओपीडी काउंटर 4", session: "सत्र", help: "सहायता",
    langTitle: "अपनी भाषा चुनें", langSub: "जारी रखने के लिए भाषा चुनें", hearAloud: "आवाज़ में सुनें",
    consentTitle: "सहमति व गोपनीयता", consentSub: "शुरू करने से पहले आवश्यक",
    c1: "मेरी आवाज़ और उत्तर सुरक्षित रूप से रिकॉर्ड किए जाएँगे — केवल इस मुलाकात के लिए।",
    c2: "मेरे पुराने दस्तावेज़ स्कैन कर संरचित किए जाएँगे।",
    c3: "मेरा सारांश डॉक्टर व अस्पताल रिकॉर्ड (ABDM) से जोड़ा जाएगा।",
    loginAbha: "ABHA ID से लॉगिन", newPatient: "नए मरीज़ के रूप में जारी रखें",
    welcome: "स्वागत है", greetName: "नमस्ते, सुनीता जी",
    homeBlurb: "अब हम आपकी शिकायत के बारे में कुछ प्रश्न पूछेंगे — आप बोलकर या स्क्रीन पर छूकर उत्तर दे सकते हैं।",
    tokenLabel: "टोकन संख्या",
    q1: "आपको मुख्य रूप से क्या तकलीफ़ है?", opts1: ["सीने में दर्द", "बुखार", "पेट दर्द", "साँस लेने में तकलीफ़"],
    q2: "यह दर्द कब से शुरू हुआ?", opts2: ["आज", "2–3 दिन पहले", "1 हफ़्ते से", "1 महीने से ज़्यादा"],
    q3: "दर्द किस प्रकार का है?", opts3: ["दबाव जैसा", "तेज़ चुभन", "जलन जैसा", "भारीपन"],
    redFlag: "रेड-फ़्लैग लक्षण चिह्नित — ट्राइएज स्टाफ़ को सूचित किया गया",
    enoughInfo: "पर्याप्त जानकारी मिल गई — अगला चरण जारी रखें",
    speakOrTap: "माइक दबाकर बोलें, या ऊपर टैप करें",
    listening: "सुन रहा हूँ...", micUnsupported: "इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं — कृपया विकल्प चुनें",
    docsTitle: "पुराने दस्तावेज़ स्कैन करें", docsSub: "पर्ची, लैब रिपोर्ट व डिस्चार्ज समरी स्कैन करें",
    scanCam: "कैमरा से स्कैन करें", uploadFile: "फ़ाइल अपलोड करें", addMore: "एक और दस्तावेज़ जोड़ें",
    slipTitle: "पंजीकरण सफल!", slipSub: "आपकी ओपीडी टोकन पर्ची तैयार है",
    slipRoom: "कमरा नंबर 4 · सामान्य चिकित्सा विभाग (OPD)",
    slipWait: "अनुमानित प्रतीक्षा समय: 10–15 मिनट",
    slipSent: "आपकी बीमारी की जानकारी और पुराने पर्चे डॉक्टर के कंप्यूटर पर भेज दिए गए हैं।",
    slipNotice: "कृपया कमरा नंबर 4 के बाहर प्रतीक्षा करें। आपका टोकन स्क्रीन पर पुकारा जाएगा।",
    back: "पीछे",
    next_lang: "जारी रखें", next_consent: "सहमत हूँ, जारी रखें", next_home: "इतिहास शुरू करें",
    next_converse: "दस्तावेज़ स्कैन करें", next_docs: "टोकन पर्ची प्राप्त करें", next_slip: "अगला मरीज़ (नया सत्र)",
    helpTitle: "सहायता चाहिए?", helpBody: "काउंटर पर मौजूद सहायक को इशारा करें, वे तुरंत आपकी सहायता करेंगे।",
  },
  en: {
    brand: "Care Bridge", brandSub: "· OPD Counter 4", session: "session", help: "Help",
    langTitle: "Choose your language", langSub: "Select a language to continue", hearAloud: "Hear this aloud",
    consentTitle: "Consent & Privacy", consentSub: "Required before we begin",
    c1: "My voice and answers will be securely recorded — only for this visit.",
    c2: "My previous documents will be scanned and structured.",
    c3: "My summary will be linked to my doctor and hospital record (ABDM).",
    loginAbha: "Login with ABHA ID", newPatient: "Continue as new patient",
    welcome: "Welcome", greetName: "Hello, Sunita",
    homeBlurb: "We'll now ask a few questions about your complaint — you can answer by speaking or tapping the screen.",
    tokenLabel: "Token number",
    q1: "What is your main complaint today?", opts1: ["Chest pain", "Fever", "Stomach pain", "Difficulty breathing"],
    q2: "When did this pain start?", opts2: ["Today", "2–3 days ago", "1 week", "Over a month"],
    q3: "How would you describe the pain?", opts3: ["Pressure-like", "Sharp / stabbing", "Burning", "Heaviness"],
    redFlag: "Red-flag symptom detected — triage staff notified",
    enoughInfo: "Enough information gathered — continue to next step",
    speakOrTap: "Press the mic to speak, or tap an option above",
    listening: "Listening...", micUnsupported: "Voice recognition isn't supported in this browser — please tap an option",
    docsTitle: "Scan your previous documents", docsSub: "Scan prescriptions, lab reports & discharge summaries",
    scanCam: "Scan with camera", uploadFile: "Upload file", addMore: "Add another document",
    slipTitle: "Registration Completed!", slipSub: "Your OPD Token Slip is ready",
    slipRoom: "Room No. 4 · General Medicine OPD",
    slipWait: "Estimated wait time: 10–15 mins",
    slipSent: "Your symptom details and scanned prescriptions have been sent directly to the doctor.",
    slipNotice: "Please wait outside Room 4. Your token will be announced on the queue display.",
    back: "Back",
    next_lang: "Continue", next_consent: "I agree, continue", next_home: "Start history",
    next_converse: "Scan documents", next_docs: "Get OPD Token Slip", next_slip: "Next Patient (Reset Kiosk)",
    helpTitle: "Need help?", helpBody: "Wave to the floor assistant near this counter — they'll help right away.",
  },
  ur: {
    brand: "کیئر برج", brandSub: "· او پی ڈی کاؤنٹر 4", session: "سیشن", help: "مدد",
    langTitle: "اپنی زبان منتخب کریں", langSub: "جاری رکھنے کے لیے زبان منتخب کریں", hearAloud: "آواز میں سنیں",
    consentTitle: "رضامندی اور رازداری", consentSub: "شروع کرنے سے پہلے ضروری",
    c1: "میری آواز اور جوابات محفوظ طریقے سے ریکارڈ کیے جائیں گے — صرف اس وزٹ کے لیے۔",
    c2: "میرے پرانے کاغذات اسکین کر کے منظم کیے جائیں گے۔",
    c3: "میرا خلاصہ ڈاکٹر اور ہسپتال کے ریکارڈ (ABDM) سے منسلک کیا جائے گا۔",
    loginAbha: "ABHA ID سے لاگ ان کریں", newPatient: "نئے مریض کے طور پر جاری رکھیں",
    welcome: "خوش آمدید", greetName: "خوش آمدید، سنیتا جی",
    homeBlurb: "اب ہم آپ کی تکلیف کے بارے میں چند سوالات پوچھیں گے — آپ بول کر یا اسکرین کو چھو کر جواب دے سکتے ہیں۔",
    tokenLabel: "ٹوکن نمبر",
    q1: "آپ کو بنیادی طور پر کیا تکلیف ہے؟", opts1: ["سینے میں درد", "بخار", "پیٹ میں درد", "سانس لینے میں دشواری"],
    q2: "یہ درد کب سے شروع ہوا؟", opts2: ["آج", "2–3 دن پہلے", "1 ہفتے سے", "1 مہینے سے زیادہ"],
    q3: "درد کس قسم کا ہے؟", opts3: ["دباؤ جیسا", "تیز چبھن", "جلن جیسا", "بھاری پن"],
    redFlag: "خطرناک علامت کی نشاندہی — ٹریاج عملے کو مطلع کر دیا گیا",
    enoughInfo: "کافی معلومات مل گئیں — اگلے مرحلے کی طرف بڑھیں",
    speakOrTap: "بولنے کے لیے مائیک دبائیں، یا اوپر آپشن پر ٹیپ کریں",
    listening: "سن رہا ہے...", micUnsupported: "اس براؤزر میں آواز کی شناخت دستیاب نہیں — براہ کرم آپشن منتخب کریں",
    docsTitle: "پرانے کاغذات اسکین کریں", docsSub: "نسخے، لیب رپورٹس اور ڈسچارج سمری اسکین کریں",
    scanCam: "کیمرے سے اسکین کریں", uploadFile: "فائل اپ لوڈ کریں", addMore: "ایک اور دستاویز شامل کریں",
    slipTitle: "رجسٹریشن مکمل!", slipSub: "آپ کا او پی ڈی ٹوکن تیار ہے",
    slipRoom: "کمرہ نمبر 4 · جنرل میڈیسن او پی ڈی",
    slipWait: "متوقع انتظار کا وقت: 10–15 منٹ",
    slipSent: "آپ کی علامات اور اسکین شدہ نسخہ براہ راست ڈاکٹر کو بھیج دیا گیا ہے۔",
    slipNotice: "براہ کرم کاؤنٹر نمبر 4 کے باہر انتظار کریں۔ آپ کا ٹوکن اسکرین پر پکارا جائے گا۔",
    back: "پیچھے",
    next_lang: "جاری رکھیں", next_consent: "میں متفق ہوں، جاری رکھیں", next_home: "تاریخ شروع کریں",
    next_converse: "دستاویزات اسکین کریں", next_docs: "او پی ڈی ٹوکن حاصل کریں", next_slip: "اگلا مریض (نیا سیشن)",
    helpTitle: "مدد چاہیے؟", helpBody: "کاؤنٹر پر موجود اسسٹنٹ کو اشارہ کریں، وہ فوراً آپ کی مدد کریں گے۔",
  },
};

const STEP_KEYS = ["lang", "consent", "home", "converse", "docs", "slip"];

function Chrome({ t, idx, minutes, onHelp, onExitToGateway }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ background: T.teal, color: "#fff" }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center f-display font-bold text-sm" style={{ background: T.marigold, color: T.teal }}>M</div>
        <span className="f-display text-lg tracking-wide">{t.brand}</span>
        <span className="f-body text-xs opacity-60 ml-1">{t.brandSub}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          {STEP_KEYS.map((k, i) => (
            <div key={k} className="h-1.5 rounded-full transition-all"
              style={{ width: i === idx ? 22 : 8, background: i <= idx ? T.marigold : "rgba(255,255,255,.25)" }} />
          ))}
        </div>

        <button
          onClick={onExitToGateway}
          className="flex items-center gap-1.5 f-body text-xs px-3 py-1.5 rounded-full transition-all shadow-sm font-medium cursor-pointer"
          style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
          <LogOut size={13} /> Exit Kiosk
        </button>

        <div className="flex items-center gap-1 f-body text-xs opacity-80"><Clock size={13} /> {minutes}:00 {t.session}</div>
        <button onClick={onHelp} className="flex items-center gap-1 f-body text-xs px-2.5 py-1.5 rounded-full cursor-pointer" style={{ background: "rgba(255,255,255,.12)" }}>
          <HelpCircle size={14} /> {t.help}
        </button>
      </div>
    </div>
  );
}

function StepFooter({ t, label, onBack, onNext, nextDisabled, hideBack, rtl }) {
  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;
  return (
    <div className="flex items-center justify-between px-8 py-5 shrink-0" style={{ borderTop: `1px solid ${T.mist}`, background: T.paper }}>
      {!hideBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 f-body font-medium px-4 py-3 rounded-2xl" style={{ color: T.teal2 }}>
          <BackIcon size={18} /> {t.back}
        </button>
      ) : <span />}
      <button onClick={onNext} disabled={nextDisabled}
        className="flex items-center gap-2 f-display font-semibold text-lg px-8 py-3.5 rounded-2xl shadow-sm transition-opacity"
        style={{ background: nextDisabled ? T.mistD : T.marigold, color: nextDisabled ? "#8AA69C" : T.teal, opacity: nextDisabled ? 0.7 : 1 }}>
        {label} <NextIcon size={20} />
      </button>
    </div>
  );
}

function LangScreen({ t, chosen, setChosen }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 overflow-auto">
      <Languages size={30} style={{ color: T.marigold }} />
      <h1 className="f-display text-3xl font-semibold mt-3" style={{ color: T.ink }}>{t.langTitle}</h1>
      <p className="f-body text-sm opacity-60 mt-1" style={{ color: T.ink }}>{t.langSub}</p>
      <div className="grid grid-cols-3 gap-4 mt-9 w-full max-w-lg">
        {LANGS.map((l) => (
          <button key={l.e} onClick={() => setChosen(l.e)}
            className="flex flex-col items-center justify-center gap-1.5 rounded-3xl py-5 transition-all"
            style={{ background: chosen === l.e ? T.teal : T.paper, border: `2px solid ${chosen === l.e ? T.teal : T.mist}` }}>
            <span className="f-display text-2xl w-10 h-10 flex items-center justify-center rounded-full"
              style={{ background: chosen === l.e ? T.marigold : T.sage, color: chosen === l.e ? T.teal : T.teal2 }}>{l.g}</span>
            <span className="f-display font-semibold text-base" style={{ color: chosen === l.e ? "#fff" : T.ink }}>{l.n}</span>
            <span className="f-body text-[11px]" style={{ color: chosen === l.e ? T.mist : "#8A968F" }}>{l.e}</span>
          </button>
        ))}
      </div>
      <button className="flex items-center gap-2 f-body text-sm mt-8 px-4 py-2 rounded-full" style={{ color: T.teal2, background: T.sage }}>
        <Volume2 size={15} /> {t.hearAloud}
      </button>
    </div>
  );
}

function ConsentScreen({ t, agreed, setAgreed }) {
  const items = [t.c1, t.c2, t.c3];
  return (
    <div className="flex-1 flex flex-col items-center px-8 py-8 overflow-auto">
      <ShieldCheck size={28} style={{ color: T.marigold }} />
      <h1 className="f-display text-2xl font-semibold mt-2" style={{ color: T.ink }}>{t.consentTitle}</h1>
      <p className="f-body text-sm opacity-60" style={{ color: T.ink }}>{t.consentSub}</p>
      <div className="w-full max-w-xl mt-6 rounded-3xl p-6" style={{ background: T.paper, border: `1px solid ${T.mist}` }}>
        {items.map((txt, i) => (
          <label key={i} className="flex items-start gap-3 py-3 cursor-pointer">
            <span className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: agreed[i] ? T.teal : T.sage, border: `1.5px solid ${agreed[i] ? T.teal : T.mist}` }}
              onClick={() => setAgreed((a) => a.map((v, idx) => (idx === i ? !v : v)))}>
              {agreed[i] && <Check size={15} color="#fff" />}
            </span>
            <span className="f-body text-sm leading-relaxed" style={{ color: T.ink }}>{txt}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <button className="flex items-center gap-2 f-body font-medium text-sm px-5 py-3 rounded-2xl" style={{ background: T.sage, color: T.teal }}>
          <User size={16} /> {t.loginAbha}
        </button>
        <button className="flex items-center gap-2 f-body font-medium text-sm px-5 py-3 rounded-2xl" style={{ background: T.sage, color: T.teal }}>
          {t.newPatient}
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ t, token }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: T.sage }}>
        <User size={26} style={{ color: T.teal }} />
      </div>
      <p className="f-body text-sm opacity-60" style={{ color: T.ink }}>{t.welcome}</p>
      <h1 className="f-display text-3xl font-semibold mt-1" style={{ color: T.ink }}>{t.greetName}</h1>
      <p className="f-body text-sm mt-2 max-w-sm" style={{ color: "#5B6A62" }}>{t.homeBlurb}</p>
      <div className="flex items-center gap-4 mt-8 px-6 py-4 rounded-3xl" style={{ background: T.paper, border: `1px solid ${T.mist}` }}>
        <span className="f-body text-sm" style={{ color: T.ink }}>{t.tokenLabel}</span>
        <span className="f-display text-2xl font-bold px-3 py-1 rounded-xl" style={{ background: T.teal, color: T.marigold }}>{token || "A-142"}</span>
      </div>
    </div>
  );
}

/* ---------- Conversation screen: Dynamic Multi-Turn Gemini AI Triage & Voice ---------- */
function ConverseScreen({ t, code, token }) {
  const [currentQ, setCurrentQ] = useState(t.q1);
  const [currentOpts, setCurrentOpts] = useState(t.opts1);
  const [history, setHistory] = useState([]);
  const [flag, setFlag] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [enoughInfo, setEnoughInfo] = useState(false);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  const SpeechRecognitionAPI =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const micSupported = Boolean(SpeechRecognitionAPI);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, interim, aiThinking]);
  useEffect(() => {
    setHistory([]);
    setCurrentQ(t.q1);
    setCurrentOpts(t.opts1);
    setFlag(false);
    setInterim("");
    setEnoughInfo(false);
  }, [t]);

  const answer = async (text) => {
    const clean = (text || "").trim();
    if (!clean || aiThinking) return;

    const entry = { q: currentQ, a: clean };
    const nextHistory = [...history, entry];
    setHistory(nextHistory);
    setAiThinking(true);

    const fallbackLocal = () => {
      if (nextHistory.length === 1) {
        setCurrentQ(t.q2);
        setCurrentOpts(t.opts2);
      } else if (nextHistory.length === 2) {
        setCurrentQ(t.q3);
        setCurrentOpts(t.opts3);
      } else {
        setEnoughInfo(true);
      }
    };

    try {
      const res = await sendTriageMessage({
        token,
        question: currentQ,
        answer: clean,
        lang: code,
      });

      if (res && res.success && res.nextQuestion) {
        if (res.redFlag) setFlag(true);
        if (res.enoughInfo) setEnoughInfo(true);
        setCurrentQ(res.nextQuestion);
        if (res.quickOptions && res.quickOptions.length > 0) {
          setCurrentOpts(res.quickOptions);
        }
      } else {
        fallbackLocal();
      }
    } catch (e) {
      console.warn("Triage error fallback:", e);
      fallbackLocal();
    } finally {
      setAiThinking(false);
    }
  };

  const toggleMic = () => {
    if (!micSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.lang = SPEECH_LOCALE[code] || "en-IN";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let text = "";
      for (let r = e.resultIndex; r < e.results.length; r++) text += e.results[r][0].transcript;
      setInterim(text);
      if (e.results[e.results.length - 1].isFinal) {
        answer(text);
        setInterim("");
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setInterim(""); };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const isDone = enoughInfo || history.length >= 4;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {flag && (
        <div className="flex items-center gap-2 px-5 py-2.5 f-body text-sm font-medium shrink-0" style={{ background: "#FBEAE7", color: T.coral }}>
          <AlertTriangle size={16} /> {t.redFlag}
        </div>
      )}

      <div className="flex-1 overflow-auto px-8 py-6 flex flex-col gap-4">
        {history.map((h, idx) => (
          <div key={idx} className="flex flex-col gap-2 max-w-lg">
            <div className="f-body text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm self-start" style={{ background: T.sage, color: T.ink }}>{h.q}</div>
            <div className="f-display font-semibold text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm self-end" style={{ background: T.teal, color: "#fff" }}>{h.a}</div>
          </div>
        ))}

        {!isDone && (
          <div className="flex flex-col gap-3 max-w-lg">
            <div className="f-body text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm self-start flex items-center gap-2" style={{ background: T.sage, color: T.ink }}>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">AI</span>
              {currentQ}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentOpts.map((o) => (
                <button key={o} onClick={() => answer(o)} disabled={aiThinking}
                  className="f-body text-sm font-medium px-4 py-2.5 rounded-full hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                  style={{ background: T.paper, border: `1.5px solid ${T.mist}`, color: T.teal }}>
                  {o}
                </button>
              ))}
            </div>
            {aiThinking && (
              <div className="f-body text-xs italic px-3 py-1 rounded-lg self-start text-teal-700 animate-pulse">
                ✨ Gemini AI डॉक्टर विश्लेषण कर रहे हैं...
              </div>
            )}
            {listening && (
              <div className="f-body text-sm italic px-4 py-2 rounded-2xl self-end" style={{ background: "#FFF6E9", color: T.marigoldD }}>
                {interim || "…"}
              </div>
            )}
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-2 f-body text-sm px-4 py-2.5 rounded-2xl self-start" style={{ background: T.sage, color: T.teal2 }}>
            <CheckCircle2 size={16} /> {t.enoughInfo}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-col items-center justify-center py-5 shrink-0 gap-2" style={{ borderTop: `1px solid ${T.mist}` }}>
        <div className="flex items-center justify-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {listening && (
              <>
                <span className="ring1 absolute inset-0 rounded-full" style={{ background: T.coral }} />
                <span className="ring2 absolute inset-2 rounded-full" style={{ background: T.coral }} />
              </>
            )}
            <button onClick={toggleMic} disabled={!micSupported || isDone}
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-md disabled:opacity-40"
              style={{ background: listening ? T.coral : T.teal }}>
              {micSupported ? <Mic size={22} color="#fff" /> : <MicOff size={22} color="#fff" />}
            </button>
          </div>
          {listening && (
            <div className="ml-4 flex items-end gap-1 h-8">
              {[6, 14, 22, 12, 18, 8].map((h, idx) => (
                <span key={idx} className="bar w-1.5 rounded-full" style={{ height: h, background: T.marigoldD, animationDelay: `${idx * 0.08}s` }} />
              ))}
            </div>
          )}
        </div>
        <span className="f-body text-xs opacity-70 text-center px-6" style={{ color: micSupported ? T.ink : T.coral }}>
          {micSupported ? (listening ? t.listening : t.speakOrTap) : t.micUnsupported}
        </span>
      </div>
    </div>
  );
}

function DocsScreen({ t, token, docs, setDocs }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDocumentFile(token, file);
      if (res.success && res.document) {
        setDocs((prev) => [...prev, res.document]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddMock = async () => {
    setUploading(true);
    const mockNames = [
      { name: "पर्ची · Apollo Clinic", tag: "प्रिस्क्रिप्शन", type: "Prescription" },
      { name: "लैब रिपोर्ट · CBC", tag: "लैब रिपोर्ट", type: "Lab report" },
      { name: "डिस्चार्ज समरी · Govt. Hospital", tag: "डिस्चार्ज समरी", type: "Discharge summary" }
    ];
    const nextMock = mockNames[docs.length % mockNames.length];
    try {
      const res = await uploadDocumentFile(token, null, nextMock.name, nextMock.type);
      if (res.success && res.document) {
        setDocs((prev) => [...prev, res.document]);
      } else {
        setDocs((prev) => [...prev, { name: nextMock.name, tag: nextMock.tag, date: "आज" }]);
      }
    } catch (e) {
      setDocs((prev) => [...prev, { name: nextMock.name, tag: nextMock.tag, date: "आज" }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center px-8 py-8 overflow-auto">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
      <FileText size={26} style={{ color: T.marigold }} />
      <h1 className="f-display text-2xl font-semibold mt-2" style={{ color: T.ink }}>{t.docsTitle}</h1>
      <p className="f-body text-sm opacity-60" style={{ color: T.ink }}>{t.docsSub}</p>
      <div className="flex gap-4 mt-6">
        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 px-8 py-6 rounded-3xl cursor-pointer hover:opacity-90 transition-opacity" style={{ background: T.teal, color: "#fff" }}>
          <Camera size={22} /> <span className="f-body text-sm font-medium">{t.scanCam}</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 px-8 py-6 rounded-3xl cursor-pointer hover:opacity-90 transition-opacity" style={{ background: T.sage, color: T.teal }}>
          <Upload size={22} /> <span className="f-body text-sm font-medium">{t.uploadFile}</span>
        </button>
      </div>
      <div className="w-full max-w-xl mt-7 flex flex-col gap-3">
        {docs.map((d, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 rounded-2xl" style={{ background: T.paper, border: `1px solid ${T.mist}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.sage }}>
                <FileText size={16} style={{ color: T.teal2 }} />
              </div>
              <div>
                <div className="f-body text-sm font-medium" style={{ color: T.ink }}>{d.name}</div>
                <div className="f-body text-xs opacity-50">{d.tag} · {d.date || '3 जुलाई'}</div>
              </div>
            </div>
            <CheckCircle2 size={18} style={{ color: T.teal2 }} />
          </div>
        ))}
        <button onClick={handleAddMock} disabled={uploading}
          className="flex items-center justify-center gap-2 f-body text-sm font-medium px-5 py-3.5 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors"
          style={{ border: `1.5px dashed ${T.mistD}`, color: T.teal2 }}>
          <FilePlus2 size={16} /> {uploading ? "स्कैन हो रहा है..." : t.addMore}
        </button>
      </div>
    </div>
  );
}

function TokenSlipScreen({ t, token, onNewPatient }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 overflow-auto text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: "#E8F5E9", color: "#2E7D32" }}>
        <CheckCircle2 size={36} />
      </div>
      <h1 className="f-display text-3xl font-bold" style={{ color: T.ink }}>{t.slipTitle}</h1>
      <p className="f-body text-sm opacity-60 mt-1" style={{ color: T.ink }}>{t.slipSub}</p>

      {/* Hospital Paper Token Slip Card */}
      <div className="w-full max-w-md mt-5 rounded-3xl p-6 shadow-md border text-left relative overflow-hidden"
        style={{ background: "#FFFFFF", borderColor: T.mist }}>
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.mist }}>
          <div>
            <div className="f-display font-bold text-sm tracking-wide" style={{ color: T.teal }}>DISTRICT CIVIL HOSPITAL</div>
            <div className="f-body text-[11px] text-gray-400">OPD Outpatient Department · Token Slip</div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>

        {/* Big Token Number Display */}
        <div className="my-5 text-center p-4 rounded-2xl" style={{ background: T.sage }}>
          <span className="f-body text-xs text-gray-500 uppercase tracking-wider block mb-1">{t.tokenLabel}</span>
          <span className="f-display text-5xl font-black tracking-tight" style={{ color: T.teal }}>
            {token || "A-142"}
          </span>
        </div>

        {/* Room & Instructions */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
            <span className="text-gray-500 font-medium">Assigned Counter:</span>
            <span className="font-bold text-gray-800">{t.slipRoom}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
            <span className="text-gray-500 font-medium">Estimated Wait:</span>
            <span className="font-bold text-amber-700">{t.slipWait}</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl text-center text-xs leading-relaxed" style={{ background: "#F2F6F1", color: T.teal2 }}>
          {t.slipSent}
        </div>
        <p className="text-[11px] text-center text-gray-400 mt-3 italic">
          {t.slipNotice}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-4 f-body text-xs px-4 py-2 rounded-full" style={{ background: T.sage, color: T.teal2 }}>
        <ShieldCheck size={14} /> Linked with ABHA Record (ABDM)
      </div>

      <button
        onClick={onNewPatient}
        className="mt-5 flex items-center gap-2 f-display font-semibold text-base px-8 py-3 rounded-2xl shadow-md cursor-pointer transition-transform active:scale-95"
        style={{ background: T.marigold, color: T.teal }}>
        <RefreshCw size={16} /> {t.next_slip}
      </button>
    </div>
  );
}

function DoctorDashboard({ onLogout }) {
  const [data, setData] = useState({ queue: [], stats: {} });
  const [selectedToken, setSelectedToken] = useState(null);
  const [notes, setNotes] = useState("");

  const loadQueue = async () => {
    const res = await fetchDoctorQueue();
    if (res.success) {
      setData(res);
      if (res.queue?.length > 0 && !selectedToken) {
        setSelectedToken(res.queue[0].token);
        setNotes(res.queue[0].doctorNotes || "");
      }
    }
  };

  useEffect(() => { loadQueue(); }, []);

  const selectedPatient = data.queue?.find(p => p.token === selectedToken) || data.queue?.[0];

  const handleComplete = async () => {
    if (!selectedPatient) return;
    await updateConsultation(selectedPatient.token, {
      doctorNotes: notes,
      status: 'completed'
    });
    await loadQueue();
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden bg-white">
      {/* Doctor Top Navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0" style={{ background: T.teal, color: "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center f-display font-bold text-sm" style={{ background: T.marigold, color: T.teal }}>Dr</div>
          <div>
            <div className="f-display text-base font-bold leading-tight">Dr. A. Sharma, MD</div>
            <div className="f-body text-[11px] opacity-70">General Medicine · OPD Counter 4</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 f-body text-xs px-3.5 py-1.5 rounded-full font-medium cursor-pointer transition-colors"
            style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
            <LogOut size={13} /> Exit Portal
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b shrink-0" style={{ borderColor: T.mist, background: T.sage }}>
        <div className="bg-white p-3 rounded-2xl border" style={{ borderColor: T.mist }}>
          <div className="text-xs text-gray-500 font-medium">OPD Waiting</div>
          <div className="text-2xl font-bold mt-0.5" style={{ color: T.teal }}>{data.stats?.waiting ?? 3}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border" style={{ borderColor: T.mist }}>
          <div className="text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertTriangle size={12} /> Red-Flag Alerts
          </div>
          <div className="text-2xl font-bold mt-0.5 text-red-600">{data.stats?.emergency ?? 1}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border" style={{ borderColor: T.mist }}>
          <div className="text-xs text-gray-500 font-medium">Completed</div>
          <div className="text-2xl font-bold mt-0.5" style={{ color: T.teal2 }}>{data.stats?.completed ?? 1}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border" style={{ borderColor: T.mist }}>
          <div className="text-xs text-gray-500 font-medium">Avg Wait Time</div>
          <div className="text-2xl font-bold mt-0.5 text-amber-600">{data.stats?.avgWaitMin ?? "12 min"}</div>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Queue List */}
        <div className="w-80 border-r flex flex-col overflow-hidden shrink-0" style={{ borderColor: T.mist, background: "#FAFBF9" }}>
          <div className="p-3 border-b flex items-center justify-between font-semibold text-xs text-gray-500 uppercase tracking-wider" style={{ borderColor: T.mist }}>
            <span>Live OPD Queue</span>
            <button onClick={loadQueue} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 flex flex-col gap-2.5">
            {data.queue?.map((p) => {
              const isSelected = p.token === selectedToken;
              const isRed = p.acuity === 'RED';
              return (
                <div key={p.token} onClick={() => { setSelectedToken(p.token); setNotes(p.doctorNotes || ""); }}
                  className="p-3 rounded-2xl border cursor-pointer transition-all"
                  style={{
                    background: isSelected ? "#EBF3F0" : "#FFFFFF",
                    borderColor: isSelected ? T.teal : (isRed ? "#F8D7DA" : T.mist),
                    borderLeftWidth: isRed ? 4 : (isSelected ? 3 : 1),
                    borderLeftColor: isRed ? T.coral : (isSelected ? T.teal : T.mist)
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs px-2 py-0.5 rounded-lg" style={{ background: isRed ? "#FBEAE7" : T.sage, color: isRed ? T.coral : T.teal }}>
                      {p.token}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: p.status === 'completed' ? "#E8F5E9" : (p.status === 'in-consultation' ? "#FFF3E0" : "#F3F4F6"),
                        color: p.status === 'completed' ? "#2E7D32" : (p.status === 'in-consultation' ? "#E65100" : "#555")
                      }}>
                      {p.status}
                    </span>
                  </div>
                  <div className="font-semibold text-sm mt-1" style={{ color: T.ink }}>{p.patientName}</div>
                  <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.complaint}</div>
                  {isRed && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold mt-1 text-red-600">
                      <AlertTriangle size={11} /> Red-Flag Triage Priority
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Patient Details & Consultation notes */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          {selectedPatient ? (
            <>
              <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: T.mist }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold" style={{ color: T.ink }}>{selectedPatient.patientName}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: T.teal, color: T.marigold }}>{selectedPatient.token}</span>
                    {selectedPatient.acuity === 'RED' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertTriangle size={12} /> Emergency Priority
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Age: {selectedPatient.age || 42} · {selectedPatient.gender || 'Female'} · ABHA: 91-4521-8890-1234</div>
                </div>
                <div className="text-right text-xs text-gray-400">Arrived at {selectedPatient.time || '10:45 AM'}</div>
              </div>

              <div className="rounded-2xl border p-4 bg-emerald-50/40" style={{ borderColor: T.mist }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                  <Stethoscope size={15} /> AI Structured Clinical Summary
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border" style={{ borderColor: T.mist }}>
                    <span className="font-semibold text-gray-500 block mb-1">Chief Complaint</span>
                    <span className="text-gray-900 font-medium">{selectedPatient.complaint}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border" style={{ borderColor: T.mist }}>
                    <span className="font-semibold text-gray-500 block mb-1">Allergies & Warnings</span>
                    <span className="text-red-700 font-medium">Allergic to Penicillin (2019 report)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border" style={{ borderColor: T.mist }}>
                    <span className="font-semibold text-gray-500 block mb-1">Prior Meds (from Rx scan)</span>
                    <span className="text-gray-800">Tab Ecosprin 75mg, Tab Pantocid 40mg</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border" style={{ borderColor: T.mist }}>
                    <span className="font-semibold text-gray-500 block mb-1">Investigations</span>
                    <span className="text-gray-800">CBC normal (3 Jul)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Doctor Prescription & Advice</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter examination findings, Rx medications, or advice..."
                  className="w-full text-sm p-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ borderColor: T.mist }}
                />
                <div className="flex justify-end gap-3 mt-1">
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl shadow-sm text-white cursor-pointer hover:opacity-95"
                    style={{ background: T.teal }}>
                    <CheckCircle2 size={16} /> Mark Completed & Call Next Patient
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-12 text-sm">No patient selected from the queue</div>
          )}
        </div>
      </div>
    </div>
  );
}

function GatewayScreen({ onSelectPatient, onSelectDoctor }) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 f-body" style={{ background: "#E7ECE6" }}>
      {FONTS}
      <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border" style={{ borderColor: T.mist }}>
        <div className="px-8 py-6 flex items-center justify-between border-b" style={{ background: T.teal, color: "#fff" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center f-display font-bold text-lg" style={{ background: T.marigold, color: T.teal }}>M</div>
            <div>
              <h1 className="f-display text-2xl font-bold tracking-wide">CareBridge · केयरब्रिज</h1>
              <p className="f-body text-xs opacity-70">Government Hospital AI OPD Smart Intake & Triage System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-80">
            <Clock size={14} /> OPD Active · Counter 4
          </div>
        </div>

        <div className="p-10 flex flex-col items-center text-center">
          <h2 className="f-display text-3xl font-bold" style={{ color: T.ink }}>Select Your Portal / पोर्टल चुनें</h2>
          <p className="f-body text-sm text-gray-500 mt-1 max-w-md">
            Choose whether you are a patient registering for consultation or a hospital OPD physician.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full max-w-2xl">
            {/* Patient Kiosk Card */}
            <div onClick={onSelectPatient}
              className="group p-8 rounded-3xl border-2 cursor-pointer transition-all hover:shadow-xl flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: T.sage, borderColor: T.mist }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                style={{ background: T.teal, color: "#fff" }}>
                <User size={36} />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2" style={{ background: T.marigold, color: T.teal }}>
                Patient Entry
              </span>
              <h3 className="f-display text-2xl font-bold" style={{ color: T.ink }}>Patient Kiosk</h3>
              <p className="f-display text-sm font-medium mt-0.5" style={{ color: T.teal2 }}>मरीज़ कियोस्क · مریض کیوسک</p>
              <p className="f-body text-xs text-gray-500 mt-3 leading-relaxed">
                Choose language, speak symptoms, scan previous prescriptions, and get your instant OPD token slip.
              </p>
              <button className="mt-6 flex items-center gap-2 f-display font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm text-white transition-opacity group-hover:opacity-90 cursor-pointer"
                style={{ background: T.teal }}>
                Start Patient Intake <ChevronRight size={16} />
              </button>
            </div>

            {/* Doctor Portal Card */}
            <div onClick={onSelectDoctor}
              className="group p-8 rounded-3xl border-2 cursor-pointer transition-all hover:shadow-xl flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: "#FFFFFF", borderColor: T.mist }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                style={{ background: "#E8F5E9", color: T.teal }}>
                <Stethoscope size={36} />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 bg-emerald-100 text-emerald-800">
                Staff & Physician
              </span>
              <h3 className="f-display text-2xl font-bold" style={{ color: T.ink }}>Doctor Portal</h3>
              <p className="f-display text-sm font-medium mt-0.5" style={{ color: T.teal2 }}>डॉक्टर पोर्टल · ڈاکٹر پورٹل</p>
              <p className="f-body text-xs text-gray-500 mt-3 leading-relaxed">
                View live OPD queue with red-flag triage priority, read AI clinical summaries, and write consultation notes.
              </p>
              <button className="mt-6 flex items-center gap-2 f-display font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-opacity group-hover:opacity-90 cursor-pointer"
                style={{ background: T.marigold, color: T.teal }}>
                Doctor Login <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorLoginScreen({ onLoginSuccess, onBack }) {
  const [pin, setPin] = useState("4401");
  const handleLogin = (e) => {
    e?.preventDefault();
    onLoginSuccess();
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 f-body" style={{ background: "#E7ECE6" }}>
      {FONTS}
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 border text-center relative" style={{ borderColor: T.mist }}>
        <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 flex items-center gap-1 text-xs font-medium cursor-pointer">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: T.sage, color: T.teal }}>
          <Stethoscope size={30} />
        </div>
        <h2 className="f-display text-2xl font-bold" style={{ color: T.ink }}>Doctor Login</h2>
        <p className="f-body text-xs text-gray-500 mt-1">Government Hospital OPD Consultation Station</p>

        <div className="mt-6 p-4 rounded-2xl text-left border bg-gray-50" style={{ borderColor: T.mist }}>
          <div className="text-xs text-gray-400 font-semibold uppercase">Assigned Physician</div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">Dr. A. Sharma, MD (General Medicine)</div>
          <div className="text-xs text-gray-500 mt-0.5">OPD Counter 4 · Civil Hospital</div>
        </div>

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4 text-left">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Doctor PIN / Passcode</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              className="w-full p-3 rounded-2xl border text-center font-bold tracking-widest text-lg outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: T.mist }}
            />
          </div>
          <button type="submit"
            className="w-full py-3.5 rounded-2xl f-display font-semibold text-base shadow-sm text-white cursor-pointer transition-transform active:scale-98 mt-1"
            style={{ background: T.teal }}>
            Sign In to OPD Station
          </button>
        </form>
      </div>
    </div>
  );
}

function PatientKioskApp({ onExitToGateway }) {
  const [step, setStep] = useState("lang");
  const [lang, setLang] = useState("Hindi");
  const [token, setToken] = useState("A-142");
  const [agreed, setAgreed] = useState([false, false, false]);
  const [docs, setDocs] = useState([
    { name: "पर्ची · Apollo Clinic", tag: "प्रिस्क्रिप्शन", date: "12 जून" },
    { name: "लैब रिपोर्ट · CBC", tag: "लैब रिपोर्ट", date: "3 जुलाई" }
  ]);
  const [showHelp, setShowHelp] = useState(false);

  const activeLangEntry = LANGS.find((l) => l.e === lang) || LANGS[0];
  const code = activeLangEntry.code;
  const t = STR[code];
  const rtl = code === "ur";

  const idx = STEP_KEYS.indexOf(step);

  const handleStartSession = async () => {
    try {
      const res = await startSession({
        lang,
        agreed,
        patientName: lang === "Hindi" ? "सुनीता देवी" : (lang === "Urdu" ? "سنیتا دیوی" : "Sunita Devi")
      });
      if (res.success && res.token) {
        setToken(res.token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetForNewPatient = () => {
    setStep("lang");
    setAgreed([false, false, false]);
    setDocs([
      { name: "पर्ची · Apollo Clinic", tag: "प्रिस्क्रिप्शन", date: "12 जून" }
    ]);
  };

  const go = async (dir) => {
    const ni = idx + dir;
    if (step === "consent" && dir > 0) {
      await handleStartSession();
    }
    if (step === "docs" && dir > 0) {
      // Trigger summary generation on backend so patient is in doctor queue
      try {
        await generateSummary(token, code);
      } catch (e) {
        console.error(e);
      }
    }
    if (step === "slip" && dir > 0) {
      handleResetForNewPatient();
      return;
    }
    if (ni >= 0 && ni < STEP_KEYS.length) setStep(STEP_KEYS[ni]);
  };

  const nextLabels = {
    lang: t.next_lang,
    consent: t.next_consent,
    home: t.next_home,
    converse: t.next_converse,
    docs: t.next_docs,
    slip: t.next_slip,
  };
  const nextDisabled = step === "consent" && !agreed.every(Boolean);

  return (
    <div className="w-full flex items-center justify-center f-body" style={{ background: "#E7ECE6", minHeight: "100vh", padding: 20 }}>
      {FONTS}
      <div dir={rtl ? "rtl" : "ltr"} className="w-full flex flex-col overflow-hidden rounded-[28px] shadow-2xl relative"
        style={{ maxWidth: 940, height: 650, background: T.sage }}>
        
        <Chrome t={t} idx={idx} minutes={7} onHelp={() => setShowHelp(true)} onExitToGateway={onExitToGateway} />
        
        {step === "lang" && <LangScreen t={t} chosen={lang} setChosen={setLang} />}
        {step === "consent" && <ConsentScreen t={t} agreed={agreed} setAgreed={setAgreed} />}
        {step === "home" && <HomeScreen t={t} token={token} />}
        {step === "converse" && <ConverseScreen t={t} code={code} token={token} />}
        {step === "docs" && <DocsScreen t={t} token={token} docs={docs} setDocs={setDocs} />}
        {step === "slip" && <TokenSlipScreen t={t} token={token} onNewPatient={handleResetForNewPatient} />}
        
        {step !== "slip" && (
          <StepFooter t={t} label={nextLabels[step]} onBack={() => go(-1)}
            onNext={() => go(1)}
            nextDisabled={nextDisabled} hideBack={idx === 0} rtl={rtl} />
        )}

        {showHelp && (
          <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: "rgba(31,42,36,0.45)" }}>
            <div className="bg-white rounded-3xl p-7 max-w-sm w-full mx-6 relative shadow-xl">
              <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 cursor-pointer" style={{ color: "#8A968F" }}><X size={18} /></button>
              <HelpCircle size={22} style={{ color: T.marigold }} />
              <h3 className="f-display text-lg font-semibold mt-2" style={{ color: T.ink }}>{t.helpTitle}</h3>
              <p className="f-body text-sm mt-1.5" style={{ color: "#5B6A62" }}>{t.helpBody}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [portalMode, setPortalMode] = useState("gateway"); // "gateway" | "patient" | "doctor" | "doctor-login"

  if (portalMode === "patient") {
    return <PatientKioskApp onExitToGateway={() => setPortalMode("gateway")} />;
  }

  if (portalMode === "doctor-login") {
    return (
      <DoctorLoginScreen
        onLoginSuccess={() => setPortalMode("doctor")}
        onBack={() => setPortalMode("gateway")}
      />
    );
  }

  if (portalMode === "doctor") {
    return (
      <div className="w-full flex items-center justify-center f-body" style={{ background: "#E7ECE6", minHeight: "100vh", padding: 20 }}>
        {FONTS}
        <div className="w-full flex flex-col overflow-hidden rounded-[28px] shadow-2xl relative"
          style={{ maxWidth: 980, height: 670, background: "#fff" }}>
          <DoctorDashboard onLogout={() => setPortalMode("gateway")} />
        </div>
      </div>
    );
  }

  return (
    <GatewayScreen
      onSelectPatient={() => setPortalMode("patient")}
      onSelectDoctor={() => setPortalMode("doctor-login")}
    />
  );
}
