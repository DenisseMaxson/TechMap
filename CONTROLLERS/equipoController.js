const db = require('../DB/connection'); 
const PDFDocument = require('pdfkit');
const { enviarCorreoBajaPendiente } = require('../CONFIG/mailer');

// 1. Obtener todos los equipos de una empresa específica
const getEquiposByEmpresa = (req, res) => {
    const { empresa_id } = req.params;
    const sql = 'SELECT * FROM equipos WHERE empresa_id = ? AND estado != "dado_de_baja"';
    
    db.query(sql, [empresa_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// 2. Insertar nuevo equipo (Los 11 campos técnicos)
const insertEquipo = (req, res) => {
    const { 
        empresa_id, numero_serie, direccion_mac, direccion_ip, nombre, 
        marca, modelo, tipo, area, ubicacion_fisica, encargado_equipo,
        fecha_adquisicion, lugar_compra, valor_contable, registrado_por 
    } = req.body;

    const sql = 'CALL sp_insert_equipo(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    
    db.query(sql, [
        empresa_id, numero_serie, direccion_mac, direccion_ip, nombre, 
        marca, modelo, tipo, area, ubicacion_fisica, encargado_equipo,
        fecha_adquisicion, lugar_compra, valor_contable, registrado_por
    ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        res.json({ 
            mensaje: 'Hardware registrado con éxito', 
            id: result?.[0]?.[0]?.id 
        });
    });
};

// 3. Actualizar equipo
const updateEquipo = (req, res) => {
    const { 
        id, nombre, direccion_ip, area, ubicacion_fisica, 
        encargado_equipo, estado, usuario_id 
    } = req.body;

    const sql = 'CALL sp_update_equipo(?,?,?,?,?,?,?,?)';
    
    db.query(sql, [id, nombre, direccion_ip, area, ubicacion_fisica, encargado_equipo, estado, usuario_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Información de equipo actualizada' });
    });
};

// 4. Baja lógica del equipo
const deleteEquipo = (req, res) => {
    const { id, usuario_id } = req.body;
    const sql = 'CALL sp_delete_equipo(?,?)';

    db.query(sql, [id, usuario_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Equipo dado de baja correctamente' });
    });
};

// 5. Obtener estadísticas para el Dashboard
const getDashboardStats = (req, res) => {
    const { empresa_id } = req.params;
    const sql = 'CALL sp_get_dashboard_stats(?)';

    db.query(sql, [empresa_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            resumen: results[0][0],        
            por_tipo: results[1],         
            bajas: results[2][0],         
            financiero: results[3][0]     
        });
    });
};

// 6. Exportar ficha técnica de un equipo específico en PDF
const exportEquipoPDF = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM equipos WHERE id = ?';

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Equipo no encontrado' });

        const equipo = results[0];
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Ficha_Tecnica_Equipo_${equipo.numero_serie || id}.pdf`);

        doc.pipe(res);

        // Banner Superior Corporativo (Azul Oscuro)
        doc.rect(0, 0, 612, 100).fill('#1b2476');
        doc.fillColor('#ffffff').fontSize(22).text('TECHMAP', 50, 30, { stroke: false });
        doc.fontSize(11).text('Reporte Oficial de Control de Activos fijos', 50, 60);

        // Título del reporte
        doc.fillColor('#243b97').fontSize(16).text(`Ficha Técnica: ${equipo.nombre || 'Sin Nombre'}`, 50, 130);
        doc.strokeColor('#2b61ad').lineWidth(1).moveTo(50, 155).lineTo(562, 155).stroke();

        // SECCIÓN 1: Datos de Operación y Ubicación
        doc.fillColor('#1b2476').fontSize(12).text('1. Datos de Operación y Ubicación', 50, 175);
        doc.fillColor('#333333').fontSize(10);
        
        let y = 200;
        const spacing = 20;
        
        doc.text(`Tipo de Dispositivo:`, 60, y); doc.text(`${equipo.tipo || 'No especificado'}`, 180, y); y += spacing;
        doc.text(`Área Responsable:`, 60, y); doc.text(`${equipo.area || 'No asignada'}`, 180, y); y += spacing;
        doc.text(`Ubicación Física:`, 60, y); doc.text(`${equipo.ubicacion_fisica || 'No registrada'}`, 180, y); y += spacing;
        doc.text(`Encargado Actual:`, 60, y); doc.text(`${equipo.encargado_equipo || 'Sin encargado asignado'}`, 180, y); y += spacing;
        doc.text(`Estado del Activo:`, 60, y); doc.text(`${equipo.estado || 'Activo'}`, 180, y);

        // SECCIÓN 2: Especificaciones Técnicas (TI)
        y += 35;
        doc.fillColor('#1b2476').fontSize(12).text('2. Especificaciones de Infraestructura y TI', 50, y);
        y += 25;
        doc.fillColor('#333333').fontSize(10);
        
        doc.text(`Marca:`, 60, y); doc.text(`${equipo.marca || 'N/A'}`, 180, y); y += spacing;
        doc.text(`Modelo:`, 60, y); doc.text(`${equipo.modelo || 'N/A'}`, 180, y); y += spacing;
        doc.text(`Número de Serie:`, 60, y); doc.text(`${equipo.numero_serie || 'N/A'}`, 180, y); y += spacing;
        doc.text(`Dirección MAC:`, 60, y); doc.text(`${equipo.direccion_mac || 'No configurada'}`, 180, y); y += spacing;
        doc.text(`Dirección IP Local:`, 60, y); doc.text(`${equipo.direccion_ip || 'Dinámica / No asignada'}`, 180, y);

        // SECCIÓN 3: Datos Financieros
        y += 35;
        doc.fillColor('#1b2476').fontSize(12).text('3. Registro Financiero y Adquisición', 50, y);
        y += 25;
        doc.fillColor('#333333').fontSize(10);
        
        const fechaFormateada = equipo.fecha_adquisicion 
            ? new Date(equipo.fecha_adquisicion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) 
            : 'No declarada';
            
        const valorMoneda = equipo.valor_contable 
            ? `$${Number(equipo.valor_contable).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` 
            : '$0.00 MXN';

        doc.text(`Fecha de Compra:`, 60, y); doc.text(`${fechaFormateada}`, 180, y); y += spacing;
        doc.text(`Proveedor / Lugar:`, 60, y); doc.text(`${equipo.lugar_compra || 'No registrado'}`, 180, y); y += spacing;
        doc.text(`Valor Contable original:`, 60, y); doc.text(`${valorMoneda}`, 180, y, { stroke: false }); y += spacing;
        doc.text(`ID de Registro Interno:`, 60, y); doc.text(`${equipo.registrado_por || 'Sistema'}`, 180, y);

        // Pie de Página
        doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, 720).lineTo(562, 720).stroke();
        doc.fillColor('#999999').fontSize(8).text('Este documento constituye una representación digital de control interno de activos fijos de la empresa.', 50, 735, { align: 'center' });
        doc.text(`ID Único de Auditoría de Hardware: ${equipo.id}`, 50, 747, { align: 'center' });

        doc.end();
    });
};

// 7. Solicitar Baja
const solicitarBaja = async (req, res) => {
  const { id_equipo, motivo, solicitante, id_area } = req.body;

  try {
    const [rows] = await db.query('CALL sp_solicitar_baja(?, ?, ?)', [id_equipo, motivo, id_area]);
    const datosDeRetorno = rows[0]?.[0]; 
    const correoJefe = datosDeRetorno?.email_jefe;
    const nombreEquipo = datosDeRetorno?.nombre_equipo || "Equipo Registrado";

    console.log(`Procedimiento ejecutado. Jefe detectado: ${correoJefe}, Equipo: ${nombreEquipo}`);

    if (correoJefe) {
      enviarCorreoBajaPendiente(correoJefe, {
        id_equipo,
        nombre_equipo: nombreEquipo,
        motivo,
        solicitante
      }).then(() => {
        console.log(`📧 Notificación de baja enviada con éxito a: ${correoJefe}`);
      }).catch(err => {
        console.error('❌ Error al enviar el correo con Nodemailer:', err);
      });
    } else {
      console.log('⚠️ No se envió correo porque no se encontró un Jefe asignado a esta área.');
    }

    return res.status(200).json({
      success: true,
      message: 'La solicitud de baja se registró y se notificó al jefe de área.'
    });

  } catch (error) {
    console.error('❌ Error en el controlador sp_solicitar_baja:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno en el servidor al procesar la baja.' 
    });
  }
};

// EXPORTACIONES MODIFICADAS
module.exports = {
    getEquiposByEmpresa,
    getDashboardStats,
    insert: insertEquipo,
    update: updateEquipo,
    bajaLogica: deleteEquipo, // <-- REEMPLAZADO PARA EVITAR PALABRAS RESERVADAS
    exportPDF: exportEquipoPDF,
    solicitarBaja
};