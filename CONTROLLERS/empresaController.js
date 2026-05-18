const db = require('../DB/connection');

const getAll = (req, res) => {
  const sql = `
    SELECT e.*, COALESCE(u.cantidad_usuarios, 0) AS cantidad_usuarios
    FROM empresas e
    LEFT JOIN (
      SELECT empresa_id, COUNT(*) AS cantidad_usuarios
      FROM usuarios
      WHERE estado = "activo"
      GROUP BY empresa_id
    ) u ON u.empresa_id = e.id
    WHERE e.estado = "activa"
    ORDER BY e.id DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

/*const insert = (req, res) => {
  const { nombre, rfc, ubicacion, telefono, correo_contacto } = req.body;
  const sql = 'CALL sp_insert_empresa(?,?,?,?,?)';
  db.query(sql, [nombre, rfc, ubicacion, telefono, correo_contacto], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const id = result?.[0]?.[0]?.id;
    res.json({ mensaje: 'Empresa registrada', id });
  });
};*/

// CONTROLLERS/empresaController.js
const insert = (req, res) => {
  // Recibimos los datos del formulario + el rol de quien está picando el botón
  const { nombre, rfc, ubicacion, telefono, correo_contacto, rol_operador } = req.body;

  // REGLA DE NEGOCIO CRÍTICA: Bloquear si no es administrador
  if (rol_operador !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Operación exclusiva del Administrador Principal.' 
    });
  }

  // Si sí es el administrador, el procedimiento sp_insert_empresa se ejecuta normal
  const sql = 'CALL sp_insert_empresa(?,?,?,?,?)';
  db.query(sql, [nombre, rfc, ubicacion, telefono, correo_contacto], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const id = result?.[0]?.[0]?.id;
    res.json({ mensaje: 'Empresa registrada con éxito por el Administrador', id });
  });
};

const update = (req, res) => {
  const { id, nombre, rfc, ubicacion, telefono, correo_contacto } = req.body;
  const sql = 'CALL sp_update_empresa(?,?,?,?,?,?)';
  db.query(sql, [nombre, rfc, ubicacion, telefono, correo_contacto, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa actualizada' });
  });
};

const deleteEmpresa = (req, res) => {
  const { id } = req.body;
  db.query('CALL sp_delete_empresa(?)', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa eliminada' });
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

const exportEmpresa = (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM empresas WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ error: 'Empresa no encontrada' });
    sendCsv(res, `empresa_${id}.csv`, results);
  });
};

module.exports = { getAll, insert, update, delete: deleteEmpresa, exportEmpresa };
