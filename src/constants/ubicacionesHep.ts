export const UBICACIONES_HEP = [
    {
        id: 'BLQ-A',
        label: 'Bloque A — Consultorios / Consulta Externa',
        pisos: [
            {
                id: 'BLQ-A-PB',
                label: 'Planta Baja',
                servicios: [
                    {
                        id: 'BLQ-A-PB-CEX',
                        label: 'Consulta Externa',
                        ambientes: [
                            'Consultorio 101',
                            'Consultorio 102',
                            'Consultorio 103',
                            'Sala de Espera',
                            'Admisiones',
                            'Enfermería'
                        ]
                    },
                    {
                        id: 'BLQ-A-PB-CAR',
                        label: 'Cardiología',
                        ambientes: ['Consultorio Cardiología', 'Sala de Ecocardiografía']
                    },
                    {
                        id: 'BLQ-A-PB-NEU',
                        label: 'Neurología',
                        ambientes: ['Consultorio Neurología', 'Sala de EEG']
                    }
                ]
            },
            {
                id: 'BLQ-A-P1',
                label: 'Piso 1',
                servicios: [
                    {
                        id: 'BLQ-A-P1-PED',
                        label: 'Pediatría',
                        ambientes: ['Consultorio Pediatría 1', 'Consultorio Pediatría 2', 'Sala de Vacunación']
                    },
                    {
                        id: 'BLQ-A-P1-GIN',
                        label: 'Ginecología',
                        ambientes: ['Consultorio Ginecología', 'Sala de Colposcopía']
                    }
                ]
            }
        ]
    },
    {
        id: 'BLQ-B',
        label: 'Bloque B — Hospitalización / Internación',
        pisos: [
            {
                id: 'BLQ-B-P1',
                label: 'Piso 1',
                servicios: [
                    {
                        id: 'BLQ-B-P1-MED',
                        label: 'Medicina Interna',
                        ambientes: [
                            'Habitación 101 - Cama A',
                            'Habitación 101 - Cama B',
                            'Habitación 102 - Cama A',
                            'Habitación 102 - Cama B',
                            'Estación de Enfermería',
                            'Bodega de Insumos'
                        ]
                    },
                    {
                        id: 'BLQ-B-P1-CIR',
                        label: 'Cirugía General',
                        ambientes: [
                            'Habitación 110 - Cama A',
                            'Habitación 110 - Cama B',
                            'Habitación 111 - Cama A',
                            'Estación de Enfermería Cirugía'
                        ]
                    }
                ]
            },
            {
                id: 'BLQ-B-P2',
                label: 'Piso 2',
                servicios: [
                    {
                        id: 'BLQ-B-P2-GIN',
                        label: 'Ginecología y Obstetricia',
                        ambientes: [
                            'Habitación 201 - Cama A',
                            'Habitación 201 - Cama B',
                            'Sala de Partos',
                            'Estación de Enfermería Ginecología'
                        ]
                    },
                    {
                        id: 'BLQ-B-P2-PED',
                        label: 'Hospitalización Pediatría',
                        ambientes: [
                            'Habitación 210 - Cama A',
                            'Habitación 210 - Cama B',
                            'Sala de Juegos',
                            'Estación de Enfermería Pediatría'
                        ]
                    }
                ]
            },
            {
                id: 'BLQ-B-P3',
                label: 'Piso 3',
                servicios: [
                    {
                        id: 'BLQ-B-P3-ORT',
                        label: 'Traumatología y Ortopedia',
                        ambientes: [
                            'Habitación 301 - Cama A',
                            'Habitación 301 - Cama B',
                            'Habitación 302 - Cama A',
                            'Estación de Enfermería Trauma'
                        ]
                    },
                    {
                        id: 'BLQ-B-P3-NEO',
                        label: 'Neonatología',
                        ambientes: [
                            'Cuña 1',
                            'Cuña 2',
                            'Cuña 3',
                            'Cuña 4',
                            'Sala de Aislamiento Neonatal',
                            'Estación de Enfermería Neo'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'BLQ-C',
        label: 'Bloque C — Área Crítica (Quirófanos / UCI / Emergencia)',
        pisos: [
            {
                id: 'BLQ-C-PB',
                label: 'Planta Baja',
                servicios: [
                    {
                        id: 'BLQ-C-PB-EMR',
                        label: 'Emergencia',
                        ambientes: [
                            'Triaje',
                            'Sala de Observación Adultos',
                            'Sala de Observación Pediátrica',
                            'Sala de Yesos',
                            'Sala de Procedimientos',
                            'Estación de Enfermería Emergencia'
                        ]
                    }
                ]
            },
            {
                id: 'BLQ-C-P1',
                label: 'Piso 1',
                servicios: [
                    {
                        id: 'BLQ-C-P1-UCI',
                        label: 'UCI Adultos',
                        ambientes: [
                            'Cubículo 01',
                            'Cubículo 02',
                            'Cubículo 03',
                            'Cubículo 04',
                            'Cubículo 05',
                            'Cubículo 06',
                            'Estación de Enfermería UCI',
                            'Bodega UCI'
                        ]
                    },
                    {
                        id: 'BLQ-C-P1-UCN',
                        label: 'UCI Neonatal',
                        ambientes: ['Incubadora 01', 'Incubadora 02', 'Incubadora 03']
                    },
                    {
                        id: 'BLQ-C-P1-QUI',
                        label: 'Quirófanos',
                        ambientes: [
                            'Quirófano 1',
                            'Quirófano 2',
                            'Quirófano 3',
                            'Sala de Recuperación',
                            'Central de Esterilización',
                            'Bodega de Materiales Quirúrgicos'
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'BLQ-D',
        label: 'Bloque D — Servicios Generales / Administración',
        pisos: [
            {
                id: 'BLQ-D-PB',
                label: 'Planta Baja',
                servicios: [
                    {
                        id: 'BLQ-D-PB-FAR',
                        label: 'Farmacia Central',
                        ambientes: ['Despacho Farmacia', 'Bodega Medicamentos', 'Área de Preparación']
                    },
                    {
                        id: 'BLQ-D-PB-COC',
                        label: 'Cocina y Nutrición',
                        ambientes: ['Cocina Principal', 'Bodega de Alimentos', 'Comedor Personal']
                    },
                    {
                        id: 'BLQ-D-PB-MAN',
                        label: 'Mantenimiento',
                        ambientes: ['Taller Mantenimiento', 'Bodega Herramientas', 'Cuarto de Máquinas']
                    }
                ]
            },
            {
                id: 'BLQ-D-P1',
                label: 'Piso 1',
                servicios: [
                    {
                        id: 'BLQ-D-P1-ADM',
                        label: 'Administración',
                        ambientes: [
                            'Dirección General',
                            'Secretaría General',
                            'Sala de Reuniones',
                            'Archivo General'
                        ]
                    },
                    {
                        id: 'BLQ-D-P1-TAH',
                        label: 'Talento Humano',
                        ambientes: ['Oficina Jefatura RRHH', 'Oficina Selección', 'Oficina Nómina']
                    },
                    {
                        id: 'BLQ-D-P1-FIN',
                        label: 'Financiero',
                        ambientes: ['Jefatura Financiera', 'Contabilidad', 'Tesorería', 'Bodega Activos Fijos']
                    },
                    {
                        id: 'BLQ-D-P1-TIC',
                        label: 'Tecnologías de la Información (TI)',
                        ambientes: ['Sala de Servidores', 'Oficina TI', 'Bodega Equipos Informáticos']
                    }
                ]
            }
        ]
    },
    {
        id: 'BLQ-E',
        label: 'Bloque E — Imagenología / Laboratorios',
        pisos: [
            {
                id: 'BLQ-E-PB',
                label: 'Planta Baja',
                servicios: [
                    {
                        id: 'BLQ-E-PB-LAB',
                        label: 'Laboratorio Clínico',
                        ambientes: [
                            'Área de Toma de Muestras',
                            'Área de Bioquímica',
                            'Área de Hematología',
                            'Área de Microbiología',
                            'Bodega Reactivos'
                        ]
                    },
                    {
                        id: 'BLQ-E-PB-IMG',
                        label: 'Imagenología',
                        ambientes: [
                            'Sala de Rayos X',
                            'Sala de Tomografía',
                            'Sala de Ecografía',
                            'Sala de Mamografía',
                            'Área de Revelado / Lectura'
                        ]
                    }
                ]
            }
        ]
    }
];

