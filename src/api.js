/**
 * CareBridge API Client
 */

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:5000/api'
  : '/api';

export async function startSession(payload = {}) {
  try {
    const res = await fetch(API_BASE + '/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('startSession error:', err);
    return { success: false, error: err.message, token: 'A-142' };
  }
}

export async function sendTriageMessage(payload = {}) {
  try {
    const res = await fetch(API_BASE + '/triage/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('sendTriageMessage error:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadDocumentFile(token, file, docName = '', docType = '') {
  try {
    const formData = new FormData();
    formData.append('token', token);
    if (file) formData.append('document', file);
    if (docName) formData.append('docName', docName);
    if (docType) formData.append('docType', docType);

    const res = await fetch(API_BASE + '/documents/upload', {
      method: 'POST',
      body: formData
    });
    return await res.json();
  } catch (err) {
    console.error('uploadDocumentFile error:', err);
    return { success: false, error: err.message };
  }
}

export async function generateSummary(token, lang = 'hi') {
  try {
    const res = await fetch(API_BASE + '/summary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, lang })
    });
    return await res.json();
  } catch (err) {
    console.error('generateSummary error:', err);
    return { success: false, error: err.message };
  }
}

export async function fetchDoctorQueue() {
  try {
    const res = await fetch(API_BASE + '/doctor/queue');
    return await res.json();
  } catch (err) {
    console.error('fetchDoctorQueue error:', err);
    return { success: false, error: err.message, queue: [], stats: {} };
  }
}

export async function updateConsultation(token, payload = {}) {
  try {
    const res = await fetch(API_BASE + '/doctor/consultation/' + token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('updateConsultation error:', err);
    return { success: false, error: err.message };
  }
}
