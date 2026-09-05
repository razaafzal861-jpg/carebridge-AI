/**
 * CareBridge Document & Prescription Upload Routes (Integrated with Gemini Vision)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readDb, writeDb } = require('../services/db');
const { parseUploadedDocument } = require('../services/ocrService');
const geminiService = require('../services/geminiService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const { token, docName, docType } = req.body;
    const db = readDb();

    if (!token || !db.sessions[token]) {
      return res.status(404).json({ success: false, message: 'Session token not found' });
    }

    const session = db.sessions[token];
    session.documents = session.documents || [];

    const file = req.file;
    const fileName = file ? file.originalname : (docName || 'Prescription Document');

    let geminiOcr = null;
    if (file && file.mimetype.startsWith('image/')) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        geminiOcr = await geminiService.scanPrescription(fileBuffer, file.mimetype);
      } catch (ocrErr) {
        console.warn('Gemini OCR error, falling back:', ocrErr.message);
      }
    }

    // Baseline fallback parsing
    const baselineParsed = parseUploadedDocument({ originalname: fileName, name: fileName });

    const newDoc = {
      id: 'doc-' + (session.documents.length + 1),
      name: docName || (geminiOcr ? `${geminiOcr.documentType} · ${geminiOcr.doctorOrClinic || 'Clinic'}` : baselineParsed.summaryText),
      tag: docType || (geminiOcr?.documentType || baselineParsed.docType),
      date: geminiOcr?.date || baselineParsed.date,
      fileUrl: file ? '/uploads/' + file.filename : null,
      clinicName: geminiOcr?.doctorOrClinic || baselineParsed.clinicName,
      medications: geminiOcr?.medicines?.map((m) => `${m.name} ${m.dosage || ''} (${m.frequency || 'OD'})`) || baselineParsed.medications,
      allergies: geminiOcr?.allergies || baselineParsed.allergies,
      labResults: geminiOcr?.labValues?.map((l) => `${l.test}: ${l.result}`) || baselineParsed.labResults,
      diagnoses: geminiOcr?.diagnoses || baselineParsed.diagnoses,
      clinicalSummary: geminiOcr?.clinicalSummary || null,
      source: geminiOcr ? 'gemini-vision' : 'rule-ocr',
    };

    session.documents.push(newDoc);
    writeDb(db);

    res.json({
      success: true,
      document: newDoc,
      totalScanned: session.documents.length,
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:token', (req, res) => {
  try {
    const { token } = req.params;
    const db = readDb();
    const session = db.sessions[token];

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({
      success: true,
      documents: session.documents || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
