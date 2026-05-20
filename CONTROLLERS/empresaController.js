const db = require('../DB/connection');

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

  const sql = 'CALL sp_insert_empresa(?,?,?,?,?,?,?)';
  db.query(sql, [
    nombre,
    rfc,                
    ubicacion,          
    telefono_principal, 
    telefono_secundario  || null, 
    telefono_adicional   || null, 
    correo_contacto     
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const id = result?.[0]?.[0]?.id;
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

  const sql = 'CALL sp_update_empresa(?,?,?,?,?,?,?,?)';
  db.query(sql, [
    nombre,
    rfc,                
    ubicacion,          
    telefono_principal, 
    telefono_secundario  || null, 
    telefono_adicional   || null, 
    correo_contacto,    
    id
  ], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empresa actualizada' });
  });
};

// 4. ELIMINAR EMPRESA (Baja lógica)
const deleteEmpresa = (req, res) => {
  const { id } = req.body;
  db.query('CALL sp_delete_empresa(?)', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
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