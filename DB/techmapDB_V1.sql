-- ============================================================
--  TechMap — Script de base de datos completo
--  Motor: MySQL 8.0+
--  Generado para MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS techmap_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE techmap_db;

-- ============================================================
--  1. EMPRESAS
-- ============================================================
CREATE TABLE empresas (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(120)    NOT NULL,
  rfc             VARCHAR(13)     NOT NULL UNIQUE,
  ubicacion       VARCHAR(200)    NOT NULL,
  telefono        VARCHAR(20)         NULL,
  telefono_principal  VARCHAR(20) NULL AFTER telefono,
  telefono_secundario VARCHAR(20) NULL AFTER telefono_principal,
  telefono_adicional  VARCHAR(20) NULL AFTER telefono_secundario,
  correo_contacto VARCHAR(120)        NULL,
  fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ============================================================
--  2. USUARIOS
-- ============================================================
CREATE TABLE usuarios (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  empresa_id      INT UNSIGNED        NULL,          -- NULL = administrador principal
  nombre_completo VARCHAR(150)    NOT NULL,
  correo          VARCHAR(120)    NOT NULL UNIQUE,
  usuario         VARCHAR(60)     NOT NULL UNIQUE,
  password_hash   VARCHAR(255)    NOT NULL,
  rol             ENUM(
                    'administrador',
                    'ti',
                    'contabilidad',
                    'jefe_area'
                  )               NOT NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso   DATETIME            NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_usuario_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  3. EQUIPOS (inventario de hardware)
-- ============================================================
CREATE TABLE equipos (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  empresa_id       INT UNSIGNED   NOT NULL,
  numero_inventario VARCHAR(100)      NULL,
  etiqueta_fisica  VARCHAR(100)      NULL,
  direccion_mac    VARCHAR(17) UNIQUE AFTER numero_serie,
  numero_serie     VARCHAR(100)   NOT NULL,
  nombre           VARCHAR(150)   NOT NULL,
  nombre_host      VARCHAR(120)      NULL,
  sistema_operativo VARCHAR(120)      NULL,
  procesador       VARCHAR(120)      NULL,
  marca            VARCHAR(80)        NULL,
  modelo           VARCHAR(80)        NULL,
  tipo             ENUM(
                     'computadora',
                     'laptop',
                     'servidor',
                     'impresora',
                     'switch',
                     'router',
                     'monitor',
                     'telefono_ip',
                     'otro'
                   )              NOT NULL DEFAULT 'otro',
  tipo_ip          VARCHAR(20)       NULL,
  conectado_red    ENUM('si','no')   NOT NULL DEFAULT 'no',
  ubicacion_fisica VARCHAR(150)       NULL,
  fecha_adquisicion DATE              NULL,
  fecha_baja_renovacion DATE          NULL,
  proveedor        VARCHAR(150)      NULL,
  referencia_factura VARCHAR(150)    NULL,
  garantia         VARCHAR(200)      NULL,
  costo_adquisicion DECIMAL(12,2)    NULL,
  estado           ENUM(
                     'activo',
                     'en_baja',
                     'dado_de_baja'
                   )              NOT NULL DEFAULT 'activo',
  observaciones    TEXT               NULL,
  registrado_por   INT UNSIGNED       NULL,
  fecha_registro   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_serie_empresa (numero_serie, empresa_id),
  CONSTRAINT fk_equipo_empresa
    FOREIGN KEY (empresa_id)    REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipo_usuario
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  4. SOLICITUDES DE BAJA
-- ============================================================
CREATE TABLE solicitudes_baja (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  equipo_id        INT UNSIGNED   NOT NULL,
  empresa_id       INT UNSIGNED   NOT NULL,
  solicitado_por   INT UNSIGNED   NOT NULL,
  motivo           TEXT           NOT NULL,
  evidencia_url    VARCHAR(300)       NULL,  -- ruta o URL del archivo adjunto
  estado           ENUM(
                     'pendiente',
                     'aprobada',
                     'rechazada',
                     'cancelada'
                   )              NOT NULL DEFAULT 'pendiente',
  fecha_solicitud  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion DATETIME           NULL,
  observaciones    TEXT               NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_baja_equipo
    FOREIGN KEY (equipo_id)      REFERENCES equipos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_baja_empresa
    FOREIGN KEY (empresa_id)     REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_baja_solicitante
    FOREIGN KEY (solicitado_por) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  5. APROBACIONES DE BAJA  (una fila por paso del flujo)
-- ============================================================
CREATE TABLE aprobaciones_baja (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  solicitud_id     INT UNSIGNED   NOT NULL,
  aprobador_id     INT UNSIGNED   NOT NULL,
  rol_aprobador    ENUM('contabilidad','jefe_area') NOT NULL,
  decision         ENUM('aprobada','rechazada')     NOT NULL,
  comentario       TEXT               NULL,
  fecha_decision   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aprobacion_rol (solicitud_id, rol_aprobador),
  CONSTRAINT fk_aprobacion_solicitud
    FOREIGN KEY (solicitud_id)   REFERENCES solicitudes_baja(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_aprobacion_usuario
    FOREIGN KEY (aprobador_id)   REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  6. HISTORIAL DE MOVIMIENTOS
-- ============================================================
CREATE TABLE historial_movimientos (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  empresa_id      INT UNSIGNED    NOT NULL,
  equipo_id       INT UNSIGNED        NULL,
  usuario_id      INT UNSIGNED        NULL,
  tipo_movimiento ENUM(
                    'alta',
                    'modificacion',
                    'solicitud_baja',
                    'aprobacion_baja',
                    'rechazo_baja',
                    'baja_ejecutada',
                    'exportacion'
                  )               NOT NULL,
  descripcion     TEXT            NOT NULL,
  datos_anteriores JSON               NULL,  -- snapshot antes del cambio
  datos_nuevos    JSON               NULL,  -- snapshot después del cambio
  fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_hist_empresa
    FOREIGN KEY (empresa_id)  REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_hist_equipo
    FOREIGN KEY (equipo_id)   REFERENCES equipos(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_hist_usuario
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  7. BITÁCORA DE AUDITORÍA  (acciones del sistema completo)
-- ============================================================
CREATE TABLE bitacora (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id   INT UNSIGNED        NULL,
  empresa_id   INT UNSIGNED        NULL,
  accion       VARCHAR(100)    NOT NULL,
  modulo       VARCHAR(60)     NOT NULL,
  detalle      TEXT                NULL,
  ip_origen    VARCHAR(45)         NULL,  -- IPv4 o IPv6
  fecha        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_bitacora_usuario
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_bitacora_empresa
    FOREIGN KEY (empresa_id)  REFERENCES empresas(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  8. NOTIFICACIONES
-- ============================================================
CREATE TABLE notificaciones (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id   INT UNSIGNED    NOT NULL,
  titulo       VARCHAR(150)    NOT NULL,
  mensaje      TEXT            NOT NULL,
  tipo         ENUM(
                 'solicitud_baja',
                 'aprobacion',
                 'rechazo',
                 'alta_equipo',
                 'exportacion',
                 'sistema'
               )               NOT NULL DEFAULT 'sistema',
  leida        TINYINT(1)      NOT NULL DEFAULT 0,
  fecha        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_usuario
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  9. EXPORTACIONES  (bitácora específica de exportaciones)
-- ============================================================
CREATE TABLE exportaciones (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  solicitado_por    INT UNSIGNED  NOT NULL,
  empresa_id        INT UNSIGNED  NOT NULL,
  tipo_exportacion  ENUM(
                      'bd_completa',
                      'lista_usuarios',
                      'inventario',
                      'historial'
                    )             NOT NULL,
  referencia_solicitud VARCHAR(100)   NULL,  -- folio o número de solicitud formal
  archivo_generado  VARCHAR(300)      NULL,  -- ruta del archivo
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_export_usuario
    FOREIGN KEY (solicitado_por) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_export_empresa
    FOREIGN KEY (empresa_id)     REFERENCES empresas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  ÍNDICES ADICIONALES para mejorar rendimiento en consultas
-- ============================================================
CREATE INDEX idx_equipos_empresa      ON equipos              (empresa_id);
CREATE INDEX idx_equipos_estado       ON equipos              (estado);
CREATE INDEX idx_solicitudes_estado   ON solicitudes_baja     (estado);
CREATE INDEX idx_solicitudes_empresa  ON solicitudes_baja     (empresa_id);
CREATE INDEX idx_historial_empresa    ON historial_movimientos (empresa_id);
CREATE INDEX idx_historial_fecha      ON historial_movimientos (fecha);
CREATE INDEX idx_bitacora_usuario     ON bitacora             (usuario_id);
CREATE INDEX idx_bitacora_fecha       ON bitacora             (fecha);
CREATE INDEX idx_notif_usuario_leida  ON notificaciones       (usuario_id, leida);

-- ============================================================
--  DATOS DE EJEMPLO
-- ============================================================

-- Empresa 1
INSERT INTO empresas (nombre, rfc, ubicacion, telefono, correo_contacto) VALUES
  ('Tecnologías Solución SA de CV', 'TSS210301AB1', 'León, Guanajuato',        '4771234567', 'contacto@tecnosolucion.mx'),
  ('Grupo Innovar SC',              'GIS190815CD2', 'Guadalajara, Jalisco',     '3339876543', 'admin@grupoinnovar.mx'),
  ('Sistemas Delta SA de CV',       'SDS200601EF3', 'Monterrey, Nuevo León',    '8181234567', 'info@sistemasdelta.mx'),
  ('DataCore México SA',            'DCM180420GH4', 'Ciudad de México, CDMX',   '5559876543', 'soporte@datacore.mx');

-- Administrador principal (Ing. Gerardo)
-- password: Admin2025! -> hash bcrypt de ejemplo
INSERT INTO usuarios (empresa_id, nombre_completo, correo, usuario, password_hash, rol) VALUES
  (NULL, 'Ing. Gerardo Administrador', 'gerardo@techmap.mx', 'gerardo_admin',
   '$2b$10$OEETEhPRRr5ZSSAYgFxpOu5hrevbeErQpTFwRCF/eXrG6jV6z2rMq', 'administrador');

-- Usuarios empresa 1
INSERT INTO usuarios (empresa_id, nombre_completo, correo, usuario, password_hash, rol) VALUES
  (1, 'Carlos Ramírez López',   'carlos.ramirez@tecnosolucion.mx',  'carlos_ti',   '$2b$10$j/f8waeqV7JH88hR94sLO.ZsGekpjzojab7XdMSoYwT5WzTz77vnS', 'ti'),
  (1, 'Laura Méndez Torres',    'laura.mendez@tecnosolucion.mx',    'laura_conta', '$2b$10$j/f8waeqV7JH88hR94sLO.ZsGekpjzojab7XdMSoYwT5WzTz77vnS', 'contabilidad'),
  (1, 'Roberto Sánchez Vega',   'roberto.sanchez@tecnosolucion.mx', 'roberto_jefe','$2b$10$j/f8waeqV7JH88hR94sLO.ZsGekpjzojab7XdMSoYwT5WzTz77vnS', 'jefe_area');

-- Usuarios empresa 2
INSERT INTO usuarios (empresa_id, nombre_completo, correo, usuario, password_hash, rol) VALUES
  (2, 'Ana González Pérez',     'ana.gonzalez@grupoinnovar.mx',     'ana_ti',      '$2b$10$j/f8waeqV7JH88hR94sLO.ZsGekpjzojab7XdMSoYwT5WzTz77vnS', 'ti'),
  (2, 'Miguel Flores Díaz',     'miguel.flores@grupoinnovar.mx',    'miguel_conta','$2b$10$j/f8waeqV7JH88hR94sLO.ZsGekpjzojab7XdMSoYwT5WzTz77vnS', 'contabilidad'),
  (2, 'Patricia Luna Morales',  'patricia.luna@grupoinnovar.mx',    'patricia_jefe','$2b$10$j/f8waeqV7JH88hR94sLO.ZsGekpjzojab7XdMSoYwT5WzTz77vnS', 'jefe_area');

-- Equipos empresa 1
INSERT INTO equipos (empresa_id, numero_serie, nombre, marca, modelo, tipo, ubicacion_fisica, fecha_adquisicion, valor_contable, registrado_por) VALUES
  (1, 'SN-DELL-001', 'Laptop Desarrollo 01',  'Dell',   'Latitude 5520',  'laptop',       'Oficina TI Piso 2', '2022-03-15', 18500.00, 2),
  (1, 'SN-HP-002',   'PC Contabilidad 01',    'HP',     'EliteDesk 800',  'computadora',  'Contabilidad',      '2021-08-10', 12000.00, 2),
  (1, 'SN-CISCO-003','Switch Principal',      'Cisco',  'Catalyst 2960',  'switch',       'Cuarto de Redes',   '2020-01-20', 35000.00, 2),
  (1, 'SN-DELL-004', 'Servidor Archivos',     'Dell',   'PowerEdge R340', 'servidor',     'Cuarto de Redes',   '2021-05-01', 85000.00, 2),
  (1, 'SN-HP-005',   'Impresora Recepción',   'HP',     'LaserJet M404',  'impresora',    'Recepción',         '2022-09-01',  8500.00, 2);

-- Equipos empresa 2
INSERT INTO equipos (empresa_id, numero_serie, nombre, marca, modelo, tipo, ubicacion_fisica, fecha_adquisicion, valor_contable, registrado_por) VALUES
  (2, 'SN-LEN-001',  'Laptop Gerencia',       'Lenovo', 'ThinkPad E14',   'laptop',       'Gerencia',          '2023-01-10', 22000.00, 5),
  (2, 'SN-ASUS-002', 'PC Diseño',             'Asus',   'ProArt PA90',    'computadora',  'Área Diseño',       '2022-06-15', 28000.00, 5),
  (2, 'SN-CISCO-003','Router Corporativo',    'Cisco',  'RV345',          'router',       'Cuarto de Redes',   '2021-11-05', 15000.00, 5);

-- Solicitud de baja de ejemplo (pendiente)
INSERT INTO solicitudes_baja (equipo_id, empresa_id, solicitado_por, motivo, estado) VALUES
  (3, 1, 2, 'El switch presenta fallas intermitentes de conectividad que afectan la red corporativa. Se recomienda reemplazo.', 'pendiente');

-- Aprobación de contabilidad (primer paso ya aprobado)
INSERT INTO aprobaciones_baja (solicitud_id, aprobador_id, rol_aprobador, decision, comentario) VALUES
  (1, 3, 'contabilidad', 'aprobada', 'Activo depreciado al 80%. Procede la baja contable.');

-- Historial de movimientos
INSERT INTO historial_movimientos (empresa_id, equipo_id, usuario_id, tipo_movimiento, descripcion) VALUES
  (1, 1, 2, 'alta',            'Alta de equipo: Laptop Desarrollo 01 — Dell Latitude 5520'),
  (1, 2, 2, 'alta',            'Alta de equipo: PC Contabilidad 01 — HP EliteDesk 800'),
  (1, 3, 2, 'alta',            'Alta de equipo: Switch Principal — Cisco Catalyst 2960'),
  (1, 4, 2, 'alta',            'Alta de equipo: Servidor Archivos — Dell PowerEdge R340'),
  (1, 5, 2, 'alta',            'Alta de equipo: Impresora Recepción — HP LaserJet M404'),
  (1, 3, 2, 'solicitud_baja',  'Solicitud de baja iniciada para Switch Principal. Motivo: fallas intermitentes.'),
  (1, 3, 3, 'aprobacion_baja', 'Contabilidad aprobó la baja del Switch Principal.');

-- Notificaciones
INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) VALUES
  (4, 'Solicitud de baja pendiente',
      'Existe una solicitud de baja del equipo Switch Principal que requiere tu autorización.',
      'solicitud_baja'),
  (3, 'Aprobación registrada',
      'Tu aprobación para la baja del Switch Principal ha sido registrada. Pendiente: Jefe de área.',
      'aprobacion'),
  (2, 'Solicitud en proceso',
      'Tu solicitud de baja para el Switch Principal fue aprobada por Contabilidad. Pendiente aprobación del Jefe de área.',
      'solicitud_baja');

-- Bitácora
INSERT INTO bitacora (usuario_id, empresa_id, accion, modulo, detalle) VALUES
  (1, NULL, 'login',             'autenticacion', 'Inicio de sesión del administrador principal'),
  (1, 1,    'crear_empresa',     'empresas',      'Empresa creada: Tecnologías Solución SA de CV'),
  (1, 1,    'crear_usuario',     'usuarios',      'Usuario creado: carlos_ti — Rol: TI'),
  (2, 1,    'login',             'autenticacion', 'Inicio de sesión: carlos_ti'),
  (2, 1,    'alta_equipo',       'inventario',    'Equipo registrado: Laptop Desarrollo 01'),
  (2, 1,    'solicitud_baja',    'inventario',    'Solicitud de baja iniciada: Switch Principal'),
  (3, 1,    'aprobacion_baja',   'aprobaciones',  'Baja aprobada por Contabilidad: Switch Principal');
  
-- Agrega estos campos a tu tabla actual de 'equipos'
ALTER TABLE equipos 
ADD COLUMN numero_inventario VARCHAR(100) NULL AFTER empresa_id,
ADD COLUMN etiqueta_fisica VARCHAR(100) NULL AFTER numero_inventario,
ADD COLUMN direccion_mac VARCHAR(17) UNIQUE AFTER numero_serie,
ADD COLUMN nombre_host VARCHAR(120) NULL AFTER numero_serie,
ADD COLUMN sistema_operativo VARCHAR(120) NULL AFTER nombre_host,
ADD COLUMN procesador VARCHAR(120) NULL AFTER sistema_operativo,
ADD COLUMN direccion_ip VARCHAR(15) AFTER direccion_mac,
ADD COLUMN tipo_ip VARCHAR(20) NULL AFTER direccion_ip,
ADD COLUMN conectado_red ENUM('si','no') NOT NULL DEFAULT 'no' AFTER tipo_ip,
ADD COLUMN area VARCHAR(100) AFTER tipo,
ADD COLUMN encargado_equipo VARCHAR(150) AFTER area,
ADD COLUMN usuario_responsable VARCHAR(150) NULL AFTER encargado_equipo,
ADD COLUMN correo_jefe_area VARCHAR(120) NULL AFTER usuario_responsable,
ADD COLUMN fecha_adquisicion DATE AFTER ubicacion_fisica,
ADD COLUMN fecha_baja_renovacion DATE NULL AFTER fecha_adquisicion,
ADD COLUMN proveedor VARCHAR(150) NULL AFTER fecha_baja_renovacion,
ADD COLUMN referencia_factura VARCHAR(150) NULL AFTER proveedor,
ADD COLUMN costo_adquisicion DECIMAL(12,2) NULL AFTER referencia_factura,
ADD COLUMN garantia VARCHAR(200) NULL AFTER costo_adquisicion,
ADD COLUMN lugar_compra VARCHAR(200) AFTER fecha_adquisicion,
ADD COLUMN valor_contable DECIMAL(12,2) NULL AFTER lugar_compra;

-- Índices clave para búsquedas rápidas de hardware
CREATE INDEX idx_equipos_mac ON equipos (direccion_mac);
CREATE INDEX idx_equipos_serie ON equipos (numero_serie);


ALTER TABLE empresas 
  ADD COLUMN telefono_principal  VARCHAR(20) NULL AFTER telefono,
  ADD COLUMN telefono_secundario VARCHAR(20) NULL AFTER telefono_principal,
  ADD COLUMN telefono_adicional  VARCHAR(20) NULL AFTER telefono_secundario;

