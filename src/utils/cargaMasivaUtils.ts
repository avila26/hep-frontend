import * as XLSX from 'xlsx';
import { Activo } from '../context/ActivosContext';
import {
    CATALOGOS,
    CAT_MARCA,
    COLUMNAS_PLANTILLA,
    catalogoContieneValor,
    getMarcasPermitidas
} from '../constants/activosCatalogos';
import { UBICACIONES_HEP } from '../constants/ubicacionesHep';

export interface ResultadoImportacion {
    numeroFila: number;
    exitoso: boolean;
    mensajeError?: string;
    datosFila: Record<string, unknown>;
    activo?: Omit<Activo, 'idActivo'>;
}

export const FILA_EJEMPLO: Record<string, string | number> = {
    Nombre: 'Monitor de signos vitales',
    Marca: 'Philips',
    Descripción: 'Monitor multiparamétrico para UCI',
    Modelo: 'IntelliVue MX450',
    Color: 'Blanco',
    Material: 'Plástico',
    Dimensión: '30x25x15 cm',
    'Número de Serie': 'SN-HEP-0001',
    'Código SBYE': 'SBYE-001',
    'Número de Acta': 'ACTA-2024-001',
    Categoría: 'Equipo médico (EQM)',
    'Origen de Ingreso': 'Compra',
    'Motivo de Ingreso': 'Adquisición Nueva',
    'Unidad de Medida': 'Unidad',
    'Estado del Activo': 'BUE',
    'Condición de Depreciación': 'Lineal',
    Bloque: 'Bloque C — Área Crítica (Quirófanos / UCI / Emergencia)',
    Piso: 'Piso 1',
    Servicio: 'UCI Adultos',
    'Ambiente/Sala': 'Cubículo 04',
    'Responsable de Entrega': 'Juan Pérez',
    'Administrador del Proceso': 'María González',
    'Fecha de Adquisición': '15/01/2024',
    'Valor de Adquisición': 3500,
    'Valor Unitario': 3500,
    'Tiempo de Vida Útil (años)': 5,
    'Número de Contrato': 'CONTRATO-2024-001',
    'Item Presupuestario': 'ITEM-001',
    'Partida Presupuestaria': 'PART-001',
    'Fecha DNS': '20/01/2024',
    tiene_cobertura_proveedor: 'Sí',
    nombre_proveedor: 'Philips Medical Systems',
    fecha_inicio_cobertura: '15/01/2024',
    fecha_fin_cobertura: '15/01/2026'
};

const textoCelda = (valor: unknown): string => {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
};

const celdaVacia = (valor: unknown): boolean => textoCelda(valor) === '';

export const parseFecha = (valor: unknown): Date | null => {
    if (valor === null || valor === undefined || valor === '') return null;
    if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;

    if (typeof valor === 'number') {
        const parsed = XLSX.SSF.parse_date_code(valor);
        if (parsed) {
            return new Date(parsed.y, parsed.m - 1, parsed.d);
        }
    }

    const str = textoCelda(valor);
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const fecha = new Date(year, month, day);
        if (fecha.getFullYear() === year && fecha.getMonth() === month && fecha.getDate() === day) {
            return fecha;
        }
    }

    return null;
};

const formatearFecha = (fecha: Date): string =>
    fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

const parseNumero = (valor: unknown): number | null => {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'));
    return Number.isFinite(numero) ? numero : null;
};

export const generateCodigoInstitucional = (existingActivos: Activo[]): string => {
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

export const resolverUbicacion = (
    bloqueLabel: string,
    pisoLabel: string,
    servicioLabel: string,
    ambienteLabel: string
): string | null => {
    const bloque = UBICACIONES_HEP.find(b => b.label === bloqueLabel.trim());
    const piso = bloque?.pisos.find(p => p.label === pisoLabel.trim());
    const servicio = piso?.servicios.find(s => s.label === servicioLabel.trim());
    const ambiente = ambienteLabel.trim();

    if (bloque && piso && servicio && servicio.ambientes.includes(ambiente)) {
        return `${bloque.label} > ${piso.label} > ${servicio.label} > ${ambiente}`;
    }

    return null;
};

export const descargarReporteErrores = (resultados: ResultadoImportacion[]) => {
    const filasError = resultados
        .filter(resultado => !resultado.exitoso)
        .map(resultado => ({
            'N° Fila': resultado.numeroFila,
            ...resultado.datosFila,
            'Mensaje de error': resultado.mensajeError ?? ''
        }));

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(filasError);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Errores');
    XLSX.writeFile(workbook, 'reporte_errores_carga_masiva.xlsx');
};

export const leerFilasExcel = async (archivo: File): Promise<Record<string, unknown>[]> => {
    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames.includes('Plantilla') ? 'Plantilla' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
};

const filaEstaVacia = (fila: Record<string, unknown>): boolean =>
    COLUMNAS_PLANTILLA.every(columna => celdaVacia(fila[columna]));

const validarFila = (
    fila: Record<string, unknown>,
    numeroFila: number,
    activosExistentes: Activo[],
    seriesEnArchivo: Set<string>,
    activosAcumulados: Activo[]
): ResultadoImportacion => {
    const errores: string[] = [];
    const datosFila = { ...fila };

    const nombre = textoCelda(fila.Nombre);
    const numeroSerie = textoCelda(fila['Número de Serie']);
    const marca = textoCelda(fila.Marca);
    const categoriaActivo = textoCelda(fila.Categoría);
    const origenIngreso = textoCelda(fila['Origen de Ingreso']);
    const estadoActivo = textoCelda(fila['Estado del Activo']);
    const bloque = textoCelda(fila.Bloque);
    const piso = textoCelda(fila.Piso);
    const servicio = textoCelda(fila.Servicio);
    const ambiente = textoCelda(fila['Ambiente/Sala']);
    const fechaAdquisicionRaw = fila['Fecha de Adquisición'];

    if (!nombre) errores.push('El nombre es obligatorio');

    if (!numeroSerie) {
        errores.push('El número de serie es obligatorio');
    } else {
        const serieNormalizada = numeroSerie.toLowerCase();
        if (seriesEnArchivo.has(serieNormalizada)) {
            errores.push('El número de serie está duplicado en el archivo');
        } else if (activosExistentes.some(activo => activo.numeroSerie.toLowerCase() === serieNormalizada)) {
            errores.push('El número de serie ya existe en el sistema');
        }
    }

    if (!marca) {
        errores.push('La marca es obligatoria');
    } else if (categoriaActivo) {
        const marcasPermitidas = getMarcasPermitidas(categoriaActivo);
        if (!marcasPermitidas.includes(marca)) {
            errores.push(`La marca "${marca}" no es válida para la categoría indicada`);
        }
    } else if (!Object.values(CAT_MARCA).includes(marca)) {
        errores.push(`La marca "${marca}" no existe en el catálogo`);
    }

    if (!categoriaActivo) {
        errores.push('La categoría es obligatoria');
    } else if (!catalogoContieneValor(CATALOGOS.categoriaActivo, categoriaActivo)) {
        errores.push(`La categoría "${categoriaActivo}" no es válida`);
    }

    if (!origenIngreso) {
        errores.push('El origen de ingreso es obligatorio');
    } else if (!catalogoContieneValor(CATALOGOS.origenIngreso, origenIngreso)) {
        errores.push(`El origen de ingreso "${origenIngreso}" no es válido`);
    }

    if (!estadoActivo) {
        errores.push('El estado del activo es obligatorio');
    } else if (!catalogoContieneValor(CATALOGOS.estadoActivo, estadoActivo)) {
        errores.push(`El estado del activo "${estadoActivo}" no es válido (use BUE, REG o MAL)`);
    }

    const ubicacion = resolverUbicacion(bloque, piso, servicio, ambiente);
    if (!ubicacion) {
        errores.push('La combinación Bloque/Piso/Servicio/Ambiente no es válida');
    }

    const fechaAdquisicion = parseFecha(fechaAdquisicionRaw);
    if (!fechaAdquisicionRaw || celdaVacia(fechaAdquisicionRaw)) {
        errores.push('La fecha de adquisición es obligatoria');
    } else if (!fechaAdquisicion) {
        errores.push('La fecha de adquisición no tiene un formato válido (use dd/mm/aaaa)');
    } else if (fechaAdquisicion > new Date()) {
        errores.push('La fecha de adquisición no puede ser futura');
    }

    const color = textoCelda(fila.Color);
    if (color && !catalogoContieneValor(CATALOGOS.color, color)) {
        errores.push(`El color "${color}" no es válido`);
    }

    const motivoIngreso = textoCelda(fila['Motivo de Ingreso']);
    if (motivoIngreso && !catalogoContieneValor(CATALOGOS.motivoIngreso, motivoIngreso)) {
        errores.push(`El motivo de ingreso "${motivoIngreso}" no es válido`);
    }

    const unidadMedida = textoCelda(fila['Unidad de Medida']);
    if (unidadMedida && !catalogoContieneValor(CATALOGOS.unidadMedida, unidadMedida)) {
        errores.push(`La unidad de medida "${unidadMedida}" no es válida`);
    }

    const condicionDepreciacion = textoCelda(fila['Condición de Depreciación']);
    if (condicionDepreciacion && !catalogoContieneValor(CATALOGOS.condicionDepreciacion, condicionDepreciacion)) {
        errores.push(`La condición de depreciación "${condicionDepreciacion}" no es válida`);
    }

    const valorAdquisicionRaw = fila['Valor de Adquisición'];
    if (!celdaVacia(valorAdquisicionRaw)) {
        const valorAdquisicion = parseNumero(valorAdquisicionRaw);
        if (valorAdquisicion === null || valorAdquisicion < 0) {
            errores.push('El valor de adquisición debe ser un número mayor o igual a 0');
        }
    }

    const valorUnitarioRaw = fila['Valor Unitario'];
    let valorUnitario: number | null = null;
    if (!celdaVacia(valorUnitarioRaw)) {
        valorUnitario = parseNumero(valorUnitarioRaw);
        if (valorUnitario === null || valorUnitario < 0) {
            errores.push('El valor unitario debe ser un número mayor o igual a 0');
        }
    }

    const tiempoVidaUtilRaw = fila['Tiempo de Vida Útil (años)'];
    if (!celdaVacia(tiempoVidaUtilRaw)) {
        const tiempoVidaUtil = parseNumero(tiempoVidaUtilRaw);
        if (tiempoVidaUtil === null || tiempoVidaUtil < 0 || !Number.isInteger(tiempoVidaUtil)) {
            errores.push('El tiempo de vida útil debe ser un número entero mayor o igual a 0');
        }
    }

    const fechaDnsRaw = fila['Fecha DNS'];
    if (!celdaVacia(fechaDnsRaw) && !parseFecha(fechaDnsRaw)) {
        errores.push('La fecha DNS no tiene un formato válido (use dd/mm/aaaa)');
    }

    // Cobertura por Proveedor
    const tieneCoberturaProveedorRaw = textoCelda(fila.tiene_cobertura_proveedor).toLowerCase();
    const tieneCoberturaProveedor = tieneCoberturaProveedorRaw === 'sí' || tieneCoberturaProveedorRaw === 'si' || tieneCoberturaProveedorRaw === 'true' || tieneCoberturaProveedorRaw === 'yes';
    const nombreProveedor = tieneCoberturaProveedor ? textoCelda(fila.nombre_proveedor) : '';
    const fechaInicioCobertura = tieneCoberturaProveedor ? parseFecha(fila.fecha_inicio_cobertura) : null;
    const fechaFinCobertura = tieneCoberturaProveedor ? parseFecha(fila.fecha_fin_cobertura) : null;

    if (tieneCoberturaProveedorRaw && tieneCoberturaProveedorRaw !== 'sí' && tieneCoberturaProveedorRaw !== 'si' && tieneCoberturaProveedorRaw !== 'no' && tieneCoberturaProveedorRaw !== 'false' && tieneCoberturaProveedorRaw !== 'true') {
        errores.push('El campo tiene_cobertura_proveedor debe ser "Sí" o "No"');
    }

    if (tieneCoberturaProveedor) {
        if (!nombreProveedor) {
            errores.push('El nombre del proveedor es obligatorio si tiene cobertura');
        }
        if (!fila.fecha_inicio_cobertura || celdaVacia(fila.fecha_inicio_cobertura)) {
            errores.push('La fecha de inicio de cobertura es obligatoria si tiene cobertura');
        } else if (!fechaInicioCobertura) {
            errores.push('La fecha de inicio de cobertura no tiene un formato válido (use dd/mm/aaaa)');
        }
        if (!fila.fecha_fin_cobertura || celdaVacia(fila.fecha_fin_cobertura)) {
            errores.push('La fecha de fin de cobertura es obligatoria si tiene cobertura');
        } else if (!fechaFinCobertura) {
            errores.push('La fecha de fin de cobertura no tiene un formato válido (use dd/mm/aaaa)');
        }
        if (fechaInicioCobertura && fechaFinCobertura && fechaFinCobertura <= fechaInicioCobertura) {
            errores.push('La fecha de fin de cobertura debe ser posterior a la de inicio');
        }
    }

    if (errores.length > 0) {
        return {
            numeroFila,
            exitoso: false,
            mensajeError: errores.join('; '),
            datosFila
        };
    }

    const valorAdquisicion = parseNumero(valorAdquisicionRaw);
    const tiempoVidaUtil = parseNumero(tiempoVidaUtilRaw);
    const fechaDns = parseFecha(fechaDnsRaw);
    const activosParaCodigo = [...activosExistentes, ...activosAcumulados];

    const activo: Omit<Activo, 'idActivo'> = {
        codigoInstitucional: generateCodigoInstitucional(activosParaCodigo),
        nombre,
        numeroSerie,
        descripcion: textoCelda(fila.Descripción),
        modelo: textoCelda(fila.Modelo),
        material: textoCelda(fila.Material),
        fechaAdquisicion,
        responsableEntrega: textoCelda(fila['Responsable de Entrega']),
        dimension: textoCelda(fila.Dimensión),
        numeroContrato: textoCelda(fila['Número de Contrato']),
        valorAdquisicion,
        valorUnitario,
        valorTotal: valorUnitario,
        codigoSBYE: textoCelda(fila['Código SBYE']),
        fechaDNS: fechaDns ? fechaDns.toISOString() : '',
        tiempoVidaUtil: tiempoVidaUtil !== null ? Math.trunc(tiempoVidaUtil) : null,
        bloqueado: false,
        administradorDelProceso: textoCelda(fila['Administrador del Proceso']),
        itemPresupuestario: textoCelda(fila['Item Presupuestario']),
        partidaPresupuestaria: textoCelda(fila['Partida Presupuestaria']),
        numeroActa: textoCelda(fila['Número de Acta']),
        marca,
        color,
        categoriaActivo,
        origenIngreso,
        motivoIngreso,
        unidadMedida,
        estadoActivo,
        condicionDepreciacion,
        ubicacion: ubicacion!,
        tieneCoberturaProveedor,
        nombreProveedor,
        fechaInicioCobertura: fechaInicioCobertura ?? null,
        fechaFinCobertura: fechaFinCobertura ?? null
    };

    return {
        numeroFila,
        exitoso: true,
        datosFila,
        activo
    };
};

export const validarArchivoExcel = (
    filas: Record<string, unknown>[],
    activosExistentes: Activo[]
): { resultados: ResultadoImportacion[]; activosValidos: Omit<Activo, 'idActivo'>[] } => {
    const resultados: ResultadoImportacion[] = [];
    const activosValidos: Omit<Activo, 'idActivo'>[] = [];
    const seriesEnArchivo = new Set<string>();
    const activosAcumulados: Activo[] = [];

    filas.forEach((fila, index) => {
        if (filaEstaVacia(fila)) return;

        const numeroFila = index + 2;
        const resultado = validarFila(fila, numeroFila, activosExistentes, seriesEnArchivo, activosAcumulados);
        resultados.push(resultado);

        if (resultado.exitoso && resultado.activo) {
            seriesEnArchivo.add(resultado.activo.numeroSerie.toLowerCase());
            activosValidos.push(resultado.activo);
            activosAcumulados.push({
                ...resultado.activo,
                idActivo: activosExistentes.length + activosAcumulados.length + 1
            });
        }
    });

    return { resultados, activosValidos };
};

export const calcularEstadoCarga = (
    filasExitosas: number,
    filasConError: number
): 'COMPLETADO' | 'COMPLETADO_CON_ERRORES' | 'FALLIDO' => {
    if (filasConError === 0) return 'COMPLETADO';
    if (filasExitosas > 0 && filasConError > 0) return 'COMPLETADO_CON_ERRORES';
    return 'FALLIDO';
};

export const formatearFechaCarga = (fecha: Date): string => formatearFecha(fecha);
