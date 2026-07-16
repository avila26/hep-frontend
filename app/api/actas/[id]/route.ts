import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { mapRowToActa } from '@/utils/mapper';

// PUT /api/actas/[id] - Actualizar un acta en Borrador (cabecera, líneas y series)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const client = await pool.connect();
    try {
        const idActa = parseInt(params.id);
        if (isNaN(idActa)) {
            return NextResponse.json({ error: 'ID de acta inválido' }, { status: 400 });
        }

        const body = await request.json();
        
        await client.query('BEGIN');

        // 1. Verificar si el acta existe y está en borrador
        const checkResult = await client.query('SELECT estado FROM actas_ingreso WHERE id_acta = $1', [idActa]);
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'Acta no encontrada' }, { status: 404 });
        }
        if (checkResult.rows[0].estado === 'Cerrada') {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: 'No se puede modificar un acta cerrada' }, { status: 400 });
        }

        // 2. Actualizar Cabecera
        const updateCabecera = `
            UPDATE actas_ingreso SET
                tipo_ingreso = $1, numero_orden_memorandum = $2, empresa_proveedora = $3,
                fecha_ingreso = $4, observacion_general = $5, numero_contrato = $6,
                item_presupuestario = $7, partida_presupuestaria = $8, valor_adquisicion_total = $9,
                fecha_acta = $10, funcionario_receptor = $11, funcionario_entregador = $12
            WHERE id_acta = $13
            RETURNING *
        `;

        const cabeceraValues = [
            body.tipoIngreso,
            body.numeroOrdenMemorandum || '',
            body.empresaProveedora || null,
            body.fechaIngreso ? new Date(body.fechaIngreso).toISOString() : new Date().toISOString(),
            body.observacionGeneral || null,
            body.numeroContrato || null,
            body.itemPresupuestario || null,
            body.partidaPresupuestaria || null,
            body.valorAdquisicionTotal,
            body.fechaActa ? new Date(body.fechaActa).toISOString() : null,
            body.funcionarioReceptor || '',
            body.funcionarioEntregador || '',
            idActa
        ];

        const resCabecera = await client.query(updateCabecera, cabeceraValues);
        const actaActualizada = mapRowToActa(resCabecera.rows[0]);
        actaActualizada.lineas = [];

        // 2.5 Relacionar los activos con el acta
        if (body.activosGenerados && Array.isArray(body.activosGenerados) && body.activosGenerados.length > 0) {
            const placeholders = body.activosGenerados.map((_, i) => `$${i + 2}`).join(', ');
            await client.query(
                `UPDATE activos SET id_acta = $1 WHERE id_activo IN (${placeholders})`,
                [idActa, ...body.activosGenerados]
            );
        }

        // 3. Obtener activos vinculados a este acta
        const activosResult = await client.query(
            'SELECT * FROM activos WHERE id_acta = $1 ORDER BY id_activo ASC',
            [idActa]
        );
        const assets = activosResult.rows;

        // Helper para reverse-mapear prefijo de codigo_barras al modulo
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

        // Agrupar por (nombre, marca, modelo) para crear líneas
        const grupos = new Map<string, any[]>();
        assets.forEach(a => {
            const key = `${a.nombre || ''}||${a.marca || ''}||${a.modelo || ''}`;
            if (!grupos.has(key)) {
                grupos.set(key, []);
            }
            grupos.get(key)!.push(a);
        });

        let lineaIdCounter = 1;
        grupos.forEach((groupAssets, key) => {
            const first = groupAssets[0];
            const idLinea = (idActa * 1000) + lineaIdCounter;
            lineaIdCounter++;

            const series = groupAssets.map(a => ({
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

            actaActualizada.lineas.push({
                idLinea,
                idActa,
                moduloDestino: getModuloDestino(first.codigo_barras),
                tipoActivo: first.nombre || 'Activo',
                marca: first.marca || 'S/M',
                modelo: first.modelo || 'S/M',
                cantidadDeclarada: groupAssets.length,
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

        await client.query('COMMIT');
        return NextResponse.json(actaActualizada);
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error updating acta:', error);
        return NextResponse.json({ error: 'Error al actualizar acta de ingreso', details: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

// DELETE /api/actas/[id] - Eliminar un acta
export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const idActa = parseInt(params.id);
        if (isNaN(idActa)) {
            return NextResponse.json({ error: 'ID de acta inválido' }, { status: 400 });
        }

        const result = await query('DELETE FROM actas_ingreso WHERE id_acta = $1 RETURNING id_acta', [idActa]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Acta no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Acta eliminada correctamente' });
    } catch (error: any) {
        console.error('Error deleting acta:', error);
        return NextResponse.json({ error: 'Error al eliminar acta', details: error.message }, { status: 500 });
    }
}
