const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, '..', 'database', 'db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run("ALTER TABLE schedule ADD COLUMN published INTEGER DEFAULT 0", () => {});
  }
});

const membersRouter = require('./routes/members')(db);
const availabilityRouter = require('./routes/availability')(db);
const scheduleRouter = require('./routes/schedule')(db);

app.use('/api/members', membersRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/schedule', scheduleRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
