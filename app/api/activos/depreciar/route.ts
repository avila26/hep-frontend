import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/activos/depreciar - Calcular depreciación a una fecha de corte
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idActivo, fechaCorte } = body;

        if (!idActivo) {
            return NextResponse.json(
                { error: 'Falta el parámetro obligatorio: idActivo' }, 
                { status: 400 }
            );
        }

        const dateParam = fechaCorte ? new Date(fechaCorte).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Ejecutar la función almacenada de cálculo de depreciación en PostgreSQL
        const result = await query(
            'SELECT * FROM fn_calcular_depreciacion($1, $2::date)',
            [idActivo, dateParam]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'No se pudo calcular la depreciación para el activo indicado' }, 
                { status: 404 }
            );
        }

        const data = result.rows[0];

        return NextResponse.json({
            idActivo: data.id_activo_out,
            valorAdquisicion: Number(data.valor_adquisicion_out),
            valorResidual: Number(data.valor_residual_out),
            depreciacionAcumulada: Number(data.depreciacion_acumulada_out),
            valorEnLibros: Number(data.valor_en_libros_out),
            mesesDepreciados: data.meses_depreciados
        });
    } catch (error: any) {
        console.error('Error calculating depreciation:', error);
        return NextResponse.json(
            { error: 'Error interno al calcular depreciación', details: error.message },
            { status: 500 }
        );
    }
}
