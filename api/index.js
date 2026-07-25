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
    db.run("ALTER TABLE schedule ADD COLUMN published INTEGER DEFAULT 0", () => {});
  }
});

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
