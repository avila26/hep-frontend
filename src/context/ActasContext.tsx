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
    codigoInstitucional?: string;
    documentoRespaldo?: string;
    tieneCoberturaProveedor?: boolean;
    nombreProveedor?: string;
    fechaInicioCobertura?: Date | null;
    fechaFinCobertura?: Date | null;
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
    codigoSBYE?: string;
}

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
    fechaInicioGarantia?: Date | null;
    fechaFinGarantia?: Date | null;
    fechaIngreso: Date;
    tecnicoReceptor: string;
    responsableEntrega?: string;
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
        actaParaCerrar: ActaIngreso,
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
    fechaDNS: raw.fechaDNS ? new Date(raw.fechaDNS) : null,
    fechaMemorando: raw.fechaMemorando ? new Date(raw.fechaMemorando) : null,
    fechaActa: raw.fechaActa ? new Date(raw.fechaActa) : null,
    fechaSuscripcion: raw.fechaSuscripcion ? new Date(raw.fechaSuscripcion) : null,
    fechaVigencia: raw.fechaVigencia ? new Date(raw.fechaVigencia) : null,
    lineas: raw.lineas ? raw.lineas.map((linea: any) => ({
        ...linea,
        series: linea.series ? linea.series.map((serie: any) => ({
            ...serie,
            fechaInicioCobertura: serie.fechaInicioCobertura ? new Date(serie.fechaInicioCobertura) : null,
            fechaFinCobertura: serie.fechaFinCobertura ? new Date(serie.fechaFinCobertura) : null
        })) : []
    })) : []
});

// ─── Context ──────────────────────────────────────────────────────────────────

const ActasContext = createContext<ActasContextType | undefined>(undefined);

export const ActasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [actas, setActas] = useState<ActaIngreso[]>(() => {
        const stored = localStorage.getItem('actas_ingreso_hep');
        if (stored) {
            try {
                return JSON.parse(stored).map(parseDatesActa);
            } catch (e) {
                console.error('Error al cargar actas de ingreso:', e);
            }
        }
        return [];
    });

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
        actaParaCerrar: ActaIngreso,
        seriesExistentesEnSistema: Set<string>,
        generarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Activo[]
    ): { success: boolean; errores: string[]; activosCreados?: Activo[] } => {
        const acta = { ...actaParaCerrar };
        if (!acta.idActa) {
            acta.idActa = actas.length > 0 ? Math.max(...actas.map(a => a.idActa)) + 1 : 1;
            acta.referencia = generateReferenciaActa(actas);
            acta.estado = 'Borrador';
        }
        if (acta.estado === 'Cerrada') return { success: false, errores: ['El acta ya está cerrada'] };

        const errores: string[] = [];
        // ── Validaciones de encabezado ──
        const labelDoc =
            acta.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra' :
            acta.tipoIngreso === 'Memorando de ingreso' ? 'N.º de Memorando' :
            acta.tipoIngreso === 'Acta de Entrega-Recepción' ? 'N.º de Acta' :
            acta.tipoIngreso === 'Contrato' ? 'N.º de Contrato' : 'N.º de orden/memorando';

        if (!acta.numeroOrdenMemorandum?.trim()) {
            errores.push(`El ${labelDoc} es obligatorio`);
        }

        if (acta.tipoIngreso === 'Orden de compra') {
            if (!acta.empresaProveedora?.trim()) errores.push('La empresa proveedora es obligatoria');
        } else if (acta.tipoIngreso === 'Memorando de ingreso') {
            if (!acta.fechaMemorando) errores.push('La fecha del memorando es obligatoria');
            if (!acta.remitenteOrigen?.trim()) errores.push('El remitente / unidad u institución de origen es obligatorio');
        } else if (acta.tipoIngreso === 'Acta de Entrega-Recepción') {
            if (!acta.fechaActa) errores.push('La fecha del acta es obligatoria');
            if (!acta.funcionarioReceptor?.trim()) errores.push('El funcionario receptor es obligatorio');
            if (!acta.funcionarioEntregador?.trim()) errores.push('El funcionario entregador es obligatorio');
            if (!acta.empresaProveedora?.trim()) errores.push('La empresa proveedora / institución es obligatoria');
        } else if (acta.tipoIngreso === 'Contrato') {
            if (!acta.fechaSuscripcion) errores.push('La fecha de suscripción es obligatoria');
            if (!acta.administradorContrato?.trim()) errores.push('El administrador del contrato es obligatorio');
            if (!acta.empresaProveedora?.trim()) errores.push('La empresa proveedora es obligatoria');
        }

        if (!acta.tecnicoReceptor?.trim()) errores.push('El técnico receptor es obligatorio');
        if (!acta.responsableEntrega?.trim()) errores.push('El responsable de entrega es obligatorio');

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
                errores.push(`Línea ${n} (${linea.tipoActivo || 'Sin Nombre'}): sin series registradas`);
            } else if (linea.series.length !== linea.cantidadDeclarada) {
                errores.push(`Línea ${n} (${linea.tipoActivo || 'Sin Nombre'}): declara ${linea.cantidadDeclarada} unidad${linea.cantidadDeclarada !== 1 ? 'es' : ''} pero tiene ${linea.series.length} serie${linea.series.length !== 1 ? 's' : ''}`);
            }
            linea.series.forEach((s, sIdx) => {
                const serieDesc = s.numeroSerie?.trim() ? `"${s.numeroSerie}"` : `#${sIdx + 1}`;
                if (!s.numeroSerie?.trim()) {
                    errores.push(`Línea ${n} (${linea.tipoActivo || 'Sin Nombre'}), serie #${sIdx + 1}: falta el número de serie`);
                } else if (seriesExistentesEnSistema.has(s.numeroSerie)) {
                    errores.push(`Serie "${s.numeroSerie}" (Línea ${n}): ya existe en el sistema`);
                }
                if (!s.codigoSBYE?.trim()) {
                    errores.push(`Línea ${n} (${linea.tipoActivo || 'Sin Nombre'}), serie ${serieDesc}: falta definir el Código SBYE`);
                }
                if (!s.ubicacion?.trim()) {
                    errores.push(`Línea ${n} (${linea.tipoActivo || 'Sin Nombre'}), serie ${serieDesc}: la ubicación no está asignada`);
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
                        codigoInstitucional: serie.codigoInstitucional || cb,
                        nombre: linea.tipoActivo,
                        numeroSerie: serie.numeroSerie,
                        descripcion: linea.descripcion || linea.especificacionesTecnicas || '',
                        modelo: linea.modelo,
                        material: linea.material || '',
                        fechaAdquisicion: acta.fechaIngreso,
                        responsableEntrega: acta.responsableEntrega || acta.tecnicoReceptor,
                        dimension: linea.dimension || '',
                        numeroContrato: acta.numeroContrato || '',
                        valorAdquisicion: acta.valorAdquisicionTotal ?? null,
                        valorUnitario: acta.valorUnitario ?? null,
                        valorTotal: acta.valorUnitario ?? null,
                        codigoSBYE: serie.codigoSBYE || '',
                        fechaDNS: acta.fechaDNS ? new Date(acta.fechaDNS).toISOString() : '',
                        tiempoVidaUtil: linea.tiempoVidaUtil ?? null,
                        bloqueado: acta.bloqueado || false,
                        administradorDelProceso: 
                            acta.tipoIngreso === 'Orden de compra' ? (acta.administradorOrdenCompra || '') :
                            acta.tipoIngreso === 'Contrato' ? (acta.administradorContrato || '') : '',
                        itemPresupuestario: acta.itemPresupuestario || '',
                        partidaPresupuestaria: acta.partidaPresupuestaria || '',
                        numeroActa: acta.referencia,
                        marca: linea.marca,
                        color: linea.color || '',
                        estadoActivo: linea.estadoLlegada === 'Bueno' ? 'Bueno' : linea.estadoLlegada === 'Regular' ? 'Regular' : 'Malo', // Match exact strings in RegistrarActivo.tsx catalog or database mapping if BUE/REG/MAL
                        ubicacion: serie.ubicacion || '',
                        atributosEspecificos: linea.atributosEspecificos || null,
                        // Campos del acta
                        idActa: acta.idActa,
                        codigoBarras: cb,
                        tieneGarantia: acta.tieneGarantia,
                        fechaInicioGarantia: acta.fechaInicioGarantia ?? null,
                        fechaFinGarantia: acta.fechaFinGarantia ?? null,
                        // Campos de cobertura de proveedor
                        tieneCoberturaProveedor: serie.tieneCoberturaProveedor,
                        nombreProveedor: serie.nombreProveedor,
                        fechaInicioCobertura: serie.fechaInicioCobertura ?? null,
                        fechaFinCobertura: serie.fechaFinCobertura ?? null
                    });

                    return { ...serie, codigoBarras: cb };
                })
            }))
        };

        const activosCreados = generarActivos(activosACrear);
        actaActualizada.estado = 'Cerrada';
        actaActualizada.activosGenerados = activosCreados.map(a => a.idActivo);

        setActas(prev => {
            const existe = prev.some(a => a.idActa === actaActualizada.idActa);
            if (existe) {
                return prev.map(a => a.idActa === actaActualizada.idActa ? actaActualizada : a);
            } else {
                return [...prev, actaActualizada];
            }
        });
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
