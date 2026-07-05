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
    estadoActivo: [
        { label: 'Bueno', value: 'BUE' },
        { label: 'Regular', value: 'REG' },
        { label: 'Malo', value: 'MAL' }
    ]
};

export const CATALOGO_PROVEEDORES = [
    { ruc: '1790012345001', nombre: 'Philips Medical Systems' },
    { ruc: '1790023456001', nombre: 'GE Healthcare Ecuador' },
    { ruc: '1790034567001', nombre: 'Siemens Healthineers S.A.' },
    { ruc: '1790045678001', nombre: 'Dräger Ecuador S.A.' },
    { ruc: '1790056789001', nombre: 'Lenovo Ecuador' },
    { ruc: '1790067890001', nombre: 'HP Ecuador' },
    { ruc: '1790078901001', nombre: 'Dell Technologies' },
    { ruc: '1790089012001', nombre: 'Samsung Electronics' }
];

export const COLUMNAS_PLANTILLA_OFICIAL = [
    'No. de Acta',
    'Nombre Bien',
    'Fecha de ingreso',
    'Descripción/Características',
    'Código eSByE',
    'Estado',
    'Costo de Adquisición',
    'Depreciación (S/N)',
    'Garantía (S/N)',
    'Tiempo de Garantía',
    'Serie',
    'Modelo',
    'Marca',
    'Valor Contable',
    'Valor Residual',
    'Valor en Libros',
    'Valor Depreciación Acumulada',
    'Fecha última depreciación',
    'Vida Útil',
    'Color',
    'Material',
    'Dimensiones',
    'Observaciones'
] as const;
