# CareBridge (MediKiosk) — AI OPD Assistant Backend

A specialized Express.js backend designed for AI-driven patient triage, ABHA identification, multilingual voice intake, document/prescription parsing, and real-time OPD doctor queue management in government hospitals.

## Features
- **Session & ABHA Management**: Generates OPD tokens (e.g., A-142), tracks consent, and links ABHA health records.
- **Multilingual AI Triage Engine**: Detects clinical red flags (acute chest pain, respiratory distress, etc.) in Hindi, English, and Urdu, and provides dynamic clinical follow-up questions.
- **Prescription & Document Parsing**: Multer-based ingestion and clinical OCR entity extraction (medications, dosages, past conditions, drug allergies, lab results).
- **Structured EMR Summary Generation**: Generates standard physician-ready summaries (Chief Complaint, HPI, Allergies, Prior Meds, Investigations, Acuity score).
- **Doctor OPD Queue & Consultation Portal**: Real-time waiting queue with priority sorting (Red-Flag emergency patients first), full clinical records, and doctor note completion.

## How to Run

### Start Backend:
`ash
cd backend
npm install
npm start
# or from the root folder:
npm run server
`
Backend runs at: http://localhost:5000

### Start Frontend:
`ash
npm run dev
`
Frontend runs at: http://localhost:5173

## API Endpoints

### 1. Health Check
- GET /api/health

### 2. Patient Session
- POST /api/session/start - Body: { lang, agreed, abhaId, patientName }
- GET /api/session/:token

### 3. AI Triage Engine
- POST /api/triage/chat - Body: { token, question, answer, lang }
- GET /api/triage/questions - Query: ?complaint=chest_pain&lang=hi

### 4. Prescription & Document Processing
- POST /api/documents/upload - Multipart form with document file and 	oken
- GET /api/documents/:token

### 5. Structured Clinical Summary
- POST /api/summary/generate - Body: { token, lang }
- POST /api/abdm/link - Body: { token, abhaId }

### 6. Doctor OPD Portal
- GET /api/doctor/queue - Live patient queue & emergency statistics
- GET /api/doctor/patient/:token - Detailed clinical history & documents
- PUT /api/doctor/consultation/:token - Doctor notes & consultation completion
- POST /api/doctor/call-next - Calls next waiting patient
