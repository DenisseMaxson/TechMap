const db = require('../DB/connection');
const PDFDocument = require('pdfkit');
const { enviarCorreoBajaPendiente } = require('../CONFIG/mailer');
const authToken = require('../UTILS/authToken');

const normalizeTipo = (tipo) => {
  const value = String(tipo || 'otro').toLowerCase();
  const map = {
    portatil: 'laptop',
    'portátil': 'laptop',
    pc: 'computadora',
    desktop: 'computadora',
    camara: 'otro',
    'cámara': 'otro',
    teclado: 'otro',
    mouse: 'otro',
    'lector de huellas': 'otro'
  };
  const normalized = map[value] || value;
  const allowed = ['computadora', 'laptop', 'servidor', 'impresora', 'switch', 'router', 'monitor', 'telefono_ip', 'otro'];
  return allowed.includes(normalized) ? normalized : 'otro';
};

const ipRegex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})$/;
const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isValidIp = (value) => !value || ipRegex.test(String(value).trim());
const isValidMac = (value) => !value || macRegex.test(String(value).trim());
const isValidDate = (value) => !value || dateRegex.test(String(value).trim());

let equipoColumnsCache = null;
const getEquipoColumns = (callback) => {
  if (equipoColumnsCache) return callback(null, equipoColumnsCache);
  db.query('SHOW COLUMNS FROM equipos', (err, rows) => {
    if (err) return callback(err);
    equipoColumnsCache = new Set(rows.map((row) => row.Field));
    callback(null, equipoColumnsCache);
  });
};

const pickExistingColumns = (columns, values) => {
  const fields = [];
  const params = [];
  Object.entries(values).forEach(([field, value]) => {
    if (columns.has(field)) {
      fields.push(field);
      params.push(value);
    }
  });
  return { fields, params };
};

const getAuth = (req) => req.user || authToken.verify(authToken.getTokenFromRequest(req)) || {};
const getEmpresaId = (req) => {
  const auth = getAuth(req);
  if (auth.rol && auth.rol !== 'administrador') return Number(auth.empresa_id);
  return Number(req.body?.empresa_id || req.params?.empresa_id || req.query?.empresa_id || req.get('x-empresa-id') || auth.empresa_id);
};
const getUsuarioId = (req) => {
  const auth = getAuth(req);
  return Number(auth.id || req.body?.usuario_id || req.body?.registrado_por || req.body?.solicitado_por || req.query?.usuario_id || req.get('x-user-id')) || null;
};

const requireEmpresa = (req, res) => {
  const auth = getAuth(req);
  if (!auth.id) {
    res.status(401).json({ error: 'Sesión requerida.' });
    return null;
  }
  const empresaId = getEmpresaId(req);
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    res.status(400).json({ error: 'empresa_id es obligatorio para aislar los datos por empresa.' });
    return null;
  }
  return empresaId;
};

const getEquiposByEmpresa = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  db.query(
    'SELECT * FROM equipos WHERE empresa_id = ? AND estado != "dado_de_baja" ORDER BY fecha_registro DESC, id DESC',
    [empresaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
};

const insertEquipo = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  const {
    id, nombre, numero_serie, direccion_mac, direccion_ip, modelo, tipo, area, ubicacion_fisica,
    encargado_equipo, fecha_adquisicion, fecha_compra, lugar_compra, observaciones,
    descripcion, estado
  } = req.body;
  const usuarioId = getUsuarioId(req);

  if (!numero_serie || !nombre) {
    return res.status(400).json({ error: 'Número de serie y nombre de equipo son obligatorios.' });
  }
  if (!isValidIp(direccion_ip)) {
    return res.status(400).json({ error: 'Dirección IP inválida.' });
  }
  if (!isValidMac(direccion_mac)) {
    return res.status(400).json({ error: 'Dirección MAC inválida.' });
  }
  if (!isValidDate(fecha_adquisicion) && !isValidDate(fecha_compra)) {
    return res.status(400).json({ error: 'Fecha de adquisición o compra con formato inválido. Use AAAA-MM-DD.' });
  }

  getEquipoColumns((columnsErr, columns) => {
    if (columnsErr) return res.status(500).json({ error: columnsErr.message });

    const { fields, params } = pickExistingColumns(columns, {
      empresa_id: empresaId,
      numero_serie,
      direccion_mac: direccion_mac || null,
      direccion_ip: direccion_ip || null,
      nombre,
      marca: marca || null,
      modelo: modelo || null,
      tipo: normalizeTipo(tipo),
      area: area || null,
      ubicacion_fisica: ubicacion_fisica || null,
      encargado_equipo: encargado_equipo || null,
      fecha_adquisicion: fecha_adquisicion || fecha_compra || null,
      lugar_compra: lugar_compra || null,
      valor_contable: valor_contable || null,
      observaciones: observaciones || descripcion || null,
      registrado_por: usuarioId
    });

    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO equipos (${fields.join(', ')}) VALUES (${placeholders})`;

    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(
        'INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle) VALUES (?, ?, ?, ?, ?)',
        [usuarioId, empresaId, 'alta_equipo', 'inventario', `Alta de equipo serie: ${numero_serie || result.insertId}`],
        () => {}
      );
      db.query(
        'INSERT INTO historial_movimientos (empresa_id, equipo_id, usuario_id, tipo_movimiento, descripcion) VALUES (?, ?, ?, ?, ?)',
        [empresaId, result.insertId, usuarioId, 'alta', `Alta de equipo: ${nombre} - ${numero_serie}`],
        () => {}
      );

      res.json({ mensaje: 'Hardware registrado con exito', id: result.insertId });
    });
  });
};

const updateEquipo = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  // 1. Incluimos TODOS los campos necesarios
  const {
    id, nombre, numero_serie, direccion_mac, direccion_ip, marca, modelo, tipo, area, ubicacion_fisica,
    encargado_equipo, fecha_adquisicion, fecha_compra, lugar_compra, observaciones,
    descripcion, estado
  } = req.body;
  const usuarioId = getUsuarioId(req);

  if (!id) return res.status(400).json({ error: 'ID de equipo es obligatorio.' });
  
  // (Mantén tus validaciones de IP, MAC y Fecha igual aquí abajo)
  if (!isValidIp(direccion_ip)) return res.status(400).json({ error: 'Dirección IP inválida.' });
  if (!isValidMac(direccion_mac)) return res.status(400).json({ error: 'Dirección MAC inválida.' });
  if (!isValidDate(fecha_adquisicion) && !isValidDate(fecha_compra)) {
    return res.status(400).json({ error: 'Fecha inválida. Use AAAA-MM-DD.' });
  }

  getEquipoColumns((columnsErr, columns) => {
    if (columnsErr) return res.status(500).json({ error: columnsErr.message });

    // 2. Mapeamos todo al objeto updateValues
    const updateValues = {
      nombre,
      numero_serie: numero_serie || null,
      marca: marca || null,
      modelo: modelo || null,
      direccion_mac: direccion_mac || null,
      direccion_ip: direccion_ip || null,
      tipo: normalizeTipo(tipo),
      area: area || null,
      ubicacion_fisica: ubicacion_fisica || null,
      encargado_equipo: encargado_equipo || null,
      fecha_adquisicion: fecha_adquisicion || fecha_compra || null,
      lugar_compra: lugar_compra || null,
      observaciones: observaciones || descripcion || null
    };

    const setParts = [];
    const params = [];
    Object.entries(updateValues).forEach(([field, value]) => {
      if (columns.has(field)) {
        setParts.push(`${field} = ?`);
        params.push(value);
      }
    });

    if (!setParts.length) return res.status(400).json({ error: 'No hay campos compatibles.' });

    params.push(id, empresaId);
    const sql = `UPDATE equipos SET ${setParts.join(', ')} WHERE id = ? AND empresa_id = ?`;

    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) return res.status(404).json({ error: 'Equipo no encontrado.' });

      // ... (Tus inserts de bitacora y historial se quedan igual)
      res.json({ mensaje: 'Informacion de equipo actualizada' });
    });
  });
};

const deleteEquipo = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  const { id } = req.body;
  const usuarioId = getUsuarioId(req);

  db.query('UPDATE equipos SET estado = "dado_de_baja" WHERE id = ? AND empresa_id = ?', [id, empresaId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'Equipo no encontrado para esta empresa.' });

    db.query(
      'INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle) VALUES (?, ?, ?, ?, ?)',
      [usuarioId, empresaId, 'baja_ejecutada', 'inventario', `Equipo ID: ${id} marcado como inactivo`],
      () => {}
    );
    db.query(
      'INSERT INTO historial_movimientos (empresa_id, equipo_id, usuario_id, tipo_movimiento, descripcion) VALUES (?, ?, ?, ?, ?)',
      [empresaId, id, usuarioId, 'baja_ejecutada', `Equipo ID: ${id} dado de baja`],
      () => {}
    );

    res.json({ mensaje: 'Equipo dado de baja correctamente' });
  });
};

const getDashboardStats = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  db.query('CALL sp_get_dashboard_stats(?)', [empresaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      resumen: results[0][0],
      por_tipo: results[1],
      bajas: results[2][0],
      financiero: results[3][0]
    });
  });
};

const getHistorial = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  const sql = `
    SELECT hm.id,
           hm.empresa_id,
           hm.equipo_id,
           hm.usuario_id,
           u.nombre_completo AS usuario,
           hm.tipo_movimiento AS tipo,
           hm.descripcion AS detalle,
           hm.fecha,
           e.nombre AS equipo,
           e.numero_serie
    FROM historial_movimientos hm
    LEFT JOIN usuarios u ON hm.usuario_id = u.id
    LEFT JOIN equipos e ON hm.equipo_id = e.id AND e.empresa_id = hm.empresa_id
    WHERE hm.empresa_id = ?
    ORDER BY hm.fecha DESC, hm.id DESC
  `;

  db.query(sql, [empresaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const exportEquipoPDF = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  db.query('SELECT * FROM equipos WHERE id = ? AND empresa_id = ?', [req.params.id, empresaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ error: 'Equipo no encontrado para esta empresa' });

    const equipo = results[0];
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ficha_Tecnica_Equipo_${equipo.numero_serie || equipo.id}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 612, 90).fill('#1b2476');
    doc.fillColor('#ffffff').fontSize(22).text('TECHMAP', 50, 28);
    doc.fontSize(11).text('Reporte oficial de control de activos fijos', 50, 58);

    doc.fillColor('#243b97').fontSize(16).text(`Ficha tecnica: ${equipo.nombre || 'Sin nombre'}`, 50, 120);
    doc.strokeColor('#2b61ad').lineWidth(1).moveTo(50, 145).lineTo(562, 145).stroke();

    const rows = [
      ['ID', equipo.id],
      ['Nombre', equipo.nombre],
      ['Tipo', equipo.tipo],
      ['Marca', equipo.marca],
      ['Modelo', equipo.modelo],
      ['Numero de serie', equipo.numero_serie],
      ['MAC', equipo.direccion_mac],
      ['IP', equipo.direccion_ip],
      ['Area', equipo.area],
      ['Ubicacion', equipo.ubicacion_fisica],
      ['Encargado', equipo.encargado_equipo],
      ['Fecha adquisicion', equipo.fecha_adquisicion ? new Date(equipo.fecha_adquisicion).toLocaleDateString('es-MX') : 'No declarada'],
      ['Lugar de compra', equipo.lugar_compra],
      ['Valor contable', equipo.valor_contable ? `$${Number(equipo.valor_contable).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : 'No registrado'],
      ['Estado', equipo.estado],
      ['Observaciones', equipo.observaciones]
    ];

    let y = 170;
    doc.fillColor('#333333').fontSize(10);
    rows.forEach(([label, value]) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.font('Helvetica-Bold').text(`${label}:`, 60, y);
      doc.font('Helvetica').text(String(value || 'No registrado'), 190, y, { width: 350 });
      y += 22;
    });

    doc.end();
  });
};

const getSolicitudesBaja = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  const sql = `
    SELECT
      sb.id,
      sb.equipo_id,
      e.nombre AS dispositivo,
      e.numero_serie AS serie,
      NULL AS area,
      u.nombre_completo AS solicitante,
      sb.solicitado_por,
      sb.motivo,
      sb.evidencia_url AS evidencia,
      sb.estado,
      sb.fecha_solicitud,
      sb.fecha_resolucion,
      sb.observaciones
    FROM solicitudes_baja sb
    INNER JOIN equipos e ON sb.equipo_id = e.id AND e.empresa_id = sb.empresa_id
    LEFT JOIN usuarios u ON sb.solicitado_por = u.id
    WHERE sb.empresa_id = ?
    ORDER BY sb.fecha_solicitud DESC, sb.id DESC
  `;

  db.query(sql, [empresaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

const solicitarBaja = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  const { id_equipo, motivo, evidencia, evidencia_url } = req.body;
  const usuarioId = getUsuarioId(req);

  if (!usuarioId) return res.status(400).json({ success: false, message: 'usuario_id es obligatorio para registrar la solicitud.' });
  if (!id_equipo || !motivo) return res.status(400).json({ success: false, message: 'Equipo y motivo son obligatorios.' });

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ success: false, message: txErr.message });

    db.query('SELECT id, nombre, empresa_id FROM equipos WHERE id = ? AND empresa_id = ? AND estado != "dado_de_baja"', [id_equipo, empresaId], (findErr, equipos) => {
      if (findErr || !equipos.length) {
        return db.rollback(() => res.status(findErr ? 500 : 404).json({
          success: false,
          message: findErr?.message || 'Equipo no encontrado para esta empresa.'
        }));
      }

      const equipo = equipos[0];
      const insertSql = `
        INSERT INTO solicitudes_baja (equipo_id, empresa_id, solicitado_por, motivo, evidencia_url, estado, fecha_solicitud)
        VALUES (?, ?, ?, ?, ?, 'pendiente', NOW())
      `;

      db.query(insertSql, [id_equipo, empresaId, usuarioId, motivo, evidencia_url || evidencia || null], (insertErr, result) => {
        if (insertErr) {
          return db.rollback(() => res.status(500).json({ success: false, message: insertErr.message }));
        }

        db.query('UPDATE equipos SET estado = "en_baja" WHERE id = ? AND empresa_id = ?', [id_equipo, empresaId], (updateErr) => {
          if (updateErr) {
            return db.rollback(() => res.status(500).json({ success: false, message: updateErr.message }));
          }

          db.query(
            'INSERT INTO historial_movimientos (empresa_id, equipo_id, usuario_id, tipo_movimiento, descripcion) VALUES (?, ?, ?, ?, ?)',
            [empresaId, id_equipo, usuarioId, 'solicitud_baja', `Solicitud de baja iniciada para ${equipo.nombre}. Motivo: ${motivo}`],
            () => {}
          );

          db.commit((commitErr) => {
            if (commitErr) return db.rollback(() => res.status(500).json({ success: false, message: commitErr.message }));

            db.query(
              'SELECT correo FROM usuarios WHERE empresa_id = ? AND rol = "jefe_area" AND estado = "activo" LIMIT 1',
              [empresaId],
              (mailErr, users) => {
                const correoJefe = !mailErr && users?.[0]?.correo;
                if (correoJefe) {
                  enviarCorreoBajaPendiente(correoJefe, {
                    id_equipo,
                    nombre_equipo: equipo.nombre,
                    motivo,
                    solicitante: usuarioId
                  }).catch((err) => console.error('Error enviando correo de baja:', err));
                }
              }
            );

            res.status(200).json({
              success: true,
              id: result.insertId,
              message: 'La solicitud de baja se registro para esta empresa.'
            });
          });
        });
      });
    });
  });
};

const resolverBaja = (req, res) => {
  const empresaId = requireEmpresa(req, res);
  if (!empresaId) return;

  const { id, estado, observaciones } = req.body;
  const usuarioId = getUsuarioId(req);
  const decision = estado === 'aprobada' ? 'aprobada' : estado === 'rechazada' ? 'rechazada' : null;

  if (!decision) return res.status(400).json({ error: 'Estado inválido.' });
  if (decision === 'rechazada' && !observaciones) {
    return res.status(400).json({ error: 'Comentario obligatorio para rechazo.' });
  }

  db.query(
    'SELECT equipo_id FROM solicitudes_baja WHERE id = ? AND empresa_id = ? AND estado = "pendiente"',
    [id, empresaId],
    (findErr, rows) => {
      if (findErr) return res.status(500).json({ error: findErr.message });
      if (!rows.length) return res.status(404).json({ error: 'Solicitud pendiente no encontrada para esta empresa.' });

      const equipoId = rows[0].equipo_id;
      const sql = `
        UPDATE solicitudes_baja sb
        INNER JOIN equipos e ON sb.equipo_id = e.id AND e.empresa_id = sb.empresa_id
        SET sb.estado = ?,
            sb.fecha_resolucion = NOW(),
            sb.observaciones = ?,
            e.estado = IF(? = 'aprobada', 'dado_de_baja', 'activo')
        WHERE sb.id = ? AND sb.empresa_id = ? AND sb.estado = 'pendiente'
      `;

      db.query(sql, [decision, observaciones || null, decision, id, empresaId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result.affectedRows) return res.status(404).json({ error: 'Solicitud pendiente no encontrada para esta empresa.' });

        db.query(
          `INSERT INTO aprobaciones_baja (solicitud_id, aprobador_id, rol_aprobador, decision, comentario)
           VALUES (?, ?, 'jefe_area', ?, ?)
           ON DUPLICATE KEY UPDATE decision = VALUES(decision), comentario = VALUES(comentario), fecha_decision = NOW()`,
          [id, usuarioId || 1, decision, observaciones || null],
          () => {}
        );

        db.query(
          'INSERT INTO historial_movimientos (empresa_id, equipo_id, usuario_id, tipo_movimiento, descripcion) VALUES (?, ?, ?, ?, ?)',
          [
            empresaId,
            equipoId,
            usuarioId,
            decision === 'aprobada' ? 'aprobacion_baja' : 'rechazo_baja',
            `Solicitud de baja ${id} ${decision}. Comentario: ${observaciones || 'Sin comentario'}`
          ],
          () => {}
        );

        db.query(
          'INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle) VALUES (?, ?, ?, ?, ?)',
          [usuarioId, empresaId, decision === 'aprobada' ? 'aprobacion_baja' : 'rechazo_baja', 'aprobaciones', `Solicitud de baja ${id}: ${decision}`],
          () => {}
        );

        res.json({ mensaje: `Solicitud ${decision}.` });
      });
    }
  );
};

module.exports = {
  getEquiposByEmpresa,
  getDashboardStats,
  getHistorial,
  insert: insertEquipo,
  update: updateEquipo,
  bajaLogica: deleteEquipo,
  exportPDF: exportEquipoPDF,
  solicitarBaja,
  getSolicitudesBaja,
  resolverBaja
};
