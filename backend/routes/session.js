/**
 * Patient Session & ABHA Management Routes
 */

const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../services/db');

let tokenCounter = 142;

router.post('/start', (req, res) => {
  try {
    const {
      lang = 'Hindi',
      agreed = [true, true, true],
      abhaId = '',
      patientName = 'Walk-in Patient',
      age = 35,
      gender = 'Female'
    } = req.body;
    const db = readDb();

    const token = 'A-' + tokenCounter;
    tokenCounter += 1;

    const newSession = {
      token,
      patientName: patientName || 'Walk-in Patient',
      age: Number(age) || 35,
      gender: gender || 'Female',
      lang,
      agreed,
      abhaId: abhaId || '91-4521-8890-1234',
      abhaLinked: Boolean(abhaId),
      createdAt: new Date().toISOString(),
      status: 'active',
      acuity: 'GREEN',
      redFlag: false,
      history: [],
      documents: [
        {
          id: 'doc-1',
          name: 'पर्ची · Apollo Clinic',
          tag: 'प्रिस्क्रिप्शन',
          date: '12 जून',
          clinicName: 'Apollo Clinic',
          medications: ['Tab Ecosprin 75mg', 'Tab Pantocid 40mg'],
          allergies: ['Penicillin']
        }
      ]
    };

    db.sessions[token] = newSession;
    writeDb(db);

    res.json({
      success: true,
      token,
      session: newSession
    });
  } catch (err) {
    console.error('Session start error:', err);
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

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
