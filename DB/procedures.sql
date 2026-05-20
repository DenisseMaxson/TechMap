USE techmap_db;

-- /////////////////////
-- SP de empresas
-- /////////////////////
DELIMITER //

DROP PROCEDURE IF EXISTS sp_insert_empresa //
CREATE PROCEDURE sp_insert_empresa(
    IN p_nombre VARCHAR(255),
    IN p_rfc VARCHAR(20),
    IN p_ubicacion VARCHAR(255),
    IN p_telefono VARCHAR(20),
    IN p_correo_contacto VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO empresas (nombre, rfc, ubicacion, telefono, correo_contacto)
    VALUES (p_nombre, p_rfc, p_ubicacion, p_telefono, p_correo_contacto);

    SELECT LAST_INSERT_ID() AS id;

    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_update_empresa //
CREATE PROCEDURE sp_update_empresa(
    IN p_nombre VARCHAR(255),
    IN p_rfc VARCHAR(20),
    IN p_ubicacion VARCHAR(255),
    IN p_telefono VARCHAR(20),
    IN p_correo_contacto VARCHAR(255),
    IN p_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE empresas
    SET nombre = p_nombre,
        rfc = p_rfc,
        ubicacion = p_ubicacion,
        telefono = p_telefono,
        correo_contacto = p_correo_contacto
    WHERE id = p_id;

    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_delete_empresa //
CREATE PROCEDURE sp_delete_empresa(
    IN p_id INT
)
BEGIN
    UPDATE empresas
    SET estado = 'inactiva'
    WHERE id = p_id;
END //

-- /////////////////////
-- SP de usuarios
-- /////////////////////
DROP PROCEDURE IF EXISTS sp_insert_usuario //
CREATE PROCEDURE sp_insert_usuario(
    IN p_empresa_id INT,
    IN p_nombre_completo VARCHAR(255),
    IN p_correo VARCHAR(255),
    IN p_usuario VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_rol VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO usuarios (empresa_id, nombre_completo, correo, usuario, password_hash, rol)
    VALUES (p_empresa_id, p_nombre_completo, p_correo, p_usuario, p_password_hash, p_rol);

    SELECT LAST_INSERT_ID() AS id;

    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_update_usuario //
CREATE PROCEDURE sp_update_usuario(
    IN p_empresa_id INT,
    IN p_nombre_completo VARCHAR(255),
    IN p_correo VARCHAR(255),
    IN p_rol VARCHAR(50),
    IN p_estado VARCHAR(20),
    IN p_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE usuarios
    SET empresa_id = p_empresa_id,
        nombre_completo = p_nombre_completo,
        correo = p_correo,
        rol = p_rol,
        estado = p_estado
    WHERE id = p_id;

    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_delete_usuario //
CREATE PROCEDURE sp_delete_usuario(
    IN p_id INT
)
BEGIN
    UPDATE usuarios
    SET estado = 'inactivo'
    WHERE id = p_id;
END //

DELIMITER ;

DELIMITER //

DROP PROCEDURE IF EXISTS sp_insert_equipo //
CREATE PROCEDURE sp_insert_equipo(
    IN p_empresa_id INT,
    IN p_numero_serie VARCHAR(100),
    IN p_direccion_mac VARCHAR(17),
    IN p_direccion_ip VARCHAR(15),
    IN p_nombre VARCHAR(150),
    IN p_marca VARCHAR(80),
    IN p_modelo VARCHAR(80),
    IN p_tipo ENUM('computadora','laptop','servidor','impresora','switch','router','monitor','telefono_ip','otro'),
    IN p_area VARCHAR(100),
    IN p_ubicacion_fisica VARCHAR(150),
    IN p_encargado_equipo VARCHAR(150),
    IN p_fecha_adquisicion DATE,
    IN p_lugar_compra VARCHAR(200),
    IN p_valor_contable DECIMAL(12,2),
    IN p_registrado_por INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    INSERT INTO equipos (
        empresa_id, numero_serie, direccion_mac, direccion_ip, nombre, 
        marca, modelo, tipo, area, ubicacion_fisica, encargado_equipo,
        fecha_adquisicion, lugar_compra, valor_contable, registrado_por
    )
    VALUES (
        p_empresa_id, p_numero_serie, p_direccion_mac, p_direccion_ip, p_nombre, 
        p_marca, p_modelo, p_tipo, p_area, p_ubicacion_fisica, p_encargado_equipo,
        p_fecha_adquisicion, p_lugar_compra, p_valor_contable, p_registrado_por
    );

    -- Registrar en bitácora para Trazabilidad (RNF08)
    INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle)
    VALUES (p_registrado_por, p_empresa_id, 'alta_equipo', 'inventario', 
            CONCAT('Alta de equipo serie: ', p_numero_serie));

    SELECT LAST_INSERT_ID() AS id;
    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_update_equipo //
CREATE PROCEDURE sp_update_equipo(
    IN p_id INT,
    IN p_nombre VARCHAR(150),
    IN p_direccion_ip VARCHAR(15),
    IN p_area VARCHAR(100),
    IN p_ubicacion_fisica VARCHAR(150),
    IN p_encargado_equipo VARCHAR(150),
    IN p_estado VARCHAR(20),
    IN p_usuario_id INT -- Quien realiza el cambio
)
BEGIN
    START TRANSACTION;
    
    UPDATE equipos 
    SET nombre = p_nombre,
        direccion_ip = p_direccion_ip,
        area = p_area,
        ubicacion_fisica = p_ubicacion_fisica,
        encargado_equipo = p_encargado_equipo,
        estado = p_estado
    WHERE id = p_id;

    -- Auditoría del cambio
    INSERT INTO bitacora (usuario_id, accion, modulo, detalle)
    VALUES (p_usuario_id, 'modificacion_equipo', 'inventario', 
            CONCAT('Actualización técnica del equipo ID: ', p_id));

    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_delete_equipo //
CREATE PROCEDURE sp_delete_equipo(
    IN p_id INT,
    IN p_usuario_id INT
)
BEGIN
    UPDATE equipos 
    SET estado = 'dado_de_baja' 
    WHERE id = p_id;

    -- Auditoría de la baja definitiva
    INSERT INTO bitacora (usuario_id, accion, modulo, detalle)
    VALUES (p_usuario_id, 'baja_ejecutada', 'inventario', 
            CONCAT('Equipo ID: ', p_id, ' marcado como inactivo'));
END //

DELIMITER ;

DELIMITER //

DROP PROCEDURE IF EXISTS sp_get_dashboard_stats //
CREATE PROCEDURE sp_get_dashboard_stats(IN p_empresa_id INT)
BEGIN
    -- 1. Total de equipos activos
    SELECT COUNT(*) AS total_equipos FROM equipos 
    WHERE empresa_id = p_empresa_id AND estado = 'activo';

    -- 2. Conteo por tipo de equipo (para una gráfica de pay)
    SELECT tipo, COUNT(*) AS cantidad FROM equipos 
    WHERE empresa_id = p_empresa_id AND estado = 'activo'
    GROUP BY tipo;

    -- 3. Bajas pendientes de autorización
    SELECT COUNT(*) AS bajas_pendientes FROM solicitudes_baja 
    WHERE empresa_id = p_empresa_id AND estado = 'pendiente';

    -- 4. Valor total del inventario
    SELECT SUM(valor_contable) AS valor_total FROM equipos 
    WHERE empresa_id = p_empresa_id AND estado = 'activo';
END //

DELIMITER ;

DELIMITER //

DROP PROCEDURE IF EXISTS sp_update_empresa //
CREATE PROCEDURE sp_update_empresa(
    IN p_nombre           VARCHAR(255),
    IN p_rfc              VARCHAR(20),
    IN p_ubicacion        VARCHAR(255),
    IN p_telefono_principal  VARCHAR(20),
    IN p_telefono_secundario VARCHAR(20),
    IN p_telefono_adicional  VARCHAR(20),
    IN p_correo_contacto  VARCHAR(255),
    IN p_id               INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE empresas
    SET nombre               = p_nombre,
        rfc                  = p_rfc,
        ubicacion            = p_ubicacion,
        telefono_principal   = p_telefono_principal,
        telefono_secundario  = p_telefono_secundario,
        telefono_adicional   = p_telefono_adicional,
        correo_contacto      = p_correo_contacto
    WHERE id = p_id;

    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_insert_empresa //
CREATE PROCEDURE sp_insert_empresa(
    IN p_nombre              VARCHAR(255),
    IN p_rfc                 VARCHAR(20),
    IN p_ubicacion           VARCHAR(255),
    IN p_telefono_principal  VARCHAR(20),
    IN p_telefono_secundario VARCHAR(20),
    IN p_telefono_adicional  VARCHAR(20),
    IN p_correo_contacto     VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO empresas (
        nombre, rfc, ubicacion,
        telefono_principal, telefono_secundario, telefono_adicional,
        correo_contacto
    )
    VALUES (
        p_nombre, p_rfc, p_ubicacion,
        p_telefono_principal, p_telefono_secundario, p_telefono_adicional,
        p_correo_contacto
    );

    SELECT LAST_INSERT_ID() AS id;
    COMMIT;
END //

DELIMITER ;

USE techmap_db;

USE techmap_db;

ALTER TABLE empresas 
  ADD COLUMN telefono_principal  VARCHAR(20) NULL AFTER telefono,
  ADD COLUMN telefono_secundario VARCHAR(20) NULL AFTER telefono_principal,
  ADD COLUMN telefono_adicional  VARCHAR(20) NULL AFTER telefono_secundario;