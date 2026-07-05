import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { useActivos, Activo } from '../../context/ActivosContext';
import { BarcodeDownload, downloadBarcodeAsPng } from '../../components/BarcodeDownload';
import { 
    CATALOGOS, 
    CATALOGO_PROVEEDORES 
} from '../../constants/activosCatalogos';
import { 
    leerFilasExcel, 
    validarArchivoExcelOficial, 
    descargarPlantillaOficial, 
    calcularEstadoCarga 
} from '../../utils/cargaMasivaUtils';

// ─── Interfaces ───
interface CabeceraActa {
    institucionReceptora: string;
    fechaActa: Date;
    ubicacion: string;
    tipoAdquisicion: string;
    numeroContrato: string;
    cargadoPresupuesto: boolean;
    itemPresupuestario: string;
    partidaPresupuestaria: string;
    tipoComprobante: string;
    numeroComprobante: string;
    rucProveedor: string;
    nombreProveedor: string;
    montoCompra: number | null;
    descuentoCompra: number | null;
    descripcion: string;
}

const TIPO_ADQUISICION_OPTIONS = [
    { label: 'Compra', value: 'Compra' },
    { label: 'Donación', value: 'Donación' },
    { label: 'Bienes preexistentes', value: 'Bienes preexistentes' },
    { label: 'Transferencia', value: 'Transferencia' },
    { label: 'Otro', value: 'Otro' }
];

const TIPO_COMPROBANTE_OPTIONS = [
    { label: 'Factura', value: 'Factura' },
    { label: 'Nota de venta', value: 'Nota de venta' },
    { label: 'Acta de entrega-recepción', value: 'Acta de entrega-recepción' },
    { label: 'Convenio', value: 'Convenio' },
    { label: 'Otro', value: 'Otro' }
];

export const IngresoActivo: React.FC = () => {
    const toast = useRef<Toast>(null);
    const { activos, agregarActivos, registrarCarga } = useActivos();

    // ─── Control de Pasos ───
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [selectedFlow, setSelectedFlow] = useState<'masiva' | 'manual' | null>(null);

    // ─── Paso 1: Cabecera ───
    const [cabecera, setCabecera] = useState<CabeceraActa>({
        institucionReceptora: 'HEP-001 HOSPITAL ENRIQUE GARCÉS',
        fechaActa: new Date(),
        ubicacion: 'Bodega',
        tipoAdquisicion: '',
        numeroContrato: '',
        cargadoPresupuesto: false,
        itemPresupuestario: '',
        partidaPresupuestaria: '',
        tipoComprobante: '',
        numeroComprobante: '',
        rucProveedor: '',
        nombreProveedor: '',
        montoCompra: null,
        descuentoCompra: 0,
        descripcion: ''
    });
    const [cabeceraErrors, setCabeceraErrors] = useState<Record<string, string>>({});

    // ─── Paso 3 (Carga Masiva) ───
    const fileUploadRef = useRef<FileUpload>(null);
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [validado, setValidado] = useState(false);
    const [validando, setValidando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [resultadosVal, setResultadosVal] = useState<any[]>([]);
    const [activosValidos, setActivosValidos] = useState<Omit<Activo, 'idActivo'>[]>([]);

    // ─── Paso 3 (Ingreso Manual) ───
    const [bienesManuales, setBienesManuales] = useState<Omit<Activo, 'idActivo'>[]>([]);
    const [nuevoBien, setNuevoBien] = useState<Partial<Omit<Activo, 'idActivo'>>>({
        nombre: '',
        numeroSerie: '',
        codigoSBYE: '',
        estadoActivo: 'BUE',
        valorAdquisicion: null,
        depreciacionS_N: 'N',
        tieneGarantia: false,
        tiempoGarantia: '',
        modelo: '',
        marca: '',
        valorContable: null,
        valorResidual: null,
        valorEnLibros: null,
        valorDepreciacionAcumulada: null,
        fechaUltimaDepreciacion: null,
        tiempoVidaUtil: null,
        color: '',
        material: '',
        dimension: '',
        observaciones: ''
    });
    const [bienErrors, setBienErrors] = useState<Record<string, string>>({});

    // ─── Diálogos de Edición/Modificación ───
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<any>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [showConfirmModify, setShowConfirmModify] = useState(false);

    // ─── Pantalla Final / Éxito ───
    const [activosImportados, setActivosImportados] = useState<Activo[]>([]);
    const [descargandoTodos, setDescargandoTodos] = useState(false);

    // Autocompletar RUC
    const handleRucChange = (val: string) => {
        const cleaned = val.replace(/\D/g, '').substring(0, 13);
        const found = CATALOGO_PROVEEDORES.find(p => p.ruc === cleaned);
        setCabecera(prev => ({
            ...prev,
            rucProveedor: cleaned,
            nombreProveedor: found ? found.nombre : (cleaned.length === 13 ? prev.nombreProveedor : '')
        }));
        if (cabeceraErrors.rucProveedor) {
            setCabeceraErrors(prev => ({ ...prev, rucProveedor: '' }));
        }
    };

    // Validar Cabecera
    const handleContinuarPaso2 = () => {
        const errs: Record<string, string> = {};
        if (!cabecera.tipoAdquisicion) errs.tipoAdquisicion = 'El tipo de adquisición es obligatorio';
        if (cabecera.tipoAdquisicion === 'Compra' && !cabecera.numeroContrato?.trim()) {
            errs.numeroContrato = 'El número de contrato es obligatorio para compras';
        }
        if (!cabecera.tipoComprobante) errs.tipoComprobante = 'El tipo de comprobante es obligatorio';
        if (!cabecera.numeroComprobante?.trim()) errs.numeroComprobante = 'El número de comprobante es obligatorio';
        if (!cabecera.rucProveedor?.trim()) {
            errs.rucProveedor = 'El RUC del proveedor es obligatorio';
        } else if (cabecera.rucProveedor.trim().length !== 13) {
            errs.rucProveedor = 'El RUC debe tener exactamente 13 dígitos';
        }
        if (!cabecera.nombreProveedor?.trim()) errs.nombreProveedor = 'El nombre del proveedor es obligatorio';
        if (cabecera.montoCompra === null || cabecera.montoCompra < 0) {
            errs.montoCompra = 'El monto de compra debe ser un número mayor o igual a 0';
        }
        if (!cabecera.descripcion?.trim()) errs.descripcion = 'La descripción es obligatoria';

        setCabeceraErrors(errs);

        if (Object.keys(errs).length === 0) {
            setCurrentStep(2);
        } else {
            toast.current?.show({
                severity: 'error',
                summary: 'Campos Obligatorios',
                detail: 'Por favor complete todos los campos obligatorios de la cabecera.',
                life: 3000
            });
        }
    };

    // ─── Carga Masiva: Handlers ───
    const handleSeleccionArchivo = (event: FileUploadHandlerEvent) => {
        const file = event.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            toast.current?.show({
                severity: 'error',
                summary: 'Archivo inválido',
                detail: 'Solo se permiten archivos Excel (.xlsx)',
                life: 3000
            });
            fileUploadRef.current?.clear();
            return;
        }
        setArchivoSeleccionado(file);
        setNombreArchivo(file.name);
        setValidado(false);
        setResultadosVal([]);
        setActivosValidos([]);
        fileUploadRef.current?.clear();
    };

    const handleValidarArchivo = async () => {
        if (!archivoSeleccionado) return;
        setValidando(true);
        try {
            const filas = await leerFilasExcel(archivoSeleccionado);
            const { resultados, activosValidos: parsed } = validarArchivoExcelOficial(filas, activos);
            setResultadosVal(resultados);
            setActivosValidos(parsed);
            setValidado(true);

            const conError = resultados.filter(r => !r.exitoso).length;
            toast.current?.show({
                severity: conError > 0 ? 'warn' : 'success',
                summary: 'Validación Completada',
                detail: conError > 0 ? `Se encontraron ${conError} fila(s) con errores.` : 'Todas las filas son válidas.',
                life: 4000
            });
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo leer o validar el archivo Excel.',
                life: 3000
            });
        } finally {
            setValidando(false);
        }
    };

    // Carga Masiva: Modificar un activo del listado temporal
    const openEditDialog = (rowData: any, idx: number) => {
        setEditIndex(idx);
        setEditData({ ...(rowData.activo || rowData.datosFila) });
        setEditErrors({});
        setShowEditDialog(true);
    };

    const handleSaveEdit = () => {
        const errs: Record<string, string> = {};
        if (!editData.nombre?.trim()) errs.nombre = 'El ID Bien (Nombre) es obligatorio';
        if (!editData.numeroSerie?.trim()) errs.numeroSerie = 'El número de serie es obligatorio';
        if (!editData.marca?.trim()) errs.marca = 'La marca es obligatoria';
        if (editData.valorAdquisicion === null || editData.valorAdquisicion < 0) {
            errs.valorAdquisicion = 'El costo debe ser un número mayor o igual a 0';
        }
        if (editData.tieneGarantia && !editData.tiempoGarantia) {
            errs.tiempoGarantia = 'El tiempo de garantía es obligatorio';
        }

        setEditErrors(errs);
        if (Object.keys(errs).length === 0) {
            setShowConfirmModify(true);
        }
    };

    const confirmApplyModification = () => {
        setShowConfirmModify(false);
        setShowEditDialog(false);

        if (selectedFlow === 'masiva') {
            // Actualizar en resultadosVal y activosValidos
            setResultadosVal(prev => prev.map((item, idx) => {
                if (idx === editIndex) {
                    return {
                        ...item,
                        exitoso: true,
                        mensajeError: '',
                        activo: { ...item.activo, ...editData }
                    };
                }
                return item;
            }));
            setActivosValidos(prev => prev.map((item, idx) => {
                if (idx === editIndex) {
                    return { ...item, ...editData };
                }
                return item;
            }));
        } else {
            // Modo manual
            setBienesManuales(prev => prev.map((item, idx) => {
                if (idx === editIndex) {
                    return { ...item, ...editData };
                }
                return item;
            }));
        }

        toast.current?.show({
            severity: 'success',
            summary: 'Modificación Aplicada',
            detail: 'El bien ha sido modificado y validado con éxito.',
            life: 2500
        });
    };

    const handleConfirmarImportacionMasiva = () => {
        if (activosValidos.length === 0) return;
        setImportando(true);
        try {
            // Mapear los activos heredando los campos de la cabecera
            const activosFinales = activosValidos.map(act => ({
                ...act,
                rucProveedor: cabecera.rucProveedor,
                tipoAdquisicion: cabecera.tipoAdquisicion,
                numeroContrato: cabecera.numeroContrato || '',
                montoCompra: cabecera.montoCompra,
                descuentoCompra: cabecera.descuentoCompra,
                tipoComprobante: cabecera.tipoComprobante,
                responsableEntrega: 'Bodeguero',
                fechaAdquisicion: cabecera.fechaActa
            }));

            const creados = agregarActivos(activosFinales);

            registrarCarga({
                fechaCarga: new Date(),
                nombreArchivo: nombreArchivo || 'carga_masiva.xlsx',
                totalFilas: resultadosVal.length,
                filasExitosas: activosValidos.length,
                filasConError: resultadosVal.length - activosValidos.length,
                estado: calcularEstadoCarga(activosValidos.length, resultadosVal.length - activosValidos.length),
                resultados: resultadosVal.map(({ activo, ...resto }) => resto)
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Ingreso Completado',
                detail: `Se ingresaron ${creados.length} activos correctamente en el acta.`,
                life: 3000
            });

            setActivosImportados(creados);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al registrar los activos.',
                life: 3000
            });
        } finally {
            setImportando(false);
        }
    };

    // ─── Ingreso Manual: Handlers ───
    const handleAddBienManual = () => {
        const errs: Record<string, string> = {};
        if (!nuevoBien.nombre?.trim()) errs.nombre = 'El ID Bien (Nombre) es obligatorio';
        if (!nuevoBien.numeroSerie?.trim()) {
            errs.numeroSerie = 'El número de serie es obligatorio';
        } else {
            const serieNorm = nuevoBien.numeroSerie.toLowerCase();
            if (bienesManuales.some(b => b.numeroSerie.toLowerCase() === serieNorm)) {
                errs.numeroSerie = 'Este número de serie ya está en la lista actual';
            } else if (activos.some(a => a.numeroSerie.toLowerCase() === serieNorm)) {
                errs.numeroSerie = 'Este número de serie ya existe en el sistema';
            }
        }
        if (!nuevoBien.marca) errs.marca = 'La marca es obligatoria';
        if (nuevoBien.valorAdquisicion === null || nuevoBien.valorAdquisicion === undefined || nuevoBien.valorAdquisicion < 0) {
            errs.valorAdquisicion = 'El costo de adquisición es obligatorio (mayor o igual a 0)';
        }
        if (nuevoBien.tieneGarantia && !nuevoBien.tiempoGarantia) {
            errs.tiempoGarantia = 'El tiempo de garantía es obligatorio';
        }

        setBienErrors(errs);

        if (Object.keys(errs).length === 0) {
            const totalAdq = nuevoBien.valorAdquisicion || 0;
            const item: Omit<Activo, 'idActivo'> = {
                codigoInstitucional: '',
                nombre: nuevoBien.nombre!,
                numeroSerie: nuevoBien.numeroSerie!,
                descripcion: nuevoBien.descripcion || nuevoBien.observaciones || '',
                modelo: nuevoBien.modelo || '',
                material: nuevoBien.material || '',
                fechaAdquisicion: cabecera.fechaActa,
                responsableEntrega: 'Bodeguero',
                dimension: nuevoBien.dimension || '',
                numeroContrato: cabecera.numeroContrato || '',
                valorAdquisicion: totalAdq,
                valorUnitario: totalAdq,
                valorTotal: totalAdq,
                codigoSBYE: nuevoBien.codigoSBYE || '',
                fechaDNS: '',
                tiempoVidaUtil: nuevoBien.tiempoVidaUtil || null,
                bloqueado: false,
                administradorDelProceso: '',
                itemPresupuestario: cabecera.itemPresupuestario || '',
                partidaPresupuestaria: cabecera.partidaPresupuestaria || '',
                numeroActa: '', 
                marca: nuevoBien.marca!,
                color: nuevoBien.color || '',
                estadoActivo: nuevoBien.estadoActivo || 'BUE',
                ubicacion: 'Bodega',
                tieneCoberturaProveedor: false,
                nombreProveedor: '',
                fechaInicioCobertura: null,
                fechaFinCobertura: null,

                depreciacionS_N: nuevoBien.depreciacionS_N || 'N',
                tieneGarantia: !!nuevoBien.tieneGarantia,
                tiempoGarantia: nuevoBien.tiempoGarantia || null,
                valorContable: nuevoBien.valorContable !== undefined ? nuevoBien.valorContable : totalAdq,
                valorResidual: nuevoBien.valorResidual || null,
                valorEnLibros: nuevoBien.valorEnLibros !== undefined ? nuevoBien.valorEnLibros : totalAdq,
                valorDepreciacionAcumulada: nuevoBien.valorDepreciacionAcumulada || null,
                fechaUltimaDepreciacion: nuevoBien.fechaUltimaDepreciacion || null,
                observaciones: nuevoBien.observaciones || ''
            };

            setBienesManuales(prev => [...prev, item]);
            // Reset form
            setNuevoBien({
                nombre: '',
                numeroSerie: '',
                codigoSBYE: '',
                estadoActivo: 'BUE',
                valorAdquisicion: null,
                depreciacionS_N: 'N',
                tieneGarantia: false,
                tiempoGarantia: '',
                modelo: '',
                marca: '',
                valorContable: null,
                valorResidual: null,
                valorEnLibros: null,
                valorDepreciacionAcumulada: null,
                fechaUltimaDepreciacion: null,
                tiempoVidaUtil: null,
                color: '',
                material: '',
                dimension: '',
                observaciones: ''
            });
            toast.current?.show({
                severity: 'success',
                summary: 'Bien Agregado',
                detail: 'El bien se agregó a la lista del acta.',
                life: 2000
            });
        }
    };

    const handleConfirmarImportacionManual = () => {
        if (bienesManuales.length === 0) return;
        setImportando(true);
        try {
            const activosFinales = bienesManuales.map(act => ({
                ...act,
                rucProveedor: cabecera.rucProveedor,
                nombreProveedor: cabecera.nombreProveedor,
                tipoAdquisicion: cabecera.tipoAdquisicion,
                numeroContrato: cabecera.numeroContrato || '',
                montoCompra: cabecera.montoCompra,
                descuentoCompra: cabecera.descuentoCompra,
                tipoComprobante: cabecera.tipoComprobante,
                fechaAdquisicion: cabecera.fechaActa,
                numeroActa: cabecera.numeroComprobante.includes('-')
                    ? cabecera.numeroComprobante
                    : `${cabecera.numeroComprobante}-${new Date(cabecera.fechaActa).getFullYear()}`
            }));

            const creados = agregarActivos(activosFinales);

            toast.current?.show({
                severity: 'success',
                summary: 'Acta Registrada',
                detail: `Se registraron exitosamente ${creados.length} bienes en el sistema.`,
                life: 3000
            });

            setActivosImportados(creados);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al registrar los activos.',
                life: 3000
            });
        } finally {
            setImportando(false);
        }
    };

    // Descargar todos los códigos de barra PNG
    const handleDescargarTodos = async () => {
        if (activosImportados.length === 0) return;
        setDescargandoTodos(true);
        try {
            for (const act of activosImportados) {
                await downloadBarcodeAsPng(act);
                await new Promise(r => setTimeout(r, 150));
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Descarga Completada',
                detail: 'Se descargaron todos los códigos de barras en formato PNG.',
                life: 3000
            });
        } catch (error) {
            console.error(error);
        } finally {
            setDescargandoTodos(false);
        }
    };

    // Resetear todo para un nuevo registro
    const handleLimpiarTodo = () => {
        setCurrentStep(1);
        setSelectedFlow(null);
        setCabecera({
            institucionReceptora: 'HEP-001 HOSPITAL ENRIQUE GARCÉS',
            fechaActa: new Date(),
            ubicacion: 'Bodega',
            tipoAdquisicion: '',
            numeroContrato: '',
            cargadoPresupuesto: false,
            itemPresupuestario: '',
            partidaPresupuestaria: '',
            tipoComprobante: '',
            numeroComprobante: '',
            rucProveedor: '',
            nombreProveedor: '',
            montoCompra: null,
            descuentoCompra: 0,
            descripcion: ''
        });
        setCabeceraErrors({});
        setArchivoSeleccionado(null);
        setNombreArchivo('');
        setValidado(false);
        setResultadosVal([]);
        setActivosValidos([]);
        setBienesManuales([]);
        setActivosImportados([]);
    };

    // ─── Renders de Pasos ───

    // Paso 1: Cabecera Form
    const renderPaso1 = () => (
        <Card className="shadow-lg border border-slate-100 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                1. Cabecera del Acta de Ingreso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Institución Receptora */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Institución Receptora</label>
                    <InputText value={cabecera.institucionReceptora} disabled className="w-full bg-slate-50 border-slate-200 text-slate-600 font-medium" />
                </div>
                {/* Fecha Acta */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Fecha del Acta</label>
                    <Calendar value={cabecera.fechaActa} disabled dateFormat="dd/mm/yy" className="w-full bg-slate-50 text-slate-600 font-medium" />
                </div>
                {/* Ubicación */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Ubicación</label>
                    <InputText value={cabecera.ubicacion} disabled className="w-full bg-slate-50 border-slate-200 text-slate-600 font-medium" />
                </div>

                {/* Tipo Adquisición */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Tipo de Adquisición <span className="text-red-500">*</span></label>
                    <Dropdown 
                        value={cabecera.tipoAdquisicion} 
                        options={TIPO_ADQUISICION_OPTIONS} 
                        onChange={e => {
                            setCabecera(prev => ({ 
                                ...prev, 
                                tipoAdquisicion: e.value,
                                numeroContrato: e.value !== 'Compra' ? '' : prev.numeroContrato
                            }));
                            if (cabeceraErrors.tipoAdquisicion) setCabeceraErrors(prev => ({ ...prev, tipoAdquisicion: '' }));
                        }} 
                        placeholder="Seleccione tipo" 
                        className={`w-full ${cabeceraErrors.tipoAdquisicion ? 'p-invalid border-red-500' : ''}`} 
                    />
                    {cabeceraErrors.tipoAdquisicion && <small className="text-red-500 mt-1 block">{cabeceraErrors.tipoAdquisicion}</small>}
                </div>

                {/* Número Contrato */}
                {cabecera.tipoAdquisicion === 'Compra' && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Número de Contrato <span className="text-red-500">*</span></label>
                        <InputText 
                            value={cabecera.numeroContrato} 
                            onChange={e => {
                                setCabecera(prev => ({ ...prev, numeroContrato: e.target.value }));
                                if (cabeceraErrors.numeroContrato) setCabeceraErrors(prev => ({ ...prev, numeroContrato: '' }));
                            }} 
                            placeholder="Ej: CONTRATO-2026-004" 
                            className={`w-full ${cabeceraErrors.numeroContrato ? 'p-invalid border-red-500' : ''}`} 
                        />
                        {cabeceraErrors.numeroContrato && <small className="text-red-500 mt-1 block">{cabeceraErrors.numeroContrato}</small>}
                    </div>
                )}

                {/* Tipo Comprobante */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Tipo de Comprobante <span className="text-red-500">*</span></label>
                    <Dropdown 
                        value={cabecera.tipoComprobante} 
                        options={TIPO_COMPROBANTE_OPTIONS} 
                        onChange={e => {
                            setCabecera(prev => ({ ...prev, tipoComprobante: e.value }));
                            if (cabeceraErrors.tipoComprobante) setCabeceraErrors(prev => ({ ...prev, tipoComprobante: '' }));
                        }} 
                        placeholder="Seleccione comprobante" 
                        className={`w-full ${cabeceraErrors.tipoComprobante ? 'p-invalid border-red-500' : ''}`} 
                    />
                    {cabeceraErrors.tipoComprobante && <small className="text-red-500 mt-1 block">{cabeceraErrors.tipoComprobante}</small>}
                </div>

                {/* Número de Comprobante / Acta */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Número de Comprobante / Acta <span className="text-red-500">*</span></label>
                    <InputText 
                        value={cabecera.numeroComprobante || ''} 
                        onChange={e => {
                            setCabecera(prev => ({ ...prev, numeroComprobante: e.target.value }));
                            if (cabeceraErrors.numeroComprobante) setCabeceraErrors(prev => ({ ...prev, numeroComprobante: '' }));
                        }} 
                        placeholder="Ej: 045 o 045-2026" 
                        className={`w-full ${cabeceraErrors.numeroComprobante ? 'p-invalid border-red-500' : ''}`} 
                    />
                    {cabeceraErrors.numeroComprobante && <small className="text-red-500 mt-1 block">{cabeceraErrors.numeroComprobante}</small>}
                </div>

                {/* RUC */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">RUC del Proveedor <span className="text-red-500">*</span></label>
                    <InputText 
                        value={cabecera.rucProveedor} 
                        onChange={e => handleRucChange(e.target.value)} 
                        placeholder="Ingrese RUC de 13 dígitos" 
                        className={`w-full ${cabeceraErrors.rucProveedor ? 'p-invalid border-red-500' : ''}`} 
                        keyfilter="num"
                    />
                    {cabeceraErrors.rucProveedor && <small className="text-red-500 mt-1 block">{cabeceraErrors.rucProveedor}</small>}
                </div>

                {/* Nombre Proveedor */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Nombre del Proveedor <span className="text-red-500">*</span></label>
                    <InputText 
                        value={cabecera.nombreProveedor} 
                        onChange={e => {
                            setCabecera(prev => ({ ...prev, nombreProveedor: e.target.value }));
                            if (cabeceraErrors.nombreProveedor) setCabeceraErrors(prev => ({ ...prev, nombreProveedor: '' }));
                        }} 
                        placeholder="Razón Social o Nombre" 
                        className={`w-full ${cabeceraErrors.nombreProveedor ? 'p-invalid border-red-500' : ''}`} 
                    />
                    {cabeceraErrors.nombreProveedor && <small className="text-red-500 mt-1 block">{cabeceraErrors.nombreProveedor}</small>}
                </div>

                {/* Monto de Compra */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Monto de Compra (Sin IVA) <span className="text-red-500">*</span></label>
                    <InputNumber 
                        value={cabecera.montoCompra} 
                        onValueChange={e => {
                            setCabecera(prev => ({ ...prev, montoCompra: e.value ?? null }));
                            if (cabeceraErrors.montoCompra) setCabeceraErrors(prev => ({ ...prev, montoCompra: '' }));
                        }} 
                        mode="currency" 
                        currency="USD" 
                        locale="es-EC" 
                        placeholder="$0.00" 
                        className={`w-full ${cabeceraErrors.montoCompra ? 'p-invalid' : ''}`} 
                    />
                    {cabeceraErrors.montoCompra && <small className="text-red-500 mt-1 block">{cabeceraErrors.montoCompra}</small>}
                </div>

                {/* Descuento */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Descuento aplicado</label>
                    <InputNumber 
                        value={cabecera.descuentoCompra} 
                        onValueChange={e => setCabecera(prev => ({ ...prev, descuentoCompra: e.value ?? 0 }))} 
                        mode="currency" 
                        currency="USD" 
                        locale="es-EC" 
                        placeholder="$0.00" 
                        className="w-full" 
                    />
                </div>

                {/* Presupuesto Switch */}
                <div className="flex items-center gap-3 align-self-center pt-2">
                    <InputSwitch 
                        checked={cabecera.cargadoPresupuesto} 
                        onChange={e => setCabecera(prev => ({ 
                            ...prev, 
                            cargadoPresupuesto: e.value,
                            itemPresupuestario: e.value ? prev.itemPresupuestario : '',
                            partidaPresupuestaria: e.value ? prev.partidaPresupuestaria : ''
                        }))} 
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-350">¿Cargado al Presupuesto Institucional?</span>
                </div>

                {/* Presupuestarios condicionales */}
                {cabecera.cargadoPresupuesto && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Ítem Presupuestario</label>
                            <InputText 
                                value={cabecera.itemPresupuestario} 
                                onChange={e => setCabecera(prev => ({ ...prev, itemPresupuestario: e.target.value }))} 
                                placeholder="Código de Item" 
                                className="w-full" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Partida Presupuestaria</label>
                            <InputText 
                                value={cabecera.partidaPresupuestaria} 
                                onChange={e => setCabecera(prev => ({ ...prev, partidaPresupuestaria: e.target.value }))} 
                                placeholder="Código de Partida" 
                                className="w-full" 
                            />
                        </div>
                    </>
                )}

                {/* Descripción */}
                <div className="col-span-1 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Descripción General del Acta <span className="text-red-500">*</span></label>
                    <InputTextarea 
                        value={cabecera.descripcion} 
                        onChange={e => {
                            setCabecera(prev => ({ ...prev, descripcion: e.target.value }));
                            if (cabeceraErrors.descripcion) setCabeceraErrors(prev => ({ ...prev, descripcion: '' }));
                        }} 
                        placeholder="Describa brevemente la adquisición o motivo de ingreso" 
                        rows={3} 
                        className={`w-full ${cabeceraErrors.descripcion ? 'p-invalid border-red-500' : ''}`} 
                    />
                    {cabeceraErrors.descripcion && <small className="text-red-500 mt-1 block">{cabeceraErrors.descripcion}</small>}
                </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button label="Continuar a Modalidad" icon="pi pi-arrow-right" onClick={handleContinuarPaso2} className="px-6 py-3 font-semibold shadow-md" />
            </div>
        </Card>
    );

    // Paso 2: Selección de Modalidad
    const renderPaso2 = () => (
        <div>
            {/* Header / Botón de regreso con espacio propio para evitar superposiciones */}
            <div className="mb-6 pt-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Button 
                    label="Volver a Cabecera" 
                    icon="pi pi-arrow-left" 
                    outlined 
                    severity="secondary" 
                    onClick={() => setCurrentStep(1)} 
                    className="mb-4"
                />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Seleccionar Modalidad de Ingreso</h2>
                <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
                    Defina cómo ingresará los bienes para esta acta (Ingreso Manual o Carga Masiva).
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto py-6">
                {/* Manual Card */}
                <div 
                    onClick={() => { setSelectedFlow('manual'); setCurrentStep(3); }}
                    className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[180px]"
                >
                    <div className="flex items-center gap-5 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <i className="pi pi-pencil text-2xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                Ingreso Manual
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                Registre los bienes uno a uno completando todos sus datos específicos. Adecuado para pocas unidades o elementos heterogéneos.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <span className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 gap-1.5">
                            Iniciar ingreso <i className="pi pi-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
                        </span>
                    </div>
                </div>

                {/* Carga Masiva Card */}
                <div 
                    onClick={() => { setSelectedFlow('masiva'); setCurrentStep(3); }}
                    className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[180px]"
                >
                    <div className="flex items-center gap-5 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <i className="pi pi-file-excel text-2xl text-emerald-600 dark:text-emerald-400"></i>
                        </div>
                        <div className="flex-1 min-w-[280px]">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                                Carga Masiva
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                Descargue la plantilla Excel oficial de 24 columnas, llénela con los activos y súbala para validación en lote automática.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <span className="inline-flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 gap-1.5">
                            Cargar archivo <i className="pi pi-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Paso 3: Carga Masiva Sub-flujo
    const renderCargaMasiva = () => {
        const conErrores = resultadosVal.filter(r => !r.exitoso);
        const exitasasCount = resultadosVal.filter(r => r.exitoso).length;

        return (
            <div className="space-y-6">
                {/* Header / Botón de regreso con espacio propio para evitar superposiciones */}
                <div className="mb-6 pt-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                        <Button 
                            label="Volver a Selección" 
                            icon="pi pi-arrow-left" 
                            outlined 
                            severity="secondary" 
                            onClick={() => { setCurrentStep(2); setValidado(false); setArchivoSeleccionado(null); }} 
                        />
                        <Button 
                            label="Descargar Plantilla Oficial (.xlsx)" 
                            icon="pi pi-download" 
                            severity="info" 
                            onClick={descargarPlantillaOficial} 
                            className="shadow" 
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ingreso por Carga Masiva (Excel)</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
                        Suba la plantilla Excel oficial de 24 columnas con los activos de la cabecera actual.
                    </p>
                </div>

                <Card className="shadow-lg border border-slate-100 dark:border-slate-800 p-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                        Paso 3. Cargar Archivo Excel de Bienes
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                        <FileUpload
                            ref={fileUploadRef}
                            mode="basic"
                            name="archivo"
                            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            maxFileSize={5000000}
                            customUpload
                            uploadHandler={handleSeleccionArchivo}
                            auto
                            chooseLabel="Seleccionar archivo Excel"
                        />
                        {nombreArchivo && (
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                Archivo cargado: <strong>{nombreArchivo}</strong>
                            </span>
                        )}
                        {archivoSeleccionado && (
                            <Button
                                label="Validar Datos de Excel"
                                icon="pi pi-check-circle"
                                onClick={handleValidarArchivo}
                                loading={validando}
                                disabled={validando}
                                className="shadow"
                            />
                        )}
                    </div>

                    {validado && (
                        <div>
                            <Divider className="my-6" />
                            <h4 className="text-md font-bold text-slate-700 mb-4">Resumen de Validación</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Total de Filas</span>
                                    <p className="text-3xl font-bold text-slate-800">{resultadosVal.length}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                                    <span className="text-xs text-green-700 uppercase font-semibold">Filas Válidas</span>
                                    <p className="text-3xl font-bold text-green-800">{exitasasCount}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                                    <span className="text-xs text-red-700 uppercase font-semibold">Filas con Error</span>
                                    <p className="text-3xl font-bold text-red-800">{conErrores.length}</p>
                                </div>
                            </div>

                            {/* Mostrar errores detallados por fila/campo */}
                            {conErrores.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-red-700 mb-2">Errores Detectados (Se deben corregir antes de guardar):</h4>
                                    <DataTable value={conErrores} className="p-datatable-sm" paginator rows={5} emptyMessage="No hay errores en este archivo">
                                        <Column field="numeroFila" header="Fila Excel" style={{ width: '100px' }} sortable />
                                        <Column header="ID Bien / Serie" body={row => `${row.datosFila['ID Bien'] || '—'} / ${row.datosFila['Serie'] || '—'}`} />
                                        <Column field="mensajeError" header="Errores Encontrados" body={row => (
                                            <span className="text-red-600 font-medium">{row.mensajeError}</span>
                                        )} />
                                    </DataTable>
                                </div>
                            )}

                            {/* Tabla Previsualización de Datos Válidos */}
                            <h4 className="text-md font-bold text-slate-700 mb-2">Previsualización de Activos a Registrar:</h4>
                            <DataTable value={resultadosVal} paginator rows={10} className="p-datatable-sm shadow-sm rounded-lg" emptyMessage="No hay bienes válidos cargados">
                                <Column field="numeroFila" header="Fila" style={{ width: '80px' }} />
                                <Column header="ID Bien (Nombre)" body={row => row.activo?.nombre || row.datosFila['ID Bien'] || '—'} />
                                <Column header="Serie" body={row => row.activo?.numeroSerie || row.datosFila['Serie'] || '—'} />
                                <Column header="Marca" body={row => row.activo?.marca || row.datosFila['Marca'] || '—'} />
                                <Column header="Costo" body={row => `$${row.activo?.valorAdquisicion || row.datosFila['Costo de Adquisición'] || '0.00'}`} />
                                <Column header="Garantía" body={row => (row.activo?.tieneGarantia ? 'Sí' : 'No')} />
                                <Column header="Estado de Carga" body={row => (
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${row.exitoso ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {row.exitoso ? 'Válido' : 'Error'}
                                    </span>
                                )} />
                                <Column header="Acciones" body={(row, options) => (
                                    <Button 
                                        label="Modificar" 
                                        icon="pi pi-pencil" 
                                        size="small" 
                                        outlined
                                        disabled={!row.exitoso && !row.activo} // Allow modifying rows to fix issues
                                        onClick={() => openEditDialog(row, options.rowIndex)} 
                                    />
                                )} />
                            </DataTable>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button 
                                    label="Confirmar e Importar Acta" 
                                    icon="pi pi-upload" 
                                    severity="success" 
                                    disabled={activosValidos.length === 0 || conErrores.length > 0 || importando}
                                    loading={importando}
                                    onClick={handleConfirmarImportacionMasiva} 
                                    className="px-6 py-3 font-semibold shadow-md"
                                />
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        );
    };

    // Paso 3: Ingreso Manual Sub-flujo
    const renderIngresoManual = () => {
        return (
            <div className="space-y-6">
                {/* Header / Botón de regreso con espacio propio para evitar superposiciones */}
                <div className="mb-6 pt-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
                        <Button 
                            label="Volver a Selección" 
                            icon="pi pi-arrow-left" 
                            outlined 
                            severity="secondary" 
                            onClick={() => setCurrentStep(2)} 
                        />
                        <span className="text-xs font-semibold text-slate-450 uppercase">Acta: {cabecera.rucProveedor || 'Individual'} - manual</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ingreso Manual de Bienes</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
                        Registre los activos uno a uno de forma individual en esta acta.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulario de adición de Bien */}
                    <Card className="lg:col-span-1 shadow-lg border border-slate-100 dark:border-slate-800 p-4 self-start">
                        <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                            Agregar Bien
                        </h3>
                        <div className="space-y-4">
                            {/* ID Bien */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ID Bien (Nombre) <span className="text-red-500">*</span></label>
                                <InputText 
                                    value={nuevoBien.nombre} 
                                    onChange={e => {
                                        setNuevoBien(prev => ({ ...prev, nombre: e.target.value }));
                                        if (bienErrors.nombre) setBienErrors(prev => ({ ...prev, nombre: '' }));
                                    }} 
                                    placeholder="Ej: Monitor Multiparamétrico"
                                    className={`w-full p-inputtext-sm ${bienErrors.nombre ? 'p-invalid' : ''}`}
                                />
                                {bienErrors.nombre && <small className="text-red-500">{bienErrors.nombre}</small>}
                            </div>

                            {/* Serie */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Número de Serie <span className="text-red-500">*</span></label>
                                <InputText 
                                    value={nuevoBien.numeroSerie} 
                                    onChange={e => {
                                        setNuevoBien(prev => ({ ...prev, numeroSerie: e.target.value }));
                                        if (bienErrors.numeroSerie) setBienErrors(prev => ({ ...prev, numeroSerie: '' }));
                                    }} 
                                    placeholder="Ej: SN-499281"
                                    className={`w-full p-inputtext-sm ${bienErrors.numeroSerie ? 'p-invalid' : ''}`}
                                />
                                {bienErrors.numeroSerie && <small className="text-red-500">{bienErrors.numeroSerie}</small>}
                            </div>

                            {/* Marca */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca <span className="text-red-500">*</span></label>
                                <InputText 
                                    value={nuevoBien.marca} 
                                    onChange={e => {
                                        setNuevoBien(prev => ({ ...prev, marca: e.target.value }));
                                        if (bienErrors.marca) setBienErrors(prev => ({ ...prev, marca: '' }));
                                    }} 
                                    placeholder="Ej: Philips, GE, Lenovo"
                                    className={`w-full p-inputtext-sm ${bienErrors.marca ? 'p-invalid' : ''}`}
                                />
                                {bienErrors.marca && <small className="text-red-500">{bienErrors.marca}</small>}
                            </div>

                            {/* Costo Adquisición */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Costo de Adquisición <span className="text-red-500">*</span></label>
                                <InputNumber 
                                    value={nuevoBien.valorAdquisicion} 
                                    onValueChange={e => {
                                        setNuevoBien(prev => ({ ...prev, valorAdquisicion: e.value }));
                                        if (bienErrors.valorAdquisicion) setBienErrors(prev => ({ ...prev, valorAdquisicion: '' }));
                                    }} 
                                    mode="currency" 
                                    currency="USD" 
                                    locale="es-EC"
                                    placeholder="$0.00"
                                    className="w-full p-inputnumber-sm"
                                />
                                {bienErrors.valorAdquisicion && <small className="text-red-500">{bienErrors.valorAdquisicion}</small>}
                            </div>

                            {/* Código eSByE */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Código eSByE</label>
                                <InputText 
                                    value={nuevoBien.codigoSBYE} 
                                    onChange={e => setNuevoBien(prev => ({ ...prev, codigoSBYE: e.target.value }))} 
                                    placeholder="Código eSByE"
                                    className="w-full p-inputtext-sm"
                                />
                            </div>

                            {/* Estado */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                                <Dropdown 
                                    value={nuevoBien.estadoActivo} 
                                    options={CATALOGOS.estadoActivo}
                                    onChange={e => setNuevoBien(prev => ({ ...prev, estadoActivo: e.value }))} 
                                    className="w-full p-dropdown-sm"
                                />
                            </div>

                            {/* Depreciación Switch */}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase">¿Aplica Depreciación?</span>
                                <InputSwitch 
                                    checked={nuevoBien.depreciacionS_N === 'S'} 
                                    onChange={e => setNuevoBien(prev => ({ ...prev, depreciacionS_N: e.value ? 'S' : 'N' }))} 
                                />
                            </div>

                            {/* Garantía Switch */}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-semibold text-slate-500 uppercase">¿Tiene Garantía?</span>
                                <InputSwitch 
                                    checked={!!nuevoBien.tieneGarantia} 
                                    onChange={e => setNuevoBien(prev => ({ 
                                        ...prev, 
                                        tieneGarantia: e.value,
                                        tiempoGarantia: e.value ? prev.tiempoGarantia : ''
                                    }))} 
                                />
                            </div>

                            {/* Tiempo de Garantía */}
                            {nuevoBien.tieneGarantia && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tiempo de Garantía (meses/años) *</label>
                                    <InputText 
                                        value={nuevoBien.tiempoGarantia !== null && nuevoBien.tiempoGarantia !== undefined ? String(nuevoBien.tiempoGarantia) : ''} 
                                        onChange={e => {
                                            setNuevoBien(prev => ({ ...prev, tiempoGarantia: e.target.value }));
                                            if (bienErrors.tiempoGarantia) setBienErrors(prev => ({ ...prev, tiempoGarantia: '' }));
                                        }} 
                                        placeholder="Ej: 24 meses"
                                        className={`w-full p-inputtext-sm ${bienErrors.tiempoGarantia ? 'p-invalid' : ''}`}
                                    />
                                    {bienErrors.tiempoGarantia && <small className="text-red-500">{bienErrors.tiempoGarantia}</small>}
                                </div>
                            )}

                            {/* Características Secundarias Expandibles */}
                            <Divider className="my-2" />
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-slate-400 uppercase block">Campos Opcionales</span>
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Modelo</label>
                                    <InputText value={nuevoBien.modelo} onChange={e => setNuevoBien(prev => ({ ...prev, modelo: e.target.value }))} className="w-full p-inputtext-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vida Útil (años)</label>
                                    <InputNumber value={nuevoBien.tiempoVidaUtil} onValueChange={e => setNuevoBien(prev => ({ ...prev, tiempoVidaUtil: e.value }))} min={0} className="w-full p-inputnumber-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color</label>
                                    <Dropdown value={nuevoBien.color} options={CATALOGOS.color} onChange={e => setNuevoBien(prev => ({ ...prev, color: e.value }))} placeholder="Seleccione color" className="w-full p-dropdown-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Material</label>
                                    <InputText value={nuevoBien.material} onChange={e => setNuevoBien(prev => ({ ...prev, material: e.target.value }))} className="w-full p-inputtext-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dimensiones</label>
                                    <InputText value={nuevoBien.dimension} onChange={e => setNuevoBien(prev => ({ ...prev, dimension: e.target.value }))} className="w-full p-inputtext-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                                    <InputTextarea value={nuevoBien.observaciones} onChange={e => setNuevoBien(prev => ({ ...prev, observaciones: e.target.value }))} rows={2} className="w-full p-inputtext-sm" />
                                </div>
                            </div>

                            <Button 
                                label="Agregar Bien a Lista" 
                                icon="pi pi-plus" 
                                severity="secondary" 
                                onClick={handleAddBienManual} 
                                className="w-full font-semibold p-button-sm shadow-sm" 
                            />
                        </div>
                    </Card>

                    {/* Tabla de Bienes agregados */}
                    <Card className="lg:col-span-2 shadow-lg border border-slate-100 dark:border-slate-800 p-4">
                        <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                            Bienes en esta Acta ({bienesManuales.length})
                        </h3>

                        <DataTable value={bienesManuales} className="p-datatable-sm" emptyMessage="No hay bienes agregados a esta acta todavía.">
                            <Column header="N°" body={(_, options) => options.rowIndex + 1} style={{ width: '60px' }} />
                            <Column field="nombre" header="ID Bien (Nombre)" />
                            <Column field="numeroSerie" header="Serie" />
                            <Column field="marca" header="Marca" />
                            <Column header="Costo" body={row => `$${row.valorAdquisicion?.toFixed(2)}`} />
                            <Column header="Depreciación" body={row => (row.depreciacionS_N === 'S' ? 'Sí' : 'No')} />
                            <Column header="Garantía" body={row => (row.tieneGarantia ? `${row.tiempoGarantia}` : 'No')} />
                            <Column header="Acciones" body={(row, options) => (
                                <div className="flex gap-2">
                                    <Button 
                                        icon="pi pi-pencil" 
                                        outlined 
                                        size="small" 
                                        onClick={() => openEditDialog(row, options.rowIndex)} 
                                        title="Modificar"
                                    />
                                    <Button 
                                        icon="pi pi-trash" 
                                        outlined 
                                        severity="danger" 
                                        size="small" 
                                        onClick={() => setBienesManuales(prev => prev.filter((_, idx) => idx !== options.rowIndex))} 
                                        title="Eliminar"
                                    />
                                </div>
                            )} style={{ width: '120px' }} />
                        </DataTable>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button 
                                label="Confirmar e Ingresar Acta" 
                                icon="pi pi-save" 
                                severity="success" 
                                disabled={bienesManuales.length === 0 || importando}
                                loading={importando}
                                onClick={handleConfirmarImportacionManual} 
                                className="px-6 py-3 font-semibold shadow-md"
                            />
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    // ─── Pantalla de Éxito / Impresión de Barras ───
    const renderExito = () => {
        return (
            <Card className="shadow-lg border border-slate-100 dark:border-slate-800 p-6 text-center max-w-4xl mx-auto">
                <div className="flex flex-col items-center justify-center space-y-4 mb-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                        <i className="pi pi-check-circle text-5xl"></i>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-800">¡Ingreso de Bienes Exitoso!</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg">
                        El acta ha sido procesada y se registraron <strong>{activosImportados.length}</strong> activos. 
                        A continuación puede visualizar los bienes y descargar sus respectivos códigos de barras.
                    </p>
                </div>

                <div className="flex justify-center gap-3 mb-8">
                    <Button 
                        label="Descargar TODOS los códigos de barras" 
                        icon="pi pi-download" 
                        severity="success" 
                        loading={descargandoTodos}
                        onClick={handleDescargarTodos} 
                        className="shadow"
                    />
                    <Button 
                        label="Registrar Nuevo Ingreso" 
                        icon="pi pi-plus" 
                        severity="secondary" 
                        outlined 
                        onClick={handleLimpiarTodo} 
                    />
                </div>

                <DataTable value={activosImportados} className="p-datatable-sm text-left shadow-sm rounded-lg" paginator rows={5}>
                    <Column field="nombre" header="ID Bien" />
                    <Column field="numeroSerie" header="N° Serie" />
                    <Column field="codigoInstitucional" header="Código Institucional" />
                    <Column field="marca" header="Marca" />
                    <Column header="Código Barras" body={(row: Activo) => (
                        <div className="flex justify-center">
                            <BarcodeDownload activo={row} compact={true} />
                        </div>
                    )} style={{ width: '130px', textAlign: 'center' }} />
                </DataTable>
            </Card>
        );
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-2">
            <Toast ref={toast} />

            {activosImportados.length === 0 ? (
                <>
                    {/* Indicador de pasos */}
                    <div className="flex justify-between items-center mb-8 max-w-xl mx-auto px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                            <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-400">Cabecera</span>
                        </div>
                        <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                            <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-400">Modalidad</span>
                        </div>
                        <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                            <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-400">Bienes</span>
                        </div>
                    </div>

                    <div className="transition-all duration-300">
                        {currentStep === 1 && renderPaso1()}
                        {currentStep === 2 && renderPaso2()}
                        {currentStep === 3 && selectedFlow === 'masiva' && renderCargaMasiva()}
                        {currentStep === 3 && selectedFlow === 'manual' && renderIngresoManual()}
                    </div>
                </>
            ) : (
                renderExito()
            )}

            {/* Modal para Modificación Temporal / Edición del Bien */}
            <Dialog 
                header="Modificar Información de Bien" 
                visible={showEditDialog} 
                style={{ width: '600px' }} 
                modal 
                onHide={() => setShowEditDialog(false)}
            >
                {editData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                        {/* ID Bien */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ID Bien (Nombre) *</label>
                            <InputText 
                                value={editData.nombre} 
                                onChange={e => setEditData((prev: any) => ({ ...prev, nombre: e.target.value }))} 
                                className={`w-full ${editErrors.nombre ? 'p-invalid' : ''}`}
                            />
                            {editErrors.nombre && <small className="text-red-500">{editErrors.nombre}</small>}
                        </div>

                        {/* Serie */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Número de Serie *</label>
                            <InputText 
                                value={editData.numeroSerie} 
                                onChange={e => setEditData((prev: any) => ({ ...prev, numeroSerie: e.target.value }))} 
                                className={`w-full ${editErrors.numeroSerie ? 'p-invalid' : ''}`}
                            />
                            {editErrors.numeroSerie && <small className="text-red-500">{editErrors.numeroSerie}</small>}
                        </div>

                        {/* Marca */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marca *</label>
                            <InputText 
                                value={editData.marca} 
                                onChange={e => setEditData((prev: any) => ({ ...prev, marca: e.target.value }))} 
                                className={`w-full ${editErrors.marca ? 'p-invalid' : ''}`}
                            />
                            {editErrors.marca && <small className="text-red-500">{editErrors.marca}</small>}
                        </div>

                        {/* Costo Adquisición */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Costo Adquisición *</label>
                            <InputNumber 
                                value={editData.valorAdquisicion} 
                                onValueChange={e => setEditData((prev: any) => ({ ...prev, valorAdquisicion: e.value }))} 
                                mode="currency" 
                                currency="USD" 
                                locale="es-EC"
                                className="w-full"
                            />
                            {editErrors.valorAdquisicion && <small className="text-red-500">{editErrors.valorAdquisicion}</small>}
                        </div>

                        {/* Código eSByE */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Código eSByE</label>
                            <InputText value={editData.codigoSBYE} onChange={e => setEditData((prev: any) => ({ ...prev, codigoSBYE: e.target.value }))} className="w-full" />
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                            <Dropdown 
                                value={editData.estadoActivo} 
                                options={CATALOGOS.estadoActivo}
                                onChange={e => setEditData((prev: any) => ({ ...prev, estadoActivo: e.value }))} 
                                className="w-full font-semibold"
                            />
                        </div>

                        {/* Depreciación */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase">¿Depreciación?</span>
                            <InputSwitch 
                                checked={editData.depreciacionS_N === 'S'} 
                                onChange={e => setEditData((prev: any) => ({ ...prev, depreciacionS_N: e.value ? 'S' : 'N' }))} 
                            />
                        </div>

                        {/* Garantía */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase">¿Garantía?</span>
                            <InputSwitch 
                                checked={!!editData.tieneGarantia} 
                                onChange={e => setEditData((prev: any) => ({ 
                                    ...prev, 
                                    tieneGarantia: e.value,
                                    tiempoGarantia: e.value ? prev.tiempoGarantia : ''
                                }))} 
                            />
                        </div>

                        {/* Tiempo de Garantía */}
                        {editData.tieneGarantia && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tiempo de Garantía *</label>
                                <InputText 
                                    value={editData.tiempoGarantia !== null && editData.tiempoGarantia !== undefined ? String(editData.tiempoGarantia) : ''} 
                                    onChange={e => setEditData((prev: any) => ({ ...prev, tiempoGarantia: e.target.value }))} 
                                    className={`w-full ${editErrors.tiempoGarantia ? 'p-invalid' : ''}`}
                                />
                                {editErrors.tiempoGarantia && <small className="text-red-500">{editErrors.tiempoGarantia}</small>}
                            </div>
                        )}

                        {/* Resto de campos opcionales */}
                        <Divider className="col-span-1 md:col-span-2 my-2" />
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Modelo</label>
                            <InputText value={editData.modelo} onChange={e => setEditData((prev: any) => ({ ...prev, modelo: e.target.value }))} className="w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vida Útil</label>
                            <InputNumber value={editData.tiempoVidaUtil} onValueChange={e => setEditData((prev: any) => ({ ...prev, tiempoVidaUtil: e.value }))} className="w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Color</label>
                            <Dropdown value={editData.color} options={CATALOGOS.color} onChange={e => setEditData((prev: any) => ({ ...prev, color: e.value }))} className="w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Material</label>
                            <InputText value={editData.material} onChange={e => setEditData((prev: any) => ({ ...prev, material: e.target.value }))} className="w-full" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dimensiones</label>
                            <InputText value={editData.dimension} onChange={e => setEditData((prev: any) => ({ ...prev, dimension: e.target.value }))} className="w-full" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observaciones</label>
                            <InputTextarea value={editData.observaciones} onChange={e => setEditData((prev: any) => ({ ...prev, observaciones: e.target.value }))} rows={2} className="w-full" />
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={() => setShowEditDialog(false)} />
                    <Button label="Aplicar Cambios" icon="pi pi-check" onClick={handleSaveEdit} />
                </div>
            </Dialog>

            {/* Diálogo de Confirmación antes de Modificar */}
            <Dialog 
                header="Confirmar Modificación" 
                visible={showConfirmModify} 
                style={{ width: '400px' }} 
                modal 
                onHide={() => setShowConfirmModify(false)}
            >
                <div className="flex flex-col items-center text-center space-y-4 py-2">
                    <i className="pi pi-exclamation-triangle text-4xl text-amber-500 animate-pulse" />
                    <p className="text-slate-700 font-medium">
                        ¿Está seguro que desea aplicar los cambios a este bien?
                    </p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="No, Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={() => setShowConfirmModify(false)} />
                    <Button label="Sí, Confirmar" icon="pi pi-check" severity="success" onClick={confirmApplyModification} />
                </div>
            </Dialog>
        </div>
    );
};

export default IngresoActivo;
