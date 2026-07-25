const express = require('express');
const router = express.Router();

module.exports = function (db) {
  router.get('/', (req, res) => {
    db.all('SELECT * FROM members ORDER BY name ASC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/', (req, res) => {
    const { name, default_role } = req.body;
    if (!name || !default_role) {
      return res.status(400).json({ error: 'Nome e função obrigatórios' });
    }

    db.run(
      'INSERT INTO members (name, default_role) VALUES (?, ?)',
      [name.toUpperCase().trim(), default_role],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name: name.toUpperCase().trim(), default_role });
      }
    );
  });

  return router;
};
