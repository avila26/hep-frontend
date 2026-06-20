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
    { label: 'Memorando de ingreso', value: 'Memorando de ingreso' }
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
    bloqueado: false
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
    tiempoVidaUtil: null
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
            bloqueado: actaExistente.bloqueado ?? false
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
        setLineas(prev => prev.map((l, i) => {
            if (i !== lineaIdx) return l;
            const idSerie = l.series.length > 0 ? Math.max(...l.series.map(s => s.idSerie)) + 1 : 1;
            return { ...l, series: [...l.series, { idSerie, numeroSerie: trimmed, estadoIndividual: estado }] };
        }));
    }, [seriesExistentesEnSistema, seriesEnActa]);

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

    /* ── Guardar borrador ── */
    const guardarBorrador = () => {
        const payload = { ...header, lineas };
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
        const actaId = actaExistente?.idActa;
        if (!actaId) {
            // Si no se ha guardado aún, guardar primero
            const nueva = crearActa({ ...header, lineas });
            const result = cerrarActa(nueva.idActa, seriesExistentesEnSistema, agregarActivos);
            if (!result.success) {
                setErrors(result.errores);
                return;
            }
            toast.current?.show({ severity: 'success', summary: '¡Acta cerrada!', detail: `${result.activosCreados?.length ?? 0} hojas de vida generadas`, life: 5000 });
            setTimeout(() => navigate('/activos/actas'), 2000);
        } else {
            // Guardar cambios del borrador primero
            actualizarActa({ ...actaExistente!, ...header, lineas });
            const result = cerrarActa(actaId, seriesExistentesEnSistema, agregarActivos);
            if (!result.success) {
                setErrors(result.errores);
                return;
            }
            setErrors([]);
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
                            {header.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra *' : 'N.º de Memorando *'}
                        </label>
                        <InputText
                            value={header.numeroOrdenMemorandum}
                            onChange={e => hdr('numeroOrdenMemorandum', e.target.value)}
                            className="w-full text-sm" disabled={modoVista}
                            placeholder="Ej: OC-2025-0123 / MEMO-HEP-456"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Empresa Proveedora *</label>
                        <InputText
                            value={header.empresaProveedora}
                            onChange={e => hdr('empresaProveedora', e.target.value)}
                            className="w-full text-sm" disabled={modoVista}
                            placeholder="Nombre del proveedor"
                        />
                    </div>
                    {header.tipoIngreso === 'Orden de compra' && (<>
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
                                onChange={e => hdr('fechaOrdenCompra', e.value as Date | null)}
                                dateFormat="dd/mm/yy" showIcon className="w-full text-sm"
                                disabled={modoVista}
                            />
                        </div>
                    </>)}
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
                                onChange={e => hdr('fechaInicioGarantia', e.value as Date | null)}
                                dateFormat="dd/mm/yy" showIcon className="w-full text-sm"
                                disabled={modoVista}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha Fin de Garantía *</label>
                            <Calendar
                                value={header.fechaFinGarantia ?? null}
                                onChange={e => hdr('fechaFinGarantia', e.value as Date | null)}
                                dateFormat="dd/mm/yy" showIcon className="w-full text-sm"
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
                            onChange={e => hdr('tecnicoReceptor', e.target.value)}
                            className="w-full text-sm" disabled={modoVista}
                            placeholder="Nombre completo del técnico"
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
                return (
                    <div key={linea.idLinea} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        {/* Header de la línea */}
                        <div
                            className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            onClick={() => setLineaActiva(lineaActiva === idx ? -1 : idx)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
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
                        return (
                            <button
                                key={l.idLinea}
                                onClick={() => setLineaActiva(i)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                                    lineaActiva === i
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                }`}
                            >
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
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="font-semibold text-sm">
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
                        {!modoVista && (
                            <Dropdown
                                value={modo}
                                options={MODO_INGRESO_OPCIONES}
                                onChange={e => setModoIngreso(prev => ({ ...prev, [lineaActiva]: e.value }))}
                                className="text-sm"
                                style={{ minWidth: 180 }}
                            />
                        )}
                    </div>

                    {/* Modo de ingreso */}
                    {!modoVista && modo === 'manual' && (
                        <div className="flex gap-2 mb-4">
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
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
                            className="mb-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
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

                    {/* Tabla de series */}
                    {linea.series.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 w-12">#</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 min-w-[150px]">Número de Serie</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 w-32 min-w-[120px]">Estado</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 min-w-[120px]">Código SBYE</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 min-w-[150px]">Ubicación</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 min-w-[180px]">Responsable Entrega</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 min-w-[160px]">Observación</th>
                                        {linea.series[0]?.codigoBarras && (
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 min-w-[140px]">Código de Barras</th>
                                        )}
                                        {!modoVista && <th className="w-12 border-b border-slate-200 dark:border-slate-700"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {linea.series.map((serie, sIdx) => (
                                        <tr key={serie.idSerie} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-3 py-2 text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">{sIdx + 1}</td>
                                            <td className="px-3 py-2 font-mono text-sm border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">{serie.numeroSerie}</td>
                                            <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                {modoVista ? estadoBadge(serie.estadoIndividual) : (
                                                    <Dropdown
                                                        value={serie.estadoIndividual}
                                                        options={ESTADOS_OPCIONES}
                                                        onChange={e => updateSerie(lineaIdx, serie.idSerie, 'estadoIndividual', e.value)}
                                                        className="text-xs w-full"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                {modoVista ? (serie.codigoSBYE || '—') : (
                                                    <InputText
                                                        value={serie.codigoSBYE || ''}
                                                        onChange={e => updateSerie(lineaIdx, serie.idSerie, 'codigoSBYE', e.target.value)}
                                                        className="text-xs w-full font-mono"
                                                        placeholder="Opcional"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                {modoVista ? (serie.ubicacion || '—') : (
                                                    <InputText
                                                        value={serie.ubicacion || ''}
                                                        onChange={e => updateSerie(lineaIdx, serie.idSerie, 'ubicacion', e.target.value)}
                                                        className="text-xs w-full"
                                                        placeholder="Opcional"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                {modoVista ? (serie.responsableEntrega || '—') : (
                                                    <InputText
                                                        value={serie.responsableEntrega || ''}
                                                        onChange={e => updateSerie(lineaIdx, serie.idSerie, 'responsableEntrega', e.target.value)}
                                                        className="text-xs w-full"
                                                        placeholder="Opcional"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                {modoVista ? (serie.observacionIndividual || '—') : (
                                                    <InputText
                                                        value={serie.observacionIndividual || ''}
                                                        onChange={e => updateSerie(lineaIdx, serie.idSerie, 'observacionIndividual', e.target.value)}
                                                        className="text-xs w-full"
                                                        placeholder="Opcional"
                                                    />
                                                )}
                                            </td>
                                            {serie.codigoBarras && (
                                                <td className="px-3 py-2 font-mono text-xs text-blue-600 border-b border-slate-100 dark:border-slate-800">
                                                    {serie.codigoBarras}
                                                </td>
                                            )}
                                            {!modoVista && (
                                                <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                                    <Button icon="pi pi-times" text severity="danger" size="small"
                                                        onClick={() => removeSerie(lineaIdx, serie.idSerie)} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">
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
                {STEPS.map((s, i) => (
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
                        <i className={`pi ${s.icon} text-sm`} />
                        <span>{s.label}</span>
                        {i === 1 && lineas.length > 0 && (
                            <span className={`text-xs px-1.5 rounded-full ml-1 ${
                                step === i ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}>{lineas.length}</span>
                        )}
                        {i === 2 && lineas.some(l => l.series.length !== l.cantidadDeclarada) && (
                            <span className="text-xs px-1.5 rounded-full ml-1 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">!</span>
                        )}
                    </button>
                ))}
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
