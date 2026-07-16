import * as XLSX from 'xlsx';
import { Activo } from '../context/ActivosContext';

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

    // dd/mm/aaaa
    const matchDMY = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (matchDMY) {
        const day = parseInt(matchDMY[1], 10);
        const month = parseInt(matchDMY[2], 10) - 1;
        const year = parseInt(matchDMY[3], 10);
        const fecha = new Date(year, month, day);
        if (fecha.getFullYear() === year && fecha.getMonth() === month && fecha.getDate() === day) {
            return fecha;
        }
    }

    // aaaa-mm-dd (ISO)
    const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchISO) {
        const year = parseInt(matchISO[1], 10);
        const month = parseInt(matchISO[2], 10) - 1;
        const day = parseInt(matchISO[3], 10);
        const fecha = new Date(year, month, day);
        if (fecha.getFullYear() === year && fecha.getMonth() === month && fecha.getDate() === day) {
            return fecha;
        }
    }

    // Intentar parseado nativo como fallback
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) return fallback;

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

const normalizarFilaExcel = (fila: Record<string, unknown>): Record<string, unknown> => {
    const filaNormalizada: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fila)) {
        const keyClean = key.toLowerCase()
            .replace(/[\r\n\t]/g, ' ') // replace newlines/tabs with space
            .replace(/\s+/g, ' ')      // collapse spaces
            .trim();
            
        if (keyClean.startsWith('no. de acta')) filaNormalizada['No. de Acta'] = value;
        else if (keyClean.startsWith('no. secuencial')) filaNormalizada['No. Secuencial'] = value;
        else if (keyClean.startsWith('id bien') || keyClean.startsWith('nombre bien') || keyClean.startsWith('nombre del bien') || keyClean.startsWith('nombre')) filaNormalizada['Nombre del Bien'] = value;
        else if (keyClean.startsWith('fecha de ingreso')) filaNormalizada['Fecha de ingreso'] = value;
        else if (keyClean.startsWith('descripción') || keyClean.startsWith('descripcion')) filaNormalizada['Descripción/Características'] = value;
        else if (keyClean.startsWith('código esbye') || keyClean.startsWith('codigo esbye')) filaNormalizada['Código eSByE'] = value;
        else if (keyClean === 'estado') filaNormalizada['Estado'] = value;
        else if (keyClean.startsWith('costo de') || keyClean.startsWith('costo')) filaNormalizada['Costo de Adquisición'] = value;
        else if (keyClean.startsWith('depreciación') || keyClean.startsWith('depreciacion')) filaNormalizada['Depreciación (S/N)'] = value;
        else if (keyClean.startsWith('garantía') || keyClean.startsWith('garantia')) filaNormalizada['Garantía (S/N)'] = value;
        else if (keyClean.startsWith('tiempo de garantía') || keyClean.startsWith('tiempo de garantia')) filaNormalizada['Tiempo de Garantía'] = value;
        else if (keyClean.startsWith('serie')) filaNormalizada['Serie'] = value;
        else if (keyClean.startsWith('modelo')) filaNormalizada['Modelo'] = value;
        else if (keyClean.startsWith('marca')) filaNormalizada['Marca'] = value;
        else if (keyClean.startsWith('valor contable')) filaNormalizada['Valor Contable'] = value;
        else if (keyClean.startsWith('valor residual')) filaNormalizada['Valor Residual'] = value;
        else if (keyClean.startsWith('valor en libros')) filaNormalizada['Valor en Libros'] = value;
        else if (keyClean.startsWith('valor depreciación acumulada') || keyClean.startsWith('valor depreciacion acumulada')) filaNormalizada['Valor Depreciación Acumulada'] = value;
        else if (keyClean.startsWith('fecha de la última depreciación') || keyClean.startsWith('fecha de la ultima depreciacion') || keyClean.startsWith('fecha última depreciación') || keyClean.startsWith('fecha ultima depreciacion')) filaNormalizada['Fecha última depreciación'] = value;
        else if (keyClean.startsWith('vida útil') || keyClean.startsWith('vida util')) filaNormalizada['Vida Útil'] = value;
        else if (keyClean.startsWith('color')) filaNormalizada['Color'] = value;
        else if (keyClean.startsWith('material')) filaNormalizada['Material'] = value;
        else if (keyClean.startsWith('dimensiones') || keyClean.startsWith('dimension')) filaNormalizada['Dimensiones'] = value;
        else if (keyClean.startsWith('observaciones')) filaNormalizada['Observaciones'] = value;
        else {
            filaNormalizada[key] = value;
        }
    }
    return filaNormalizada;
};

export const leerFilasExcel = async (archivo: File): Promise<Record<string, unknown>[]> => {
    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames.includes('2. BIENES MUEBLES') ? '2. BIENES MUEBLES' : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // range:5 → fila 6 (1-indexed) contiene los encabezados, fila 7+ los datos
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 5, defval: '' });
    if (rawRows.length > 0) {
        console.log('[CargaMasiva] Columnas detectadas en el Excel:', Object.keys(rawRows[0]));
    }
    return rawRows.map(normalizarFilaExcel);
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

export const descargarPlantillaOficial = () => {
    const link = document.createElement('a');
    link.href = '/plantilla_ingreso_activos.xlsx';
    link.download = 'plantilla_ingreso_activos.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const validarFilaOficial = (
    fila: Record<string, unknown>,
    numeroFila: number,
    activosExistentes: Activo[],
    seriesEnArchivo: Set<string>,
    activosAcumulados: Activo[]
): ResultadoImportacion => {
    const errores: string[] = [];
    const datosFila = { ...fila };

    const noActa = textoCelda(fila['No. de Acta']);
    const idBien = textoCelda(fila['Nombre del Bien']);
    const fechaIngresoRaw = fila['Fecha de ingreso'];
    const descripcion = textoCelda(fila['Descripción/Características']);
    const codigoSbye = textoCelda(fila['Código eSByE']);
    const estado = textoCelda(fila['Estado']);
    const costoAdquisicion = parseNumero(fila['Costo de Adquisición']);
    const depreciacionSN = textoCelda(fila['Depreciación (S/N)']).toUpperCase();
    const garantiaSN = textoCelda(fila['Garantía (S/N)']).toUpperCase();
    const tiempoGarantia = textoCelda(fila['Tiempo de Garantía']);
    const serie = textoCelda(fila['Serie']);
    const modelo = textoCelda(fila['Modelo']);
    const marca = textoCelda(fila['Marca']);
    const valorContable = parseNumero(fila['Valor Contable']);
    const valorResidual = parseNumero(fila['Valor Residual']);
    const valorEnLibros = parseNumero(fila['Valor en Libros']);
    const valorDepreciacionAcumulada = parseNumero(fila['Valor Depreciación Acumulada']);
    const fechaUltimaDepreciacionRaw = fila['Fecha última depreciación'];
    const vidaUtil = parseNumero(fila['Vida Útil']);
    const color = textoCelda(fila['Color']);
    const material = textoCelda(fila['Material']);
    const dimensiones = textoCelda(fila['Dimensiones']);
    const observaciones = textoCelda(fila['Observaciones']);

    if (!idBien) {
        errores.push('El campo "Nombre del Bien" es obligatorio');
    }

    // No. Secuencial es opcional (se calcula a partir del índice de fila si no existe)

    const fechaIngreso = parseFecha(fechaIngresoRaw);
    if (!fechaIngresoRaw || celdaVacia(fechaIngresoRaw)) {
        errores.push('El campo "Fecha de ingreso" es obligatorio');
    } else if (!fechaIngreso) {
        errores.push('El campo "Fecha de ingreso" no tiene un formato válido (dd/mm/aaaa o aaaa-mm-dd)');
    }

    if (!estado) {
        errores.push('El campo "Estado" es obligatorio');
    } else {
        const estNorm = estado.toUpperCase().trim();
        const estadosValidos = ['BUENO', 'REGULAR', 'MALO', 'DAÑADO', 'DANADO', 'BUE', 'REG', 'MAL', 'DAN', 'B', 'R', 'M'];
        if (!estadosValidos.includes(estNorm)) {
            errores.push(`El campo "Estado" debe ser "BUENO", "REGULAR" o "MALO" (se recibió: "${estado}")`);
        }
    }

    if (costoAdquisicion === null || costoAdquisicion < 0) {
        errores.push('El campo "Costo de Adquisición" es obligatorio y debe ser un número mayor o igual a 0');
    }

    // Normalizar S/N: aceptar S, SI, SÍ, N, NO (con o sin espacios, mayúsculas)
    const normalizarSN = (v: string): 'S' | 'N' | null => {
        const clean = v.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (clean === 'S' || clean === 'SI' || clean === 'SÍ' || clean === 'YES') return 'S';
        if (clean === 'N' || clean === 'NO' || clean === 'NOT') return 'N';
        return null;
    };

    const dSN_norm = normalizarSN(depreciacionSN);
    if (!depreciacionSN.trim() || dSN_norm === null) {
        errores.push(`El campo "Depreciación (S/N)" debe ser "S" o "N" (se recibió: "${depreciacionSN}")`);
    }

    const gSN_norm = normalizarSN(garantiaSN);
    if (!garantiaSN.trim() || gSN_norm === null) {
        errores.push(`El campo "Garantía (S/N)" debe ser "S" o "N" (se recibió: "${garantiaSN}")`);
    } else if (gSN_norm === 'S' && !tiempoGarantia) {
        errores.push('El campo "Tiempo de Garantía" es obligatorio si tiene garantía');
    }

    if (!serie) {
        errores.push('El campo "Serie" es obligatorio');
    } else {
        const serieNorm = serie.toLowerCase();
        if (seriesEnArchivo.has(serieNorm)) {
            errores.push('El número de serie está duplicado en el archivo');
        } else if (activosExistentes.some(a => a.numeroSerie.toLowerCase() === serieNorm)) {
            errores.push('El número de serie ya existe en el sistema');
        }
    }

    if (!marca) {
        errores.push('El campo "Marca" es obligatorio');
    }

    if (valorContable !== null && valorContable < 0) {
        errores.push('El campo "Valor Contable" debe ser mayor o igual a 0');
    }
    if (valorResidual !== null && valorResidual < 0) {
        errores.push('El campo "Valor Residual" debe ser mayor o igual a 0');
    }
    if (valorEnLibros !== null && valorEnLibros < 0) {
        errores.push('El campo "Valor en Libros" debe ser mayor o igual a 0');
    }
    if (valorDepreciacionAcumulada !== null && valorDepreciacionAcumulada < 0) {
        errores.push('El campo "Valor Depreciación Acumulada" debe ser mayor o igual a 0');
    }

    const fechaUltimaDepreciacion = parseFecha(fechaUltimaDepreciacionRaw);
    if (fechaUltimaDepreciacionRaw && !celdaVacia(fechaUltimaDepreciacionRaw) && !fechaUltimaDepreciacion) {
        errores.push('El campo "Fecha última depreciación" no tiene un formato válido (dd/mm/aaaa)');
    }

    if (vidaUtil !== null && vidaUtil < 0) {
        errores.push('El campo "Vida Útil" debe ser un número mayor o igual a 0');
    }

    if (errores.length > 0) {
        return {
            numeroFila,
            exitoso: false,
            mensajeError: errores.join('; '),
            datosFila
        };
    }

    // Mapear estado → código interno
    let estadoActivo = 'BUENO';
    const estUp = estado.toUpperCase().trim();
    if (estUp.startsWith('REG') || estUp === 'R') estadoActivo = 'REGULAR';
    else if (estUp.startsWith('MAL') || estUp === 'M') estadoActivo = 'MALO';
    else if (estUp.startsWith('DA') || estUp === 'D') estadoActivo = 'DAÑADO';

    // Normalizar S/N para garantia y depreciacion
    const normalizarSN2 = (v: string): string => {
        const clean = v.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return (clean === 'S' || clean === 'SI') ? 'S' : 'N';
    };
    const tieneGarantia = normalizarSN2(garantiaSN) === 'S';

    const activosParaCodigo = [...activosExistentes, ...activosAcumulados];
    const codigoInstitucional = generateCodigoInstitucional(activosParaCodigo);

    // Mapear marca
    const marcaNormalizada = marca;

    const activo: Omit<Activo, 'idActivo'> = {
        codigoInstitucional,
        nombre: idBien,
        numeroSerie: serie,
        descripcion: descripcion || observaciones || '',
        modelo: modelo || '',
        material: material || '',
        fechaAdquisicion: fechaIngreso,
        responsableEntrega: '',
        dimension: dimensiones || '',
        numeroContrato: '',
        valorAdquisicion: costoAdquisicion,
        valorUnitario: costoAdquisicion,
        valorTotal: costoAdquisicion,
        codigoSBYE: codigoSbye,
        fechaDNS: '',
        tiempoVidaUtil: vidaUtil !== null ? Math.trunc(vidaUtil) : null,
        bloqueado: false,
        administradorDelProceso: '',
        itemPresupuestario: '',
        partidaPresupuestaria: '',
        numeroActa: noActa,
        cuentaContable: '',
        marca: marcaNormalizada,
        color: color || '',
        estadoActivo,
        ubicacion: 'Bodega',
        tieneCoberturaProveedor: false,
        nombreProveedor: '',
        fechaInicioCobertura: null,
        fechaFinCobertura: null,
        
        depreciacionS_N: normalizarSN2(depreciacionSN),
        tieneGarantia,
        tiempoGarantia: tiempoGarantia || null,
        valorContable,
        valorResidual,
        valorEnLibros,
        valorDepreciacionAcumulada,
        fechaUltimaDepreciacion,
        observaciones
    };

    return {
        numeroFila,
        exitoso: true,
        datosFila,
        activo
    };
};

export const validarArchivoExcelOficial = (
    filas: Record<string, unknown>[],
    activosExistentes: Activo[]
): { resultados: ResultadoImportacion[]; activosValidos: Omit<Activo, 'idActivo'>[] } => {
    const resultados: ResultadoImportacion[] = [];
    const activosValidos: Omit<Activo, 'idActivo'>[] = [];
    const seriesEnArchivo = new Set<string>();
    const activosAcumulados: Activo[] = [];

    filas.forEach((fila, index) => {
        const vacia = Object.values(fila).every(v => v === null || v === undefined || String(v).trim() === '');
        if (vacia) return;

        const numeroFila = index + 2;
        const resultado = validarFilaOficial(fila, numeroFila, activosExistentes, seriesEnArchivo, activosAcumulados);
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

