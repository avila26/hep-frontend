import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AtributosEquipoBiomedico {
    voltaje?: string;
    numeroFases?: string;
    corriente?: string;
    potencia?: string;
    frecuencia?: string;
    bateria?: string;
    numeroCanales?: string;
    memoria?: string;
    tipoImpresora?: string;

    requerimientosFuncionamiento?: string[];
    requerimientoOtroDetalle?: string;

    parametrosMedidos?: string[];
    parametroOtroDetalle?: string;

    fabricante?: { nombre: string; direccion: string; telefono: string; email: string };
    proveedorConsumibles?: { nombre: string; direccion: string; telefono: string; email: string };
    proveedorMantenimiento?: { nombre: string; direccion: string; telefono: string; email: string };
    proveedorCalibracion?: { nombre: string; direccion: string; telefono: string; email: string };

    tieneGarantia?: boolean;
    fechaFinGarantia?: Date | null;
    frecuenciaMantenimientoPreventivo?: string;
    responsableMantenimiento?: string;

    // Tipo de posesión: Propio o Apoyo Tecnológico
    tipoPostesion?: 'Propio' | 'ApoyoTecnologico';
    empresaApoyo?: string;
    ordenServicio?: string;
    responsableOrden?: string;
    fechaInicioProceso?: Date | null;
    fechaFinProceso?: Date | null;

    accesorios?: { nombre: string; estado: string }[];

    informacionTecnica?: string[];
}

export interface AtributosEquipoInformatico {
    procesadorMarca?: string;
    procesadorTipo?: string;
    numeroProcesadores?: string;
    numeroNucleos?: string;
    ramMarca?: string;
    ramCapacidad?: string;
    ramTipo?: string;
    almacenamientoMarca?: string;
    almacenamientoCapacidad?: string;
    tarjetaMadreMarca?: string;
    tarjetaMadreModelo?: string;

    mouse?: { marca: string; modelo: string; serie: string; color: string; tipoInterfaz: string; codigoActivoFijo: string };
    teclado?: { marca: string; modelo: string; serie: string; color: string; tipoInterfaz: string; codigoActivoFijo: string };

    redHabilitada?: boolean;
    interfacesRed?: {
        tipo: 'LAN' | 'WAN' | 'Wireless';
        vlan: string;
        idVlan: string;
        red: string;
        ip: string;
        gateway: string;
        mac: string;
        estado: string;
    }[];

    sistemaOperativoNombre?: string;
    sistemaOperativoVersion?: string;
    sistemaOperativoLicencia?: string;
    softwareOfimaticoNombre?: string;
    softwareOfimaticoVersion?: string;
    usuarioAcceso?: string;
    passwordAcceso?: string;
}

// ─── Atributos: CPU / Unidad Central (y Laptop, Tablet, Servidor) ────────────
export interface AtributosCPU {
    procesadorMarca?: string;
    procesadorTipo?: string;
    numeroProcesadores?: string;
    numeroNucleos?: string;
    ramMarca?: string;
    ramCapacidad?: string;
    ramTipo?: string;
    almacenamientoMarca?: string;
    almacenamientoCapacidad?: string;
    tarjetaMadreMarca?: string;
    tarjetaMadreModelo?: string;
    redHabilitada?: boolean;
    interfacesRed?: {
        tipo: 'LAN' | 'WAN' | 'Wireless';
        vlan: string;
        idVlan: string;
        red: string;
        ip: string;
        gateway: string;
        mac: string;
        estado: string;
    }[];
    sistemaOperativoNombre?: string;
    sistemaOperativoVersion?: string;
    sistemaOperativoLicencia?: string;
    softwareOfimaticoNombre?: string;
    softwareOfimaticoVersion?: string;
    usuarioAcceso?: string;
    passwordAcceso?: string;
    conjuntoEstacion?: string;
}

// ─── Atributos: Monitor ───────────────────────────────────────────────────────
export interface AtributosMonitor {
    pulgadas?: string;
    conjuntoEstacion?: string;
}

// ─── Atributos: Teclado ───────────────────────────────────────────────────────
export interface AtributosTeclado {
    interfaz?: string;
    conjuntoEstacion?: string;
}

// ─── Atributos: Mouse ────────────────────────────────────────────────────────
export interface AtributosMouse {
    interfaz?: string;
    conjuntoEstacion?: string;
}

// ─── Atributos: Impresora de Red ─────────────────────────────────────────────
export interface AtributosImpresoraRed {
    ip?: string;
    mac?: string;
    nombreImpresora?: string;
    correoAsociado?: string;
    contador?: number | null;
    usuarioPuerto?: string;
}

// ─── Atributos: Teléfono IP ───────────────────────────────────────────────────
export interface AtributosTelefonoIp {
    extension?: string;
    ip?: string;
    mac?: string;
    responsables?: string;
    especialidad?: string;
}

// ─── Atributos: CCTV / NVR ───────────────────────────────────────────────────
export interface AtributosCCTV {
    tipoDispositivo?: string;
    ip?: string;
    etiquetaPunto?: string;
}

// ─── Atributos: Access Point / WiFi ──────────────────────────────────────────
export interface AtributosAccessPoint {
    mac?: string;
    codHSN?: string;
    etiquetaPunto?: string;
    puertoSwitch?: string;
}

// ─── Atributos: Equipo de Laboratorio (EQL) ──────────────────────────────────
export interface AtributosLaboratorio {
    tipoDispositivo?: string;
    marcaSerieCPU?: string;
    marcaSerieMonitor?: string;
    ipLanHospital?: string;
    macLanHospital?: string;
    ipLanBiomedica?: string;
    macLanBiomedica?: string;
    puertoCnx?: string;
    usuario?: string;
    // TODO: cifrar antes de persistir — actualmente texto plano en localStorage
    password?: string;
    licenciaWindows?: boolean;
    antivirus?: boolean;
    firewall?: boolean;
    impresoraAsociadaMarca?: string;
    impresoraAsociadaSerie?: string;
    // Garantía / Apoyo Tecnológico
    tipoPostesion?: 'Propio' | 'ApoyoTecnologico';
    tieneGarantia?: boolean;
    fechaFinGarantia?: Date | null;
    frecuenciaMantenimientoPreventivo?: string;
    responsableMantenimiento?: string;
    empresaApoyo?: string;
    ordenServicio?: string;
    responsableOrden?: string;
    fechaInicioProceso?: Date | null;
    fechaFinProceso?: Date | null;
}

// ─── Atributos: Equipo de Rayos e Imagen (EQR) ────────────────────────────────
export interface AtributosRayosImagen {
    // Tipo de equipo
    tipoEquipo?: string; // Rayos X, TAC, Mamógrafo, Fluoroscopio, Ecógrafo, RM...

    // Parámetros de radiación (solo equipos ionizantes)
    tensionPicoKvp?: string;
    corrienteMa?: string;
    tiempoExposicionMs?: string;
    potenciaMaxKw?: string;
    dosisEntradaMgy?: string;
    filtracionInherenteAlMm?: string;
    distanciaFocoReceptorCm?: string;

    // Licenciamiento SCAN (Subsecretaría de Control y Aplicaciones Nucleares)
    numeroLicenciaSCAN?: string;
    fechaEmisionLicencia?: Date | null;
    fechaVencimientoLicencia?: Date | null;
    titularLicencia?: string;
    categoriaFuenteSCAN?: string; // Cat. 1–5 según IAEA/SCAN, o 'No aplica'
    estadoLicencia?: string; // Vigente / Vencida / En renovación / No requiere

    // Oficial de Protección Radiológica (OPR)
    oprNombre?: string;
    oprTelefono?: string;
    oprEmail?: string;

    // Blindaje y seguridad de sala (ionizantes)
    materialBlindaje?: string;
    grosorBlindajePbMm?: string;
    areaControladaDefinida?: boolean;
    planEmergenciaRadiologica?: boolean;

    // Control de calidad
    frecuenciaCalibración?: string;
    fechaUltimoControlCalidad?: Date | null;
    fechaProximoControlCalidad?: Date | null;
    laboratorioCalibración?: string;
    dosimetrosPersonales?: boolean;

    // Garantía / Apoyo Tecnológico
    tipoPostesion?: 'Propio' | 'ApoyoTecnologico';
    tieneGarantia?: boolean;
    fechaFinGarantia?: Date | null;
    frecuenciaMantenimientoPreventivo?: string;
    responsableMantenimiento?: string;
    empresaApoyo?: string;
    ordenServicio?: string;
    responsableOrden?: string;
    fechaInicioProceso?: Date | null;
    fechaFinProceso?: Date | null;
}

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
    cuentaContable: string;
    marca: string;
    color: string;
    estadoActivo: string;
    ubicacion: string;
    atributosEspecificos?: AtributosEquipoBiomedico | AtributosEquipoInformatico | AtributosCPU | AtributosMonitor | AtributosTeclado | AtributosMouse | AtributosImpresoraRed | AtributosTelefonoIp | AtributosCCTV | AtributosAccessPoint | AtributosLaboratorio | AtributosRayosImagen | null;
    // ─── Campos del Acta de Ingreso (se heredan del acta al cerrarla) ───
    idActa?: number;                         // referencia al acta que originó este activo
    codigoBarras?: string;                   // formato [MóDULO]-[AÑO]-[SECUENCIAL]
    tieneGarantia?: boolean;                 // heredado del encabezado del acta
    fechaInicioGarantia?: Date | null;       // heredado del acta
    fechaFinGarantia?: Date | null;          // heredado del acta

    // ─── Campos de Cobertura de Mantenimiento por Proveedor ───
    tieneCoberturaProveedor?: boolean;
    nombreProveedor?: string;
    fechaInicioCobertura?: Date | null;
    fechaFinCobertura?: Date | null;
    // ─── Campos adicionales de la Cabecera del Acta e Ingreso de Bienes ───
    rucProveedor?: string;
    tipoAdquisicion?: string;
    descuentoCompra?: number | null;
    montoCompra?: number | null;
    tipoComprobante?: string;
    depreciacionS_N?: string;
    tiempoGarantia?: number | string | null;
    valorContable?: number | null;
    valorResidual?: number | null;
    valorEnLibros?: number | null;
    valorDepreciacionAcumulada?: number | null;
    fechaUltimaDepreciacion?: Date | null;
    observaciones?: string;
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
    agregarActivo: (activo: Omit<Activo, 'idActivo'>) => Promise<Activo>;
    agregarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Promise<Activo[]>;
    eliminarActivo: (idActivo: number) => Promise<void>;
    actualizarActivo: (activo: Activo) => Promise<void>;
    registrarCarga: (log: Omit<CargaMasivaLog, 'idCarga'>) => void;
    cargarActivos: () => Promise<void>;
}

const ActivosContext = createContext<ActivosContextType | undefined>(undefined);

export const ActivosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activos, setActivos] = useState<Activo[]>([]);
    const [cargasMasivas, setCargasMasivas] = useState<CargaMasivaLog[]>([]);

    // Cargar activos desde PostgreSQL vía API al montar
    const cargarActivos = async () => {
        try {
            const res = await fetch('/api/activos');
            if (res.ok) {
                const data = await res.json();
                // Reconstruir fechas
                const parsed = data.map((a: any) => ({
                    ...a,
                    fechaAdquisicion: a.fechaAdquisicion ? new Date(a.fechaAdquisicion) : null,
                    fechaInicioGarantia: a.fechaInicioGarantia ? new Date(a.fechaInicioGarantia) : null,
                    fechaFinGarantia: a.fechaFinGarantia ? new Date(a.fechaFinGarantia) : null,
                    fechaInicioCobertura: a.fechaInicioCobertura ? new Date(a.fechaInicioCobertura) : null,
                    fechaFinCobertura: a.fechaFinCobertura ? new Date(a.fechaFinCobertura) : null,
                    fechaUltimaDepreciacion: a.fechaUltimaDepreciacion ? new Date(a.fechaUltimaDepreciacion) : null,
                }));
                setActivos(parsed);
            }
        } catch (error) {
            console.error('Error al cargar activos:', error);
        }
    };

    useEffect(() => {
        cargarActivos();
    }, []);

    // Cargas masivas siguen en localStorage
    useEffect(() => {
        const cargasGuardadas = localStorage.getItem('cargas_masivas_hep');
        if (cargasGuardadas) {
            try {
                setCargasMasivas(JSON.parse(cargasGuardadas).map((carga: CargaMasivaLog) => ({
                    ...carga,
                    fechaCarga: new Date(carga.fechaCarga)
                })));
            } catch (error) {
                console.error('Error al cargar historial de cargas masivas:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (cargasMasivas.length > 0) {
            localStorage.setItem('cargas_masivas_hep', JSON.stringify(cargasMasivas));
        }
    }, [cargasMasivas]);

    const agregarActivo = async (activo: Omit<Activo, 'idActivo'>): Promise<Activo> => {
        const res = await fetch('/api/activos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activo)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al registrar activo');
        }
        const nuevoActivo = await res.json();
        // Formatear fechas
        const parsed = {
            ...nuevoActivo,
            fechaAdquisicion: nuevoActivo.fechaAdquisicion ? new Date(nuevoActivo.fechaAdquisicion) : null,
            fechaInicioGarantia: nuevoActivo.fechaInicioGarantia ? new Date(nuevoActivo.fechaInicioGarantia) : null,
            fechaFinGarantia: nuevoActivo.fechaFinGarantia ? new Date(nuevoActivo.fechaFinGarantia) : null,
        };
        setActivos(prev => [parsed, ...prev]);
        return parsed;
    };

    const agregarActivos = async (nuevosActivosSinId: Omit<Activo, 'idActivo'>[]): Promise<Activo[]> => {
        const creados: Activo[] = [];
        for (const activo of nuevosActivosSinId) {
            try {
                const creado = await agregarActivo(activo);
                creados.push(creado);
            } catch (e) {
                console.error('Error al registrar lote:', e);
            }
        }
        return creados;
    };

    const eliminarActivo = async (idActivo: number): Promise<void> => {
        const res = await fetch(`/api/activos/${idActivo}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al eliminar el activo');
        }
        setActivos(prev => prev.filter(a => a.idActivo !== idActivo));
    };

    const actualizarActivo = async (activo: Activo): Promise<void> => {
        const res = await fetch(`/api/activos/${activo.idActivo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activo)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al actualizar el activo');
        }
        const actualizado = await res.json();
        const parsed = {
            ...actualizado,
            fechaAdquisicion: actualizado.fechaAdquisicion ? new Date(actualizado.fechaAdquisicion) : null,
            fechaInicioGarantia: actualizado.fechaInicioGarantia ? new Date(actualizado.fechaInicioGarantia) : null,
            fechaFinGarantia: actualizado.fechaFinGarantia ? new Date(actualizado.fechaFinGarantia) : null,
            fechaInicioCobertura: actualizado.fechaInicioCobertura ? new Date(actualizado.fechaInicioCobertura) : null,
            fechaFinCobertura: actualizado.fechaFinCobertura ? new Date(actualizado.fechaFinCobertura) : null,
        };
        setActivos(prev => prev.map(a => (a.idActivo === parsed.idActivo ? parsed : a)));
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
            value={{
                activos,
                cargasMasivas,
                agregarActivo,
                agregarActivos,
                eliminarActivo,
                actualizarActivo,
                registrarCarga,
                cargarActivos
            }}
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
