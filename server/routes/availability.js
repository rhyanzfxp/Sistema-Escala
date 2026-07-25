const express = require('express');
const router = express.Router();

module.exports = function (db) {
  router.get('/', (req, res) => {
    const { church, service_id, month } = req.query;
    let sql = `
      SELECT a.*, s.church, s.date, s.day_time, s.title
      FROM availability a
      JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (church) {
      sql += ' AND s.church = ?';
      params.push(church);
    }
    if (service_id) {
      sql += ' AND a.service_id = ?';
      params.push(service_id);
    }
    if (month) {
      sql += ' AND s.date LIKE ?';
      params.push(`${month}%`);
    }

    sql += ' ORDER BY s.date ASC, s.id ASC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/', (req, res) => {
    const { service_ids, member_name, role, notes } = req.body;

    if (!service_ids || !Array.isArray(service_ids) || service_ids.length === 0 || !member_name || !role) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const cleanName = member_name.toUpperCase().trim();
    const cleanNotes = notes ? notes.trim() : '';

    const stmt = db.prepare(`
      INSERT INTO availability (service_id, member_name, role, notes)
      VALUES (?, ?, ?, ?)
    `);

    let completed = 0;
    let hasError = false;

    db.serialize(() => {
      service_ids.forEach((sId) => {
        stmt.run([sId, cleanName, role, cleanNotes], (err) => {
          if (err && !hasError) {
            hasError = true;
            return res.status(500).json({ error: err.message });
          }
          completed++;
          if (completed === service_ids.length && !hasError) {
            res.json({ success: true, count: completed });
          }
        });
      });
      stmt.finalize();
    });
  });

  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM availability WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, deleted: this.changes });
    });
  });

  router.post('/clear-all', (req, res) => {
    db.run('DELETE FROM availability', [], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, count: this.changes });
    });
  });

  return router;
};
