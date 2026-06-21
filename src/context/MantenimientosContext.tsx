import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useActivos } from './ActivosContext';

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
  const { activos, actualizarActivo } = useActivos();

  const [mantenimientos, setMantenimientos] = useState<MantenimientoHEP[]>(() => {
    const stored = localStorage.getItem('mantenimientos_hep');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed)
          ? parsed.filter((m: any) => !m.id?.startsWith('maint-mock-'))
          : [];
      } catch (error) {
        console.error('Error al inicializar mantenimientos_hep desde localStorage:', error);
      }
    }
    return [];
  });

  // Guardar en localStorage cada vez que cambie el array
  useEffect(() => {
    localStorage.setItem('mantenimientos_hep', JSON.stringify(mantenimientos));
  }, [mantenimientos]);

  // Filtrar mantenimientos para asegurar que el activo referenciado existe en ActivosContext
  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter(m =>
      activos.some(a => a.codigoInstitucional === m.codigoActivo)
    );
  }, [mantenimientos, activos]);

  // Filtrado memoizado de listas usando mantenimientosFiltrados
  const preventivos = useMemo(() => {
    return mantenimientosFiltrados.filter(m => m.tipo === 'Preventivo');
  }, [mantenimientosFiltrados]);

  const correctivos = useMemo(() => {
    return mantenimientosFiltrados.filter(m => m.tipo === 'Correctivo');
  }, [mantenimientosFiltrados]);

  const enProceso = useMemo(() => {
    return mantenimientosFiltrados.filter(m => m.estado === 'En Proceso');
  }, [mantenimientosFiltrados]);

  const cerrados = useMemo(() => {
    return mantenimientosFiltrados.filter(m => m.estado === 'Cerrado');
  }, [mantenimientosFiltrados]);

  // Agregar mantenimiento
  const agregarMantenimiento = (
    data: Omit<
      MantenimientoHEP,
      'id' | 'referencia' | 'fechaRegistro' | 'estado' | 'fechaInicio' | 'fechaCierre'
    >
  ) => {
    const activoExistente = activos.find(a => a.codigoInstitucional === data.codigoActivo);
    if (!activoExistente) {
      throw new Error('El activo seleccionado no existe en el sistema');
    }

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
    const mantenimientoEncontrado = mantenimientos.find(m => m.id === id);

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

    if (mantenimientoEncontrado) {
      const activoEncontrado = activos.find(a => a.codigoInstitucional === mantenimientoEncontrado.codigoActivo);
      if (activoEncontrado) {
        actualizarActivo({
          ...activoEncontrado,
          estadoActivo: 'En Mantenimiento'
        });
      }
    }
  };

  // Cerrar mantenimiento
  const cerrarMantenimiento = (
    id: string,
    descripcionCierre: string,
    repuestosUtilizados: string,
    observacionesCierre: string
  ) => {
    const mantenimientoEncontrado = mantenimientos.find(m => m.id === id);

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

    if (mantenimientoEncontrado) {
      const activoEncontrado = activos.find(a => a.codigoInstitucional === mantenimientoEncontrado.codigoActivo);
      if (activoEncontrado) {
        actualizarActivo({
          ...activoEncontrado,
          estadoActivo: 'Activo'
        });
      }
    }
  };

  // Obtener por ID
  const obtenerPorId = (id: string): MantenimientoHEP | undefined => {
    return mantenimientosFiltrados.find(m => m.id === id);
  };

  return (
    <MantenimientosContext.Provider
      value={{
        mantenimientos: mantenimientosFiltrados,
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
