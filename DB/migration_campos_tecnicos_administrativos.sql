-- ============================================================
--  MIGRATION: Agregar campos técnicos y administrativos
--  Descripción: Amplía la tabla equipos con campos sugeridos
--  Fecha: 2026-06-03
--  Nota: Sin IF NOT EXISTS para compatibilidad MySQL 5.7+
-- ============================================================

USE techmap_db;

-- ========== CAMPOS TÉCNICOS PARA COMPUTADORAS, LAPTOPS Y SERVIDORES ==========

ALTER TABLE equipos ADD COLUMN sistema_operativo VARCHAR(100) NULL COMMENT 'Windows 10, Windows 11, Ubuntu 22.04, CentOS, etc.';

ALTER TABLE equipos ADD COLUMN procesador VARCHAR(150) NULL COMMENT 'Intel Core i7, AMD Ryzen 5, Apple M1, etc.';

ALTER TABLE equipos ADD COLUMN memoria_ram VARCHAR(50) NULL COMMENT '8GB, 16GB, 32GB, etc.';

ALTER TABLE equipos ADD COLUMN almacenamiento VARCHAR(100) NULL COMMENT 'SSD 512GB, HDD 1TB, etc.';

-- ========== CAMPOS DE RED ==========

ALTER TABLE equipos ADD COLUMN conectado_red BOOLEAN DEFAULT NULL COMMENT 'Indica si está conectado a la red local (true/false)';

ALTER TABLE equipos ADD COLUMN nombre_host VARCHAR(100) NULL COMMENT 'Nombre del equipo en la red (ej: ADMIN-PC-01)';

ALTER TABLE equipos ADD COLUMN tipo_ip ENUM('estatica', 'dinamica') NULL COMMENT 'Tipo de asignación de IP: estática o dinámica';

ALTER TABLE equipos ADD COLUMN direccion_ip_2 VARCHAR(15) NULL COMMENT 'Dirección IP del equipo (ej: 192.168.1.100)';

ALTER TABLE equipos ADD COLUMN direccion_mac_2 VARCHAR(17) NULL COMMENT 'Dirección MAC del equipo (ej: AA:BB:CC:DD:EE:FF)';

-- ========== CAMPOS ADMINISTRATIVOS ==========

ALTER TABLE equipos ADD COLUMN proveedor VARCHAR(150) NULL COMMENT 'Nombre del proveedor/vendedor del equipo';

ALTER TABLE equipos ADD COLUMN numero_factura VARCHAR(100) NULL COMMENT 'Referencia/número de factura de compra';

ALTER TABLE equipos ADD COLUMN garantia_vigente BOOLEAN DEFAULT NULL COMMENT 'true: garantía vigente, false: expirada, NULL: desconocido';

ALTER TABLE equipos ADD COLUMN fecha_garantia_vencimiento DATE NULL COMMENT 'Fecha en que vence la garantía o contrato de soporte';

ALTER TABLE equipos ADD COLUMN fecha_baja_estimada DATE NULL COMMENT 'Fecha estimada de baja o renovación del equipo';

-- ========== CAMPOS DE IDENTIFICACIÓN Y RASTREO ==========

ALTER TABLE equipos ADD COLUMN etiqueta_qr_barras VARCHAR(200) NULL COMMENT 'Código QR o de barras para rastreo físico rápido';

-- ========== CAMPOS DE RESPONSABILIDAD ==========

ALTER TABLE equipos ADD COLUMN jefe_area_correo VARCHAR(120) NULL COMMENT 'Correo electrónico del jefe del área responsable';

-- ========== CAMPO DE PERIFÉRICOS ASOCIADOS ==========

ALTER TABLE equipos ADD COLUMN perifericos_asociados TEXT NULL COMMENT 'Descripción de periféricos: monitores, docking stations, etc. (hasta 1000 caracteres)';

-- ========== VERIFICACIÓN ==========
SELECT 'Migración completada. Nuevos campos agregados a tabla equipos' AS status;
