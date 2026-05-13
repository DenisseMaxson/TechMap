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
