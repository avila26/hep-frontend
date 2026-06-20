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
import { Checkbox } from 'primereact/checkbox';
import { InputSwitch } from 'primereact/inputswitch';
import { MultiSelect } from 'primereact/multiselect';
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

// ─── Utility validators ────────────────────────────────────────────────────────
const isValidIPv4 = (ip: string): boolean =>
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip.trim());

const isValidMAC = (mac: string): boolean =>
    /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac.trim());

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

type NombreOption = { label: string; value: string };
type NombreGroup = { label: string; options: NombreOption[] };

// ─── Catálogo de Nombres agrupados ────────────────────────────────────────────
const GROUPED_NOMBRE_OPTIONS: NombreGroup[] = [
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
const CATEGORIA_BY_NOMBRE: Record<string, { code: string; label: string }> = {
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

const CAT_MARCA: Record<string, string> = {
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

const MARCAS_POR_CATEGORIA: Record<string, string[]> = {
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

const customNombreSelectStyles = {
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

const isExistingNombreOption = (inputValue: string, options: NombreGroup[]) =>
    options.some(group =>
        group.options.some(option => option.value.toLowerCase() === inputValue.trim().toLowerCase())
    );

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
}

const GarantiaMantenimiento: React.FC<GarantiaMantenimientoProps> = ({
    tipoPostesion, onTipoPostesionChange,
    tieneGarantia, onTieneGarantia, fechaFinGarantia, onFechaFinGarantia,
    frecuencia, onFrecuencia, responsable, onResponsable,
    empresaApoyo, ordenServicio, responsableOrden, fechaInicioProceso, fechaFinProceso, onApoyoChange,
    errorFechas
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
                />
                <Button
                    label="Apoyo Tecnológico"
                    size="small"
                    severity={tipoPostesion === 'ApoyoTecnologico' ? undefined : 'secondary'}
                    outlined={tipoPostesion !== 'ApoyoTecnologico'}
                    onClick={() => onTipoPostesionChange('ApoyoTecnologico')}
                    type="button"
                    icon="pi pi-users"
                />
            </div>
        </div>

        {tipoPostesion === 'Propio' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                    <label className="text-xs font-medium">¿Tiene Garantía?</label>
                    <InputSwitch
                        checked={tieneGarantia}
                        onChange={e => onTieneGarantia(e.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Fecha Fin de Garantía</label>
                    <Calendar
                        value={fechaFinGarantia ?? null}
                        onChange={e => onFechaFinGarantia(e.value as Date | null)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        disabled={!tieneGarantia}
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
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Responsable Mantenimiento</label>
                    <InputText
                        value={responsable}
                        onChange={e => onResponsable(e.target.value)}
                        className="w-full text-sm"
                        placeholder="Responsable técnico"
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
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Orden de Servicio</label>
                    <InputText
                        value={ordenServicio}
                        onChange={e => onApoyoChange('ordenServicio', e.target.value)}
                        className="w-full text-sm"
                        placeholder="Ej: OS-2026-00123"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Responsable de la Orden</label>
                    <InputText
                        value={responsableOrden}
                        onChange={e => onApoyoChange('responsableOrden', e.target.value)}
                        className="w-full text-sm"
                        placeholder="Nombre del responsable"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Fecha de Inicio de Proceso</label>
                    <Calendar
                        value={fechaInicioProceso ?? null}
                        onChange={e => onApoyoChange('fechaInicioProceso', e.value)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        className="w-full text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Fecha de Fin de Proceso</label>
                    <Calendar
                        value={fechaFinProceso ?? null}
                        onChange={e => onApoyoChange('fechaFinProceso', e.value)}
                        dateFormat="dd/mm/yy"
                        showIcon
                        minDate={fechaInicioProceso ?? undefined}
                        className={`w-full text-sm ${errorFechas ? 'p-invalid' : ''}`}
                    />
                    {errorFechas && <small className="text-red-500">{errorFechas}</small>}
                </div>
            </div>
        )}
    </div>
);

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

    // ─── Estado inicial para cada tipo de atributo ────────────────────────────
    const initialBiomedicoState = (): AtributosEquipoBiomedico => ({
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

    const initialCPUState = (): AtributosCPU => ({
        procesadorMarca: '', procesadorTipo: '', numeroProcesadores: '', numeroNucleos: '',
        ramMarca: '', ramCapacidad: '', ramTipo: '',
        almacenamientoMarca: '', almacenamientoCapacidad: '',
        tarjetaMadreMarca: '', tarjetaMadreModelo: '',
        redHabilitada: false, interfacesRed: [],
        sistemaOperativoNombre: '', sistemaOperativoVersion: '', sistemaOperativoLicencia: '',
        softwareOfimaticoNombre: '', softwareOfimaticoVersion: '',
        usuarioAcceso: '', passwordAcceso: '', conjuntoEstacion: ''
    });

    const initialMonitorState = (): AtributosMonitor => ({ pulgadas: '', conjuntoEstacion: '' });
    const initialTecladoState = (): AtributosTeclado => ({ interfaz: '', conjuntoEstacion: '' });
    const initialMouseState = (): AtributosMouse => ({ interfaz: '', conjuntoEstacion: '' });
    const initialImpresoraRedState = (): AtributosImpresoraRed => ({
        ip: '', mac: '', nombreImpresora: '', correoAsociado: '', contador: null, usuarioPuerto: ''
    });
    const initialTelefonoIpState = (): AtributosTelefonoIp => ({
        extension: '', ip: '', mac: '', responsables: '', especialidad: ''
    });
    const initialCCTVState = (): AtributosCCTV => ({
        tipoDispositivo: '', ip: '', etiquetaPunto: ''
    });
    const initialAccessPointState = (): AtributosAccessPoint => ({
        mac: '', codHSN: '', etiquetaPunto: '', puertoSwitch: ''
    });
    const initialLaboratorioState = (): AtributosLaboratorio => ({
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

    const initialRayosImagenState = (): AtributosRayosImagen => ({
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

    // ─── Estado auxiliar para red (CPU) ──────────────────────────────────────
    const [nuevoAccesorioNombre, setNuevoAccesorioNombre] = useState('');
    const [nuevoAccesorioEstado, setNuevoAccesorioEstado] = useState('Bueno');
    const [nuevaInterfazTipo, setNuevaInterfazTipo] = useState<'LAN' | 'WAN' | 'Wireless'>('LAN');
    const [nuevaInterfazVlan, setNuevaInterfazVlan] = useState('');
    const [nuevaInterfazIdVlan, setNuevaInterfazIdVlan] = useState('');
    const [nuevaInterfazRed, setNuevaInterfazRed] = useState('');
    const [nuevaInterfazIp, setNuevaInterfazIp] = useState('');
    const [nuevaInterfazGateway, setNuevaInterfazGateway] = useState('');
    const [nuevaInterfazMac, setNuevaInterfazMac] = useState('');
    const [nuevaInterfazEstado, setNuevaInterfazEstado] = useState('Activo');

    // ─── Handlers genéricos ───────────────────────────────────────────────────
    const handleBiomedicoChange = (field: keyof AtributosEquipoBiomedico, value: any) =>
        setAtributosEquipoBiomedico(prev => ({ ...prev, [field]: value }));

    const handleBiomedicoProviderChange = (
        providerKey: 'fabricante' | 'proveedorConsumibles' | 'proveedorMantenimiento' | 'proveedorCalibracion',
        field: string, value: string
    ) => setAtributosEquipoBiomedico(prev => ({
        ...prev,
        [providerKey]: { ...(prev[providerKey] || { nombre: '', direccion: '', telefono: '', email: '' }), [field]: value }
    }));

    const handleCPUChange = (field: keyof AtributosCPU, value: any) =>
        setAtributosCPU(prev => ({ ...prev, [field]: value }));

    const handleMonitorChange = (field: keyof AtributosMonitor, value: any) =>
        setAtributosMonitor(prev => ({ ...prev, [field]: value }));

    const handleTecladoChange = (field: keyof AtributosTeclado, value: any) =>
        setAtributosTeclado(prev => ({ ...prev, [field]: value }));

    const handleMouseChange = (field: keyof AtributosMouse, value: any) =>
        setAtributosMouse(prev => ({ ...prev, [field]: value }));

    const handleImpresoraRedChange = (field: keyof AtributosImpresoraRed, value: any) =>
        setAtributosImpresoraRed(prev => ({ ...prev, [field]: value }));

    const handleTelefonoIpChange = (field: keyof AtributosTelefonoIp, value: any) =>
        setAtributosTelefonoIp(prev => ({ ...prev, [field]: value }));

    const handleCCTVChange = (field: keyof AtributosCCTV, value: any) =>
        setAtributosCCTV(prev => ({ ...prev, [field]: value }));

    const handleAccessPointChange = (field: keyof AtributosAccessPoint, value: any) =>
        setAtributosAccessPoint(prev => ({ ...prev, [field]: value }));

    const handleLaboratorioChange = (field: keyof AtributosLaboratorio, value: any) =>
        setAtributosLaboratorio(prev => ({ ...prev, [field]: value }));

    const handleRayosImagenChange = (field: keyof AtributosRayosImagen, value: any) =>
        setAtributosRayosImagen(prev => ({ ...prev, [field]: value }));

    // ─── Accesorios (Biomédico) ───────────────────────────────────────────────
    const agregarAccesorio = () => {
        if (!nuevoAccesorioNombre.trim()) return;
        setAtributosEquipoBiomedico(prev => ({
            ...prev,
            accesorios: [...(prev.accesorios || []), { nombre: nuevoAccesorioNombre.trim(), estado: nuevoAccesorioEstado }]
        }));
        setNuevoAccesorioNombre('');
        setNuevoAccesorioEstado('Bueno');
    };
    const eliminarAccesorio = (index: number) =>
        setAtributosEquipoBiomedico(prev => ({
            ...prev,
            accesorios: (prev.accesorios || []).filter((_, i) => i !== index)
        }));

    // ─── Interfaces de red (CPU) ──────────────────────────────────────────────
    const agregarInterfazRed = () => {
        setAtributosCPU(prev => ({
            ...prev,
            interfacesRed: [
                ...(prev.interfacesRed || []),
                {
                    tipo: nuevaInterfazTipo,
                    vlan: nuevaInterfazVlan.trim(),
                    idVlan: nuevaInterfazIdVlan.trim(),
                    red: nuevaInterfazRed.trim(),
                    ip: nuevaInterfazIp.trim(),
                    gateway: nuevaInterfazGateway.trim(),
                    mac: nuevaInterfazMac.trim(),
                    estado: nuevaInterfazEstado
                }
            ]
        }));
        setNuevaInterfazTipo('LAN');
        setNuevaInterfazVlan('');
        setNuevaInterfazIdVlan('');
        setNuevaInterfazRed('');
        setNuevaInterfazIp('');
        setNuevaInterfazGateway('');
        setNuevaInterfazMac('');
        setNuevaInterfazEstado('Activo');
    };
    const eliminarInterfazRed = (index: number) =>
        setAtributosCPU(prev => ({
            ...prev,
            interfacesRed: (prev.interfacesRed || []).filter((_, i) => i !== index)
        }));

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

    // Determina qué bloque específico mostrar (categoría + nombre)
    const NOMBRES_CPU = new Set(['CPU / Unidad Central', 'Laptop', 'Tablet', 'Servidor']);

    const getEspecificoKey = (): string => {
        const cat = getCategoryCodeFromLabel(formData.categoriaActivo);
        const nom = formData.nombre;
        if (cat === 'EQM') return 'EQM';
        if (cat === 'EQL') return 'EQL';
        if (cat === 'EQR') return 'EQR';
        if (cat === 'EQI') {
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
                            { field: 'voltaje' as const, label: 'Voltaje', ph: 'Ej: 110V / 220V' },
                            { field: 'numeroFases' as const, label: 'Número de Fases', ph: 'Ej: Monofásico' },
                            { field: 'corriente' as const, label: 'Corriente', ph: 'Ej: 5 A' },
                            { field: 'potencia' as const, label: 'Potencia', ph: 'Ej: 1200 W' },
                            { field: 'frecuencia' as const, label: 'Frecuencia', ph: 'Ej: 60 Hz' },
                            { field: 'bateria' as const, label: 'Batería', ph: 'Ej: Litio 12V 7Ah' },
                            { field: 'numeroCanales' as const, label: 'Número de Canales', ph: 'Ej: 12' },
                            { field: 'memoria' as const, label: 'Memoria', ph: 'Ej: 32 GB' },
                            { field: 'tipoImpresora' as const, label: 'Tipo de Impresora integrada', ph: 'Ej: Térmica integrada' }
                        ].map(({ field, label, ph }) => (
                            <div key={field}>
                                <label className="block text-xs font-medium mb-1">{label}</label>
                                <InputText
                                    value={atributosEquipoBiomedico[field] as string || ''}
                                    onChange={e => handleBiomedicoChange(field, e.target.value)}
                                    className="w-full text-sm" placeholder={ph}
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
                            value={atributosEquipoBiomedico.requerimientosFuncionamiento || []}
                            options={['Eléctrico','Mecánico','Electrónico','Hidráulico','Neumático','Electromecánico','Gases Medicinales','Otro'].map(v => ({ label: v, value: v }))}
                            onChange={e => handleBiomedicoChange('requerimientosFuncionamiento', e.value)}
                            placeholder="Seleccione requerimientos" display="chip"
                            className="w-full text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950"
                        />
                        {atributosEquipoBiomedico.requerimientosFuncionamiento?.includes('Otro') && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium mb-1">Especifique "Otro"</label>
                                <InputText
                                    value={atributosEquipoBiomedico.requerimientoOtroDetalle || ''}
                                    onChange={e => handleBiomedicoChange('requerimientoOtroDetalle', e.target.value)}
                                    placeholder="Detalle otro requerimiento" className="w-full text-sm"
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                            Parámetros Medidos / Transmitidos
                        </h4>
                        <MultiSelect
                            value={atributosEquipoBiomedico.parametrosMedidos || []}
                            options={['ECG','SPO2','Frecuencia Cardíaca','Temperatura','Presión No Invasiva','O2','Frecuencia Respiratoria','Arritmia','Otro'].map(v => ({ label: v, value: v }))}
                            onChange={e => handleBiomedicoChange('parametrosMedidos', e.value)}
                            placeholder="Seleccione parámetros" display="chip"
                            className="w-full text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950"
                        />
                        {atributosEquipoBiomedico.parametrosMedidos?.includes('Otro') && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium mb-1">Especifique "Otro"</label>
                                <InputText
                                    value={atributosEquipoBiomedico.parametroOtroDetalle || ''}
                                    onChange={e => handleBiomedicoChange('parametroOtroDetalle', e.target.value)}
                                    placeholder="Detalle otro parámetro" className="w-full text-sm"
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
                                        <InputText value={atributosEquipoBiomedico[key]?.nombre || ''} onChange={e => handleBiomedicoProviderChange(key, 'nombre', e.target.value)} className="w-full text-sm" placeholder="Nombre" /></div>
                                    <div><label className="block text-xs font-medium mb-1">Dirección</label>
                                        <InputText value={atributosEquipoBiomedico[key]?.direccion || ''} onChange={e => handleBiomedicoProviderChange(key, 'direccion', e.target.value)} className="w-full text-sm" placeholder="Dirección" /></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-xs font-medium mb-1">Teléfono</label>
                                            <InputText value={atributosEquipoBiomedico[key]?.telefono || ''} onChange={e => handleBiomedicoProviderChange(key, 'telefono', e.target.value)} className="w-full text-sm" placeholder="Teléfono" /></div>
                                        <div><label className="block text-xs font-medium mb-1">Email</label>
                                            <InputText value={atributosEquipoBiomedico[key]?.email || ''} onChange={e => handleBiomedicoProviderChange(key, 'email', e.target.value)} className="w-full text-sm" placeholder="Email" /></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Garantía / Apoyo Tecnológico */}
                <GarantiaMantenimiento
                    tipoPostesion={atributosEquipoBiomedico.tipoPostesion || 'Propio'}
                    onTipoPostesionChange={v => handleBiomedicoChange('tipoPostesion', v)}
                    tieneGarantia={atributosEquipoBiomedico.tieneGarantia || false}
                    onTieneGarantia={v => handleBiomedicoChange('tieneGarantia', v)}
                    fechaFinGarantia={atributosEquipoBiomedico.fechaFinGarantia}
                    onFechaFinGarantia={v => handleBiomedicoChange('fechaFinGarantia', v)}
                    frecuencia={atributosEquipoBiomedico.frecuenciaMantenimientoPreventivo || ''}
                    onFrecuencia={v => handleBiomedicoChange('frecuenciaMantenimientoPreventivo', v)}
                    responsable={atributosEquipoBiomedico.responsableMantenimiento || ''}
                    onResponsable={v => handleBiomedicoChange('responsableMantenimiento', v)}
                    empresaApoyo={atributosEquipoBiomedico.empresaApoyo || ''}
                    ordenServicio={atributosEquipoBiomedico.ordenServicio || ''}
                    responsableOrden={atributosEquipoBiomedico.responsableOrden || ''}
                    fechaInicioProceso={atributosEquipoBiomedico.fechaInicioProceso}
                    fechaFinProceso={atributosEquipoBiomedico.fechaFinProceso}
                    onApoyoChange={(field, value) => handleBiomedicoChange(field as keyof AtributosEquipoBiomedico, value)}
                    errorFechas={errors['bio_fechas']}
                />

                {/* Accesorios */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Accesorios del Equipo
                    </h4>
                    <div className="flex flex-col md:flex-row gap-3 items-end mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium mb-1">Nombre del Accesorio</label>
                            <InputText value={nuevoAccesorioNombre} onChange={e => setNuevoAccesorioNombre(e.target.value)} placeholder="Ej: Sensor SpO2 adulto" className="w-full text-sm" />
                        </div>
                        <div style={{ width: '180px' }}>
                            <label className="block text-xs font-medium mb-1">Estado</label>
                            <Dropdown value={nuevoAccesorioEstado} options={[{ label: 'Bueno', value: 'Bueno' }, { label: 'Regular', value: 'Regular' }, { label: 'Malo', value: 'Malo' }]} onChange={e => setNuevoAccesorioEstado(e.value)} className="w-full text-sm bg-white dark:bg-slate-950" />
                        </div>
                        <Button label="Agregar Accesorio" icon="pi pi-plus" size="small" severity="info" outlined onClick={agregarAccesorio} />
                    </div>
                    {(!atributosEquipoBiomedico.accesorios || atributosEquipoBiomedico.accesorios.length === 0) ? (
                        <div className="text-center py-4 bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-500 m-0">No se han registrado accesorios.</p>
                        </div>
                    ) : (
                        <div className="max-w-xl rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                                    <tr><th className="px-3 py-2 text-left">Accesorio</th><th className="px-3 py-2 text-left" style={{ width: 120 }}>Estado</th><th className="px-3 py-2 text-center" style={{ width: 60 }}>Acción</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                                    {atributosEquipoBiomedico.accesorios.map((acc, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2 font-medium">{acc.nombre}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${acc.estado === 'Bueno' ? 'bg-green-100 text-green-800' : acc.estado === 'Regular' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{acc.estado}</span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <Button icon="pi pi-trash" severity="danger" text rounded size="small" onClick={() => eliminarAccesorio(idx)} />
                                            </td>
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
                                        let sel = [...(atributosEquipoBiomedico.informacionTecnica || [])];
                                        if (e.checked) sel.push(opt); else sel = sel.filter(i => i !== opt);
                                        handleBiomedicoChange('informacionTecnica', sel);
                                    }}
                                    checked={atributosEquipoBiomedico.informacionTecnica?.includes(opt) || false}
                                />
                                <label htmlFor={`info-${opt}`} className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">{opt}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render: CPU / Unidad Central (y Laptop, Tablet, Servidor) ─────────────
    const renderCpuForm = () => {
        const isCPUAncla = formData.nombre === 'CPU / Unidad Central';
        return (
            <div className="space-y-6">
                {/* Conjunto / Estación */}
                {isCPUAncla && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                        <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                            <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo (opcional)
                        </label>
                        <InputText
                            value={atributosCPU.conjuntoEstacion || ''}
                            onChange={e => handleCPUChange('conjuntoEstacion', e.target.value)}
                            className="w-full text-sm"
                            placeholder="Código institucional del conjunto ancla (ej. CI-2026-0001)"
                        />
                        <small className="text-xs text-blue-500 dark:text-blue-400">
                            Si este CPU es el ancla de un conjunto, puede dejar este campo vacío. Ingrese un código si pertenece a un conjunto ya registrado.
                        </small>
                    </div>
                )}

                {/* Componentes Internos */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                        Componentes Internos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1">Marca del Procesador</label>
                            <InputText value={atributosCPU.procesadorMarca || ''} onChange={e => handleCPUChange('procesadorMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Intel / AMD" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de Procesador</label>
                            <InputText value={atributosCPU.procesadorTipo || ''} onChange={e => handleCPUChange('procesadorTipo', e.target.value)} className="w-full text-sm" placeholder="Ej: Core i7-12700H" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">Cant. CPU</label>
                                <InputText value={atributosCPU.numeroProcesadores || ''} onChange={e => handleCPUChange('numeroProcesadores', e.target.value)} className="w-full text-sm" placeholder="Ej: 1" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Cant. Núcleos</label>
                                <InputText value={atributosCPU.numeroNucleos || ''} onChange={e => handleCPUChange('numeroNucleos', e.target.value)} className="w-full text-sm" placeholder="Ej: 8" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Marca de RAM</label>
                            <InputText value={atributosCPU.ramMarca || ''} onChange={e => handleCPUChange('ramMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Kingston" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Capacidad de RAM</label>
                            <InputText value={atributosCPU.ramCapacidad || ''} onChange={e => handleCPUChange('ramCapacidad', e.target.value)} className="w-full text-sm" placeholder="Ej: 16 GB" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Tipo de RAM</label>
                            <InputText value={atributosCPU.ramTipo || ''} onChange={e => handleCPUChange('ramTipo', e.target.value)} className="w-full text-sm" placeholder="Ej: DDR4 / DDR5" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Marca de Disco</label>
                            <InputText value={atributosCPU.almacenamientoMarca || ''} onChange={e => handleCPUChange('almacenamientoMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Western Digital" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Capacidad Almacenamiento</label>
                            <InputText value={atributosCPU.almacenamientoCapacidad || ''} onChange={e => handleCPUChange('almacenamientoCapacidad', e.target.value)} className="w-full text-sm" placeholder="Ej: 512 GB SSD" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">Marca Placa Madre</label>
                                <InputText value={atributosCPU.tarjetaMadreMarca || ''} onChange={e => handleCPUChange('tarjetaMadreMarca', e.target.value)} className="w-full text-sm" placeholder="Marca" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Modelo Placa Madre</label>
                                <InputText value={atributosCPU.tarjetaMadreModelo || ''} onChange={e => handleCPUChange('tarjetaMadreModelo', e.target.value)} className="w-full text-sm" placeholder="Modelo" />
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
                        <InputSwitch checked={atributosCPU.redHabilitada || false} onChange={e => handleCPUChange('redHabilitada', e.value)} />
                    </div>
                    {atributosCPU.redHabilitada && (
                        <div className="space-y-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                                    <Button label="Agregar Interfaz" icon="pi pi-plus" size="small" severity="info" outlined onClick={agregarInterfazRed} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Interfaces Configuradas</h5>
                                {(!atributosCPU.interfacesRed || atributosCPU.interfacesRed.length === 0) ? (
                                    <div className="text-center py-4 bg-white dark:bg-slate-950 rounded border border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-xs text-slate-500 m-0">No se han registrado interfaces de red.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
                                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                                                <tr><th className="px-3 py-2 text-left">Tipo</th><th className="px-3 py-2 text-left">VLAN (ID)</th><th className="px-3 py-2 text-left">Red</th><th className="px-3 py-2 text-left">IP</th><th className="px-3 py-2 text-left">Gateway</th><th className="px-3 py-2 text-left">MAC</th><th className="px-3 py-2 text-left">Estado</th><th className="px-3 py-2 text-center" style={{ width: 50 }}>Acción</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                                                {atributosCPU.interfacesRed!.map((intf, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2 font-semibold text-blue-600 dark:text-blue-400">{intf.tipo}</td>
                                                        <td className="px-3 py-2">{intf.vlan || '-'} {intf.idVlan ? `(${intf.idVlan})` : ''}</td>
                                                        <td className="px-3 py-2">{intf.red || '-'}</td>
                                                        <td className="px-3 py-2 font-mono">{intf.ip || '-'}</td>
                                                        <td className="px-3 py-2 font-mono">{intf.gateway || '-'}</td>
                                                        <td className="px-3 py-2 font-mono">{intf.mac || '-'}</td>
                                                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${intf.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{intf.estado}</span></td>
                                                        <td className="px-3 py-2 text-center"><Button icon="pi pi-trash" severity="danger" text rounded size="small" onClick={() => eliminarInterfazRed(idx)} /></td>
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
                            <InputText value={atributosCPU.sistemaOperativoNombre || ''} onChange={e => handleCPUChange('sistemaOperativoNombre', e.target.value)} className="w-full text-sm" placeholder="Ej: Windows 11 Pro" /></div>
                        <div><label className="block text-xs font-medium mb-1">Versión Sistema Operativo</label>
                            <InputText value={atributosCPU.sistemaOperativoVersion || ''} onChange={e => handleCPUChange('sistemaOperativoVersion', e.target.value)} className="w-full text-sm" placeholder="Ej: 23H2" /></div>
                        <div><label className="block text-xs font-medium mb-1">Licencia S.O.</label>
                            <InputText value={atributosCPU.sistemaOperativoLicencia || ''} onChange={e => handleCPUChange('sistemaOperativoLicencia', e.target.value)} className="w-full text-sm" placeholder="Ej: OEM / Retail / Libre" /></div>
                        <div><label className="block text-xs font-medium mb-1">Software Ofimático</label>
                            <InputText value={atributosCPU.softwareOfimaticoNombre || ''} onChange={e => handleCPUChange('softwareOfimaticoNombre', e.target.value)} className="w-full text-sm" placeholder="Ej: Microsoft Office 2021 LTSC" /></div>
                        <div><label className="block text-xs font-medium mb-1">Versión Ofimática</label>
                            <InputText value={atributosCPU.softwareOfimaticoVersion || ''} onChange={e => handleCPUChange('softwareOfimaticoVersion', e.target.value)} className="w-full text-sm" placeholder="Ej: 16.0" /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="block text-xs font-medium mb-1">Usuario Acceso</label>
                                <InputText value={atributosCPU.usuarioAcceso || ''} onChange={e => handleCPUChange('usuarioAcceso', e.target.value)} className="w-full text-sm" placeholder="Usuario" /></div>
                            <div><label className="block text-xs font-medium mb-1">Password Acceso</label>
                                <InputText value={atributosCPU.passwordAcceso || ''} onChange={e => handleCPUChange('passwordAcceso', e.target.value)} className="w-full text-sm" placeholder="Contraseña" type="password" /></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render: Monitor ──────────────────────────────────────────────────────
    const renderMonitorForm = () => (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo
                </label>
                <InputText value={atributosMonitor.conjuntoEstacion || ''} onChange={e => handleMonitorChange('conjuntoEstacion', e.target.value)} className="w-full text-sm" placeholder="Código institucional del CPU (ej. CI-2026-0001)" />
                <small className="text-xs text-blue-500">Ingrese el código del CPU al que pertenece este monitor.</small>
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Pulgadas / Tamaño de Pantalla</label>
                <InputText value={atributosMonitor.pulgadas || ''} onChange={e => handleMonitorChange('pulgadas', e.target.value)} className="w-full text-sm" placeholder='Ej: 24" / 27"' />
            </div>
        </div>
    );

    // ─── Render: Teclado ──────────────────────────────────────────────────────
    const renderTecladoForm = () => (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo
                </label>
                <InputText value={atributosTeclado.conjuntoEstacion || ''} onChange={e => handleTecladoChange('conjuntoEstacion', e.target.value)} className="w-full text-sm" placeholder="Código institucional del CPU (ej. CI-2026-0001)" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Tipo de Interfaz</label>
                <Dropdown value={atributosTeclado.interfaz || ''} options={[{ label: 'USB', value: 'USB' }, { label: 'PS/2', value: 'PS/2' }, { label: 'Inalámbrico', value: 'Inalámbrico' }, { label: 'Bluetooth', value: 'Bluetooth' }]} onChange={e => handleTecladoChange('interfaz', e.value)} placeholder="Seleccione interfaz" className="w-full text-sm bg-white dark:bg-slate-950" />
            </div>
        </div>
    );

    // ─── Render: Mouse ────────────────────────────────────────────────────────
    const renderMouseForm = () => (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <label className="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    <i className="pi pi-link mr-1" /> Conjunto / Estación de Trabajo
                </label>
                <InputText value={atributosMouse.conjuntoEstacion || ''} onChange={e => handleMouseChange('conjuntoEstacion', e.target.value)} className="w-full text-sm" placeholder="Código institucional del CPU (ej. CI-2026-0001)" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Tipo de Interfaz</label>
                <Dropdown value={atributosMouse.interfaz || ''} options={[{ label: 'USB', value: 'USB' }, { label: 'PS/2', value: 'PS/2' }, { label: 'Inalámbrico', value: 'Inalámbrico' }, { label: 'Bluetooth', value: 'Bluetooth' }]} onChange={e => handleMouseChange('interfaz', e.value)} placeholder="Seleccione interfaz" className="w-full text-sm bg-white dark:bg-slate-950" />
            </div>
        </div>
    );

    // ─── Render: Impresora de Red ─────────────────────────────────────────────
    const renderImpresoraRedForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Dirección IP</label>
                <InputText value={atributosImpresoraRed.ip || ''} onChange={e => handleImpresoraRedChange('ip', e.target.value)} className={`w-full text-sm ${errors['imp_ip'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.1.100" />
                {errors['imp_ip'] && <small className="text-red-500">{errors['imp_ip']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                <InputText value={atributosImpresoraRed.mac || ''} onChange={e => handleImpresoraRedChange('mac', e.target.value)} className={`w-full text-sm ${errors['imp_mac'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
                {errors['imp_mac'] && <small className="text-red-500">{errors['imp_mac']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Nombre de Impresora (convención HEP)</label>
                <InputText value={atributosImpresoraRed.nombreImpresora || ''} onChange={e => handleImpresoraRedChange('nombreImpresora', e.target.value)} className="w-full text-sm" placeholder="Ej: A100_IMP_LEXMARK_MS331" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Correo Asociado</label>
                <InputText value={atributosImpresoraRed.correoAsociado || ''} onChange={e => handleImpresoraRedChange('correoAsociado', e.target.value)} className="w-full text-sm" placeholder="correo@hep.gob.ec" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Contador de páginas</label>
                <InputNumber value={atributosImpresoraRed.contador ?? null} onValueChange={e => handleImpresoraRedChange('contador', e.value)} className="w-full text-sm" placeholder="0" min={0} />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Usuario / Puerto de Red</label>
                <InputText value={atributosImpresoraRed.usuarioPuerto || ''} onChange={e => handleImpresoraRedChange('usuarioPuerto', e.target.value)} className="w-full text-sm" placeholder="Ej: admin / Puerto 9100" />
            </div>
        </div>
    );

    // ─── Render: Teléfono IP ──────────────────────────────────────────────────
    const renderTelefonoIpForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Extensión</label>
                <InputText value={atributosTelefonoIp.extension || ''} onChange={e => handleTelefonoIpChange('extension', e.target.value)} className="w-full text-sm" placeholder="Ej: 1234" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección IP</label>
                <InputText value={atributosTelefonoIp.ip || ''} onChange={e => handleTelefonoIpChange('ip', e.target.value)} className={`w-full text-sm ${errors['tel_ip'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.1.50" />
                {errors['tel_ip'] && <small className="text-red-500">{errors['tel_ip']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                <InputText value={atributosTelefonoIp.mac || ''} onChange={e => handleTelefonoIpChange('mac', e.target.value)} className={`w-full text-sm ${errors['tel_mac'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
                {errors['tel_mac'] && <small className="text-red-500">{errors['tel_mac']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Responsable(s) de la extensión</label>
                <InputText value={atributosTelefonoIp.responsables || ''} onChange={e => handleTelefonoIpChange('responsables', e.target.value)} className="w-full text-sm" placeholder="Nombre del responsable" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Especialidad (del responsable)</label>
                <InputText value={atributosTelefonoIp.especialidad || ''} onChange={e => handleTelefonoIpChange('especialidad', e.target.value)} className="w-full text-sm" placeholder="Ej: Medicina Interna" />
            </div>
        </div>
    );

    // ─── Render: CCTV / NVR ───────────────────────────────────────────────────
    const renderCctvForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Tipo de Dispositivo</label>
                <Dropdown value={atributosCCTV.tipoDispositivo || ''} options={[{ label: 'Cámara fija', value: 'Cámara fija' }, { label: 'Cámara PTZ', value: 'Cámara PTZ' }, { label: 'NVR', value: 'NVR' }]} onChange={e => handleCCTVChange('tipoDispositivo', e.value)} placeholder="Seleccione tipo" className="w-full text-sm bg-white dark:bg-slate-950" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Dirección IP</label>
                <InputText value={atributosCCTV.ip || ''} onChange={e => handleCCTVChange('ip', e.target.value)} className={`w-full text-sm ${errors['cctv_ip'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.5.10" />
                {errors['cctv_ip'] && <small className="text-red-500">{errors['cctv_ip']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Etiqueta del Punto de Datos</label>
                <InputText value={atributosCCTV.etiquetaPunto || ''} onChange={e => handleCCTVChange('etiquetaPunto', e.target.value)} className="w-full text-sm" placeholder="Ej: PD-CCTV-A3-01" />
            </div>
        </div>
    );

    // ─── Render: Access Point / WiFi ──────────────────────────────────────────
    const renderAccessPointForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium mb-1">Dirección MAC</label>
                <InputText value={atributosAccessPoint.mac || ''} onChange={e => handleAccessPointChange('mac', e.target.value)} className={`w-full text-sm ${errors['ap_mac'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
                {errors['ap_mac'] && <small className="text-red-500">{errors['ap_mac']}</small>}
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Cod HSN</label>
                <InputText value={atributosAccessPoint.codHSN || ''} onChange={e => handleAccessPointChange('codHSN', e.target.value)} className="w-full text-sm" placeholder="Ej: HSN-AP-001" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Etiqueta de Punto de Datos</label>
                <InputText value={atributosAccessPoint.etiquetaPunto || ''} onChange={e => handleAccessPointChange('etiquetaPunto', e.target.value)} className="w-full text-sm" placeholder="Ej: PD-AP-B2-03" />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Puerto de Switch (WS)</label>
                <InputText value={atributosAccessPoint.puertoSwitch || ''} onChange={e => handleAccessPointChange('puertoSwitch', e.target.value)} className="w-full text-sm" placeholder="Ej: WS-SW01-Gi0/14" />
            </div>
        </div>
    );

    // ─── Render: Equipo de Laboratorio (EQL) ──────────────────────────────────
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
                        <InputText value={atributosLaboratorio.tipoDispositivo || ''} onChange={e => handleLaboratorioChange('tipoDispositivo', e.target.value)} className="w-full text-sm" placeholder="Ej: PC, Gasómetro, Coba c311" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Marca / Serie del CPU o Dispositivo</label>
                        <InputText value={atributosLaboratorio.marcaSerieCPU || ''} onChange={e => handleLaboratorioChange('marcaSerieCPU', e.target.value)} className="w-full text-sm" placeholder="Ej: HP / SN12345" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Marca / Serie del Monitor asociado</label>
                        <InputText value={atributosLaboratorio.marcaSerieMonitor || ''} onChange={e => handleLaboratorioChange('marcaSerieMonitor', e.target.value)} className="w-full text-sm" placeholder="Ej: Dell / SN67890 (si aplica)" />
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
                                <InputText value={atributosLaboratorio.ipLanHospital || ''} onChange={e => handleLaboratorioChange('ipLanHospital', e.target.value)} className={`w-full text-sm ${errors['lab_ip1'] ? 'p-invalid' : ''}`} placeholder="Ej: 192.168.10.50" />
                                {errors['lab_ip1'] && <small className="text-red-500">{errors['lab_ip1']}</small>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">MAC</label>
                                <InputText value={atributosLaboratorio.macLanHospital || ''} onChange={e => handleLaboratorioChange('macLanHospital', e.target.value)} className={`w-full text-sm ${errors['lab_mac1'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
                                {errors['lab_mac1'] && <small className="text-red-500">{errors['lab_mac1']}</small>}
                            </div>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">LAN Equipos Biomédicos</h5>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">IP</label>
                                <InputText value={atributosLaboratorio.ipLanBiomedica || ''} onChange={e => handleLaboratorioChange('ipLanBiomedica', e.target.value)} className={`w-full text-sm ${errors['lab_ip2'] ? 'p-invalid' : ''}`} placeholder="Ej: 10.0.2.50" />
                                {errors['lab_ip2'] && <small className="text-red-500">{errors['lab_ip2']}</small>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">MAC</label>
                                <InputText value={atributosLaboratorio.macLanBiomedica || ''} onChange={e => handleLaboratorioChange('macLanBiomedica', e.target.value)} className={`w-full text-sm ${errors['lab_mac2'] ? 'p-invalid' : ''}`} placeholder="Ej: AA:BB:CC:DD:EE:FF" />
                                {errors['lab_mac2'] && <small className="text-red-500">{errors['lab_mac2']}</small>}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Puerto de Conexión</label>
                        <InputText value={atributosLaboratorio.puertoCnx || ''} onChange={e => handleLaboratorioChange('puertoCnx', e.target.value)} className="w-full text-sm" placeholder="Ej: SW01-Gi0/05" />
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
                        <InputText value={atributosLaboratorio.usuario || ''} onChange={e => handleLaboratorioChange('usuario', e.target.value)} className="w-full text-sm" placeholder="Usuario" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Password del Equipo
                            <span className="ml-2 text-orange-500 text-[10px] font-normal">⚠ Se almacena en texto plano localmente</span>
                        </label>
                        <InputText value={atributosLaboratorio.password || ''} onChange={e => handleLaboratorioChange('password', e.target.value)} className="w-full text-sm" placeholder="Contraseña" type="password" />
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
                        <InputSwitch checked={atributosLaboratorio.licenciaWindows || false} onChange={e => handleLaboratorioChange('licenciaWindows', e.value)} />
                        <label className="text-xs font-medium">Licenciamiento Windows</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <InputSwitch checked={atributosLaboratorio.antivirus || false} onChange={e => handleLaboratorioChange('antivirus', e.value)} />
                        <label className="text-xs font-medium">Antivirus instalado</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <InputSwitch checked={atributosLaboratorio.firewall || false} onChange={e => handleLaboratorioChange('firewall', e.value)} />
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
                        <InputText value={atributosLaboratorio.impresoraAsociadaMarca || ''} onChange={e => handleLaboratorioChange('impresoraAsociadaMarca', e.target.value)} className="w-full text-sm" placeholder="Ej: Zebra / Epson" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Número de Serie</label>
                        <InputText value={atributosLaboratorio.impresoraAsociadaSerie || ''} onChange={e => handleLaboratorioChange('impresoraAsociadaSerie', e.target.value)} className="w-full text-sm" placeholder="Número de serie de la impresora" />
                    </div>
                </div>
            </div>

            {/* Garantía / Apoyo Tecnológico */}
            <GarantiaMantenimiento
                tipoPostesion={atributosLaboratorio.tipoPostesion || 'Propio'}
                onTipoPostesionChange={v => handleLaboratorioChange('tipoPostesion', v)}
                tieneGarantia={atributosLaboratorio.tieneGarantia || false}
                onTieneGarantia={v => handleLaboratorioChange('tieneGarantia', v)}
                fechaFinGarantia={atributosLaboratorio.fechaFinGarantia}
                onFechaFinGarantia={v => handleLaboratorioChange('fechaFinGarantia', v)}
                frecuencia={atributosLaboratorio.frecuenciaMantenimientoPreventivo || ''}
                onFrecuencia={v => handleLaboratorioChange('frecuenciaMantenimientoPreventivo', v)}
                responsable={atributosLaboratorio.responsableMantenimiento || ''}
                onResponsable={v => handleLaboratorioChange('responsableMantenimiento', v)}
                empresaApoyo={atributosLaboratorio.empresaApoyo || ''}
                ordenServicio={atributosLaboratorio.ordenServicio || ''}
                responsableOrden={atributosLaboratorio.responsableOrden || ''}
                fechaInicioProceso={atributosLaboratorio.fechaInicioProceso}
                fechaFinProceso={atributosLaboratorio.fechaFinProceso}
                onApoyoChange={(field, value) => handleLaboratorioChange(field as keyof AtributosLaboratorio, value)}
                errorFechas={errors['lab_fechas']}
            />
        </div>
    );

    // ─── Render: Equipo de Rayos e Imagen (EQR) ──────────────────────────────
    const renderRayosImagenForm = () => {
        const TIPOS_NO_IONIZANTES = new Set(['Ecógrafo', 'Resonancia Magnética (RM)']);
        const esIonizante = atributosRayosImagen.tipoEquipo
            ? !TIPOS_NO_IONIZANTES.has(atributosRayosImagen.tipoEquipo)
            : true;
        const licenciaVencida = atributosRayosImagen.fechaVencimientoLicencia
            && atributosRayosImagen.fechaVencimientoLicencia < new Date();

        return (
            <div className="space-y-6">
                {/* Tipo de equipo */}
                <div>
                    <label className="block text-xs font-medium mb-1">Tipo de Equipo / Modalidad</label>
                    <Dropdown
                        value={atributosRayosImagen.tipoEquipo || ''}
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
                        onChange={e => handleRayosImagenChange('tipoEquipo', e.value)}
                        placeholder="Seleccione modalidad"
                        className="w-full md:w-96 text-sm bg-white dark:bg-slate-950"
                    />
                    {atributosRayosImagen.tipoEquipo && !esIonizante && (
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
                            <div>
                                <label className="block text-xs font-medium mb-1">Tensión pico (kVp)</label>
                                <InputText value={atributosRayosImagen.tensionPicoKvp || ''} onChange={e => handleRayosImagenChange('tensionPicoKvp', e.target.value)} className="w-full text-sm" placeholder="Ej: 40 – 150 kVp" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Corriente (mA)</label>
                                <InputText value={atributosRayosImagen.corrienteMa || ''} onChange={e => handleRayosImagenChange('corrienteMa', e.target.value)} className="w-full text-sm" placeholder="Ej: 0.5 – 630 mA" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Tiempo de exposición (ms)</label>
                                <InputText value={atributosRayosImagen.tiempoExposicionMs || ''} onChange={e => handleRayosImagenChange('tiempoExposicionMs', e.target.value)} className="w-full text-sm" placeholder="Ej: 1 – 4000 ms" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Potencia máx. (kW)</label>
                                <InputText value={atributosRayosImagen.potenciaMaxKw || ''} onChange={e => handleRayosImagenChange('potenciaMaxKw', e.target.value)} className="w-full text-sm" placeholder="Ej: 65 kW" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Dosis de entrada por exposición (mGy)</label>
                                <InputText value={atributosRayosImagen.dosisEntradaMgy || ''} onChange={e => handleRayosImagenChange('dosisEntradaMgy', e.target.value)} className="w-full text-sm" placeholder="Ej: 0.1 mGy" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Filtración inherente (mm Al)</label>
                                <InputText value={atributosRayosImagen.filtracionInherenteAlMm || ''} onChange={e => handleRayosImagenChange('filtracionInherenteAlMm', e.target.value)} className="w-full text-sm" placeholder="Ej: ≥ 2.5 mm Al" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Distancia foco-receptor (cm)</label>
                                <InputText value={atributosRayosImagen.distanciaFocoReceptorCm || ''} onChange={e => handleRayosImagenChange('distanciaFocoReceptorCm', e.target.value)} className="w-full text-sm" placeholder="Ej: 100 cm" />
                            </div>
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
                            <InputText value={atributosRayosImagen.numeroLicenciaSCAN || ''} onChange={e => handleRayosImagenChange('numeroLicenciaSCAN', e.target.value)} className="w-full text-sm" placeholder="Ej: SCAN-2024-0123" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha de Emisión</label>
                            <Calendar
                                value={atributosRayosImagen.fechaEmisionLicencia ?? null}
                                onChange={e => handleRayosImagenChange('fechaEmisionLicencia', e.value)}
                                dateFormat="dd/mm/yy" showIcon
                                className="w-full text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha de Vencimiento</label>
                            <Calendar
                                value={atributosRayosImagen.fechaVencimientoLicencia ?? null}
                                onChange={e => handleRayosImagenChange('fechaVencimientoLicencia', e.value)}
                                dateFormat="dd/mm/yy" showIcon
                                minDate={atributosRayosImagen.fechaEmisionLicencia ?? undefined}
                                className={`w-full text-sm ${errors['eqr_licencia_fechas'] ? 'p-invalid' : ''}`}
                            />
                            {errors['eqr_licencia_fechas'] && <small className="text-red-500">{errors['eqr_licencia_fechas']}</small>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Titular de la Licencia</label>
                            <InputText value={atributosRayosImagen.titularLicencia || ''} onChange={e => handleRayosImagenChange('titularLicencia', e.target.value)} className="w-full text-sm" placeholder="Nombre de la institución o persona" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Categoría de Fuente SCAN / IAEA</label>
                            <Dropdown
                                value={atributosRayosImagen.categoriaFuenteSCAN || ''}
                                options={[
                                    { label: 'Categoría 1 — Alta peligrosidad', value: 'Categoría 1' },
                                    { label: 'Categoría 2', value: 'Categoría 2' },
                                    { label: 'Categoría 3', value: 'Categoría 3' },
                                    { label: 'Categoría 4', value: 'Categoría 4' },
                                    { label: 'Categoría 5 — Baja peligrosidad', value: 'Categoría 5' },
                                    { label: 'No aplica', value: 'No aplica' }
                                ]}
                                onChange={e => handleRayosImagenChange('categoriaFuenteSCAN', e.value)}
                                placeholder="Seleccione categoría"
                                className="w-full text-sm bg-white dark:bg-slate-950"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Estado de la Licencia</label>
                            <Dropdown
                                value={atributosRayosImagen.estadoLicencia || ''}
                                options={[
                                    { label: 'Vigente', value: 'Vigente' },
                                    { label: 'Vencida', value: 'Vencida' },
                                    { label: 'En renovación', value: 'En renovación' },
                                    { label: 'No requiere licencia', value: 'No requiere licencia' }
                                ]}
                                onChange={e => handleRayosImagenChange('estadoLicencia', e.value)}
                                placeholder="Seleccione estado"
                                className="w-full text-sm bg-white dark:bg-slate-950"
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
                            <InputText value={atributosRayosImagen.oprNombre || ''} onChange={e => handleRayosImagenChange('oprNombre', e.target.value)} className="w-full text-sm" placeholder="Nombre y apellidos" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Teléfono OPR</label>
                            <InputText value={atributosRayosImagen.oprTelefono || ''} onChange={e => handleRayosImagenChange('oprTelefono', e.target.value)} className="w-full text-sm" placeholder="Ej: 0998765432" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Correo OPR</label>
                            <InputText value={atributosRayosImagen.oprEmail || ''} onChange={e => handleRayosImagenChange('oprEmail', e.target.value)} className="w-full text-sm" placeholder="opr@hep.gob.ec" />
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
                                <InputText value={atributosRayosImagen.materialBlindaje || ''} onChange={e => handleRayosImagenChange('materialBlindaje', e.target.value)} className="w-full text-sm" placeholder="Ej: Plomo (Pb) / Hormigón barítrico" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Grosor de Blindaje (mm Pb equivalente)</label>
                                <InputText value={atributosRayosImagen.grosorBlindajePbMm || ''} onChange={e => handleRayosImagenChange('grosorBlindajePbMm', e.target.value)} className="w-full text-sm" placeholder="Ej: 1.5 mm Pb" />
                            </div>
                            <div className="flex items-center gap-3">
                                <InputSwitch checked={atributosRayosImagen.areaControladaDefinida || false} onChange={e => handleRayosImagenChange('areaControladaDefinida', e.value)} />
                                <label className="text-xs font-medium">Área controlada delimitada y señalizada</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <InputSwitch checked={atributosRayosImagen.planEmergenciaRadiologica || false} onChange={e => handleRayosImagenChange('planEmergenciaRadiologica', e.value)} />
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
                                value={atributosRayosImagen.frecuenciaCalibraci\u00f3n || ''}
                                options={[
                                    { label: 'Mensual', value: 'Mensual' },
                                    { label: 'Trimestral', value: 'Trimestral' },
                                    { label: 'Semestral', value: 'Semestral' },
                                    { label: 'Anual', value: 'Anual' }
                                ]}
                                onChange={e => handleRayosImagenChange('frecuenciaCalibraci\u00f3n', e.value)}
                                placeholder="Seleccione frecuencia"
                                className="w-full text-sm bg-white dark:bg-slate-950"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Laboratorio de Calibración</label>
                            <InputText value={atributosRayosImagen.laboratorioCalibraci\u00f3n || ''} onChange={e => handleRayosImagenChange('laboratorioCalibraci\u00f3n', e.target.value)} className="w-full text-sm" placeholder="Ej: INSPI / IAEA / laboratorio externo" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha último control de calidad</label>
                            <Calendar
                                value={atributosRayosImagen.fechaUltimoControlCalidad ?? null}
                                onChange={e => handleRayosImagenChange('fechaUltimoControlCalidad', e.value)}
                                dateFormat="dd/mm/yy" showIcon maxDate={new Date()}
                                className="w-full text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Fecha próximo control de calidad</label>
                            <Calendar
                                value={atributosRayosImagen.fechaProximoControlCalidad ?? null}
                                onChange={e => handleRayosImagenChange('fechaProximoControlCalidad', e.value)}
                                dateFormat="dd/mm/yy" showIcon
                                minDate={atributosRayosImagen.fechaUltimoControlCalidad ?? undefined}
                                className="w-full text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <InputSwitch checked={atributosRayosImagen.dosimetrosPersonales || false} onChange={e => handleRayosImagenChange('dosimetrosPersonales', e.value)} />
                            <label className="text-xs font-medium">Dosímetros personales asignados al personal expuesto</label>
                        </div>
                    </div>
                </div>

                {/* Garantía / Apoyo Tecnológico */}
                <GarantiaMantenimiento
                    tipoPostesion={atributosRayosImagen.tipoPostesion || 'Propio'}
                    onTipoPostesionChange={v => handleRayosImagenChange('tipoPostesion', v)}
                    tieneGarantia={atributosRayosImagen.tieneGarantia || false}
                    onTieneGarantia={v => handleRayosImagenChange('tieneGarantia', v)}
                    fechaFinGarantia={atributosRayosImagen.fechaFinGarantia}
                    onFechaFinGarantia={v => handleRayosImagenChange('fechaFinGarantia', v)}
                    frecuencia={atributosRayosImagen.frecuenciaMantenimientoPreventivo || ''}
                    onFrecuencia={v => handleRayosImagenChange('frecuenciaMantenimientoPreventivo', v)}
                    responsable={atributosRayosImagen.responsableMantenimiento || ''}
                    onResponsable={v => handleRayosImagenChange('responsableMantenimiento', v)}
                    empresaApoyo={atributosRayosImagen.empresaApoyo || ''}
                    ordenServicio={atributosRayosImagen.ordenServicio || ''}
                    responsableOrden={atributosRayosImagen.responsableOrden || ''}
                    fechaInicioProceso={atributosRayosImagen.fechaInicioProceso}
                    fechaFinProceso={atributosRayosImagen.fechaFinProceso}
                    onApoyoChange={(field, value) => handleRayosImagenChange(field as keyof AtributosRayosImagen, value)}
                    errorFechas={errors['eqr_proceso_fechas']}
                />
            </div>
        );
    };

    // ─── Dispatcher principal de render ───────────────────────────────────────
    const renderEspecificoForm = (): React.ReactNode => {
        const key = getEspecificoKey();
        if (key === 'EQM') return renderBiomedicoForm();
        if (key === 'EQL') return renderLaboratorioForm();
        if (key === 'EQR') return renderRayosImagenForm();
        if (key === 'CPU') return renderCpuForm();
        if (key === 'MON') return renderMonitorForm();
        if (key === 'TEC') return renderTecladoForm();
        if (key === 'MOU') return renderMouseForm();
        if (key === 'IMP') return renderImpresoraRedForm();
        if (key === 'TEL') return renderTelefonoIpForm();
        if (key === 'CCTV') return renderCctvForm();
        if (key === 'AP') return renderAccessPointForm();
        return null;
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
                            <label className="block text-sm font-medium mb-2">Categoría <span className="text-red-500">*</span></label>
                            <Dropdown value={formData.categoriaActivo} onChange={(e: DropdownChangeEvent) => handleInputChange('categoriaActivo', e.value)} options={CATALOGOS.categoriaActivo} placeholder="Seleccione una categoría" className={`w-full ${getErrorClass('categoriaActivo')}`} disabled={categoriaBloqueada} />
                            {errors.categoriaActivo && <small className="text-red-500">{errors.categoriaActivo}</small>}
                        </div>
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
                    navigate('/activos/consultar');
                }}
            >
                {creadoActivo && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <i className="pi pi-check-circle text-5xl text-green-500" />
                        <p className="text-center text-slate-700 dark:text-slate-300 m-0">
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
                        <Button
                            label="Ir a Consultar Activos"
                            icon="pi pi-arrow-right"
                            onClick={() => { setShowBarcodeDialog(false); navigate('/activos/consultar'); }}
                            className="w-full mt-2"
                        />
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default RegistrarActivo;
