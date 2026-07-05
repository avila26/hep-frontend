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
    agregarActivo: (activo: Omit<Activo, 'idActivo'>) => Activo;
    agregarActivos: (activos: Omit<Activo, 'idActivo'>[]) => Activo[];
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
    const [activos, setActivos] = useState<Activo[]>(() => {
        const activosGuardados = localStorage.getItem('activos_hep');
        if (activosGuardados) {
            try {
                const parseAtributosEspecificos = (attrs: any) => {
                    if (!attrs) return attrs;
                    const copy = { ...attrs };
                    if (copy.fechaFinGarantia) {
                        copy.fechaFinGarantia = new Date(copy.fechaFinGarantia);
                    }
                    return copy;
                };

                return JSON.parse(activosGuardados).map((a: any) => ({
                    ...a,
                    fechaAdquisicion: a.fechaAdquisicion ? new Date(a.fechaAdquisicion) : null,
                    fechaInicioGarantia: a.fechaInicioGarantia ? new Date(a.fechaInicioGarantia) : null,
                    fechaFinGarantia: a.fechaFinGarantia ? new Date(a.fechaFinGarantia) : null,
                    fechaInicioCobertura: a.fechaInicioCobertura ? new Date(a.fechaInicioCobertura) : null,
                    fechaFinCobertura: a.fechaFinCobertura ? new Date(a.fechaFinCobertura) : null,
                    fechaUltimaDepreciacion: a.fechaUltimaDepreciacion ? new Date(a.fechaUltimaDepreciacion) : null,
                    atributosEspecificos: parseAtributosEspecificos(a.atributosEspecificos)
                }));
            } catch (error) {
                console.error('Error al cargar activos:', error);
            }
        }
        return [];
    });

    const [cargasMasivas, setCargasMasivas] = useState<CargaMasivaLog[]>(() => {
        const cargasGuardadas = localStorage.getItem('cargas_masivas_hep');
        if (cargasGuardadas) {
            try {
                return JSON.parse(cargasGuardadas).map((carga: CargaMasivaLog) => ({
                    ...carga,
                    fechaCarga: new Date(carga.fechaCarga)
                }));
            } catch (error) {
                console.error('Error al cargar historial de cargas masivas:', error);
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('activos_hep', JSON.stringify(activos));
    }, [activos]);

    useEffect(() => {
        localStorage.setItem('cargas_masivas_hep', JSON.stringify(cargasMasivas));
    }, [cargasMasivas]);

    const agregarActivo = (activo: Omit<Activo, 'idActivo'>): Activo => {
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

        setActivos(prev => [...prev, nuevoActivo]);
        return nuevoActivo;
    };

    const agregarActivos = (nuevosActivosSinId: Omit<Activo, 'idActivo'>[]): Activo[] => {
        const creados: Activo[] = [];
        let currentList = [...activos];

        for (const activo of nuevosActivosSinId) {
            const codigoInstitucional =
                !activo.codigoInstitucional ||
                currentList.some(a => a.codigoInstitucional === activo.codigoInstitucional)
                    ? generateCodigoInstitucional(currentList)
                    : activo.codigoInstitucional;

            const nuevoActivo: Activo = {
                ...activo,
                codigoInstitucional,
                idActivo: currentList.length > 0 ? Math.max(...currentList.map(a => a.idActivo)) + 1 : 1
            };
            currentList.push(nuevoActivo);
            creados.push(nuevoActivo);
        }

        setActivos(currentList);
        return creados;
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
            value={{
                activos,
                cargasMasivas,
                agregarActivo,
                agregarActivos,
                eliminarActivo,
                actualizarActivo,
                registrarCarga
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
