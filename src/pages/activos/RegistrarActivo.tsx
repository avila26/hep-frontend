import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import CreatableSelect from 'react-select/creatable';
import type { SingleValue } from 'react-select';
import { useNavigate } from 'react-router-dom';
import {
    useActivos,
    AtributosEquipoBiomedico,
    AtributosCPU,
    AtributosMonitor,
    AtributosTeclado,
    AtributosMouse,
    AtributosImpresoraRed,
    AtributosTelefonoIp,
    AtributosCCTV,
    AtributosAccessPoint,
    AtributosLaboratorio,
    AtributosRayosImagen
} from '../../context/ActivosContext';
import { UbicacionCascada } from '../../components/UbicacionCascada';
import { BarcodeDownload } from '../../components/BarcodeDownload';
import {
    AtributosEspecificosForm,
    GROUPED_NOMBRE_OPTIONS,
    CATEGORIA_BY_NOMBRE,
    CAT_MARCA,
    MARCAS_POR_CATEGORIA,
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
    isValidIPv4,
    isValidMAC,
    NombreOption,
    NombreGroup
} from './AtributosEspecificosForm';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Activo {
    idActivo?: number;
    codigoInstitucional: string;
    nombre: string;
    numeroSerie: string;
    descripcion: string;
    modelo: string;
    material: string;
    fechaAdquisicion: Date | null;
    responsableEntrega: string;
    dimension: string;
    numeroContrato: string;
    valorAdquisicion: number | null;
    valorUnitario: number | null;
    valorTotal: number | null;
    codigoSBYE: string;
    fechaDNS: string;
    tiempoVidaUtil: number | null;
    bloqueado: boolean;
    administradorDelProceso: string;
    itemPresupuestario: string;
    partidaPresupuestaria: string;
    numeroActa: string;
    marca: string;
    color: string;
    categoriaActivo: string;
    origenIngreso: string;
    motivoIngreso: string;
    unidadMedida: string;
    estadoActivo: string;
    condicionDepreciacion: string;
    ubicacion: string;
    atributosEspecificos?: any;
}



const CATALOGOS = {
    color: [
        { label: 'Blanco', value: 'Blanco' },
        { label: 'Negro', value: 'Negro' },
        { label: 'Gris', value: 'Gris' },
        { label: 'Azul', value: 'Azul' },
        { label: 'Rojo', value: 'Rojo' },
        { label: 'Verde', value: 'Verde' },
        { label: 'Amarillo', value: 'Amarillo' },
        { label: 'Plateado', value: 'Plateado' }
    ],
    origenIngreso: [
        { label: 'Compra', value: 'Compra' },
        { label: 'Donación', value: 'Donación' },
        { label: 'Transferencia', value: 'Transferencia' },
        { label: 'Comodato', value: 'Comodato' }
    ],
    categoriaActivo: [
        { label: 'Equipo médico (EQM)', value: 'Equipo médico (EQM)' },
        { label: 'Equipo de laboratorio (EQL)', value: 'Equipo de laboratorio (EQL)' },
        { label: 'Equipo de rayos e imagen (EQR)', value: 'Equipo de rayos e imagen (EQR)' },
        { label: 'Equipo informático (EQI)', value: 'Equipo informático (EQI)' },
        { label: 'Equipo de oficina (EQO)', value: 'Equipo de oficina (EQO)' },
        { label: 'Equipo eléctrico e industrial (EQE)', value: 'Equipo eléctrico e industrial (EQE)' },
        { label: 'Equipo de climatización (EQC)', value: 'Equipo de climatización (EQC)' },
        { label: 'Mobiliario administrativo (MOB)', value: 'Mobiliario administrativo (MOB)' },
        { label: 'Mobiliario hospitalario (MOH)', value: 'Mobiliario hospitalario (MOH)' },
        { label: 'Instrumental médico (INS)', value: 'Instrumental médico (INS)' },
        { label: 'Vehículos (VEH)', value: 'Vehículos (VEH)' },
        { label: 'Herramientas y accesorios (HER)', value: 'Herramientas y accesorios (HER)' },
        { label: 'Libros y colecciones (LIB)', value: 'Libros y colecciones (LIB)' },
        { label: 'Otros bienes (OTR)', value: 'Otros bienes (OTR)' }
    ],
    unidadMedida: [
        { label: 'Unidad', value: 'Unidad' },
        { label: 'Par', value: 'Par' },
        { label: 'Juego', value: 'Juego' },
        { label: 'Kit', value: 'Kit' }
    ],
    estadoActivo: [
        { label: 'Bueno', value: 'BUE' },
        { label: 'Regular', value: 'REG' },
        { label: 'Malo', value: 'MAL' }
    ],
    motivoIngreso: [
        { label: 'Adquisición Nueva', value: 'Adquisición Nueva' },
        { label: 'Reingreso', value: 'Reingreso' },
        { label: 'Transferencia Recibida', value: 'Transferencia Recibida' }
    ],
    condicionDepreciacion: [
        { label: 'Lineal', value: 'Lineal' },
        { label: 'Acelerada', value: 'Acelerada' },
        { label: 'No Aplica', value: 'No Aplica' }
    ]
};

// ─── Componente reutilizable: Garantía / Apoyo Tecnológico ────────────────────


// ─── Componente Principal ─────────────────────────────────────────────────────
export const RegistrarActivo: React.FC = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { activos, agregarActivo } = useActivos();

    const [creadoActivo, setCreadoActivo] = useState<Activo | null>(null);
    const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);

    const [formData, setFormData] = useState<Activo>({
        codigoInstitucional: '',
        nombre: '',
        numeroSerie: '',
        descripcion: '',
        modelo: '',
        material: '',
        fechaAdquisicion: null,
        responsableEntrega: '',
        dimension: '',
        numeroContrato: '',
        valorAdquisicion: null,
        valorUnitario: null,
        valorTotal: null,
        codigoSBYE: '',
        fechaDNS: '',
        tiempoVidaUtil: null,
        bloqueado: false,
        administradorDelProceso: '',
        itemPresupuestario: '',
        partidaPresupuestaria: '',
        numeroActa: '',
        marca: '',
        color: '',
        categoriaActivo: '',
        origenIngreso: '',
        motivoIngreso: '',
        unidadMedida: '',
        estadoActivo: '',
        condicionDepreciacion: '',
        ubicacion: ''
    });

    const [nombreOptions, setNombreOptions] = useState<NombreGroup[]>(GROUPED_NOMBRE_OPTIONS);
    const [selectedNombreOption, setSelectedNombreOption] = useState<NombreOption | null>(null);
    const [marcaOptions, setMarcaOptions] = useState<{ label: string; value: string }[]>(
        Object.values(CAT_MARCA).map(label => ({ label, value: label }))
    );
    const [categoriaBloqueada, setCategoriaBloqueada] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    // ─── useState de atributos específicos ───────────────────────────────────
    const [atributosEquipoBiomedico, setAtributosEquipoBiomedico] = useState<AtributosEquipoBiomedico>(initialBiomedicoState());
    const [atributosCPU, setAtributosCPU] = useState<AtributosCPU>(initialCPUState());
    const [atributosMonitor, setAtributosMonitor] = useState<AtributosMonitor>(initialMonitorState());
    const [atributosTeclado, setAtributosTeclado] = useState<AtributosTeclado>(initialTecladoState());
    const [atributosMouse, setAtributosMouse] = useState<AtributosMouse>(initialMouseState());
    const [atributosImpresoraRed, setAtributosImpresoraRed] = useState<AtributosImpresoraRed>(initialImpresoraRedState());
    const [atributosTelefonoIp, setAtributosTelefonoIp] = useState<AtributosTelefonoIp>(initialTelefonoIpState());
    const [atributosCCTV, setAtributosCCTV] = useState<AtributosCCTV>(initialCCTVState());
    const [atributosAccessPoint, setAtributosAccessPoint] = useState<AtributosAccessPoint>(initialAccessPointState());
    const [atributosLaboratorio, setAtributosLaboratorio] = useState<AtributosLaboratorio>(initialLaboratorioState());
    const [atributosRayosImagen, setAtributosRayosImagen] = useState<AtributosRayosImagen>(initialRayosImagenState());

    // ─── Handlers genéricos y unificados ─────────────────────────────────────
    const handleEspecificoChange = (field: string, value: any) => {
        const key = getEspecificoKey();
        if (key === 'EQM') setAtributosEquipoBiomedico(prev => ({ ...prev, [field]: value }));
        else if (key === 'EQL') setAtributosLaboratorio(prev => ({ ...prev, [field]: value }));
        else if (key === 'EQR') setAtributosRayosImagen(prev => ({ ...prev, [field]: value }));
        else if (key === 'CPU') setAtributosCPU(prev => ({ ...prev, [field]: value }));
        else if (key === 'MON') setAtributosMonitor(prev => ({ ...prev, [field]: value }));
        else if (key === 'TEC') setAtributosTeclado(prev => ({ ...prev, [field]: value }));
        else if (key === 'MOU') setAtributosMouse(prev => ({ ...prev, [field]: value }));
        else if (key === 'IMP') setAtributosImpresoraRed(prev => ({ ...prev, [field]: value }));
        else if (key === 'TEL') setAtributosTelefonoIp(prev => ({ ...prev, [field]: value }));
        else if (key === 'CCTV') setAtributosCCTV(prev => ({ ...prev, [field]: value }));
        else if (key === 'AP') setAtributosAccessPoint(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleEspecificoChangeNested = (parentKey: string, field: string, value: any) => {
        const key = getEspecificoKey();
        if (key === 'EQM') {
            setAtributosEquipoBiomedico(prev => ({
                ...prev,
                [parentKey]: { ...(prev[parentKey as keyof AtributosEquipoBiomedico] as any || {}), [field]: value }
            }));
        }
    };

    const handleEspecificoChangeArray = (arrayKey: string, value: any, isAdd: boolean, indexToDelete?: number) => {
        const key = getEspecificoKey();
        if (key === 'EQM' && arrayKey === 'accesorios') {
            setAtributosEquipoBiomedico(prev => {
                const arr = prev.accesorios || [];
                if (isAdd) {
                    return { ...prev, accesorios: [...arr, value] };
                } else if (indexToDelete !== undefined) {
                    return { ...prev, accesorios: arr.filter((_, i) => i !== indexToDelete) };
                }
                return prev;
            });
        } else if (key === 'CPU' && arrayKey === 'interfacesRed') {
            setAtributosCPU(prev => {
                const arr = prev.interfacesRed || [];
                if (isAdd) {
                    return { ...prev, interfacesRed: [...arr, value] };
                } else if (indexToDelete !== undefined) {
                    return { ...prev, interfacesRed: arr.filter((_, i) => i !== indexToDelete) };
                }
                return prev;
            });
        }
    };

    // ─── Helpers de categoría ─────────────────────────────────────────────────
    const getCategoryCodeFromLabel = (categoryLabel: string): string => {
        const match = categoryLabel.match(/\(([^)]+)\)$/);
        return match ? match[1] : '';
    };

    const getMarcaOptionsForCategory = (categoryCode: string) => {
        const allowedCodes = categoryCode ? MARCAS_POR_CATEGORIA[categoryCode] || ['OTR'] : Object.keys(CAT_MARCA);
        return Object.entries(CAT_MARCA)
            .filter(([code]) => allowedCodes.includes(code))
            .map(([, label]) => ({ label, value: label }));
    };

    const getEspecificoKey = (): string => {
        return getEspecificoKeyHelper(formData.categoriaActivo, formData.nombre);
    };

    const getTituloEspecifico = (): string => {
        const map: Record<string, string> = {
            EQM: 'Información Específica — Equipo Biomédico',
            EQL: 'Información Específica — Equipo de Laboratorio',
            EQR: 'Información Específica — Equipo de Rayos e Imagen',
            CPU: `Información Específica — ${formData.nombre}`,
            MON: 'Información Específica — Monitor',
            TEC: 'Información Específica — Teclado',
            MOU: 'Información Específica — Mouse',
            IMP: 'Información Específica — Impresora de Red',
            TEL: 'Información Específica — Teléfono IP',
            CCTV: 'Información Específica — Cámara CCTV / NVR',
            AP: 'Información Específica — Access Point / WiFi'
        };
        return map[getEspecificoKey()] || 'Información Específica';
    };

    const getAttributesToSave = () => {
        const key = getEspecificoKey();
        if (key === 'EQM') return atributosEquipoBiomedico;
        if (key === 'EQL') return atributosLaboratorio;
        if (key === 'EQR') return atributosRayosImagen;
        if (key === 'CPU') return atributosCPU;
        if (key === 'MON') return atributosMonitor;
        if (key === 'TEC') return atributosTeclado;
        if (key === 'MOU') return atributosMouse;
        if (key === 'IMP') return atributosImpresoraRed;
        if (key === 'TEL') return atributosTelefonoIp;
        if (key === 'CCTV') return atributosCCTV;
        if (key === 'AP') return atributosAccessPoint;
        return null;
    };

    // ─── useEffect: reset de atributos al cambiar categoría ──────────────────
    useEffect(() => {
        const categoryCode = getCategoryCodeFromLabel(formData.categoriaActivo);
        const filteredMarcas = getMarcaOptionsForCategory(categoryCode);
        setMarcaOptions(filteredMarcas);
        if (formData.marca && !filteredMarcas.some(option => option.value === formData.marca)) {
            setFormData(prev => ({ ...prev, marca: '' }));
        }
        if (categoryCode !== 'EQM') setAtributosEquipoBiomedico(initialBiomedicoState());
        if (categoryCode !== 'EQL') setAtributosLaboratorio(initialLaboratorioState());
        if (categoryCode !== 'EQR') setAtributosRayosImagen(initialRayosImagenState());
        if (categoryCode !== 'EQI') {
            setAtributosCPU(initialCPUState());
            setAtributosMonitor(initialMonitorState());
            setAtributosTeclado(initialTecladoState());
            setAtributosMouse(initialMouseState());
            setAtributosImpresoraRed(initialImpresoraRedState());
            setAtributosTelefonoIp(initialTelefonoIpState());
            setAtributosCCTV(initialCCTVState());
            setAtributosAccessPoint(initialAccessPointState());
        }
    }, [formData.categoriaActivo]);

    // ─── Código institucional autogenerado ────────────────────────────────────
    const generateCodigoInstitucional = (): string => {
        const prefix = 'CI';
        const year = new Date().getFullYear();
        const existingNumbers = activos
            .map(a => a.codigoInstitucional)
            .filter(code => typeof code === 'string' && code.startsWith(`${prefix}-${year}-`))
            .map(code => { const match = code.match(/CI-\d{4}-(\d+)/); return match ? Number(match[1]) : null; })
            .filter((v): v is number => typeof v === 'number' && !isNaN(v));
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
    };

    useEffect(() => {
        if (!formData.codigoInstitucional) {
            setFormData(prev => ({ ...prev, codigoInstitucional: generateCodigoInstitucional() }));
        }
    }, [activos]);

    // Calcular ValorTotal cuando cambia ValorUnitario
    useEffect(() => {
        if (formData.valorUnitario) {
            setFormData(prev => ({ ...prev, valorTotal: prev.valorUnitario }));
        }
    }, [formData.valorUnitario]);

    const onCrearNombreOpcion = async (inputValue: string) => {
        const newOption: NombreOption = { label: inputValue, value: inputValue };
        const mappedCategory = CATEGORIA_BY_NOMBRE[inputValue];
        const newCategoryValue = mappedCategory ? mappedCategory.label : 'Otros bienes (OTR)';
        setNombreOptions(prev => {
            const existingOtros = prev.find(g => g.label === 'Otros bienes (OTR)');
            if (existingOtros) {
                return prev.map(g =>
                    g.label === 'Otros bienes (OTR)' ? { ...g, options: [...g.options, newOption] } : g
                );
            }
            return [...prev, { label: 'Otros bienes (OTR)', options: [newOption] }];
        });
        setSelectedNombreOption(newOption);
        setCategoriaBloqueada(!!mappedCategory);
        setFormData(prev => ({ ...prev, nombre: inputValue, categoriaActivo: newCategoryValue }));
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

    // ─── Validación ────────────────────────────────────────────────────────────
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
        if (!formData.numeroSerie.trim()) {
            newErrors.numeroSerie = 'El número de serie es obligatorio';
        } else if (activos.some(a => a.numeroSerie === formData.numeroSerie)) {
            newErrors.numeroSerie = 'Este número de serie ya existe en el sistema';
        }
        if (!formData.marca) newErrors.marca = 'La marca es obligatoria';
        if (!formData.categoriaActivo) newErrors.categoriaActivo = 'La categoría es obligatoria';
        if (!formData.origenIngreso) newErrors.origenIngreso = 'El origen de ingreso es obligatorio';
        if (!formData.estadoActivo) newErrors.estadoActivo = 'El estado del activo es obligatorio';
        if (!formData.ubicacion) newErrors.ubicacion = 'La ubicación es obligatoria';
        if (!formData.fechaAdquisicion) {
            newErrors.fechaAdquisicion = 'La fecha de adquisición es obligatoria';
        } else if (formData.fechaAdquisicion > new Date()) {
            newErrors.fechaAdquisicion = 'La fecha no puede ser futura';
        }

        // Validaciones de IP/MAC según el bloque activo
        const key = getEspecificoKey();
        if (key === 'IMP') {
            if (atributosImpresoraRed.ip && !isValidIPv4(atributosImpresoraRed.ip))
                newErrors['imp_ip'] = 'Formato IPv4 inválido (ej. 192.168.1.100)';
            if (atributosImpresoraRed.mac && !isValidMAC(atributosImpresoraRed.mac))
                newErrors['imp_mac'] = 'Formato MAC inválido (ej. AA:BB:CC:DD:EE:FF)';
        }
        if (key === 'TEL') {
            if (atributosTelefonoIp.ip && !isValidIPv4(atributosTelefonoIp.ip))
                newErrors['tel_ip'] = 'Formato IPv4 inválido';
            if (atributosTelefonoIp.mac && !isValidMAC(atributosTelefonoIp.mac))
                newErrors['tel_mac'] = 'Formato MAC inválido';
        }
        if (key === 'CCTV') {
            if (atributosCCTV.ip && !isValidIPv4(atributosCCTV.ip))
                newErrors['cctv_ip'] = 'Formato IPv4 inválido';
        }
        if (key === 'AP') {
            if (atributosAccessPoint.mac && !isValidMAC(atributosAccessPoint.mac))
                newErrors['ap_mac'] = 'Formato MAC inválido';
        }
        if (key === 'EQL') {
            if (atributosLaboratorio.ipLanHospital && !isValidIPv4(atributosLaboratorio.ipLanHospital))
                newErrors['lab_ip1'] = 'Formato IPv4 inválido';
            if (atributosLaboratorio.ipLanBiomedica && !isValidIPv4(atributosLaboratorio.ipLanBiomedica))
                newErrors['lab_ip2'] = 'Formato IPv4 inválido';
            if (atributosLaboratorio.macLanHospital && !isValidMAC(atributosLaboratorio.macLanHospital))
                newErrors['lab_mac1'] = 'Formato MAC inválido';
            if (atributosLaboratorio.macLanBiomedica && !isValidMAC(atributosLaboratorio.macLanBiomedica))
                newErrors['lab_mac2'] = 'Formato MAC inválido';
            // Validar fechas proceso
            if (atributosLaboratorio.tipoPostesion === 'ApoyoTecnologico') {
                if (atributosLaboratorio.fechaInicioProceso && atributosLaboratorio.fechaFinProceso
                    && atributosLaboratorio.fechaFinProceso < atributosLaboratorio.fechaInicioProceso) {
                    newErrors['lab_fechas'] = 'La fecha de fin no puede ser anterior a la de inicio';
                }
            }
        }
        if (key === 'EQR') {
            if (atributosRayosImagen.fechaEmisionLicencia && atributosRayosImagen.fechaVencimientoLicencia
                && atributosRayosImagen.fechaVencimientoLicencia < atributosRayosImagen.fechaEmisionLicencia) {
                newErrors['eqr_licencia_fechas'] = 'La fecha de vencimiento no puede ser anterior a la de emisión';
            }
            if (atributosRayosImagen.tipoPostesion === 'ApoyoTecnologico'
                && atributosRayosImagen.fechaInicioProceso && atributosRayosImagen.fechaFinProceso
                && atributosRayosImagen.fechaFinProceso < atributosRayosImagen.fechaInicioProceso) {
                newErrors['eqr_proceso_fechas'] = 'La fecha de fin no puede ser anterior a la de inicio';
            }
        }
        if (key === 'EQM' && atributosEquipoBiomedico.tipoPostesion === 'ApoyoTecnologico') {
            if (atributosEquipoBiomedico.fechaInicioProceso && atributosEquipoBiomedico.fechaFinProceso
                && atributosEquipoBiomedico.fechaFinProceso < atributosEquipoBiomedico.fechaInicioProceso) {
                newErrors['bio_fechas'] = 'La fecha de fin no puede ser anterior a la de inicio';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof Activo, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleGuardar = async () => {
        if (!validateForm()) {
            toast.current?.show({ severity: 'error', summary: 'Errores de Validación', detail: 'Revise los campos obligatorios', life: 3000 });
            return;
        }
        try {
            const { idActivo, ...datosActivo } = formData;
            const nuevoActivo = agregarActivo({ ...datosActivo, atributosEspecificos: getAttributesToSave() });
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Activo registrado correctamente', life: 2000 });
            setCreadoActivo(nuevoActivo as unknown as Activo);
            setShowBarcodeDialog(true);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar el activo', life: 3000 });
        }
    };

    const handleCancelar = () => navigate('/activos/consultar');
    const getErrorClass = (field: keyof Activo) => errors[field] ? 'p-invalid' : '';

    // ─── Render: Equipo Biomédico (EQM) ───────────────────────────────────────
    // ─── Dispatcher principal de render ───────────────────────────────────────
    const renderEspecificoForm = (): React.ReactNode => {
        return (
            <AtributosEspecificosForm
                especificoKey={getEspecificoKey()}
                values={getAttributesToSave()}
                onChange={handleEspecificoChange}
                onChangeNested={handleEspecificoChangeNested}
                onChangeArray={handleEspecificoChangeArray}
                errors={errors}
            />
        );
    };

    const hayBloqueEspecifico = !!getEspecificoKey();

    // ─── JSX Principal ────────────────────────────────────────────────────────
    return (
        <div className="p-4">
            <Toast ref={toast} />

            <h1 className="text-2xl font-medium text-slate-800 dark:text-slate-100 mb-2">Registrar Activo</h1>

            <Card className="shadow-lg pt-0">
                {/* SECCIÓN 1: Información General */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        Información General
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nombre <span className="text-red-500">*</span></label>
                            <CreatableSelect
                                value={selectedNombreOption}
                                options={nombreOptions}
                                placeholder="Ej: CPU / Unidad Central"
                                formatCreateLabel={inputValue => `+ Crear "${inputValue}"`}
                                isValidNewOption={inputValue => !!inputValue.trim() && !isExistingNombreOption(inputValue, nombreOptions)}
                                filterOption={(candidate, input) => candidate.label.toLowerCase().includes(input.toLowerCase())}
                                onChange={(option: SingleValue<NombreOption>) => {
                                    if (!option) {
                                        setSelectedNombreOption(null);
                                        setCategoriaBloqueada(false);
                                        setFormData(prev => ({ ...prev, nombre: '' }));
                                        return;
                                    }
                                    const mappedCategory = CATEGORIA_BY_NOMBRE[option.value];
                                    const shouldLockCategory = !!mappedCategory;
                                    const newCategoryValue = mappedCategory ? mappedCategory.label : formData.categoriaActivo;
                                    setSelectedNombreOption(option);
                                    setCategoriaBloqueada(shouldLockCategory);
                                    setFormData(prev => ({ ...prev, nombre: option.value, categoriaActivo: newCategoryValue }));
                                }}
                                onCreateOption={onCrearNombreOpcion}
                                styles={customNombreSelectStyles}
                                classNamePrefix="react-select"
                                isClearable
                                isSearchable
                                createOptionPosition="first"
                                noOptionsMessage={() => 'Escribe para crear o buscar...'}
                            />
                            {errors.nombre && <small className="text-red-500">{errors.nombre}</small>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Categoría <span className="text-red-500">*</span></label>
                            <Dropdown value={formData.categoriaActivo} onChange={(e: DropdownChangeEvent) => handleInputChange('categoriaActivo', e.value)} options={CATALOGOS.categoriaActivo} placeholder="Seleccione una categoría" className={`w-full ${getErrorClass('categoriaActivo')}`} disabled={categoriaBloqueada} />
                            {errors.categoriaActivo && <small className="text-red-500">{errors.categoriaActivo}</small>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Marca <span className="text-red-500">*</span></label>
                            <Dropdown value={formData.marca} onChange={(e: DropdownChangeEvent) => handleInputChange('marca', e.value)} options={marcaOptions} placeholder="Seleccione una marca" className={`w-full ${getErrorClass('marca')}`} />
                            {errors.marca && <small className="text-red-500">{errors.marca}</small>}
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Descripción</label>
                            <InputTextarea value={formData.descripcion} onChange={e => handleInputChange('descripcion', e.target.value)} placeholder="Descripción detallada del activo" rows={3} className="w-full" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Modelo</label>
                            <InputText value={formData.modelo} onChange={e => handleInputChange('modelo', e.target.value)} placeholder="Ej: 24 pulgadas" className="w-full" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Color</label>
                            <Dropdown value={formData.color} onChange={(e: DropdownChangeEvent) => handleInputChange('color', e.value)} options={CATALOGOS.color} placeholder="Seleccione un color" className="w-full" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Material</label>
                            <InputText value={formData.material} onChange={e => handleInputChange('material', e.target.value)} placeholder="Ej: Plástico" className="w-full" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Dimensión</label>
                            <InputText value={formData.dimension} onChange={e => handleInputChange('dimension', e.target.value)} placeholder="Ej: 50x30x20 cm" className="w-full" />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN ESPECÍFICA (CONDICIONAL) */}
                {hayBloqueEspecifico && (
                    <>
                        <Divider />
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                                {getTituloEspecifico()}
                            </h3>
                            {renderEspecificoForm()}
                        </div>
                    </>
                )}

                <Divider />

                {/* SECCIÓN 2: Identificación */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        Identificación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Código Institucional</label>
                            <InputText value={formData.codigoInstitucional} onChange={e => handleInputChange('codigoInstitucional', e.target.value)} placeholder="Autogenerado" disabled className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Número de Serie <span className="text-red-500">*</span></label>
                            <InputText value={formData.numeroSerie} onChange={e => handleInputChange('numeroSerie', e.target.value)} placeholder="Ej: SN12345678" className={`w-full ${getErrorClass('numeroSerie')}`} />
                            {errors.numeroSerie && <small className="text-red-500">{errors.numeroSerie}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Código SBYE</label>
                            <InputText value={formData.codigoSBYE} onChange={e => handleInputChange('codigoSBYE', e.target.value)} placeholder="Código SBYE" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Número de Acta</label>
                            <InputText value={formData.numeroActa} onChange={e => handleInputChange('numeroActa', e.target.value)} placeholder="Ej: ACTA-2024-001" className="w-full" />
                        </div>
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 3: Clasificación */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        Clasificación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Origen de Ingreso <span className="text-red-500">*</span></label>
                            <Dropdown value={formData.origenIngreso} onChange={(e: DropdownChangeEvent) => handleInputChange('origenIngreso', e.value)} options={CATALOGOS.origenIngreso} placeholder="Seleccione origen" className={`w-full ${getErrorClass('origenIngreso')}`} />
                            {errors.origenIngreso && <small className="text-red-500">{errors.origenIngreso}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Motivo de Ingreso</label>
                            <Dropdown value={formData.motivoIngreso} onChange={(e: DropdownChangeEvent) => handleInputChange('motivoIngreso', e.value)} options={CATALOGOS.motivoIngreso} placeholder="Seleccione motivo" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Unidad de Medida</label>
                            <Dropdown value={formData.unidadMedida} onChange={(e: DropdownChangeEvent) => handleInputChange('unidadMedida', e.value)} options={CATALOGOS.unidadMedida} placeholder="Seleccione unidad" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Estado del Activo <span className="text-red-500">*</span></label>
                            <Dropdown value={formData.estadoActivo} onChange={(e: DropdownChangeEvent) => handleInputChange('estadoActivo', e.value)} options={CATALOGOS.estadoActivo} placeholder="Seleccione estado" className={`w-full ${getErrorClass('estadoActivo')}`} />
                            {errors.estadoActivo && <small className="text-red-500">{errors.estadoActivo}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Condición de Depreciación</label>
                            <Dropdown value={formData.condicionDepreciacion} onChange={(e: DropdownChangeEvent) => handleInputChange('condicionDepreciacion', e.value)} options={CATALOGOS.condicionDepreciacion} placeholder="Seleccione condición" className="w-full" />
                        </div>
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 4: Ubicación y Responsables */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        Ubicación y Responsables
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Ubicación <span className="text-red-500">*</span></label>
                            <UbicacionCascada
                                value={formData.ubicacion}
                                onChange={value => handleInputChange('ubicacion', value)}
                                error={errors.ubicacion}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Responsable / Custodio</label>
                            <InputText value={formData.responsableEntrega} onChange={e => handleInputChange('responsableEntrega', e.target.value)} placeholder="Nombre del custodio" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Administrador del Proceso</label>
                            <InputText value={formData.administradorDelProceso} onChange={e => handleInputChange('administradorDelProceso', e.target.value)} placeholder="Responsable del proceso" className="w-full" />
                        </div>
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 5: Valores y Fechas */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        Valores y Fechas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Fecha de Adquisición <span className="text-red-500">*</span></label>
                            <Calendar
                                value={formData.fechaAdquisicion}
                                onChange={e => handleInputChange('fechaAdquisicion', e.value)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                maxDate={new Date()}
                                className={`w-full ${getErrorClass('fechaAdquisicion')}`}
                            />
                            {errors.fechaAdquisicion && <small className="text-red-500">{errors.fechaAdquisicion}</small>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor de Adquisición (USD)</label>
                            <InputNumber value={formData.valorAdquisicion} onValueChange={e => handleInputChange('valorAdquisicion', e.value)} mode="currency" currency="USD" locale="es-EC" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor Unitario (USD)</label>
                            <InputNumber value={formData.valorUnitario} onValueChange={e => handleInputChange('valorUnitario', e.value)} mode="currency" currency="USD" locale="es-EC" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valor Total (USD)</label>
                            <InputNumber value={formData.valorTotal} onValueChange={e => handleInputChange('valorTotal', e.value)} mode="currency" currency="USD" locale="es-EC" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Vida Útil (años)</label>
                            <InputNumber value={formData.tiempoVidaUtil} onValueChange={e => handleInputChange('tiempoVidaUtil', e.value)} min={0} max={100} className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Fecha DNS</label>
                            <InputText value={formData.fechaDNS} onChange={e => handleInputChange('fechaDNS', e.target.value)} placeholder="Ej: 2030-01-01" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Número de Contrato</label>
                            <InputText value={formData.numeroContrato} onChange={e => handleInputChange('numeroContrato', e.target.value)} placeholder="Ej: CONT-2024-001" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Ítem Presupuestario</label>
                            <InputText value={formData.itemPresupuestario} onChange={e => handleInputChange('itemPresupuestario', e.target.value)} placeholder="Ítem presupuestario" className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Partida Presupuestaria</label>
                            <InputText value={formData.partidaPresupuestaria} onChange={e => handleInputChange('partidaPresupuestaria', e.target.value)} placeholder="Partida presupuestaria" className="w-full" />
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={handleCancelar} />
                    <Button label="Guardar Activo" icon="pi pi-save" onClick={handleGuardar} />
                </div>
            </Card>

            {/* Diálogo de código de barras */}
            <Dialog
                header="Activo Registrado"
                visible={showBarcodeDialog}
                style={{ width: '480px' }}
                modal
                onHide={() => {
                    setShowBarcodeDialog(false);
                    setCreadoActivo(null);
                    setFormData(prev => ({
                        ...prev,
                        numeroSerie: '',
                        codigoSBYE: '',
                        codigoInstitucional: ''
                    }));
                }}
            >
                {creadoActivo && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <i className="pi pi-check-circle text-5xl text-green-500" />
                        <p className="text-center text-slate-700 dark:text-slate-350 m-0">
                            El activo <strong>{creadoActivo.nombre}</strong> fue registrado con el código institucional:
                        </p>
                        <p className="text-2xl font-bold text-blue-600 tracking-widest">{creadoActivo.codigoInstitucional}</p>
                        <BarcodeDownload activo={{
                            idActivo: creadoActivo.idActivo || 0,
                            codigoInstitucional: creadoActivo.codigoInstitucional,
                            nombre: creadoActivo.nombre,
                            numeroSerie: creadoActivo.numeroSerie,
                            descripcion: creadoActivo.descripcion,
                            modelo: creadoActivo.modelo,
                            material: creadoActivo.material,
                            fechaAdquisicion: creadoActivo.fechaAdquisicion,
                            responsableEntrega: creadoActivo.responsableEntrega,
                            dimension: creadoActivo.dimension,
                            numeroContrato: creadoActivo.numeroContrato,
                            valorAdquisicion: creadoActivo.valorAdquisicion,
                            valorUnitario: creadoActivo.valorUnitario,
                            valorTotal: creadoActivo.valorTotal,
                            codigoSBYE: creadoActivo.codigoSBYE,
                            fechaDNS: creadoActivo.fechaDNS,
                            tiempoVidaUtil: creadoActivo.tiempoVidaUtil,
                            bloqueado: creadoActivo.bloqueado,
                            administradorDelProceso: creadoActivo.administradorDelProceso,
                            itemPresupuestario: creadoActivo.itemPresupuestario,
                            partidaPresupuestaria: creadoActivo.partidaPresupuestaria,
                            numeroActa: creadoActivo.numeroActa,
                            marca: creadoActivo.marca,
                            color: creadoActivo.color,
                            categoriaActivo: creadoActivo.categoriaActivo,
                            origenIngreso: creadoActivo.origenIngreso,
                            motivoIngreso: creadoActivo.motivoIngreso,
                            unidadMedida: creadoActivo.unidadMedida,
                            estadoActivo: creadoActivo.estadoActivo,
                            condicionDepreciacion: creadoActivo.condicionDepreciacion,
                            ubicacion: creadoActivo.ubicacion
                        }} />
                        <div className="flex gap-2 w-full mt-2">
                            <Button
                                label="Registrar otro activo"
                                icon="pi pi-plus"
                                onClick={() => {
                                    setShowBarcodeDialog(false);
                                    setCreadoActivo(null);
                                    setFormData(prev => ({
                                        ...prev,
                                        numeroSerie: '',
                                        codigoSBYE: '',
                                        codigoInstitucional: ''
                                    }));
                                }}
                                className="flex-1 p-button-success"
                            />
                            <Button
                                label="Ir a Consultar Activos"
                                icon="pi pi-arrow-right"
                                severity="secondary"
                                onClick={() => { setShowBarcodeDialog(false); navigate('/activos/consultar'); }}
                                className="flex-1"
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default RegistrarActivo;
