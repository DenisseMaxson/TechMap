const { Parser } = require('json2csv');
const db = require('../DB/connection');

// ─── Helpers ────────────────────────────────────────────────────────
const toCSV = (fields, data) => new Parser({ fields }).parse(data);

const sendCSV = (res, csv, filename) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv); // BOM para Excel
};

const slugify = (str) => String(str || 'empresa').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

// ─── Exportar BD completa de una empresa ────────────────────────────
// GET /api/empresas/:id/export?ref=SOL-2025-001
const exportEmpresa = (req, res) => {
  const { id }  = req.params;
  const ref     = req.query.ref || 'Sin referencia';

  // 1. Verificar que la empresa existe
  db.query('SELECT * FROM empresas WHERE id = ?', [id], (err, empresas) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!empresas.length) return res.status(404).json({ error: 'Empresa no encontrada' });

    const empresa = empresas[0];

    // 2. Obtener equipos
    db.query('SELECT * FROM equipos WHERE empresa_id = ?', [id], (err2, equipos) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // 3. Obtener usuarios
      db.query('SELECT nombre_completo, correo, usuario, rol, estado, fecha_creacion FROM usuarios WHERE empresa_id = ?', [id], (err3, usuarios) => {
        if (err3) return res.status(500).json({ error: err3.message });

        // 4. Obtener historial
        db.query(`
          SELECT 
            hm.tipo_movimiento,
            hm.descripcion,
            hm.fecha,
            u.nombre_completo AS usuario
          FROM historial_movimientos hm
          LEFT JOIN usuarios u ON hm.usuario_id = u.id
          WHERE hm.empresa_id = ?
          ORDER BY hm.fecha DESC
        `, [id], (err4, historial) => {
          if (err4) return res.status(500).json({ error: err4.message });

          // 5. Registrar exportación en tabla exportaciones
          db.query(`
            INSERT INTO exportaciones (solicitado_por, empresa_id, tipo_exportacion, referencia_solicitud)
            VALUES (1, ?, 'bd_completa', ?)
          `, [id, ref], () => {}); // no bloquear si falla el log

          // 6. Construir CSV con secciones
          const fecha = new Date().toLocaleString('es-MX');
          let output = '';

          // Encabezado general
          output += `EXPORTACIÓN BD COMPLETA - TECHMAP\n`;
          output += `Empresa:,${empresa.nombre}\n`;
          output += `RFC:,${empresa.rfc || ''}\n`;
          output += `Ubicación:,${empresa.ubicacion || ''}\n`;
          output += `Referencia solicitud:,${ref}\n`;
          output += `Fecha de exportación:,${fecha}\n\n`;

          // Sección equipos
          output += `=== INVENTARIO DE EQUIPOS ===\n`;
          if (equipos.length) {
            const camposEquipos = [
              { label: 'ID',              value: 'id' },
              { label: 'Nombre',          value: 'nombre' },
              { label: 'Tipo',            value: 'tipo' },
              { label: 'Marca',           value: 'marca' },
              { label: 'Modelo',          value: 'modelo' },
              { label: 'Núm. Serie',      value: 'numero_serie' },
              { label: 'Ubicación',       value: 'ubicacion_fisica' },
              { label: 'Valor contable',  value: 'valor_contable' },
              { label: 'Estado',          value: 'estado' },
              { label: 'Fecha registro',  value: 'fecha_registro' },
            ];
            output += toCSV(camposEquipos, equipos) + '\n\n';
          } else {
            output += `Sin equipos registrados\n\n`;
          }

          // Sección usuarios
          output += `=== USUARIOS ===\n`;
          if (usuarios.length) {
            const camposUsuarios = [
              { label: 'Nombre completo', value: 'nombre_completo' },
              { label: 'Correo',          value: 'correo' },
              { label: 'Usuario',         value: 'usuario' },
              { label: 'Rol',             value: 'rol' },
              { label: 'Estado',          value: 'estado' },
              { label: 'Fecha de alta',   value: 'fecha_creacion' },
            ];
            output += toCSV(camposUsuarios, usuarios) + '\n\n';
          } else {
            output += `Sin usuarios registrados\n\n`;
          }

          // Sección historial
          output += `=== HISTORIAL DE MOVIMIENTOS ===\n`;
          if (historial.length) {
            const camposHist = [
              { label: 'Tipo movimiento', value: 'tipo_movimiento' },
              { label: 'Descripción',     value: 'descripcion' },
              { label: 'Usuario',         value: 'usuario' },
              { label: 'Fecha',           value: 'fecha' },
            ];
            output += toCSV(camposHist, historial) + '\n';
          } else {
            output += `Sin historial registrado\n`;
          }

          const filename = `BD_${slugify(empresa.nombre)}_${Date.now()}.csv`;
          sendCSV(res, output, filename);
        });
      });
    });
  });
};

// ─── Exportar solo lista de usuarios de empresa ──────────────────────
// GET /api/usuarios/empresa/:id/export
const exportUsuarios = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      u.nombre_completo,
      u.correo,
      u.usuario,
      u.rol,
      u.estado,
      DATE_FORMAT(u.fecha_creacion, '%d/%m/%Y') AS fecha_alta,
      e.nombre AS empresa
    FROM usuarios u
    LEFT JOIN empresas e ON u.empresa_id = e.id
    WHERE u.empresa_id = ?
    ORDER BY u.rol, u.nombre_completo
  `;
  db.query(sql, [id], (err, results) => {
    if (err)  return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(404).json({ error: 'Sin usuarios para exportar' });

    const fields = [
      { label: 'Nombre completo', value: 'nombre_completo' },
      { label: 'Correo',          value: 'correo' },
      { label: 'Usuario',         value: 'usuario' },
      { label: 'Rol',             value: 'rol' },
      { label: 'Estado',          value: 'estado' },
      { label: 'Fecha de alta',   value: 'fecha_alta' },
      { label: 'Empresa',         value: 'empresa' },
    ];

    const csv      = toCSV(fields, results);
    const nombre   = slugify(results[0].empresa || `empresa_${id}`);
    const filename = `Usuarios_${nombre}_${Date.now()}.csv`;

    // Registrar en exportaciones
    db.query(`
      INSERT INTO exportaciones (solicitado_por, empresa_id, tipo_exportacion)
      VALUES (1, ?, 'lista_usuarios')
    `, [id], () => {});

    sendCSV(res, csv, filename);
  });
};

module.exports = { exportEmpresa, exportUsuarios };