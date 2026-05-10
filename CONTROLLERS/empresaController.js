const db = require('../DB/connection');

const getAll = (req, res) => {
  db.query('SELECT * FROM empresas WHERE estado = "activa"', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const insert = (req, res) => {
  const { nombre, rfc, ubicacion, telefono, correo_contacto } = req.body;
  const sql = 'INSERT INTO empresas (nombre, rfc, ubicacion, telefono, correo_contacto) VALUES (?,?,?,?,?)';
  db.query(sql, [nombre, rfc, ubicacion, telefono, correo_contacto], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa registrada', id: result.insertId });
  });
};

const update = (req, res) => {
  const { id, nombre, rfc, ubicacion, telefono, correo_contacto } = req.body;
  const sql = 'UPDATE empresas SET nombre=?, rfc=?, ubicacion=?, telefono=?, correo_contacto=? WHERE id=?';
  db.query(sql, [nombre, rfc, ubicacion, telefono, correo_contacto, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa actualizada' });
  });
};

const deleteEmpresa = (req, res) => {
  const { id } = req.body;
  db.query('UPDATE empresas SET estado = "inactiva" WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa eliminada' });
  });
};

module.exports = { getAll, insert, update, delete: deleteEmpresa };