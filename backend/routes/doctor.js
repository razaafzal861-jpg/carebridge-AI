/**
 * CareBridge Doctor OPD Queue & Consultation Portal Routes
 */

const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../services/db');

router.get('/queue', (req, res) => {
  try {
    const db = readDb();
    const queue = db.doctorQueue || [];

    // Stats
    const waitingCount = queue.filter(p => p.status === 'waiting').length;
    const emergencyCount = queue.filter(p => p.acuity === 'RED' && p.status !== 'completed').length;
    const completedCount = queue.filter(p => p.status === 'completed').length;

    res.json({
      success: true,
      stats: {
        totalInQueue: queue.length,
        waiting: waitingCount,
        emergency: emergencyCount,
        completed: completedCount,
        avgWaitMin: '12 min'
      },
      queue
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/patient/:token', (req, res) => {
  try {
    const { token } = req.params;
    const db = readDb();
    const session = db.sessions[token];
    const summary = db.summaries[token];

    if (!session && !summary) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      patient: {
        token,
        session: session || {},
        summary: summary || null,
        documents: (session && session.documents) || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/consultation/:token', (req, res) => {
  try {
    const { token } = req.params;
    const { doctorNotes = '', status = 'completed', prescription = [] } = req.body;
    const db = readDb();

    const patient = db.doctorQueue.find(p => p.token === token);
    if (patient) {
      patient.doctorNotes = doctorNotes;
      patient.status = status;
      patient.prescription = prescription;
    }

    if (db.sessions[token]) {
      db.sessions[token].doctorNotes = doctorNotes;
      db.sessions[token].status = status;
    }

    writeDb(db);

    res.json({
      success: true,
      message: 'Consultation updated',
      patient
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/call-next', (req, res) => {
  try {
    const db = readDb();
    const nextPatient = db.doctorQueue.find(p => p.status === 'waiting');

    if (!nextPatient) {
      return res.json({ success: true, message: 'No patients waiting in queue' });
    }

    nextPatient.status = 'in-consultation';
    writeDb(db);

    res.json({
      success: true,
      currentPatient: nextPatient
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
