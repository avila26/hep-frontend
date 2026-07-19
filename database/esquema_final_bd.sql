-- ============================================================================
-- ESQUEMA COMPLETO Y CORREGIDO DE BASE DE DATOS POSTGRESQL 
-- MÓDULO DE ACTIVOS Y ACTAS DE INGRESO (Hospital de Especialidades Portoviejo)
-- ============================================================================

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Limpieza de tablas existentes (precaución)
DROP TABLE IF EXISTS activos CASCADE;
DROP TABLE IF EXISTS actas_ingreso CASCADE;
DROP TABLE IF EXISTS cargas_masivas CASCADE;

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

CREATE TABLE public.cargas_masivas (
    id_carga SERIAL PRIMARY KEY,
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    total_filas INTEGER NOT NULL,
    filas_exitosas INTEGER NOT NULL,
    filas_con_error INTEGER NOT NULL,
    estado VARCHAR(30) NOT NULL CONSTRAINT chk_estado_carga CHECK (
        estado IN ('COMPLETADO', 'COMPLETADO_CON_ERRORES', 'FALLIDO')
    ),
    resultados JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.actas_ingreso (
    id_acta SERIAL PRIMARY KEY,
    referencia VARCHAR(50) UNIQUE NOT NULL,
    tipo_ingreso VARCHAR(50) NOT NULL CONSTRAINT chk_tipo_ingreso CHECK (
        tipo_ingreso IN ('Orden de compra', 'Memorando de ingreso', 'Acta de Entrega-Recepción', 'Contrato', 'Migración inicial')
    ),
    numero_orden_memorandum VARCHAR(100) NOT NULL,
    empresa_proveedora VARCHAR(150),
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observacion_general TEXT,
    item_presupuestario VARCHAR(100),
    partida_presupuestaria VARCHAR(100),
    valor_adquisicion_total NUMERIC(15,2),
    fecha_acta TIMESTAMP,
    funcionario_receptor VARCHAR(150),
    funcionario_entregador VARCHAR(150),
    id_carga INTEGER REFERENCES public.cargas_masivas(id_carga) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cuenta_contable VARCHAR(100),
    institucion_receptora VARCHAR(150),
    ubicacion VARCHAR(150),
    tipo_comprobante VARCHAR(100),
    ruc_proveedor VARCHAR(20),
    descuento_compra NUMERIC(15,2),
    estado VARCHAR(20) DEFAULT 'Borrador',
    numero_contrato VARCHAR(100)
);

CREATE TABLE public.activos (
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
    valor_adquisicion NUMERIC(15,2),
    valor_unitario NUMERIC(15,2),
    valor_total NUMERIC(15,2),
    codigo_sbye VARCHAR(100),
    tiempo_vida_util INTEGER,
    bloqueado BOOLEAN DEFAULT FALSE NOT NULL,
    marca VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    estado_activo VARCHAR(20) NOT NULL CONSTRAINT chk_estado_activo CHECK (
        estado_activo IN ('Bueno', 'Regular', 'Malo', 'Dañado')
    ),
    atributos_especificos JSONB,
    id_acta INTEGER REFERENCES public.actas_ingreso(id_acta) ON DELETE SET NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    tiene_garantia BOOLEAN DEFAULT FALSE NOT NULL,
    depreciacion_s_n VARCHAR(5) DEFAULT 'SI' CONSTRAINT chk_depreciacion_sn CHECK (depreciacion_s_n IN ('SI', 'NO')),
    tiempo_garantia VARCHAR(50),
    valor_contable NUMERIC(15,2),
    valor_residual NUMERIC(15,2),
    valor_en_libros NUMERIC(15,2),
    valor_depreciacion_acumulada NUMERIC(15,2) DEFAULT 0.00,
    fecha_ultima_depreciacion TIMESTAMP,
    id_carga INTEGER REFERENCES public.cargas_masivas(id_carga) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    numero_contrato VARCHAR(100)
);

-- ============================================================================
-- 2. ÍNDICES DE OPTIMIZACIÓN
-- ============================================================================
CREATE INDEX idx_activos_attrs ON public.activos USING gin (atributos_especificos);
CREATE INDEX idx_activos_codigo_barras ON public.activos USING btree (codigo_barras);
CREATE INDEX idx_activos_estado ON public.activos USING btree (estado_activo);
CREATE INDEX idx_activos_id_acta ON public.activos USING btree (id_acta);
CREATE INDEX idx_activos_numero_serie ON public.activos USING btree (numero_serie);


-- ============================================================================
-- 3. FUNCIONES DE LÓGICA DE NEGOCIO Y TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_update_timestamp() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actas_ingreso_update BEFORE UPDATE ON public.actas_ingreso FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();
CREATE TRIGGER trg_activos_update BEFORE UPDATE ON public.activos FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


CREATE OR REPLACE FUNCTION public.fn_generar_codigo_institucional() RETURNS character varying AS $$
DECLARE
    v_anio INT;
    v_prefijo VARCHAR(10);
    v_max_secuencial INT;
    v_nuevo_codigo VARCHAR(50);
BEGIN
    v_anio := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    v_prefijo := 'CI-' || v_anio || '-';
    
    SELECT COALESCE(MAX(SUBSTRING(codigo_institucional FROM 9)::INTEGER), 0)
    INTO v_max_secuencial
    FROM activos
    WHERE codigo_institucional LIKE v_prefijo || '%';
    
    v_max_secuencial := v_max_secuencial + 1;
    v_nuevo_codigo := v_prefijo || LPAD(v_max_secuencial::VARCHAR, 4, '0');
    
    RETURN v_nuevo_codigo;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.fn_generar_codigo_barras(p_modulo character varying DEFAULT NULL) RETURNS character varying AS $$
DECLARE
    v_parte_aleat   BIGINT;
    v_nuevo_codigo  VARCHAR(50);
    v_existe        BOOLEAN;
BEGIN
    -- Generar un número aleatorio de 13 dígitos único (puramente numérico)
    LOOP
        -- floor(random() * (10^13 - 10^12)) + 10^12 garantiza exactamente 13 dígitos
        v_parte_aleat := floor(random() * 9000000000000)::BIGINT + 1000000000000;
        v_nuevo_codigo := v_parte_aleat::VARCHAR;

        -- Verificar que el código no exista ya en la tabla
        SELECT EXISTS(
            SELECT 1 FROM public.activos WHERE codigo_barras = v_nuevo_codigo
        ) INTO v_existe;

        EXIT WHEN NOT v_existe;   -- salir en cuanto encontremos uno disponible
    END LOOP;

    RETURN v_nuevo_codigo;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION public.fn_calcular_depreciacion(p_id_activo integer, p_fecha_corte date DEFAULT CURRENT_DATE) RETURNS TABLE(id_activo_out integer, valor_adquisicion_out numeric, valor_residual_out numeric, depreciacion_acumulada_out numeric, valor_en_libros_out numeric, meses_depreciados integer) AS $$
DECLARE
    r_activo RECORD;
    v_vida_util_meses INT;
    v_meses_transcurridos INT;
    v_depreciacion_mensual NUMERIC(15, 4);
    v_dep_acumulada NUMERIC(15, 2);
    v_val_libros NUMERIC(15, 2);
BEGIN
    SELECT * INTO r_activo FROM activos WHERE id_activo = p_id_activo;
    
    IF NOT FOUND THEN RETURN; END IF;

    IF r_activo.depreciacion_s_n = 'NO' 
       OR r_activo.tiempo_vida_util IS NULL OR r_activo.tiempo_vida_util <= 0 
       OR r_activo.valor_unitario IS NULL OR r_activo.valor_unitario <= 0 THEN
       
        RETURN QUERY SELECT r_activo.id_activo, r_activo.valor_unitario, COALESCE(r_activo.valor_residual, 0.00), 0.00, r_activo.valor_unitario, 0;
        RETURN;
    END IF;

    v_vida_util_meses := r_activo.tiempo_vida_util * 12;
    v_meses_transcurridos := ((EXTRACT(YEAR FROM p_fecha_corte) - EXTRACT(YEAR FROM r_activo.fecha_adquisicion)) * 12 + (EXTRACT(MONTH FROM p_fecha_corte) - EXTRACT(MONTH FROM r_activo.fecha_adquisicion)))::INT;
    
    IF v_meses_transcurridos < 0 THEN v_meses_transcurridos := 0;
    ELSIF v_meses_transcurridos > v_vida_util_meses THEN v_meses_transcurridos := v_vida_util_meses;
    END IF;

    v_depreciacion_mensual := (r_activo.valor_unitario - COALESCE(r_activo.valor_residual, r_activo.valor_unitario * 0.10)) / v_vida_util_meses;
    v_dep_acumulada := ROUND((v_depreciacion_mensual * v_meses_transcurridos)::NUMERIC, 2);
    v_val_libros := r_activo.valor_unitario - v_dep_acumulada;

    UPDATE activos SET valor_depreciacion_acumulada = v_dep_acumulada, valor_en_libros = v_val_libros, fecha_ultima_depreciacion = p_fecha_corte WHERE id_activo = p_id_activo;
    RETURN QUERY SELECT r_activo.id_activo, r_activo.valor_unitario, COALESCE(r_activo.valor_residual, r_activo.valor_unitario * 0.10), v_dep_acumulada, v_val_libros, v_meses_transcurridos;
END;
$$ LANGUAGE plpgsql;
