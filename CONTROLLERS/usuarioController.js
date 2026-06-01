const db     = require('../DB/connection');
const bcrypt = require('bcryptjs');
const authToken = require('../UTILS/authToken');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validRoles = ['administrador', 'jefe_area', 'contabilidad', 'ti'];

const validateEmail = (correo) => !correo || emailRegex.test(String(correo).trim());
const validateRole = (rol) => typeof rol === 'string' && validRoles.includes(rol);

const getAll = (req, res) => {
  const sql = `
    SELECT u.id, u.empresa_id, u.nombre_completo, u.correo, u.usuario, u.rol,
           u.estado, u.fecha_creacion, u.ultimo_acceso, e.nombre AS nombre_empresa
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.estado = "activo" AND u.rol <> "administrador"`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const insert = (req, res) => {
  const { empresa_id, nombre_completo, correo, usuario, password_hash, password, rol } = req.body;
  const userName     = usuario || correo || nombre_completo;
  const passwordValue = password || password_hash || '';

  if (!userName || !passwordValue || !rol) {
    return res.status(400).json({ error: 'Usuario, contraseña y rol son obligatorios' });
  }
  if (!validateRole(rol)) {
    return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${validRoles.join(', ')}` });
  }
  if (!validateEmail(correo)) {
    return res.status(400).json({ error: 'Correo inválido' });
  }

  const userCheckSql = 'SELECT id FROM usuarios WHERE usuario = ? OR correo = ? LIMIT 1';
  db.query(userCheckSql, [userName, correo || ''], (checkErr, existing) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (existing?.length) return res.status(409).json({ error: 'Usuario o correo ya registrado' });

    const hashedPassword = bcrypt.hashSync(passwordValue, 10);
    const sql = 'CALL sp_insert_usuario(?,?,?,?,?,?)';
    db.query(sql, [empresa_id || null, nombre_completo, correo || null, userName, hashedPassword, rol], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const id = result?.[0]?.[0]?.id;
      res.json({ mensaje: 'Usuario creado', id });
    });
  });
};

const update = (req, res) => {
  const { id, empresa_id, nombre_completo, correo, rol, estado, usuario, password } = req.body;
  if (!id) return res.status(400).json({ error: 'ID de usuario es obligatorio' });
  if (correo && !validateEmail(correo)) {
    return res.status(400).json({ error: 'Correo inválido' });
  }
  if (rol && !validateRole(rol)) {
    return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${validRoles.join(', ')}` });
  }

  const sql = 'CALL sp_update_usuario(?,?,?,?,?,?)';
  db.query(sql, [empresa_id || null, nombre_completo, correo || null, rol, estado, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const updates = [];
    const values  = [];

    if (usuario) { updates.push('usuario = ?');       values.push(usuario); }
    if (password) { updates.push('password_hash = ?'); values.push(bcrypt.hashSync(password, 10)); }

    if (!updates.length) return res.json({ mensaje: 'Usuario actualizado' });

    values.push(id);
    db.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values, (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ mensaje: 'Usuario actualizado' });
    });
  });
};

const login = (req, res) => {
  const { usuario, password, roles_permitidos } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  const sql = `
    SELECT u.id, u.empresa_id, u.nombre_completo, u.correo, u.usuario, u.password_hash, u.rol,
           e.nombre AS nombre_empresa
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.usuario = ? AND u.estado = "activo"
    LIMIT 1`;

  db.query(sql, [usuario], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = results[0];
    let validPassword = false;

    try { validPassword = await bcrypt.compare(password, user.password_hash); }
    catch { validPassword = false; }

    if (!validPassword) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const allowedRoles = Array.isArray(roles_permitidos) ? roles_permitidos : [];
    if (allowedRoles.length && !allowedRoles.includes(user.rol)) {
      return res.status(403).json({ error: 'Tu usuario no tiene permiso para entrar aquí' });
    }

    db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);
    delete user.password_hash;
    const expiresInSeconds = Number(process.env.AUTH_TOKEN_EXPIRES_SECONDS || 60 * 60);
    const token = authToken.sign({
      id: user.id,
      empresa_id: user.empresa_id,
      rol: user.rol,
      usuario: user.usuario
    }, expiresInSeconds);

    res.json({
      mensaje: 'Inicio de sesión correcto',
      usuario: user,
      token,
      expires_in: expiresInSeconds
    });
  });
};

const deleteUsuario = (req, res) => {
  const { id } = req.body;
  db.query('CALL sp_delete_usuario(?)', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Usuario desactivado' });
  });
};

// ─── CSV helpers (sin dependencias externas) ────────────────────────
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
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(','))
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
};

// ─── Exportar lista de usuarios de una empresa ──────────────────────
const exportByEmpresa = (req, res) => {
  const { empresaId } = req.params;
  const sql = `
    SELECT 
      u.nombre_completo,
      u.correo,
      u.usuario,
      u.rol,
      u.estado,
      DATE_FORMAT(u.fecha_creacion, '%d/%m/%Y') AS fecha_alta,
      e.nombre AS nombre_empresa
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.empresa_id = ?
    ORDER BY u.nombre_completo ASC`;

  db.query(sql, [empresaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    sendCsv(res, `usuarios_empresa_${empresaId}.csv`, results);
  });
};

module.exports = { getAll, insert, update, login, delete: deleteUsuario, exportByEmpresa };
