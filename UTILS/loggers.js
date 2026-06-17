const db = require('../DB/connection');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0] || 'IP desconocida';
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'IP desconocida';
};

const logAction = (usuario_id, empresa_id, accion, modulo, detalle, req) => {
  const ip_origen = getClientIp(req);
  const sql = 'INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle, ip_origen) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(sql, [usuario_id, empresa_id, accion, modulo, detalle, ip_origen], (err) => {
    if (err) console.error('Error en bitácora:', err.message);
  });
};

module.exports = { logAction, getClientIp };