const fs = require('fs');
const path = require('path');

let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  sqlite3 = require('../server/node_modules/sqlite3').verbose();
}

const dbPath = path.join(__dirname, 'db.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
  } catch (e) {
    console.log('Arquivo de banco travado por processo em execução. Atualizando dados sem recriar arquivo...');
  }
}

const db = new sqlite3.Database(dbPath);
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
  db.exec(schemaSql);

  const membersStmt = db.prepare(`INSERT OR IGNORE INTO members (name, default_role) VALUES (?, ?)`);

  const initialMembers = [
    ['JEREMIAS', 'Baixo'],
    ['JUNIOR', 'Baixo'],
    ['PAULO ROBERTO', 'Violão'],
    ['RENE', 'Teclado'],
    ['GABRIEL', 'Teclado'],
    ['LAERTE', 'Teclado'],
    ['RODRIGO', 'Bateria'],
    ['JAILSON', 'Bateria'],
    ['HELDER', 'Bateria'],
    ['STANLEY', 'Bateria'],
    ['GABRIELZINHO', 'Bateria'],
    ['EMERSON', 'Baixo'],
    ['ISRAEL', 'Baixo'],
    ['MIZAEL', 'Baixo'],
    ['OTONIEL', 'Violão'],
    ['XANDY', 'Violão'],
    ['KAIO', 'Baixo'],
    ['CHARLES', 'Bateria'],
    ['JOSELITO', 'Violão'],
    ['FABI', 'Vocal'],
    ['KELLY', 'Vocal'],
    ['JESSIKA', 'Vocal'],
    ['RHAYZA', 'Vocal'],
    ['GISELE', 'Vocal'],
    ['LEIDIANE', 'Vocal'],
    ['VANDERLANE', 'Vocal'],
    ['BARBARA', 'Vocal'],
    ['LIA', 'Vocal'],
    ['FRANCINALDO', 'Vocal'],
    ['SARA', 'Vocal'],
    ['LUIZA', 'Vocal'],
    ['EVELINE', 'Vocal'],
    ['ADNA', 'Vocal'],
    ['FABIELLE', 'Vocal'],
    ['ANDREIA', 'Vocal'],
    ['DAIANA', 'Vocal'],
    ['LUCAS BASTOS', 'Vocal']
  ];

  initialMembers.forEach(([name, role]) => membersStmt.run(name, role));
  membersStmt.finalize();

  const servicesStmt = db.prepare(`INSERT INTO services (church, date, day_time, title, week_num) VALUES (?, ?, ?, ?, ?)`);

  // 6 cultos fixos por semana × 4 semanas = 24 cultos
  // Semana 1: 29/07 ~ 03/08
  // Semana 2: 05/08 ~ 10/08
  // Semana 3: 12/08 ~ 17/08
  // Semana 4: 19/08 ~ 24/08
  const sampleServices = [
    // Semana 1
    ['Itaperi',    '2026-07-29', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    1],
    ['Industrial', '2026-07-30', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 1],
    ['Industrial', '2026-08-02', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    1],
    ['Industrial', '2026-08-02', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    1],
    ['Industrial', '2026-08-02', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    1],
    ['Itaperi',    '2026-08-02', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       1],

    // Semana 2
    ['Itaperi',    '2026-08-05', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    2],
    ['Industrial', '2026-08-06', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 2],
    ['Industrial', '2026-08-09', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    2],
    ['Industrial', '2026-08-09', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    2],
    ['Industrial', '2026-08-09', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    2],
    ['Itaperi',    '2026-08-09', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       2],

    // Semana 3
    ['Itaperi',    '2026-08-12', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    3],
    ['Industrial', '2026-08-13', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 3],
    ['Industrial', '2026-08-16', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    3],
    ['Industrial', '2026-08-16', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    3],
    ['Industrial', '2026-08-16', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    3],
    ['Itaperi',    '2026-08-16', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       3],

    // Semana 4
    ['Itaperi',    '2026-08-19', 'QUARTA 19:30',  'CULTO DA PALAVRA ITAPERI',    4],
    ['Industrial', '2026-08-20', 'QUINTA 19:30',  'CULTO DA PALAVRA INDUSTRIAL', 4],
    ['Industrial', '2026-08-23', 'DOMINGO 10:00', 'CULTO INDUSTRIAL (MANHÃ)',    4],
    ['Industrial', '2026-08-23', 'DOMINGO 17:00', 'CULTO INDUSTRIAL (TARDE)',    4],
    ['Industrial', '2026-08-23', 'DOMINGO 19:00', 'CULTO INDUSTRIAL (NOITE)',    4],
    ['Itaperi',    '2026-08-23', 'DOMINGO 18:00', 'CULTO ITAPERI (NOITE)',       4],
  ];

  sampleServices.forEach(s => servicesStmt.run(...s));
  servicesStmt.finalize();

  const schedStmt = db.prepare(`
    INSERT INTO schedule (service_id, keyboard_member, guitar_member, bass_member, drums_member, vocal_members)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 24 cultos → 24 registros de escala em branco
  const initialSchedules = Array.from({ length: 24 }, (_, i) => [i + 1, '-', '-', '-', '-', '-']);

  initialSchedules.forEach(s => schedStmt.run(...s));
  schedStmt.finalize();

  const availStmt = db.prepare(`INSERT INTO availability (service_id, member_name, role, notes) VALUES (?, ?, ?, ?)`);
  const initialAvail = [];

  initialAvail.forEach(a => availStmt.run(...a));
  availStmt.finalize();
});

db.close(() => {
  console.log('Database initialized successfully.');
});
