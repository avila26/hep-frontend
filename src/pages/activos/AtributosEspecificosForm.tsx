import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputSwitch } from 'primereact/inputswitch';
import { MultiSelect } from 'primereact/multiselect';
import {
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

// ─── Utility validators ────────────────────────────────────────────────────────
export const isValidIPv4 = (ip: string): boolean =>
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip.trim());

export const isValidMAC = (mac: string): boolean =>
    /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac.trim());

// ─── Types ────────────────────────────────────────────────────────────────────
export type NombreOption = { label: string; value: string };
export type NombreGroup = { label: string; options: NombreOption[] };

// ─── Catálogo de Nombres agrupados ────────────────────────────────────────────
export const GROUPED_NOMBRE_OPTIONS: NombreGroup[] = [
    {
        label: 'Equipo médico (EQM)',
        options: [
            { value: 'Ventilador mecánico', label: 'Ventilador mecánico' },
            { value: 'Monitor de signos vitales', label: 'Monitor de signos vitales' },
            { value: 'Desfibrilador', label: 'Desfibrilador' },
            { value: 'Bomba de infusión', label: 'Bomba de infusión' },
            { value: 'Electrocardiógrafo', label: 'Electrocardiógrafo' },
            { value: 'Bisturí eléctrico', label: 'Bisturí eléctrico' },
            { value: 'Lámpara quirúrgica', label: 'Lámpara quirúrgica' }
        ]
    },
    {
        label: 'Equipo de laboratorio (EQL)',
        options: [
            { value: 'Analizador de sangre', label: 'Analizador de sangre' },
            { value: 'Centrífuga', label: 'Centrífuga' },
            { value: 'Microscopio', label: 'Microscopio' },
            { value: 'Autoclave', label: 'Autoclave' },
            { value: 'Agitador de laboratorio', label: 'Agitador de laboratorio' }
        ]
    },
    {
        label: 'Equipo de rayos e imagen (EQR)',
        options: [
            { value: 'Equipo de rayos X', label: 'Equipo de rayos X' },
            { value: 'Tomógrafo', label: 'Tomógrafo' },
            { value: 'Mamógrafo', label: 'Mamógrafo' },
            { value: 'Ecógrafo', label: 'Ecógrafo' }
        ]
    },
    {
        label: 'Equipo informático (EQI)',
        options: [
            { value: 'CPU / Unidad Central', label: 'CPU / Unidad Central' },
            { value: 'Laptop', label: 'Laptop' },
            { value: 'Tablet', label: 'Tablet' },
            { value: 'Servidor', label: 'Servidor' },
            { value: 'Monitor', label: 'Monitor' },
            { value: 'Teclado', label: 'Teclado' },
            { value: 'Mouse', label: 'Mouse' },
            { value: 'Impresora de red', label: 'Impresora de red' },
            { value: 'Teléfono IP', label: 'Teléfono IP' },
            { value: 'Cámara CCTV / NVR', label: 'Cámara CCTV / NVR' },
            { value: 'Access Point / WiFi', label: 'Access Point / WiFi' },
            { value: 'Switch de red', label: 'Switch de red' },
            { value: 'Router', label: 'Router' }
        ]
    },
    {
        label: 'Equipo de oficina (EQO)',
        options: [
            { value: 'Teléfono fijo', label: 'Teléfono fijo' },
            { value: 'Fotocopiadora', label: 'Fotocopiadora' },
            { value: 'Proyector', label: 'Proyector' },
            { value: 'Scanner', label: 'Scanner' },
            { value: 'Televisor', label: 'Televisor' }
        ]
    },
    {
        label: 'Equipo eléctrico e industrial (EQE)',
        options: [
            { value: 'Generador eléctrico', label: 'Generador eléctrico' },
            { value: 'UPS industrial', label: 'UPS industrial' },
            { value: 'Tablero eléctrico', label: 'Tablero eléctrico' },
            { value: 'Planta de oxígeno', label: 'Planta de oxígeno' }
        ]
    },
    {
        label: 'Equipo de climatización (EQC)',
        options: [
            { value: 'Aire acondicionado', label: 'Aire acondicionado' },
            { value: 'Extractor de aire', label: 'Extractor de aire' },
            { value: 'Ventilador industrial', label: 'Ventilador industrial' },
            { value: 'Cuarto frío', label: 'Cuarto frío' }
        ]
    },
    {
        label: 'Mobiliario administrativo (MOB)',
        options: [
            { value: 'Escritorio', label: 'Escritorio' },
            { value: 'Silla de oficina', label: 'Silla de oficina' },
            { value: 'Archivador', label: 'Archivador' },
            { value: 'Estantería', label: 'Estantería' },
            { value: 'Mostrador', label: 'Mostrador' }
        ]
    },
    {
        label: 'Mobiliario hospitalario (MOH)',
        options: [
            { value: 'Cama clínica', label: 'Cama clínica' },
            { value: 'Camilla', label: 'Camilla' },
            { value: 'Silla de ruedas', label: 'Silla de ruedas' },
            { value: 'Cuna neonatal', label: 'Cuna neonatal' },
            { value: 'Velador', label: 'Velador' }
        ]
    },
    {
        label: 'Instrumental médico (INS)',
        options: [
            { value: 'Pinzas quirúrgicas', label: 'Pinzas quirúrgicas' },
            { value: 'Tijeras quirúrgicas', label: 'Tijeras quirúrgicas' },
            { value: 'Espéculo', label: 'Espéculo' },
            { value: 'Laringoscopio', label: 'Laringoscopio' },
            { value: 'Tensiómetro manual', label: 'Tensiómetro manual' }
        ]
    },
    {
        label: 'Vehículos (VEH)',
        options: [
            { value: 'Ambulancia', label: 'Ambulancia' },
            { value: 'Vehículo administrativo', label: 'Vehículo administrativo' },
            { value: 'Motocicleta institucional', label: 'Motocicleta institucional' }
        ]
    },
    {
        label: 'Herramientas y accesorios (HER)',
        options: [
            { value: 'Taladro', label: 'Taladro' },
            { value: 'Soldadora', label: 'Soldadora' },
            { value: 'Equipo de plomería', label: 'Equipo de plomería' }
        ]
    },
    {
        label: 'Libros y colecciones (LIB)',
        options: [
            { value: 'Bibliografía médica', label: 'Bibliografía médica' },
            { value: 'Manual técnico impreso', label: 'Manual técnico impreso' }
        ]
    },
    {
        label: 'Otros bienes (OTR)',
        options: [{ value: 'Otro bien', label: 'Otro bien' }]
    }
];

// ─── Mapa Nombre → Categoría ──────────────────────────────────────────────────
export const CATEGORIA_BY_NOMBRE: Record<string, { code: string; label: string }> = {
    'Ventilador mecánico': { code: 'EQM', label: 'Equipo médico (EQM)' },
    'Monitor de signos vitales': { code: 'EQM', label: 'Equipo médico (EQM)' },
    Desfibrilador: { code: 'EQM', label: 'Equipo médico (EQM)' },
    'Bomba de infusión': { code: 'EQM', label: 'Equipo médico (EQM)' },
    Electrocardiógrafo: { code: 'EQM', label: 'Equipo médico (EQM)' },
    'Bisturí eléctrico': { code: 'EQM', label: 'Equipo médico (EQM)' },
    'Lámpara quirúrgica': { code: 'EQM', label: 'Equipo médico (EQM)' },
    'Analizador de sangre': { code: 'EQL', label: 'Equipo de laboratorio (EQL)' },
    Centrífuga: { code: 'EQL', label: 'Equipo de laboratorio (EQL)' },
    Microscopio: { code: 'EQL', label: 'Equipo de laboratorio (EQL)' },
    Autoclave: { code: 'EQL', label: 'Equipo de laboratorio (EQL)' },
    'Agitador de laboratorio': { code: 'EQL', label: 'Equipo de laboratorio (EQL)' },
    'Equipo de rayos X': { code: 'EQR', label: 'Equipo de rayos e imagen (EQR)' },
    Tomógrafo: { code: 'EQR', label: 'Equipo de rayos e imagen (EQR)' },
    Mamógrafo: { code: 'EQR', label: 'Equipo de rayos e imagen (EQR)' },
    Ecógrafo: { code: 'EQR', label: 'Equipo de rayos e imagen (EQR)' },
    'CPU / Unidad Central': { code: 'EQI', label: 'Equipo informático (EQI)' },
    Laptop: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Tablet: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Servidor: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Monitor: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Teclado: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Mouse: { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Impresora de red': { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Teléfono IP': { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Cámara CCTV / NVR': { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Access Point / WiFi': { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Switch de red': { code: 'EQI', label: 'Equipo informático (EQI)' },
    Router: { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Teléfono fijo': { code: 'EQO', label: 'Equipo de oficina (EQO)' },
    Fotocopiadora: { code: 'EQO', label: 'Equipo de oficina (EQO)' },
    Proyector: { code: 'EQO', label: 'Equipo de oficina (EQO)' },
    Scanner: { code: 'EQO', label: 'Equipo de oficina (EQO)' },
    Televisor: { code: 'EQO', label: 'Equipo de oficina (EQO)' },
    'Generador eléctrico': { code: 'EQE', label: 'Equipo eléctrico e industrial (EQE)' },
    'UPS industrial': { code: 'EQE', label: 'Equipo eléctrico e industrial (EQE)' },
    'Tablero eléctrico': { code: 'EQE', label: 'Equipo eléctrico e industrial (EQE)' },
    'Planta de oxígeno': { code: 'EQE', label: 'Equipo eléctrico e industrial (EQE)' },
    'Aire acondicionado': { code: 'EQC', label: 'Equipo de climatización (EQC)' },
    'Extractor de aire': { code: 'EQC', label: 'Equipo de climatización (EQC)' },
    'Ventilador industrial': { code: 'EQC', label: 'Equipo de climatización (EQC)' },
    'Cuarto frío': { code: 'EQC', label: 'Equipo de climatización (EQC)' },
    Escritorio: { code: 'MOB', label: 'Mobiliario administrativo (MOB)' },
    'Silla de oficina': { code: 'MOB', label: 'Mobiliario administrativo (MOB)' },
    Archivador: { code: 'MOB', label: 'Mobiliario administrativo (MOB)' },
    Estantería: { code: 'MOB', label: 'Mobiliario administrativo (MOB)' },
    Mostrador: { code: 'MOB', label: 'Mobiliario administrativo (MOB)' },
    'Cama clínica': { code: 'MOH', label: 'Mobiliario hospitalario (MOH)' },
    Camilla: { code: 'MOH', label: 'Mobiliario hospitalario (MOH)' },
    'Silla de ruedas': { code: 'MOH', label: 'Mobiliario hospitalario (MOH)' },
    'Cuna neonatal': { code: 'MOH', label: 'Mobiliario hospitalario (MOH)' },
    Velador: { code: 'MOH', label: 'Mobiliario hospitalario (MOH)' },
    'Pinzas quirúrgicas': { code: 'INS', label: 'Instrumental médico (INS)' },
    'Tijeras quirúrgicas': { code: 'INS', label: 'Instrumental médico (INS)' },
    Espéculo: { code: 'INS', label: 'Instrumental médico (INS)' },
    Laringoscopio: { code: 'INS', label: 'Instrumental médico (INS)' },
    'Tensiómetro manual': { code: 'INS', label: 'Instrumental médico (INS)' },
    Ambulancia: { code: 'VEH', label: 'Vehículos (VEH)' },
    'Vehículo administrativo': { code: 'VEH', label: 'Vehículos (VEH)' },
    'Motocicleta institucional': { code: 'VEH', label: 'Vehículos (VEH)' },
    Taladro: { code: 'HER', label: 'Herramientas y accesorios (HER)' },
    Soldadora: { code: 'HER', label: 'Herramientas y accesorios (HER)' },
    'Equipo de plomería': { code: 'HER', label: 'Herramientas y accesorios (HER)' },
    'Bibliografía médica': { code: 'LIB', label: 'Libros y colecciones (LIB)' },
    'Manual técnico impreso': { code: 'LIB', label: 'Libros y colecciones (LIB)' },
    'Otro bien': { code: 'OTR', label: 'Otros bienes (OTR)' }
};

export const CAT_MARCA: Record<string, string> = {
    SAM: 'Samsung',
    LEN: 'Lenovo',
    HP: 'HP',
    DEL: 'Dell',
    PHI: 'Philips',
    GEH: 'GE Healthcare',
    SIE: 'Siemens Healthineers',
    DRG: 'Dräger',
    CNO: 'Canon',
    EPS: 'Epson',
    LEX: 'Lexmark',
    CIS: 'Cisco',
    UBI: 'Ubiquiti',
    OTR: 'Otra marca'
};

export const MARCAS_POR_CATEGORIA: Record<string, string[]> = {
    EQM: ['PHI', 'GEH', 'DRG', 'OTR'],
    EQL: ['SIE', 'GEH', 'OTR'],
    EQR: ['GEH', 'SIE', 'PHI', 'OTR'],
    EQI: ['SAM', 'LEN', 'HP', 'DEL', 'CNO', 'EPS', 'LEX', 'CIS', 'UBI', 'OTR'],
    EQO: ['SAM', 'HP', 'CNO', 'EPS', 'OTR'],
    EQE: ['OTR'],
    EQC: ['OTR'],
    MOB: ['OTR'],
    MOH: ['OTR'],
    INS: ['OTR'],
    VEH: ['OTR'],
    HER: ['OTR'],
    LIB: ['OTR'],
    OTR: ['OTR']
};

export const customNombreSelectStyles = {
    container: (provided: any) => ({ ...provided, width: '100%' }),
    control: (provided: any, state: any) => ({
        ...provided,
        width: '100%',
        minHeight: '2rem',
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#2563eb' : '#cbd5e1',
        boxShadow: state.isFocused ? '0 0 0 1px rgba(37, 99, 235, 0.3)' : provided.boxShadow,
        '&:hover': { borderColor: state.isFocused ? '#2563eb' : '#94a3b8' },
        fontSize: '0.875rem'
    }),
    menu: (provided: any) => ({ ...provided, zIndex: 50, width: '100%' }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#eff6ff' : provided.backgroundColor,
        color: '#0f172a'
    }),
    placeholder: (provided: any) => ({ ...provided, color: '#94a3b8' }),
    singleValue: (provided: any) => ({ ...provided, color: '#0f172a' }),
    valueContainer: (provided: any) => ({ ...provided, padding: '0.75rem 0.75rem' })
};

export const isExistingNombreOption = (inputValue: string, options: NombreGroup[]) =>
    options.some(group =>
        group.options.some(option => option.value.toLowerCase() === inputValue.trim().toLowerCase())
    );

export const getEspecificoKeyHelper = (category: string, nombre: string): string => {
    const getCategoryCodeFromLabel = (categoryLabel: string): string => {
        const match = categoryLabel.match(/\(([^)]+)\)$/);
        return match ? match[1] : categoryLabel;
    };

    const cat = getCategoryCodeFromLabel(category);
    const nom = nombre;
    if (cat === 'EQM') return 'EQM';
    if (cat === 'EQL') return 'EQL';
    if (cat === 'EQR') return 'EQR';
    if (cat === 'EQI') {
        const NOMBRES_CPU = new Set(['CPU / Unidad Central', 'Laptop', 'Tablet', 'Servidor']);
        if (NOMBRES_CPU.has(nom)) return 'CPU';
        if (nom === 'Monitor') return 'MON';
        if (nom === 'Teclado') return 'TEC';
        if (nom === 'Mouse') return 'MOU';
        if (nom === 'Impresora de red') return 'IMP';
        if (nom === 'Teléfono IP') return 'TEL';
        if (nom === 'Cámara CCTV / NVR') return 'CCTV';
        if (nom === 'Access Point / WiFi') return 'AP';
    }
    return '';
};

// ─── Estado inicial para cada tipo de atributo ────────────────────────────
export const initialBiomedicoState = (): AtributosEquipoBiomedico => ({
    voltaje: '', numeroFases: '', corriente: '', potencia: '',
    frecuencia: '', bateria: '', numeroCanales: '', memoria: '', tipoImpresora: '',
    requerimientosFuncionamiento: [], requerimientoOtroDetalle: '',
    parametrosMedidos: [], parametroOtroDetalle: '',
    fabricante: { nombre: '', direccion: '', telefono: '', email: '' },
    proveedorConsumibles: { nombre: '', direccion: '', telefono: '', email: '' },
    proveedorMantenimiento: { nombre: '', direccion: '', telefono: '', email: '' },
    proveedorCalibracion: { nombre: '', direccion: '', telefono: '', email: '' },
    tieneGarantia: false, fechaFinGarantia: null,
    frecuenciaMantenimientoPreventivo: '', responsableMantenimiento: '',
    tipoPostesion: 'Propio',
    empresaApoyo: '', ordenServicio: '', responsableOrden: '',
    fechaInicioProceso: null, fechaFinProceso: null,
    accesorios: [], informacionTecnica: []
});

export const initialCPUState = (): AtributosCPU => ({
    procesadorMarca: '', procesadorTipo: '', numeroProcesadores: '', numeroNucleos: '',
    ramMarca: '', ramCapacidad: '', ramTipo: '',
    almacenamientoMarca: '', almacenamientoCapacidad: '',
    tarjetaMadreMarca: '', tarjetaMadreModelo: '',
    redHabilitada: false, interfacesRed: [],
    sistemaOperativoNombre: '', sistemaOperativoVersion: '', sistemaOperativoLicencia: '',
    softwareOfimaticoNombre: '', softwareOfimaticoVersion: '',
    usuarioAcceso: '', passwordAcceso: '', conjuntoEstacion: ''
});

export const initialMonitorState = (): AtributosMonitor => ({ pulgadas: '', conjuntoEstacion: '' });
export const initialTecladoState = (): AtributosTeclado => ({ interfaz: '', conjuntoEstacion: '' });
export const initialMouseState = (): AtributosMouse => ({ interfaz: '', conjuntoEstacion: '' });
export const initialImpresoraRedState = (): AtributosImpresoraRed => ({
    ip: '', mac: '', nombreImpresora: '', correoAsociado: '', contador: null, usuarioPuerto: ''
});
export const initialTelefonoIpState = (): AtributosTelefonoIp => ({
    extension: '', ip: '', mac: '', responsables: '', especialidad: ''
});
export const initialCCTVState = (): AtributosCCTV => ({
    tipoDispositivo: '', ip: '', etiquetaPunto: ''
});
export const initialAccessPointState = (): AtributosAccessPoint => ({
    mac: '', codHSN: '', etiquetaPunto: '', puertoSwitch: ''
});
export const initialLaboratorioState = (): AtributosLaboratorio => ({
    tipoDispositivo: '', marcaSerieCPU: '', marcaSerieMonitor: '',
    ipLanHospital: '', macLanHospital: '', ipLanBiomedica: '', macLanBiomedica: '',
    puertoCnx: '', usuario: '', password: '',
    licenciaWindows: false, antivirus: false, firewall: false,
    impresoraAsociadaMarca: '', impresoraAsociadaSerie: '',
    tipoPostesion: 'Propio', tieneGarantia: false, fechaFinGarantia: null,
    frecuenciaMantenimientoPreventivo: '', responsableMantenimiento: '',
    empresaApoyo: '', ordenServicio: '', responsableOrden: '',
    fechaInicioProceso: null, fechaFinProceso: null
});

export const initialRayosImagenState = (): AtributosRayosImagen => ({
    tipoEquipo: '',
    tensionPicoKvp: '', corrienteMa: '', tiempoExposicionMs: '',
    potenciaMaxKw: '', dosisEntradaMgy: '', filtracionInherenteAlMm: '', distanciaFocoReceptorCm: '',
    numeroLicenciaSCAN: '', fechaEmisionLicencia: null, fechaVencimientoLicencia: null,
    titularLicencia: '', categoriaFuenteSCAN: '', estadoLicencia: '',
    oprNombre: '', oprTelefono: '', oprEmail: '',
    materialBlindaje: '', grosorBlindajePbMm: '',
    areaControladaDefinida: false, planEmergenciaRadiologica: false,
    frecuenciaCalibración: '', fechaUltimoControlCalidad: null, fechaProximoControlCalidad: null,
    laboratorioCalibración: '', dosimetrosPersonales: false,
    tipoPostesion: 'Propio', tieneGarantia: false, fechaFinGarantia: null,
    frecuenciaMantenimientoPreventivo: '', responsableMantenimiento: '',
    empresaApoyo: '', ordenServicio: '', responsableOrden: '',
    fechaInicioProceso: null, fechaFinProceso: null
});

// ─── Componente de Garantía / Apoyo ──────────────────────────────────────────
interface GarantiaMantenimientoProps {
    tipoPostesion: 'Propio' | 'ApoyoTecnologico';
    onTipoPostesionChange: (v: 'Propio' | 'ApoyoTecnologico') => void;
    tieneGarantia: boolean;
    onTieneGarantia: (v: boolean) => void;
    fechaFinGarantia: Date | null | undefined;
    onFechaFinGarantia: (v: Date | null) => void;
    frecuencia: string;
    onFrecuencia: (v: string) => void;
    responsable: string;
    onResponsable: (v: string) => void;
    empresaApoyo: string;
    ordenServicio: string;
    responsableOrden: string;
    fechaInicioProceso: Date | null | undefined;
    fechaFinProceso: Date | null | undefined;
    onApoyoChange: (field: string, value: any) => void;
    errorFechas?: string;
    disabled?: boolean;
}

const GarantiaMantenimiento: React.FC<GarantiaMantenimientoProps> = ({
    tipoPostesion, onTipoPostesionChange,
    tieneGarantia, onTieneGarantia, fechaFinGarantia, onFechaFinGarantia,
    frecuencia, onFrecuencia, responsable, onResponsable,
    empresaApoyo, ordenServicio, responsableOrden, fechaInicioProceso, fechaFinProceso, onApoyoChange,
    errorFechas, disabled = false
}) => (
    <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            Garantía y Mantenimiento Preventivo
        </h4>
        <div className="mb-4">
            <label className="block text-xs font-medium mb-2">Tipo de Posesión</label>
            <div className="flex gap-3">
                <Button
                    label="Propio"
                    size="small"
                    severity={tipoPostesion === 'Propio' ? undefined : 'secondary'}
                    outlined={tipoPostesion !== 'Propio'}
                    onClick={() => onTipoPostesionChange('Propio')}
                    type="button"
                    icon="pi pi-building"
                    disabled={disabled}
                />
                <Button
                    label="Apoyo Tecnológico"
                    size="small"
                    severity={tipoPostesion === 'ApoyoTecnologico' ? undefined : 'secondary'}
                    outlined={tipoPostesion !== 'ApoyoTecnologico'}
                    onClick={() => onTipoPostesionChange('ApoyoTecnologico')}
                    type="button"
                    icon="pi pi-users"
                    disabled={disabled}
                />
            </div>
        </div>

        {tipoPostesion === 'Propio' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                    <label className="text-xs font-medium">¿Tiene Garantía?</label>
                    <InputSwitch
                        checked={tieneGarantia}
                        onChange={e => onTieneGarantia(e.value ?? false)}
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Fecha Fin de Garantía</label>
                    <Calendar
                        value={fechaFinGarantia ? new Date(fechaFinGarantia) : null}
                        onChange={e => onFechaFinGarantia(e.value as Date | null)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        disabled={!tieneGarantia || disabled}
                        className="w-full text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Frecuencia Mantenimiento</label>
                    <Dropdown
                        value={frecuencia}
                        options={[
                            { label: 'Mensual', value: 'Mensual' },
                            { label: 'Trimestral', value: 'Trimestral' },
                            { label: 'Semestral', value: 'Semestral' },
                            { label: 'Anual', value: 'Anual' }
                        ]}
                        onChange={e => onFrecuencia(e.value)}
                        placeholder="Seleccione frecuencia"
                        className="w-full text-sm bg-white dark:bg-slate-950"
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Responsable Mantenimiento</label>
                    <InputText
                        value={responsable}
                        onChange={e => onResponsable(e.target.value)}
                        className="w-full text-sm"
                        placeholder="Responsable técnico"
                        disabled={disabled}
                    />
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium mb-1">Empresa de Apoyo</label>
                    <InputText
                        value={empresaApoyo}
                        onChange={e => onApoyoChange('empresaApoyo', e.target.value)}
                        className="w-full text-sm"
                        placeholder="Ej: Siemens Healthineers"
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Orden de Servicio</label>
                    <InputText
                        value={ordenServicio}
                        onChange={e => onApoyoChange('ordenServicio', e.target.value)}
                        className="w-full text-sm"
                        placeholder="Ej: OS-2026-00123"
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Responsable de la Orden</label>
                    <InputText
                        value={responsableOrden}
                        onChange={e => onApoyoChange('responsableOrden', e.target.value)}
                        className="w-full text-sm"
                        placeholder="Nombre del responsable"
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Fecha de Inicio de Proceso</label>
                    <Calendar
                        value={fechaInicioProceso ? new Date(fechaInicioProceso) : null}
                        onChange={e => onApoyoChange('fechaInicioProceso', e.value)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        className="w-full text-sm"
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Fecha de Fin de Proceso</label>
                    <Calendar
                        value={fechaFinProceso ? new Date(fechaFinProceso) : null}
                        onChange={e => onApoyoChange('fechaFinProceso', e.value)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        minDate={fechaInicioProceso ? new Date(fechaInicioProceso) : undefined}
                        className={`w-full text-sm ${errorFechas ? 'p-invalid' : ''}`}
                        disabled={disabled}
                    />
                    {errorFechas && <small className="text-red-500">{errorFechas}</small>}
                </div>
            </div>
        )}
    </div>
);

// ─── Componente Principal de Formularios Específicos ─────────────────────────
interface AtributosEspecificosFormProps {
    especificoKey: string;
    values: any;
    onChange: (field: string, value: any) => void;
    onChangeNested: (parentKey: string, field: string, value: any) => void;
    onChangeArray: (arrayKey: string, value: any, isAdd: boolean, indexToDelete?: number) => void;
    disabled?: boolean;
    errors?: Record<string, string>;
}

export const AtributosEspecificosForm: React.FC<AtributosEspecificosFormProps> = ({
    especificoKey,
    values = {},
    onChange,
    onChangeNested,
    onChangeArray,
    disabled = false,
    errors = {}
}) => {
    // Biomedico accesorios temp state
    const [nuevoAccesorioNombre, setNuevoAccesorioNombre] = useState('');
    const [nuevoAccesorioEstado, setNuevoAccesorioEstado] = useState('Bueno');

    // CPU interfaces temp state
    const [nuevaInterfazTipo, setNuevaInterfazTipo] = useState<'LAN' | 'WAN' | 'Wireless'>('LAN');
    const [nuevaInterfazVlan, setNuevaInterfazVlan] = useState('');
    const [nuevaInterfazIdVlan, setNuevaInterfazIdVlan] = useState('');
    const [nuevaInterfazRed, setNuevaInterfazRed] = useState('');
    const [nuevaInterfazIp, setNuevaInterfazIp] = useState('');
    const [nuevaInterfazGateway, setNuevaInterfazGateway] = useState('');
    const [nuevaInterfazMac, setNuevaInterfazMac] = useState('');
    const [nuevaInterfazEstado, setNuevaInterfazEstado] = useState('Activo');

    const handleAgregarAccesorio = () => {
        if (!nuevoAccesorioNombre.trim()) return;
        onChangeArray('accesorios', { nombre: nuevoAccesorioNombre.trim(), estado: nuevoAccesorioEstado }, true);
        setNuevoAccesorioNombre('');
        setNuevoAccesorioEstado('Bueno');
    };

    const handleAgregarInterfazRed = () => {
        onChangeArray('interfacesRed', {
            tipo: nuevaInterfazTipo,
            vlan: nuevaInterfazVlan.trim(),
            idVlan: nuevaInterfazIdVlan.trim(),
            red: nuevaInterfazRed.trim(),
            ip: nuevaInterfazIp.trim(),
            gateway: nuevaInterfazGateway.trim(),
            mac: nuevaInterfazMac.trim(),
            estado: nuevaInterfazEstado
        }, true);
        setNuevaInterfazTipo('LAN');
        setNuevaInterfazVlan('');
        setNuevaInterfazIdVlan('');
        setNuevaInterfazRed('');
        setNuevaInterfazIp('');
        setNuevaInterfazGateway('');
        setNuevaInterfazMac('');
        setNuevaInterfazEstado('Activo');
    };

    const renderBiomedicoForm = () => {
        const infoOptions = [
            'Manual de operación', 'Manual de instalación', 'Manual de servicio',
            'Manual de partes', 'Otra literatura', 'No existe información técnica'
        ];
        return (
            <div className="space-y-6">
                {/* Datos Técnicos */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Datos Técnicos de Funcionamiento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { field: 'voltaje', label: 'Voltaje', ph: 'Ej: 110V / 220V' },
                            { field: 'numeroFases', label: 'Número de Fases', ph: 'Ej: Monofásico' },
                            { field: 'corriente', label: 'Corriente', ph: 'Ej: 5 A' },
                            { field: 'potencia', label: 'Potencia', ph: 'Ej: 1200 W' },
                            { field: 'frecuencia', label: 'Frecuencia', ph: 'Ej: 60 Hz' },
                            { field: 'bateria', label: 'Batería', ph: 'Ej: Litio 12V 7Ah' },
                            { field: 'numeroCanales', label: 'Número de Canales', ph: 'Ej: 12' },
                            { field: 'memoria', label: 'Memoria', ph: 'Ej: 32 GB' },
                            { field: 'tipoImpresora', label: 'Tipo de Impresora integrada', ph: 'Ej: Térmica integrada' }
                        ].map(({ field, label, ph }) => (
                            <div key={field}>
                                <label className="block text-xs font-medium mb-1">{label}</label>
                                <InputText
                                    value={values[field] || ''}
                                    onChange={e => onChange(field, e.target.value)}
                                    className="w-full text-sm" placeholder={ph}
                                    disabled={disabled}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Requerimientos y Parámetros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                            Requerimientos de Funcionamiento
                        </h4>
                        <MultiSelect
                            value={values.requerimientosFuncionamiento || []}
                            options={['Eléctrico','Mecánico','Electrónico','Hidráulico','Neumático','Electromecánico','Gases Medicinales','Otro'].map(v => ({ label: v, value: v }))}
                            onChange={e => onChange('requerimientosFuncionamiento', e.value)}
                            placeholder="Seleccione requerimientos" display="chip"
                            className="w-full text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950"
                            disabled={disabled}
                        />
                        {values.requerimientosFuncionamiento?.includes('Otro') && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium mb-1">Especifique "Otro"</label>
                                <InputText
                                    value={values.requerimientoOtroDetalle || ''}
                                    onChange={e => onChange('requerimientoOtroDetalle', e.target.value)}
                                    placeholder="Detalle otro requerimiento" className="w-full text-sm"
                                    disabled={disabled}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                            Parámetros Medidos / Transmitidos
                        </h4>
                        <MultiSelect
                            value={values.parametrosMedidos || []}
                            options={['ECG','SPO2','Frecuencia Cardíaca','Temperatura','Presión No Invasiva','O2','Frecuencia Respiratoria','Arritmia','Otro'].map(v => ({ label: v, value: v }))}
                            onChange={e => onChange('parametrosMedidos', e.value)}
                            placeholder="Seleccione parámetros" display="chip"
                            className="w-full text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950"
                            disabled={disabled}
                        />
                        {values.parametrosMedidos?.includes('Otro') && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium mb-1">Especifique "Otro"</label>
                                <InputText
                                    value={values.parametroOtroDetalle || ''}
                                    onChange={e => onChange('parametroOtroDetalle', e.target.value)}
                                    placeholder="Detalle otro parámetro" className="w-full text-sm"
                                    disabled={disabled}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Proveedores */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Proveedores Asociados
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['fabricante', 'proveedorConsumibles', 'proveedorMantenimiento', 'proveedorCalibracion'] as const).map(key => (
                            <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                                    {key === 'fabricante' ? 'Fabricante' : key === 'proveedorConsumibles' ? 'Proveedor de Consumibles' : key === 'proveedorMantenimiento' ? 'Proveedor de Mantenimiento' : 'Proveedor de Calibración'}
                                </h5>
                                <div className="space-y-3">
                                    <div><label className="block text-xs font-medium mb-1">Nombre</label>
                                        <InputText value={values[key]?.nombre || ''} onChange={e => onChangeNested(key, 'nombre', e.target.value)} className="w-full text-sm" placeholder="Nombre" disabled={disabled} /></div>
                                    <div><label className="block text-xs font-medium mb-1">Dirección</label>
                                        <InputText value={values[key]?.direccion || ''} onChange={e => onChangeNested(key, 'direccion', e.target.value)} className="w-full text-sm" placeholder="Dirección" disabled={disabled} /></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-xs font-medium mb-1">Teléfono</label>
                                            <InputText value={values[key]?.telefono || ''} onChange={e => onChangeNested(key, 'telefono', e.target.value)} className="w-full text-sm" placeholder="Teléfono" disabled={disabled} /></div>
                                        <div><label className="block text-xs font-medium mb-1">Email</label>
                                            <InputText value={values[key]?.email || ''} onChange={e => onChangeNested(key, 'email', e.target.value)} className="w-full text-sm" placeholder="Email" disabled={disabled} /></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Garantía / Apoyo Tecnológico */}
                <GarantiaMantenimiento
                    tipoPostesion={values.tipoPostesion || 'Propio'}
                    onTipoPostesionChange={v => onChange('tipoPostesion', v)}
                    tieneGarantia={values.tieneGarantia || false}
                    onTieneGarantia={v => onChange('tieneGarantia', v)}
                    fechaFinGarantia={values.fechaFinGarantia}
                    onFechaFinGarantia={v => onChange('fechaFinGarantia', v)}
                    frecuencia={values.frecuenciaMantenimientoPreventivo || ''}
                    onFrecuencia={v => onChange('frecuenciaMantenimientoPreventivo', v)}
                    responsable={values.responsableMantenimiento || ''}
                    onResponsable={v => onChange('responsableMantenimiento', v)}
                    empresaApoyo={values.empresaApoyo || ''}
                    ordenServicio={values.ordenServicio || ''}
                    responsableOrden={values.responsableOrden || ''}
                    fechaInicioProceso={values.fechaInicioProceso}
                    fechaFinProceso={values.fechaFinProceso}
                    onApoyoChange={(field, value) => onChange(field, value)}
                    errorFechas={errors['bio_fechas']}
                    disabled={disabled}
                />

                {/* Accesorios */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Accesorios del Equipo
                    </h4>
                    {!disabled && (
                        <div className="flex flex-col md:flex-row gap-3 items-end mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium mb-1">Nombre del Accesorio</label>
                                <InputText value={nuevoAccesorioNombre} onChange={e => setNuevoAccesorioNombre(e.target.value)} placeholder="Ej: Sensor SpO2 adulto" className="w-full text-sm" />
                            </div>
                            <div style={{ width: '180px' }}>
                                <label className="block text-xs font-medium mb-1">Estado</label>
                                <Dropdown value={nuevoAccesorioEstado} options={[{ label: 'Bueno', value: 'Bueno' }, { label: 'Regular', value: 'Regular' }, { label: 'Malo', value: 'Malo' }]} onChange={e => setNuevoAccesorioEstado(e.value)} className="w-full text-sm bg-white dark:bg-slate-950" />
                            </div>
                            <Button label="Agregar Accesorio" icon="pi pi-plus" size="small" severity="info" outlined onClick={handleAgregarAccesorio} />
                        </div>
                    )}
                    {(!values.accesorios || values.accesorios.length === 0) ? (
                        <div className="text-center py-4 bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500 m-0">No se han registrado accesorios.</p>
                        </div>
                    ) : (
                        <div className="max-w-xl rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                                    <tr><th className="px-3 py-2 text-left">Accesorio</th><th className="px-3 py-2 text-left" style={{ width: 120 }}>Estado</th>{!disabled && <th className="px-3 py-2 text-center" style={{ width: 60 }}>Acción</th>}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                                    {values.accesorios.map((acc: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2 font-medium">{acc.nombre}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${acc.estado === 'Bueno' ? 'bg-green-100 text-green-800' : acc.estado === 'Regular' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{acc.estado}</span>
                                            </td>
                                            {!disabled && (
                                                <td className="px-3 py-2 text-center">
                                                    <Button icon="pi pi-trash" severity="danger" text rounded size="small" onClick={() => onChangeArray('accesorios', null, false, idx)} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Información Técnica */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Información Técnica Disponible
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {infoOptions.map(opt => (
                            <div key={opt} className="flex items-center gap-2">
                                <Checkbox inputId={`info-${opt}`} name="informacionTecnica" value={opt}
                                    onChange={e => {
                                        let sel = [...(values.informacionTecnica || [])];
                                        if (e.checked) sel.push(opt); else sel = sel.filter((i: string) => i !== opt);
                                        onChange('informacionTecnica', sel);
                                    }}
                                    checked={values.informacionTecnica?.includes(opt) || false}
                                    disabled={disabled}
                                />
                                <label htmlFor={`info-${opt}`} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">{opt}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderCpuForm = () => {
        return (
            <div className="space-y-6">
                {/* Conjunto / Estación */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo (opcional)
                    </label>
                    <InputText
                        value={values.conjuntoEstacion || ''}
                        onChange={e => onChange('conjuntoEstacion', e.target.value)}
                        className="w-full text-sm"
                        placeholder="Código institucional del conjunto ancla (ej. CI-2026-0001)"
                        disabled={disabled}
                    />
                    <small className="text-xs text-blue-500 dark:text-blue-400">
                        Si este CPU es el ancla de un conjunto, puede dejar este campo vacío. Ingrese un código si pertenece a un conjunto ya registrado.
                    </small>
                </div>

                {/* Componentes Internos */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Componentes Internos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Marca del Procesador</label>
                            <InputText value={values.procesadorMarca || ''} onChange={e => onChange('procesadorMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Intel / AMD" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de Procesador</label>
                            <InputText value={values.procesadorTipo || ''} onChange={e => onChange('procesadorTipo', e.target.value)} className="w-full text-sm" placeholder="Ej: Core i7-12700H" disabled={disabled} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">Cant. CPU</label>
                                <InputText value={values.numeroProcesadores || ''} onChange={e => onChange('numeroProcesadores', e.target.value)} className="w-full text-sm" placeholder="Ej: 1" disabled={disabled} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Cant. Núcleos</label>
                                <InputText value={values.numeroNucleos || ''} onChange={e => onChange('numeroNucleos', e.target.value)} className="w-full text-sm" placeholder="Ej: 8" disabled={disabled} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Marca de RAM</label>
                            <InputText value={values.ramMarca || ''} onChange={e => onChange('ramMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Kingston" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Capacidad de RAM</label>
                            <InputText value={values.ramCapacidad || ''} onChange={e => onChange('ramCapacidad', e.target.value)} className="w-full text-sm" placeholder="Ej: 16 GB" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de RAM</label>
                            <InputText value={values.ramTipo || ''} onChange={e => onChange('ramTipo', e.target.value)} className="w-full text-sm" placeholder="Ej: DDR4 / DDR5" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Marca de Disco</label>
                            <InputText value={values.almacenamientoMarca || ''} onChange={e => onChange('almacenamientoMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Western Digital" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Capacidad Almacenamiento</label>
                            <InputText value={values.almacenamientoCapacidad || ''} onChange={e => onChange('almacenamientoCapacidad', e.target.value)} className="w-full text-sm" placeholder="Ej: 512 GB SSD" disabled={disabled} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">Marca Placa Madre</label>
                                <InputText value={values.tarjetaMadreMarca || ''} onChange={e => onChange('tarjetaMadreMarca', e.target.value)} className="w-full text-sm" placeholder="Marca" disabled={disabled} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Modelo Placa Madre</label>
                                <InputText value={values.tarjetaMadreModelo || ''} onChange={e => onChange('tarjetaMadreModelo', e.target.value)} className="w-full text-sm" placeholder="Modelo" disabled={disabled} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuración de Red */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 m-0">Configuración de Red</h4>
                            <p className="text-xs text-slate-500 m-0 mt-1">¿Habilitar y configurar parámetros de red del equipo?</p>
                        </div>
                        <InputSwitch checked={values.redHabilitada || false} onChange={e => onChange('redHabilitada', e.value ?? false)} disabled={disabled} />
                    </div>
                    {values.redHabilitada && (
                        <div className="space-y-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            {!disabled && (
                                <div className="p-3 bg-white dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-900">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">Nueva Interfaz de Red</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Tipo</label>
                                            <Dropdown value={nuevaInterfazTipo} options={[{ label: 'LAN', value: 'LAN' }, { label: 'WAN', value: 'WAN' }, { label: 'Wireless', value: 'Wireless' }]} onChange={e => setNuevaInterfazTipo(e.value)} className="w-full text-sm bg-white dark:bg-slate-950" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">VLAN</label>
                                            <InputText value={nuevaInterfazVlan} onChange={e => setNuevaInterfazVlan(e.target.value)} className="w-full text-sm" placeholder="Ej: VLAN-Datos" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">ID VLAN</label>
                                            <InputText value={nuevaInterfazIdVlan} onChange={e => setNuevaInterfazIdVlan(e.target.value)} className="w-full text-sm" placeholder="Ej: 10" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Red</label>
                                            <InputText value={nuevaInterfazRed} onChange={e => setNuevaInterfazRed(e.target.value)} className="w-full text-sm" placeholder="Ej: 192.168.10.0/24" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">IP</label>
                                            <InputText value={nuevaInterfazIp} onChange={e => setNuevaInterfazIp(e.target.value)} className="w-full text-sm" placeholder="Ej: 192.168.10.50" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Gateway</label>
                                            <InputText value={nuevaInterfazGateway} onChange={e => setNuevaInterfazGateway(e.target.value)} className="w-full text-sm" placeholder="Ej: 192.168.10.1" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                                            <InputText value={nuevaInterfazMac} onChange={e => setNuevaInterfazMac(e.target.value)} className="w-full text-sm" placeholder="Ej: AA:BB:CC:DD:EE:FF" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Estado</label>
                                            <Dropdown value={nuevaInterfazEstado} options={[{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }]} onChange={e => setNuevaInterfazEstado(e.value)} className="w-full text-sm bg-white dark:bg-slate-950" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-3">
                                        <Button label="Agregar Interfaz" icon="pi pi-plus" size="small" severity="info" outlined onClick={handleAgregarInterfazRed} />
                                    </div>
                                </div>
                            )}
                            <div className="mt-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Interfaces Configuradas</h5>
                                {(!values.interfacesRed || values.interfacesRed.length === 0) ? (
                                    <div className="text-center py-4 bg-white dark:bg-slate-950 rounded border border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-xs text-slate-500 m-0">No se han registrado interfaces de red.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
                                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                                                <tr><th className="px-3 py-2 text-left">Tipo</th><th className="px-3 py-2 text-left">VLAN (ID)</th><th className="px-3 py-2 text-left">Red</th><th className="px-3 py-2 text-left">IP</th><th className="px-3 py-2 text-left">Gateway</th><th className="px-3 py-2 text-left">MAC</th><th className="px-3 py-2 text-left">Estado</th>{!disabled && <th className="px-3 py-2 text-center" style={{ width: 50 }}>Acción</th>}</tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                                                {values.interfacesRed.map((intf: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2 font-semibold text-blue-600 dark:text-blue-400">{intf.tipo}</td>
                                                        <td className="px-3 py-2">{intf.vlan || '-'} {intf.idVlan ? `(${intf.idVlan})` : ''}</td>
                                                        <td className="px-3 py-2">{intf.red || '-'}</td>
                                                        <td className="px-3 py-2 font-mono">{intf.ip || '-'}</td>
                                                        <td className="px-3 py-2 font-mono">{intf.gateway || '-'}</td>
                                                        <td className="px-3 py-2 font-mono">{intf.mac || '-'}</td>
                                                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${intf.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{intf.estado}</span></td>
                                                        {!disabled && (
                                                            <td className="px-3 py-2 text-center"><Button icon="pi pi-trash" severity="danger" text rounded size="small" onClick={() => onChangeArray('interfacesRed', null, false, idx)} /></td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Software y Administración */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Software y Administración
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-medium mb-1">Nombre Sistema Operativo</label>
                            <InputText value={values.sistemaOperativoNombre || ''} onChange={e => onChange('sistemaOperativoNombre', e.target.value)} className="w-full text-sm" placeholder="Ej: Windows 11 Pro" disabled={disabled} /></div>
                        <div><label className="block text-xs font-medium mb-1">Versión Sistema Operativo</label>
                            <InputText value={values.sistemaOperativoVersion || ''} onChange={e => onChange('sistemaOperativoVersion', e.target.value)} className="w-full text-sm" placeholder="Ej: 23H2" disabled={disabled} /></div>
                        <div><label className="block text-xs font-medium mb-1">Licencia S.O.</label>
                            <InputText value={values.sistemaOperativoLicencia || ''} onChange={e => onChange('sistemaOperativoLicencia', e.target.value)} className="w-full text-sm" placeholder="Ej: OEM / Retail / Libre" disabled={disabled} /></div>
                        <div><label className="block text-xs font-medium mb-1">Software Ofimático</label>
                            <InputText value={values.softwareOfimaticoNombre || ''} onChange={e => onChange('softwareOfimaticoNombre', e.target.value)} className="w-full text-sm" placeholder="Ej: Microsoft Office 2021 LTSC" disabled={disabled} /></div>
                        <div><label className="block text-xs font-medium mb-1">Versión Ofimática</label>
                            <InputText value={values.softwareOfimaticoVersion || ''} onChange={e => onChange('softwareOfimaticoVersion', e.target.value)} className="w-full text-sm" placeholder="Ej: 16.0" disabled={disabled} /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-medium mb-1">Usuario Acceso</label>
                                <InputText value={values.usuarioAcceso || ''} onChange={e => onChange('usuarioAcceso', e.target.value)} className="w-full text-sm" placeholder="Usuario" disabled={disabled} /></div>
                            <div><label className="block text-xs font-medium mb-1">Password Acceso</label>
                                <InputText value={values.passwordAcceso || ''} onChange={e => onChange('passwordAcceso', e.target.value)} className="w-full text-sm" placeholder="Contraseña" type="password" disabled={disabled} /></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMonitorForm = () => (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo
                </label>
                <InputText value={values.conjuntoEstacion || ''} onChange={e => onChange('conjuntoEstacion', e.target.value)} className="w-full text-sm" placeholder="Código institucional del CPU (ej. CI-2026-0001)" disabled={disabled} />
                <small className="text-xs text-blue-500">Ingrese el código del CPU al que pertenece este monitor.</small>
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Pulgadas / Tamaño de Pantalla</label>
                <InputText value={values.pulgadas || ''} onChange={e => onChange('pulgadas', e.target.value)} className="w-full text-sm" placeholder='Ej: 24" / 27"' disabled={disabled} />
            </div>
        </div>
    );

    const renderTecladoForm = () => (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo
                </label>
                <InputText value={values.conjuntoEstacion || ''} onChange={e => onChange('conjuntoEstacion', e.target.value)} className="w-full text-sm" placeholder="Código institucional del CPU (ej. CI-2026-0001)" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Tipo de Interfaz</label>
                <Dropdown value={values.interfaz || ''} options={[{ label: 'USB', value: 'USB' }, { label: 'PS/2', value: 'PS/2' }, { label: 'Inalámbrico', value: 'Inalámbrico' }, { label: 'Bluetooth', value: 'Bluetooth' }]} onChange={e => onChange('interfaz', e.value)} placeholder="Seleccione interfaz" className="w-full text-sm bg-white dark:bg-slate-950" disabled={disabled} />
            </div>
        </div>
    );

    const renderMouseForm = () => (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo
                </label>
                <InputText value={values.conjuntoEstacion || ''} onChange={e => onChange('conjuntoEstacion', e.target.value)} className="w-full text-sm" placeholder="Código institucional del CPU (ej. CI-2026-0001)" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Tipo de Interfaz</label>
                <Dropdown value={values.interfaz || ''} options={[{ label: 'USB', value: 'USB' }, { label: 'PS/2', value: 'PS/2' }, { label: 'Inalámbrico', value: 'Inalámbrico' }, { label: 'Bluetooth', value: 'Bluetooth' }]} onChange={e => onChange('interfaz', e.value)} placeholder="Seleccione interfaz" className="w-full text-sm bg-white dark:bg-slate-950" disabled={disabled} />
            </div>
        </div>
    );

    const renderImpresoraRedForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Dirección IP</label>
                <InputText value={values.ip || ''} onChange={e => onChange('ip', e.target.value)} className={`w-full text-sm ${errors['imp_ip'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.1.100" disabled={disabled} />
                {errors['imp_ip'] && <small className="text-red-500">{errors['imp_ip']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                <InputText value={values.mac || ''} onChange={e => onChange('mac', e.target.value)} className={`w-full text-sm ${errors['imp_mac'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" disabled={disabled} />
                {errors['imp_mac'] && <small className="text-red-500">{errors['imp_mac']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Nombre de Impresora (convención HEP)</label>
                <InputText value={values.nombreImpresora || ''} onChange={e => onChange('nombreImpresora', e.target.value)} className="w-full text-sm" placeholder="Ej: A100_IMP_LEXMARK_MS331" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Correo Asociado</label>
                <InputText value={values.correoAsociado || ''} onChange={e => onChange('correoAsociado', e.target.value)} className="w-full text-sm" placeholder="correo@hep.gob.ec" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Contador de páginas</label>
                <InputNumber value={values.contador ?? null} onValueChange={e => onChange('contador', e.value)} className="w-full text-sm" placeholder="0" min={0} disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Usuario / Puerto de Red</label>
                <InputText value={values.usuarioPuerto || ''} onChange={e => onChange('usuarioPuerto', e.target.value)} className="w-full text-sm" placeholder="Ej: admin / Puerto 9100" disabled={disabled} />
            </div>
        </div>
    );

    const renderTelefonoIpForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Extensión</label>
                <InputText value={values.extension || ''} onChange={e => onChange('extension', e.target.value)} className="w-full text-sm" placeholder="Ej: 1234" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección IP</label>
                <InputText value={values.ip || ''} onChange={e => onChange('ip', e.target.value)} className={`w-full text-sm ${errors['tel_ip'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.1.50" disabled={disabled} />
                {errors['tel_ip'] && <small className="text-red-500">{errors['tel_ip']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                <InputText value={values.mac || ''} onChange={e => onChange('mac', e.target.value)} className={`w-full text-sm ${errors['tel_mac'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" disabled={disabled} />
                {errors['tel_mac'] && <small className="text-red-500">{errors['tel_mac']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Responsable(s) de la extensión</label>
                <InputText value={values.responsables || ''} onChange={e => onChange('responsables', e.target.value)} className="w-full text-sm" placeholder="Nombre del responsable" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Especialidad (del responsable)</label>
                <InputText value={values.especialidad || ''} onChange={e => onChange('especialidad', e.target.value)} className="w-full text-sm" placeholder="Ej: Medicina Interna" disabled={disabled} />
            </div>
        </div>
    );

    const renderCctvForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Tipo de Dispositivo</label>
                <Dropdown value={values.tipoDispositivo || ''} options={[{ label: 'Cámara fija', value: 'Cámara fija' }, { label: 'Cámara PTZ', value: 'Cámara PTZ' }, { label: 'NVR', value: 'NVR' }]} onChange={e => onChange('tipoDispositivo', e.value)} placeholder="Seleccione tipo" className="w-full text-sm bg-white dark:bg-slate-950" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección IP</label>
                <InputText value={values.ip || ''} onChange={e => onChange('ip', e.target.value)} className={`w-full text-sm ${errors['cctv_ip'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.5.10" disabled={disabled} />
                {errors['cctv_ip'] && <small className="text-red-500">{errors['cctv_ip']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Etiqueta del Punto de Datos</label>
                <InputText value={values.etiquetaPunto || ''} onChange={e => onChange('etiquetaPunto', e.target.value)} className="w-full text-sm" placeholder="Ej: PD-CCTV-A3-01" disabled={disabled} />
            </div>
        </div>
    );

    const renderAccessPointForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                <InputText value={values.mac || ''} onChange={e => onChange('mac', e.target.value)} className={`w-full text-sm ${errors['ap_mac'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" disabled={disabled} />
                {errors['ap_mac'] && <small className="text-red-500">{errors['ap_mac']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Cod HSN</label>
                <InputText value={values.codHSN || ''} onChange={e => onChange('codHSN', e.target.value)} className="w-full text-sm" placeholder="Ej: HSN-AP-001" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Etiqueta de Punto de Datos</label>
                <InputText value={values.etiquetaPunto || ''} onChange={e => onChange('etiquetaPunto', e.target.value)} className="w-full text-sm" placeholder="Ej: PD-AP-B2-03" disabled={disabled} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Puerto de Switch (WS)</label>
                <InputText value={values.puertoSwitch || ''} onChange={e => onChange('puertoSwitch', e.target.value)} className="w-full text-sm" placeholder="Ej: WS-SW01-Gi0/14" disabled={disabled} />
            </div>
        </div>
    );

    const renderLaboratorioForm = () => (
        <div className="space-y-6">
            {/* Identificación del dispositivo */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                    Identificación del Dispositivo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Tipo de Dispositivo</label>
                        <InputText value={values.tipoDispositivo || ''} onChange={e => onChange('tipoDispositivo', e.target.value)} className="w-full text-sm" placeholder="Ej: PC, Gasómetro, Coba c311" disabled={disabled} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Marca / Serie del CPU o Dispositivo</label>
                        <InputText value={values.marcaSerieCPU || ''} onChange={e => onChange('marcaSerieCPU', e.target.value)} className="w-full text-sm" placeholder="Ej: HP / SN12345" disabled={disabled} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Marca / Serie del Monitor asociado</label>
                        <InputText value={values.marcaSerieMonitor || ''} onChange={e => onChange('marcaSerieMonitor', e.target.value)} className="w-full text-sm" placeholder="Ej: Dell / SN67890 (si aplica)" disabled={disabled} />
                    </div>
                </div>
            </div>

            {/* Configuración de Red */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                    Configuración de Red
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">LAN Hospital</h5>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">IP</label>
                                <InputText value={values.ipLanHospital || ''} onChange={e => onChange('ipLanHospital', e.target.value)} className={`w-full text-sm ${errors['lab_ip1'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.10.50" disabled={disabled} />
                                {errors['lab_ip1'] && <small className="text-red-500">{errors['lab_ip1']}</small>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">MAC</label>
                                <InputText value={values.macLanHospital || ''} onChange={e => onChange('macLanHospital', e.target.value)} className={`w-full text-sm ${errors['lab_mac1'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" disabled={disabled} />
                                {errors['lab_mac1'] && <small className="text-red-500">{errors['lab_mac1']}</small>}
                            </div>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">LAN Equipos Biomédicos</h5>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">IP</label>
                                <InputText value={values.ipLanBiomedica || ''} onChange={e => onChange('ipLanBiomedica', e.target.value)} className={`w-full text-sm ${errors['lab_ip2'] ? 'p-invalid' : ''}`} placeholder="Ej: 10.0.2.50" disabled={disabled} />
                                {errors['lab_ip2'] && <small className="text-red-500">{errors['lab_ip2']}</small>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">MAC</label>
                                <InputText value={values.macLanBiomedica || ''} onChange={e => onChange('macLanBiomedica', e.target.value)} className={`w-full text-sm ${errors['lab_mac2'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" disabled={disabled} />
                                {errors['lab_mac2'] && <small className="text-red-500">{errors['lab_mac2']}</small>}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Puerto de Conexión</label>
                        <InputText value={values.puertoCnx || ''} onChange={e => onChange('puertoCnx', e.target.value)} className="w-full text-sm" placeholder="Ej: SW01-Gi0/05" disabled={disabled} />
                    </div>
                </div>
            </div>

            {/* Acceso al Sistema */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                    Acceso al Sistema
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Usuario del Equipo</label>
                        <InputText value={values.usuario || ''} onChange={e => onChange('usuario', e.target.value)} className="w-full text-sm" placeholder="Usuario" disabled={disabled} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Password del Equipo
                            <span className="ml-2 text-orange-500 text-[10px] font-normal">⚠ Se almacena en texto plano</span>
                        </label>
                        <InputText value={values.password || ''} onChange={e => onChange('password', e.target.value)} className="w-full text-sm" placeholder="Contraseña" type="password" disabled={disabled} />
                    </div>
                </div>
            </div>

            {/* Software y Seguridad */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                    Software y Seguridad
                </h4>
                <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                        <InputSwitch checked={values.licenciaWindows || false} onChange={e => onChange('licenciaWindows', e.value ?? false)} disabled={disabled} />
                        <label className="text-xs font-medium">Licenciamiento Windows</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <InputSwitch checked={values.antivirus || false} onChange={e => onChange('antivirus', e.value ?? false)} disabled={disabled} />
                        <label className="text-xs font-medium">Antivirus instalado</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <InputSwitch checked={values.firewall || false} onChange={e => onChange('firewall', e.value ?? false)} disabled={disabled} />
                        <label className="text-xs font-medium">Firewall habilitado</label>
                    </div>
                </div>
            </div>

            {/* Impresora Asociada */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                    Impresora Asociada (si tiene dedicada)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Marca</label>
                        <InputText value={values.impresoraAsociadaMarca || ''} onChange={e => onChange('impresoraAsociadaMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Zebra / Epson" disabled={disabled} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Número de Serie</label>
                        <InputText value={values.impresoraAsociadaSerie || ''} onChange={e => onChange('impresoraAsociadaSerie', e.target.value)} className="w-full text-sm" placeholder="Número de serie de la impresora" disabled={disabled} />
                    </div>
                </div>
            </div>

            {/* Garantía / Apoyo Tecnológico */}
            <GarantiaMantenimiento
                tipoPostesion={values.tipoPostesion || 'Propio'}
                onTipoPostesionChange={v => onChange('tipoPostesion', v)}
                tieneGarantia={values.tieneGarantia || false}
                onTieneGarantia={v => onChange('tieneGarantia', v)}
                fechaFinGarantia={values.fechaFinGarantia}
                onFechaFinGarantia={v => onChange('fechaFinGarantia', v)}
                frecuencia={values.frecuenciaMantenimientoPreventivo || ''}
                onFrecuencia={v => onChange('frecuenciaMantenimientoPreventivo', v)}
                responsable={values.responsableMantenimiento || ''}
                onResponsable={v => onChange('responsableMantenimiento', v)}
                empresaApoyo={values.empresaApoyo || ''}
                ordenServicio={values.ordenServicio || ''}
                responsableOrden={values.responsableOrden || ''}
                fechaInicioProceso={values.fechaInicioProceso}
                fechaFinProceso={values.fechaFinProceso}
                onApoyoChange={(field, value) => onChange(field, value)}
                errorFechas={errors['lab_fechas']}
                disabled={disabled}
            />
        </div>
    );

    const renderRayosImagenForm = () => {
        const TIPOS_NO_IONIZANTES = new Set(['Ecógrafo', 'Resonancia Magnética (RM)']);
        const esIonizante = values.tipoEquipo
            ? !TIPOS_NO_IONIZANTES.has(values.tipoEquipo)
            : true;
        const licenciaVencida = values.fechaVencimientoLicencia
            && new Date(values.fechaVencimientoLicencia) < new Date();

        return (
            <div className="space-y-6">
                {/* Tipo de equipo */}
                <div>
                    <label className="block text-xs font-medium mb-1">Tipo de Equipo / Modalidad</label>
                    <Dropdown
                        value={values.tipoEquipo || ''}
                        options={[
                            { label: 'Rayos X convencional', value: 'Rayos X convencional' },
                            { label: 'TAC (Tomografía Axial Computarizada)', value: 'TAC (Tomografía Axial Computarizada)' },
                            { label: 'Mamógrafo', value: 'Mamógrafo' },
                            { label: 'Fluoroscopio / Arco en C', value: 'Fluoroscopio / Arco en C' },
                            { label: 'Densitómetro óseo (DEXA)', value: 'Densitómetro óseo (DEXA)' },
                            { label: 'Gamma cámara / SPECT', value: 'Gamma cámara / SPECT' },
                            { label: 'Ecógrafo', value: 'Ecógrafo' },
                            { label: 'Resonancia Magnética (RM)', value: 'Resonancia Magnética (RM)' }
                        ]}
                        onChange={e => onChange('tipoEquipo', e.value)}
                        placeholder="Seleccione modalidad"
                        className="w-full md:w-96 text-sm bg-white dark:bg-slate-950"
                        disabled={disabled}
                    />
                    {values.tipoEquipo && !esIonizante && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 rounded text-teal-700 dark:text-teal-400 text-xs border border-teal-200 dark:border-teal-800">
                            <i className="pi pi-info-circle" />
                            Equipo no ionizante — los parámetros de radiación y blindaje no aplican.
                        </div>
                    )}
                </div>

                {/* Parámetros de Radiación (solo ionizantes) */}
                {esIonizante && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                            Parámetros de Radiación
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { field: 'tensionPicoKvp', label: 'Tensión pico (kVp)', ph: 'Ej: 40 – 150 kVp' },
                                { field: 'corrienteMa', label: 'Corriente (mA)', ph: 'Ej: 0.5 – 630 mA' },
                                { field: 'tiempoExposicionMs', label: 'Tiempo de exposición (ms)', ph: 'Ej: 1 – 4000 ms' },
                                { field: 'potenciaMaxKw', label: 'Potencia máx. (kW)', ph: 'Ej: 65 kW' },
                                { field: 'dosisEntradaMgy', label: 'Dosis de entrada por exposición (mGy)', ph: 'Ej: 0.1 mGy' },
                                { field: 'filtracionInherenteAlMm', label: 'Filtración inherente (mm Al)', ph: 'Ej: ≥ 2.5 mm Al' },
                                { field: 'distanciaFocoReceptorCm', label: 'Distancia foco-receptor (cm)', ph: 'Ej: 100 cm' }
                            ].map(({ field, label, ph }) => (
                                <div key={field}>
                                    <label className="block text-xs font-medium mb-1">{label}</label>
                                    <InputText value={values[field] || ''} onChange={e => onChange(field, e.target.value)} className="w-full text-sm" placeholder={ph} disabled={disabled} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Licenciamiento SCAN */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-4">
                        <i className="pi pi-shield text-amber-600 dark:text-amber-400" />
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 m-0">
                            Licenciamiento SCAN
                        </h4>
                        <span className="text-xs text-amber-600 dark:text-amber-500">
                            Subsecretaría de Control y Aplicaciones Nucleares — Ecuador
                        </span>
                    </div>

                    {licenciaVencida && (
                        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-950/40 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 text-xs">
                            <i className="pi pi-exclamation-triangle" />
                            <strong>Licencia VENCIDA</strong> — Renueve ante la SCAN antes de operar el equipo.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Número de Licencia SCAN</label>
                            <InputText value={values.numeroLicenciaSCAN || ''} onChange={e => onChange('numeroLicenciaSCAN', e.target.value)} className="w-full text-sm" placeholder="Ej: SCAN-2024-0123" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha de Emisión</label>
                            <Calendar
                                value={values.fechaEmisionLicencia ? new Date(values.fechaEmisionLicencia) : null}
                                onChange={e => onChange('fechaEmisionLicencia', e.value)}
                                dateFormat="dd/mm/yy" showIcon
                                className="w-full text-sm"
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha de Vencimiento</label>
                            <Calendar
                                value={values.fechaVencimientoLicencia ? new Date(values.fechaVencimientoLicencia) : null}
                                onChange={e => onChange('fechaVencimientoLicencia', e.value)}
                                dateFormat="dd/mm/yy" showIcon
                                minDate={values.fechaEmisionLicencia ? new Date(values.fechaEmisionLicencia) : undefined}
                                className={`w-full text-sm ${errors['eqr_licencia_fechas'] ? 'p-invalid' : ''}`}
                                disabled={disabled}
                            />
                            {errors['eqr_licencia_fechas'] && <small className="text-red-500">{errors['eqr_licencia_fechas']}</small>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Titular de la Licencia</label>
                            <InputText value={values.titularLicencia || ''} onChange={e => onChange('titularLicencia', e.target.value)} className="w-full text-sm" placeholder="Nombre de la institución o persona" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Categoría de Fuente SCAN / IAEA</label>
                            <Dropdown
                                value={values.categoriaFuenteSCAN || ''}
                                options={[
                                    { label: 'Categoría 1 — Alta peligrosidad', value: 'Categoría 1' },
                                    { label: 'Categoría 2', value: 'Categoría 2' },
                                    { label: 'Categoría 3', value: 'Categoría 3' },
                                    { label: 'Categoría 4', value: 'Categoría 4' },
                                    { label: 'Categoría 5 — Baja peligrosidad', value: 'Categoría 5' },
                                    { label: 'No aplica', value: 'No aplica' }
                                ]}
                                onChange={e => onChange('categoriaFuenteSCAN', e.value)}
                                placeholder="Seleccione categoría"
                                className="w-full text-sm bg-white dark:bg-slate-950"
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Estado de la Licencia</label>
                            <Dropdown
                                value={values.estadoLicencia || ''}
                                options={[
                                    { label: 'Vigente', value: 'Vigente' },
                                    { label: 'Vencida', value: 'Vencida' },
                                    { label: 'En renovación', value: 'En renovación' },
                                    { label: 'No requiere licencia', value: 'No requiere licencia' }
                                ]}
                                onChange={e => onChange('estadoLicencia', e.value)}
                                placeholder="Seleccione estado"
                                className="w-full text-sm bg-white dark:bg-slate-950"
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Oficial de Protección Radiológica */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Oficial de Protección Radiológica (OPR)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Nombre del OPR</label>
                            <InputText value={values.oprNombre || ''} onChange={e => onChange('oprNombre', e.target.value)} className="w-full text-sm" placeholder="Nombre y apellidos" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Teléfono OPR</label>
                            <InputText value={values.oprTelefono || ''} onChange={e => onChange('oprTelefono', e.target.value)} className="w-full text-sm" placeholder="Ej: 0998765432" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Correo OPR</label>
                            <InputText value={values.oprEmail || ''} onChange={e => onChange('oprEmail', e.target.value)} className="w-full text-sm" placeholder="opr@hep.gob.ec" disabled={disabled} />
                        </div>
                    </div>
                </div>

                {/* Blindaje y Seguridad de Sala (solo ionizantes) */}
                {esIonizante && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                            Blindaje y Seguridad de Sala
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Material de Blindaje</label>
                                <InputText value={values.materialBlindaje || ''} onChange={e => onChange('materialBlindaje', e.target.value)} className="w-full text-sm" placeholder="Ej: Plomo (Pb) / Hormigón barítrico" disabled={disabled} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Grosor de Blindaje (mm Pb equivalente)</label>
                                <InputText value={values.grosorBlindajePbMm || ''} onChange={e => onChange('grosorBlindajePbMm', e.target.value)} className="w-full text-sm" placeholder="Ej: 1.5 mm Pb" disabled={disabled} />
                            </div>
                            <div className="flex items-center gap-3">
                                <InputSwitch checked={values.areaControladaDefinida || false} onChange={e => onChange('areaControladaDefinida', e.value ?? false)} disabled={disabled} />
                                <label className="text-xs font-medium">Área controlada delimitada y señalizada</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <InputSwitch checked={values.planEmergenciaRadiologica || false} onChange={e => onChange('planEmergenciaRadiologica', e.value ?? false)} disabled={disabled} />
                                <label className="text-xs font-medium">Plan de emergencia radiológica vigente</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Control de Calidad */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Control de Calidad y Calibración
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Frecuencia de Calibración</label>
                            <Dropdown
                                value={values.frecuenciaCalibración || ''}
                                options={[
                                    { label: 'Mensual', value: 'Mensual' },
                                    { label: 'Trimestral', value: 'Trimestral' },
                                    { label: 'Semestral', value: 'Semestral' },
                                    { label: 'Anual', value: 'Anual' }
                                ]}
                                onChange={e => onChange('frecuenciaCalibración', e.value)}
                                placeholder="Seleccione frecuencia"
                                className="w-full text-sm bg-white dark:bg-slate-950"
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Laboratorio de Calibración</label>
                            <InputText value={values.laboratorioCalibración || ''} onChange={e => onChange('laboratorioCalibración', e.target.value)} className="w-full text-sm" placeholder="Ej: INSPI / IAEA / laboratorio externo" disabled={disabled} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha último control de calidad</label>
                            <Calendar
                                value={values.fechaUltimoControlCalidad ? new Date(values.fechaUltimoControlCalidad) : null}
                                onChange={e => onChange('fechaUltimoControlCalidad', e.value)}
                                dateFormat="dd/mm/yy" showIcon maxDate={new Date()}
                                className="w-full text-sm"
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha próximo control de calidad</label>
                            <Calendar
                                value={values.fechaProximoControlCalidad ? new Date(values.fechaProximoControlCalidad) : null}
                                onChange={e => onChange('fechaProximoControlCalidad', e.value)}
                                dateFormat="dd/mm/yy" showIcon
                                minDate={values.fechaUltimoControlCalidad ? new Date(values.fechaUltimoControlCalidad) : undefined}
                                className="w-full text-sm"
                                disabled={disabled}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <InputSwitch checked={values.dosimetrosPersonales || false} onChange={e => onChange('dosimetrosPersonales', e.value ?? false)} disabled={disabled} />
                            <label className="text-xs font-medium">Dosímetros personales asignados al personal expuesto</label>
                        </div>
                    </div>
                </div>

                {/* Garantía / Apoyo Tecnológico */}
                <GarantiaMantenimiento
                    tipoPostesion={values.tipoPostesion || 'Propio'}
                    onTipoPostesionChange={v => onChange('tipoPostesion', v)}
                    tieneGarantia={values.tieneGarantia || false}
                    onTieneGarantia={v => onChange('tieneGarantia', v)}
                    fechaFinGarantia={values.fechaFinGarantia}
                    onFechaFinGarantia={v => onChange('fechaFinGarantia', v)}
                    frecuencia={values.frecuenciaMantenimientoPreventivo || ''}
                    onFrecuencia={v => onChange('frecuenciaMantenimientoPreventivo', v)}
                    responsable={values.responsableMantenimiento || ''}
                    onResponsable={v => onChange('responsableMantenimiento', v)}
                    empresaApoyo={values.empresaApoyo || ''}
                    ordenServicio={values.ordenServicio || ''}
                    responsableOrden={values.responsableOrden || ''}
                    fechaInicioProceso={values.fechaInicioProceso}
                    fechaFinProceso={values.fechaFinProceso}
                    onApoyoChange={(field, value) => onChange(field, value)}
                    errorFechas={errors['eqr_proceso_fechas']}
                    disabled={disabled}
                />
            </div>
        );
    };

    if (especificoKey === 'EQM') return renderBiomedicoForm();
    if (especificoKey === 'EQL') return renderLaboratorioForm();
    if (especificoKey === 'EQR') return renderRayosImagenForm();
    if (especificoKey === 'CPU') return renderCpuForm();
    if (especificoKey === 'MON') return renderMonitorForm();
    if (especificoKey === 'TEC') return renderTecladoForm();
    if (especificoKey === 'MOU') return renderMouseForm();
    if (especificoKey === 'IMP') return renderImpresoraRedForm();
    if (especificoKey === 'TEL') return renderTelefonoIpForm();
    if (especificoKey === 'CCTV') return renderCctvForm();
    if (especificoKey === 'AP') return renderAccessPointForm();
    return null;
};
