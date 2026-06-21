import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Interfaz Principal                                                */
/* ------------------------------------------------------------------ */
export interface MantenimientoHEP {
  id: string;
  referencia: string;           // ej: 'MP-2026-0001' preventivo, 'MC-2026-0001' correctivo
  tipo: 'Preventivo' | 'Correctivo';
  codigoActivo: string;
  nombreActivo: string;
  categoria: string;
  ubicacion: string;
  responsableTecnico: string;   // quien ejecuta el mantenimiento
  responsableCustodia: string;  // custodio actual del activo
  fechaProgramada: string;      // ISO 'YYYY-MM-DD'
  fechaInicio: string;          // ISO 'YYYY-MM-DD' o ''
  fechaCierre: string;          // ISO 'YYYY-MM-DD' o ''
  descripcionTrabajo: string;   // actividades a realizar o realizadas
  diagnostico: string;          // solo correctivo, '' en preventivo
  repuestosUtilizados: string;  // solo correctivo, '' en preventivo
  observaciones: string;
  estado: 'Programado' | 'En Proceso' | 'Cerrado';
  prioridad: 'Alta' | 'Media' | 'Baja';
  creadoPor: string;
  fechaRegistro: string;        // ISO completo de cuando se creó
}

/* ------------------------------------------------------------------ */
/*  Datos Mock Iniciales - 8 registros                                */
/* ------------------------------------------------------------------ */
const MOCK_MANTENIMIENTOS_INICIALES: MantenimientoHEP[] = [
  // 3 Preventivos en estado 'Programado'
  {
    id: 'maint-mock-1',
    referencia: 'MP-2026-0001',
    tipo: 'Preventivo',
    codigoActivo: 'ACT-0001',
    nombreActivo: 'Ventilador Mecánico',
    categoria: 'Equipos Médicos',
    ubicacion: 'UCI',
    responsableTecnico: 'Ing. Carlos Ortega',
    responsableCustodia: 'Dra. Elena Larrea',
    fechaProgramada: '2026-06-25',
    fechaInicio: '',
    fechaCierre: '',
    descripcionTrabajo: 'Calibración de flujo y limpieza externa de filtros.',
    diagnostico: '',
    repuestosUtilizados: '',
    observaciones: 'Requiere pruebas post-calibración.',
    estado: 'Programado',
    prioridad: 'Alta',
    creadoPor: 'Soporte Técnico',
    fechaRegistro: '2026-06-15T08:00:00.000Z'
  },
  {
    id: 'maint-mock-2',
    referencia: 'MP-2026-0002',
    tipo: 'Preventivo',
    codigoActivo: 'ACT-0002',
    nombreActivo: 'Monitor de Signos Vitales',
    categoria: 'Equipos de Monitoreo',
    ubicacion: 'Quirófano A',
    responsableTecnico: 'Ing. Carlos Ortega',
    responsableCustodia: 'Dra. Elena Larrea',
    fechaProgramada: '2026-06-28',
    fechaInicio: '',
    fechaCierre: '',
    descripcionTrabajo: 'Verificación de sensores y calibración de batería.',
    diagnostico: '',
    repuestosUtilizados: '',
    observaciones: '',
    estado: 'Programado',
    prioridad: 'Media',
    creadoPor: 'Soporte Técnico',
    fechaRegistro: '2026-06-15T09:00:00.000Z'
  },
  {
    id: 'maint-mock-3',
    referencia: 'MP-2026-0003',
    tipo: 'Preventivo',
    codigoActivo: 'ACT-0004',
    nombreActivo: 'Bomba de Infusión',
    categoria: 'Equipos Médicos',
    ubicacion: 'Emergencias',
    responsableTecnico: 'Ing. Marcos Silva',
    responsableCustodia: 'Lic. Rosa Méndez',
    fechaProgramada: '2026-07-02',
    fechaInicio: '',
    fechaCierre: '',
    descripcionTrabajo: 'Pruebas de flujo y limpieza general de componentes mecánicos.',
    diagnostico: '',
    repuestosUtilizados: '',
    observaciones: 'Mantenimiento preventivo semestral programado.',
    estado: 'Programado',
    prioridad: 'Baja',
    creadoPor: 'Soporte Técnico',
    fechaRegistro: '2026-06-16T10:00:00.000Z'
  },
  // 2 Preventivos en estado 'Cerrado'
  {
    id: 'maint-mock-4',
    referencia: 'MP-2026-0004',
    tipo: 'Preventivo',
    codigoActivo: 'ACT-0005',
    nombreActivo: 'Electrocardiógrafo',
    categoria: 'Equipos Diagnósticos',
    ubicacion: 'Laboratorio',
    responsableTecnico: 'Ing. Carlos Ortega',
    responsableCustodia: 'Dr. Héctor Salas',
    fechaProgramada: '2026-06-10',
    fechaInicio: '2026-06-10',
    fechaCierre: '2026-06-10',
    descripcionTrabajo: 'Mantenimiento preventivo trimestral completado de manera exitosa.',
    diagnostico: '',
    repuestosUtilizados: '',
    observaciones: 'Todo funcionando dentro de los parámetros normales de operación.',
    estado: 'Cerrado',
    prioridad: 'Media',
    creadoPor: 'Soporte Técnico',
    fechaRegistro: '2026-06-05T08:30:00.000Z'
  },
  {
    id: 'maint-mock-5',
    referencia: 'MP-2026-0005',
    tipo: 'Preventivo',
    codigoActivo: 'ACT-0006',
    nombreActivo: 'Desfibrilador Cardiaco',
    categoria: 'Equipos Médicos',
    ubicacion: 'Quirófano B',
    responsableTecnico: 'Ing. Marcos Silva',
    responsableCustodia: 'Dra. Elena Larrea',
    fechaProgramada: '2026-06-12',
    fechaInicio: '2026-06-12',
    fechaCierre: '2026-06-12',
    descripcionTrabajo: 'Prueba de descarga e inspección visual de cables.',
    diagnostico: '',
    repuestosUtilizados: '',
    observaciones: 'Equipo operativo y listo para uso de emergencia.',
    estado: 'Cerrado',
    prioridad: 'Alta',
    creadoPor: 'Soporte Técnico',
    fechaRegistro: '2026-06-05T14:00:00.000Z'
  },
  // 2 Correctivos en estado 'En Proceso'
  {
    id: 'maint-mock-6',
    referencia: 'MC-2026-0001',
    tipo: 'Correctivo',
    codigoActivo: 'ACT-0007',
    nombreActivo: 'Máquina de Anestesia',
    categoria: 'Equipos Médicos',
    ubicacion: 'Quirófano A',
    responsableTecnico: 'Ing. Carlos Ortega',
    responsableCustodia: 'Dra. Elena Larrea',
    fechaProgramada: '2026-06-16',
    fechaInicio: '2026-06-16',
    fechaCierre: '',
    descripcionTrabajo: 'Revisión y solución de fuga detectada en circuito de gases.',
    diagnostico: 'Fuga detectada en la válvula reguladora principal.',
    repuestosUtilizados: '',
    observaciones: 'En espera de la llegada de repuesto original de válvula reguladora.',
    estado: 'En Proceso',
    prioridad: 'Alta',
    creadoPor: 'Dra. Elena Larrea',
    fechaRegistro: '2026-06-16T07:15:00.000Z'
  },
  {
    id: 'maint-mock-7',
    referencia: 'MC-2026-0002',
    tipo: 'Correctivo',
    codigoActivo: 'ACT-0008',
    nombreActivo: 'Autoclave Esterilizador',
    categoria: 'Equipos de Esterilización',
    ubicacion: 'Central de Esterilización',
    responsableTecnico: 'Ing. Marcos Silva',
    responsableCustodia: 'Lic. Rosa Méndez',
    fechaProgramada: '2026-06-17',
    fechaInicio: '2026-06-17',
    fechaCierre: '',
    descripcionTrabajo: 'Error de presión recurrente durante el ciclo de secado rápido.',
    diagnostico: 'Falla intermitente en el sensor de presión interno.',
    repuestosUtilizados: '',
    observaciones: 'Se procede con la limpieza de contactos del sensor y cableado.',
    estado: 'En Proceso',
    prioridad: 'Media',
    creadoPor: 'Lic. Rosa Méndez',
    fechaRegistro: '2026-06-17T09:30:00.000Z'
  },
  // 1 Correctivo en estado 'Cerrado'
  {
    id: 'maint-mock-8',
    referencia: 'MC-2026-0003',
    tipo: 'Correctivo',
    codigoActivo: 'ACT-0009',
    nombreActivo: 'Ecotógrafo Portátil',
    categoria: 'Equipos Médicos',
    ubicacion: 'Urgencias',
    responsableTecnico: 'Ing. Carlos Ortega',
    responsableCustodia: 'Dr. Juan Pérez',
    fechaProgramada: '2026-06-14',
    fechaInicio: '2026-06-14',
    fechaCierre: '2026-06-15',
    descripcionTrabajo: 'Reemplazo de la pantalla LCD rota debido a un impacto accidental.',
    diagnostico: 'Pantalla LCD rota e inoperativa.',
    repuestosUtilizados: 'Pantalla LCD compatible de 10.4 pulgadas.',
    observaciones: 'Equipo calibrado, probado y entregado plenamente operativo al área.',
    estado: 'Cerrado',
    prioridad: 'Alta',
    creadoPor: 'Dr. Juan Pérez',
    fechaRegistro: '2026-06-14T11:20:00.000Z'
  }
];

/* ------------------------------------------------------------------ */
/*  Tipado del Contexto                                               */
/* ------------------------------------------------------------------ */
interface MantenimientosContextType {
  mantenimientos: MantenimientoHEP[];
  preventivos: MantenimientoHEP[];
  correctivos: MantenimientoHEP[];
  enProceso: MantenimientoHEP[];
  cerrados: MantenimientoHEP[];
  agregarMantenimiento: (
    data: Omit<
      MantenimientoHEP,
      'id' | 'referencia' | 'fechaRegistro' | 'estado' | 'fechaInicio' | 'fechaCierre'
    >
  ) => void;
  iniciarMantenimiento: (id: string) => void;
  cerrarMantenimiento: (
    id: string,
    descripcionCierre: string,
    repuestosUtilizados: string,
    observacionesCierre: string
  ) => void;
  obtenerPorId: (id: string) => MantenimientoHEP | undefined;
}

const MantenimientosContext = createContext<MantenimientosContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider del Contexto                                             */
/* ------------------------------------------------------------------ */
export const MantenimientosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mantenimientos, setMantenimientos] = useState<MantenimientoHEP[]>(() => {
    const stored = localStorage.getItem('mantenimientos_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error al inicializar mantenimientos_hep desde localStorage:', error);
      }
    }
    // Si no hay datos, inicializamos con los mock y persistimos
    localStorage.setItem('mantenimientos_hep', JSON.stringify(MOCK_MANTENIMIENTOS_INICIALES));
    return MOCK_MANTENIMIENTOS_INICIALES;
  });

  // Guardar en localStorage cada vez que cambie el array
  useEffect(() => {
    localStorage.setItem('mantenimientos_hep', JSON.stringify(mantenimientos));
  }, [mantenimientos]);

  // Filtrado memoizado de listas
  const preventivos = useMemo(() => {
    return mantenimientos.filter(m => m.tipo === 'Preventivo');
  }, [mantenimientos]);

  const correctivos = useMemo(() => {
    return mantenimientos.filter(m => m.tipo === 'Correctivo');
  }, [mantenimientos]);

  const enProceso = useMemo(() => {
    return mantenimientos.filter(m => m.estado === 'En Proceso');
  }, [mantenimientos]);

  const cerrados = useMemo(() => {
    return mantenimientos.filter(m => m.estado === 'Cerrado');
  }, [mantenimientos]);

  // Agregar mantenimiento
  const agregarMantenimiento = (
    data: Omit<
      MantenimientoHEP,
      'id' | 'referencia' | 'fechaRegistro' | 'estado' | 'fechaInicio' | 'fechaCierre'
    >
  ) => {
    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const prefix = data.tipo === 'Preventivo' ? 'MP' : 'MC';

    // NNNN = contador total de ese tipo + 1
    const countOfType = mantenimientos.filter(m => m.tipo === data.tipo).length;
    const nextNum = countOfType + 1;
    const referencia = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
    const fechaRegistro = new Date().toISOString();

    const nuevoMantenimiento: MantenimientoHEP = {
      ...data,
      id,
      referencia,
      fechaRegistro,
      estado: 'Programado',
      fechaInicio: '',
      fechaCierre: ''
    };

    setMantenimientos(prev => [...prev, nuevoMantenimiento]);
  };

  // Iniciar mantenimiento
  const iniciarMantenimiento = (id: string) => {
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setMantenimientos(prev =>
      prev.map(m => {
        if (m.id === id) {
          return {
            ...m,
            estado: 'En Proceso',
            fechaInicio: localDateStr // Formato YYYY-MM-DD
          };
        }
        return m;
      })
    );
  };

  // Cerrar mantenimiento
  const cerrarMantenimiento = (
    id: string,
    descripcionCierre: string,
    repuestosUtilizados: string,
    observacionesCierre: string
  ) => {
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setMantenimientos(prev =>
      prev.map(m => {
        if (m.id === id) {
          return {
            ...m,
            estado: 'Cerrado',
            fechaCierre: localDateStr, // Formato YYYY-MM-DD
            descripcionTrabajo: descripcionCierre,
            repuestosUtilizados: repuestosUtilizados,
            observaciones: observacionesCierre
          };
        }
        return m;
      })
    );
  };

  // Obtener por ID
  const obtenerPorId = (id: string): MantenimientoHEP | undefined => {
    return mantenimientos.find(m => m.id === id);
  };

  return (
    <MantenimientosContext.Provider
      value={{
        mantenimientos,
        preventivos,
        correctivos,
        enProceso,
        cerrados,
        agregarMantenimiento,
        iniciarMantenimiento,
        cerrarMantenimiento,
        obtenerPorId
      }}
    >
      {children}
    </MantenimientosContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Hook de Consumo del Contexto                                      */
/* ------------------------------------------------------------------ */
export const useMantenimientosContext = () => {
  const context = useContext(MantenimientosContext);
  if (!context) {
    throw new Error('useMantenimientosContext debe usarse dentro de MantenimientosProvider');
  }
  return context;
};
