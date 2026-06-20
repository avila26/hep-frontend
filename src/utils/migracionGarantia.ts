/**
 * migracionGarantia.ts
 * Migra los campos de garantía de activos existentes que vienen de la carga masiva.
 *
 * Regla:
 *   - Si "Feha de inicio de garantia" = "SIN DATOS" o vacío → tieneGarantia = false
 *   - Si tiene fecha válida → tieneGarantia = true, mapear fechas
 *
 * Se ejecuta una sola vez; el flag 'garantia_migrada_v1' en localStorage lo controla.
 */

import { Activo } from '../context/ActivosContext';

const MIGRATION_FLAG = 'garantia_migrada_v1';

/** Detecta strings que representan datos vacíos */
const esVacio = (val: unknown): boolean => {
    if (!val) return true;
    const s = String(val).trim().toUpperCase();
    return s === '' || s === 'SIN DATOS' || s === 'N/A' || s === '-' || s === '—' || s === 'NULL';
};

/** Intenta parsear una fecha desde varios formatos comunes */
const parseFechaFlexible = (val: unknown): Date | null => {
    if (!val || esVacio(val)) return null;
    const s = String(val).trim();
    // ISO: "2024-01-15", "2024-01-15T..."
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }
    // DD/MM/YYYY o DD-MM-YYYY
    const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
        const d = new Date(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`);
        return isNaN(d.getTime()) ? null : d;
    }
    // Fallback a JS Date
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Ejecuta la migración de garantías si no se ha hecho antes.
 * @param activos Array actual de activos (se muta en memoria)
 * @param onUpdate Callback para persistir el array actualizado
 */
export const ejecutarMigracionGarantia = (
    activos: Activo[],
    onUpdate: (activosActualizados: Activo[]) => void
): { migrados: number; omitidos: number } => {
    // Verificar si ya se ejecutó
    if (localStorage.getItem(MIGRATION_FLAG)) {
        return { migrados: 0, omitidos: activos.length };
    }

    let migrados = 0;
    let omitidos = 0;

    const activosActualizados = activos.map((activo): Activo => {
        // Solo migrar activos sin idActa (los que no vienen de un acta formal)
        if (activo.idActa !== undefined) {
            omitidos++;
            return activo;
        }

        // Intentar leer campos de garantía desde atributosEspecificos (si existen)
        const attrs = activo.atributosEspecificos as any;
        const inicioRaw = attrs?.fechaInicioGarantia ?? attrs?.['Feha de inicio de garantia'] ?? null;
        const finRaw    = attrs?.fechaFinGarantia    ?? attrs?.['Fecha Fin de garantia']     ?? null;

        if (esVacio(inicioRaw)) {
            // Sin garantía
            migrados++;
            return { ...activo, tieneGarantia: false, fechaInicioGarantia: null, fechaFinGarantia: null };
        }

        const fechaInicio = parseFechaFlexible(inicioRaw);
        const fechaFin    = parseFechaFlexible(finRaw);

        migrados++;
        return {
            ...activo,
            tieneGarantia: fechaInicio !== null,
            fechaInicioGarantia: fechaInicio,
            fechaFinGarantia: fechaFin
        };
    });

    // Persistir resultado y marcar migración como ejecutada
    onUpdate(activosActualizados);
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());

    console.info(`[Migración Garantía] Completada: ${migrados} migrados, ${omitidos} omitidos.`);
    return { migrados, omitidos };
};

/** Resetea el flag para re-ejecutar la migración (útil para testing) */
export const resetMigracionFlag = () => {
    localStorage.removeItem(MIGRATION_FLAG);
};
