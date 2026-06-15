export const CATALOGOS = {
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
    OTR: 'Otra marca'
};

export const MARCAS_POR_CATEGORIA: Record<string, string[]> = {
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

export const COLUMNAS_PLANTILLA = [
    'Nombre',
    'Marca',
    'Descripción',
    'Modelo',
    'Color',
    'Material',
    'Dimensión',
    'Número de Serie',
    'Código SBYE',
    'Número de Acta',
    'Categoría',
    'Origen de Ingreso',
    'Motivo de Ingreso',
    'Unidad de Medida',
    'Estado del Activo',
    'Condición de Depreciación',
    'Bloque',
    'Piso',
    'Servicio',
    'Ambiente/Sala',
    'Responsable de Entrega',
    'Administrador del Proceso',
    'Fecha de Adquisición',
    'Valor de Adquisición',
    'Valor Unitario',
    'Tiempo de Vida Útil (años)',
    'Número de Contrato',
    'Item Presupuestario',
    'Partida Presupuestaria',
    'Fecha DNS'
] as const;

export const getCategoryCodeFromLabel = (categoryLabel: string): string => {
    const match = categoryLabel.match(/\(([^)]+)\)$/);
    return match ? match[1] : '';
};

export const getMarcasPermitidas = (categoryLabel: string): string[] => {
    const code = getCategoryCodeFromLabel(categoryLabel);
    const allowedCodes = code ? MARCAS_POR_CATEGORIA[code] || ['OTR'] : Object.keys(CAT_MARCA);
    return allowedCodes.map(c => CAT_MARCA[c]);
};

export const catalogoContieneValor = (
    catalogo: { label: string; value: string }[],
    valor: string
): boolean => catalogo.some(item => item.value === valor);
