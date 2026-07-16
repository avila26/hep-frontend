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
