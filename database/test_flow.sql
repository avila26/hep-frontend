-- ============================================================================
-- SCRIPT DE PRUEBA DE INTEGRACIÓN PARA EL MÓDULO DE ACTIVOS
-- Simula el flujo completo: Crear Acta -> Agregar Líneas/Series -> Cerrar -> Depreciar
-- ============================================================================

-- Iniciamos una transacción de prueba. 
-- Puedes cambiar COMMIT por ROLLBACK al final si solo deseas probar sin alterar la base permanentemente.
BEGIN;

-- 1. Insertar un acta de ingreso en borrador
INSERT INTO actas_ingreso (
    referencia,
    tipo_ingreso,
    numero_orden_memorandum,
    empresa_proveedora,
    tecnico_receptor,
    responsable_entrega,
    observacion_general,
    tiene_garantia,
    fecha_inicio_garantia,
    fecha_fin_garantia,
    valor_adquisicion_total,
    valor_unitario
) VALUES (
    'ACTA-2026-0001',
    'Orden de compra',
    'OC-2026-98765',
    'EQUIPOS MÉDICOS S.A.',
    'Ing. Carlos Mendoza (Soporte Técnico)',
    'Lic. Ana Gómez (Directora Administrativa)',
    'Ingreso inicial de prueba para equipos de laboratorio y cómputo.',
    TRUE,
    '2026-01-01 08:00:00',
    '2028-01-01 08:00:00',
    3000.00,
    1000.00
) RETURNING id_acta, referencia, estado;

-- Guardar el id del acta creada (para las inserciones siguientes usaremos el valor obtenido, asumiendo id_acta = 1 en base vacía)
-- 2. Insertar Línea 1 (Computadoras)
INSERT INTO lineas_acta (
    id_acta,
    modulo_destino,
    tipo_activo,
    marca,
    modelo,
    cantidad_declarada,
    especificaciones_tecnicas,
    estado_llegada,
    origen_ingreso,
    motivo_ingreso,
    unidad_medida,
    condicion_depreciacion,
    tiempo_vida_util,
    atributos_especificos
) VALUES (
    (SELECT id_acta FROM actas_ingreso WHERE referencia = 'ACTA-2026-0001'),
    'Computadoras',
    'Laptop Administrativa',
    'Dell',
    'Latitude 5430',
    2,
    'Intel Core i5, 16GB RAM, 512GB SSD',
    'Bueno',
    'Compra',
    'Adquisición Nueva',
    'Unidad',
    'Lineal',
    5, -- 5 años de vida útil
    '{"procesadorMarca": "Intel", "procesadorTipo": "i5", "ramCapacidad": "16GB", "almacenamientoCapacidad": "512GB"}'::jsonb
);

-- 3. Insertar Línea 2 (Laboratorio)
INSERT INTO lineas_acta (
    id_acta,
    modulo_destino,
    tipo_activo,
    marca,
    modelo,
    cantidad_declarada,
    especificaciones_tecnicas,
    estado_llegada,
    origen_ingreso,
    motivo_ingreso,
    unidad_medida,
    condicion_depreciacion,
    tiempo_vida_util,
    atributos_especificos
) VALUES (
    (SELECT id_acta FROM actas_ingreso WHERE referencia = 'ACTA-2026-0001'),
    'Laboratorio',
    'Microscopio Óptico',
    'Nikon',
    'Eclipse Ei',
    1,
    'Microscopio binocular educativo',
    'Bueno',
    'Compra',
    'Adquisición Nueva',
    'Unidad',
    'Lineal',
    10, -- 10 años de vida útil
    '{"voltaje": "110V", "frecuencia": "60Hz", "lentes": ["4x", "10x", "40x", "100x"]}'::jsonb
);

-- 4. Insertar las series correspondientes para la Línea 1 (Laptop Administrativa - 2 unidades)
INSERT INTO series_acta (
    id_linea,
    numero_serie,
    estado_individual,
    codigo_sbye,
    ubicacion,
    tiene_cobertura_proveedor,
    nombre_proveedor
) VALUES 
(
    (SELECT id_linea FROM lineas_acta WHERE tipo_activo = 'Laptop Administrativa' LIMIT 1),
    'DELL-SRV-9091',
    'Bueno',
    'SBYE-COMP-001',
    'Oficina de Presidencia',
    FALSE,
    NULL
),
(
    (SELECT id_linea FROM lineas_acta WHERE tipo_activo = 'Laptop Administrativa' LIMIT 1),
    'DELL-SRV-9092',
    'Bueno',
    'SBYE-COMP-002',
    'Oficina de Adquisiciones',
    TRUE,
    'DELL ECUADOR'
);

-- 5. Insertar la serie para la Línea 2 (Microscopio - 1 unidad)
INSERT INTO series_acta (
    id_linea,
    numero_serie,
    estado_individual,
    codigo_sbye,
    ubicacion,
    tiene_cobertura_proveedor
) VALUES (
    (SELECT id_linea FROM lineas_acta WHERE tipo_activo = 'Microscopio Óptico' LIMIT 1),
    'NIKON-MIC-8811',
    'Bueno',
    'SBYE-LAB-101',
    'Laboratorio de Hematología',
    FALSE
);

-- Verificamos el estado actual antes de cerrar
\echo '=== ACTAS EN BORRADOR ==='
SELECT id_acta, referencia, estado, tecnico_receptor FROM actas_ingreso;

\echo '=== DETALLE DE LINEAS Y CANTIDADES DECLARADAS ==='
SELECT id_linea, modulo_destino, tipo_activo, cantidad_declarada FROM lineas_acta;

\echo '=== SERIES FISICAS EN LISTA DE ESPERA ==='
SELECT id_serie, numero_serie, codigo_sbye, ubicacion FROM series_acta;

-- 6. Ejecutar el Cierre del Acta
\echo '=== PROCESANDO EL CIERRE DEL ACTA ==='
SELECT * FROM fn_cerrar_acta_ingreso(
    (SELECT id_acta FROM actas_ingreso WHERE referencia = 'ACTA-2026-0001'),
    'Ing. Pedro Alava'
);

-- Verificamos si los activos se crearon correctamente
\echo '=== INVENTARIO CONSOLIDADO DE ACTIVOS CREADO ==='
SELECT id_activo, codigo_institucional, codigo_barras, nombre, numero_serie, estado_activo, ubicacion FROM activos;

-- Verificamos que el acta ahora esté Cerrada
\echo '=== ESTADO DEL ACTA LUEGO DEL CIERRE ==='
SELECT id_acta, referencia, estado, observacion_general FROM actas_ingreso;

-- 7. Simular depreciación para la laptop (5 años vida útil = 60 meses) 
--    Valor unitario = 1000.00, Valor residual (10%) = 100.00. Monto depreciable = 900.00.
--    Depreciación mensual = 900.00 / 60 = 15.00 por mes.
--    Simularemos una fecha de corte 2 años después (24 meses).
--    Depreciación acumulada esperada = 15.00 * 24 = 360.00.
--    Valor en libros esperado = 1000.00 - 360.00 = 640.00.
\echo '=== PRUEBA DE CÁLCULO DE DEPRECIACIÓN (2 AÑOS DESPUÉS) ==='
SELECT * FROM fn_calcular_depreciacion(
    (SELECT id_activo FROM activos WHERE numero_serie = 'DELL-SRV-9091'),
    '2028-01-01'::date
);

-- Consultamos cómo quedó el activo en la base de datos
SELECT id_activo, nombre, valor_unitario, valor_residual, valor_depreciacion_acumulada, valor_en_libros, fecha_ultima_depreciacion FROM activos WHERE numero_serie = 'DELL-SRV-9091';

-- Deshacemos los cambios para mantener la base de datos limpia luego de la prueba
ROLLBACK;
\echo '=== TRANSACCION CANCELADA (ROLLBACK) - BASE DE DATOS LIMPIA ==='
