// Utilidades de mapeo entre camelCase (React Frontend) y snake_case (PostgreSQL)

export function mapRowToActivo(row: any): any {
    if (!row) return null;
    let estadoFrontend = 'BUE';
    if (row.estado_activo === 'Bueno' || row.estado_activo === 'BUE') estadoFrontend = 'BUE';
    else if (row.estado_activo === 'Regular' || row.estado_activo === 'REG') estadoFrontend = 'REG';
    else if (row.estado_activo === 'Malo' || row.estado_activo === 'MAL') estadoFrontend = 'MAL';
    else if (row.estado_activo === 'Dañado') estadoFrontend = 'MAL';

    const depSN = (row.depreciacion_s_n === 'SI' || row.depreciacion_s_n === 'S') ? 'S' : 'N';

    return {
        idActivo: row.id_activo,
        codigoInstitucional: row.codigo_institucional,
        nombre: row.nombre,
        numeroSerie: row.numero_serie,
        descripcion: row.descripcion,
        modelo: row.modelo,
        material: row.material,
        fechaAdquisicion: row.fecha_adquisicion ? new Date(row.fecha_adquisicion) : null,
        responsableEntrega: row.responsable_entrega,
        dimension: row.dimension,
        numeroContrato: row.numero_contrato,
        valorAdquisicion: row.valor_adquisicion ? Number(row.valor_adquisicion) : null,
        valorUnitario: row.valor_unitario ? Number(row.valor_unitario) : null,
        valorTotal: row.valor_total ? Number(row.valor_total) : null,
        codigoSBYE: row.codigo_sbye,
        fechaDNS: null,
        tiempoVidaUtil: row.tiempo_vida_util,
        bloqueado: row.bloqueado,
        administradorDelProceso: null,
        institucionReceptora: row.institucion_receptora,
        fechaComprobante: row.fecha_acta ? new Date(row.fecha_acta) : null,
        funcionarioReceptor: row.funcionario_receptor,
        funcionarioEntregador: row.funcionario_entregador,
        referenciaActa: row.referencia_acta,
        observacionGeneral: row.observacion_general,
        cuentaContable: row.cuenta_contable,
        itemPresupuestario: row.item_presupuestario,
        partidaPresupuestaria: row.partida_presupuestaria,
        numeroActa: row.numero_orden_memorandum,
        marca: row.marca,
        color: row.color,
        estadoActivo: estadoFrontend,
        ubicacion: row.ubicacion,
        atributosEspecificos: row.atributos_especificos,
        idActa: row.id_acta,
        codigoBarras: row.codigo_barras,
        tieneGarantia: row.tiene_garantia,
        tiempoGarantia: row.tiempo_garantia,
        tieneCoberturaProveedor: false,
        nombreProveedor: row.empresa_proveedora,
        fechaInicioCobertura: null,
        fechaFinCobertura: null,
        rucProveedor: row.ruc_proveedor,
        tipoAdquisicion: row.tipo_ingreso,
        descuentoCompra: row.descuento_compra ? Number(row.descuento_compra) : null,
        montoCompra: row.valor_adquisicion_total ? Number(row.valor_adquisicion_total) : null,
        tipoComprobante: row.tipo_comprobante,
        depreciacionS_N: depSN,
        valorContable: row.valor_contable ? Number(row.valor_contable) : null,
        valorResidual: row.valor_residual ? Number(row.valor_residual) : null,
        valorEnLibros: row.valor_en_libros ? Number(row.valor_en_libros) : null,
        valorDepreciacionAcumulada: row.valor_depreciacion_acumulada ? Number(row.valor_depreciacion_acumulada) : null,
        fechaUltimaDepreciacion: row.fecha_ultima_depreciacion ? new Date(row.fecha_ultima_depreciacion) : null,
        observaciones: row.observaciones,
    };
}

export function mapActivoToRow(a: any): any {
    if (!a) return null;
    let estadoDb = 'Bueno';
    if (a.estadoActivo === 'BUE' || a.estadoActivo === 'Bueno') estadoDb = 'Bueno';
    else if (a.estadoActivo === 'REG' || a.estadoActivo === 'Regular') estadoDb = 'Regular';
    else if (a.estadoActivo === 'MAL' || a.estadoActivo === 'Malo') estadoDb = 'Malo';
    else if (a.estadoActivo === 'Dañado') estadoDb = 'Dañado';

    const depDb = (a.depreciacionS_N === 'S' || a.depreciacionS_N === 'SI') ? 'SI' : 'NO';

    return {
        codigo_institucional: a.codigoInstitucional,
        nombre: a.nombre,
        numero_serie: a.numeroSerie,
        descripcion: a.descripcion,
        modelo: a.modelo,
        material: a.material,
        fecha_adquisicion: a.fechaAdquisicion ? new Date(a.fechaAdquisicion).toISOString() : new Date().toISOString(),
        responsable_entrega: a.responsableEntrega || '',
        dimension: a.dimension,
        numero_contrato: a.numeroContrato,
        valor_adquisicion: a.valorAdquisicion ?? null,
        valor_unitario: a.valorUnitario ?? a.valorAdquisicion ?? null,
        valor_total: a.valorTotal ?? a.valorAdquisicion ?? a.valorUnitario ?? null,
        codigo_sbye: a.codigoSBYE,
        tiempo_vida_util: a.tiempoVidaUtil,
        bloqueado: !!a.bloqueado,
        marca: a.marca,
        color: a.color,
        estado_activo: estadoDb,
        atributos_especificos: a.atributosEspecificos,
        id_acta: a.idActa,
        codigo_barras: a.codigoBarras,
        tiene_garantia: !!a.tieneGarantia,
        tiempo_garantia: a.tiempoGarantia ? String(a.tiempoGarantia) : null,
        depreciacion_s_n: depDb,
        valor_contable: a.valorContable ?? a.valorUnitario ?? a.valorAdquisicion ?? null,
        valor_residual: a.valorResidual ?? (a.valorUnitario ? a.valorUnitario * 0.10 : 0.00),
        valor_en_libros: a.valorEnLibros ?? a.valorUnitario ?? a.valorAdquisicion ?? null,
        valor_depreciacion_acumulada: a.valorDepreciacionAcumulada ?? 0.00,
        fecha_ultima_depreciacion: a.fechaUltimaDepreciacion ? new Date(a.fechaUltimaDepreciacion).toISOString() : null,
        observaciones: a.observaciones,
    };
}

export function mapRowToActa(row: any): any {
    if (!row) return null;
    return {
        idActa: row.id_acta,
        referencia: row.referencia,
        tipoIngreso: row.tipo_ingreso,
        numeroOrdenMemorandum: row.numero_orden_memorandum,
        empresaProveedora: row.empresa_proveedora,
        administradorOrdenCompra: null,
        fechaOrdenCompra: null,
        tieneGarantia: false,
        tiempoGarantia: null,
        fechaIngreso: row.fecha_ingreso ? new Date(row.fecha_ingreso) : (row.created_at ? new Date(row.created_at) : new Date()),
        tecnicoReceptor: row.funcionario_receptor,
        responsableEntrega: row.funcionario_entregador,
        observacionGeneral: row.observacion_general,
        estado: row.estado || 'Borrador',
        numeroContrato: row.numero_contrato || null,
        cuentaContable: row.cuenta_contable,
        itemPresupuestario: row.item_presupuestario,
        partidaPresupuestaria: row.partida_presupuestaria,
        valorAdquisicionTotal: row.valor_adquisicion_total ? Number(row.valor_adquisicion_total) : null,
        valorUnitario: row.valor_adquisicion_total ? Number(row.valor_adquisicion_total) : null,
        fechaDNS: null,
        bloqueado: false,
        fechaMemorando: null,
        remitenteOrigen: null,
        asuntoMemorando: null,
        fechaActa: row.fecha_acta ? new Date(row.fecha_acta) : null,
        funcionarioReceptor: row.funcionario_receptor,
        funcionarioEntregador: row.funcionario_entregador,
        institucionReceptora: row.institucion_receptora,
        ubicacion: row.ubicacion,
        tipoComprobante: row.tipo_comprobante,
        rucProveedor: row.ruc_proveedor,
        descuentoCompra: row.descuento_compra ? Number(row.descuento_compra) : null,
        fechaSuscripcion: null,
        fechaVigencia: null,
        administradorContrato: null
    };
}
