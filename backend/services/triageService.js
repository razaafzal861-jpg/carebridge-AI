/**
 * CareBridge AI Triage & Clinical Reasoning Engine
 */

const RED_FLAG_KEYWORDS = [
  'chest pain', 'heart', 'radiat', 'left arm', 'jaw pain', 'sweating', 'diaphoresis',
  'seene mein dard', 'chhati', 'dil', 'dil ka daura', 'paseena', 'sans', 'saans',
  'seene mein jalan', 'ghutan', 'dard',
  'breathless', 'difficulty breathing', 'shortness of breath', 'can\'t breathe', 'wheezing',
  'saans lene mein takleef', 'dam ghutna',
  'unconscious', 'fainted', 'seizure', 'fits', 'behosh', 'chakkar',
  'vomiting blood', 'blood in stool', 'khoon ki ulti'
];

function detectRedFlags(text = '', selections = []) {
  const combined = (text + ' ' + (Array.isArray(selections) ? selections.join(' ') : '')).toLowerCase();
  for (const kw of RED_FLAG_KEYWORDS) {
    if (combined.includes(kw.toLowerCase())) {
      return {
        hasRedFlag: true,
        trigger: kw,
        reason: 'Potential acute emergency symptom detected requiring priority triage.',
        acuity: 'RED'
      };
    }
  }
  return {
    hasRedFlag: false,
    trigger: null,
    reason: 'Standard non-emergency presentation.',
    acuity: 'GREEN'
  };
}

const QUESTION_BANK = {
  chest_pain: {
    hi: [
      { q: 'यह दर्द कब से शुरू हुआ?', opts: ['आज', '2–3 दिन पहले', '1 हफ्ते से', '1 महीने से ज्यादा'] },
      { q: 'दर्द किस प्रकार का है?', opts: ['दबाव जैसा', 'तेज चुभन', 'जलन जैसा', 'भारीपन'] },
      { q: 'क्या यह दर्द कहीं और फैल रहा है?', opts: ['बाएं हाथ में', 'गर्दन या जबड़े में', 'सिर्फ छाती में', 'पीठ की तरफ'] }
    ],
    en: [
      { q: 'When did this pain start?', opts: ['Today', '2–3 days ago', '1 week', 'Over a month'] },
      { q: 'How would you describe the pain?', opts: ['Pressure-like', 'Sharp / stabbing', 'Burning', 'Heaviness'] },
      { q: 'Does the pain spread anywhere?', opts: ['To left arm', 'To jaw / neck', 'No, stays in chest', 'Towards back'] }
    ],
    ur: [
      { q: 'یہ درد کب سے شروع ہوا؟', opts: ['آج', '2–3 دن پہلے', '1 ہفتے سے', '1 مہینے سے زیادہ'] },
      { q: 'درد کس قسم کا ہے؟', opts: ['دباؤ جیسا', 'تیز چبھن', 'جلن جیسا', 'بھاری پن'] },
      { q: 'کیا یہ درد کہیں اور پھیل رہا ہے؟', opts: ['بائیں بازو میں', 'گردن یا جبڑے میں', 'صرف سینے میں', 'پیٹھ کی طرف'] }
    ]
  },
  fever: {
    hi: [
      { q: 'बुखार कितने दिनों से आ रहा है?', opts: ['आज से (हल्का)', '2-3 दिन से (तेज)', '1 हफ्ते से ज्यादा', 'ठंड लगकर आ रहा है'] },
      { q: 'बुखार के साथ और क्या लक्षण हैं?', opts: ['खांसी / गले में खराश', 'बदन दर्द / सिरदर्द', 'उल्टी / दस्त', 'पेशाब में जलन'] },
      { q: 'क्या आपने बुखार की कोई दवा ली है?', opts: ['पैरासिटामोल ली है', 'कोई दवा नहीं ली', 'एंटीबायोटिक ली', 'घरेलू नुस्खा'] }
    ],
    en: [
      { q: 'How long have you had the fever?', opts: ['Since today (mild)', '2–3 days (high grade)', 'Over 1 week', 'Comes with chills'] },
      { q: 'Any associated symptoms with fever?', opts: ['Cough / sore throat', 'Body ache / headache', 'Nausea / loose stools', 'Burning urination'] },
      { q: 'Have you taken any medication for it?', opts: ['Took Paracetamol', 'No medication taken', 'Took antibiotics', 'Home remedy'] }
    ],
    ur: [
      { q: 'بخار کتنے دنوں سے آ رہا ہے؟', opts: ['آج سے (ہلکا)', '2-3 دن سے (تیز)', '1 ہفتے سے زیادہ', 'سردی لگ کر آ رہا ہے'] },
      { q: 'بخار کے ساتھ اور کیا علامات ہیں؟', opts: ['کھانسی / گلے میں خراش', 'جسم میں درد / سردرد', 'الٹی / دست', 'پیشاب میں جلن'] },
      { q: 'کیا آپ نے بخار کی کوئی دوا لی ہے؟', opts: ['پیراسیٹامول لی ہے', 'کوئی دوا نہیں لی', 'اینٹی بائیوٹک لی', 'گھریلو ٹوٹکہ'] }
    ]
  },
  stomach_pain: {
    hi: [
      { q: 'दर्द पेट के किस हिस्से में ज्यादा है?', opts: ['ऊपरी पेट में (छाती के नीचे)', 'निचले पेट में (दाएं या बाएं)', 'पूरे पेट में मरोड़', 'नाभि के आसपास'] },
      { q: 'दर्द किस तरह का महसूस होता है?', opts: ['मरोड़ जैसा', 'तेज जलन (एसिडिटी)', 'लगातार मीठा दर्द', 'रुक-रुक कर'] },
      { q: 'क्या उल्टी या दस्त की शिकायत भी है?', opts: ['हाँ, उल्टी हो रही है', 'हाँ, पतले दस्त हैं', 'दोनों हो रहे हैं', 'नहीं उल्टी/दस्त नहीं'] }
    ],
    en: [
      { q: 'Where is the pain located in your abdomen?', opts: ['Upper abdomen (epigastric)', 'Lower abdomen (right/left)', 'All over cramping', 'Around navel'] },
      { q: 'What does the pain feel like?', opts: ['Cramping / colic', 'Burning (acidity)', 'Constant ache', 'Intermittent'] },
      { q: 'Do you have vomiting or loose motions?', opts: ['Yes, vomiting', 'Yes, loose stools', 'Both vomiting & stools', 'No vomiting or diarrhea'] }
    ],
    ur: [
      { q: 'درد پیٹ کے کس حصے میں زیادہ ہے؟', opts: ['اوپری پیٹ میں', 'نچلے پیٹ میں', 'پورے پیٹ میں مروڑ', 'ناف کے ارد گرد'] },
      { q: 'درد کس قسم کا ہے؟', opts: ['مروڑ جیسا', 'جلن جیسا (تیزابیت)', 'مسلسل درد', 'رک رک کر'] },
      { q: 'کیا الٹی یا دست کی شکایت بھی ہے؟', opts: ['ہاں، الٹی ہو رہی ہے', 'ہاں، پتلے دست ہیں', 'دونوں ہو رہے ہیں', 'نہیں الٹی/دست نہیں'] }
    ]
  },
  breathing: {
    hi: [
      { q: 'साँस लेने में यह तकलीफ़ कब होती है?', opts: ['चलने या सीढ़ियाँ चढ़ने पर', 'लेटने पर बढ़ जाती है', 'लगातार बनी रहती है', 'खांसी के दौरे के साथ'] },
      { q: 'क्या सीने से घरघराहट की आवाज़ आती है?', opts: ['हाँ, सीटी जैसी आवाज़ आती है', 'सूखी तेज खांसी है', 'बलगम के साथ खांसी है', 'घरघराहट नहीं है'] },
      { q: 'क्या आपको पहले से दमा (अस्थमा) की बीमारी है?', opts: ['हाँ, इनहेलर लेता हूँ', 'हाँ, पुरानी बीमारी है', 'पहली बार ऐसा हुआ है', 'कभी जाँच नहीं कराई'] }
    ],
    en: [
      { q: 'When does this difficulty in breathing occur?', opts: ['On walking / exertion', 'Worse when lying flat', 'Constant throughout', 'With cough attacks'] },
      { q: 'Is there any wheezing or chest sound?', opts: ['Yes, wheezing / whistling', 'Dry hacking cough', 'Cough with phlegm', 'No chest sound'] },
      { q: 'Do you have a history of asthma or allergy?', opts: ['Yes, use inhaler', 'Yes, chronic condition', 'First time episode', 'Never diagnosed'] }
    ],
    ur: [
      { q: 'سانس لینے میں یہ تکلیف کب ہوتی ہے؟', opts: ['چلنے یا سیڑھیاں چڑھنے پر', 'لیٹنے پر بڑھ جاتی ہے', 'مسلسل رہتی ہے', 'کھانسی کے دورے کے ساتھ'] },
      { q: 'کیا سینے سے سیٹی جیسی آواز آتی ہے؟', opts: ['ہاں، سیٹی جیسی آواز', 'خشک کھانسی ہے', 'بلغم کے ساتھ کھانسی', 'کوئی آواز نہیں'] },
      { q: 'کیا آپ کو پہلے سے دمہ کی شکایت ہے؟', opts: ['ہاں، انہیلر استعمال کرتا ہوں', 'ہاں، پرانی بیماری ہے', 'پہلی بار ایسا ہوا ہے', 'کبھی تشخیص نہیں ہوئی'] }
    ]
  }
};

function getFollowUpQuestions(complaintText = '', lang = 'hi') {
  const c = (complaintText || '').toLowerCase();
  let category = 'chest_pain';
  if (c.includes('fever') || c.includes('bukhar') || c.includes('बुखार') || c.includes('بخار')) {
    category = 'fever';
  } else if (c.includes('stomach') || c.includes('pet') || c.includes('पेट') || c.includes('پیٹ') || c.includes('abdomen')) {
    category = 'stomach_pain';
  } else if (c.includes('breath') || c.includes('sans') || c.includes('saans') || c.includes('साँस') || c.includes('سانس') || c.includes('asthma')) {
    category = 'breathing';
  }
  const langKey = (lang === 'hi' || lang === 'ur') ? lang : 'en';
  return QUESTION_BANK[category][langKey] || QUESTION_BANK.chest_pain[langKey];
}

function evaluateTriage(answer = '', turn = 1, lang = 'hi') {
  const questions = getFollowUpQuestions(answer, lang);
  const qIdx = Math.min(Math.max(0, turn - 1), questions.length - 1);
  const current = questions[qIdx] || questions[0];
  const redFlags = detectRedFlags(answer);
  return {
    nextQuestion: current.q,
    options: current.opts || [],
    isRedFlag: redFlags.hasRedFlag,
    enoughInfo: turn >= 3
  };
}

module.exports = {
  detectRedFlags,
  getFollowUpQuestions,
  evaluateTriage,
  QUESTION_BANK
};
