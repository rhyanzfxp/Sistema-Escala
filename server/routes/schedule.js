const express = require('express');
const router = express.Router();

module.exports = function (db) {
  router.get('/services', (req, res) => {
    const { church, month } = req.query;
    let sql = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (church) {
      sql += ' AND church = ?';
      params.push(church);
    }
    if (month) {
      sql += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    sql += ' ORDER BY date ASC, id ASC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.get('/', (req, res) => {
    const { church, month } = req.query;
    let sql = `
      SELECT s.id as service_id, s.church, s.date, s.day_time, s.title, s.week_num,
             sc.id as schedule_id, sc.keyboard_member, sc.guitar_member,
             sc.bass_member, sc.drums_member, sc.vocal_members,
             COALESCE(sc.published, 0) as published, sc.updated_at
      FROM services s
      LEFT JOIN schedule sc ON s.id = sc.service_id
      WHERE 1=1
    `;
    const params = [];

    if (church) {
      sql += ' AND s.church = ?';
      params.push(church);
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

  router.post('/publish', (req, res) => {
    const { published, month, church } = req.body;

    let sql = `
      UPDATE schedule
      SET published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE service_id IN (
        SELECT id FROM services WHERE 1=1
    `;
    const params = [published ? 1 : 0];

    if (church) {
      sql += ' AND church = ?';
      params.push(church);
    }
    if (month) {
      sql += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    sql += ')';

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, published: !!published, count: this.changes });
    });
  });

  router.get('/available-substitutes', (req, res) => {
    const { service_id, role } = req.query;

    if (!service_id || !role) {
      return res.status(400).json({ error: 'service_id e role são obrigatórios' });
    }

    const sql = `
      SELECT DISTINCT member_name, role, notes
      FROM availability
      WHERE service_id = ? AND (role = ? OR role LIKE ?)
      ORDER BY member_name ASC
    `;

    db.all(sql, [service_id, role, `%${role}%`], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/', (req, res) => {
    const { service_id, keyboard_member, guitar_member, bass_member, drums_member, vocal_members } = req.body;

    if (!service_id) {
      return res.status(400).json({ error: 'service_id é obrigatório' });
    }

    const sql = `
      INSERT INTO schedule (service_id, keyboard_member, guitar_member, bass_member, drums_member, vocal_members, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(service_id) DO UPDATE SET
        keyboard_member = excluded.keyboard_member,
        guitar_member = excluded.guitar_member,
        bass_member = excluded.bass_member,
        drums_member = excluded.drums_member,
        vocal_members = excluded.vocal_members,
        updated_at = CURRENT_TIMESTAMP
    `;

    const params = [
      service_id,
      keyboard_member || '-',
      guitar_member || '-',
      bass_member || '-',
      drums_member || '-',
      vocal_members || '-'
    ];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, service_id });
    });
  });

  router.post('/swap', (req, res) => {
    const { service_id, role_field, old_member, new_member } = req.body;

    if (!service_id || !role_field || !old_member || !new_member) {
      return res.status(400).json({ error: 'Dados incompletos para realizar troca' });
    }

    const validFields = ['keyboard_member', 'guitar_member', 'bass_member', 'drums_member', 'vocal_members'];
    if (!validFields.includes(role_field)) {
      return res.status(400).json({ error: 'Campo de função inválido' });
    }

    db.get('SELECT * FROM schedule WHERE service_id = ?', [service_id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(44).json({ error: 'Escala não encontrada' });

      let currentVal = row[role_field] || '';
      let updatedVal = currentVal;

      if (role_field === 'vocal_members' && currentVal.includes('/')) {
        updatedVal = currentVal.replace(old_member, new_member);
      } else {
        updatedVal = new_member;
      }

      const updateSql = `UPDATE schedule SET ${role_field} = ?, updated_at = CURRENT_TIMESTAMP WHERE service_id = ?`;

      db.run(updateSql, [updatedVal, service_id], function (updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });

        db.run(
          'INSERT INTO swap_logs (service_id, role, old_member, new_member) VALUES (?, ?, ?, ?)',
          [service_id, role_field, old_member, new_member],
          () => {}
        );

        res.json({ success: true, updatedVal });
      });
    });
  });

  router.get('/logs', (req, res) => {
    const sql = `
      SELECT l.*, s.church, s.date, s.title
      FROM swap_logs l
      JOIN services s ON l.service_id = s.id
      ORDER BY l.created_at DESC LIMIT 50
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/clear-all', (req, res) => {
    const sql = `
      UPDATE schedule
      SET keyboard_member = '-', guitar_member = '-', bass_member = '-', drums_member = '-', vocal_members = '-', updated_at = CURRENT_TIMESTAMP
    `;
    db.run(sql, [], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, count: this.changes });
    });
  });

  return router;
};
