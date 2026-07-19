import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const column = searchParams.get('column');
    const q = searchParams.get('query');

    if (!table || !column || !q) {
        return NextResponse.json({ error: 'Faltan parámetros requeridos (table, column, query)' }, { status: 400 });
    }

    // Validación de seguridad para evitar inyección SQL
    const allowedTables = ['activos', 'actas_ingreso', 'cargas_masivas'];
    if (!allowedTables.includes(table)) {
        return NextResponse.json({ error: 'Tabla no permitida o no existente en BD' }, { status: 400 });
    }

    // Permitir solo caracteres alfanuméricos y guión bajo para columnas
    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
        return NextResponse.json({ error: 'Columna inválida' }, { status: 400 });
    }

    try {
        // Usar ILIKE para búsqueda sin distinción de mayúsculas/minúsculas
        // Usamos ::text por si la columna no es tipo texto
        const sql = `
            SELECT DISTINCT ${column} AS value 
            FROM ${table} 
            WHERE ${column}::text ILIKE $1 
            AND ${column} IS NOT NULL
            LIMIT 10
        `;
        const result = await query(sql, [`%${q}%`]);
        const values = result.rows.map((row: any) => row.value);
        
        return NextResponse.json(values);
    } catch (error: any) {
        console.error('Autocomplete API Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
    }
}
