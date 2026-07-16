import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mapRowToActivo, mapActivoToRow } from '@/utils/mapper';

// PUT /api/activos/[id] - Actualizar un activo existente
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const idActivo = parseInt(params.id);
        if (isNaN(idActivo)) {
            return NextResponse.json({ error: 'ID de activo inválido' }, { status: 400 });
        }

        const body = await request.json();
        const rowData = mapActivoToRow(body);
        
        // No permitir actualizar la clave primaria o el ID
        delete rowData.id_activo;

        const keys = Object.keys(rowData);
        const values = Object.values(rowData);
        
        // Agregar el ID como último parámetro para el WHERE
        values.push(idActivo);
        
        const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
        const updateQuery = `
            UPDATE activos 
            SET ${setClause}
            WHERE id_activo = $${values.length}
            RETURNING *
        `;
        
        const result = await query(updateQuery, values);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 });
        }

        const activoActualizado = mapRowToActivo(result.rows[0]);
        return NextResponse.json(activoActualizado);
    } catch (error: any) {
        console.error('Error updating asset:', error);
        return NextResponse.json({ error: 'Error al actualizar activo', details: error.message }, { status: 500 });
    }
}

// DELETE /api/activos/[id] - Eliminar un activo
export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const idActivo = parseInt(params.id);
        if (isNaN(idActivo)) {
            return NextResponse.json({ error: 'ID de activo inválido' }, { status: 400 });
        }

        const result = await query('DELETE FROM activos WHERE id_activo = $1 RETURNING id_activo', [idActivo]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Activo no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Activo eliminado correctamente' });
    } catch (error: any) {
        console.error('Error deleting asset:', error);
        return NextResponse.json({ error: 'Error al eliminar activo', details: error.message }, { status: 500 });
    }
}
