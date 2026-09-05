/**
 * CareBridge Symptom Triage Routes (Integrated with Google Gemini AI)
 */

const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../services/db');
const { detectRedFlags, getFollowUpQuestions } = require('../services/triageService');
const geminiService = require('../services/geminiService');

router.post('/chat', async (req, res) => {
  try {
    const { token, question, answer, lang = 'hi' } = req.body;
    const db = readDb();

    if (!token || !db.sessions[token]) {
      return res.status(404).json({ success: false, message: 'Invalid or missing session token' });
    }

    const session = db.sessions[token];
    session.history = session.history || [];

    const entry = {
      q: question || 'Initial intake',
      a: answer,
      timestamp: new Date().toISOString(),
    };
    session.history.push(entry);

    // Call Gemini AI for dynamic clinical triage
    const historyFormat = session.history.map((h) => ({
      role: 'user',
      content: `Q: ${h.q} | A: ${h.a}`,
    }));

    const geminiResult = await geminiService.chatTriage(historyFormat, answer, lang);

    // Update Red Flag status if either Gemini or local rules detect emergency
    const localFlags = detectRedFlags(answer, session.history.map((h) => h.a));
    const isEmergency = geminiResult.isRedFlag || localFlags.hasRedFlag;

    if (isEmergency) {
      session.redFlag = true;
      session.acuity = 'RED';
      session.redFlagReason = geminiResult.redFlagReason || localFlags.reason;
      session.redFlagTrigger = answer;
    }

    const isDone = geminiResult.enoughInfo || session.history.length >= 4;

    writeDb(db);

    res.json({
      success: true,
      token,
      redFlag: session.redFlag,
      redFlagReason: session.redFlagReason,
      acuity: session.acuity,
      history: session.history,
      nextQuestion: geminiResult.nextQuestion,
      quickOptions: geminiResult.quickOptions || [],
      enoughInfo: isDone,
      source: geminiResult.source,
    });
  } catch (err) {
    console.error('Triage chat error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/questions', (req, res) => {
  try {
    const { complaint = '', lang = 'hi' } = req.query;
    const questions = getFollowUpQuestions(complaint, lang);
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
