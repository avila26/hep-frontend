import React, { createContext, useContext, useEffect, useState } from 'react';
import { Activo } from './ActivosContext';

// ─── Interfaces del modelo ────────────────────────────────────────────────────
/** Nivel 1 — Encabezado del acta, contenedor de todas las líneas */
export interface ActaIngreso {
    idActa: number;
    referencia: string;            // ACTA-2025-0001
    tipoIngreso: 'Orden de compra' | 'Memorando de ingreso' | 'Acta de Entrega-Recepción' | 'Contrato' | 'Migración inicial';
    numeroOrdenMemorandum: string;
    empresaProveedora: string;
    administradorOrdenCompra?: string; // solo si tipo = "Orden de compra"
    fechaOrdenCompra?: Date | null;    // solo si tipo = "Orden de compra"
    tieneGarantia: boolean;
    tiempoGarantia?: string | number | null;
    fechaInicioGarantia?: Date | null;
    fechaFinGarantia?: Date | null;
    fechaIngreso: Date;
    tecnicoReceptor: string;
    responsableEntrega?: string;
    observacionGeneral?: string;
    estado: 'Borrador' | 'Cerrada';
    activosGenerados?: number[];       // idActivo[] creados al cerrar
    numeroContrato?: string;
    cuentaContable?: string;
    itemPresupuestario?: string;
    partidaPresupuestaria?: string;
    valorAdquisicionTotal?: number | null;
    valorUnitario?: number | null;
    fechaDNS?: Date | null;
    bloqueado: boolean;
    
    // Campos condicionales adicionales
    fechaMemorando?: Date | null;
    remitenteOrigen?: string;
    asuntoMemorando?: string;
    fechaActa?: Date | null;
    funcionarioReceptor?: string;
    funcionarioEntregador?: string;
    fechaSuscripcion?: Date | null;
    fechaVigencia?: Date | null;
    administradorContrato?: string;
    institucionReceptora?: string;
    ubicacion?: string;
    tipoComprobante?: string;
    rucProveedor?: string;
    descuentoCompra?: number | null;
}

// Tipos del contexto

// Función helper para parsear fechas de string a Date
const parseDatesActa = (acta: any): ActaIngreso => {
    return {
        ...acta,
        fechaIngreso: acta.fechaIngreso ? new Date(acta.fechaIngreso) : new Date(),
        fechaOrdenCompra: acta.fechaOrdenCompra ? new Date(acta.fechaOrdenCompra) : null,
        tiempoGarantia: acta.tiempoGarantia ?? null,
        fechaDNS: acta.fechaDNS ? new Date(acta.fechaDNS) : null,
        fechaMemorando: acta.fechaMemorando ? new Date(acta.fechaMemorando) : null,
        fechaActa: acta.fechaActa ? new Date(acta.fechaActa) : null,
        fechaSuscripcion: acta.fechaSuscripcion ? new Date(acta.fechaSuscripcion) : null,
        fechaVigencia: acta.fechaVigencia ? new Date(acta.fechaVigencia) : null,
        lineas: (acta.lineas || []).map((linea: any) => ({
            ...linea,
            series: (linea.series || []).map((serie: any) => ({
                ...serie,
                fechaInicioCobertura: serie.fechaInicioCobertura ? new Date(serie.fechaInicioCobertura) : null,
                fechaFinCobertura: serie.fechaFinCobertura ? new Date(serie.fechaFinCobertura) : null,
            }))
        }))
    };
};

interface ActasContextType {
    actas: ActaIngreso[];
    crearActa: (datos: Omit<ActaIngreso, 'idActa' | 'referencia' | 'estado' | 'activosGenerados'>) => Promise<ActaIngreso>;
    actualizarActa: (acta: ActaIngreso) => Promise<void>;
    eliminarActa: (idActa: number) => Promise<void>;
    cerrarActa: (
        actaParaCerrar: ActaIngreso,
        seriesExistentesEnSistema: Set<string>,
        generarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Promise<Activo[]>
    ) => Promise<{ success: boolean; errores: string[]; activosCreados?: Activo[] }>;
}

const ActasContext = createContext<ActasContextType | undefined>(undefined);


export interface VigenciaGarantia {
    nivel: 'vigente' | 'por_vencer' | 'vencida' | 'sin_datos';
    texto: string;
}

export function calcularVigenciaGarantia(
    fechaInicio: Date | string | null | undefined,
    fechaFin: Date | string | null | undefined
): VigenciaGarantia {
    if (!fechaInicio || !fechaFin) {
        return { nivel: 'sin_datos', texto: 'Sin datos' };
    }

    const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
    const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return { nivel: 'sin_datos', texto: 'Sin datos' };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finNormalizado = new Date(fin);
    finNormalizado.setHours(0, 0, 0, 0);

    if (finNormalizado < hoy) {
        const diffTime = Math.abs(hoy.getTime() - finNormalizado.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let texto = 'Vencida';
        if (diffDays < 30) {
            texto = `Vencida hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
        } else {
            const meses = Math.floor(diffDays / 30);
            texto = `Vencida hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        }
        return { nivel: 'vencida', texto };
    }

    const diffTime = finNormalizado.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
        return { 
            nivel: 'por_vencer', 
            texto: `Por vencer (${diffDays} ${diffDays === 1 ? 'día' : 'días'} restantes)` 
        };
    }

    const mesesRestantes = Math.floor(diffDays / 30);
    return { 
        nivel: 'vigente', 
        texto: `Vigente (${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'} restantes)` 
    };
}

export const ActasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [actas, setActas] = useState<ActaIngreso[]>([]);

    // Cargar actas desde PostgreSQL vía API al montar
    const cargarActas = async () => {
        try {
            const res = await fetch('/api/actas');
            if (res.ok) {
                const data = await res.json();
                setActas(data.map(parseDatesActa));
            }
        } catch (e) {
            console.error('Error al cargar actas:', e);
        }
    };

    useEffect(() => {
        cargarActas();
    }, []);

    const crearActa = async (datos: Omit<ActaIngreso, 'idActa' | 'referencia' | 'estado' | 'activosGenerados'>): Promise<ActaIngreso> => {
        const res = await fetch('/api/actas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al crear acta');
        }
        const nuevaActa = parseDatesActa(await res.json());
        setActas(prev => [nuevaActa, ...prev]);
        return nuevaActa;
    };

    const actualizarActa = async (acta: ActaIngreso): Promise<void> => {
        const res = await fetch(`/api/actas/${acta.idActa}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(acta)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al actualizar acta');
        }
        const actualizada = parseDatesActa(await res.json());
        setActas(prev => prev.map(a => a.idActa === actualizada.idActa ? actualizada : a));
    };

    const eliminarActa = async (idActa: number): Promise<void> => {
        const res = await fetch(`/api/actas/${idActa}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al eliminar acta');
        }
        setActas(prev => prev.filter(a => a.idActa !== idActa));
    };

    const cerrarActa = async (
        actaParaCerrar: ActaIngreso,
        _seriesExistentesEnSistema: Set<string>,
        _generarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Promise<Activo[]>
    ): Promise<{ success: boolean; errores: string[]; activosCreados?: Activo[] }> => {
        let acta = { ...actaParaCerrar };
        
        // Si el acta no tiene idActa, la guardamos antes en la BD
        if (!acta.idActa) {
            try {
                acta = await crearActa(acta);
            } catch (e: any) {
                return { success: false, errores: [e.message] };
            }
        }

        try {
            // Llamar al API de cierre de actas (que ejecuta fn_cerrar_acta_ingreso en Postgres)
            const res = await fetch('/api/actas/cerrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idActa: acta.idActa,
                    usuario: acta.tecnicoReceptor || 'Usuario Sistema'
                })
            });

            const data = await res.json();

            if (!res.ok) {
                return { 
                    success: false, 
                    errores: [data.message || data.error || 'Error al procesar el cierre en la BD'] 
                };
            }

            // Recargar actas para reflejar el estado 'Cerrada' en el listado
            await cargarActas();

            // Retornar éxito. Generamos un arreglo vacío del tamaño de activos creados
            // para que la interfaz muestre el conteo de hojas de vida correctamente.
            const fakeActivos = Array(data.activosCreadosCount || 0).fill({});

            return { 
                success: true, 
                errores: [], 
                activosCreados: fakeActivos as any[] 
            };
        } catch (error: any) {
            console.error('Error al cerrar acta:', error);
            return { 
                success: false, 
                errores: ['Error de conexión al servidor: ' + error.message] 
            };
        }
    };

    return (
        <ActasContext.Provider value={{ actas, crearActa, actualizarActa, eliminarActa, cerrarActa }}>
            {children}
        </ActasContext.Provider>
    );
};

export const useActas = () => {
    const ctx = useContext(ActasContext);
    if (!ctx) throw new Error('useActas debe usarse dentro de ActasProvider');
    return ctx;
};
