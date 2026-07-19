import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { AutocompleteInput } from '../../components/AutocompleteInput';
import {
    useActivos,
    Activo,
    AtributosEquipoBiomedico,
    AtributosCPU,
    AtributosMonitor,
    AtributosTeclado,
    AtributosMouse,
    AtributosImpresoraRed,
    AtributosTelefonoIp,
    AtributosCCTV,
    AtributosAccessPoint,
    AtributosLaboratorio,
    AtributosRayosImagen
} from '../../context/ActivosContext';
import { useNavigate } from 'react-router-dom';
import { BarcodeDownload } from '../../components/BarcodeDownload';

const ETIQUETAS_ESTADO: Record<string, string> = {
    BUE: 'Bueno',
    REG: 'Regular',
    BOD: 'En bodega',
    MAL: 'Malo',
    MAN: 'En mantenimiento',
    OBS: 'Obsoleto',
    EGR: 'Egresado',
    BAJ: 'Dado de baja',
    Bueno: 'Bueno',
    Regular: 'Regular',
    Malo: 'Malo',
    'En Reparación': 'En mantenimiento',
    'Dado de Baja': 'Dado de baja'
};

const normalizarEstadoActivo = (estado: string): string => {
    const mapaLegacy: Record<string, string> = {
        Bueno: 'BUE',
        Regular: 'REG',
        Malo: 'MAL',
        'En bodega': 'BOD',
        'En Bodega': 'BOD',
        'En mantenimiento': 'MAN',
        'En Mantenimiento': 'MAN',
        Obsoleto: 'OBS',
        Egresado: 'EGR',
        'Dado de baja': 'BAJ',
        'En Reparación': 'MAN'
    };
    return mapaLegacy[estado] ?? estado.toUpperCase();
};

const getCategoryCodeFromLabel = (categoryLabel: string): string => {
    const match = categoryLabel?.match(/\(([^)]+)\)$/);
    return match ? match[1] : '';
};

const getEspecificoKey = (categoriaActivo: string, nombre: string): string => {
    const cat = getCategoryCodeFromLabel(categoriaActivo);
    const nom = nombre;
    if (cat === 'EQM') return 'EQM';
    if (cat === 'EQL') return 'EQL';
    if (cat === 'EQR') return 'EQR';
    if (cat === 'EQI') {
        const NOMBRES_CPU = new Set(['CPU / Unidad Central', 'Laptop', 'Tablet', 'Servidor']);
        if (NOMBRES_CPU.has(nom)) return 'CPU';
        if (nom === 'Monitor') return 'MON';
        if (nom === 'Teclado') return 'TEC';
        if (nom === 'Mouse') return 'MOU';
        if (nom === 'Impresora de red') return 'IMP';
        if (nom === 'Teléfono IP') return 'TEL';
        if (nom === 'Cámara CCTV / NVR') return 'CCTV';
        if (nom === 'Access Point / WiFi') return 'AP';
    }
    return '';
};

export const ConsultarActivos: React.FC = () => {
    const { activos } = useActivos();
    const navigate = useNavigate();

    const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);
    const [barcodeActivo, setBarcodeActivo] = useState<Activo | null>(null);
    
    const [filterNombre, setFilterNombre] = useState('');
    const [filterSbye, setFilterSbye] = useState('');
    const [filterBarras, setFilterBarras] = useState('');
    const [filterCuenta, setFilterCuenta] = useState('');
    const [filterResponsable, setFilterResponsable] = useState('');
    const [filterContrato, setFilterContrato] = useState('');
    const [filterEstado, setFilterEstado] = useState<string | null>(null);

    // Opciones estáticas del catálogo de estados
    const estadoOptions = [
        { label: 'Bueno', value: 'BUE' },
        { label: 'Regular', value: 'REG' },
        { label: 'En bodega', value: 'BOD' },
        { label: 'Malo', value: 'MAL' },
        { label: 'En mantenimiento', value: 'MAN' },
        { label: 'Obsoleto', value: 'OBS' },
        { label: 'Egresado', value: 'EGR' },
        { label: 'Dado de baja', value: 'BAJ' }
    ];

    const handleLimpiarFiltros = () => {
        setFilterNombre('');
        setFilterSbye('');
        setFilterBarras('');
        setFilterCuenta('');
        setFilterResponsable('');
        setFilterContrato('');
        setFilterEstado(null);
    };

    // Filtrar activos por todos los criterios activos (AND)
    const activosFiltrados = activos.filter(activo => {
        if (filterNombre.trim()) {
            if (!activo.nombre?.toLowerCase().includes(filterNombre.toLowerCase())) return false;
        }
        if (filterSbye.trim()) {
            if (!activo.codigoSBYE?.toLowerCase().includes(filterSbye.toLowerCase())) return false;
        }
        if (filterBarras.trim()) {
            const barras = (activo as any).codigoBarras || activo.numeroSerie || '';
            if (!barras.toLowerCase().includes(filterBarras.toLowerCase())) return false;
        }
        if (filterCuenta.trim()) {
            if (!activo.cuentaContable?.toLowerCase().includes(filterCuenta.toLowerCase())) return false;
        }
        if (filterResponsable.trim()) {
            if (!activo.responsableEntrega?.toLowerCase().includes(filterResponsable.toLowerCase())) return false;
        }
        if (filterContrato.trim()) {
            if (!activo.numeroContrato?.toLowerCase().includes(filterContrato.toLowerCase())) return false;
        }

        // Categoría (obsoleto)

        // Estado (estadoActivo)
        if (filterEstado) {
            if (normalizarEstadoActivo(activo.estadoActivo) !== filterEstado) {
                return false;
            }
        }

        return true;
    });

    // Columna con accion
    const actionBodyTemplate = (rowData: Activo) => (
        <div className="flex gap-2 justify-center">
            <Button
                icon="pi pi-eye"
                rounded
                severity="info"
                onClick={() => setSelectedActivo(rowData)}
                title="Ver detalles"
            />
            <Button
                icon="pi pi-barcode"
                rounded
                severity="secondary"
                onClick={() => setBarcodeActivo(rowData)}
                title="Ver código de barras"
            />
            <Button
                icon="pi pi-history"
                rounded
                severity="warning"
                onClick={() => navigate(`/activos/hoja-vida/${rowData.idActivo}`)}
                title="Ver hoja de vida"
            />
        </div>
    );

    // Columna para fecha
    const dateBodyTemplate = (rowData: Activo) => {
        if (!rowData.fechaAdquisicion) return '-';
        return new Date(rowData.fechaAdquisicion).toLocaleDateString('es-ES');
    };

    // Columna para estado
    const estadoBodyTemplate = (rowData: Activo) => {
        const estadoCodigo = normalizarEstadoActivo(rowData.estadoActivo);
        const estadoEtiqueta = ETIQUETAS_ESTADO[rowData.estadoActivo] ?? ETIQUETAS_ESTADO[estadoCodigo] ?? rowData.estadoActivo;
        const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
            BUE: 'success',
            REG: 'warning',
            MAL: 'danger',
            MAN: 'info',
            BAJ: 'secondary',
            OBS: 'secondary',
            EGR: 'secondary',
            BOD: 'info'
        };
        const severity = severityMap[estadoCodigo] ?? 'secondary';
        return (
            <span className={`px-3 py-1 rounded text-sm font-medium 
                ${severity === 'success' ? 'bg-green-100 text-green-800' : ''}
                ${severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${severity === 'danger' ? 'bg-red-100 text-red-800' : ''}
                ${severity === 'info' ? 'bg-blue-100 text-blue-800' : ''}
                ${severity === 'secondary' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
                {estadoEtiqueta}
            </span>
        );
    };

    // Columna para valor
    const valorBodyTemplate = (rowData: Activo) => {
        if (!rowData.valorTotal) return '-';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(rowData.valorTotal);
    };

    return (
        <div className="p-4">
            <div className="mb-6">
                <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-4">Consultar Activos</h1>
                <p className="text-slate-600 dark:text-slate-400">Total de activos registrados: <strong>{activos.length}</strong></p>
            </div>

            {/* Panel de Filtros */}
            <Card className="shadow-lg mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                    <h5 className="m-0 text-lg font-semibold text-slate-700 dark:text-slate-300">
                        <i className="pi pi-filter mr-2 text-blue-500"></i> Filtros de Búsqueda
                    </h5>
                    <Button
                        label="Limpiar filtros"
                        icon="pi pi-filter-slash"
                        severity="secondary"
                        outlined
                        onClick={handleLimpiarFiltros}
                        size="small"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Nombre del Bien</label>
                        <AutocompleteInput
                            table="activos"
                            column="nombre"
                            value={filterNombre}
                            onChange={setFilterNombre}
                            placeholder="Buscar nombre..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Código SBYE</label>
                        <AutocompleteInput
                            table="activos"
                            column="codigo_sbye"
                            value={filterSbye}
                            onChange={setFilterSbye}
                            placeholder="Buscar SBYE..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Código de Barras</label>
                        <AutocompleteInput
                            table="activos"
                            column="codigo_barras"
                            value={filterBarras}
                            onChange={setFilterBarras}
                            placeholder="Buscar barras..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Cuenta Contable</label>
                        <AutocompleteInput
                            table="actas_ingreso"
                            column="cuenta_contable"
                            value={filterCuenta}
                            onChange={setFilterCuenta}
                            placeholder="Buscar cuenta..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Responsable</label>
                        <AutocompleteInput
                            table="activos"
                            column="responsable_entrega"
                            value={filterResponsable}
                            onChange={setFilterResponsable}
                            placeholder="Buscar responsable..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Número de Contrato</label>
                        <AutocompleteInput
                            table="activos"
                            column="numero_contrato"
                            value={filterContrato}
                            onChange={setFilterContrato}
                            placeholder="Buscar contrato..."
                        />
                    </div>

                    {/* Categoría (obsoleto) */}

                    {/* Estado */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Estado</label>
                        <Dropdown
                            value={filterEstado}
                            options={estadoOptions}
                            onChange={(e: DropdownChangeEvent) => setFilterEstado(e.value)}
                            placeholder="Todos los estados"
                            showClear
                            className="w-full text-sm"
                        />
                    </div>
                </div>
            </Card>

            <Card className="shadow-lg">
                {/* Cabecera del listado */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h5 className="m-0 text-xl font-semibold text-slate-800 dark:text-slate-100">Listado de Activos</h5>
                </div>

                {/* Tabla de activos */}
                {activosFiltrados.length > 0 ? (
                    <DataTable
                        value={activosFiltrados}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 20]}
                        tableStyle={{ minWidth: '50rem' }}
                        stripedRows
                        emptyMessage="No hay activos para mostrar"
                        responsiveLayout="scroll"
                    >
                        <Column field="idActivo" header="ID" style={{ width: '60px' }} />
                        <Column field="nombre" header="Nombre" />
                        <Column field="numeroSerie" header="Número de Serie" />
                        <Column field="codigoInstitucional" header="Código Institucional" />
                        <Column field="marca" header="Marca" />
                        {/* Categoría columna eliminada */}
                        <Column
                            field="fechaAdquisicion"
                            header="Fecha Adquisición"
                            body={dateBodyTemplate}
                            style={{ width: '120px' }}
                        />
                        <Column
                            field="estadoActivo"
                            header="Estado"
                            body={estadoBodyTemplate}
                            style={{ width: '120px' }}
                        />
                        <Column
                            field="valorTotal"
                            header="Valor Total"
                            body={valorBodyTemplate}
                            style={{ width: '120px' }}
                            className="text-right"
                        />
                        <Column
                            header="Acción"
                            body={actionBodyTemplate}
                            style={{ width: '120px' }}
                            className="text-center"
                        />
                    </DataTable>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-slate-500 mb-4">No hay activos registrados aún.</p>
                    </div>
                )}
            </Card>

            {/* Dialog de detalles mejorado: mostrar todos los campos */}
            <Dialog
                visible={selectedActivo !== null}
                onHide={() => setSelectedActivo(null)}
                header={
                    selectedActivo ? (
                        <div className="flex flex-col">
                            <div className="text-lg font-semibold text-slate-800">{selectedActivo.nombre}</div>
                            <div className="text-sm text-slate-500">Código: {selectedActivo.codigoInstitucional || '-'}</div>
                        </div>
                    ) : (
                        'Detalles del Activo'
                    )
                }
                modal
                style={{ width: '95vw', maxWidth: '900px' }}
            >
                {selectedActivo && (
                    <div className="space-y-6 pt-10 px-4 max-h-[70vh] overflow-y-auto" >

                        {/* SECCIÓN 1: Información General */}
                        <section className="mb-">
                            
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Información General</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Nombre</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.nombre || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Marca</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.marca || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Modelo</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.modelo || '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Color</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.color || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Material</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.material || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Dimensión</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2 ">{selectedActivo.dimension || '-'}</div>
                                </div>

                                <div className="col-span-full">
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Descripción</div>
                                    <div className="mt-2 bg-slate-50 rounded p-3 text-slate-800">{selectedActivo.descripcion || '-'}</div>
                                </div>
                                <div className="col-span-full">
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Observación General (Acta)</div>
                                    <div className="mt-2 bg-slate-50 rounded p-3 text-slate-800">{(selectedActivo as any).observacionGeneral || '-'}</div>
                                </div>
                                <div className="col-span-full">
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Observación Específica (Bien)</div>
                                    <div className="mt-2 bg-slate-50 rounded p-3 text-slate-800">{(selectedActivo as any).observaciones || '-'}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 2: Identificación */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Identificación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-700 uppercase tracking-normal rounded p-2">Institución Receptora</div>
                                    <div className="text-sm font-medium text-slate-700 bg-slate-50 rounded p-2">{(selectedActivo as any).institucionReceptora || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-700 uppercase tracking-normal rounded p-2">Código Institucional</div>
                                    <div className="text-sm font-medium text-slate-700 bg-slate-50 rounded p-2">{selectedActivo.codigoInstitucional || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Número de Serie</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.numeroSerie || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Código de Barras</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).codigoBarras || selectedActivo.numeroSerie || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Código SBYE</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.codigoSBYE || '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Número de Comprobante / Acta</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.numeroActa || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Referencia de Acta</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).referenciaActa || '-'}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 3: Clasificación */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Clasificación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                {/* Clasificaciones antiguas omitidas */}
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Estado</div>
                                    <div className="mt-1">
                                        {/* Estado badge */}
                                        <span className={`px-3 py-1 rounded text-sm font-medium 
                                            ${selectedActivo.estadoActivo === 'Bueno' ? 'bg-green-100 text-green-800' : ''}
                                            ${selectedActivo.estadoActivo === 'Regular' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${selectedActivo.estadoActivo === 'Malo' ? 'bg-red-100 text-red-800' : ''}
                                            ${selectedActivo.estadoActivo === 'En Reparación' ? 'bg-blue-100 text-blue-800' : ''}
                                            ${selectedActivo.estadoActivo === 'Dado de Baja' ? 'bg-gray-100 text-gray-800' : ''}
                                        `}>{selectedActivo.estadoActivo || '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Condición de Depreciación</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).condicionDepreciacion || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Aplica Depreciación</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).depreciacionS_N === 'S' ? 'Sí' : 'No'}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 4: Ubicación y Responsables */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Ubicación y Responsables</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Ubicación</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.ubicacion || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Responsable Entrega (Bien)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.responsableEntrega || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Funcionario Receptor (Cabecera)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).funcionarioReceptor || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Funcionario Entregador (Cabecera)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).funcionarioEntregador || '-'}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 5: Información Financiera y Contractual */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Información Financiera y Contractual</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Fecha del Acta</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.fechaAdquisicion ? new Date(selectedActivo.fechaAdquisicion).toLocaleDateString('es-ES') : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Número de Contrato</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.numeroContrato || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Cuenta Contable</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.cuentaContable || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Item Presupuestario</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.itemPresupuestario || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Partida Presupuestaria</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.partidaPresupuestaria || '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Tipo de Adquisición</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.tipoAdquisicion || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Tipo de Comprobante</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.tipoComprobante || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Fecha de Comprobante</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).fechaComprobante ? new Date((selectedActivo as any).fechaComprobante).toLocaleDateString('es-ES') : '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor Total del Comprobante (Cabecera)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).montoCompra != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format((selectedActivo as any).montoCompra) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor de Adquisición (Bien)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.valorAdquisicion != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(selectedActivo.valorAdquisicion) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Descuento de Compra</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.descuentoCompra != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(selectedActivo.descuentoCompra) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor Unitario</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.valorUnitario != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(selectedActivo.valorUnitario) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor Total</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.valorTotal != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(selectedActivo.valorTotal) : '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2    ">Tiempo Vida Útil (años)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.tiempoVidaUtil ?? '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor Contable</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).valorContable != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format((selectedActivo as any).valorContable) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor Residual</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).valorResidual != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format((selectedActivo as any).valorResidual) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor en Libros</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).valorEnLibros != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format((selectedActivo as any).valorEnLibros) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Depreciación Acumulada</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).valorDepreciacionAcumulada != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format((selectedActivo as any).valorDepreciacionAcumulada) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Fecha Última Depreciación</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{(selectedActivo as any).fechaUltimaDepreciacion ? new Date((selectedActivo as any).fechaUltimaDepreciacion).toLocaleDateString('es-ES') : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Proveedor</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.nombreProveedor || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">RUC Proveedor</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.rucProveedor || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Garantía</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.tieneGarantia ? `Sí (${selectedActivo.tiempoGarantia || 'Tiempo no especificado'})` : 'No'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Bloqueado</div>
                                    <div className="mt-1">
                                        {selectedActivo.bloqueado ? (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">Sí</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">No</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 6: Ficha Técnica Específica */}
                        {selectedActivo.atributosEspecificos && (() => {
                            const key = getEspecificoKey((selectedActivo as any).categoriaActivo || '', selectedActivo.nombre);
                            if (!key) return null;
                            return (
                                <section className="mb-5">
                                    {/* --- EQUIPO BIOMÉDICO --- */}
                                    {key === 'EQM' && (() => {
                                        const b = selectedActivo.atributosEspecificos as AtributosEquipoBiomedico;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-blue-700 font-bold mb-2 border-b border-blue-100 pb-2">
                                                    <i className="pi pi-heart mr-2 text-blue-400" />Ficha Técnica — Equipo Biomédico
                                                </h3>
                                                {/* Datos técnicos */}
                                                {(b.voltaje || b.corriente || b.potencia || b.frecuencia || b.numeroFases || b.bateria || b.numeroCanales || b.memoria || b.tipoImpresora) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Datos Técnicos</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {[
                                                                { label: 'Voltaje', value: b.voltaje },
                                                                { label: 'N.º de Fases', value: b.numeroFases },
                                                                { label: 'Corriente', value: b.corriente },
                                                                { label: 'Potencia', value: b.potencia },
                                                                { label: 'Frecuencia', value: b.frecuencia },
                                                                { label: 'Batería', value: b.bateria },
                                                                { label: 'N.º de Canales', value: b.numeroCanales },
                                                                { label: 'Memoria', value: b.memoria },
                                                                { label: 'Tipo de Impresora', value: b.tipoImpresora },
                                                            ].filter(f => f.value).map(f => (
                                                                <div key={f.label}>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                                {/* Requerimientos de funcionamiento */}
                                                {b.requerimientosFuncionamiento && b.requerimientosFuncionamiento.length > 0 && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Requerimientos de Funcionamiento</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {b.requerimientosFuncionamiento.map(r => (
                                                                <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{r}</span>
                                                            ))}
                                                            {b.requerimientoOtroDetalle && (
                                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded border border-slate-200">Otro: {b.requerimientoOtroDetalle}</span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {/* Parámetros medidos */}
                                                {b.parametrosMedidos && b.parametrosMedidos.length > 0 && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Parámetros Medidos</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {b.parametrosMedidos.map(p => (
                                                                <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">{p}</span>
                                                            ))}
                                                            {b.parametroOtroDetalle && (
                                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded border border-slate-200">Otro: {b.parametroOtroDetalle}</span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {/* Garantía */}
                                                {(b.tieneGarantia !== undefined || b.fechaFinGarantia || b.frecuenciaMantenimientoPreventivo || b.responsableMantenimiento) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Garantía y Mantenimiento</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {b.tieneGarantia !== undefined && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Tiene Garantía</div>
                                                                    <div className="mt-1">
                                                                        {b.tieneGarantia
                                                                            ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Sí</span>
                                                                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">No</span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {b.fechaFinGarantia && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Fin de Garantía</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">
                                                                        {new Date(b.fechaFinGarantia).toLocaleDateString('es-ES')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {b.frecuenciaMantenimientoPreventivo && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Frec. Mant. Preventivo</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{b.frecuenciaMantenimientoPreventivo}</div>
                                                                </div>
                                                            )}
                                                            {b.responsableMantenimiento && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Responsable Mantenimiento</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{b.responsableMantenimiento}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                {/* Proveedores */}
                                                {[
                                                    { label: 'Fabricante', data: b.fabricante },
                                                    { label: 'Proveedor de Consumibles', data: b.proveedorConsumibles },
                                                    { label: 'Proveedor de Mantenimiento', data: b.proveedorMantenimiento },
                                                    { label: 'Proveedor de Calibración', data: b.proveedorCalibracion },
                                                ].filter(p => p.data?.nombre).map(p => (
                                                    <div key={p.label} className="mt-4">
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">{p.label}</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 rounded p-3 border border-slate-100">
                                                            {p.data!.nombre && <div><span className="text-xs text-slate-400 block">Nombre</span><span className="text-sm text-slate-700">{p.data!.nombre}</span></div>}
                                                            {p.data!.telefono && <div><span className="text-xs text-slate-400 block">Teléfono</span><span className="text-sm text-slate-700">{p.data!.telefono}</span></div>}
                                                            {p.data!.email && <div><span className="text-xs text-slate-400 block">Email</span><span className="text-sm text-slate-700">{p.data!.email}</span></div>}
                                                            {p.data!.direccion && <div><span className="text-xs text-slate-400 block">Dirección</span><span className="text-sm text-slate-700">{p.data!.direccion}</span></div>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Accesorios */}
                                                {b.accesorios && b.accesorios.length > 0 && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Accesorios</h4>
                                                        <div className="space-y-1">
                                                            {b.accesorios.map((acc, i) => (
                                                                <div key={i} className="flex justify-between items-center text-sm bg-slate-50 rounded px-3 py-1.5 border border-slate-100">
                                                                    <span className="text-slate-800">{acc.nombre}</span>
                                                                    <span className="text-xs text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5">{acc.estado}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                                {/* Información Técnica */}
                                                {b.informacionTecnica && b.informacionTecnica.length > 0 && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Información Técnica Adicional</h4>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {b.informacionTecnica.map((item, i) => (
                                                                <li key={i} className="text-sm text-slate-700">{item}</li>
                                                            ))}
                                                        </ul>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* --- CPU / Unidad Central --- */}
                                    {key === 'CPU' && (() => {
                                        const inf = selectedActivo.atributosEspecificos as AtributosCPU;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-desktop mr-2 text-purple-400" />Ficha Técnica — {selectedActivo.nombre}
                                                </h3>
                                                {inf.conjuntoEstacion && (
                                                    <div className="p-2 mb-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                                        <strong>Conjunto / Estación de Trabajo: </strong> {inf.conjuntoEstacion}
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {[
                                                        { label: 'Marca Procesador', value: inf.procesadorMarca },
                                                        { label: 'Tipo Procesador', value: inf.procesadorTipo },
                                                        { label: 'N.º Procesadores', value: inf.numeroProcesadores },
                                                        { label: 'N.º Núcleos', value: inf.numeroNucleos },
                                                        { label: 'Marca RAM', value: inf.ramMarca },
                                                        { label: 'Capacidad RAM', value: inf.ramCapacidad },
                                                        { label: 'Tipo RAM', value: inf.ramTipo },
                                                        { label: 'Marca Disco', value: inf.almacenamientoMarca },
                                                        { label: 'Capacidad Disco', value: inf.almacenamientoCapacidad },
                                                        { label: 'Marca Placa Madre', value: inf.tarjetaMadreMarca },
                                                        { label: 'Modelo Placa Madre', value: inf.tarjetaMadreModelo }
                                                    ].filter(f => f.value).map(f => (
                                                        <div key={f.label}>
                                                            <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {inf.redHabilitada && inf.interfacesRed && inf.interfacesRed.length > 0 && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Interfaces de Red</h4>
                                                        <div className="space-y-2">
                                                            {inf.interfacesRed.map((iface, idx) => (
                                                                <div key={idx} className="bg-slate-50 rounded p-3 border border-slate-100">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-xs font-bold text-slate-600 uppercase">{iface.tipo}</span>
                                                                        <span className={`px-2 py-0.5 text-xs rounded ${iface.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{iface.estado}</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs font-mono">
                                                                        {iface.ip && <div><span className="text-slate-400 font-sans">IP: </span>{iface.ip}</div>}
                                                                        {iface.mac && <div><span className="text-slate-400 font-sans">MAC: </span>{iface.mac}</div>}
                                                                        {iface.gateway && <div><span className="text-slate-400 font-sans">Gateway: </span>{iface.gateway}</div>}
                                                                        {iface.vlan && <div><span className="text-slate-400 font-sans font-normal">VLAN: </span>{iface.vlan}</div>}
                                                                        {iface.idVlan && <div><span className="text-slate-400 font-sans font-normal">ID VLAN: </span>{iface.idVlan}</div>}
                                                                        {iface.red && <div><span className="text-slate-400 font-sans">Red: </span>{iface.red}</div>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                                {(inf.sistemaOperativoNombre || inf.softwareOfimaticoNombre || inf.usuarioAcceso) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Software & Acceso</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {[
                                                                { label: 'Sistema Operativo', value: inf.sistemaOperativoNombre },
                                                                { label: 'Versión S.O.', value: inf.sistemaOperativoVersion },
                                                                { label: 'Licencia S.O.', value: inf.sistemaOperativoLicencia },
                                                                { label: 'Software Ofimático', value: inf.softwareOfimaticoNombre },
                                                                { label: 'Versión Ofimática', value: inf.softwareOfimaticoVersion },
                                                                { label: 'Usuario Acceso', value: inf.usuarioAcceso },
                                                                { label: 'Password Acceso', value: inf.passwordAcceso ? '••••••••' : null }
                                                            ].filter(f => f.value).map(f => (
                                                                <div key={f.label}>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* --- MONITOR --- */}
                                    {key === 'MON' && (() => {
                                        const m = selectedActivo.atributosEspecificos as AtributosMonitor;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-desktop mr-2 text-purple-400" />Ficha Técnica — Monitor
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    {m.conjuntoEstacion && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase p-1">Conjunto Estación</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{m.conjuntoEstacion}</div>
                                                        </div>
                                                    )}
                                                    {m.pulgadas && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase p-1">Pulgadas / Tamaño</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{m.pulgadas}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- TECLADO --- */}
                                    {key === 'TEC' && (() => {
                                        const t = selectedActivo.atributosEspecificos as AtributosTeclado;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-desktop mr-2 text-purple-400" />Ficha Técnica — Teclado
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    {t.conjuntoEstacion && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase p-1">Conjunto Estación</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{t.conjuntoEstacion}</div>
                                                        </div>
                                                    )}
                                                    {t.interfaz && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase p-1">Tipo de Interfaz</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{t.interfaz}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- MOUSE --- */}
                                    {key === 'MOU' && (() => {
                                        const mo = selectedActivo.atributosEspecificos as AtributosMouse;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-desktop mr-2 text-purple-400" />Ficha Técnica — Mouse
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    {mo.conjuntoEstacion && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase p-1">Conjunto Estación</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{mo.conjuntoEstacion}</div>
                                                        </div>
                                                    )}
                                                    {mo.interfaz && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase p-1">Tipo de Interfaz</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{mo.interfaz}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- IMPRESORA DE RED --- */}
                                    {key === 'IMP' && (() => {
                                        const imp = selectedActivo.atributosEspecificos as AtributosImpresoraRed;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-print mr-2 text-purple-400" />Ficha Técnica — Impresora de Red
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                                    {[
                                                        { label: 'Dirección IP', value: imp.ip },
                                                        { label: 'Dirección MAC', value: imp.mac },
                                                        { label: 'Nombre Impresora', value: imp.nombreImpresora },
                                                        { label: 'Correo Asociado', value: imp.correoAsociado },
                                                        { label: 'Contador de Páginas', value: imp.contador !== null && imp.contador !== undefined ? String(imp.contador) : null },
                                                        { label: 'Usuario / Puerto', value: imp.usuarioPuerto }
                                                    ].filter(f => f.value).map(f => (
                                                        <div key={f.label}>
                                                            <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- TELÉFONO IP --- */}
                                    {key === 'TEL' && (() => {
                                        const tel = selectedActivo.atributosEspecificos as AtributosTelefonoIp;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-phone mr-2 text-purple-400" />Ficha Técnica — Teléfono IP
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                                    {[
                                                        { label: 'Extensión', value: tel.extension },
                                                        { label: 'Dirección IP', value: tel.ip },
                                                        { label: 'Dirección MAC', value: tel.mac },
                                                        { label: 'Responsable(s)', value: tel.responsables },
                                                        { label: 'Especialidad', value: tel.especialidad }
                                                    ].filter(f => f.value).map(f => (
                                                        <div key={f.label}>
                                                            <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- CCTV / NVR --- */}
                                    {key === 'CCTV' && (() => {
                                        const cam = selectedActivo.atributosEspecificos as AtributosCCTV;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-video mr-2 text-purple-400" />Ficha Técnica — Cámara CCTV / NVR
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                                    {[
                                                        { label: 'Tipo Dispositivo', value: cam.tipoDispositivo },
                                                        { label: 'Dirección IP', value: cam.ip },
                                                        { label: 'Etiqueta Punto', value: cam.etiquetaPunto }
                                                    ].filter(f => f.value).map(f => (
                                                        <div key={f.label}>
                                                            <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- ACCESS POINT --- */}
                                    {key === 'AP' && (() => {
                                        const ap = selectedActivo.atributosEspecificos as AtributosAccessPoint;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                    <i className="pi pi-wifi mr-2 text-purple-400" />Ficha Técnica — Access Point / WiFi
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                                    {[
                                                        { label: 'Dirección MAC', value: ap.mac },
                                                        { label: 'Cod HSN', value: ap.codHSN },
                                                        { label: 'Etiqueta Punto', value: ap.etiquetaPunto },
                                                        { label: 'Puerto Switch', value: ap.puertoSwitch }
                                                    ].filter(f => f.value).map(f => (
                                                        <div key={f.label}>
                                                            <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {/* --- EQUIPO DE LABORATORIO --- */}
                                    {key === 'EQL' && (() => {
                                        const lab = selectedActivo.atributosEspecificos as AtributosLaboratorio;
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-teal-700 font-bold mb-2 border-b border-teal-100 pb-2">
                                                    <i className="pi pi-shield mr-2 text-teal-400" />Ficha Técnica — Equipo de Laboratorio
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                                    {[
                                                        { label: 'Tipo Dispositivo', value: lab.tipoDispositivo },
                                                        { label: 'Marca/Serie CPU', value: lab.marcaSerieCPU },
                                                        { label: 'Marca/Serie Monitor', value: lab.marcaSerieMonitor },
                                                        { label: 'IP LAN Hospital', value: lab.ipLanHospital },
                                                        { label: 'MAC LAN Hospital', value: lab.macLanHospital },
                                                        { label: 'IP LAN Biomédica', value: lab.ipLanBiomedica },
                                                        { label: 'MAC LAN Biomédica', value: lab.macLanBiomedica },
                                                        { label: 'Puerto Conexión', value: lab.puertoCnx },
                                                        { label: 'Usuario', value: lab.usuario },
                                                        { label: 'Password', value: lab.password ? '••••••••' : null },
                                                        { label: 'Impresora Dedicada', value: lab.impresoraAsociadaMarca ? `${lab.impresoraAsociadaMarca} (S/N: ${lab.impresoraAsociadaSerie || '—'})` : null }
                                                    ].filter(f => f.value).map(f => (
                                                        <div key={f.label}>
                                                            <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                            <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-6 mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.licenciaWindows ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                            Windows Licenciado: {lab.licenciaWindows ? 'Sí' : 'No'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.antivirus ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                            Antivirus Instalado: {lab.antivirus ? 'Sí' : 'No'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.firewall ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                            Firewall Habilitado: {lab.firewall ? 'Sí' : 'No'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(lab.tieneGarantia !== undefined || lab.fechaFinGarantia || lab.frecuenciaMantenimientoPreventivo || lab.responsableMantenimiento) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Garantía y Mantenimiento</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            <div>
                                                                <div className="text-xs text-slate-500 uppercase p-1">Tipo Posesión</div>
                                                                <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{lab.tipoPostesion === 'ApoyoTecnologico' ? 'Apoyo Tecnológico' : 'Propio'}</div>
                                                            </div>
                                                            {lab.tieneGarantia !== undefined && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Tiene Garantía</div>
                                                                    <div className="mt-1">
                                                                        {lab.tieneGarantia
                                                                            ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Sí</span>
                                                                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">No</span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {lab.fechaFinGarantia && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Fin de Garantía</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{new Date(lab.fechaFinGarantia).toLocaleDateString('es-ES')}</div>
                                                                </div>
                                                            )}
                                                            {lab.frecuenciaMantenimientoPreventivo && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Frec. Mant. Preventivo</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{lab.frecuenciaMantenimientoPreventivo}</div>
                                                                </div>
                                                            )}
                                                            {lab.responsableMantenimiento && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Responsable Mantenimiento</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{lab.responsableMantenimiento}</div>
                                                                </div>
                                                            )}
                                                            {lab.tipoPostesion === 'ApoyoTecnologico' && (
                                                                <>
                                                                    <div>
                                                                        <div className="text-xs text-slate-500 uppercase p-1">Empresa Apoyo</div>
                                                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{lab.empresaApoyo || '—'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-slate-500 uppercase p-1">Orden de Servicio</div>
                                                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{lab.ordenServicio || '—'}</div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* --- EQUIPO DE RAYOS E IMAGEN --- */}
                                    {key === 'EQR' && (() => {
                                        const r = selectedActivo.atributosEspecificos as AtributosRayosImagen;
                                        const TIPOS_NO_IONIZANTES = new Set(['Ecógrafo', 'Resonancia Magnética (RM)']);
                                        const esIonizante = r.tipoEquipo ? !TIPOS_NO_IONIZANTES.has(r.tipoEquipo) : true;
                                        const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('es-ES') : '—';
                                        return (
                                            <>
                                                <h3 className="text-sm uppercase tracking-normal text-amber-700 font-bold mb-2 border-b border-amber-100 pb-2">
                                                    <i className="pi pi-shield mr-2 text-amber-400" />Ficha Técnica — Equipo de Rayos e Imagen
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase p-1">Tipo de Equipo</div>
                                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.tipoEquipo || '—'}</div>
                                                    </div>
                                                </div>
                                                {esIonizante && (r.tensionPicoKvp || r.corrienteMa || r.tiempoExposicionMs || r.potenciaMaxKw || r.dosisEntradaMgy) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Parámetros de Radiación</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {[
                                                                { label: 'Tensión Pico (kVp)', value: r.tensionPicoKvp },
                                                                { label: 'Corriente (mA)', value: r.corrienteMa },
                                                                { label: 'Tiempo Exp. (ms)', value: r.tiempoExposicionMs },
                                                                { label: 'Potencia Máx (kW)', value: r.potenciaMaxKw },
                                                                { label: 'Dosis Entrada (mGy)', value: r.dosisEntradaMgy },
                                                                { label: 'Filtración (mm Al)', value: r.filtracionInherenteAlMm },
                                                                { label: 'Distancia Foco (cm)', value: r.distanciaFocoReceptorCm }
                                                            ].filter(f => f.value).map(f => (
                                                                <div key={f.label}>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                                {(r.numeroLicenciaSCAN || r.titularLicencia || r.estadoLicencia) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Licenciamiento SCAN</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-amber-50/50 border border-amber-100 rounded p-3">
                                                            {r.numeroLicenciaSCAN && <div><span className="text-xs text-amber-700 block uppercase font-semibold">N.º Licencia SCAN</span><span className="text-sm font-semibold text-slate-850">{r.numeroLicenciaSCAN}</span></div>}
                                                            {r.estadoLicencia && <div><span className="text-xs text-amber-700 block uppercase font-semibold">Estado Licencia</span><span className="text-sm font-semibold text-slate-850">{r.estadoLicencia}</span></div>}
                                                            {r.titularLicencia && <div><span className="text-xs text-amber-700 block uppercase font-semibold">Titular</span><span className="text-sm text-slate-700">{r.titularLicencia}</span></div>}
                                                            {r.categoriaFuenteSCAN && <div><span className="text-xs text-amber-700 block uppercase font-semibold">Cat. Fuente</span><span className="text-sm text-slate-700">{r.categoriaFuenteSCAN}</span></div>}
                                                            {r.fechaEmisionLicencia && <div><span className="text-xs text-amber-700 block uppercase font-semibold">Fecha Emisión</span><span className="text-sm text-slate-700">{formatDate(r.fechaEmisionLicencia)}</span></div>}
                                                            {r.fechaVencimientoLicencia && <div><span className="text-xs text-amber-700 block uppercase font-semibold">Fecha Vencimiento</span><span className="text-sm text-slate-700">{formatDate(r.fechaVencimientoLicencia)}</span></div>}
                                                        </div>
                                                    </>
                                                )}
                                                {r.oprNombre && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Oficial de Protección Radiológica (OPR)</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 rounded p-3 border border-slate-100">
                                                            <div><span className="text-xs text-slate-400 block">Nombre</span><span className="text-sm text-slate-700">{r.oprNombre}</span></div>
                                                            {r.oprTelefono && <div><span className="text-xs text-slate-400 block">Teléfono</span><span className="text-sm text-slate-700">{r.oprTelefono}</span></div>}
                                                            {r.oprEmail && <div><span className="text-xs text-slate-400 block">Email</span><span className="text-sm text-slate-700">{r.oprEmail}</span></div>}
                                                        </div>
                                                    </>
                                                )}
                                                {esIonizante && (r.materialBlindaje || r.grosorBlindajePbMm || r.areaControladaDefinida || r.planEmergenciaRadiologica) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Blindaje & Seguridad</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {r.materialBlindaje && <div><div className="text-xs text-slate-500 uppercase p-1">Material Blindaje</div><div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.materialBlindaje}</div></div>}
                                                            {r.grosorBlindajePbMm && <div><div className="text-xs text-slate-500 uppercase p-1">Grosor (mm Pb)</div><div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.grosorBlindajePbMm}</div></div>}
                                                            {r.areaControladaDefinida !== undefined && <div><div className="text-xs text-slate-500 uppercase p-1">Área Delimitada</div><div className="mt-1"><span className={`px-2 py-0.5 text-xs rounded font-semibold ${r.areaControladaDefinida ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{r.areaControladaDefinida ? 'Sí' : 'No'}</span></div></div>}
                                                            {r.planEmergenciaRadiologica !== undefined && <div><div className="text-xs text-slate-500 uppercase p-1">Plan Emergencia SCAN</div><div className="mt-1"><span className={`px-2 py-0.5 text-xs rounded font-semibold ${r.planEmergenciaRadiologica ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{r.planEmergenciaRadiologica ? 'Sí' : 'No'}</span></div></div>}
                                                        </div>
                                                    </>
                                                )}
                                                {(r.frecuenciaCalibración || r.laboratorioCalibración || r.fechaUltimoControlCalidad) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Calibración & Calidad</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {r.frecuenciaCalibración && <div><div className="text-xs text-slate-500 uppercase p-1">Frec. Calibración</div><div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.frecuenciaCalibración}</div></div>}
                                                            {r.laboratorioCalibración && <div><div className="text-xs text-slate-500 uppercase p-1">Laboratorio</div><div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.laboratorioCalibración}</div></div>}
                                                            {r.fechaUltimoControlCalidad && <div><div className="text-xs text-slate-500 uppercase p-1">Último Control</div><div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{formatDate(r.fechaUltimoControlCalidad)}</div></div>}
                                                            {r.fechaProximoControlCalidad && <div><div className="text-xs text-slate-500 uppercase p-1">Próximo Control</div><div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{formatDate(r.fechaProximoControlCalidad)}</div></div>}
                                                            {r.dosimetrosPersonales !== undefined && <div><div className="text-xs text-slate-500 uppercase p-1">Dosímetros Asignados</div><div className="mt-1"><span className={`px-2 py-0.5 text-xs rounded font-semibold ${r.dosimetrosPersonales ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{r.dosimetrosPersonales ? 'Sí' : 'No'}</span></div></div>}
                                                        </div>
                                                    </>
                                                )}
                                                {(r.tieneGarantia !== undefined || r.fechaFinGarantia || r.frecuenciaMantenimientoPreventivo || r.responsableMantenimiento) && (
                                                    <>
                                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Garantía y Mantenimiento</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            <div>
                                                                <div className="text-xs text-slate-500 uppercase p-1">Tipo Posesión</div>
                                                                <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.tipoPostesion === 'ApoyoTecnologico' ? 'Apoyo Tecnológico' : 'Propio'}</div>
                                                            </div>
                                                            {r.tieneGarantia !== undefined && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Tiene Garantía</div>
                                                                    <div className="mt-1">
                                                                        {r.tieneGarantia
                                                                            ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Sí</span>
                                                                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">No</span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {r.fechaFinGarantia && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Fin de Garantía</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{formatDate(r.fechaFinGarantia)}</div>
                                                                </div>
                                                            )}
                                                            {r.frecuenciaMantenimientoPreventivo && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Frec. Mant. Preventivo</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.frecuenciaMantenimientoPreventivo}</div>
                                                                </div>
                                                            )}
                                                            {r.responsableMantenimiento && (
                                                                <div>
                                                                    <div className="text-xs text-slate-500 uppercase p-1">Responsable Mantenimiento</div>
                                                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.responsableMantenimiento}</div>
                                                                </div>
                                                            )}
                                                            {r.tipoPostesion === 'ApoyoTecnologico' && (
                                                                <>
                                                                    <div>
                                                                        <div className="text-xs text-slate-500 uppercase p-1">Empresa Apoyo</div>
                                                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.empresaApoyo || '—'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-slate-500 uppercase p-1">Orden de Servicio</div>
                                                                        <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{r.ordenServicio || '—'}</div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </section>
                            );
                        })()}

                        {/* SECCIÓN 7: Código de Barras */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Código de Barras</h3>
                            <div className="mt-4 max-w-sm mx-auto">
                                <BarcodeDownload activo={selectedActivo} />
                            </div>
                        </section>

                    </div>
                )}
            </Dialog>

            {/* Dialog específico para reimprimir / ver código de barras */}
            <Dialog
                header="Etiqueta de Código de Barras"
                visible={barcodeActivo !== null}
                onHide={() => setBarcodeActivo(null)}
                style={{ width: '450px' }}
                modal
                closable
            >
                {barcodeActivo && (
                    <div className="pt-2">
                        <BarcodeDownload activo={barcodeActivo} />
                        <div className="flex justify-end mt-4">
                            <Button
                                label="Cerrar"
                                icon="pi pi-times"
                                severity="secondary"
                                onClick={() => setBarcodeActivo(null)}
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default ConsultarActivos;
