const db = require('../DB/connection');
const { logAction } = require('../UTILS/loggers');
const { validateRFC } = require('../UTILS/validators');

const normalizeRFC = (value) => String(value || '').trim().toUpperCase();
const normalizeText = (value) => String(value || '').trim();
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// 1. OBTENER TODAS LAS EMPRESAS
const getAll = (req, res) => {
  db.query('SELECT * FROM empresas WHERE estado = "activa"', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 2. INSERTAR EMPRESA
const insert = (req, res) => {
  const {
    nombre, rfc, ubicacion,
    telefono_principal, telefono_secundario, telefono_adicional,
    correo_contacto
  } = req.body;
  const adminId = req.user?.id || null;

  const nombreNormalizado = normalizeText(nombre);
  const rfcNormalizado = normalizeRFC(rfc);
  const ubicacionNormalizada = normalizeText(ubicacion);
  const correoNormalizado = normalizeText(correo_contacto);
  const telefonoPrincipalNormalizado = normalizePhone(telefono_principal);
  const telefonoSecundarioNormalizado = normalizePhone(telefono_secundario);
  const telefonoAdicionalNormalizado = normalizePhone(telefono_adicional);

  if (!nombreNormalizado) {
    return res.status(400).json({ error: 'El nombre de la empresa es obligatorio.' });
  }

  if (!rfcNormalizado || rfcNormalizado.length < 12 || rfcNormalizado.length > 13) {
    return res.status(400).json({
      error: 'El RFC debe tener entre 12 caracteres alfanuméricos.'
    });
  }

  if (!ubicacionNormalizada) {
    return res.status(400).json({ error: 'La ubicación es obligatoria.' });
  }

  if (!telefonoPrincipalNormalizado || telefonoPrincipalNormalizado.length !== 10) {
    return res.status(400).json({ error: 'El teléfono principal debe tener exactamente 10 dígitos.' });
  }

  if (telefonoSecundarioNormalizado && telefonoSecundarioNormalizado.length !== 10) {
    return res.status(400).json({ error: 'El teléfono secundario debe tener exactamente 10 dígitos.' });
  }

  if (telefonoAdicionalNormalizado && telefonoAdicionalNormalizado.length !== 10) {
    return res.status(400).json({ error: 'El teléfono adicional debe tener exactamente 10 dígitos.' });
  }

  if (!correoNormalizado || !emailRegex.test(correoNormalizado)) {
    return res.status(400).json({
      error: 'El correo de contacto debe tener un formato válido (ejemplo: usuario@dominio.com).'
    });
  }

  if (!/^[A-Z0-9]+$/.test(rfcNormalizado) || !validateRFC(rfcNormalizado)) {
    return res.status(400).json({
      error: 'El RFC contiene caracteres inválidos o no cumple con el formato requerido.'
    });
  }

  const sql = 'CALL sp_insert_empresa(?,?,?,?,?,?,?)';
  db.query(sql, [
    nombreNormalizado,
    rfcNormalizado,
    ubicacionNormalizada,
    telefonoPrincipalNormalizado,
    telefonoSecundarioNormalizado || null,
    telefonoAdicionalNormalizado || null,
    correoNormalizado
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const id = result?.[0]?.[0]?.id;
    logAction(adminId, id || null, 'crear_empresa', 'empresas', `Empresa registrada: ${nombre}`, req);
    res.json({ mensaje: 'Empresa registrada', id });
  });
};

// 3. ACTUALIZAR EMPRESA
const update = (req, res) => {
  const {
    id, nombre, rfc, ubicacion,
    telefono_principal, telefono_secundario, telefono_adicional,
    correo_contacto
  } = req.body;
  const adminId = req.user?.id || null;

  const nombreNormalizado = normalizeText(nombre);
  const rfcNormalizado = normalizeRFC(rfc);
  const ubicacionNormalizada = normalizeText(ubicacion);
  const correoNormalizado = normalizeText(correo_contacto);
  const telefonoPrincipalNormalizado = normalizePhone(telefono_principal);
  const telefonoSecundarioNormalizado = normalizePhone(telefono_secundario);
  const telefonoAdicionalNormalizado = normalizePhone(telefono_adicional);

  if (!nombreNormalizado) {
    return res.status(400).json({ error: 'El nombre de la empresa es obligatorio.' });
  }

  if (!rfcNormalizado || rfcNormalizado.length < 12 || rfcNormalizado.length > 13) {
    return res.status(400).json({
      error: 'El RFC debe tener entre 12 y 13 caracteres alfanuméricos.'
    });
  }

  if (!ubicacionNormalizada) {
    return res.status(400).json({ error: 'La ubicación es obligatoria.' });
  }

  if (!telefonoPrincipalNormalizado || telefonoPrincipalNormalizado.length !== 10) {
    return res.status(400).json({ error: 'El teléfono principal debe tener exactamente 10 dígitos.' });
  }

  if (telefonoSecundarioNormalizado && telefonoSecundarioNormalizado.length !== 10) {
    return res.status(400).json({ error: 'El teléfono secundario debe tener exactamente 10 dígitos.' });
  }

  if (telefonoAdicionalNormalizado && telefonoAdicionalNormalizado.length !== 10) {
    return res.status(400).json({ error: 'El teléfono adicional debe tener exactamente 10 dígitos.' });
  }

  if (!correoNormalizado || !emailRegex.test(correoNormalizado)) {
    return res.status(400).json({
      error: 'El correo de contacto debe tener un formato válido (ejemplo: usuario@dominio.com).'
    });
  }

  if (!/^[A-Z0-9]+$/.test(rfcNormalizado) || !validateRFC(rfcNormalizado)) {
    return res.status(400).json({
      error: 'El RFC contiene caracteres inválidos o no cumple con el formato requerido.'
    });
  }

  const sql = 'CALL sp_update_empresa(?,?,?,?,?,?,?,?)';
  db.query(sql, [
    nombreNormalizado,
    rfcNormalizado,
    ubicacionNormalizada,
    telefonoPrincipalNormalizado,
    telefonoSecundarioNormalizado || null,
    telefonoAdicionalNormalizado || null,
    correoNormalizado,
    id
  ], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa actualizada' });
  });
};

// 4. ELIMINAR EMPRESA (Baja lógica)
const deleteEmpresa = (req, res) => {
  const { id } = req.body;
  const adminId = req.user?.id || null;
  db.query('CALL sp_delete_empresa(?)', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    logAction(adminId, id || null, 'eliminar_empresa', 'empresas', `Empresa desactivada: ID ${id}`, req);
    res.json({ mensaje: 'Empresa eliminada' });
  });
};

// EXPORTAR EMPRESA 
const exportEmpresa = (req, res) => {
  const { id } = req.params;
  res.json({ mensaje: `Exportando datos de la empresa con ID: ${id}` });
};

// EXPORTACIÓN DE MÓDULOS
module.exports = { 
  getAll, 
  insert, 
  update, 
  delete: deleteEmpresa,
  exportEmpresa 
};