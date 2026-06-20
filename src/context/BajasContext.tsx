import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Interfaces TypeScript                                             */
/* ------------------------------------------------------------------ */
export interface BienEnInforme {
  codigoActivo: string;
  nombreActivo: string;
  categoria: string;
  ubicacion: string;
  custodioActual: string;
}

export interface InformeBajaHEP {
  id: string;
  referencia: string;              // ej: 'INF-2026-0001'
  bienes: BienEnInforme[];         // uno o más activos
  tipoSolicitante: 'TICS' | 'Mantenimiento';
  elaboradoPor: string;
  fechaElaboracion: string;        // ISO 'YYYY-MM-DD'
  antecedentes: string;            // contexto de la situación
  justificacionTecnica: string;    // motivo técnico de la baja
  recomendacion: string;           // qué se recomienda hacer
  estado: 'Pendiente' | 'Devuelto' | 'Aprobado' | 'Procesado' | 'Egresado';
  observacionesRevision: string;   // comentarios de Activo Fijo
  revisadoPor: string;             // '' si aún no revisado
  fechaRevision: string;           // ISO o '' si no revisado
  aprobadoPor: string;             // '' si no aprobado
  fechaAprobacion: string;         // ISO o ''
  motivoEgreso: string;            // '' hasta que se egrese
  fechaEgreso: string;             // ISO o ''
  registradoPorEgreso: string;     // '' hasta egreso
  historialRevisiones: {
    fecha: string;
    revisadoPor: string;
    accion: 'Devuelto' | 'Aprobado';
    comentario: string;
  }[];                              // útil porque un informe puede devolverse y reenviarse varias veces
  fechaRegistro: string;            // ISO completo de creación
}

/* ------------------------------------------------------------------ */
/*  Datos Mock Iniciales - 6 informes                                 */
/* ------------------------------------------------------------------ */
const MOCK_INFORMES_INICIALES: InformeBajaHEP[] = [
  // 1. Pendiente - TICS
  {
    id: 'baja-mock-1',
    referencia: 'INF-2026-0001',
    bienes: [
      {
        codigoActivo: 'ACT-1001',
        nombreActivo: 'Servidor ProLiant DL380 Gen8',
        categoria: 'Equipos Tecnológicos',
        ubicacion: 'Centro de Cómputo',
        custodioActual: 'Ing. Carlos Ortega'
      }
    ],
    tipoSolicitante: 'TICS',
    elaboradoPor: 'Ing. María Paz',
    fechaElaboracion: '2026-06-10',
    antecedentes: 'El servidor de base de datos local ha presentado fallas críticas en los discos duros y la placa base durante las últimas semanas.',
    justificacionTecnica: 'Equipo obsoleto sin soporte técnico y piezas descontinuadas por el fabricante. Reparación no rentable.',
    recomendacion: 'Dar de baja definitiva y proceder al reciclaje de componentes secundarios.',
    estado: 'Pendiente',
    observacionesRevision: '',
    revisadoPor: '',
    fechaRevision: '',
    aprobadoPor: '',
    fechaAprobacion: '',
    motivoEgreso: '',
    fechaEgreso: '',
    registradoPorEgreso: '',
    historialRevisiones: [],
    fechaRegistro: '2026-06-10T09:30:00.000Z'
  },
  // 2. Pendiente - Mantenimiento
  {
    id: 'baja-mock-2',
    referencia: 'INF-2026-0002',
    bienes: [
      {
        codigoActivo: 'ACT-2002',
        nombreActivo: 'Aire Acondicionado Central 60K BTU',
        categoria: 'Climatización',
        ubicacion: 'Consulta Externa - Sala de Espera',
        custodioActual: 'Lic. Rosa Méndez'
      }
    ],
    tipoSolicitante: 'Mantenimiento',
    elaboradoPor: 'Ing. Marcos Silva',
    fechaElaboracion: '2026-06-12',
    antecedentes: 'El aire acondicionado central de la sala de espera de Consulta Externa tiene más de 12 años de uso continuo.',
    justificacionTecnica: 'Vida útil cumplida según depreciación. Falla recurrente en el compresor principal y consumo eléctrico excesivo.',
    recomendacion: 'Reemplazo total por una unidad más eficiente energéticamente.',
    estado: 'Pendiente',
    observacionesRevision: '',
    revisadoPor: '',
    fechaRevision: '',
    aprobadoPor: '',
    fechaAprobacion: '',
    motivoEgreso: '',
    fechaEgreso: '',
    registradoPorEgreso: '',
    historialRevisiones: [],
    fechaRegistro: '2026-06-12T14:15:00.000Z'
  },
  // 3. Devuelto - TICS (con un registro en historialRevisiones)
  {
    id: 'baja-mock-3',
    referencia: 'INF-2026-0003',
    bienes: [
      {
        codigoActivo: 'ACT-1005',
        nombreActivo: 'Impresora HP LaserJet Pro M402',
        categoria: 'Equipos Tecnológicos',
        ubicacion: 'Admisión Principal',
        custodioActual: 'Dra. Elena Larrea'
      }
    ],
    tipoSolicitante: 'TICS',
    elaboradoPor: 'Ing. María Paz',
    fechaElaboracion: '2026-06-08',
    antecedentes: 'Impresora multifuncional asignada a Admisión. Presenta problemas constantes en el fusor y arrastre de papel.',
    justificacionTecnica: 'Desgaste excesivo de rodillos y engranajes mecánicos.',
    recomendacion: 'Dar de baja.',
    estado: 'Devuelto',
    observacionesRevision: 'Por favor detallar mejor el informe técnico. No se especifica si el costo de reparación supera el 50% del valor de adquisición.',
    revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaRevision: '2026-06-09',
    aprobadoPor: '',
    fechaAprobacion: '',
    motivoEgreso: '',
    fechaEgreso: '',
    registradoPorEgreso: '',
    historialRevisiones: [
      {
        fecha: '2026-06-09T16:00:00.000Z',
        revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
        accion: 'Devuelto',
        comentario: 'Por favor detallar mejor el informe técnico. No se especifica si el costo de reparación supera el 50% del valor de adquisición.'
      }
    ],
    fechaRegistro: '2026-06-08T10:00:00.000Z'
  },
  // 4. Aprobado - Mantenimiento
  {
    id: 'baja-mock-4',
    referencia: 'INF-2026-0004',
    bienes: [
      {
        codigoActivo: 'ACT-3004',
        nombreActivo: 'Desfibrilador Cardiaco Philips',
        categoria: 'Equipos Médicos',
        ubicacion: 'Emergencias - Box 1',
        custodioActual: 'Dr. Juan Pérez'
      }
    ],
    tipoSolicitante: 'Mantenimiento',
    elaboradoPor: 'Ing. Marcos Silva',
    fechaElaboracion: '2026-06-05',
    antecedentes: 'El desfibrilador de Emergencia sufrió una sobretensión eléctrica durante un evento climático, dañando la tarjeta lógica principal.',
    justificacionTecnica: 'Daño irreparable por cortocircuito en los circuitos integrados principales. Costo de repuesto excede el valor comercial.',
    recomendacion: 'Baja y chatarrización inmediata por riesgo de seguridad para los pacientes.',
    estado: 'Aprobado',
    observacionesRevision: 'Se aprueba la baja al evidenciar daño irreversible en componentes críticos.',
    revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaRevision: '2026-06-07',
    aprobadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaAprobacion: '2026-06-07',
    motivoEgreso: '',
    fechaEgreso: '',
    registradoPorEgreso: '',
    historialRevisiones: [
      {
        fecha: '2026-06-07T11:00:00.000Z',
        revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
        accion: 'Aprobado',
        comentario: 'Se aprueba la baja al evidenciar daño irreversible en componentes críticos.'
      }
    ],
    fechaRegistro: '2026-06-05T08:00:00.000Z'
  },
  // 5. Procesado - TICS (con múltiples bienes)
  {
    id: 'baja-mock-5',
    referencia: 'INF-2026-0005',
    bienes: [
      {
        codigoActivo: 'ACT-1010',
        nombreActivo: 'Computadora Desktop Dell OptiPlex 3020',
        categoria: 'Equipos Tecnológicos',
        ubicacion: 'Consulta Externa - Triaje',
        custodioActual: 'Dra. Elena Larrea'
      },
      {
        codigoActivo: 'ACT-1011',
        nombreActivo: 'Computadora Desktop Dell OptiPlex 3020',
        categoria: 'Equipos Tecnológicos',
        ubicacion: 'Consulta Externa - Consultorio 3',
        custodioActual: 'Dr. Héctor Salas'
      }
    ],
    tipoSolicitante: 'TICS',
    elaboradoPor: 'Ing. María Paz',
    fechaElaboracion: '2026-06-01',
    antecedentes: 'Lote de 2 computadoras de escritorio de consulta externa que no cumplen con los requisitos mínimos para el nuevo sistema HIS del hospital.',
    justificacionTecnica: 'Equipos obsoletos sin soporte de hardware para sistemas operativos modernos.',
    recomendacion: 'Baja definitiva y chatarrización tecnológica.',
    estado: 'Procesado',
    observacionesRevision: 'Aprobado para derivación a desecho tecnológico.',
    revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaRevision: '2026-06-03',
    aprobadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaAprobacion: '2026-06-03',
    motivoEgreso: '',
    fechaEgreso: '',
    registradoPorEgreso: '',
    historialRevisiones: [
      {
        fecha: '2026-06-03T15:20:00.000Z',
        revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
        accion: 'Aprobado',
        comentario: 'Aprobado para derivación a desecho tecnológico.'
      }
    ],
    fechaRegistro: '2026-06-01T11:00:00.000Z'
  },
  // 6. Egresado - Mantenimiento (con motivoEgreso y fechaEgreso completos)
  {
    id: 'baja-mock-6',
    referencia: 'INF-2026-0006',
    bienes: [
      {
        codigoActivo: 'ACT-3020',
        nombreActivo: 'Autoclave de Vapor Chambert',
        categoria: 'Equipos de Esterilización',
        ubicacion: 'Esterilización Central',
        custodioActual: 'Lic. Rosa Méndez'
      }
    ],
    tipoSolicitante: 'Mantenimiento',
    elaboradoPor: 'Ing. Marcos Silva',
    fechaElaboracion: '2026-05-20',
    antecedentes: 'Autoclave de esterilización de vapor antiguo con fisuras en la cámara de presión.',
    justificacionTecnica: 'Falla estructural severa que compromete la seguridad operacional y no pasa certificaciones de presión.',
    recomendacion: 'Baja del equipo e inicio de proceso administrativo para destrucción física de la cámara.',
    estado: 'Egresado',
    observacionesRevision: 'Proceder de inmediato con egreso físico.',
    revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaRevision: '2026-05-22',
    aprobadoPor: 'Lic. Sonia Mera (Activo Fijo)',
    fechaAprobacion: '2026-05-22',
    motivoEgreso: 'Destrucción y chatarrización física mediante acta firmada',
    fechaEgreso: '2026-05-25',
    registradoPorEgreso: 'Lic. Sonia Mera (Activo Fijo)',
    historialRevisiones: [
      {
        fecha: '2026-05-22T09:40:00.000Z',
        revisadoPor: 'Lic. Sonia Mera (Activo Fijo)',
        accion: 'Aprobado',
        comentario: 'Proceder de inmediato con egreso físico.'
      }
    ],
    fechaRegistro: '2026-05-20T14:30:00.000Z'
  }
];

/* ------------------------------------------------------------------ */
/*  Tipado del Contexto                                               */
/* ------------------------------------------------------------------ */
interface BajasContextType {
  informes: InformeBajaHEP[];
  pendientes: InformeBajaHEP[];
  aprobados: InformeBajaHEP[];
  egresados: InformeBajaHEP[];
  crearInforme: (
    data: Omit<
      InformeBajaHEP,
      | 'id'
      | 'referencia'
      | 'fechaRegistro'
      | 'estado'
      | 'observacionesRevision'
      | 'revisadoPor'
      | 'fechaRevision'
      | 'aprobadoPor'
      | 'fechaAprobacion'
      | 'motivoEgreso'
      | 'fechaEgreso'
      | 'registradoPorEgreso'
      | 'historialRevisiones'
    >
  ) => void;
  devolverInforme: (id: string, revisadoPor: string, comentario: string) => void;
  aprobarInforme: (id: string, revisadoPor: string, comentario: string) => void;
  reenviarInforme: (id: string, nuevaJustificacion: string, nuevaRecomendacion: string) => void;
  procesarInforme: (id: string) => void;
  confirmarEgreso: (id: string, motivoEgreso: string, registradoPorEgreso: string) => void;
  obtenerPorId: (id: string) => InformeBajaHEP | undefined;
}

const BajasContext = createContext<BajasContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider del Contexto                                             */
/* ------------------------------------------------------------------ */
export const BajasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [informes, setInformes] = useState<InformeBajaHEP[]>(() => {
    const stored = localStorage.getItem('bajas_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error al inicializar bajas_hep desde localStorage:', error);
      }
    }
    // Si no hay datos, inicializamos con los mock y persistimos
    localStorage.setItem('bajas_hep', JSON.stringify(MOCK_INFORMES_INICIALES));
    return MOCK_INFORMES_INICIALES;
  });

  // Guardar en localStorage cada vez que cambie el array
  useEffect(() => {
    localStorage.setItem('bajas_hep', JSON.stringify(informes));
  }, [informes]);

  // Filtrado memoizado de listas
  const pendientes = useMemo(() => {
    return informes.filter(inf => inf.estado === 'Pendiente' || inf.estado === 'Devuelto');
  }, [informes]);

  const aprobados = useMemo(() => {
    return informes.filter(inf => inf.estado === 'Aprobado' || inf.estado === 'Procesado');
  }, [informes]);

  const egresados = useMemo(() => {
    return informes.filter(inf => inf.estado === 'Egresado');
  }, [informes]);

  // Crear Informe
  const crearInforme = (
    data: Omit<
      InformeBajaHEP,
      | 'id'
      | 'referencia'
      | 'fechaRegistro'
      | 'estado'
      | 'observacionesRevision'
      | 'revisadoPor'
      | 'fechaRevision'
      | 'aprobadoPor'
      | 'fechaAprobacion'
      | 'motivoEgreso'
      | 'fechaEgreso'
      | 'registradoPorEgreso'
      | 'historialRevisiones'
    >
  ) => {
    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const nextNum = informes.length + 1;
    const referencia = `INF-${year}-${String(nextNum).padStart(4, '0')}`;
    const fechaRegistro = new Date().toISOString();

    const nuevoInforme: InformeBajaHEP = {
      ...data,
      id,
      referencia,
      estado: 'Pendiente',
      fechaRegistro,
      observacionesRevision: '',
      revisadoPor: '',
      fechaRevision: '',
      aprobadoPor: '',
      fechaAprobacion: '',
      motivoEgreso: '',
      fechaEgreso: '',
      registradoPorEgreso: '',
      historialRevisiones: []
    };

    setInformes(prev => [...prev, nuevoInforme]);
  };

  // Devolver Informe
  const devolverInforme = (id: string, revisadoPor: string, comentario: string) => {
    setInformes(prev =>
      prev.map(inf => {
        if (inf.id === id) {
          const hoy = new Date().toISOString().split('T')[0];
          const nuevoHistorial = [
            ...inf.historialRevisiones,
            {
              fecha: new Date().toISOString(),
              revisadoPor,
              accion: 'Devuelto' as const,
              comentario
            }
          ];
          return {
            ...inf,
            estado: 'Devuelto',
            revisadoPor,
            fechaRevision: hoy,
            observacionesRevision: comentario,
            historialRevisiones: nuevoHistorial
          };
        }
        return inf;
      })
    );
  };

  // Aprobar Informe
  const aprobarInforme = (id: string, revisadoPor: string, comentario: string) => {
    setInformes(prev =>
      prev.map(inf => {
        if (inf.id === id) {
          const hoy = new Date().toISOString().split('T')[0];
          const nuevoHistorial = [
            ...inf.historialRevisiones,
            {
              fecha: new Date().toISOString(),
              revisadoPor,
              accion: 'Aprobado' as const,
              comentario
            }
          ];
          return {
            ...inf,
            estado: 'Aprobado',
            revisadoPor,
            fechaRevision: hoy,
            aprobadoPor: revisadoPor,
            fechaAprobacion: hoy,
            observacionesRevision: comentario,
            historialRevisiones: nuevoHistorial
          };
        }
        return inf;
      })
    );
  };

  // Reenviar Informe
  const reenviarInforme = (id: string, nuevaJustificacion: string, nuevaRecomendacion: string) => {
    setInformes(prev =>
      prev.map(inf => {
        if (inf.id === id && inf.estado === 'Devuelto') {
          return {
            ...inf,
            estado: 'Pendiente',
            justificacionTecnica: nuevaJustificacion,
            recomendacion: nuevaRecomendacion
          };
        }
        return inf;
      })
    );
  };

  // Procesar Informe
  const procesarInforme = (id: string) => {
    setInformes(prev =>
      prev.map(inf => {
        if (inf.id === id && inf.estado === 'Aprobado') {
          return {
            ...inf,
            estado: 'Procesado'
          };
        }
        return inf;
      })
    );
  };

  // Confirmar Egreso
  const confirmarEgreso = (id: string, motivoEgreso: string, registradoPorEgreso: string) => {
    setInformes(prev =>
      prev.map(inf => {
        if (inf.id === id && inf.estado === 'Procesado') {
          const hoy = new Date().toISOString().split('T')[0];
          return {
            ...inf,
            estado: 'Egresado',
            motivoEgreso,
            registradoPorEgreso,
            fechaEgreso: hoy
          };
        }
        return inf;
      })
    );
  };

  // Obtener por ID
  const obtenerPorId = (id: string): InformeBajaHEP | undefined => {
    return informes.find(inf => inf.id === id);
  };

  return (
    <BajasContext.Provider
      value={{
        informes,
        pendientes,
        aprobados,
        egresados,
        crearInforme,
        devolverInforme,
        aprobarInforme,
        reenviarInforme,
        procesarInforme,
        confirmarEgreso,
        obtenerPorId
      }}
    >
      {children}
    </BajasContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Hook de Consumo del Contexto                                      */
/* ------------------------------------------------------------------ */
export const useBajasContext = () => {
  const context = useContext(BajasContext);
  if (!context) {
    throw new Error('useBajasContext debe usarse dentro de BajasProvider');
  }
  return context;
};
