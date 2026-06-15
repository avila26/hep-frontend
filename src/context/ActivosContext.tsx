import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Activo {
    idActivo: number;
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

export interface ResultadoImportacion {
    numeroFila: number;
    exitoso: boolean;
    mensajeError?: string;
    datosFila: Record<string, unknown>;
}

export interface CargaMasivaLog {
    idCarga: number;
    fechaCarga: Date;
    nombreArchivo: string;
    totalFilas: number;
    filasExitosas: number;
    filasConError: number;
    estado: 'COMPLETADO' | 'COMPLETADO_CON_ERRORES' | 'FALLIDO';
    resultados: ResultadoImportacion[];
}

interface ActivosContextType {
    activos: Activo[];
    cargasMasivas: CargaMasivaLog[];
    agregarActivo: (activo: Omit<Activo, 'idActivo'>) => void;
    eliminarActivo: (idActivo: number) => void;
    actualizarActivo: (activo: Activo) => void;
    registrarCarga: (log: Omit<CargaMasivaLog, 'idCarga'>) => void;
}

const ActivosContext = createContext<ActivosContextType | undefined>(undefined);

const generateCodigoInstitucional = (existingActivos: Activo[]): string => {
    const prefix = 'CI';
    const year = new Date().getFullYear();
    const existingNumbers = existingActivos
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

export const ActivosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activos, setActivos] = useState<Activo[]>([]);
    const [cargasMasivas, setCargasMasivas] = useState<CargaMasivaLog[]>([]);

    useEffect(() => {
        const activosGuardados = localStorage.getItem('activos_hep');
        if (activosGuardados) {
            try {
                const activosParsed = JSON.parse(activosGuardados).map((a: Activo) => ({
                    ...a,
                    fechaAdquisicion: a.fechaAdquisicion ? new Date(a.fechaAdquisicion) : null
                }));
                setActivos(activosParsed);
            } catch (error) {
                console.error('Error al cargar activos:', error);
            }
        }

        const cargasGuardadas = localStorage.getItem('cargas_masivas_hep');
        if (cargasGuardadas) {
            try {
                const cargasParsed = JSON.parse(cargasGuardadas).map((carga: CargaMasivaLog) => ({
                    ...carga,
                    fechaCarga: new Date(carga.fechaCarga)
                }));
                setCargasMasivas(cargasParsed);
            } catch (error) {
                console.error('Error al cargar historial de cargas masivas:', error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('activos_hep', JSON.stringify(activos));
    }, [activos]);

    useEffect(() => {
        localStorage.setItem('cargas_masivas_hep', JSON.stringify(cargasMasivas));
    }, [cargasMasivas]);

    const agregarActivo = (activo: Omit<Activo, 'idActivo'>) => {
        setActivos(prev => {
            const codigoInstitucional =
                !activo.codigoInstitucional ||
                prev.some(a => a.codigoInstitucional === activo.codigoInstitucional)
                    ? generateCodigoInstitucional(prev)
                    : activo.codigoInstitucional;

            const nuevoActivo: Activo = {
                ...activo,
                codigoInstitucional,
                idActivo: prev.length > 0 ? Math.max(...prev.map(a => a.idActivo)) + 1 : 1
            };

            return [...prev, nuevoActivo];
        });
    };

    const eliminarActivo = (idActivo: number) => {
        setActivos(prev => prev.filter(a => a.idActivo !== idActivo));
    };

    const actualizarActivo = (activo: Activo) => {
        setActivos(prev => prev.map(a => (a.idActivo === activo.idActivo ? activo : a)));
    };

    const registrarCarga = (log: Omit<CargaMasivaLog, 'idCarga'>) => {
        setCargasMasivas(prev => {
            const nuevaCarga: CargaMasivaLog = {
                ...log,
                idCarga: prev.length > 0 ? Math.max(...prev.map(c => c.idCarga)) + 1 : 1
            };
            return [nuevaCarga, ...prev];
        });
    };

    return (
        <ActivosContext.Provider
            value={{ activos, cargasMasivas, agregarActivo, eliminarActivo, actualizarActivo, registrarCarga }}
        >
            {children}
        </ActivosContext.Provider>
    );
};

export const useActivos = () => {
    const context = useContext(ActivosContext);
    if (!context) {
        throw new Error('useActivos debe usarse dentro de ActivosProvider');
    }
    return context;
};
