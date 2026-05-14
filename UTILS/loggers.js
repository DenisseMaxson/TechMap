const db = require('../DB/connection');

const logAction = (usuario_id, empresa_id, accion, modulo, detalle, req) => {
    const ip_origen = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    
    const sql = 'INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle, ip_origen) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [usuario_id, empresa_id, accion, modulo, detalle, ip_origen], (err) => {
        if (err) console.error('Error en bitácora:', err.message);
    });
};

module.exports = { logAction };