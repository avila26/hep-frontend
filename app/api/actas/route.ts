import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { mapRowToActa } from '@/utils/mapper';

function getModuloDestino(codigoBarras: string | null): string {
    if (!codigoBarras) return 'General';
    const parts = codigoBarras.split('-');
    const prefix = parts[0];
    switch (prefix) {
        case 'COMP': return 'Computadoras';
        case 'IMP': return 'Impresoras';
        case 'TEL': return 'Teléfonos';
        case 'CAM': return 'CCTV';
        case 'AP': return 'Access Points';
        case 'LAB': return 'Laboratorio';
        case 'RAYX': return 'Rayos X e Imagen';
        default: return 'General';
    }
}

// GET /api/actas - Obtener todas las actas de ingreso con sus líneas y series
export async function GET() {
    try {
        // 1. Obtener todas las cabeceras de actas
        const actasResult = await query('SELECT * FROM actas_ingreso ORDER BY id_acta DESC');
        const actas = actasResult.rows.map(mapRowToActa);

        if (actas.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Obtener todos los activos asociados a actas
        const activosResult = await query('SELECT * FROM activos WHERE id_acta IS NOT NULL ORDER BY id_activo ASC');
        const activos = activosResult.rows;

        // Map para agrupar activos por id_acta
        const activosPorActa = new Map<number, any[]>();
        activos.forEach(a => {
            if (a.id_acta) {
                if (!activosPorActa.has(a.id_acta)) {
                    activosPorActa.set(a.id_acta, []);
                }
                activosPorActa.get(a.id_acta)!.push(a);
            }
        });

        // 3. Reconstruir líneas y series para cada acta
        actas.forEach((acta: any) => {
            acta.lineas = [];
            const listaActivos = activosPorActa.get(acta.idActa) || [];

            // Agrupar por (nombre, marca, modelo) para crear líneas
            const grupos = new Map<string, any[]>();
            listaActivos.forEach(a => {
                const key = `${a.nombre || ''}||${a.marca || ''}||${a.modelo || ''}`;
                if (!grupos.has(key)) {
                    grupos.set(key, []);
                }
                grupos.get(key)!.push(a);
            });

            let lineaIdCounter = 1;
            grupos.forEach((assets, key) => {
                const first = assets[0];
                const idLinea = (acta.idActa * 1000) + lineaIdCounter;
                lineaIdCounter++;

                const series = assets.map(a => ({
                    idSerie: a.id_activo,
                    idLinea: idLinea,
                    numeroSerie: a.numero_serie,
                    estadoIndividual: a.estado_activo,
                    observacionIndividual: a.observaciones || null,
                    codigoBarras: a.codigo_barras || null,
                    codigoSBYE: a.codigo_sbye || null,
                    ubicacion: a.ubicacion || 'Bodega',
                    responsableEntrega: a.responsable_entrega || null,
                    codigoInstitucional: a.codigo_institucional || null,
                    documentoRespaldo: null,
                    tieneCoberturaProveedor: !!a.tiene_garantia,
                    nombreProveedor: null,
                    fechaInicioCobertura: null,
                    fechaFinCobertura: null
                }));

                acta.lineas.push({
                    idLinea,
                    idActa: acta.idActa,
                    moduloDestino: getModuloDestino(first.codigo_barras),
                    tipoActivo: first.nombre || 'Activo',
                    marca: first.marca || 'S/M',
                    modelo: first.modelo || 'S/M',
                    cantidadDeclarada: assets.length,
                    especificacionesTecnicas: first.descripcion || null,
                    estadoLlegada: first.estado_activo || 'Bueno',
                    observacionLinea: first.observaciones || null,
                    color: first.color || null,
                    material: first.material || null,
                    dimension: first.dimension || null,
                    descripcion: first.descripcion || null,
                    origenIngreso: 'Compra',
                    motivoIngreso: 'Adquisición Nueva',
                    unidadMedida: 'Unidad',
                    condicionDepreciacion: first.depreciacion_s_n === 'SI' ? 'Lineal' : 'No aplica',
                    tiempoVidaUtil: first.tiempo_vida_util || null,
                    atributosEspecificos: first.atributos_especificos || null,
                    codigoSBYE: first.codigo_sbye || null,
                    series
                });
            });
        });

        return NextResponse.json(actas);
    } catch (error: any) {
        console.error('Error fetching actas:', error);
        return NextResponse.json({ error: 'Error al obtener actas de ingreso', details: error.message }, { status: 500 });
    }
}

// POST /api/actas - Crear un acta de ingreso en Borrador con sus líneas y series (transaccional)
export async function POST(request: Request) {
    const client = await pool.connect();
    try {
        const body = await request.json();
        
        await client.query('BEGIN');

        // 1. Generar la referencia ACTA-YYYY-NNNN
        const anio = new Date().getFullYear();
        const prefijo = `ACTA-${anio}-`;
        const refResult = await client.query(
            "SELECT COALESCE(MAX(NULLIF(SUBSTRING(referencia FROM 11), '')::INTEGER), 0) AS max_ref FROM actas_ingreso WHERE referencia LIKE $1",
            [prefijo + '%']
        );
        const nextSecuencial = refResult.rows[0].max_ref + 1;
        const referencia = `${prefijo}${String(nextSecuencial).padStart(4, '0')}`;

        // 2. Insertar Cabecera del Acta
        const insertCabecera = `
            INSERT INTO actas_ingreso (
                referencia, tipo_ingreso, numero_orden_memorandum, empresa_proveedora,
                fecha_acta, observacion_general, cuenta_contable, item_presupuestario, partida_presupuestaria,
                valor_adquisicion_total, funcionario_receptor, funcionario_entregador,
                institucion_receptora, ubicacion, tipo_comprobante, ruc_proveedor, descuento_compra,
                numero_contrato
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            ) RETURNING *
        `;

        const cabeceraValues = [
            referencia,                                           // $1
            body.tipoIngreso,                                     // $2
            body.numeroOrdenMemorandum || '',                     // $3
            body.empresaProveedora || null,                       // $4
            body.fechaActa ? new Date(body.fechaActa).toISOString() : null, // $5
            body.observacionGeneral || null,                      // $6
            body.cuentaContable || null,                          // $7
            body.itemPresupuestario || null,                      // $8
            body.partidaPresupuestaria || null,                   // $9
            body.valorAdquisicionTotal,                           // $10
            body.funcionarioReceptor || null,                     // $11
            body.funcionarioEntregador || null,                   // $12
            body.institucionReceptora || null,                    // $13
            body.ubicacion || null,                               // $14
            body.tipoComprobante || null,                         // $15
            body.rucProveedor || null,                            // $16
            body.descuentoCompra || null,                         // $17
            body.numeroContrato || null                           // $18
        ];

        const resCabecera = await client.query(insertCabecera, cabeceraValues);
        const actaCreada = mapRowToActa(resCabecera.rows[0]);
        actaCreada.lineas = [];

        // 3. Ya no hay lógica de líneas ni series (se insertan directamente como activos)

        await client.query('COMMIT');
        return NextResponse.json(actaCreada, { status: 201 });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating acta:', error);
        return NextResponse.json({ error: 'Error al registrar acta de ingreso', details: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
