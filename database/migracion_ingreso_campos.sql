-- Migración para alinear la BD con el ingreso de bienes del frontend
-- Mantiene los campos requeridos por el módulo de ingreso:
-- detalle del acta, garantía, características básicas, variables y específicas

BEGIN;

-- 1) Asegurar columnas de actas de ingreso
ALTER TABLE actas_ingreso
    ADD COLUMN IF NOT EXISTS referencia VARCHAR(50),
    ADD COLUMN IF NOT EXISTS fecha_ingreso TIMESTAMP,
    ADD COLUMN IF NOT EXISTS observacion_general TEXT,
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20);

-- 2) Asegurar columnas del inventario de activos
ALTER TABLE activos
    ADD COLUMN IF NOT EXISTS nombre VARCHAR(150),
    ADD COLUMN IF NOT EXISTS numero_serie VARCHAR(100),
    ADD COLUMN IF NOT EXISTS descripcion TEXT,
    ADD COLUMN IF NOT EXISTS modelo VARCHAR(100),
    ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
    ADD COLUMN IF NOT EXISTS codigo_sbye VARCHAR(100),
    ADD COLUMN IF NOT EXISTS estado_activo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS valor_adquisicion NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS depreciacion_s_n VARCHAR(5),
    ADD COLUMN IF NOT EXISTS tiene_garantia BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tiempo_garantia VARCHAR(50),
    ADD COLUMN IF NOT EXISTS valor_contable NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS valor_residual NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS valor_en_libros NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS valor_depreciacion_acumulada NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS fecha_ultima_depreciacion TIMESTAMP,
    ADD COLUMN IF NOT EXISTS tiempo_vida_util INTEGER,
    ADD COLUMN IF NOT EXISTS color VARCHAR(50),
    ADD COLUMN IF NOT EXISTS material VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dimension VARCHAR(100),
    ADD COLUMN IF NOT EXISTS observaciones TEXT,
    ADD COLUMN IF NOT EXISTS numero_acta VARCHAR(50);

-- 3) Rellenar valores por defecto cuando existan registros previos
UPDATE activos
SET nombre = COALESCE(nombre, 'Sin nombre'),
    numero_serie = COALESCE(numero_serie, ''),
    modelo = COALESCE(modelo, ''),
    marca = COALESCE(marca, ''),
    estado_activo = COALESCE(estado_activo, 'Bueno'),
    depreciacion_s_n = COALESCE(depreciacion_s_n, 'NO'),
    tiene_garantia = COALESCE(tiene_garantia, FALSE),
    tiempo_garantia = COALESCE(tiempo_garantia, NULL)
WHERE nombre IS NULL
   OR numero_serie IS NULL
   OR modelo IS NULL
   OR marca IS NULL
   OR estado_activo IS NULL
   OR depreciacion_s_n IS NULL;

-- 4) Asegurar que las actas tengan referencia y estado si ya existen
UPDATE actas_ingreso
SET referencia = COALESCE(referencia, 'ACTA-0000-0000'),
    estado = COALESCE(estado, 'Borrador')
WHERE referencia IS NULL
   OR estado IS NULL;

COMMIT;
