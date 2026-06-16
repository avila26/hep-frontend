import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Interfaz Principal                                                */
/* ------------------------------------------------------------------ */
export interface TrasladoHEP {
  id: string;
  codigoActivo: string;
  nombreActivo: string;
  categoria: string;
  ubicacionOrigen: string;
  ubicacionDestino: string;
  responsableAnterior: string;
  nuevoResponsable: string;
  fechaTraslado: string;        // ISO 'YYYY-MM-DD'
  fechaEjecucion: string;       // ISO 'YYYY-MM-DD' o '' si no ejecutado aún
  motivo: string;
  observaciones: string;
  estado: 'Pendiente' | 'Ejecutado';
  ejecutadoPor: string;         // '' si aún no ejecutado
  referencia: string;           // ej: 'TR-2026-0001'
  fechaRegistro: string;        // ISO completo de cuando se registró
}

/* ------------------------------------------------------------------ */
/*  Datos Mock Iniciales                                              */
/* ------------------------------------------------------------------ */
const MOCK_TRASLADOS_INICIALES: TrasladoHEP[] = [
  // 3 Pendientes
  {
    id: 'tr-mock-1',
    codigoActivo: 'ACT-0001',
    nombreActivo: 'Ventilador Mecánico',
    categoria: 'Equipos Médicos',
    ubicacionOrigen: 'UCI',
    ubicacionDestino: 'Quirófano A',
    responsableAnterior: 'Ing. Carlos Ortega',
    nuevoResponsable: 'Dra. Elena Larrea',
    fechaTraslado: '2026-06-20',
    fechaEjecucion: '',
    motivo: 'Reasignación por aumento de demanda',
    observaciones: 'Requiere revisión técnica previa al traslado.',
    estado: 'Pendiente',
    ejecutadoPor: '',
    referencia: 'TR-2026-0001',
    fechaRegistro: '2026-06-15T08:00:00.000Z'
  },
  {
    id: 'tr-mock-2',
    codigoActivo: 'ACT-0002',
    nombreActivo: 'Monitor de Signos Vitales',
    categoria: 'Equipos de Monitoreo',
    ubicacionOrigen: 'Quirófano B',
    ubicacionDestino: 'UCI',
    responsableAnterior: 'Lic. María Gómez',
    nuevoResponsable: 'Dr. Juan Pérez',
    fechaTraslado: '2026-06-22',
    fechaEjecucion: '',
    motivo: 'Apoyo temporal para pacientes críticos',
    observaciones: '',
    estado: 'Pendiente',
    ejecutadoPor: '',
    referencia: 'TR-2026-0002',
    fechaRegistro: '2026-06-15T09:30:00.000Z'
  },
  {
    id: 'tr-mock-3',
    codigoActivo: 'ACT-0003',
    nombreActivo: 'Bomba de Infusión',
    categoria: 'Equipos Médicos',
    ubicacionOrigen: 'Hospitalización - Piso 1',
    ubicacionDestino: 'Consulta Externa',
    responsableAnterior: 'Mgs. Belén Villao',
    nuevoResponsable: 'LIC. Lisbeth Mero Garcia',
    fechaTraslado: '2026-07-02',
    fechaEjecucion: '',
    motivo: 'Reposicionamiento para campaña de vacunación',
    observaciones: 'Traslado por 15 días.',
    estado: 'Pendiente',
    ejecutadoPor: '',
    referencia: 'TR-2026-0003',
    fechaRegistro: '2026-06-15T11:45:00.000Z'
  },
  // 3 Ejecutados
  {
    id: 'tr-mock-4',
    codigoActivo: 'ACT-0010',
    nombreActivo: 'Desfibrilador Cardiaco',
    categoria: 'Equipos Médicos',
    ubicacionOrigen: 'Emergencias',
    ubicacionDestino: 'UCI',
    responsableAnterior: 'Dr. Luis Molina',
    nuevoResponsable: 'Dra. Ana Torres',
    fechaTraslado: '2026-05-10',
    fechaEjecucion: '2026-05-12',
    motivo: 'Requerimiento urgente por incremento de pacientes en UCI',
    observaciones: 'Se entrega calibrado y con accesorios completos.',
    estado: 'Ejecutado',
    ejecutadoPor: 'Carlos Mendoza',
    referencia: 'TR-2026-0004',
    fechaRegistro: '2026-05-09T14:20:00.000Z'
  },
  {
    id: 'tr-mock-5',
    codigoActivo: 'ACT-0025',
    nombreActivo: 'Electrocardiógrafo 12 Canales',
    categoria: 'Equipos Médicos',
    ubicacionOrigen: 'Consulta Externa',
    ubicacionDestino: 'Cardiología',
    responsableAnterior: 'Lic. Rosa Méndez',
    nuevoResponsable: 'Dr. Héctor Salas',
    fechaTraslado: '2026-05-15',
    fechaEjecucion: '2026-05-15',
    motivo: 'Traslado a unidad especializada de cardiología',
    observaciones: '',
    estado: 'Ejecutado',
    ejecutadoPor: 'Carlos Mendoza',
    referencia: 'TR-2026-0005',
    fechaRegistro: '2026-05-15T10:00:00.000Z'
  },
  {
    id: 'tr-mock-6',
    codigoActivo: 'ACT-0042',
    nombreActivo: 'Monitor de Signos Vitales',
    categoria: 'Equipos de Monitoreo',
    ubicacionOrigen: 'UCI',
    ubicacionDestino: 'Quirófano A',
    responsableAnterior: 'Dr. Carlos Ruiz',
    nuevoResponsable: 'Dra. Elena Larrea',
    fechaTraslado: '2026-05-20',
    fechaEjecucion: '2026-05-21',
    motivo: 'Reemplazo temporal por mantenimiento correctivo',
    observaciones: 'Préstamo provisional hasta el fin de semana.',
    estado: 'Ejecutado',
    ejecutadoPor: 'Sofía Ponce',
    referencia: 'TR-2026-0006',
    fechaRegistro: '2026-05-20T16:15:00.000Z'
  }
];

/* ------------------------------------------------------------------ */
/*  Tipado del Contexto                                               */
/* ------------------------------------------------------------------ */
interface TrasladosContextType {
  traslados: TrasladoHEP[];
  pendientes: TrasladoHEP[];
  ejecutados: TrasladoHEP[];
  agregarTraslado: (data: Omit<TrasladoHEP, 'id' | 'referencia' | 'fechaRegistro' | 'estado' | 'fechaEjecucion' | 'ejecutadoPor'>) => void;
  ejecutarTraslado: (id: string, ejecutadoPor: string) => void;
  obtenerPorId: (id: string) => TrasladoHEP | undefined;
}

const TrasladosContext = createContext<TrasladosContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider del Contexto                                             */
/* ------------------------------------------------------------------ */
export const TrasladosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [traslados, setTraslados] = useState<TrasladoHEP[]>(() => {
    const stored = localStorage.getItem('traslados_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error al inicializar traslados_hep desde localStorage:', error);
      }
    }
    // Si no hay datos, inicializamos con los mock y persistimos
    localStorage.setItem('traslados_hep', JSON.stringify(MOCK_TRASLADOS_INICIALES));
    return MOCK_TRASLADOS_INICIALES;
  });

  // Guardar en localStorage cuando cambie el array de traslados
  useEffect(() => {
    localStorage.setItem('traslados_hep', JSON.stringify(traslados));
  }, [traslados]);

  // Filtrado de pendientes y ejecutados con useMemo
  const pendientes = useMemo(() => {
    return traslados.filter(t => t.estado === 'Pendiente');
  }, [traslados]);

  const ejecutados = useMemo(() => {
    return traslados.filter(t => t.estado === 'Ejecutado');
  }, [traslados]);

  // Agregar un nuevo traslado
  const agregarTraslado = (data: Omit<TrasladoHEP, 'id' | 'referencia' | 'fechaRegistro' | 'estado' | 'fechaEjecucion' | 'ejecutadoPor'>) => {
    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const prefix = `TR-${year}-`;
    
    // Obtener todos los traslados del año actual para calcular el siguiente número correlativo
    const yearTraslados = traslados.filter(t => t.referencia.startsWith(prefix));
    const numbers = yearTraslados
      .map(t => {
        const parts = t.referencia.split('-');
        return parts.length === 3 ? parseInt(parts[2], 10) : 0;
      })
      .filter(n => !isNaN(n));
      
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const referencia = `TR-${year}-${String(nextNum).padStart(4, '0')}`;
    const fechaRegistro = new Date().toISOString();

    const nuevoTraslado: TrasladoHEP = {
      ...data,
      id,
      referencia,
      fechaRegistro,
      estado: 'Pendiente',
      fechaEjecucion: '',
      ejecutadoPor: ''
    };

    setTraslados(prev => [...prev, nuevoTraslado]);
  };

  // Ejecutar un traslado pendiente
  const ejecutarTraslado = (id: string, ejecutadoPor: string) => {
    setTraslados(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          estado: 'Ejecutado',
          fechaEjecucion: new Date().toISOString().split('T')[0], // formato ISO 'YYYY-MM-DD'
          ejecutadoPor
        };
      }
      return t;
    }));
  };

  // Obtener traslado por ID
  const obtenerPorId = (id: string): TrasladoHEP | undefined => {
    return traslados.find(t => t.id === id);
  };

  return (
    <TrasladosContext.Provider value={{
      traslados,
      pendientes,
      ejecutados,
      agregarTraslado,
      ejecutarTraslado,
      obtenerPorId
    }}>
      {children}
    </TrasladosContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Hook de Consumo del Contexto                                      */
/* ------------------------------------------------------------------ */
export const useTrasladosContext = () => {
  const context = useContext(TrasladosContext);
  if (!context) {
    throw new Error('useTrasladosContext debe usarse dentro de TrasladosProvider');
  }
  return context;
};
