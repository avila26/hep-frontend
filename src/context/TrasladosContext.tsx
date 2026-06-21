import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useActivos } from './ActivosContext';

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
/*  Datos Mock Iniciales - Removidos                                 */
/* ------------------------------------------------------------------ */

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
  const { activos, actualizarActivo } = useActivos();
  const [traslados, setTraslados] = useState<TrasladoHEP[]>(() => {
    const stored = localStorage.getItem('traslados_hep');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter((t: any) => !t.id?.startsWith('tr-mock-')) : [];
      } catch (error) {
        console.error('Error al inicializar traslados_hep desde localStorage:', error);
      }
    }
    // Si no hay datos, inicializamos vacío
    return [];
  });

  // Guardar en localStorage cuando cambie el array de traslados
  useEffect(() => {
    localStorage.setItem('traslados_hep', JSON.stringify(traslados));
  }, [traslados]);

  // Filtrar traslados para asegurar que el activo referenciado existe en ActivosContext
  const trasladosFiltrados = useMemo(() => {
    return traslados.filter(t => activos.some(a => a.codigoInstitucional === t.codigoActivo));
  }, [traslados, activos]);

  // Filtrado de pendientes y ejecutados con useMemo
  const pendientes = useMemo(() => {
    return trasladosFiltrados.filter(t => t.estado === 'Pendiente');
  }, [trasladosFiltrados]);

  const ejecutados = useMemo(() => {
    return trasladosFiltrados.filter(t => t.estado === 'Ejecutado');
  }, [trasladosFiltrados]);

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
        // También actualizamos la ubicación y custodio del activo en el ActivosContext
        const asset = activos.find(a => a.codigoInstitucional === t.codigoActivo);
        if (asset) {
          actualizarActivo({
            ...asset,
            ubicacion: t.ubicacionDestino,
            responsableEntrega: t.nuevoResponsable
          });
        }
        const now = new Date();
        const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return {
          ...t,
          estado: 'Ejecutado',
          fechaEjecucion: localDateStr,
          ejecutadoPor
        };
      }
      return t;
    }));
  };

  // Obtener traslado por ID
  const obtenerPorId = (id: string): TrasladoHEP | undefined => {
    return trasladosFiltrados.find(t => t.id === id);
  };

  return (
    <TrasladosContext.Provider value={{
      traslados: trasladosFiltrados,
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
