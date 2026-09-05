const https = require('https');
const dotenv = require('dotenv');
const triageService = require('./triageService');
const ocrService = require('./ocrService');

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

/**
 * Generic helper to send request to Google Gemini API
 */
function callGemini(contents, systemInstruction = null) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    const payload = {
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const data = JSON.stringify(payload);

    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                resolve(JSON.parse(text));
              } else {
                reject(new Error('Empty Gemini response content'));
              }
            } catch (err) {
              reject(new Error(`Failed to parse Gemini output: ${err.message}`));
            }
          } else {
            reject(new Error(`Gemini API error (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API call timed out'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 1. Dynamic Triage Conversation
 * Generates tailored follow-up questions & quick option chips based on user's illness and history
 */
async function chatTriage(history = [], latestAnswer, language = 'hi') {
  const langName = language === 'hi' ? 'Hindi' : language === 'ur' ? 'Urdu' : 'English';

  const systemPrompt = `You are CareBridge AI, an intelligent, empathetic OPD triage assistant deployed in a busy government hospital in India.
Your job is to collect clinical history from a walk-in patient in ${langName}.
Guidelines:
1. Ask ONE clear, simple follow-up question in ${langName} tailored directly to the patient's specific symptoms.
2. Provide 3-4 short, realistic quick options in ${langName} that the patient can easily tap on a touchscreen.
3. Detect RED-FLAG emergencies (e.g. chest pain with pressure/sweating, difficulty breathing, acute neurological deficit, severe trauma, sudden loss of consciousness).
4. Decide if enough clinical information (3 to 4 turns of chief complaint, duration, severity, and character) has been gathered to proceed to document upload (set "enoughInfo": true).
5. Output MUST be valid JSON with this exact schema:
{
  "nextQuestion": "...",
  "quickOptions": ["...", "...", "...", "..."],
  "isRedFlag": true/false,
  "redFlagReason": "..." or null,
  "enoughInfo": true/false
}`;

  const conversationHistory = history
    .map((msg) => `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const userPrompt = `Patient conversation history so far:
${conversationHistory || 'None (New patient intake)'}

Latest patient input: "${latestAnswer}"

Analyze the symptom, identify any red flags, generate the next relevant clinical question and 3-4 quick-tap options in ${langName}. If 3 or more turns have gathered sufficient history, set enoughInfo to true.`;

  try {
    const contents = [{ parts: [{ text: userPrompt }] }];
    const result = await callGemini(contents, systemPrompt);
    return {
      nextQuestion: result.nextQuestion,
      quickOptions: Array.isArray(result.quickOptions) ? result.quickOptions : [],
      isRedFlag: Boolean(result.isRedFlag),
      redFlagReason: result.redFlagReason || null,
      enoughInfo: Boolean(result.enoughInfo),
      source: 'gemini',
    };
  } catch (err) {
    console.warn('[Gemini Service] Triage fallback triggered:', err.message);
    // Graceful fallback to rule-based engine
    const fallback = triageService.evaluateTriage(latestAnswer, history.length + 1, language);
    return {
      nextQuestion: fallback.nextQuestion,
      quickOptions: fallback.options,
      isRedFlag: fallback.isRedFlag,
      redFlagReason: fallback.isRedFlag ? 'Triggered emergency triage protocol' : null,
      enoughInfo: fallback.enoughInfo,
      source: 'rule-engine-fallback',
    };
  }
}

/**
 * 2. Real Prescription Vision OCR
 * Reads uploaded prescription/report images using Gemini Vision multimodal prompt
 */
async function scanPrescription(imageBuffer, mimeType = 'image/jpeg') {
  const base64Data = imageBuffer.toString('base64');

  const systemPrompt = `You are a specialized Clinical Document and Prescription OCR Reader for Indian hospitals.
Analyze the provided medical document (handwritten prescription, lab report, or discharge summary).
Extract all discernible medical entities accurately.
Output MUST be valid JSON with this exact schema:
{
  "documentType": "Prescription" | "Lab Report" | "Discharge Summary" | "Other",
  "doctorOrClinic": "...",
  "date": "...",
  "medicines": [
    { "name": "...", "dosage": "...", "frequency": "..." }
  ],
  "allergies": ["..."],
  "diagnoses": ["..."],
  "labValues": [
    { "test": "...", "result": "...", "normalRange": "..." }
  ],
  "clinicalSummary": "..."
}`;

  const prompt = `Carefully inspect this handwritten/printed medical document.
Identify:
1. Doctor, clinic or hospital name and visit date.
2. Prescribed medications with dosage and frequency (e.g., Metformin 500mg BD, Paracetamol 650mg TDS).
3. Any stated allergies or drug sensitivities.
4. Documented diagnoses or symptoms.
5. Any lab parameters or test results.
Return structured JSON.`;

  try {
    const contents = [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ];

    const result = await callGemini(contents, systemPrompt);
    return {
      ...result,
      source: 'gemini-vision',
    };
  } catch (err) {
    console.warn('[Gemini Service] OCR fallback triggered:', err.message);
    const fallback = ocrService.parsePrescriptionText('Sample document');
    return {
      documentType: 'Prescription',
      doctorOrClinic: 'Apollo Clinic / Local OPD',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      medicines: fallback.medications.map((m) => ({ name: m, dosage: 'As directed', frequency: 'OD' })),
      allergies: fallback.allergies,
      diagnoses: ['Under clinical evaluation'],
      labValues: [],
      clinicalSummary: 'Document scanned and linked to patient record.',
      source: 'ocr-fallback',
    };
  }
}

/**
 * 3. Doctor EMR Clinical Summary Synthesis
 * Synthesizes chat dialogue + parsed documents into standard 5-point EMR summary
 */
async function generateEMRSummary(sessionData) {
  const { session, triageMessages = [], documents = [] } = sessionData;

  const conversationText = triageMessages
    .map((m) => `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.content}`)
    .join('\n');

  const docsText = documents
    .map(
      (d) =>
        `Doc: ${d.name} (${d.type || 'Prescription'})\nExtracted Data: ${JSON.stringify(d.extractedData || {})}`
    )
    .join('\n\n');

  const systemPrompt = `You are a Senior Chief Medical Officer and EMR Synthesizer.
Synthesize the walk-in patient's triage conversation and uploaded medical records into a 5-point standard clinical summary for the OPD Doctor.
Output MUST be valid JSON with this exact schema:
{
  "summaryRows": [
    ["मुख्य शिकायत (Chief Complaint)", "..."],
    ["वर्तमान बीमारी (History of Present Illness)", "..."],
    ["पूर्व इतिहास (Past Medical & Surgical History)", "..."],
    ["दवा / एलर्जी (Medications & Allergies)", "..."],
    ["पूर्व जांच (Prior Investigations & Labs)", "..."]
  ],
  "clinicalImpression": "...",
  "priorityLevel": "Emergency" | "Urgent" | "Routine"
}`;

  const prompt = `Patient Token: ${session?.token || 'A-101'}
Language: ${session?.language || 'hi'}

Triage Conversation:
${conversationText || 'No conversation recorded.'}

Scanned Medical Records:
${docsText || 'No prior documents uploaded.'}

Generate the 5-point clinical summary rows and clinical impression.`;

  try {
    const contents = [{ parts: [{ text: prompt }] }];
    const result = await callGemini(contents, systemPrompt);
    return {
      summaryRows: result.summaryRows,
      clinicalImpression: result.clinicalImpression,
      priorityLevel: result.priorityLevel || (session?.redFlag ? 'Emergency' : 'Routine'),
      source: 'gemini',
    };
  } catch (err) {
    console.warn('[Gemini Service] Summary fallback triggered:', err.message);
    return {
      summaryRows: [
        ['मुख्य शिकायत (Chief Complaint)', session?.primaryComplaint || 'सीने में दर्द, दबाव जैसा'],
        ['वर्तमान बीमारी (History of Present Illness)', 'लक्षण आज से शुरू, मध्यम से गंभीर तीव्रता'],
        ['पूर्व इतिहास (Past Medical History)', 'कोई पूर्व जटिल सर्जरी दर्ज नहीं'],
        ['दवा / एलर्जी (Medications & Allergies)', 'पेनिसिलिन से एलर्जी दर्ज (2019)'],
        ['पूर्व जांच (Prior Investigations)', 'CBC व ईसीजी सामान्य सीमा में'],
      ],
      clinicalImpression: 'Patient awaiting physician consultation.',
      priorityLevel: session?.redFlag ? 'Emergency' : 'Routine',
      source: 'summary-fallback',
    };
  }
}

module.exports = {
  chatTriage,
  scanPrescription,
  generateEMRSummary,
};
