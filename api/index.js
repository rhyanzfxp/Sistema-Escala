const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

let dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/db.sqlite';
  try {
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpDbPath);
      }
    }
    dbPath = tmpDbPath;
  } catch (e) {
    console.error('Error copying DB to /tmp:', e);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    initDbSchemaAndData();
  }
});

function initDbSchemaAndData() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      default_role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      church TEXT NOT NULL,
      date TEXT NOT NULL,
      day_time TEXT NOT NULL,
      title TEXT NOT NULL,
      week_num INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      member_name TEXT NOT NULL,
      role TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER UNIQUE NOT NULL,
      keyboard_member TEXT DEFAULT '',
      guitar_member TEXT DEFAULT '',
      bass_member TEXT DEFAULT '',
      drums_member TEXT DEFAULT '',
      vocal_members TEXT DEFAULT '',
      published INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS swap_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      old_member TEXT NOT NULL,
      new_member TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run("ALTER TABLE schedule ADD COLUMN published INTEGER DEFAULT 0", () => {});

    // Seed services if empty
    db.get("SELECT COUNT(*) as count FROM services", [], (err, row) => {
      if (!err && row && row.count === 0) {
        const sampleServices = [
          ['Itaperi',    '2026-07-29', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    1],
          ['Industrial', '2026-07-30', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 1],
          ['Industrial', '2026-08-02', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    1],
          ['Industrial', '2026-08-02', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    1],
          ['Industrial', '2026-08-02', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    1],
          ['Itaperi',    '2026-08-02', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       1],

          ['Itaperi',    '2026-08-05', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    2],
          ['Industrial', '2026-08-06', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 2],
          ['Industrial', '2026-08-09', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    2],
          ['Industrial', '2026-08-09', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    2],
          ['Industrial', '2026-08-09', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    2],
          ['Itaperi',    '2026-08-09', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       2],

          ['Itaperi',    '2026-08-12', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    3],
          ['Industrial', '2026-08-13', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 3],
          ['Industrial', '2026-08-16', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    3],
          ['Industrial', '2026-08-16', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    3],
          ['Industrial', '2026-08-16', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    3],
          ['Itaperi',    '2026-08-16', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       3],

          ['Itaperi',    '2026-08-19', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    4],
          ['Industrial', '2026-08-20', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 4],
          ['Industrial', '2026-08-23', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    4],
          ['Industrial', '2026-08-23', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    4],
          ['Industrial', '2026-08-23', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    4],
          ['Itaperi',    '2026-08-23', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       4],
        ];

        const servicesStmt = db.prepare(`INSERT INTO services (church, date, day_time, title, week_num) VALUES (?, ?, ?, ?, ?)`);
        sampleServices.forEach(s => servicesStmt.run(...s));
        servicesStmt.finalize();

        const schedStmt = db.prepare(`
          INSERT INTO schedule (service_id, keyboard_member, guitar_member, bass_member, drums_member, vocal_members)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const initialSchedules = Array.from({ length: 24 }, (_, i) => [i + 1, '-', '-', '-', '-', '-']);
        initialSchedules.forEach(s => schedStmt.run(...s));
        schedStmt.finalize();
      }
    });

    // Seed members if empty
    db.get("SELECT COUNT(*) as count FROM members", [], (err, row) => {
      if (!err && row && row.count === 0) {
        const initialMembers = [
          ['JEREMIAS', 'Baixo'], ['JUNIOR', 'Baixo'], ['PAULO ROBERTO', 'Violão'],
          ['RENE', 'Teclado'], ['GABRIEL', 'Teclado'], ['LAERTE', 'Teclado'],
          ['RODRIGO', 'Bateria'], ['JAILSON', 'Bateria'], ['HELDER', 'Bateria'],
          ['STANLEY', 'Bateria'], ['GABRIELZINHO', 'Bateria'], ['EMERSON', 'Baixo'],
          ['ISRAEL', 'Baixo'], ['MIZAEL', 'Baixo'], ['OTONIEL', 'Violão'],
          ['XANDY', 'Violão'], ['KAIO', 'Baixo'], ['CHARLES', 'Bateria'],
          ['JOSELITO', 'Violão'], ['FABI', 'Vocal'], ['KELLY', 'Vocal'],
          ['JESSIKA', 'Vocal'], ['RHAYZA', 'Vocal'], ['GISELE', 'Vocal'],
          ['LEIDIANE', 'Vocal'], ['VANDERLANE', 'Vocal'], ['BARBARA', 'Vocal'],
          ['LIA', 'Vocal'], ['FRANCINALDO', 'Vocal'], ['SARA', 'Vocal'],
          ['LUIZA', 'Vocal'], ['EVELINE', 'Vocal'], ['ADNA', 'Vocal'],
          ['FABIELLE', 'Vocal'], ['ANDREIA', 'Vocal'], ['DAIANA', 'Vocal'],
          ['LUCAS BASTOS', 'Vocal']
        ];
        const membersStmt = db.prepare(`INSERT OR IGNORE INTO members (name, default_role) VALUES (?, ?)`);
        initialMembers.forEach(([n, r]) => membersStmt.run(n, r));
        membersStmt.finalize();
      }
    });
  });
}

const membersRouter = require('../server/routes/members')(db);
const availabilityRouter = require('../server/routes/availability')(db);
const scheduleRouter = require('../server/routes/schedule')(db);

app.use('/api/members', membersRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/schedule', scheduleRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app;
