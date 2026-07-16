import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import pool from '@/lib/db';

// ─── Constantes de la Matriz eSByE ───────────────────────────────────────────
const SHEET_NAME = '2. BIENES MUEBLES';
// range:5 → fila 6 (1-indexed) son los encabezados, fila 7+ son los datos
const FIRST_DATA_ROW_INDEX = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseSiNo(valor: unknown): boolean {
    if (!valor) return false;
    const s = String(valor).trim().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');  // quitar tildes
    return s === 'S' || s === 'SI';
}

function parseFecha(valor: unknown): Date | null {
    if (valor === null || valor === undefined || valor === '') return null;
    if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;

    // Número de serie de fecha de Excel (cuando cellDates:false)
    if (typeof valor === 'number') {
        const parsed = XLSX.SSF.parse_date_code(valor);
        if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
    }

    // Texto dd/mm/aaaa o dd-mm-aaaa
    const str = String(valor).trim();
    const matchDMY = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (matchDMY) {
        const d = parseInt(matchDMY[1], 10);
        const m = parseInt(matchDMY[2], 10) - 1;
        const y = parseInt(matchDMY[3], 10);
        const fecha = new Date(y, m, d);
        if (fecha.getFullYear() === y && fecha.getMonth() === m && fecha.getDate() === d) {
            return fecha;
        }
    }
    // aaaa-mm-dd (ISO)
    const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchISO) {
        const y = parseInt(matchISO[1], 10);
        const m = parseInt(matchISO[2], 10) - 1;
        const d = parseInt(matchISO[3], 10);
        const fecha = new Date(y, m, d);
        if (fecha.getFullYear() === y && fecha.getMonth() === m && fecha.getDate() === d) {
            return fecha;
        }
    }
    return null;
}

function parseNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') return null;
    const n = typeof valor === 'number' ? valor : Number(String(valor).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

function textoCelda(valor: unknown): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
}

/**
 * Normaliza el estado del activo al formato esperado por el CHECK de la DB.
 * El Excel eSByE usa texto completo: BUENO, REGULAR, MALO (y opcionalmente DAÑADO).
 * Se acepta cualquier capitalización.
 */
function normalizarEstado(valor: unknown): string | null {
    const s = textoCelda(valor).toUpperCase().trim();
    if (!s) return null;
    if (s === 'BUENO') return 'Bueno';
    if (s === 'REGULAR') return 'Regular';
    if (s === 'MALO') return 'Malo';
    if (s === 'DAÑADO' || s === 'DANADO') return 'Dañado';
    return null; // valor no reconocido → se reportará como error de validación
}

/**
 * Normaliza los encabezados del Excel (que pueden tener saltos de línea, tildes, etc.)
 * al set canónico que usamos internamente.
 */
function normalizarEncabezado(raw: string): string {
    // Limpiar saltos de línea, tabs y espacios múltiples
    const k = raw
        .toLowerCase()
        .replace(/[\r\n\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');  // quitar tildes para comparación

    if (k.startsWith('no. de acta') || k.startsWith('numero de acta')) return 'noActa';
    if (k.startsWith('no. secuencial') || k.startsWith('numero secuencial')) return 'noSecuencial';
    // Columna real: "Nombre Bien (máximo 500 caracteres)"
    if (k.startsWith('nombre bien') || k.startsWith('nombre del bien') || k.startsWith('id bien') || k.startsWith('nombre')) return 'nombreBien';
    if (k.startsWith('fecha de ingreso')) return 'fechaIngreso';
    if (k.startsWith('descripci')) return 'descripcion';
    // Columna real: "Código eSByE (numérico...)"
    if (k.startsWith('codigo esbye') || k.startsWith('codigo') && k.includes('esbye')) return 'codigoEsbye';
    if (k === 'estado') return 'estado';
    // Columna real: "Costo de Adquisición (numérico...)"
    if (k.startsWith('costo de') || k.startsWith('costo')) return 'costoAdquisicion';
    // Columna real: "Depreciación (SI=S; NO=N)" — debe ir antes de 'valor depreciacion'
    if (k.startsWith('depreciacion (') || k === 'depreciacion') return 'depreciacionSN';
    if (k.startsWith('tiempo de garant')) return 'tiempoGarantia';
    // Columna real: "Garantía (SI=S; NO=N)"
    if (k.startsWith('garantia')) return 'garantiaSN';
    // Columna real: "Serie (máximo 30 caracteres)"
    if (k.startsWith('serie')) return 'serie';
    if (k.startsWith('modelo')) return 'modelo';
    // Columna real: "Marca (numérico...)"
    if (k.startsWith('marca')) return 'marca';
    if (k.startsWith('valor contable')) return 'valorContable';
    if (k.startsWith('valor residual')) return 'valorResidual';
    if (k.startsWith('valor en libros')) return 'valorEnLibros';
    // Columna real: "Valor Depreciación Acumulada..."
    if (k.startsWith('valor depreciacion')) return 'valorDepreciacionAcumulada';
    // Columna real: "Fecha de la ultima depreciacion..."
    if (k.startsWith('fecha de la') || k.startsWith('fecha ultima')) return 'fechaUltimaDepreciacion';
    // Columna real: "Vida Util en numero de anos..."
    if (k.startsWith('vida')) return 'vidaUtil';
    if (k.startsWith('color')) return 'color';
    if (k.startsWith('material')) return 'material';
    if (k.startsWith('dimension')) return 'dimensiones';
    if (k.startsWith('observaci')) return 'observaciones';
    return k;
}

/**
 * Convierte una fila del sheet (con encabezados de Excel) al objeto normalizado.
 */
function normalizarFila(filaRaw: Record<string, unknown>): Record<string, unknown> {
    const resultado: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filaRaw)) {
        resultado[normalizarEncabezado(key)] = value;
    }
    return resultado;
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ErrorFila {
    fila: number;
    mensajes: string[];
}

interface FilaParseada {
    fila: number;
    noActa: string;
    nombreBien: string;
    fechaIngreso: Date | null;
    descripcion: string | null;
    codigoEsbye: string | null;
    estadoActivo: string | null;
    costoAdquisicion: number | null;
    depreciacionSN: string;
    tieneGarantia: boolean;
    tiempoGarantia: string | null;
    serie: string;
    modelo: string;
    marca: string;
    valorContable: number | null;
    valorResidual: number | null;
    valorEnLibros: number | null;
    valorDepreciacionAcumulada: number | null;
    fechaUltimaDepreciacion: Date | null;
    vidaUtil: number | null;
    color: string | null;
    material: string | null;
    dimensiones: string | null;
    observaciones: string | null;
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    let ubicacionDefault = 'Bodega de Ingreso';
    let responsableEntregaHeader = '';
    let referenciaActaHeader = '';  // Cuando viene del wizard de IngresoActivo

    try {
        // 1. Leer el multipart/form-data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const ubicacionFormData = formData.get('ubicacionDefault');
        const responsableFormData = formData.get('responsableEntrega');
        const referenciaFormData = formData.get('referenciaActa');

        const numeroContratoForm = formData.get('numeroContrato') as string || '';
        const cuentaContableForm = formData.get('cuentaContable') as string || '';
        const itemPresupuestarioForm = formData.get('itemPresupuestario') as string || '';
        const partidaPresupuestariaForm = formData.get('partidaPresupuestaria') as string || '';
        const nombreProveedorForm = formData.get('nombreProveedor') as string || '';
        const rucProveedorForm = formData.get('rucProveedor') as string || '';
        const tipoAdquisicionForm = formData.get('tipoAdquisicion') as string || '';
        const tipoComprobanteForm = formData.get('tipoComprobante') as string || '';
        
        const montoStr = formData.get('montoCompra') as string;
        const montoCompraForm = montoStr ? parseFloat(montoStr) : null;
        
        const descStr = formData.get('descuentoCompra') as string;
        const descuentoCompraForm = descStr ? parseFloat(descStr) : null;

        if (ubicacionFormData) {
            ubicacionDefault = String(ubicacionFormData).trim() || ubicacionDefault;
        }
        if (responsableFormData) {
            responsableEntregaHeader = String(responsableFormData).trim();
        }
        if (referenciaFormData) {
            referenciaActaHeader = String(referenciaFormData).trim();
        }

        if (!responsableEntregaHeader) {
            return NextResponse.json(
                { error: 'El campo "Responsable de Entrega" del encabezado es obligatorio.' },
                { status: 400 }
            );
        }

        if (!file) {
            return NextResponse.json({ error: 'No se adjuntó ningún archivo.' }, { status: 400 });
        }

        // 2. Parsear el Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer', cellDates: true });

        const sheetName = workbook.SheetNames.includes(SHEET_NAME)
            ? SHEET_NAME
            : workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            return NextResponse.json(
                { error: `No se encontró la hoja "${SHEET_NAME}" en el archivo.` },
                { status: 422 }
            );
        }

        // range: FIRST_DATA_ROW_INDEX → XLSX usa 0-based para el índice de fila inicial
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            range: FIRST_DATA_ROW_INDEX,
            defval: null,
        });

        if (rawRows.length === 0) {
            return NextResponse.json(
                { error: 'El archivo no contiene filas de datos (la hoja parece vacía desde la fila 7).' },
                { status: 422 }
            );
        }

        // 3. Normalizar y parsear filas
        const filasParsadas: FilaParseada[] = [];
        const erroresValidacion: ErrorFila[] = [];

        for (let i = 0; i < rawRows.length; i++) {
            const filaRaw = normalizarFila(rawRows[i]);
            const numeroFila = i + 7; // fila real en Excel

            // Saltar filas completamente vacías (separadores entre actas)
            const valoresNoVacios = Object.values(filaRaw).filter(
                v => v !== null && v !== undefined && String(v).trim() !== ''
            );
            if (valoresNoVacios.length === 0) continue;

            const errores: string[] = [];

            const noActa = textoCelda(filaRaw['noActa']);
            const nombreBien = textoCelda(filaRaw['nombreBien']);
            const fechaIngreso = parseFecha(filaRaw['fechaIngreso']);
            const descripcion = textoCelda(filaRaw['descripcion']) || null;
            const codigoEsbye = textoCelda(filaRaw['codigoEsbye']) || null;
            const estadoActivo = normalizarEstado(filaRaw['estado']);
            const costoAdquisicion = parseNumero(filaRaw['costoAdquisicion']);
            const depRaw = textoCelda(filaRaw['depreciacionSN']).toUpperCase();
            const depreciacionSN = parseSiNo(filaRaw['depreciacionSN']) ? 'SI' : 'NO';
            const tieneGarantia = parseSiNo(filaRaw['garantiaSN']);
            const tiempoGarantia = textoCelda(filaRaw['tiempoGarantia']) || null;
            const serie = textoCelda(filaRaw['serie']);
            const modelo = textoCelda(filaRaw['modelo']);
            const marca = textoCelda(filaRaw['marca']);
            const valorContable = parseNumero(filaRaw['valorContable']);
            const valorResidual = parseNumero(filaRaw['valorResidual']);
            const valorEnLibros = parseNumero(filaRaw['valorEnLibros']);
            const valorDepreciacionAcumulada = parseNumero(filaRaw['valorDepreciacionAcumulada']);
            const fechaUltimaDepreciacion = parseFecha(filaRaw['fechaUltimaDepreciacion']);
            const vidaUtil = parseNumero(filaRaw['vidaUtil']);
            const color = textoCelda(filaRaw['color']) || null;
            const material = textoCelda(filaRaw['material']) || null;
            const dimensiones = textoCelda(filaRaw['dimensiones']) || null;
            const observaciones = textoCelda(filaRaw['observaciones']) || null;

            // Validaciones de campos obligatorios
            if (!noActa) errores.push('El campo "No. de Acta" es obligatorio.');
            if (!nombreBien) errores.push('El campo "Nombre del Bien" es obligatorio.');
            if (!filaRaw['fechaIngreso']) {
                errores.push('El campo "Fecha de ingreso" es obligatorio.');
            } else if (!fechaIngreso) {
                errores.push('El campo "Fecha de ingreso" tiene formato inválido (esperado: dd/mm/aaaa).');
            } else if (fechaIngreso > new Date()) {
                errores.push('La "Fecha de ingreso" no puede ser una fecha futura.');
            }
            if (!estadoActivo) {
                errores.push('El campo "Estado" es obligatorio y debe ser: Bueno, Regular, Malo o Dañado.');
            }
            if (costoAdquisicion === null) {
                errores.push('El campo "Costo de Adquisición" es obligatorio y debe ser numérico.');
            } else if (costoAdquisicion < 0) {
                errores.push('El campo "Costo de Adquisición" debe ser ≥ 0.');
            }
            const depRawNorm = depRaw.trim();
            if (!depRawNorm || !['S', 'N', 'SI', 'NO', 'SÍ'].includes(depRawNorm)) {
                errores.push('El campo "Depreciación (S/N)" debe ser "S" o "N".');
            }
            if (!['S', 'N', 'SI', 'NO', 'SÍ'].includes(textoCelda(filaRaw['garantiaSN']).toUpperCase())) {
                errores.push('El campo "Garantía (S/N)" debe ser "S" o "N".');
            } else if (tieneGarantia && !tiempoGarantia) {
                errores.push('"Tiempo de Garantía" es obligatorio cuando la garantía es "S".');
            }
            if (!serie) {
                errores.push('El campo "Serie" es obligatorio.');
            }
            if (!marca) {
                errores.push('El campo "Marca" es obligatorio.');
            }
            if (valorContable !== null && valorContable < 0)
                errores.push('"Valor Contable" debe ser ≥ 0.');
            if (valorResidual !== null && valorResidual < 0)
                errores.push('"Valor Residual" debe ser ≥ 0.');
            if (valorEnLibros !== null && valorEnLibros < 0)
                errores.push('"Valor en Libros" debe ser ≥ 0.');
            if (valorDepreciacionAcumulada !== null && valorDepreciacionAcumulada < 0)
                errores.push('"Valor Depreciación Acumulada" debe ser ≥ 0.');
            if (vidaUtil !== null && (vidaUtil < 0 || !Number.isInteger(vidaUtil)))
                errores.push('"Vida Útil" debe ser un entero ≥ 0.');

            if (errores.length > 0) {
                erroresValidacion.push({ fila: numeroFila, mensajes: errores });
                continue;
            }

            filasParsadas.push({
                fila: numeroFila,
                noActa,
                nombreBien,
                fechaIngreso: fechaIngreso!,
                descripcion,
                codigoEsbye,
                estadoActivo: estadoActivo!,
                costoAdquisicion: costoAdquisicion!,
                depreciacionSN,
                tieneGarantia,
                tiempoGarantia,
                serie,
                modelo,
                marca,
                valorContable,
                valorResidual: valorResidual ?? (costoAdquisicion! * 0.10),
                valorEnLibros,
                valorDepreciacionAcumulada: valorDepreciacionAcumulada ?? 0,
                fechaUltimaDepreciacion,
                vidaUtil: vidaUtil !== null ? Math.trunc(vidaUtil) : null,
                color,
                material,
                dimensiones,
                observaciones,
            });
        }

        // Si hay errores de formato → devolver inmediatamente sin tocar la DB
        if (erroresValidacion.length > 0) {
            return NextResponse.json({
                exito: false,
                mensaje: `Se encontraron ${erroresValidacion.length} fila(s) con errores de validación. No se insertó ningún registro.`,
                errores: erroresValidacion,
                totalFilas: filasParsadas.length + erroresValidacion.length,
                filasValidas: filasParsadas.length,
                filasConError: erroresValidacion.length,
            });
        }

        if (filasParsadas.length === 0) {
            return NextResponse.json(
                { error: 'El archivo no contiene filas con datos válidos.' },
                { status: 422 }
            );
        }

        // 4. Conectar y ejecutar transacción
        const client = await pool.connect();
        const erroresDB: ErrorFila[] = [];
        let idCarga: number | null = null;

        try {
            await client.query('BEGIN');

            // 4a. Resolver el acta de ingreso
            //     - Modo wizard (IngresoActivo): referenciaActaHeader viene del form → 1 acta para todos
            //     - Modo standalone (CargaMasiva page): leer referencia de cada fila del Excel
            const actasMap = new Map<string, { id_acta: number }>();

            if (referenciaActaHeader) {
                // Modo wizard — un único acta para todo el lote
                const { rows } = await client.query(
                    `SELECT id_acta FROM public.actas_ingreso WHERE referencia = $1`,
                    [referenciaActaHeader]
                );
                if (rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { error: `No se encontró el acta con referencia "${referenciaActaHeader}".` },
                        { status: 422 }
                    );
                }
                actasMap.set(referenciaActaHeader, rows[0]);
                // Asignar esa misma referencia a todas las filas
                filasParsadas.forEach(f => { f.noActa = referenciaActaHeader; });
            } else {
                // Modo standalone — buscar acta por referencia en cada fila
                const referenciasUnicas = [...new Set(filasParsadas.map(f => f.noActa))];
                for (const ref of referenciasUnicas) {
                    const { rows } = await client.query(
                        `SELECT id_acta FROM public.actas_ingreso WHERE referencia = $1`,
                        [ref]
                    );
                    if (rows.length === 0) {
                        filasParsadas
                            .filter(f => f.noActa === ref)
                            .forEach(f =>
                                erroresDB.push({
                                    fila: f.fila,
                                    mensajes: [`No existe un acta con referencia "${ref}". Créela primero en actas_ingreso.`]
                                })
                            );
                    } else {
                        actasMap.set(ref, rows[0]);
                    }
                }
            }

            // 4b. Verificar series duplicadas en la DB
            const seriesExcel = filasParsadas.map(f => f.serie);
            if (seriesExcel.length > 0) {
                const { rows: seriesDup } = await client.query(
                    `SELECT numero_serie FROM public.activos WHERE numero_serie = ANY($1::text[])`,
                    [seriesExcel]
                );
                const seriesEnDB = new Set(seriesDup.map((r: any) => r.numero_serie.toLowerCase()));
                filasParsadas
                    .filter(f => seriesEnDB.has(f.serie.toLowerCase()))
                    .forEach(f =>
                        erroresDB.push({
                            fila: f.fila,
                            mensajes: [`El número de serie "${f.serie}" ya existe en el inventario de activos.`]
                        })
                    );
            }

            // Verificar series duplicadas dentro del propio Excel
            const seriesVistas = new Map<string, number>();
            for (const f of filasParsadas) {
                const key = f.serie.toLowerCase();
                if (seriesVistas.has(key)) {
                    erroresDB.push({
                        fila: f.fila,
                        mensajes: [`El número de serie "${f.serie}" está duplicado en el archivo (primera aparición: fila ${seriesVistas.get(key)}).`]
                    });
                } else {
                    seriesVistas.set(key, f.fila);
                }
            }

            if (erroresDB.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({
                    exito: false,
                    mensaje: `Se encontraron ${erroresDB.length} fila(s) con errores. No se insertó ningún registro.`,
                    errores: erroresDB,
                    totalFilas: filasParsadas.length,
                    filasValidas: filasParsadas.length - erroresDB.length,
                    filasConError: erroresDB.length,
                });
            }

            // 4c. Registrar en cargas_masivas
            const { rows: cargaRows } = await client.query(
                `INSERT INTO public.cargas_masivas
                    (nombre_archivo, total_filas, filas_exitosas, filas_con_error, estado)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id_carga`,
                [file.name, filasParsadas.length, filasParsadas.length, 0, 'COMPLETADO']
            );
            idCarga = cargaRows[0].id_carga as number;

            // 4d. Insertar activos
            for (const f of filasParsadas) {
                const acta = actasMap.get(f.noActa)!;

                // Generar código institucional vía función PG (garantiza unicidad secuencial)
                const { rows: ciRows } = await client.query(
                    `SELECT fn_generar_codigo_institucional() as code`
                );
                const codigoInstitucional: string = ciRows[0].code;

                // Generar código de barras
                const { rows: cbRows } = await client.query(
                    `SELECT fn_generar_codigo_barras($1) as code`,
                    ['General']
                );
                const codigoBarras: string = cbRows[0].code;

                await client.query(
                    `INSERT INTO public.activos (
                        codigo_institucional, nombre, numero_serie, descripcion, modelo,
                        material, fecha_adquisicion, responsable_entrega, dimension,
                        valor_adquisicion, valor_unitario, valor_total, codigo_sbye,
                        tiempo_vida_util, marca, color, estado_activo,
                        id_acta, tiene_garantia, tiempo_garantia, depreciacion_s_n,
                        valor_contable, valor_residual, valor_en_libros,
                        valor_depreciacion_acumulada, fecha_ultima_depreciacion,
                        observaciones, id_carga, numero_contrato, codigo_barras
                    ) VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
                        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
                    )`,
                    [
                        codigoInstitucional,                                          // $1
                        f.nombreBien,                                                  // $2
                        f.serie,                                                       // $3
                        f.descripcion,                                                 // $4
                        f.modelo || '',                                                // $5
                        f.material,                                                    // $6
                        f.fechaIngreso,                                                // $7
                        responsableEntregaHeader,                                      // $8 ← del encabezado del formulario
                        f.dimensiones,                                                 // $9
                        f.costoAdquisicion,                                            // $10
                        f.costoAdquisicion,                                            // $11 valor_unitario
                        f.costoAdquisicion,                                            // $12 valor_total
                        f.codigoEsbye,                                                 // $13
                        f.vidaUtil,                                                    // $14
                        f.marca,                                                       // $15
                        f.color,                                                       // $16
                        f.estadoActivo,                                                // $17
                        acta.id_acta,                                                  // $18
                        f.tieneGarantia,                                               // $19
                        f.tiempoGarantia,                                              // $20
                        f.depreciacionSN,                                              // $21
                        f.valorContable ?? f.costoAdquisicion,                         // $22
                        f.valorResidual,                                               // $23
                        f.valorEnLibros ?? f.costoAdquisicion,                         // $24
                        f.valorDepreciacionAcumulada,                                  // $25
                        f.fechaUltimaDepreciacion,                                     // $26
                        f.observaciones,                                               // $27
                        idCarga,                                                       // $28
                        numeroContratoForm,                                            // $29
                        codigoBarras                                                   // $30
                    ]
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                exito: true,
                mensaje: `Importación exitosa: ${filasParsadas.length} bienes insertados en el inventario.`,
                insertados: filasParsadas.length,
                idCarga,
            });
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error('Error en transacción de carga masiva:', err);
            return NextResponse.json(
                {
                    error: 'Error interno durante la importación. Se realizó rollback completo.',
                    details: err.message,
                },
                { status: 500 }
            );
        } finally {
            client.release();
        }
    } catch (err: any) {
        console.error('Error general en /api/activos/carga-masiva:', err);
        return NextResponse.json(
            { error: 'Error al procesar la solicitud.', details: err.message },
            { status: 500 }
        );
    }
}
