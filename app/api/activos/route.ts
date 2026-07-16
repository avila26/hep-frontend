import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mapRowToActivo, mapActivoToRow } from '@/utils/mapper';

// GET /api/activos - Obtener todos los activos
export async function GET() {
    try {
        const result = await query(`
            SELECT a.*, 
                   ai.cuenta_contable AS cuenta_contable,
                   ai.item_presupuestario AS item_presupuestario,
                   ai.partida_presupuestaria AS partida_presupuestaria,
                   ai.numero_orden_memorandum AS numero_orden_memorandum,
                   ai.empresa_proveedora AS empresa_proveedora,
                   ai.ruc_proveedor AS ruc_proveedor,
                   ai.tipo_ingreso AS tipo_ingreso,
                   ai.descuento_compra AS descuento_compra,
                   ai.valor_adquisicion_total AS valor_adquisicion_total,
                   ai.tipo_comprobante AS tipo_comprobante,
                   ai.ubicacion AS ubicacion,
                   ai.institucion_receptora AS institucion_receptora,
                   ai.fecha_acta AS fecha_acta,
                   ai.funcionario_receptor AS funcionario_receptor,
                   ai.funcionario_entregador AS funcionario_entregador,
                   ai.referencia AS referencia_acta,
                   ai.observacion_general AS observacion_general
            FROM activos a 
            LEFT JOIN actas_ingreso ai ON a.id_acta = ai.id_acta 
            ORDER BY a.id_activo DESC
        `);
        const activos = result.rows.map(mapRowToActivo);
        return NextResponse.json(activos);
    } catch (error: any) {
        console.error('Error fetching assets:', error);
        return NextResponse.json({ error: 'Error al obtener activos', details: error.message }, { status: 500 });
    }
}

// POST /api/activos - Crear un nuevo activo (ingreso directo manual)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const rowData = mapActivoToRow(body);
        
        // Si no trae código institucional, autogenerar
        if (!rowData.codigo_institucional) {
            const genResult = await query("SELECT fn_generar_codigo_institucional() as code");
            rowData.codigo_institucional = genResult.rows[0].code;
        }

        // Si no trae código de barras, autogenerar
        if (!rowData.codigo_barras) {
            const genResult = await query("SELECT fn_generar_codigo_barras($1) as code", [body.moduloDestino || 'General']);
            rowData.codigo_barras = genResult.rows[0].code;
        }

        const keys = Object.keys(rowData);
        const values = Object.values(rowData);
        const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
        
        const insertQuery = `
            INSERT INTO activos (${keys.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;
        
        const result = await query(insertQuery, values);
        const nuevoActivo = mapRowToActivo(result.rows[0]);
        return NextResponse.json(nuevoActivo, { status: 201 });
    } catch (error: any) {
        console.error('Error creating asset:', error);
        return NextResponse.json({ error: 'Error al registrar activo', details: error.message }, { status: 500 });
    }
}
