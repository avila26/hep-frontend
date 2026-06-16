import React, { useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { useActivos, Activo } from '../../context/ActivosContext';
import {
    calcularEstadoCarga,
    descargarReporteErrores,
    formatearFechaCarga,
    leerFilasExcel,
    ResultadoImportacion,
    validarArchivoExcel
} from '../../utils/cargaMasivaUtils';

const ETIQUETAS_ESTADO_CARGA: Record<string, string> = {
    COMPLETADO: 'Completado',
    COMPLETADO_CON_ERRORES: 'Completado con errores',
    FALLIDO: 'Fallido'
};

export const CargaMasiva: React.FC = () => {
    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);
    const { activos, agregarActivo, registrarCarga, cargasMasivas } = useActivos();

    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [validado, setValidado] = useState(false);
    const [validando, setValidando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [resultados, setResultados] = useState<ResultadoImportacion[]>([]);
    const [activosValidos, setActivosValidos] = useState<Omit<Activo, 'idActivo'>[]>([]);

    const totalFilas = resultados.length;
    const filasValidas = resultados.filter(r => r.exitoso).length;
    const filasConError = resultados.filter(r => !r.exitoso).length;

    const limpiarEstadoCarga = () => {
        setArchivoSeleccionado(null);
        setNombreArchivo('');
        setValidado(false);
        setResultados([]);
        setActivosValidos([]);
        fileUploadRef.current?.clear();
    };

    const handleSeleccionArchivo = (event: FileUploadHandlerEvent) => {
        const archivo = event.files[0];
        if (!archivo) return;

        if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
            toast.current?.show({
                severity: 'error',
                summary: 'Archivo no válido',
                detail: 'Solo se permiten archivos .xlsx',
                life: 3000
            });
            fileUploadRef.current?.clear();
            return;
        }

        setArchivoSeleccionado(archivo);
        setNombreArchivo(archivo.name);
        setValidado(false);
        setResultados([]);
        setActivosValidos([]);
    };

    const handleValidarArchivo = async () => {
        if (!archivoSeleccionado) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Sin archivo',
                detail: 'Seleccione un archivo Excel antes de validar',
                life: 3000
            });
            return;
        }

        setValidando(true);
        try {
            const filas = await leerFilasExcel(archivoSeleccionado);
            const { resultados: resultadosValidacion, activosValidos: activosParseados } = validarArchivoExcel(
                filas,
                activos
            );

            setResultados(resultadosValidacion);
            setActivosValidos(activosParseados);
            setValidado(true);

            const validas = resultadosValidacion.filter(r => r.exitoso).length;
            const conError = resultadosValidacion.filter(r => !r.exitoso).length;

            toast.current?.show({
                severity: resultadosValidacion.length === 0 ? 'warn' : 'info',
                summary: 'Validación completada',
                detail:
                    resultadosValidacion.length === 0
                        ? 'El archivo no contiene filas de datos'
                        : `${validas} fila(s) válida(s), ${conError} con error`,
                life: 4000
            });
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error al validar',
                detail: 'No se pudo leer el archivo Excel',
                life: 3000
            });
        } finally {
            setValidando(false);
        }
    };

    const handleConfirmarImportacion = () => {
        if (activosValidos.length === 0) return;

        setImportando(true);
        try {
            activosValidos.forEach(activo => {
                agregarActivo({ ...activo, codigoInstitucional: '' });
            });

            const total = resultados.length;
            const exitosas = activosValidos.length;
            const conError = resultados.filter(r => !r.exitoso).length;

            registrarCarga({
                fechaCarga: new Date(),
                nombreArchivo: nombreArchivo || 'archivo.xlsx',
                totalFilas: total,
                filasExitosas: exitosas,
                filasConError: conError,
                estado: calcularEstadoCarga(exitosas, conError),
                resultados: resultados.map(({ activo, ...resto }) => resto)
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Importación exitosa',
                detail: `Se importaron ${exitosas} de ${total} activos correctamente.`,
                life: 4000
            });

            limpiarEstadoCarga();
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error al importar',
                detail: 'Ocurrió un error al registrar los activos',
                life: 3000
            });
        } finally {
            setImportando(false);
        }
    };

    const estadoPreviewBody = (rowData: ResultadoImportacion) => (
        <span
            className={`px-3 py-1 rounded text-sm font-medium ${
                rowData.exitoso ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
        >
            {rowData.exitoso ? 'Válido' : 'Error'}
        </span>
    );

    const estadoHistorialBody = (rowData: (typeof cargasMasivas)[number]) => {
        const severityMap: Record<string, string> = {
            COMPLETADO: 'bg-green-100 text-green-800',
            COMPLETADO_CON_ERRORES: 'bg-yellow-100 text-yellow-800',
            FALLIDO: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`px-3 py-1 rounded text-sm font-medium ${severityMap[rowData.estado]}`}>
                {ETIQUETAS_ESTADO_CARGA[rowData.estado]}
            </span>
        );
    };

    const fechaHistorialBody = (rowData: (typeof cargasMasivas)[number]) =>
        formatearFechaCarga(new Date(rowData.fechaCarga));

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <h1 className="text-2xl font-medium text-slate-800 dark:text-slate-100 mb-2">Carga Masiva</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
                Importe varios activos desde un archivo Excel. Valide los datos
                antes de confirmar la importación.
            </p>

            <Card className="shadow-lg pt-0">

                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        1. Cargar archivo
                    </h3>
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                        <FileUpload
                            ref={fileUploadRef}
                            mode="basic"
                            name="archivo"
                            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            maxFileSize={5000000}
                            customUpload
                            uploadHandler={handleSeleccionArchivo}
                            auto
                            chooseLabel="Seleccionar archivo"
                            className="w-full md:w-auto"
                        />
                        {nombreArchivo && (
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Archivo: <strong>{nombreArchivo}</strong>
                            </span>
                        )}
                        <Button
                            label="Validar archivo"
                            icon="pi pi-check-circle"
                            onClick={handleValidarArchivo}
                            loading={validando}
                            disabled={!archivoSeleccionado || validando}
                            className="w-full md:w-auto"
                        />
                    </div>
                </div>

                {validado && (
                    <>
                        <Divider />

                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                                2. Previsualización
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                    <p className="text-sm text-slate-500 mb-1">Total de filas</p>
                                    <p className="text-2xl font-semibold text-slate-800">{totalFilas}</p>
                                </div>
                                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                                    <p className="text-sm text-green-700 mb-1">Filas válidas</p>
                                    <p className="text-2xl font-semibold text-green-800">{filasValidas}</p>
                                </div>
                                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                                    <p className="text-sm text-red-700 mb-1">Filas con error</p>
                                    <p className="text-2xl font-semibold text-red-800">{filasConError}</p>
                                </div>
                            </div>

                            <DataTable
                                value={resultados}
                                paginator
                                rows={10}
                                rowsPerPageOptions={[5, 10, 25]}
                                emptyMessage="No hay filas para mostrar"
                                className="mb-4"
                            >
                                <Column field="numeroFila" header="N° fila" sortable style={{ width: '90px' }} />
                                <Column
                                    header="Nombre"
                                    body={row => String(row.datosFila.Nombre ?? '-')}
                                    sortable
                                />
                                <Column
                                    header="Número de Serie"
                                    body={row => String(row.datosFila['Número de Serie'] ?? '-')}
                                    sortable
                                />
                                <Column header="Estado" body={estadoPreviewBody} style={{ width: '120px' }} />
                                <Column
                                    field="mensajeError"
                                    header="Mensaje de error"
                                    body={row => row.mensajeError || '-'}
                                />
                            </DataTable>

                            <div className="flex flex-col md:flex-row gap-3 justify-end">
                                {filasConError > 0 && (
                                    <Button
                                        label="Descargar reporte de errores (.xlsx)"
                                        icon="pi pi-file-excel"
                                        severity="secondary"
                                        onClick={() => descargarReporteErrores(resultados)}
                                        className="w-full md:w-auto"
                                    />
                                )}
                                <Button
                                    label="Confirmar e importar"
                                    icon="pi pi-upload"
                                    severity="success"
                                    onClick={handleConfirmarImportacion}
                                    loading={importando}
                                    disabled={activosValidos.length === 0 || importando}
                                    className="w-full md:w-auto"
                                />
                            </div>
                        </div>
                    </>
                )}

                <Divider />

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-6 pb-3 border-b-2 border-slate-200 dark:border-slate-600">
                        3. Historial de cargas
                    </h3>

                    <DataTable
                        value={cargasMasivas}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No hay cargas masivas registradas"
                    >
                        <Column header="Fecha de carga" body={fechaHistorialBody} sortable />
                        <Column field="nombreArchivo" header="Nombre de archivo" sortable />
                        <Column field="totalFilas" header="Total filas" sortable />
                        <Column field="filasExitosas" header="Exitosas" sortable />
                        <Column field="filasConError" header="Con error" sortable />
                        <Column header="Estado" body={estadoHistorialBody} sortable field="estado" />
                    </DataTable>
                </div>
            </Card>
        </div>
    );
};

export default CargaMasiva;
