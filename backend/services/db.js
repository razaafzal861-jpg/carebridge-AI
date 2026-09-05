const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'database.json');

const defaultData = {
  sessions: {},
  triage: {},
  documents: {},
  summaries: {},
  doctorQueue: [
    {
      token: 'A-139',
      patientName: 'Mohd. Rafiq',
      age: 48,
      gender: 'Male',
      complaint: 'Chronic cough & mild fever (2 weeks)',
      acuity: 'YELLOW',
      redFlag: false,
      status: 'completed',
      time: '10:15 AM',
      doctorNotes: 'Prescribed Azithromycin 500mg, advised Chest X-Ray.'
    },
    {
      token: 'A-140',
      patientName: 'Ramesh Verma',
      age: 55,
      gender: 'Male',
      complaint: 'Severe acute chest pain & diaphoresis',
      acuity: 'RED',
      redFlag: true,
      status: 'in-consultation',
      time: '10:40 AM',
      doctorNotes: 'Stat ECG performed - STEMI suspected. Referred to Cardiology emergency.'
    },
    {
      token: 'A-141',
      patientName: 'Pooja Sharma',
      age: 29,
      gender: 'Female',
      complaint: 'Migraine headache with photophobia',
      acuity: 'GREEN',
      redFlag: false,
      status: 'waiting',
      time: '11:05 AM',
      doctorNotes: ''
    }
  ]
};

function initDb() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

function readDb() {
  initDb();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

module.exports = {
  readDb,
  writeDb
};
