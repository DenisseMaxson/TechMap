const db = require('../DB/connection');

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

// 4. Baja lógica del equipo (Eliminar)
const deleteEquipo = (req, res) => {
    const { id, usuario_id } = req.body;
    const sql = 'CALL sp_delete_equipo(?,?)';

    db.query(sql, [id, usuario_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Equipo dado de baja correctamente' });
    });
};

module.exports = { 
    getEquiposByEmpresa, 
    insert: insertEquipo, 
    update: updateEquipo, 
    delete: deleteEquipo 
};