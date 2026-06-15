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
import CreatableSelect from 'react-select/creatable';
import type { SingleValue } from 'react-select';
import { useNavigate } from 'react-router-dom';
import { useActivos } from '../../context/ActivosContext';
import { UbicacionCascada } from '../../components/UbicacionCascada';

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
}

type NombreOption = {
    label: string;
    value: string;
};

type NombreGroup = {
    label: string;
    options: NombreOption[];
};

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
            { value: 'Computadora de escritorio', label: 'Computadora de escritorio' },
            { value: 'Laptop', label: 'Laptop' },
            { value: 'Tablet', label: 'Tablet' },
            { value: 'Impresora', label: 'Impresora' },
            { value: 'Servidor', label: 'Servidor' },
            { value: 'Switch de red', label: 'Switch de red' },
            { value: 'Router', label: 'Router' },
            { value: 'Monitor', label: 'Monitor' }
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
        options: [
            { value: 'Otro bien', label: 'Otro bien' }
        ]
    }
];

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
    'Computadora de escritorio': { code: 'EQI', label: 'Equipo informático (EQI)' },
    Laptop: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Tablet: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Impresora: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Servidor: { code: 'EQI', label: 'Equipo informático (EQI)' },
    'Switch de red': { code: 'EQI', label: 'Equipo informático (EQI)' },
    Router: { code: 'EQI', label: 'Equipo informático (EQI)' },
    Monitor: { code: 'EQI', label: 'Equipo informático (EQI)' },
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
    OTR: 'Otra marca'
};

const MARCAS_POR_CATEGORIA: Record<string, string[]> = {
    EQM: ['PHI', 'GEH', 'DRG', 'OTR'],
    EQL: ['SIE', 'GEH', 'OTR'],
    EQR: ['GEH', 'SIE', 'PHI', 'OTR'],
    EQI: ['SAM', 'LEN', 'HP', 'DEL', 'OTR'],
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
    container: (provided: any) => ({
        ...provided,
        width: '100%'
    }),
    control: (provided: any, state: any) => ({
        ...provided,
        width: '100%',
        minHeight: '2rem',
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#2563eb' : '#cbd5e1',
        boxShadow: state.isFocused ? '0 0 0 1px rgba(37, 99, 235, 0.3)' : provided.boxShadow,
        '&:hover': {
            borderColor: state.isFocused ? '#2563eb' : '#94a3b8'
        },
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

// Catálogos precargados
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

export const RegistrarActivo: React.FC = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { activos, agregarActivo } = useActivos();

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

    useEffect(() => {
        const categoryCode = getCategoryCodeFromLabel(formData.categoriaActivo);
        const filteredMarcas = getMarcaOptionsForCategory(categoryCode);
        setMarcaOptions(filteredMarcas);

        if (formData.marca && !filteredMarcas.some(option => option.value === formData.marca)) {
            setFormData(prev => ({ ...prev, marca: '' }));
        }
    }, [formData.categoriaActivo]);

    const generateCodigoInstitucional = (): string => {
        const prefix = 'CI';
        const year = new Date().getFullYear();
        const existingNumbers = activos
            .map(activo => activo.codigoInstitucional)
            .filter(code => typeof code === 'string' && code.startsWith(`${prefix}-${year}-`))
            .map(code => {
                const match = code.match(/CI-\d{4}-(\d+)/);
                return match ? Number(match[1]) : null;
            })
            .filter((value): value is number => typeof value === 'number' && !isNaN(value));

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
    };

    useEffect(() => {
        if (!formData.codigoInstitucional) {
            setFormData(prev => ({
                ...prev,
                codigoInstitucional: generateCodigoInstitucional()
            }));
        }
    }, [activos]);

    const onCrearNombreOpcion = async (inputValue: string) => {
        const newOption: NombreOption = { label: inputValue, value: inputValue };
        const mappedCategory = CATEGORIA_BY_NOMBRE[inputValue];
        const shouldLockCategory = !!mappedCategory;
        const newCategoryValue = mappedCategory ? mappedCategory.label : 'Otros bienes (OTR)';

        setNombreOptions(prev => {
            const existingOtros = prev.find(group => group.label === 'Otros bienes (OTR)');

            if (existingOtros) {
                return prev.map(group =>
                    group.label === 'Otros bienes (OTR)'
                        ? { ...group, options: [...group.options, newOption] }
                        : group
                );
            }

            return [...prev, { label: 'Otros bienes (OTR)', options: [newOption] }];
        });

        setSelectedNombreOption(newOption);
        setCategoriaBloqueada(shouldLockCategory);
        setFormData(prev => ({
            ...prev,
            nombre: inputValue,
            categoriaActivo: newCategoryValue
        }));

        try {
            await fetch('/api/tipos-activo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre: inputValue })
            });
        } catch (error) {
            console.error('Error guardando tipo de activo', error);
        }
    };

    // Calcular ValorTotal cuando cambia ValorUnitario
    useEffect(() => {
        if (formData.valorUnitario) {
            setFormData(prev => ({
                ...prev,
                valorTotal: prev.valorUnitario
            }));
        }
    }, [formData.valorUnitario]);

    // Validar que número de serie sea único
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        }

        if (!formData.numeroSerie.trim()) {
            newErrors.numeroSerie = 'El número de serie es obligatorio';
        } else if (activos.some(a => a.numeroSerie === formData.numeroSerie)) {
            newErrors.numeroSerie = 'Este número de serie ya existe en el sistema';
        }

        if (!formData.marca) {
            newErrors.marca = 'La marca es obligatoria';
        }

        if (!formData.categoriaActivo) {
            newErrors.categoriaActivo = 'La categoría es obligatoria';
        }

        if (!formData.origenIngreso) {
            newErrors.origenIngreso = 'El origen de ingreso es obligatorio';
        }

        if (!formData.estadoActivo) {
            newErrors.estadoActivo = 'El estado del activo es obligatorio';
        }

        if (!formData.ubicacion) {
            newErrors.ubicacion = 'La ubicación es obligatoria';
        }

        if (!formData.fechaAdquisicion) {
            newErrors.fechaAdquisicion = 'La fecha de adquisición es obligatoria';
        } else {
            const fechaActual = new Date();
            if (formData.fechaAdquisicion > fechaActual) {
                newErrors.fechaAdquisicion = 'La fecha no puede ser futura';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar cambios en inputs
    const handleInputChange = (field: keyof Activo, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Limpiar error del campo cuando se empieza a editar
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Guardar activo
    const handleGuardar = async () => {
        if (!validateForm()) {
            toast.current?.show({
                severity: 'error',
                summary: 'Errores de Validación',
                detail: 'Revise los campos obligatorios',
                life: 3000
            });
            return;
        }

        try {
            // Guardar en el contexto
            const { idActivo, ...datosActivo } = formData;
            agregarActivo(datosActivo);

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Activo registrado correctamente',
                life: 3000
            });

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/activos/consultar');
            }, 2000);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al guardar el activo',
                life: 3000
            });
        }
    };

    // Cancelar
    const handleCancelar = () => {
        navigate('/activos/consultar');
    };

    const getErrorClass = (field: keyof Activo) => {
        return errors[field] ? 'p-invalid' : '';
    };

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
                        <label className="block text-sm font-medium mb-2">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <CreatableSelect
                            value={selectedNombreOption}
                            options={nombreOptions}
                            placeholder="Ej: Monitor"
                            formatCreateLabel={(inputValue) => `+ Crear "${inputValue}"`}
                            isValidNewOption={(inputValue) =>
                                !!inputValue.trim() && !isExistingNombreOption(inputValue, nombreOptions)
                            }
                            filterOption={(candidate, input) =>
                                candidate.label.toLowerCase().includes(input.toLowerCase())
                            }
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
                                setFormData(prev => ({
                                    ...prev,
                                    nombre: option.value,
                                    categoriaActivo: newCategoryValue
                                }));
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
                        <label className="block text-sm font-medium mb-2">
                            Marca <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.marca}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('marca', e.value)}
                            options={marcaOptions}
                            placeholder="Seleccione una marca"
                            className={`w-full ${getErrorClass('marca')}`}
                        />
                        {errors.marca && <small className="text-red-500">{errors.marca}</small>}
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Descripción</label>
                        <InputTextarea
                            value={formData.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            placeholder="Descripción detallada del activo"
                            rows={3}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Modelo</label>
                        <InputText
                            value={formData.modelo}
                            onChange={(e) => handleInputChange('modelo', e.target.value)}
                            placeholder="Ej: 24 pulgadas"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Color</label>
                        <Dropdown
                            value={formData.color}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('color', e.value)}
                            options={CATALOGOS.color}
                            placeholder="Seleccione un color"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Material</label>
                        <InputText
                            value={formData.material}
                            onChange={(e) => handleInputChange('material', e.target.value)}
                            placeholder="Ej: Plástico"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Dimensión</label>
                        <InputText
                            value={formData.dimension}
                            onChange={(e) => handleInputChange('dimension', e.target.value)}
                            placeholder="Ej: 50x30x20 cm"
                            className="w-full"
                        />
                    </div>
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 2: Identificación */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        Identificación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm font-medium mb-2">Código Institucional</label>
                        <InputText
                            value={formData.codigoInstitucional}
                            onChange={(e) => handleInputChange('codigoInstitucional', e.target.value)}
                            placeholder="Autogenerado"
                            disabled
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Número de Serie <span className="text-red-500">*</span>
                        </label>
                        <InputText
                            value={formData.numeroSerie}
                            onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
                            placeholder="Ej: SN12345678"
                            className={`w-full ${getErrorClass('numeroSerie')}`}
                        />
                        {errors.numeroSerie && <small className="text-red-500">{errors.numeroSerie}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Código SBYE</label>
                        <InputText
                            value={formData.codigoSBYE}
                            onChange={(e) => handleInputChange('codigoSBYE', e.target.value)}
                            placeholder="Código SBYE"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Número de Acta</label>
                        <InputText
                            value={formData.numeroActa}
                            onChange={(e) => handleInputChange('numeroActa', e.target.value)}
                            placeholder="Ej: ACTA-2024-001"
                            className="w-full"
                        />
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
                        <label className="block text-sm font-medium mb-2">
                            Categoría <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.categoriaActivo}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('categoriaActivo', e.value)}
                            options={CATALOGOS.categoriaActivo}
                            placeholder="Seleccione una categoría"
                            className={`w-full ${getErrorClass('categoriaActivo')}`}
                            disabled={categoriaBloqueada}
                        />
                        {errors.categoriaActivo && <small className="text-red-500">{errors.categoriaActivo}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Origen de Ingreso <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.origenIngreso}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('origenIngreso', e.value)}
                            options={CATALOGOS.origenIngreso}
                            placeholder="Seleccione origen"
                            className={`w-full ${getErrorClass('origenIngreso')}`}
                        />
                        {errors.origenIngreso && <small className="text-red-500">{errors.origenIngreso}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Motivo de Ingreso</label>
                        <Dropdown
                            value={formData.motivoIngreso}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('motivoIngreso', e.value)}
                            options={CATALOGOS.motivoIngreso}
                            placeholder="Seleccione motivo"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Unidad de Medida</label>
                        <Dropdown
                            value={formData.unidadMedida}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('unidadMedida', e.value)}
                            options={CATALOGOS.unidadMedida}
                            placeholder="Seleccione unidad"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Estado del Activo <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.estadoActivo}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('estadoActivo', e.value)}
                            options={CATALOGOS.estadoActivo}
                            placeholder="Seleccione estado"
                            className={`w-full ${getErrorClass('estadoActivo')}`}
                        />
                        {errors.estadoActivo && <small className="text-red-500">{errors.estadoActivo}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Condición de Depreciación</label>
                        <Dropdown
                            value={formData.condicionDepreciacion}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('condicionDepreciacion', e.value)}
                            options={CATALOGOS.condicionDepreciacion}
                            placeholder="Seleccione condición"
                            className="w-full"
                        />
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
                        <UbicacionCascada
                            value={formData.ubicacion}
                            onChange={(ruta) => handleInputChange('ubicacion', ruta)}
                            error={errors.ubicacion}
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2">Responsable de Entrega</label>
                            <InputText
                                value={formData.responsableEntrega}
                                onChange={(e) => handleInputChange('responsableEntrega', e.target.value)}
                                placeholder="Nombre del responsable"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Administrador del Proceso</label>
                            <InputText
                                value={formData.administradorDelProceso}
                                onChange={(e) => handleInputChange('administradorDelProceso', e.target.value)}
                                placeholder="Nombre del administrador"
                                className="w-full"
                            />
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
                        <label className="block text-sm font-medium mb-2">
                            Fecha de Adquisición <span className="text-red-500">*</span>
                        </label>
                        <Calendar
                            value={formData.fechaAdquisicion}
                            onChange={(e) => handleInputChange('fechaAdquisicion', e.value)}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className={`w-full ${getErrorClass('fechaAdquisicion')}`}
                        />
                        {errors.fechaAdquisicion && <small className="text-red-500">{errors.fechaAdquisicion}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Valor de Adquisición</label>
                        <InputNumber
                            value={formData.valorAdquisicion}
                            onChange={(e) => handleInputChange('valorAdquisicion', e.value)}
                            mode="currency"
                            currency="USD"
                            locale="es-ES"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Valor Unitario</label>
                        <InputNumber
                            value={formData.valorUnitario}
                            onChange={(e) => handleInputChange('valorUnitario', e.value)}
                            mode="currency"
                            currency="USD"
                            locale="es-ES"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Valor Total</label>
                        <InputNumber
                            value={formData.valorTotal}
                            disabled
                            mode="currency"
                            currency="USD"
                            locale="es-ES"
                            className="w-full"
                        />
                        <small className="text-slate-500">Calculado automáticamente</small>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tiempo de Vida Útil (años)</label>
                        <InputNumber
                            value={formData.tiempoVidaUtil}
                            onChange={(e) => handleInputChange('tiempoVidaUtil', e.value)}
                            placeholder="Ej: 5"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Número de Contrato</label>
                        <InputText
                            value={formData.numeroContrato}
                            onChange={(e) => handleInputChange('numeroContrato', e.target.value)}
                            placeholder="Ej: CONTRATO-2024-001"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Item Presupuestario</label>
                        <InputText
                            value={formData.itemPresupuestario}
                            onChange={(e) => handleInputChange('itemPresupuestario', e.target.value)}
                            placeholder="Item"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Partida Presupuestaria</label>
                        <InputText
                            value={formData.partidaPresupuestaria}
                            onChange={(e) => handleInputChange('partidaPresupuestaria', e.target.value)}
                            placeholder="Partida"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Fecha DNS</label>
                        <Calendar
                            value={formData.fechaDNS ? new Date(formData.fechaDNS) : null}
                            onChange={(e) => handleInputChange('fechaDNS', e.value?.toISOString())}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className="w-full"
                        />
                    </div>
                    </div>
                </div>

                {/* BOTONES */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        label="Cancelar"
                        severity="secondary"
                        onClick={handleCancelar}
                        className="w-full md:w-auto"
                    />
                    <Button
                        label="Guardar"
                        severity="success"
                        onClick={handleGuardar}
                        className="w-full md:w-auto"
                    />
                </div>
            </Card>
        </div>
    );
};

export default RegistrarActivo;
