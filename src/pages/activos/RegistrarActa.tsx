import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import CreatableSelect from 'react-select/creatable';
import type { SingleValue } from 'react-select';
import * as XLSX from 'xlsx';
import { useActas, ActaIngreso, LineaActa, SerieActa, calcularVigenciaGarantia } from '../../context/ActasContext';
import { useActivos } from '../../context/ActivosContext';
import { UbicacionCascada } from '../../components/UbicacionCascada';
import { ejecutarMigracionGarantia } from '../../utils/migracionGarantia';
import {
    AtributosEspecificosForm,
    GROUPED_NOMBRE_OPTIONS,
    CATEGORIA_BY_NOMBRE,
    customNombreSelectStyles,
    isExistingNombreOption,
    getEspecificoKeyHelper,
    initialBiomedicoState,
    initialCPUState,
    initialMonitorState,
    initialTecladoState,
    initialMouseState,
    initialImpresoraRedState,
    initialTelefonoIpState,
    initialCCTVState,
    initialAccessPointState,
    initialLaboratorioState,
    initialRayosImagenState,
    NombreOption,
    NombreGroup
} from './AtributosEspecificosForm';

/* ─── Constantes ──────────────────────────────────────────────────────────── */

const MODULO_DESTINO_OPCIONES = [
    { label: 'Equipo médico (EQM)', value: 'EQM' },
    { label: 'Equipo de laboratorio (EQL)', value: 'EQL' },
    { label: 'Equipo de rayos e imagen (EQR)', value: 'EQR' },
    { label: 'Equipo informático (EQI)', value: 'EQI' },
    { label: 'Equipo de oficina (EQO)', value: 'EQO' },
    { label: 'Equipo eléctrico e industrial (EQE)', value: 'EQE' },
    { label: 'Equipo de climatización (EQC)', value: 'EQC' },
    { label: 'Mobiliario administrativo (MOB)', value: 'MOB' },
    { label: 'Mobiliario hospitalario (MOH)', value: 'MOH' },
    { label: 'Instrumental médico (INS)', value: 'INS' },
    { label: 'Vehículos (VEH)', value: 'VEH' },
    { label: 'Herramientas y accesorios (HER)', value: 'HER' },
    { label: 'Libros y colecciones (LIB)', value: 'LIB' },
    { label: 'Otros bienes (OTR)', value: 'OTR' }
];
const ESTADOS_OPCIONES = [
    { label: 'Bueno', value: 'Bueno' },
    { label: 'Regular', value: 'Regular' },
    { label: 'Dañado', value: 'Dañado' }
];
const TIPO_INGRESO_OPCIONES = [
    { label: 'Orden de compra', value: 'Orden de compra' },
    { label: 'Memorando de ingreso', value: 'Memorando de ingreso' },
    { label: 'Acta de Entrega-Recepción', value: 'Acta de Entrega-Recepción' },
    { label: 'Contrato', value: 'Contrato' }
];
const MODO_INGRESO_OPCIONES = [
    { label: '⌨ Manual / Pegar', value: 'manual' },
    { label: '📷 Escaneo', value: 'scan' },
    { label: '📄 Importar Excel', value: 'excel' }
];

const ORIGEN_INGRESO_OPCIONES = [
    { label: 'Compra', value: 'Compra' },
    { label: 'Donación', value: 'Donación' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Otro', value: 'Otro' }
];

const MOTIVO_INGRESO_OPCIONES = [
    { label: 'Adquisición Nueva', value: 'Adquisición Nueva' },
    { label: 'Reposición', value: 'Reposición' },
    { label: 'Ampliación', value: 'Ampliación' },
    { label: 'Otro', value: 'Otro' }
];

const UNIDAD_MEDIDA_OPCIONES = [
    { label: 'Unidad', value: 'Unidad' },
    { label: 'Par', value: 'Par' },
    { label: 'Juego', value: 'Juego' },
    { label: 'Otro', value: 'Otro' }
];

const CONDICION_DEPRECIACION_OPCIONES = [
    { label: 'Lineal', value: 'Lineal' },
    { label: 'Acelerada', value: 'Acelerada' },
    { label: 'No aplica', value: 'No aplica' }
];

type EstadoLlegada = 'Bueno' | 'Regular' | 'Dañado';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const estadoBadge = (estado: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger'> = {
        Bueno: 'success', Regular: 'warning', Dañado: 'danger'
    };
    return <Tag value={estado} severity={map[estado] ?? 'info'} />;
};

const VigenciaBadge: React.FC<{ inicio?: Date | null; fin?: Date | null }> = ({ inicio, fin }) => {
    const v = calcularVigenciaGarantia(inicio, fin);
    if (v.nivel === 'sin_datos') return null;
    const colors: Record<string, string> = {
        vigente: '#16a34a',
        por_vencer: '#d97706',
        vencida: '#dc2626'
    };
    const bg: Record<string, string> = {
        vigente: '#f0fdf4',
        por_vencer: '#fffbeb',
        vencida: '#fef2f2'
    };
    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 999,
            background: bg[v.nivel] ?? '#f8fafc',
            color: colors[v.nivel] ?? '#334155',
            fontWeight: 700, fontSize: 12
        }}>
            {v.texto}
        </span>
    );
};

/* ─── Estado inicial ──────────────────────────────────────────────────────── */

const initialHeader = (): Omit<ActaIngreso, 'idActa' | 'referencia' | 'estado' | 'activosGenerados' | 'lineas'> => ({
    tipoIngreso: 'Orden de compra',
    numeroOrdenMemorandum: '',
    empresaProveedora: '',
    administradorOrdenCompra: '',
    fechaOrdenCompra: null,
    tieneGarantia: false,
    fechaInicioGarantia: null,
    fechaFinGarantia: null,
    fechaIngreso: new Date(),
    tecnicoReceptor: '',
    observacionGeneral: '',
    numeroContrato: '',
    itemPresupuestario: '',
    partidaPresupuestaria: '',
    valorAdquisicionTotal: null,
    valorUnitario: null,
    fechaDNS: null,
    bloqueado: false,
    fechaMemorando: null,
    remitenteOrigen: '',
    asuntoMemorando: '',
    fechaActa: null,
    funcionarioReceptor: '',
    funcionarioEntregador: '',
    fechaSuscripcion: null,
    fechaVigencia: null,
    administradorContrato: '',
    responsableEntrega: ''
});

const newLinea = (idLinea: number): LineaActa => ({
    idLinea,
    moduloDestino: '',
    tipoActivo: '',
    marca: '',
    modelo: '',
    cantidadDeclarada: 1,
    especificacionesTecnicas: '',
    estadoLlegada: 'Bueno',
    observacionLinea: '',
    series: [],
    color: '',
    material: '',
    dimension: '',
    descripcion: '',
    origenIngreso: 'Compra',
    motivoIngreso: 'Adquisición Nueva',
    unidadMedida: 'Unidad',
    condicionDepreciacion: 'Lineal',
    tiempoVidaUtil: null,
    codigoSBYE: ''
});

/* ─── Componente RegistrarActa ────────────────────────────────────────────── */

const RegistrarActa: React.FC = () => {
    const { idActa: idParam } = useParams<{ idActa: string }>();
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);
    const { actas, crearActa, actualizarActa, cerrarActa } = useActas();
    const { activos, agregarActivos, actualizarActivo } = useActivos();

    // Modo edición vs creación
    const actaExistente = idParam ? actas.find(a => a.idActa === Number(idParam)) : undefined;
    const modoVista = actaExistente?.estado === 'Cerrada';

    /* ── Estado principal ── */
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [header, setHeader] = useState<Omit<ActaIngreso, 'idActa' | 'referencia' | 'estado' | 'activosGenerados' | 'lineas'>>(
        actaExistente ? {
            tipoIngreso: actaExistente.tipoIngreso,
            numeroOrdenMemorandum: actaExistente.numeroOrdenMemorandum,
            empresaProveedora: actaExistente.empresaProveedora,
            administradorOrdenCompra: actaExistente.administradorOrdenCompra,
            fechaOrdenCompra: actaExistente.fechaOrdenCompra ?? null,
            tieneGarantia: actaExistente.tieneGarantia,
            fechaInicioGarantia: actaExistente.fechaInicioGarantia ?? null,
            fechaFinGarantia: actaExistente.fechaFinGarantia ?? null,
            fechaIngreso: actaExistente.fechaIngreso,
            tecnicoReceptor: actaExistente.tecnicoReceptor,
            observacionGeneral: actaExistente.observacionGeneral,
            numeroContrato: actaExistente.numeroContrato || '',
            itemPresupuestario: actaExistente.itemPresupuestario || '',
            partidaPresupuestaria: actaExistente.partidaPresupuestaria || '',
            valorAdquisicionTotal: actaExistente.valorAdquisicionTotal ?? null,
            valorUnitario: actaExistente.valorUnitario ?? null,
            fechaDNS: actaExistente.fechaDNS ?? null,
            bloqueado: actaExistente.bloqueado ?? false,
            fechaMemorando: actaExistente.fechaMemorando ?? null,
            remitenteOrigen: actaExistente.remitenteOrigen || '',
            asuntoMemorando: actaExistente.asuntoMemorando || '',
            fechaActa: actaExistente.fechaActa ?? null,
            funcionarioReceptor: actaExistente.funcionarioReceptor || '',
            funcionarioEntregador: actaExistente.funcionarioEntregador || '',
            fechaSuscripcion: actaExistente.fechaSuscripcion ?? null,
            fechaVigencia: actaExistente.fechaVigencia ?? null,
            administradorContrato: actaExistente.administradorContrato || '',
            responsableEntrega: actaExistente.responsableEntrega || ''
        } : initialHeader()
    );
    const [lineas, setLineas] = useState<LineaActa[]>(
        actaExistente?.lineas?.map(l => ({
            ...newLinea(l.idLinea),
            ...l
        })) ?? []
    );
    const [lineaActiva, setLineaActiva] = useState<number>(0);
    const [modoIngreso, setModoIngreso] = useState<Record<number, 'manual' | 'scan' | 'excel'>>({});
    const [scanBuffer, setScanBuffer] = useState('');
    const [serieManual, setSerieManual] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [quickLocations, setQuickLocations] = useState<Record<number, string>>({});

    const aplicarUbicacionATodas = (lineaIdx: number) => {
        const path = quickLocations[lineaIdx];
        if (!path) return;
        setLineas(prev => prev.map((l, idx) => {
            if (idx !== lineaIdx) return l;
            return {
                ...l,
                series: l.series.map(s => ({
                    ...s,
                    ubicacion: path
                }))
            };
        }));
        toast.current?.show({ severity: 'success', summary: 'Ubicación aplicada', detail: 'Se aplicó la ubicación a todas las series de la línea', life: 3000 });
    };

    const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

    const clearError = (field: string) => {
        if (invalidFields.has(field)) {
            setInvalidFields(prev => {
                const next = new Set(prev);
                next.delete(field);
                return next;
            });
        }
    };

    const lineHasErrors = (lineaIdx: number): boolean => {
        return Array.from(invalidFields).some(f => f.startsWith(`linea_${lineaIdx}_`));
    };

    const stepHasErrors = (stepIdx: number): boolean => {
        if (stepIdx === 0) {
            const headerFields = [
                'numeroOrdenMemorandum', 'empresaProveedora', 'fechaMemorando', 
                'remitenteOrigen', 'fechaActa', 'funcionarioReceptor', 
                'funcionarioEntregador', 'fechaSuscripcion', 'administradorContrato', 
                'tecnicoReceptor', 'fechaInicioGarantia', 'fechaFinGarantia', 'fechaOrdenCompra',
                'responsableEntrega'
            ];
            return headerFields.some(f => invalidFields.has(f));
        }
        if (stepIdx === 1) {
            if (lineas.length === 0 && errors.some(e => e.includes('al menos una línea'))) return true;
            return false;
        }
        if (stepIdx === 2) {
            return Array.from(invalidFields).some(f => f.includes('_serie_'));
        }
        return false;
    };


    const validateActa = (): { valid: boolean; textErrors: string[]; invalidFields: Set<string> } => {
        const textErrors: string[] = [];
        const currentInvalid = new Set<string>();

        // 1. Validaciones del encabezado
        const labelDoc =
            header.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra' :
            header.tipoIngreso === 'Memorando de ingreso' ? 'N.º de Memorando' :
            header.tipoIngreso === 'Acta de Entrega-Recepción' ? 'N.º de Acta' :
            header.tipoIngreso === 'Contrato' ? 'N.º de Contrato' : 'N.º de Documento';

        if (!header.numeroOrdenMemorandum?.trim()) {
            textErrors.push(`El ${labelDoc} es obligatorio`);
            currentInvalid.add('numeroOrdenMemorandum');
        }

        if (header.tipoIngreso === 'Orden de compra') {
            if (!header.empresaProveedora?.trim()) {
                textErrors.push('La empresa proveedora es obligatoria');
                currentInvalid.add('empresaProveedora');
            }
        } else if (header.tipoIngreso === 'Memorando de ingreso') {
            if (!header.fechaMemorando) {
                textErrors.push('La fecha del memorando es obligatoria');
                currentInvalid.add('fechaMemorando');
            }
            if (!header.remitenteOrigen?.trim()) {
                textErrors.push('El remitente / unidad u institución de origen es obligatorio');
                currentInvalid.add('remitenteOrigen');
            }
        } else if (header.tipoIngreso === 'Acta de Entrega-Recepción') {
            if (!header.fechaActa) {
                textErrors.push('La fecha del acta es obligatoria');
                currentInvalid.add('fechaActa');
            }
            if (!header.funcionarioReceptor?.trim()) {
                textErrors.push('El funcionario receptor es obligatorio');
                currentInvalid.add('funcionarioReceptor');
            }
            if (!header.funcionarioEntregador?.trim()) {
                textErrors.push('El funcionario entregador es obligatorio');
                currentInvalid.add('funcionarioEntregador');
            }
            if (!header.empresaProveedora?.trim()) {
                textErrors.push('La empresa proveedora / institución es obligatoria');
                currentInvalid.add('empresaProveedora');
            }
        } else if (header.tipoIngreso === 'Contrato') {
            if (!header.fechaSuscripcion) {
                textErrors.push('La fecha de suscripción es obligatoria');
                currentInvalid.add('fechaSuscripcion');
            }
            if (!header.administradorContrato?.trim()) {
                textErrors.push('El administrador del contrato es obligatorio');
                currentInvalid.add('administradorContrato');
            }
            if (!header.empresaProveedora?.trim()) {
                textErrors.push('La empresa proveedora es obligatoria');
                currentInvalid.add('empresaProveedora');
            }
        }

        if (!header.tecnicoReceptor?.trim()) {
            textErrors.push('El técnico receptor es obligatorio');
            currentInvalid.add('tecnicoReceptor');
        }

        if (!header.responsableEntrega?.trim()) {
            textErrors.push('El responsable de entrega es obligatorio');
            currentInvalid.add('responsableEntrega');
        }

        if (header.tieneGarantia) {
            if (!header.fechaInicioGarantia) {
                textErrors.push('Falta la fecha de inicio de garantía');
                currentInvalid.add('fechaInicioGarantia');
            }
            if (!header.fechaFinGarantia) {
                textErrors.push('Falta la fecha fin de garantía');
                currentInvalid.add('fechaFinGarantia');
            }
            if (header.fechaInicioGarantia && header.fechaFinGarantia
                && header.fechaFinGarantia <= header.fechaInicioGarantia) {
                textErrors.push('La fecha fin de garantía debe ser posterior a la de inicio');
                currentInvalid.add('fechaFinGarantia');
            }
        }
        if (header.tipoIngreso === 'Orden de compra' && header.fechaOrdenCompra
            && header.fechaInicioGarantia && header.fechaOrdenCompra > header.fechaInicioGarantia) {
            textErrors.push('La fecha de orden de compra no puede ser posterior al inicio de garantía');
            currentInvalid.add('fechaOrdenCompra');
        }

        // 2. Validaciones de líneas y series
        if (lineas.length === 0) {
            textErrors.push('El acta debe tener al menos una línea');
        }

        lineas.forEach((linea, lineaIdx) => {
            if (linea.series.length === 0) {
                textErrors.push(`Línea ${lineaIdx + 1} (${linea.tipoActivo || 'Sin Nombre'}): sin series registradas`);
            } else if (linea.series.length !== linea.cantidadDeclarada) {
                textErrors.push(`Línea ${lineaIdx + 1} (${linea.tipoActivo || 'Sin Nombre'}): declara ${linea.cantidadDeclarada} unidad${linea.cantidadDeclarada !== 1 ? 'es' : ''} pero tiene ${linea.series.length} serie${linea.series.length !== 1 ? 's' : ''}`);
            }

            linea.series.forEach((s, sIdx) => {
                const serieDesc = s.numeroSerie?.trim() ? `"${s.numeroSerie}"` : `#${sIdx + 1}`;
                if (!s.numeroSerie?.trim()) {
                    textErrors.push(`Línea ${lineaIdx + 1} (${linea.tipoActivo || 'Sin Nombre'}), serie #${sIdx + 1}: falta el número de serie`);
                    currentInvalid.add(`linea_${lineaIdx}_serie_${sIdx}_numeroSerie`);
                } else if (seriesExistentesEnSistema.has(s.numeroSerie)) {
                    textErrors.push(`Serie "${s.numeroSerie}" (Línea ${lineaIdx + 1}): ya existe en el sistema`);
                    currentInvalid.add(`linea_${lineaIdx}_serie_${sIdx}_numeroSerie`);
                }

                if (!s.codigoSBYE?.trim()) {
                    textErrors.push(`Línea ${lineaIdx + 1} (${linea.tipoActivo || 'Sin Nombre'}), serie ${serieDesc}: falta el Código SBYE`);
                    currentInvalid.add(`linea_${lineaIdx}_serie_${sIdx}_codigoSBYE`);
                }

                if (!s.ubicacion?.trim()) {
                    textErrors.push(`Línea ${lineaIdx + 1} (${linea.tipoActivo || 'Sin Nombre'}), serie ${serieDesc}: la ubicación no está asignada`);
                    currentInvalid.add(`linea_${lineaIdx}_serie_${sIdx}_ubicacion`);
                }
            });
        });

        return {
            valid: textErrors.length === 0,
            textErrors,
            invalidFields: currentInvalid
        };
    };

    const [nombreOptions, setNombreOptions] = useState<NombreGroup[]>(GROUPED_NOMBRE_OPTIONS);

    const getInitialAttributesForKey = (key: string): any => {
        if (key === 'EQM') return initialBiomedicoState();
        if (key === 'EQL') return initialLaboratorioState();
        if (key === 'EQR') return initialRayosImagenState();
        if (key === 'CPU') return initialCPUState();
        if (key === 'MON') return initialMonitorState();
        if (key === 'TEC') return initialTecladoState();
        if (key === 'MOU') return initialMouseState();
        if (key === 'IMP') return initialImpresoraRedState();
        if (key === 'TEL') return initialTelefonoIpState();
        if (key === 'CCTV') return initialCCTVState();
        if (key === 'AP') return initialAccessPointState();
        return null;
    };

    const updateAtributosEspecificos = (lineaIdx: number, field: string, value: any) => {
        setLineas(prev => prev.map((l, i) => {
            if (i !== lineaIdx) return l;
            const currentAttrs = l.atributosEspecificos || {};
            return {
                ...l,
                atributosEspecificos: {
                    ...currentAttrs,
                    [field]: value
                }
            };
        }));
    };

    const updateAtributosEspecificosNested = (lineaIdx: number, parentKey: string, field: string, value: any) => {
        setLineas(prev => prev.map((l, i) => {
            if (i !== lineaIdx) return l;
            const currentAttrs = l.atributosEspecificos || {};
            const parentObj = currentAttrs[parentKey] || {};
            return {
                ...l,
                atributosEspecificos: {
                    ...currentAttrs,
                    [parentKey]: {
                        ...parentObj,
                        [field]: value
                    }
                }
            };
        }));
    };

    const updateAtributosEspecificosArray = (lineaIdx: number, arrayKey: string, value: any, isAdd: boolean, indexToDelete?: number) => {
        setLineas(prev => prev.map((l, i) => {
            if (i !== lineaIdx) return l;
            const currentAttrs = l.atributosEspecificos || {};
            const arr = currentAttrs[arrayKey] || [];
            let updatedArr;
            if (isAdd) {
                updatedArr = [...arr, value];
            } else if (indexToDelete !== undefined) {
                updatedArr = arr.filter((_: any, idx: number) => idx !== indexToDelete);
            } else {
                updatedArr = arr;
            }
            return {
                ...l,
                atributosEspecificos: {
                    ...currentAttrs,
                    [arrayKey]: updatedArr
                }
            };
        }));
    };

    const handleNombreChange = (idx: number, option: SingleValue<NombreOption>) => {
        if (!option) {
            setLineas(prev => prev.map((l, i) => i === idx ? { ...l, tipoActivo: '', moduloDestino: '', atributosEspecificos: null } : l));
            return;
        }

        const valueChosen = option.value;
        const mappedCategory = CATEGORIA_BY_NOMBRE[valueChosen];
        const newModuloValue = mappedCategory ? mappedCategory.code : 'OTR';

        // Initialize specific attributes
        const key = getEspecificoKeyHelper(newModuloValue, valueChosen);
        const initialAttrs = getInitialAttributesForKey(key);

        setLineas(prev => prev.map((l, i) => i === idx ? {
            ...l,
            tipoActivo: valueChosen,
            moduloDestino: newModuloValue,
            atributosEspecificos: initialAttrs
        } : l));
    };

    const handleCrearNombreOpcion = async (idx: number, inputValue: string) => {
        const newOption: NombreOption = { label: inputValue, value: inputValue };
        const mappedCategory = CATEGORIA_BY_NOMBRE[inputValue];
        const newModuloValue = mappedCategory ? mappedCategory.code : 'OTR';

        setNombreOptions(prev => {
            const existingOtros = prev.find(g => g.label === 'Otros bienes (OTR)');
            if (existingOtros) {
                return prev.map(g =>
                    g.label === 'Otros bienes (OTR)' ? { ...g, options: [...g.options, newOption] } : g
                );
            }
            return [...prev, { label: 'Otros bienes (OTR)', options: [newOption] }];
        });

        // Initialize specific attributes for the new option
        const key = getEspecificoKeyHelper(newModuloValue, inputValue);
        const initialAttrs = getInitialAttributesForKey(key);

        setLineas(prev => prev.map((l, i) => i === idx ? {
            ...l,
            tipoActivo: inputValue,
            moduloDestino: newModuloValue,
            atributosEspecificos: initialAttrs
        } : l));

        try {
            await fetch('/api/tipos-activo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: inputValue })
            });
        } catch (error) {
            console.error('Error guardando tipo de activo', error);
        }
    };

    /* ── Migración de garantías ── */
    useEffect(() => {
        ejecutarMigracionGarantia(activos, (actualizados) => {
            actualizados.forEach(a => actualizarActivo(a));
        });
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const prevAdquisicionRef = useRef<number | null | undefined>(header.valorAdquisicionTotal);
    const prevTotalUnidadesRef = useRef<number>(
        (actaExistente?.lineas ?? []).reduce((acc, curr) => acc + (curr.cantidadDeclarada || 0), 0)
    );

    // Recálculo automático de valorUnitario sugerido
    useEffect(() => {
        if (modoVista) return;
        const totalUnidades = lineas.reduce((acc, curr) => acc + (curr.cantidadDeclarada || 0), 0);
        if (
            header.valorAdquisicionTotal !== prevAdquisicionRef.current ||
            totalUnidades !== prevTotalUnidadesRef.current
        ) {
            prevAdquisicionRef.current = header.valorAdquisicionTotal;
            prevTotalUnidadesRef.current = totalUnidades;

            if (totalUnidades > 0 && typeof header.valorAdquisicionTotal === 'number' && header.valorAdquisicionTotal >= 0) {
                const calculated = header.valorAdquisicionTotal / totalUnidades;
                const rounded = Math.round(calculated * 100) / 100;
                hdr('valorUnitario', rounded);
            } else {
                hdr('valorUnitario', null);
            }
        }
    }, [header.valorAdquisicionTotal, lineas, modoVista]);

    /* ── Helpers de header ── */
    const hdr = <K extends keyof typeof header>(field: K, value: (typeof header)[K]) =>
        setHeader(prev => ({ ...prev, [field]: value }));

    /* ── Helpers de líneas ── */
    const addLinea = () => {
        const id = lineas.length > 0 ? Math.max(...lineas.map(l => l.idLinea)) + 1 : 1;
        setLineas(prev => [...prev, newLinea(id)]);
        setLineaActiva(lineas.length);
    };

    const removeLinea = (idx: number) => {
        setLineas(prev => prev.filter((_, i) => i !== idx));
        setLineaActiva(Math.max(0, lineaActiva - (idx <= lineaActiva ? 1 : 0)));
    };

    const updateLinea = <K extends keyof LineaActa>(idx: number, field: K, value: LineaActa[K]) =>
        setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));

    /* ── Helpers de series ── */
    const seriesExistentesEnSistema = useMemo(
        () => new Set(activos.map(a => a.numeroSerie).filter(Boolean)),
        [activos]
    );

    const seriesEnActa = useMemo(() => {
        const set = new Set<string>();
        lineas.forEach(l => l.series.forEach(s => set.add(s.numeroSerie)));
        return set;
    }, [lineas]);

    const generateCIForSerie = (currentLineas: LineaActa[]): string => {
        const prefix = 'CI';
        const year = new Date().getFullYear();
        
        // 1. Obtener números de códigos del sistema
        const systemNumbers = activos
            .map(a => a.codigoInstitucional)
            .filter(code => typeof code === 'string' && code.startsWith(`${prefix}-${year}-`))
            .map(code => { const match = code.match(/CI-\d{4}-(\d+)/); return match ? Number(match[1]) : null; })
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));
            
        // 2. Obtener números de códigos asignados a series en esta acta actual
        const currentActaNumbers: number[] = [];
        currentLineas.forEach(l => {
            l.series.forEach(s => {
                if (s.codigoInstitucional && s.codigoInstitucional.startsWith(`${prefix}-${year}-`)) {
                    const match = s.codigoInstitucional.match(/CI-\d{4}-(\d+)/);
                    if (match) {
                        currentActaNumbers.push(Number(match[1]));
                    }
                }
            });
        });
        
        const allNumbers = [...systemNumbers, ...currentActaNumbers];
        const nextNumber = allNumbers.length > 0 ? Math.max(...allNumbers) + 1 : 1;
        return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
    };

    const addSerie = useCallback((lineaIdx: number, serie: string, estado: EstadoLlegada = 'Bueno') => {
        const trimmed = serie.trim();
        if (!trimmed) return;
        if (seriesExistentesEnSistema.has(trimmed)) {
            toast.current?.show({ severity: 'error', summary: 'Serie duplicada', detail: `"${trimmed}" ya existe en el sistema`, life: 4000 });
            return;
        }
        if (seriesEnActa.has(trimmed)) {
            toast.current?.show({ severity: 'warn', summary: 'Serie repetida', detail: `"${trimmed}" ya está en este acta`, life: 3000 });
            return;
        }
        setLineas(prev => {
            const nextCI = generateCIForSerie(prev);
            const docRespaldo = header.numeroOrdenMemorandum || '';
            return prev.map((l, i) => {
                if (i !== lineaIdx) return l;
                const idSerie = l.series.length > 0 ? Math.max(...l.series.map(s => s.idSerie)) + 1 : 1;
                return {
                    ...l,
                    series: [
                        ...l.series,
                        {
                            idSerie,
                            numeroSerie: trimmed,
                            estadoIndividual: estado,
                            codigoInstitucional: nextCI,
                            documentoRespaldo: docRespaldo,
                            ubicacion: '',
                            codigoSBYE: ''
                        }
                    ]
                };
            });
        });
    }, [seriesExistentesEnSistema, seriesEnActa, header.numeroOrdenMemorandum, activos]);

    const removeSerie = (lineaIdx: number, idSerie: number) =>
        setLineas(prev => prev.map((l, i) => i !== lineaIdx ? l : { ...l, series: l.series.filter(s => s.idSerie !== idSerie) }));

    const updateSerie = <K extends keyof SerieActa>(lineaIdx: number, idSerie: number, field: K, value: SerieActa[K]) =>
        setLineas(prev => prev.map((l, i) => i !== lineaIdx ? l : {
            ...l,
            series: l.series.map(s => s.idSerie !== idSerie ? s : { ...s, [field]: value })
        }));

    /* ── Importar Excel ── */
    const importarExcel = (lineaIdx: number, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wb = XLSX.read(e.target?.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
            let importadas = 0;
            rows.forEach(row => {
                const val = String(row[0] ?? '').trim();
                if (val) { addSerie(lineaIdx, val); importadas++; }
            });
            toast.current?.show({ severity: 'success', summary: 'Excel importado', detail: `${importadas} series procesadas`, life: 3000 });
        };
        reader.readAsBinaryString(file);
    };

    const syncSeriesDocumentoRespaldo = (currentLineas: LineaActa[]): LineaActa[] => {
        const docRespaldo = header.numeroOrdenMemorandum || '';
        return currentLineas.map(l => ({
            ...l,
            series: l.series.map(s => ({
                ...s,
                documentoRespaldo: docRespaldo
            }))
        }));
    };

    /* ── Guardar borrador ── */
    const guardarBorrador = () => {
        const lineasSincronizadas = syncSeriesDocumentoRespaldo(lineas);
        const payload = { ...header, lineas: lineasSincronizadas };
        if (actaExistente) {
            actualizarActa({ ...actaExistente, ...payload });
            toast.current?.show({ severity: 'success', summary: 'Borrador guardado', detail: actaExistente.referencia, life: 3000 });
        } else {
            const nueva = crearActa(payload);
            toast.current?.show({ severity: 'success', summary: 'Acta creada', detail: nueva.referencia, life: 3000 });
            navigate(`/activos/actas/${nueva.idActa}`);
        }
    };

    /* ── Cerrar acta ── */
    const handleCerrarActa = () => {
        const lineasSincronizadas = syncSeriesDocumentoRespaldo(lineas);
        const { valid, textErrors, invalidFields: nextInvalid } = validateActa();
        if (!valid) {
            setErrors(textErrors);
            setInvalidFields(nextInvalid);
            toast.current?.show({ severity: 'error', summary: 'Errores de validación', detail: 'Por favor corrija los campos marcados en rojo', life: 5000 });
            return;
        }

        const actaId = actaExistente?.idActa;
        if (!actaId) {
            // Si no se ha guardado aún, guardar primero
            const nueva = crearActa({ ...header, lineas: lineasSincronizadas });
            const result = cerrarActa(nueva, seriesExistentesEnSistema, agregarActivos);
            if (!result.success) {
                setErrors(result.errores);
                return;
            }
            setErrors([]);
            setInvalidFields(new Set());
            toast.current?.show({ severity: 'success', summary: '¡Acta cerrada!', detail: `${result.activosCreados?.length ?? 0} hojas de vida generadas`, life: 5000 });
            setTimeout(() => navigate('/activos/actas'), 2000);
        } else {
            // Guardar cambios del borrador primero
            const payload = { ...actaExistente!, ...header, lineas: lineasSincronizadas };
            actualizarActa(payload);
            const result = cerrarActa(payload, seriesExistentesEnSistema, agregarActivos);
            if (!result.success) {
                setErrors(result.errores);
                return;
            }
            setErrors([]);
            setInvalidFields(new Set());
            toast.current?.show({ severity: 'success', summary: '¡Acta cerrada!', detail: `${result.activosCreados?.length ?? 0} hojas de vida generadas`, life: 5000 });
            setTimeout(() => navigate('/activos/actas'), 2000);
        }
    };

    /* ── Renders de sección ── */

    const renderEncabezado = () => (
        <div className="space-y-6">
            {/* Bloque: Adquisición */}
            <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <i className="pi pi-file-edit text-blue-500" /> Adquisición
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Tipo de Ingreso *</label>
                        <Dropdown
                            value={header.tipoIngreso}
                            options={TIPO_INGRESO_OPCIONES}
                            onChange={e => hdr('tipoIngreso', e.value)}
                            className="w-full text-sm bg-white dark:bg-slate-950"
                            disabled={modoVista}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            {header.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra *' :
                             header.tipoIngreso === 'Memorando de ingreso' ? 'N.º de Memorando *' :
                             header.tipoIngreso === 'Acta de Entrega-Recepción' ? 'N.º de Acta *' :
                             header.tipoIngreso === 'Contrato' ? 'N.º de Contrato *' : 'N.º de Documento *'}
                        </label>
                        <InputText
                            value={header.numeroOrdenMemorandum}
                            onChange={e => {
                                hdr('numeroOrdenMemorandum', e.target.value);
                                clearError('numeroOrdenMemorandum');
                            }}
                            className={`w-full text-sm ${invalidFields.has('numeroOrdenMemorandum') ? 'p-invalid border-red-500' : ''}`}
                            disabled={modoVista}
                            placeholder={
                                header.tipoIngreso === 'Orden de compra' ? 'Ej: OC-2025-0123' :
                                header.tipoIngreso === 'Memorando de ingreso' ? 'Ej: MEMO-HEP-456' :
                                header.tipoIngreso === 'Acta de Entrega-Recepción' ? 'Ej: ACTA-2025-789' :
                                header.tipoIngreso === 'Contrato' ? 'Ej: CONTRATO-2025-001' : 'Ingrese el número'
                            }
                        />
                    </div>
                    {header.tipoIngreso !== 'Memorando de ingreso' && (
                        <div>
                            <label className="block text-xs font-medium mb-1">
                                {header.tipoIngreso === 'Acta de Entrega-Recepción' ? 'Empresa Proveedora / Institución *' : 'Empresa Proveedora *'}
                            </label>
                            <InputText
                                value={header.empresaProveedora}
                                onChange={e => {
                                    hdr('empresaProveedora', e.target.value);
                                    clearError('empresaProveedora');
                                }}
                                className={`w-full text-sm ${invalidFields.has('empresaProveedora') ? 'p-invalid border-red-500' : ''}`}
                                disabled={modoVista}
                                placeholder={header.tipoIngreso === 'Acta de Entrega-Recepción' ? 'Nombre de la empresa o institución' : 'Nombre del proveedor'}
                            />
                        </div>
                    )}
                    {header.tipoIngreso === 'Orden de compra' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium mb-1">Administrador de Orden de Compra</label>
                                <InputText
                                    value={header.administradorOrdenCompra || ''}
                                    onChange={e => hdr('administradorOrdenCompra', e.target.value)}
                                    className="w-full text-sm" disabled={modoVista}
                                    placeholder="Nombre del administrador"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Fecha de Orden de Compra</label>
                                <Calendar
                                    value={header.fechaOrdenCompra ?? null}
                                    onChange={e => {
                                        hdr('fechaOrdenCompra', e.value as Date | null);
                                        clearError('fechaOrdenCompra');
                                    }}
                                    dateFormat="dd/mm/yy" showIcon
                                    className={`w-full text-sm ${invalidFields.has('fechaOrdenCompra') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                />
                            </div>
                        </>
                    )}
                    {header.tipoIngreso === 'Memorando de ingreso' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium mb-1">Fecha del Memorando *</label>
                                <Calendar
                                    value={header.fechaMemorando ?? null}
                                    onChange={e => {
                                        hdr('fechaMemorando', e.value as Date | null);
                                        clearError('fechaMemorando');
                                    }}
                                    dateFormat="dd/mm/yy" showIcon
                                    className={`w-full text-sm ${invalidFields.has('fechaMemorando') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Remitente / Unidad u Institución de Origen *</label>
                                <InputText
                                    value={header.remitenteOrigen || ''}
                                    onChange={e => {
                                        hdr('remitenteOrigen', e.target.value);
                                        clearError('remitenteOrigen');
                                    }}
                                    className={`w-full text-sm ${invalidFields.has('remitenteOrigen') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                    placeholder="Ej: Dirección Administrativa / Ministerio de Salud"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium mb-1">Asunto del Memorando</label>
                                <InputText
                                    value={header.asuntoMemorando || ''}
                                    onChange={e => hdr('asuntoMemorando', e.target.value)}
                                    className="w-full text-sm" disabled={modoVista}
                                    placeholder="Asunto del memorando..."
                                />
                            </div>
                        </>
                    )}
                    {header.tipoIngreso === 'Acta de Entrega-Recepción' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium mb-1">Fecha del Acta *</label>
                                <Calendar
                                    value={header.fechaActa ?? null}
                                    onChange={e => {
                                        hdr('fechaActa', e.value as Date | null);
                                        clearError('fechaActa');
                                    }}
                                    dateFormat="dd/mm/yy" showIcon
                                    className={`w-full text-sm ${invalidFields.has('fechaActa') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Funcionario Receptor *</label>
                                <InputText
                                    value={header.funcionarioReceptor || ''}
                                    onChange={e => {
                                        hdr('funcionarioReceptor', e.target.value);
                                        clearError('funcionarioReceptor');
                                    }}
                                    className={`w-full text-sm ${invalidFields.has('funcionarioReceptor') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                    placeholder="Nombre del funcionario receptor"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Funcionario Entregador *</label>
                                <InputText
                                    value={header.funcionarioEntregador || ''}
                                    onChange={e => {
                                        hdr('funcionarioEntregador', e.target.value);
                                        clearError('funcionarioEntregador');
                                    }}
                                    className={`w-full text-sm ${invalidFields.has('funcionarioEntregador') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                    placeholder="Nombre de quien entrega"
                                />
                            </div>
                        </>
                    )}
                    {header.tipoIngreso === 'Contrato' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium mb-1">Fecha de Suscripción *</label>
                                <Calendar
                                    value={header.fechaSuscripcion ?? null}
                                    onChange={e => {
                                        hdr('fechaSuscripcion', e.value as Date | null);
                                        clearError('fechaSuscripcion');
                                    }}
                                    dateFormat="dd/mm/yy" showIcon
                                    className={`w-full text-sm ${invalidFields.has('fechaSuscripcion') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Fecha de Vigencia/Vencimiento</label>
                                <Calendar
                                    value={header.fechaVigencia ?? null}
                                    onChange={e => hdr('fechaVigencia', e.value as Date | null)}
                                    dateFormat="dd/mm/yy" showIcon className="w-full text-sm"
                                    disabled={modoVista}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Administrador del Contrato *</label>
                                <InputText
                                    value={header.administradorContrato || ''}
                                    onChange={e => {
                                        hdr('administradorContrato', e.target.value);
                                        clearError('administradorContrato');
                                    }}
                                    className={`w-full text-sm ${invalidFields.has('administradorContrato') ? 'p-invalid border-red-500' : ''}`}
                                    disabled={modoVista}
                                    placeholder="Nombre del administrador del contrato"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Divider />

            {/* Bloque: Garantía */}
            <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <i className="pi pi-shield text-amber-500" /> Garantía del Acta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 md:col-span-2">
                        <InputSwitch
                            checked={header.tieneGarantia}
                            onChange={e => {
                                if (!e.value && (header.fechaInicioGarantia || header.fechaFinGarantia)) {
                                    if (!window.confirm('¿Limpiar las fechas de garantía ya ingresadas?')) return;
                                }
                                hdr('tieneGarantia', e.value);
                                if (!e.value) {
                                    hdr('fechaInicioGarantia', null);
                                    hdr('fechaFinGarantia', null);
                                }
                            }}
                            disabled={modoVista}
                        />
                        <label className="text-sm font-medium">¿El acta incluye garantía?</label>
                        {header.tieneGarantia && (
                            <VigenciaBadge inicio={header.fechaInicioGarantia} fin={header.fechaFinGarantia} />
                        )}
                    </div>
                    {header.tieneGarantia && (<>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha Inicio de Garantía *</label>
                            <Calendar
                                value={header.fechaInicioGarantia ?? null}
                                onChange={e => {
                                    hdr('fechaInicioGarantia', e.value as Date | null);
                                    clearError('fechaInicioGarantia');
                                }}
                                dateFormat="dd/mm/yy" showIcon
                                className={`w-full text-sm ${invalidFields.has('fechaInicioGarantia') ? 'p-invalid border-red-500' : ''}`}
                                disabled={modoVista}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha Fin de Garantía *</label>
                            <Calendar
                                value={header.fechaFinGarantia ?? null}
                                onChange={e => {
                                    hdr('fechaFinGarantia', e.value as Date | null);
                                    clearError('fechaFinGarantia');
                                }}
                                dateFormat="dd/mm/yy" showIcon
                                className={`w-full text-sm ${invalidFields.has('fechaFinGarantia') ? 'p-invalid border-red-500' : ''}`}
                                minDate={header.fechaInicioGarantia ?? undefined}
                                disabled={modoVista}
                            />
                        </div>
                    </>)}
                </div>
            </div>

            <Divider />

            {/* Bloque: Información Financiera y Contractual */}
            <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <i className="pi pi-dollar text-emerald-500" /> Información Financiera y Contractual
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Número de Contrato</label>
                        <InputText
                            value={header.numeroContrato || ''}
                            onChange={e => hdr('numeroContrato', e.target.value)}
                            className="w-full text-sm"
                            disabled={modoVista}
                            placeholder="Ej: CONTRATO-2025-001"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Ítem Presupuestario</label>
                        <InputText
                            value={header.itemPresupuestario || ''}
                            onChange={e => hdr('itemPresupuestario', e.target.value)}
                            className="w-full text-sm"
                            disabled={modoVista}
                            placeholder="Ej: 530802"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Partida Presupuestaria</label>
                        <InputText
                            value={header.partidaPresupuestaria || ''}
                            onChange={e => hdr('partidaPresupuestaria', e.target.value)}
                            className="w-full text-sm"
                            disabled={modoVista}
                            placeholder="Ej: 001-0001-0000"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Valor de Adquisición Total</label>
                        <InputNumber
                            value={header.valorAdquisicionTotal ?? null}
                            onValueChange={e => hdr('valorAdquisicionTotal', e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            min={0}
                            className="w-full text-sm"
                            disabled={modoVista}
                            placeholder="0.00"
                            inputClassName="w-full text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Valor Unitario (Sugerido/Calculado)</label>
                        <InputNumber
                            value={header.valorUnitario ?? null}
                            onValueChange={e => hdr('valorUnitario', e.value)}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            min={0}
                            className="w-full text-sm"
                            disabled={modoVista}
                            placeholder="0.00"
                            inputClassName="w-full text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Fecha DNS</label>
                        <Calendar
                            value={header.fechaDNS ?? null}
                            onChange={e => hdr('fechaDNS', e.value as Date | null)}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className="w-full text-sm"
                            disabled={modoVista}
                        />
                    </div>
                    <div className="flex items-center gap-3 md:col-span-2 mt-2">
                        <InputSwitch
                            checked={header.bloqueado}
                            onChange={e => hdr('bloqueado', e.value ?? false)}
                            disabled={modoVista}
                        />
                        <label className="text-sm font-medium">Bloqueado (No editable tras generación)</label>
                    </div>
                </div>
            </div>

            <Divider />

            {/* Bloque: Responsable */}
            <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <i className="pi pi-user text-green-500" /> Responsable del Ingreso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Fecha de Ingreso al Sistema *</label>
                        <Calendar
                            value={header.fechaIngreso}
                            onChange={e => hdr('fechaIngreso', e.value as Date)}
                            dateFormat="dd/mm/yy" showIcon className="w-full text-sm"
                            disabled={modoVista}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Técnico Receptor *</label>
                        <InputText
                            value={header.tecnicoReceptor}
                            onChange={e => {
                                hdr('tecnicoReceptor', e.target.value);
                                clearError('tecnicoReceptor');
                            }}
                            className={`w-full text-sm ${invalidFields.has('tecnicoReceptor') ? 'p-invalid border-red-500' : ''}`}
                            disabled={modoVista}
                            placeholder="Nombre completo del técnico"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Responsable de Entrega *</label>
                        <InputText
                            value={header.responsableEntrega || ''}
                            onChange={e => {
                                hdr('responsableEntrega', e.target.value);
                                clearError('responsableEntrega');
                            }}
                            className={`w-full text-sm ${invalidFields.has('responsableEntrega') ? 'p-invalid border-red-500' : ''}`}
                            disabled={modoVista}
                            placeholder="Nombre del responsable de entrega"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">Observación General del Acta</label>
                        <InputTextarea
                            value={header.observacionGeneral || ''}
                            onChange={e => hdr('observacionGeneral', e.target.value)}
                            rows={3} className="w-full text-sm" disabled={modoVista}
                            placeholder="Observaciones generales sobre este ingreso..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLineas = () => (
        <div className="space-y-4">
            {lineas.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
                    <i className="pi pi-inbox text-3xl mb-2" />
                    <p className="text-sm">No hay líneas en el acta. Agrega la primera.</p>
                </div>
            )}

            {lineas.map((linea, idx) => {
                const seriesCount = linea.series.length;
                const coincide = seriesCount === linea.cantidadDeclarada;
                const hasError = lineHasErrors(idx);
                return (
                    <div key={linea.idLinea} className={`border rounded-lg overflow-hidden transition-all ${
                        hasError 
                            ? 'border-red-500 dark:border-red-900 ring-1 ring-red-500/50' 
                            : 'border-slate-200 dark:border-slate-700'
                    }`}>
                        {/* Header de la línea */}
                        <div
                            className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            onClick={() => setLineaActiva(lineaActiva === idx ? -1 : idx)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                                {hasError && <i className="pi pi-exclamation-circle text-red-500 animate-pulse text-xs" />}
                                <span className="text-sm font-semibold">
                                    {linea.tipoActivo || 'Tipo de activo no definido'}
                                    {linea.marca && ` — ${linea.marca}`}
                                    {linea.modelo && ` ${linea.modelo}`}
                                </span>
                                {linea.moduloDestino && (
                                    <Tag value={linea.moduloDestino} severity="info" style={{ fontSize: 10 }} />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    coincide ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                    : seriesCount > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {seriesCount} / {linea.cantidadDeclarada} series
                                </span>
                                {estadoBadge(linea.estadoLlegada)}
                                {!modoVista && (
                                    <Button icon="pi pi-trash" text severity="danger" size="small"
                                        onClick={e => { e.stopPropagation(); removeLinea(idx); }} />
                                )}
                                <i className={`pi pi-chevron-${lineaActiva === idx ? 'up' : 'down'} text-slate-400`} />
                            </div>
                        </div>

                        {/* Cuerpo expandible */}
                        {lineaActiva === idx && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Tipo de Activo *</label>
                                    <CreatableSelect
                                        value={linea.tipoActivo ? { label: linea.tipoActivo, value: linea.tipoActivo } : null}
                                        options={nombreOptions}
                                        placeholder="Ej: Mouse, Impresora, Cámara IP"
                                        formatCreateLabel={inputValue => `+ Crear "${inputValue}"`}
                                        isValidNewOption={inputValue => !!inputValue.trim() && !isExistingNombreOption(inputValue, nombreOptions)}
                                        filterOption={(candidate, input) => candidate.label.toLowerCase().includes(input.toLowerCase())}
                                        onChange={(option: SingleValue<NombreOption>) => handleNombreChange(idx, option)}
                                        onCreateOption={inputValue => handleCrearNombreOpcion(idx, inputValue)}
                                        styles={customNombreSelectStyles}
                                        classNamePrefix="react-select"
                                        isClearable
                                        isSearchable
                                        createOptionPosition="first"
                                        noOptionsMessage={() => 'Escribe para crear o buscar...'}
                                        isDisabled={modoVista}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Categoría*</label>
                                    <Dropdown
                                        value={linea.moduloDestino}
                                        options={MODULO_DESTINO_OPCIONES}
                                        onChange={e => updateLinea(idx, 'moduloDestino', e.value)}
                                        placeholder="Seleccione módulo"
                                        className="w-full text-sm bg-white dark:bg-slate-950"
                                        disabled={modoVista || !!CATEGORIA_BY_NOMBRE[linea.tipoActivo]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Marca *</label>
                                    <InputText
                                        value={linea.marca}
                                        onChange={e => updateLinea(idx, 'marca', e.target.value)}
                                        className="w-full text-sm" disabled={modoVista}
                                        placeholder="Ej: Lenovo, HP, Axis"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Modelo *</label>
                                    <InputText
                                        value={linea.modelo}
                                        onChange={e => updateLinea(idx, 'modelo', e.target.value)}
                                        className="w-full text-sm" disabled={modoVista}
                                        placeholder="Ej: M305, LaserJet Pro M15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Cantidad Declarada *</label>
                                    <InputNumber
                                        value={linea.cantidadDeclarada}
                                        onValueChange={e => updateLinea(idx, 'cantidadDeclarada', e.value ?? 1)}
                                        min={1} max={9999} showButtons disabled={modoVista}
                                        inputClassName="w-full text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Estado de Llegada *</label>
                                    <Dropdown
                                        value={linea.estadoLlegada}
                                        options={ESTADOS_OPCIONES}
                                        onChange={e => updateLinea(idx, 'estadoLlegada', e.value)}
                                        className="w-full text-sm bg-white dark:bg-slate-950"
                                        disabled={modoVista}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium mb-1">Especificaciones Técnicas</label>
                                    <InputTextarea
                                        value={linea.especificacionesTecnicas || ''}
                                        onChange={e => updateLinea(idx, 'especificacionesTecnicas', e.target.value)}
                                        rows={2} className="w-full text-sm" disabled={modoVista}
                                        placeholder="RAM, procesador, resolución, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Color</label>
                                    <InputText
                                        value={linea.color || ''}
                                        onChange={e => updateLinea(idx, 'color', e.target.value)}
                                        className="w-full text-sm" disabled={modoVista}
                                        placeholder="Ej: Negro, Gris"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Material</label>
                                    <InputText
                                        value={linea.material || ''}
                                        onChange={e => updateLinea(idx, 'material', e.target.value)}
                                        className="w-full text-sm" disabled={modoVista}
                                        placeholder="Ej: Plástico, Metal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Dimensión</label>
                                    <InputText
                                        value={linea.dimension || ''}
                                        onChange={e => updateLinea(idx, 'dimension', e.target.value)}
                                        className="w-full text-sm" disabled={modoVista}
                                        placeholder="Ej: 30x40x10 cm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Origen de Ingreso *</label>
                                    <Dropdown
                                        value={linea.origenIngreso}
                                        options={ORIGEN_INGRESO_OPCIONES}
                                        onChange={e => updateLinea(idx, 'origenIngreso', e.value)}
                                        className="w-full text-sm bg-white dark:bg-slate-950"
                                        disabled={modoVista}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Motivo de Ingreso *</label>
                                    <Dropdown
                                        value={linea.motivoIngreso}
                                        options={MOTIVO_INGRESO_OPCIONES}
                                        onChange={e => updateLinea(idx, 'motivoIngreso', e.value)}
                                        className="w-full text-sm bg-white dark:bg-slate-950"
                                        disabled={modoVista}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Unidad de Medida *</label>
                                    <Dropdown
                                        value={linea.unidadMedida}
                                        options={UNIDAD_MEDIDA_OPCIONES}
                                        onChange={e => updateLinea(idx, 'unidadMedida', e.value)}
                                        className="w-full text-sm bg-white dark:bg-slate-950"
                                        disabled={modoVista}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Condición de Depreciación *</label>
                                    <Dropdown
                                        value={linea.condicionDepreciacion}
                                        options={CONDICION_DEPRECIACION_OPCIONES}
                                        onChange={e => updateLinea(idx, 'condicionDepreciacion', e.value)}
                                        className="w-full text-sm bg-white dark:bg-slate-950"
                                        disabled={modoVista}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Tiempo de Vida Útil (años)</label>
                                    <InputNumber
                                        value={linea.tiempoVidaUtil ?? null}
                                        onValueChange={e => updateLinea(idx, 'tiempoVidaUtil', e.value)}
                                        min={0} max={100} showButtons disabled={modoVista}
                                        inputClassName="w-full text-sm"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium mb-1">Descripción del Activo (Línea)</label>
                                    <InputTextarea
                                        value={linea.descripcion || ''}
                                        onChange={e => updateLinea(idx, 'descripcion', e.target.value)}
                                        rows={2} className="w-full text-sm" disabled={modoVista}
                                        placeholder="Descripción general detallada del activo..."
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium mb-1">Observación de la Línea</label>
                                    <InputText
                                        value={linea.observacionLinea || ''}
                                        onChange={e => updateLinea(idx, 'observacionLinea', e.target.value)}
                                        className="w-full text-sm" disabled={modoVista}
                                        placeholder="Observación específica de este grupo"
                                    />
                                </div>
                                {getEspecificoKeyHelper(linea.moduloDestino, linea.tipoActivo) && (
                                    <div className="md:col-span-3">
                                        <Divider />
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
                                            Información Específica — {linea.tipoActivo}
                                        </h4>
                                        <AtributosEspecificosForm
                                            especificoKey={getEspecificoKeyHelper(linea.moduloDestino, linea.tipoActivo)}
                                            values={linea.atributosEspecificos || {}}
                                            onChange={(field, val) => updateAtributosEspecificos(idx, field, val)}
                                            onChangeNested={(parentKey, field, val) => updateAtributosEspecificosNested(idx, parentKey, field, val)}
                                            onChangeArray={(arrayKey, val, isAdd, indexToDelete) => updateAtributosEspecificosArray(idx, arrayKey, val, isAdd, indexToDelete)}
                                            disabled={modoVista}
                                            errors={{}}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {!modoVista && (
                <Button
                    label="＋ Agregar línea"
                    icon="pi pi-plus"
                    outlined
                    onClick={addLinea}
                    className="w-full"
                />
            )}
        </div>
    );

    const renderSeries = () => {
        if (lineas.length === 0) {
            return (
                <div className="text-center py-10 text-slate-400 text-sm">
                    Primero agrega al menos una línea en el Paso 2.
                </div>
            );
        }

        const linea = lineas[lineaActiva] ?? lineas[0];
        const lineaIdx = lineas.indexOf(linea);
        const modo = modoIngreso[lineaActiva] ?? 'manual';
        const coincide = linea.series.length === linea.cantidadDeclarada;

        return (
            <div className="space-y-4">
                {/* Tabs de líneas */}
                <div className="flex gap-2 flex-wrap">
                    {lineas.map((l, i) => {
                        const ok = l.series.length === l.cantidadDeclarada;
                        const hasErr = lineHasErrors(i);
                        return (
                            <button
                                key={l.idLinea}
                                onClick={() => setLineaActiva(i)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                    hasErr
                                        ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/10 hover:border-red-600'
                                        : lineaActiva === i
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                }`}
                            >
                                {hasErr && <i className="pi pi-exclamation-circle text-red-500 animate-pulse text-xs" />}
                                {l.tipoActivo || `Línea ${i + 1}`}
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                                    ok ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                }`}>
                                    {l.series.length}/{l.cantidadDeclarada}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Panel de la línea activa */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/30 dark:bg-slate-900/10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                {linea.tipoActivo} — {linea.marca} {linea.modelo}
                            </h4>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                                coincide
                                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                                {coincide ? '✓ Completo' : `${linea.series.length} de ${linea.cantidadDeclarada} series`}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">

                            {/* Dropdown Modo Ingreso */}
                            {!modoVista && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Modo:</label>
                                    <Dropdown
                                        value={modo}
                                        options={MODO_INGRESO_OPCIONES}
                                        onChange={e => setModoIngreso(prev => ({ ...prev, [lineaActiva]: e.value }))}
                                        className="text-xs w-44"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ubicación rápida para toda la línea */}
                    {!modoVista && (
                        <div className="mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row items-end gap-4">
                            <div className="flex-1 w-full">
                                <span className="block text-xs font-semibold text-slate-500 mb-2">📍 Ubicación rápida para toda la línea (Copiar destino a todas las series)</span>
                                <UbicacionCascada
                                    value={quickLocations[lineaIdx] || ''}
                                    onChange={val => setQuickLocations(prev => ({ ...prev, [lineaIdx]: val }))}
                                    layout="grid"
                                />
                            </div>
                            <Button
                                label="Aplicar a todas las series"
                                icon="pi pi-clone"
                                onClick={() => aplicarUbicacionATodas(lineaIdx)}
                                disabled={!quickLocations[lineaIdx]}
                                className="p-button-sm w-full md:w-auto"
                            />
                        </div>
                    )}

                    {/* Modo de ingreso inputs */}
                    {!modoVista && modo === 'manual' && (
                        <div className="flex gap-2 mb-6">
                            <InputText
                                value={serieManual}
                                onChange={e => setSerieManual(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        addSerie(lineaIdx, serieManual);
                                        setSerieManual('');
                                    }
                                }}
                                placeholder="Escribe o pega el número de serie y presiona Enter"
                                className="flex-1 text-sm"
                                autoFocus
                            />
                            <Button
                                label="Agregar"
                                icon="pi pi-plus"
                                onClick={() => { addSerie(lineaIdx, serieManual); setSerieManual(''); }}
                            />
                        </div>
                    )}

                    {!modoVista && modo === 'scan' && (
                        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                                <i className="pi pi-barcode mr-1" />
                                Modo escaneo activo — apunta el lector al código de barras
                            </label>
                            <input
                                ref={scanInputRef}
                                value={scanBuffer}
                                onChange={e => setScanBuffer(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        addSerie(lineaIdx, scanBuffer);
                                        setScanBuffer('');
                                        setTimeout(() => scanInputRef.current?.focus(), 50);
                                    }
                                }}
                                placeholder="Esperando escaneo..."
                                autoFocus
                                className="w-full border border-blue-300 dark:border-blue-700 rounded px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    )}

                    {!modoVista && modo === 'excel' && (
                        <div
                            className="mb-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file) importarExcel(lineaIdx, file);
                            }}
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.xlsx,.xls';
                                input.onchange = (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) importarExcel(lineaIdx, file);
                                };
                                input.click();
                            }}
                        >
                            <i className="pi pi-file-excel text-green-500 text-3xl mb-2" />
                            <p className="text-sm text-slate-500">Arrastra un archivo .xlsx aquí o haz clic para seleccionarlo</p>
                            <p className="text-xs text-slate-400 mt-1">La primera columna debe contener los números de serie</p>
                        </div>
                    )}

                    {/* Grid de series como tarjetas */}
                    {linea.series.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {linea.series.map((serie, sIdx) => {
                                const labelDocumento = 
                                    header.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra' :
                                    header.tipoIngreso === 'Memorando de ingreso' ? 'N.º de Memorando' :
                                    header.tipoIngreso === 'Acta de Entrega-Recepción' ? 'N.º de Acta' :
                                    header.tipoIngreso === 'Contrato' ? 'N.º de Contrato' : 'Doc. de Respaldo';

                                const numErr = invalidFields.has(`linea_${lineaIdx}_serie_${sIdx}_numeroSerie`);
                                const sbyeErr = invalidFields.has(`linea_${lineaIdx}_serie_${sIdx}_codigoSBYE`);
                                const ubiErr = invalidFields.has(`linea_${lineaIdx}_serie_${sIdx}_ubicacion`);
                                const hasErr = numErr || sbyeErr || ubiErr;

                                return (
                                    <div key={serie.idSerie} className={`rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative border ${
                                        hasErr 
                                            ? 'border-red-500 dark:border-red-900 ring-1 ring-red-500 bg-red-50/5' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}>
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                # {sIdx + 1} — Serie: <span className={`font-mono ${numErr ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-blue-600 dark:text-blue-400'}`}>{serie.numeroSerie}</span>
                                                {numErr && (
                                                    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                                                        <i className="pi pi-exclamation-circle animate-pulse" />
                                                        {seriesExistentesEnSistema.has(serie.numeroSerie) ? 'Duplicado' : 'Requerido'}
                                                    </span>
                                                )}
                                            </span>
                                            {!modoVista && (
                                                <Button
                                                    icon="pi pi-trash"
                                                    severity="danger"
                                                    text
                                                    size="small"
                                                    onClick={() => removeSerie(lineaIdx, serie.idSerie)}
                                                />
                                            )}
                                        </div>

                                        {/* Identificación y metadatos */}
                                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                                            <div>
                                                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Código Institucional</span>
                                                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                                                    {serie.codigoInstitucional || '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">{labelDocumento}</span>
                                                <span className="font-semibold text-slate-600 dark:text-slate-400">
                                                    {header.numeroOrdenMemorandum || '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Estado</span>
                                                {modoVista ? (
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {serie.estadoIndividual}
                                                    </span>
                                                ) : (
                                                    <Dropdown
                                                        value={serie.estadoIndividual}
                                                        options={ESTADOS_OPCIONES}
                                                        onChange={e => updateSerie(lineaIdx, serie.idSerie, 'estadoIndividual', e.value)}
                                                        className="text-xs w-full mt-1 bg-slate-50 dark:bg-slate-950"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <span className={`block text-[10px] font-semibold uppercase ${invalidFields.has(`linea_${lineaIdx}_serie_${sIdx}_codigoSBYE`) ? 'text-red-500 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    Código SBYE *
                                                </span>
                                                {modoVista ? (
                                                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                                                        {serie.codigoSBYE || '—'}
                                                    </span>
                                                ) : (
                                                    <InputText
                                                        value={serie.codigoSBYE || ''}
                                                        onChange={e => {
                                                            updateSerie(lineaIdx, serie.idSerie, 'codigoSBYE', e.target.value);
                                                            clearError(`linea_${lineaIdx}_serie_${sIdx}_codigoSBYE`);
                                                        }}
                                                        className={`text-xs font-mono w-full mt-1 p-1 h-7 ${invalidFields.has(`linea_${lineaIdx}_serie_${sIdx}_codigoSBYE`) ? 'p-invalid border-red-500' : ''}`}
                                                        placeholder="SBYE"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Ubicación en cascada */}
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mb-3">
                                            <span className={`block text-xs font-semibold mb-2 flex items-center gap-1.5 ${ubiErr ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500'}`}>
                                                📍 Ubicación del Activo *
                                                {ubiErr && (
                                                    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                                                        <i className="pi pi-exclamation-circle animate-pulse" />
                                                        Requerido
                                                    </span>
                                                )}
                                            </span>
                                            <div className={ubiErr ? 'p-1 border border-red-400 rounded-lg bg-red-50/20' : ''}>
                                                <UbicacionCascada
                                                    value={serie.ubicacion || ''}
                                                    onChange={val => {
                                                        updateSerie(lineaIdx, serie.idSerie, 'ubicacion', val);
                                                        clearError(`linea_${lineaIdx}_serie_${sIdx}_ubicacion`);
                                                    }}
                                                    disabled={modoVista}
                                                />
                                            </div>
                                        </div>

                                        {/* Observación */}
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                            <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Observación</span>
                                            {modoVista ? (
                                                <span className="text-xs text-slate-750 dark:text-slate-350">{serie.observacionIndividual || '—'}</span>
                                            ) : (
                                                <InputText
                                                    value={serie.observacionIndividual || ''}
                                                    onChange={e => updateSerie(lineaIdx, serie.idSerie, 'observacionIndividual', e.target.value)}
                                                    className="text-xs w-full"
                                                    placeholder="Observación opcional para esta serie"
                                                />
                                            )}
                                        </div>

                                        {serie.codigoBarras && (
                                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between items-center">
                                                <span>Código de Barras:</span>
                                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{serie.codigoBarras}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            No hay series registradas para esta línea todavía.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /* ── Stepper UI ── */
    const STEPS = [
        { label: 'Encabezado', icon: 'pi-file' },
        { label: 'Líneas', icon: 'pi-list' },
        { label: 'Series', icon: 'pi-barcode' }
    ];

    /* ── Render principal ── */
    return (
        <div className="p-4">
            <Toast ref={toast} />

            {/* Cabecera de página */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {modoVista ? 'Acta de Ingreso' : actaExistente ? 'Editar Acta' : 'Nueva Acta de Ingreso'}
                    </h1>
                    {actaExistente && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-lg text-blue-600">{actaExistente.referencia}</span>
                            <Tag
                                value={actaExistente.estado}
                                severity={actaExistente.estado === 'Cerrada' ? 'success' : 'warning'}
                            />
                        </div>
                    )}
                </div>
                <Button
                    icon="pi pi-arrow-left"
                    label="Volver"
                    text
                    onClick={() => navigate('/activos/actas')}
                />
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0 mb-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {STEPS.map((s, i) => {
                    const hasErr = stepHasErrors(i);
                    return (
                        <button
                            key={i}
                            onClick={() => setStep(i as 0 | 1 | 2)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all
                                ${step === i
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                ${i > 0 ? 'border-l border-slate-200 dark:border-slate-700' : ''}
                            `}
                        >
                            {hasErr ? (
                                <i className="pi pi-exclamation-circle text-red-500 animate-pulse text-sm" />
                            ) : (
                                <i className={`pi ${s.icon} text-sm`} />
                            )}
                            <span className={hasErr ? 'text-red-500 dark:text-red-400 font-semibold' : ''}>{s.label}</span>
                            {i === 1 && lineas.length > 0 && (
                                <span className={`text-xs px-1.5 rounded-full ml-1 ${
                                    step === i ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                }`}>{lineas.length}</span>
                            )}
                            {i === 2 && lineas.some(l => l.series.length !== l.cantidadDeclarada) && (
                                <span className="text-xs px-1.5 rounded-full ml-1 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">!</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Errores de cierre */}
            {errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                        <i className="pi pi-times-circle mr-1" />No se puede cerrar el acta:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        {errors.map((e, i) => (
                            <li key={i} className="text-xs text-red-600 dark:text-red-400">{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Contenido del paso activo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-6">
                {step === 0 && renderEncabezado()}
                {step === 1 && renderLineas()}
                {step === 2 && renderSeries()}
            </div>

            {/* Botones de navegación y acción */}
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex gap-2">
                    {step > 0 && (
                        <Button label="← Anterior" outlined onClick={() => setStep(prev => (prev - 1) as 0 | 1 | 2)} />
                    )}
                    {step < 2 && (
                        <Button label="Siguiente →" onClick={() => setStep(prev => (prev + 1) as 0 | 1 | 2)} />
                    )}
                </div>
                {!modoVista && (
                    <div className="flex gap-2">
                        <Button
                            label="Guardar Borrador"
                            icon="pi pi-save"
                            outlined
                            severity="secondary"
                            onClick={guardarBorrador}
                        />
                        <Button
                            label="Cerrar Acta y Generar Hojas de Vida"
                            icon="pi pi-check-circle"
                            severity="success"
                            onClick={handleCerrarActa}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrarActa;
