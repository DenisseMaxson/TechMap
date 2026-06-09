-- ============================================================
--  MIGRATION: Modulo de mantenimiento preventivo/correctivo
--  Descripcion: Programa y registra servicios por equipo
--  Reglas sugeridas:
--    - Produccion: bimestral, 6 veces al anio
--    - Administrativas: trimestral, 4 veces al anio
--    - Servidores: semestral, 2 veces al anio
-- ============================================================

USE techmap_db;

CREATE TABLE IF NOT EXISTS mantenimientos (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  empresa_id            INT UNSIGNED NOT NULL,
  equipo_id             INT UNSIGNED NOT NULL,
  tipo                  ENUM('preventivo','correctivo') NOT NULL DEFAULT 'preventivo',
  frecuencia            ENUM('bimestral','trimestral','semestral','manual') NOT NULL DEFAULT 'manual',
  fecha_programada      DATE NOT NULL,
  fecha_realizada       DATE NULL,
  estado                ENUM('programado','realizado','vencido','cancelado') NOT NULL DEFAULT 'programado',
  tecnico_responsable   VARCHAR(150) NULL,
  observaciones         VARCHAR(1000) NULL,
  registrado_por        INT UNSIGNED NULL,
  fecha_registro        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mantenimiento_programado (equipo_id, tipo, fecha_programada),
  KEY idx_mantenimiento_empresa_estado (empresa_id, estado),
  KEY idx_mantenimiento_fecha (fecha_programada),
  CONSTRAINT fk_mantenimiento_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mantenimiento_equipo
    FOREIGN KEY (equipo_id) REFERENCES equipos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mantenimiento_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW vw_mantenimientos_pendientes AS
SELECT
  m.id,
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
  END AS estado_calculado,
  m.tecnico_responsable,
  m.observaciones
FROM mantenimientos m
INNER JOIN equipos e ON e.id = m.equipo_id AND e.empresa_id = m.empresa_id
WHERE e.estado <> 'dado_de_baja';

