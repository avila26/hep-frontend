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

interface ActivosContextType {
    activos: Activo[];
    agregarActivo: (activo: Omit<Activo, 'idActivo'>) => void;
    eliminarActivo: (idActivo: number) => void;
    actualizarActivo: (activo: Activo) => void;
}

const ActivosContext = createContext<ActivosContextType | undefined>(undefined);

export const ActivosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activos, setActivos] = useState<Activo[]>([]);

    // Cargar activos del localStorage al montar
    useEffect(() => {
        const activosGuardados = localStorage.getItem('activos_hep');
        if (activosGuardados) {
            try {
                const activosParsed = JSON.parse(activosGuardados).map((a: any) => ({
                    ...a,
                    fechaAdquisicion: a.fechaAdquisicion ? new Date(a.fechaAdquisicion) : null
                }));
                setActivos(activosParsed);
            } catch (error) {
                console.error('Error al cargar activos:', error);
            }
        }
    }, []);

    // Guardar activos en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('activos_hep', JSON.stringify(activos));
    }, [activos]);

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

    const agregarActivo = (activo: Omit<Activo, 'idActivo'>) => {
        const codigoInstitucional =
            !activo.codigoInstitucional ||
            activos.some(a => a.codigoInstitucional === activo.codigoInstitucional)
                ? generateCodigoInstitucional(activos)
                : activo.codigoInstitucional;

        const nuevoActivo: Activo = {
            ...activo,
            codigoInstitucional,
            idActivo: activos.length > 0 ? Math.max(...activos.map(a => a.idActivo)) + 1 : 1
        };
        setActivos([...activos, nuevoActivo]);
    };

    const eliminarActivo = (idActivo: number) => {
        setActivos(activos.filter(a => a.idActivo !== idActivo));
    };

    const actualizarActivo = (activo: Activo) => {
        setActivos(activos.map(a => (a.idActivo === activo.idActivo ? activo : a)));
    };

    return (
        <ActivosContext.Provider value={{ activos, agregarActivo, eliminarActivo, actualizarActivo }}>
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
