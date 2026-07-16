-- ============================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL PARA EL MÓDULO DE ACTIVOS Y ACTAS DE INGRESO
-- Hospital de Especialidades Portoviejo (HEP)
-- ============================================================================

-- Habilitar extensión para UUID por si se requiere en el futuro
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpieza previa para facilitar pruebas y despliegues limpios
DROP TABLE IF EXISTS activos CASCADE;
DROP TABLE IF EXISTS series_acta CASCADE;
DROP TABLE IF EXISTS lineas_acta CASCADE;
DROP TABLE IF EXISTS actas_ingreso CASCADE;
DROP TABLE IF EXISTS cargas_masivas CASCADE;

-- ============================================================================
-- 1. TABLA: REGISTRO DE CARGAS MASIVAS (cargas_masivas)
-- ============================================================================
CREATE TABLE cargas_masivas (
    id_carga SERIAL PRIMARY KEY,
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    total_filas INTEGER NOT NULL,
    filas_exitosas INTEGER NOT NULL,
    filas_con_error INTEGER NOT NULL,
    estado VARCHAR(30) NOT NULL CONSTRAINT chk_estado_carga CHECK (
        estado IN ('COMPLETADO', 'COMPLETADO_CON_ERRORES', 'FALLIDO')
    ),
    resultados JSONB, -- Logs detallados de cada fila importada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 2. TABLA: CABECERA DE ACTAS DE INGRESO (actas_ingreso)
-- ============================================================================
CREATE TABLE actas_ingreso (
    id_acta SERIAL PRIMARY KEY,
    referencia VARCHAR(50) UNIQUE NOT NULL, -- Formato: ACTA-YYYY-NNNN
    tipo_ingreso VARCHAR(50) NOT NULL CONSTRAINT chk_tipo_ingreso CHECK (
        tipo_ingreso IN (
            'Orden de compra', 
            'Memorando de ingreso', 
            'Acta de Entrega-Recepción', 
            'Contrato', 
            'Migración inicial'
        )
    ),
    numero_orden_memorandum VARCHAR(100) NOT NULL,
    empresa_proveedora VARCHAR(150),
    fecha_acta TIMESTAMP,
    observacion_general TEXT,
    cuenta_contable VARCHAR(100),
    item_presupuestario VARCHAR(100),
    partida_presupuestaria VARCHAR(100),
    valor_adquisicion_total NUMERIC(15, 2),
    funcionario_receptor VARCHAR(150),
    funcionario_entregador VARCHAR(150),
    institucion_receptora VARCHAR(150),
    ubicacion VARCHAR(150),
    tipo_comprobante VARCHAR(100),
    ruc_proveedor VARCHAR(20),
    descuento_compra NUMERIC(15, 2),
    estado VARCHAR(20) DEFAULT 'Borrador',
    numero_contrato VARCHAR(100),
    
    id_carga INTEGER REFERENCES cargas_masivas(id_carga) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 2. TABLA: INVENTARIO CONSOLIDADO DE ACTIVOS (activos)
-- ============================================================================
CREATE TABLE activos (
    id_activo SERIAL PRIMARY KEY,
    codigo_institucional VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    numero_serie VARCHAR(100) NOT NULL,
    descripcion TEXT,
    modelo VARCHAR(100) NOT NULL,
    material VARCHAR(100),
    fecha_adquisicion TIMESTAMP NOT NULL,
    responsable_entrega VARCHAR(150) NOT NULL,
    dimension VARCHAR(100),
    numero_contrato VARCHAR(100),
    valor_adquisicion NUMERIC(15, 2),
    valor_unitario NUMERIC(15, 2),
    valor_total NUMERIC(15, 2),
    codigo_sbye VARCHAR(100),
    tiempo_vida_util INTEGER, -- en años
    bloqueado BOOLEAN DEFAULT FALSE NOT NULL,
    marca VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    estado_activo VARCHAR(20) NOT NULL CONSTRAINT chk_estado_activo CHECK (
        estado_activo IN ('Bueno', 'Regular', 'Malo', 'Dañado')
    ),
    atributos_especificos JSONB, -- Copia exacta de los atributos técnicos del equipo
    -- Relación e información heredada del Acta
    id_acta INTEGER REFERENCES actas_ingreso(id_acta) ON DELETE SET NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    tiene_garantia BOOLEAN DEFAULT FALSE NOT NULL,
    tiempo_garantia VARCHAR(50),
    
    -- Datos contables y depreciación
    depreciacion_s_n VARCHAR(5) DEFAULT 'SI' CONSTRAINT chk_depreciacion_sn CHECK (depreciacion_s_n IN ('SI', 'NO')),
    valor_contable NUMERIC(15, 2),
    valor_residual NUMERIC(15, 2),
    valor_en_libros NUMERIC(15, 2),
    valor_depreciacion_acumulada NUMERIC(15, 2) DEFAULT 0.00,
    fecha_ultima_depreciacion TIMESTAMP,
    
    id_carga INTEGER REFERENCES cargas_masivas(id_carga) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- ÍNDICES DE OPTIMIZACIÓN
-- ============================================================================
-- B-Tree en campos clave para búsquedas y joins rápidos
CREATE INDEX idx_lineas_acta_id_acta ON lineas_acta(id_acta);
CREATE INDEX idx_series_acta_id_linea ON series_acta(id_linea);
CREATE INDEX idx_series_acta_numero_serie ON series_acta(numero_serie);
CREATE INDEX idx_activos_id_acta ON activos(id_acta);
CREATE INDEX idx_activos_numero_serie ON activos(numero_serie);
CREATE INDEX idx_activos_codigo_barras ON activos(codigo_barras);
CREATE INDEX idx_activos_estado ON activos(estado_activo);

-- GIN en atributos_especificos para posibilitar consultas complejas de atributos JSON
CREATE INDEX idx_lineas_acta_attrs ON lineas_acta USING gin (atributos_especificos);
CREATE INDEX idx_activos_attrs ON activos USING gin (atributos_especificos);

-- ============================================================================
-- TRIGGERS PARA ACTUALIZAR FECHAS DE MODIFICACIÓN (updated_at)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actas_ingreso_update
    BEFORE UPDATE ON actas_ingreso
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_activos_update
    BEFORE UPDATE ON activos
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ============================================================================
-- FUNCIONES DE LÓGICA DE NEGOCIO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generación automática de Código Institucional: CI-YYYY-NNNN
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generar_codigo_institucional()
RETURNS VARCHAR AS $$
DECLARE
    v_anio INT;
    v_prefijo VARCHAR(10);
    v_max_secuencial INT;
    v_nuevo_codigo VARCHAR(50);
BEGIN
    v_anio := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    v_prefijo := 'CI-' || v_anio || '-';
    
    -- Obtiene el secuencial máximo para el año actual
    SELECT COALESCE(MAX(SUBSTRING(codigo_institucional FROM 9)::INTEGER), 0)
    INTO v_max_secuencial
    FROM activos
    WHERE codigo_institucional LIKE v_prefijo || '%';
    
    v_max_secuencial := v_max_secuencial + 1;
    v_nuevo_codigo := v_prefijo || LPAD(v_max_secuencial::VARCHAR, 4, '0');
    
    RETURN v_nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Generación automática de Código de Barras: [MODULO]-[AÑO]-[SECUENCIAL]
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generar_codigo_barras(p_modulo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_anio INT;
    v_prefijo VARCHAR(15);
    v_max_secuencial INT;
    v_nuevo_codigo VARCHAR(50);
BEGIN
    -- Mapeo de prefijos según el módulo de destino
    v_prefijo := CASE p_modulo
        WHEN 'Computadoras'     THEN 'COMP'
        WHEN 'Impresoras'       THEN 'IMP'
        WHEN 'Teléfonos'        THEN 'TEL'
        WHEN 'CCTV'             THEN 'CAM'
        WHEN 'Access Points'    THEN 'AP'
        WHEN 'Laboratorio'      THEN 'LAB'
        WHEN 'Rayos X e Imagen' THEN 'RAYX'
        ELSE 'GEN'
    END;
    
    v_anio := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    v_prefijo := v_prefijo || '-' || v_anio || '-';
    
    -- Busca el secuencial máximo en activos para evitar duplicados
    WITH codigos_existentes AS (
        SELECT codigo_barras FROM activos WHERE codigo_barras LIKE v_prefijo || '%'
    )
    SELECT COALESCE(MAX(NULLIF(SUBSTRING(codigo_barras FROM LENGTH(v_prefijo) + 1), '')::INTEGER), 0)
    INTO v_max_secuencial
    FROM codigos_existentes;
    
    v_max_secuencial := v_max_secuencial + 1;
    v_nuevo_codigo := v_prefijo || LPAD(v_max_secuencial::VARCHAR, 5, '0');
    
    RETURN v_nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Función de Cierre de Acta de Ingreso: Transfiere series a Activos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_cerrar_acta_ingreso(p_id_acta INT, p_usuario_cierre VARCHAR)
RETURNS TABLE (
    success BOOLEAN,
    mensaje TEXT,
    activos_creados_count INT
) AS $$
DECLARE
    r_acta RECORD;
    r_linea RECORD;
    r_serie RECORD;
    v_total_series INT;
    v_linea_num INT := 0;
    v_cb VARCHAR(50);
    v_ci VARCHAR(50);
    v_activos_count INT := 0;
    v_label_doc VARCHAR(100);
BEGIN
    -- 1. Validar existencia del acta y estado
    SELECT * INTO r_acta FROM actas_ingreso WHERE id_acta = p_id_acta;
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Acta de ingreso no encontrada en el sistema.'::TEXT, 0;
        RETURN;
    END IF;
    
    IF r_acta.estado = 'Cerrada' THEN
        RETURN QUERY SELECT FALSE, 'El acta ya se encuentra cerrada.'::TEXT, 0;
        RETURN;
    END IF;

    -- 2. Validaciones de consistencia de la cabecera
    v_label_doc := CASE r_acta.tipo_ingreso
        WHEN 'Orden de compra' THEN 'N.º de Orden de Compra'
        WHEN 'Memorando de ingreso' THEN 'N.º de Memorando'
        WHEN 'Acta de Entrega-Recepción' THEN 'N.º de Acta'
        WHEN 'Contrato' THEN 'N.º de Contrato'
        ELSE 'N.º de documento'
    END;

    IF NULLIF(TRIM(r_acta.numero_orden_memorandum), '') IS NULL THEN
        RETURN QUERY SELECT FALSE, 'El ' || v_label_doc || ' es obligatorio.'::TEXT, 0;
        RETURN;
    END IF;

    IF r_acta.tipo_ingreso = 'Orden de compra' THEN
        IF NULLIF(TRIM(r_acta.empresa_proveedora), '') IS NULL THEN
            RETURN QUERY SELECT FALSE, 'La empresa proveedora es obligatoria para Orden de Compra.'::TEXT, 0;
            RETURN;
        END IF;
    ELSIF r_acta.tipo_ingreso = 'Memorando de ingreso' THEN
        IF r_acta.fecha_memorando IS NULL THEN
            RETURN QUERY SELECT FALSE, 'La fecha del memorando es obligatoria.'::TEXT, 0;
            RETURN;
        END IF;
        IF NULLIF(TRIM(r_acta.remitente_origen), '') IS NULL THEN
            RETURN QUERY SELECT FALSE, 'El remitente/unidad de origen es obligatorio.'::TEXT, 0;
            RETURN;
        END IF;
    ELSIF r_acta.tipo_ingreso = 'Acta de Entrega-Recepción' THEN
        IF r_acta.fecha_acta IS NULL THEN
            RETURN QUERY SELECT FALSE, 'La fecha del acta es obligatoria.'::TEXT, 0;
            RETURN;
        END IF;
        IF NULLIF(TRIM(r_acta.funcionario_receptor), '') IS NULL THEN
            RETURN QUERY SELECT FALSE, 'El funcionario receptor es obligatorio.'::TEXT, 0;
            RETURN;
        END IF;
        IF NULLIF(TRIM(r_acta.funcionario_entregador), '') IS NULL THEN
            RETURN QUERY SELECT FALSE, 'El funcionario entregador es obligatorio.'::TEXT, 0;
            RETURN;
        END IF;
    ELSIF r_acta.tipo_ingreso = 'Contrato' THEN
        IF r_acta.fecha_suscripcion IS NULL THEN
            RETURN QUERY SELECT FALSE, 'La fecha de suscripción del contrato es obligatoria.'::TEXT, 0;
            RETURN;
        END IF;
        IF NULLIF(TRIM(r_acta.administrador_contrato), '') IS NULL THEN
            RETURN QUERY SELECT FALSE, 'El administrador del contrato es obligatorio.'::TEXT, 0;
            RETURN;
        END IF;
    END IF;


    -- 3. Validar líneas del acta
    SELECT COUNT(*) INTO v_total_series FROM lineas_acta WHERE id_acta = p_id_acta;
    IF v_total_series = 0 THEN
        RETURN QUERY SELECT FALSE, 'El acta debe contener al menos una línea con activos.'::TEXT, 0;
        RETURN;
    END IF;

    -- 4. Validar integridad de series físicas declaradas vs físicas reales
    FOR r_linea IN SELECT * FROM lineas_acta WHERE id_acta = p_id_acta LOOP
        v_linea_num := v_linea_num + 1;
        
        -- Verificar cantidad declarada contra series reales registradas
        SELECT COUNT(*) INTO v_total_series FROM series_acta WHERE id_linea = r_linea.id_linea;
        IF v_total_series = 0 THEN
            RETURN QUERY SELECT FALSE, ('Línea ' || v_linea_num || ' (' || r_linea.tipo_activo || '): No posee series físicas registradas.')::TEXT, 0;
            RETURN;
        ELSIF v_total_series <> r_linea.cantidad_declarada THEN
            RETURN QUERY SELECT FALSE, ('Línea ' || v_linea_num || ' (' || r_linea.tipo_activo || '): Declara ' || r_linea.cantidad_declarada || ' unidades pero tiene registrada(s) ' || v_total_series || ' serie(s).')::TEXT, 0;
            RETURN;
        END IF;
        
        -- Validar campos obligatorios en cada serie
        FOR r_serie IN SELECT * FROM series_acta WHERE id_linea = r_linea.id_linea LOOP
            IF NULLIF(TRIM(r_serie.numero_serie), '') IS NULL THEN
                RETURN QUERY SELECT FALSE, ('Línea ' || v_linea_num || ' (' || r_linea.tipo_activo || '): Falta el número de serie en una de sus unidades.')::TEXT, 0;
                RETURN;
            END IF;
            
            -- Validar si la serie ya está registrada en el inventario activo
            IF EXISTS (SELECT 1 FROM activos WHERE numero_serie = r_serie.numero_serie) THEN
                RETURN QUERY SELECT FALSE, ('Línea ' || v_linea_num || '): La serie "' || r_serie.numero_serie || '" ya existe registrada en el inventario de activos.')::TEXT, 0;
                RETURN;
            END IF;

            IF NULLIF(TRIM(r_serie.codigo_sbye), '') IS NULL THEN
                RETURN QUERY SELECT FALSE, ('Línea ' || v_linea_num || ', Serie "' || r_serie.numero_serie || '"): Falta definir el Código SBYE.')::TEXT, 0;
                RETURN;
            END IF;

            IF NULLIF(TRIM(r_serie.ubicacion), '') IS NULL THEN
                RETURN QUERY SELECT FALSE, ('Línea ' || v_linea_num || ', Serie "' || r_serie.numero_serie || '"): Falta definir la ubicación física.')::TEXT, 0;
                RETURN;
            END IF;
        END LOOP;
    END LOOP;

    -- 5. Generar códigos e insertar en inventario consolidado (activos)
    FOR r_linea IN SELECT * FROM lineas_acta WHERE id_acta = p_id_acta LOOP
        FOR r_serie IN SELECT * FROM series_acta WHERE id_linea = r_linea.id_linea LOOP
            
            -- Generar código de barras si no existe
            IF NULLIF(TRIM(r_serie.codigo_barras), '') IS NULL THEN
                v_cb := fn_generar_codigo_barras(r_linea.modulo_destino);
                UPDATE series_acta SET codigo_barras = v_cb WHERE id_serie = r_serie.id_serie;
            ELSE
                v_cb := r_serie.codigo_barras;
            END IF;

            -- Generar código institucional si no existe
            IF NULLIF(TRIM(r_serie.codigo_institucional), '') IS NULL THEN
                v_ci := fn_generar_codigo_institucional();
                UPDATE series_acta SET codigo_institucional = v_ci WHERE id_serie = r_serie.id_serie;
            ELSE
                v_ci := r_serie.codigo_institucional;
            END IF;

            -- Insertar el activo al inventario
            INSERT INTO activos (
                codigo_institucional, nombre, numero_serie, descripcion, modelo, material,
                fecha_adquisicion, responsable_entrega, dimension, numero_contrato,
                valor_adquisicion, valor_unitario, valor_total, codigo_sbye, fecha_dns,
                tiempo_vida_util, bloqueado, administrador_del_proceso, item_presupuestario,
                partida_presupuestaria, numero_acta, marca, color, estado_activo, ubicacion,
                atributos_especificos, id_acta, codigo_barras, tiene_garantia, tiempo_garantia,
                tiene_cobertura_proveedor, nombre_proveedor, fecha_inicio_cobertura, fecha_fin_cobertura,
                ruc_proveedor, tipo_adquisicion, descuento_compra, monto_compra,
                tipo_comprobante, depreciacion_s_n, valor_contable,
                valor_residual, valor_en_libros, valor_depreciacion_acumulada,
                fecha_ultima_depreciacion, id_carga, observaciones
            ) 
            VALUES (
                v_ci, 
                r_linea.tipo_activo, 
                r_serie.numero_serie, 
                COALESCE(r_linea.descripcion, r_linea.especificaciones_tecnicas, ''), 
                r_linea.modelo, 
                COALESCE(r_linea.material, ''),
                r_acta.fecha_ingreso, 
                COALESCE(r_serie.responsable_entrega, r_acta.responsable_entrega, r_acta.tecnico_receptor), 
                COALESCE(r_linea.dimension, ''), 
                COALESCE(r_acta.numero_contrato, ''),
                r_acta.valor_adquisicion_total, 
                r_acta.valor_unitario, 
                r_acta.valor_unitario, 
                r_serie.codigo_sbye, 
                r_acta.fecha_dns,
                r_linea.tiempo_vida_util, 
                r_acta.bloqueado,
                CASE r_acta.tipo_ingreso
                    WHEN 'Orden de compra' THEN COALESCE(r_acta.administrador_orden_compra, '')
                    WHEN 'Contrato' THEN COALESCE(r_acta.administrador_contrato, '')
                    ELSE ''
                END,
                COALESCE(r_acta.item_presupuestario, ''),
                COALESCE(r_acta.partida_presupuestaria, ''), 
                r_acta.referencia, 
                r_linea.marca, 
                COALESCE(r_linea.color, ''),
                CASE 
                    WHEN r_serie.estado_individual IN ('Bueno', 'Regular', 'Dañado', 'Malo') THEN r_serie.estado_individual
                    ELSE 'Bueno'
                END, 
                r_serie.ubicacion,
                r_linea.atributos_especificos, 
                r_acta.id_acta, 
                v_cb, 
                r_acta.tiene_garantia,
                r_acta.tiempo_garantia,
                r_serie.tiene_cobertura_proveedor,
                r_serie.nombre_proveedor, 
                r_serie.fecha_inicio_cobertura, 
                r_serie.fecha_fin_cobertura,
                
                -- Datos contables iniciales
                r_acta.empresa_proveedora, -- RUC/Nombre del Proveedor heredado de la cabecera
                r_linea.origen_ingreso,
                0.00, -- descuento compra inicial
                r_acta.valor_unitario, -- monto compra
                r_acta.tipo_ingreso, -- tipo comprobante
                CASE WHEN r_linea.condicion_depreciacion = 'No aplica' THEN 'NO' ELSE 'SI' END,
                r_acta.valor_unitario, -- valor contable inicial
                COALESCE(r_acta.valor_unitario * 0.10, 0.00), -- valor residual (10% por defecto)
                r_acta.valor_unitario, -- valor en libros inicial
                0.00, -- depreciacion acumulada inicial
                r_acta.fecha_ingreso, -- fecha última depreciacion
                r_acta.id_carga,
                r_acta.observacion_general
            );
            
            v_activos_count := v_activos_count + 1;
        END LOOP;
    END LOOP;

    -- 6. Cambiar estado de acta a Cerrada y registrar auditoría
    UPDATE actas_ingreso 
    SET estado = 'Cerrada', 
        observacion_general = COALESCE(observacion_general, '') || E'\n-- Acta cerrada por: ' || p_usuario_cierre || ' el ' || CURRENT_TIMESTAMP::TEXT
    WHERE id_acta = p_id_acta;

    RETURN QUERY SELECT TRUE, 'Acta de ingreso cerrada exitosamente. Los activos fueron agregados al inventario.'::TEXT, v_activos_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Función para el Cálculo de Depreciación Lineal de un Activo a Fecha Corte
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calcular_depreciacion(
    p_id_activo INT, 
    p_fecha_corte DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id_activo_out INT,
    valor_adquisicion_out NUMERIC(15, 2),
    valor_residual_out NUMERIC(15, 2),
    depreciacion_acumulada_out NUMERIC(15, 2),
    valor_en_libros_out NUMERIC(15, 2),
    meses_depreciados INT
) AS $$
DECLARE
    r_activo RECORD;
    v_vida_util_meses INT;
    v_meses_transcurridos INT;
    v_depreciacion_mensual NUMERIC(15, 4);
    v_dep_acumulada NUMERIC(15, 2);
    v_val_libros NUMERIC(15, 2);
BEGIN
    SELECT * INTO r_activo FROM activos WHERE id_activo = p_id_activo;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Si no aplica depreciación, o faltan datos esenciales, no se deprecia
    IF r_activo.depreciacion_s_n = 'NO' 
       OR r_activo.tiempo_vida_util IS NULL 
       OR r_activo.tiempo_vida_util <= 0 
       OR r_activo.valor_unitario IS NULL 
       OR r_activo.valor_unitario <= 0 THEN
       
        RETURN QUERY SELECT 
            r_activo.id_activo, 
            r_activo.valor_unitario, 
            COALESCE(r_activo.valor_residual, 0.00), 
            0.00, 
            r_activo.valor_unitario, 
            0;
        RETURN;
    END IF;

    v_vida_util_meses := r_activo.tiempo_vida_util * 12;
    
    -- Calcular meses transcurridos entre la fecha de adquisición y la fecha de corte
    v_meses_transcurridos := (
        (EXTRACT(YEAR FROM p_fecha_corte) - EXTRACT(YEAR FROM r_activo.fecha_adquisicion)) * 12 + 
        (EXTRACT(MONTH FROM p_fecha_corte) - EXTRACT(MONTH FROM r_activo.fecha_adquisicion))
    )::INT;
    
    IF v_meses_transcurridos < 0 THEN
        v_meses_transcurridos := 0;
    ELSIF v_meses_transcurridos > v_vida_util_meses THEN
        v_meses_transcurridos := v_vida_util_meses;
    END IF;

    -- Fórmula lineal: Dep. Mensual = (Valor Adquisición - Valor Residual) / Vida Útil en Meses
    v_depreciacion_mensual := (r_activo.valor_unitario - COALESCE(r_activo.valor_residual, r_activo.valor_unitario * 0.10)) / v_vida_util_meses;
    
    v_dep_acumulada := ROUND((v_depreciacion_mensual * v_meses_transcurridos)::NUMERIC, 2);
    v_val_libros := r_activo.valor_unitario - v_dep_acumulada;

    -- Actualizar los datos del activo en la base de datos
    UPDATE activos 
    SET valor_depreciacion_acumulada = v_dep_acumulada,
        valor_en_libros = v_val_libros,
        fecha_ultima_depreciacion = p_fecha_corte
    WHERE id_activo = p_id_activo;

    RETURN QUERY SELECT 
        r_activo.id_activo, 
        r_activo.valor_unitario, 
        COALESCE(r_activo.valor_residual, r_activo.valor_unitario * 0.10), 
        v_dep_acumulada, 
        v_val_libros, 
        v_meses_transcurridos;
END;
$$ LANGUAGE plpgsql;
