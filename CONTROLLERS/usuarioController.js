const db = require('../DB/connection');

const getAll = (req, res) => {
  const sql = `
    SELECT u.*, e.nombre AS nombre_empresa 
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.estado = "activo"`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const insert = (req, res) => {
  const { empresa_id, nombre_completo, correo, usuario, password_hash, rol } = req.body;
  const sql = 'INSERT INTO usuarios (empresa_id, nombre_completo, correo, usuario, password_hash, rol) VALUES (?,?,?,?,?,?)';
  db.query(sql, [empresa_id, nombre_completo, correo, usuario, password_hash, rol], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario creado', id: result.insertId });
  });
};

const update = (req, res) => {
  const { id, nombre_completo, correo, rol, estado } = req.body;
  const sql = 'UPDATE usuarios SET nombre_completo=?, correo=?, rol=?, estado=? WHERE id=?';
  db.query(sql, [nombre_completo, correo, rol, estado, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario actualizado' });
  });
};

const deleteUsuario = (req, res) => {
  const { id } = req.body;
  db.query('UPDATE usuarios SET estado = "inactivo" WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario desactivado' });
  });
};

module.exports = { getAll, insert, update, delete: deleteUsuario };