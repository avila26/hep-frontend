import React, { createContext, useContext, useEffect, useState } from 'react';
import { Activo } from './ActivosContext';

// ─── Interfaces del modelo ────────────────────────────────────────────────────

/** Nivel 3 — Una unidad física individual dentro de una línea del acta */
export interface SerieActa {
    idSerie: number;
    numeroSerie: string;
    estadoIndividual: 'Bueno' | 'Regular' | 'Dañado';
    observacionIndividual?: string;
    codigoBarras?: string; // generado al cerrar el acta
    codigoSBYE?: string;
    ubicacion?: string;
    responsableEntrega?: string;
}

/** Nivel 2 — Un grupo de activos del mismo tipo dentro del acta */
export interface LineaActa {
    idLinea: number;
    moduloDestino: string; // Computadoras / Impresoras / Teléfonos / CCTV / Access Points / Laboratorio
    tipoActivo: string;
    marca: string;
    modelo: string;
    cantidadDeclarada: number;
    especificacionesTecnicas?: string;
    estadoLlegada: 'Bueno' | 'Regular' | 'Dañado';
    observacionLinea?: string;
    series: SerieActa[];
    color?: string;
    material?: string;
    dimension?: string;
    descripcion?: string;
    origenIngreso: 'Compra' | 'Donación' | 'Transferencia' | 'Otro';
    motivoIngreso: 'Adquisición Nueva' | 'Reposición' | 'Ampliación' | 'Otro';
    unidadMedida: 'Unidad' | 'Par' | 'Juego' | 'Otro';
    condicionDepreciacion: 'Lineal' | 'Acelerada' | 'No aplica';
    tiempoVidaUtil?: number | null;
    atributosEspecificos?: any;
}

/** Nivel 1 — Encabezado del acta, contenedor de todas las líneas */
export interface ActaIngreso {
    idActa: number;
    referencia: string;            // ACTA-2025-0001
    tipoIngreso: 'Orden de compra' | 'Memorando de ingreso' | 'Migración inicial';
    numeroOrdenMemorandum: string;
    empresaProveedora: string;
    administradorOrdenCompra?: string; // solo si tipo = "Orden de compra"
    fechaOrdenCompra?: Date | null;    // solo si tipo = "Orden de compra"
    tieneGarantia: boolean;
    fechaInicioGarantia?: Date | null;
    fechaFinGarantia?: Date | null;
    fechaIngreso: Date;
    tecnicoReceptor: string;
    observacionGeneral?: string;
    estado: 'Borrador' | 'Cerrada';
    lineas: LineaActa[];
    activosGenerados?: number[];       // idActivo[] creados al cerrar
    numeroContrato?: string;
    itemPresupuestario?: string;
    partidaPresupuestaria?: string;
    valorAdquisicionTotal?: number | null;
    valorUnitario?: number | null;
    fechaDNS?: Date | null;
    bloqueado: boolean;
}

// ─── Tipos del contexto ────────────────────────────────────────────────────────

export interface ErrorValidacion {
    campo?: string;
    mensaje: string;
}

interface ActasContextType {
    actas: ActaIngreso[];
    crearActa: (datos: Omit<ActaIngreso, 'idActa' | 'referencia' | 'estado' | 'activosGenerados'>) => ActaIngreso;
    actualizarActa: (acta: ActaIngreso) => void;
    eliminarActa: (idActa: number) => void;
    cerrarActa: (
        idActa: number,
        seriesExistentesEnSistema: Set<string>,
        generarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Activo[]
    ) => { success: boolean; errores: string[]; activosCreados?: Activo[] };
}

// ─── Utilidades internas ──────────────────────────────────────────────────────

const MODULO_PREFIX: Record<string, string> = {
    'Computadoras': 'COMP',
    'Impresoras': 'IMP',
    'Teléfonos': 'TEL',
    'CCTV': 'CAM',
    'Access Points': 'AP',
    'Laboratorio': 'LAB'
};

const generateReferenciaActa = (existentes: ActaIngreso[]): string => {
    const year = new Date().getFullYear();
    const nums = existentes
        .map(a => a.referencia)
        .filter(r => r.startsWith(`ACTA-${year}-`))
        .map(r => { const m = r.match(/ACTA-\d{4}-(\d+)/); return m ? Number(m[1]) : 0; });
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `ACTA-${year}-${String(next).padStart(4, '0')}`;
};

const generateCodigoBarras = (modulo: string, codigosYaUsados: string[]): string => {
    const prefix = MODULO_PREFIX[modulo] || 'GEN';
    const year = new Date().getFullYear();
    const existentes = codigosYaUsados
        .filter(c => c && c.startsWith(`${prefix}-${year}-`))
        .map(c => { const m = c.match(/-(\d+)$/); return m ? Number(m[1]) : 0; });
    const next = existentes.length > 0 ? Math.max(...existentes) + 1 : 1;
    return `${prefix}-${year}-${String(next).padStart(5, '0')}`;
};

/** Calcula la vigencia en texto legible */
export const calcularVigenciaGarantia = (
    inicio: Date | null | undefined,
    fin: Date | null | undefined
): { texto: string; nivel: 'vigente' | 'por_vencer' | 'vencida' | 'sin_datos' } => {
    if (!inicio || !fin) return { texto: '—', nivel: 'sin_datos' };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finDate = new Date(fin);
    finDate.setHours(0, 0, 0, 0);
    if (finDate < hoy) return { texto: 'GARANTÍA VENCIDA', nivel: 'vencida' };
    const dias = Math.floor((finDate.getTime() - hoy.getTime()) / 86400000);
    if (dias <= 30) return { texto: `Vence en ${dias} día${dias !== 1 ? 's' : ''}`, nivel: 'por_vencer' };
    const meses = Math.floor(dias / 30);
    const años = Math.floor(meses / 12);
    const mesesResto = meses % 12;
    if (años > 0) {
        const sufijo = mesesResto > 0 ? ` y ${mesesResto} mes${mesesResto > 1 ? 'es' : ''}` : '';
        return { texto: `Vence en ${años} año${años > 1 ? 's' : ''}${sufijo}`, nivel: 'vigente' };
    }
    return { texto: `Vence en ${meses} mes${meses > 1 ? 'es' : ''}`, nivel: 'vigente' };
};

/** Reconstruye objetos Date desde JSON */
const parseDatesActa = (raw: any): ActaIngreso => ({
    ...raw,
    fechaIngreso: raw.fechaIngreso ? new Date(raw.fechaIngreso) : new Date(),
    fechaOrdenCompra: raw.fechaOrdenCompra ? new Date(raw.fechaOrdenCompra) : null,
    fechaInicioGarantia: raw.fechaInicioGarantia ? new Date(raw.fechaInicioGarantia) : null,
    fechaFinGarantia: raw.fechaFinGarantia ? new Date(raw.fechaFinGarantia) : null,
    fechaDNS: raw.fechaDNS ? new Date(raw.fechaDNS) : null
});

// ─── Context ──────────────────────────────────────────────────────────────────

const ActasContext = createContext<ActasContextType | undefined>(undefined);

export const ActasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [actas, setActas] = useState<ActaIngreso[]>([]);

    // Carga inicial desde localStorage
    useEffect(() => {
        const stored = localStorage.getItem('actas_ingreso_hep');
        if (stored) {
            try {
                const parsed: ActaIngreso[] = JSON.parse(stored).map(parseDatesActa);
                setActas(parsed);
            } catch (e) {
                console.error('Error al cargar actas de ingreso:', e);
            }
        }
    }, []);

    // Persistencia automática
    useEffect(() => {
        localStorage.setItem('actas_ingreso_hep', JSON.stringify(actas));
    }, [actas]);

    const crearActa = (datos: Omit<ActaIngreso, 'idActa' | 'referencia' | 'estado' | 'activosGenerados'>): ActaIngreso => {
        const nuevaActa: ActaIngreso = {
            ...datos,
            idActa: actas.length > 0 ? Math.max(...actas.map(a => a.idActa)) + 1 : 1,
            referencia: generateReferenciaActa(actas),
            estado: 'Borrador'
        };
        setActas(prev => [...prev, nuevaActa]);
        return nuevaActa;
    };

    const actualizarActa = (acta: ActaIngreso) => {
        setActas(prev => prev.map(a => a.idActa === acta.idActa ? acta : a));
    };

    const eliminarActa = (idActa: number) => {
        setActas(prev => prev.filter(a => a.idActa !== idActa));
    };

    const cerrarActa = (
        idActa: number,
        seriesExistentesEnSistema: Set<string>,
        generarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Activo[]
    ): { success: boolean; errores: string[]; activosCreados?: Activo[] } => {
        const acta = actas.find(a => a.idActa === idActa);
        if (!acta) return { success: false, errores: ['Acta no encontrada'] };
        if (acta.estado === 'Cerrada') return { success: false, errores: ['El acta ya está cerrada'] };

        const errores: string[] = [];

        // ── Validaciones de encabezado ──
        if (!acta.numeroOrdenMemorandum.trim()) errores.push('El N.º de orden/memorando es obligatorio');
        if (!acta.empresaProveedora.trim()) errores.push('La empresa proveedora es obligatoria');
        if (!acta.tecnicoReceptor.trim()) errores.push('El técnico receptor es obligatorio');
        if (acta.tieneGarantia) {
            if (!acta.fechaInicioGarantia) errores.push('Falta la fecha de inicio de garantía');
            if (!acta.fechaFinGarantia) errores.push('Falta la fecha fin de garantía');
            if (acta.fechaInicioGarantia && acta.fechaFinGarantia
                && acta.fechaFinGarantia <= acta.fechaInicioGarantia) {
                errores.push('La fecha fin de garantía debe ser posterior a la de inicio');
            }
        }
        if (acta.tipoIngreso === 'Orden de compra' && acta.fechaOrdenCompra
            && acta.fechaInicioGarantia && acta.fechaOrdenCompra > acta.fechaInicioGarantia) {
            errores.push('La fecha de orden de compra no puede ser posterior al inicio de garantía');
        }

        // ── Validaciones de líneas y series ──
        if (acta.lineas.length === 0) errores.push('El acta debe tener al menos una línea');

        acta.lineas.forEach((linea, idx) => {
            const n = idx + 1;
            if (linea.series.length === 0) {
                errores.push(`Línea ${n} (${linea.tipoActivo}): sin series registradas`);
            } else if (linea.series.length !== linea.cantidadDeclarada) {
                errores.push(`Línea ${n} (${linea.tipoActivo}): declara ${linea.cantidadDeclarada} unidad${linea.cantidadDeclarada !== 1 ? 'es' : ''} pero tiene ${linea.series.length} serie${linea.series.length !== 1 ? 's' : ''}`);
            }
            linea.series.forEach(s => {
                if (seriesExistentesEnSistema.has(s.numeroSerie)) {
                    errores.push(`Serie "${s.numeroSerie}" (Línea ${n}): ya existe en el sistema`);
                }
            });
        });

        if (errores.length > 0) return { success: false, errores };

        // ── Generación de códigos de barras y activos ──
        const codigosUsados: string[] = actas
            .flatMap(a => a.lineas.flatMap(l => l.series.map(s => s.codigoBarras || '')))
            .filter(Boolean);

        const activosACrear: Omit<Activo, 'idActivo'>[] = [];
        const actaActualizada: ActaIngreso = {
            ...acta,
            lineas: acta.lineas.map(linea => ({
                ...linea,
                series: linea.series.map(serie => {
                    const cb = generateCodigoBarras(linea.moduloDestino, codigosUsados);
                    codigosUsados.push(cb);

                    activosACrear.push({
                        codigoInstitucional: cb,
                        nombre: linea.tipoActivo,
                        numeroSerie: serie.numeroSerie,
                        descripcion: linea.descripcion || linea.especificacionesTecnicas || '',
                        modelo: linea.modelo,
                        material: linea.material || '',
                        fechaAdquisicion: acta.fechaIngreso,
                        responsableEntrega: serie.responsableEntrega || acta.tecnicoReceptor,
                        dimension: linea.dimension || '',
                        numeroContrato: acta.numeroContrato || '',
                        valorAdquisicion: acta.valorAdquisicionTotal ?? null,
                        valorUnitario: acta.valorUnitario ?? null,
                        valorTotal: acta.valorUnitario ?? null,
                        codigoSBYE: serie.codigoSBYE || '',
                        fechaDNS: acta.fechaDNS ? new Date(acta.fechaDNS).toISOString() : '',
                        tiempoVidaUtil: linea.tiempoVidaUtil ?? null,
                        bloqueado: acta.bloqueado || false,
                        administradorDelProceso: acta.administradorOrdenCompra || '',
                        itemPresupuestario: acta.itemPresupuestario || '',
                        partidaPresupuestaria: acta.partidaPresupuestaria || '',
                        numeroActa: acta.referencia,
                        marca: linea.marca,
                        color: linea.color || '',
                        categoriaActivo: linea.moduloDestino,
                        origenIngreso: linea.origenIngreso,
                        motivoIngreso: linea.motivoIngreso,
                        unidadMedida: linea.unidadMedida,
                        estadoActivo: linea.estadoLlegada === 'Bueno' ? 'Bueno' : linea.estadoLlegada === 'Regular' ? 'Regular' : 'Malo', // Match exact strings in RegistrarActivo.tsx catalog or database mapping if BUE/REG/MAL
                        condicionDepreciacion: linea.condicionDepreciacion,
                        ubicacion: serie.ubicacion || '',
                        atributosEspecificos: linea.atributosEspecificos || null,
                        // Campos del acta
                        idActa: acta.idActa,
                        codigoBarras: cb,
                        tieneGarantia: acta.tieneGarantia,
                        fechaInicioGarantia: acta.fechaInicioGarantia ?? null,
                        fechaFinGarantia: acta.fechaFinGarantia ?? null
                    });

                    return { ...serie, codigoBarras: cb };
                })
            }))
        };

        const activosCreados = generarActivos(activosACrear);
        actaActualizada.estado = 'Cerrada';
        actaActualizada.activosGenerados = activosCreados.map(a => a.idActivo);

        setActas(prev => prev.map(a => a.idActa === idActa ? actaActualizada : a));
        return { success: true, errores: [], activosCreados };
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
