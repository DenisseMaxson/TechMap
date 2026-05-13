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
  const userName = usuario || correo || nombre_completo;
  const passwordValue = password_hash || '';
  const sql = 'CALL sp_insert_usuario(?,?,?,?,?,?)';
  db.query(sql, [empresa_id || null, nombre_completo, correo || null, userName, passwordValue, rol], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const id = result?.[0]?.[0]?.id;
    res.json({ mensaje: 'Usuario creado', id });
  });
};

const update = (req, res) => {
  const { id, empresa_id, nombre_completo, correo, rol, estado } = req.body;
  const sql = 'CALL sp_update_usuario(?,?,?,?,?,?)';
  db.query(sql, [empresa_id || null, nombre_completo, correo || null, rol, estado, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario actualizado' });
  });
};

const deleteUsuario = (req, res) => {
  const { id } = req.body;
  db.query('CALL sp_delete_usuario(?)', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario desactivado' });
  });
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  return `"${String(value).replace(/"/g, '""')}"`;
};

const sendCsv = (res, filename, rows) => {
  if (!rows.length) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('');
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
};

const exportByEmpresa = (req, res) => {
  const { empresaId } = req.params;
  const sql = `
    SELECT u.id, u.nombre_completo, u.correo, u.usuario, u.rol, u.estado, e.nombre AS nombre_empresa
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.empresa_id = ?
    ORDER BY u.id DESC`;

  db.query(sql, [empresaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    sendCsv(res, `usuarios_empresa_${empresaId}.csv`, results);
  });
};

module.exports = { getAll, insert, update, delete: deleteUsuario, exportByEmpresa };
