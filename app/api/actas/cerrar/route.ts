import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/actas/cerrar - Ejecutar el cierre de un acta de ingreso
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { idActa, usuario } = body;

        if (!idActa || !usuario) {
            return NextResponse.json(
                { error: 'Faltan parámetros obligatorios: idActa y usuario' }, 
                { status: 400 }
            );
        }

        // Ejecutar la función almacenada de cierre en PostgreSQL
        const result = await query(
            'SELECT * FROM fn_cerrar_acta_ingreso($1, $2)',
            [idActa, usuario]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Error desconocido durante el cierre del acta' }, 
                { status: 500 }
            );
        }

        const report = result.rows[0];

        if (!report.success) {
            return NextResponse.json(
                { error: 'Validación de Cierre Fallida', message: report.mensaje },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: report.mensaje,
            activosCreadosCount: report.activos_creados_count
        });
    } catch (error: any) {
        console.error('Error closing acta:', error);
        return NextResponse.json(
            { error: 'Error interno en el servidor al cerrar acta', details: error.message },
            { status: 500 }
        );
    }
}
