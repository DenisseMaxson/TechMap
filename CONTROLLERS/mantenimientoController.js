const db = require('../DB/connection');
const authToken = require('../UTILS/authToken');

const getAuth = (req) => req.user || authToken.verify(authToken.getTokenFromRequest(req)) || {};

const getEmpresaId = (req) => {
  const auth = getAuth(req);
  if (auth.rol && auth.rol !== 'administrador') return Number(auth.empresa_id);
  return Number(req.body?.empresa_id || req.params?.empresa_id || req.query?.empresa_id || req.get('x-empresa-id') || auth.empresa_id);
};

const getUsuarioId = (req) => {
  const auth = getAuth(req);
  return Number(auth.id || req.body?.usuario_id || req.body?.registrado_por || req.query?.usuario_id || req.get('x-user-id')) || null;
};

const canManageMaintenance = (req) => {
  const rol = getAuth(req).rol;
  return ['ti', 'administrador'].includes(rol);
};

const requireEmpresa = (req, res) => {
  const auth = getAuth(req);
  if (!auth.id) {
    res.status(401).json({ error: 'Sesion requerida.' });
    return null;
  }

  const empresaId = getEmpresaId(req);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    res.status(400).json({ error: 'empresa_id es obligatorio para aislar los datos por empresa.' });
    return null;
  }

  return empresaId;
};

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const pad = (value) => String(value).padStart(2, '0');
const toDateText = (year, monthIndex, day = 15) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

const getFrecuencia = (equipo) => {
  const area = String(equipo.area || '').toLowerCase();
  const tipo = String(equipo.tipo || '').toLowerCase();

  if (tipo === 'servidor' || area.includes('servidor')) {
    return { frecuencia: 'semestral', meses: 6 };
  }
  if (area.includes('produccion') || area.includes('producción')) {
    return { frecuencia: 'bimestral', meses: 2 };
  }
  if (area.includes('admin')) {
    return { frecuencia: 'trimestral', meses: 3 };
  }
  return { frecuencia: 'trimestral', meses: 3 };
};

const getMantenimientosByEmpresa = async (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  try {
    const rows = await query(
      `SELECT m.id,
              m.empresa_id,
              m.equipo_id,
              e.nombre AS equipo,
              e.numero_serie,
              e.tipo AS tipo_equipo,
              e.area,
              m.tipo,
              m.frecuencia,
              m.fecha_programada,
              m.fecha_realizada,
              CASE
                WHEN m.estado = 'programado' AND m.fecha_programada < CURDATE() THEN 'vencido'
                ELSE m.estado
              END AS estado,
              m.tecnico_responsable,
              m.observaciones,
              m.fecha_registro
       FROM mantenimientos m
       INNER JOIN equipos e ON e.id = m.equipo_id AND e.empresa_id = m.empresa_id
       WHERE m.empresa_id = ?
       ORDER BY m.fecha_programada ASC, m.id ASC`,
      [empresaId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const programarPreventivos = async (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;
  if (!canManageMaintenance(req)) {
    return res.status(403).json({ error: 'Solo TI o administrador pueden programar mantenimientos.' });
  }

  const year = Number(req.body?.anio || req.body?.year || new Date().getFullYear());
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ error: 'Anio invalido.' });
  }

  const usuarioId = getUsuarioId(req);

  try {
    const equipos = await query(
      `SELECT id, tipo, area
       FROM equipos
       WHERE empresa_id = ? AND estado <> 'dado_de_baja'`,
      [empresaId]
    );

    let creados = 0;
    for (const equipo of equipos) {
      const { frecuencia, meses } = getFrecuencia(equipo);
      for (let month = 0; month < 12; month += meses) {
        const result = await query(
          `INSERT IGNORE INTO mantenimientos
             (empresa_id, equipo_id, tipo, frecuencia, fecha_programada, estado, registrado_por)
           VALUES (?, ?, 'preventivo', ?, ?, 'programado', ?)`,
          [empresaId, equipo.id, frecuencia, toDateText(year, month), usuarioId]
        );
        creados += result.affectedRows || 0;
      }
    }

    await query(
      'INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle) VALUES (?, ?, ?, ?, ?)',
      [usuarioId, empresaId, 'programacion_mantenimiento', 'mantenimientos', `Programacion preventiva ${year}: ${creados} servicios creados`]
    ).catch(() => {});

    res.json({ mensaje: 'Programacion preventiva generada.', anio: year, creados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registrarMantenimiento = async (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;
  if (!canManageMaintenance(req)) {
    return res.status(403).json({ error: 'Solo TI o administrador pueden registrar mantenimientos.' });
  }

  const {
    id,
    equipo_id,
    tipo = 'correctivo',
    frecuencia = 'manual',
    fecha_programada,
    fecha_realizada,
    estado = 'realizado',
    tecnico_responsable,
    observaciones
  } = req.body;
  const usuarioId = getUsuarioId(req);

  if (!['preventivo', 'correctivo'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de mantenimiento invalido.' });
  }
  if (!['bimestral', 'trimestral', 'semestral', 'manual'].includes(frecuencia)) {
    return res.status(400).json({ error: 'Frecuencia invalida.' });
  }
  if (!['programado', 'realizado', 'vencido', 'cancelado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado invalido.' });
  }

  try {
    if (id) {
      const result = await query(
        `UPDATE mantenimientos
         SET fecha_realizada = ?,
             estado = ?,
             tecnico_responsable = ?,
             observaciones = ?
         WHERE id = ? AND empresa_id = ?`,
        [fecha_realizada || null, estado, tecnico_responsable || null, observaciones || null, id, empresaId]
      );

      if (!result.affectedRows) return res.status(404).json({ error: 'Mantenimiento no encontrado.' });
      return res.json({ mensaje: 'Mantenimiento actualizado.' });
    }

    if (!equipo_id) return res.status(400).json({ error: 'equipo_id es obligatorio.' });

    const programada = fecha_programada || fecha_realizada || new Date().toISOString().slice(0, 10);
    const result = await query(
      `INSERT INTO mantenimientos
         (empresa_id, equipo_id, tipo, frecuencia, fecha_programada, fecha_realizada, estado, tecnico_responsable, observaciones, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empresaId,
        equipo_id,
        tipo,
        frecuencia,
        programada,
        fecha_realizada || programada,
        estado,
        tecnico_responsable || null,
        observaciones || null,
        usuarioId
      ]
    );

    res.json({ mensaje: 'Mantenimiento registrado.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMantenimientosByEmpresa,
  programarPreventivos,
  registrarMantenimiento
};
