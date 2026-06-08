/**
 * EJEMPLOS DE USO - API de Equipos con Nuevos Campos
 * Archivo: ejemplos-nuevos-campos.js
 * 
 * Copia y usa estas peticiones en Postman, Insomnia o curl
 */

// ============================================================
//  1. CREAR EQUIPO CON TODOS LOS CAMPOS (Ejemplo completo)
// ============================================================

POST /api/equipos
Content-Type: application/json
Authorization: Bearer <token>

{
  "empresa_id": 1,
  "nombre": "Laptop Dell Latitude 5440",
  "numero_serie": "SN-2025-001234",
  "tipo": "laptop",
  "marca": "Dell",
  "modelo": "Latitude 5440",
  "ubicacion_fisica": "Oficina piso 2, escritorio 5",
  "encargado_equipo": "Juan Pérez",
  "fecha_adquisicion": "2025-01-15",
  "valor_contable": 15000.00,
  "area": "Administrativo",
  "lugar_compra": "Dell Autorizado México",
  "observaciones": "Equipo nuevo, en garantía vigente",
  
  "sistema_operativo": "Windows 11 Pro",
  "procesador": "Intel Core i7-13620H",
  "memoria_ram": "16GB DDR5",
  "almacenamiento": "SSD 512GB NVMe",
  "conectado_red": "si",
  "nombre_host": "ADMIN-LP-001",
  "tipo_ip": "dinamica",
  "direccion_ip": "192.168.1.150",
  "direccion_mac": "AA:BB:CC:DD:EE:FF",
  "proveedor": "Dell Autorizado México",
  "numero_factura": "FAC-2025-001234",
  "garantia_vigente": true,
  "fecha_garantia_vencimiento": "2027-01-15",
  "fecha_baja_estimada": "2028-01-15",
  "etiqueta_qr_barras": "TECH-2025-001234",
  "jefe_area_correo": "jefa.administrativa@empresa.com",
  "perifericos_asociados": "Monitor Dell U2720 IPS + Teclado Mecánico + Mouse Logitech"
}

// ============================================================
//  2. CREAR EQUIPO - Servidor (Mínimal)
// ============================================================

POST /api/equipos
Content-Type: application/json

{
  "empresa_id": 1,
  "nombre": "Servidor de Producción - DB01",
  "numero_serie": "SN-2024-005678",
  "tipo": "servidor",
  "marca": "Dell",
  "modelo": "PowerEdge R750",
  "fecha_adquisicion": "2024-06-10",
  "valor_contable": 85000.00,
  "area": "Servidores",
  "ubicacion_fisica": "Data Center - Rack 3",
  "encargado_equipo": "Administrador de TI",
  
  "sistema_operativo": "Ubuntu Server 22.04 LTS",
  "procesador": "Intel Xeon Silver 4314",
  "memoria_ram": "128GB DDR4",
  "almacenamiento": "2x SSD 2TB NVMe RAID 1",
  "conectado_red": "si",
  "nombre_host": "SERVER-DB-01",
  "tipo_ip": "estatica",
  "direccion_ip": "192.168.2.10",
  "direccion_mac": "11:22:33:44:55:66"
}

// ============================================================
//  3. CREAR EQUIPO - Computadora de Escritorio
// ============================================================

POST /api/equipos
Content-Type: application/json

{
  "empresa_id": 1,
  "nombre": "PC Workstation - Diseño",
  "numero_serie": "SN-2025-009999",
  "tipo": "computadora",
  "marca": "HP",
  "modelo": "Z4 G4",
  "ubicacion_fisica": "Departamento de Diseño",
  "encargado_equipo": "Carlos Martínez",
  "fecha_adquisicion": "2025-02-01",
  "valor_contable": 32000.00,
  "area": "Producción",
  
  "sistema_operativo": "Windows 10 Pro",
  "procesador": "Intel Core i9-9980XE",
  "memoria_ram": "64GB DDR4",
  "almacenamiento": "SSD 1TB NVMe + HDD 4TB",
  "conectado_red": "si",
  "nombre_host": "DESIGN-WS-01",
  "tipo_ip": "dinamica",
  "direccion_ip": "192.168.1.45",
  "direccion_mac": "AA:AA:AA:BB:BB:BB",
  "perifericos_asociados": "Monitor 2x 4K + Tablet Wacom + Impresora 3D"
}

// ============================================================
//  4. CREAR EQUIPO - Impresora (Sin campos técnicos complejos)
// ============================================================

POST /api/equipos
Content-Type: application/json

{
  "empresa_id": 1,
  "nombre": "Impresora Multifuncional Piso 1",
  "numero_serie": "SN-HP-7845",
  "tipo": "impresora",
  "marca": "HP",
  "modelo": "LaserJet M428dw",
  "ubicacion_fisica": "Pasillo Piso 1",
  "fecha_adquisicion": "2024-09-15",
  "valor_contable": 5000.00,
  "area": "Administrativo",
  
  "conectado_red": "si",
  "nombre_host": "PRINTER-01",
  "tipo_ip": "estatica",
  "direccion_ip": "192.168.1.200",
  "direccion_mac": "FF:EE:DD:CC:BB:AA",
  "proveedor": "HP Distribuidor",
  "numero_factura": "FAC-2024-08765",
  "garantia_vigente": true,
  "fecha_garantia_vencimiento": "2026-09-15"
}

// ============================================================
//  5. ACTUALIZAR EQUIPO - Cambiar estado de garantía
// ============================================================

PUT /api/equipos
Content-Type: application/json

{
  "id": 5,
  "empresa_id": 1,
  "garantia_vigente": false,
  "fecha_garantia_vencimiento": "2026-01-15",
  "observaciones": "Garantía expirada, requiere renovación"
}

// ============================================================
//  6. ACTUALIZAR EQUIPO - Cambiar IP y Host
// ============================================================

PUT /api/equipos
Content-Type: application/json

{
  "id": 3,
  "empresa_id": 1,
  "nombre_host": "NEW-ADMIN-LP-002",
  "tipo_ip": "estatica",
  "direccion_ip": "192.168.1.200",
  "observaciones": "IP actualizada a configuración estática"
}

// ============================================================
//  7. OBTENER TODOS LOS EQUIPOS DE LA EMPRESA
// ============================================================

GET /api/equipos?empresa_id=1
Authorization: Bearer <token>

// ============================================================
//  8. EXPORTAR EQUIPOS A CSV CON NUEVOS CAMPOS
// ============================================================

GET /api/exportar/equipos?empresa_id=1&formato=csv
Authorization: Bearer <token>

// ============================================================
//  RESPUESTAS ESPERADAS
// ============================================================

// Respuesta exitosa - Crear equipo:
{
  "mensaje": "Hardware registrado con exito",
  "id": 42
}

// Respuesta exitosa - Actualizar equipo:
{
  "mensaje": "Informacion de equipo actualizada"
}

// Respuesta exitosa - Obtener equipos:
[
  {
    "id": 1,
    "empresa_id": 1,
    "nombre": "Laptop Dell Latitude 5440",
    "numero_serie": "SN-2025-001234",
    "tipo": "laptop",
    "marca": "Dell",
    "modelo": "Latitude 5440",
    "sistema_operativo": "Windows 11 Pro",
    "procesador": "Intel Core i7-13620H",
    "memoria_ram": "16GB DDR5",
    "almacenamiento": "SSD 512GB NVMe",
    "conectado_red": 1,
    "nombre_host": "ADMIN-LP-001",
    "tipo_ip": "dinamica",
    "direccion_ip": "192.168.1.150",
    "direccion_mac": "AA:BB:CC:DD:EE:FF",
    "ubicacion_fisica": "Oficina piso 2, escritorio 5",
    "proveedor": "Dell Autorizado México",
    "numero_factura": "FAC-2025-001234",
    "garantia_vigente": 1,
    "fecha_garantia_vencimiento": "2027-01-15",
    "fecha_baja_estimada": "2028-01-15",
    "etiqueta_qr_barras": "TECH-2025-001234",
    "area": "Administrativo",
    "jefe_area_correo": "jefa.administrativa@empresa.com",
    "perifericos_asociados": "Monitor Dell U2720 IPS + Teclado Mecánico + Mouse Logitech",
    "fecha_adquisicion": "2025-01-15",
    "valor_contable": "15000.00",
    "estado": "activo",
    "observaciones": "Equipo nuevo, en garantía vigente",
    "registrado_por": 5,
    "fecha_registro": "2025-01-16T10:30:00.000Z"
  }
]

// ============================================================
//  CURL EXAMPLES
// ============================================================

// Crear equipo con curl
curl -X POST http://localhost:3000/api/equipos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "empresa_id": 1,
    "nombre": "Laptop Test",
    "numero_serie": "SN-TEST-001",
    "tipo": "laptop",
    "sistema_operativo": "Windows 11 Pro",
    "procesador": "Intel i7",
    "memoria_ram": "16GB",
    "conectado_red": "si",
    "nombre_host": "TEST-LP-01",
    "direccion_ip": "192.168.1.100",
    "direccion_mac": "AA:BB:CC:DD:EE:FF"
  }'

// ============================================================
//  VALIDACIONES IMPORTANTES
// ============================================================

// IP válida:
"192.168.1.100" ✓
"10.0.0.1" ✓
"256.1.1.1" ✗ (fuera de rango)

// MAC válida:
"AA:BB:CC:DD:EE:FF" ✓
"AA-BB-CC-DD-EE-FF" ✓
"AABBCCDDEEFF" ✗ (formato inválido)

// tipo_ip válido:
"estatica" ✓
"dinamica" ✓
"otro" ✗

// conectado_red válido:
"si" ✓ (convierte a true)
"no" ✓ (convierte a false)
true ✓
false ✓

// ============================================================
//  NOTAS DE DESARROLLO
// ============================================================

/*
- Los nuevos campos son OPCIONALES (pueden ser null)
- Si conectado_red es "si", entonces IP y MAC son OBLIGATORIOS
- Las fechas deben estar en formato YYYY-MM-DD
- Los booleanos se convierten automáticamente (si/no -> true/false)
- El backend valida automáticamente los formatos de IP y MAC
- Todos los campos se almacenan aunque no sean completos (backward compatible)
*/
