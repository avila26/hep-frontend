import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { useActivos, Activo } from '../../context/ActivosContext';
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
        'Dado de Baja': 'BAJ',
        'En Reparación': 'MAN'
    };
    return mapaLegacy[estado] ?? estado.toUpperCase();
};

export const ConsultarActivos: React.FC = () => {
    const { activos } = useActivos();
    const navigate = useNavigate();

    const [searchValue, setSearchValue] = useState('');
    const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);
    const [barcodeActivo, setBarcodeActivo] = useState<Activo | null>(null);

    // Estados para los filtros avanzados (RF-RA-19 / HU-04)
    const [filterActa, setFilterActa] = useState('');
    const [filterResponsable, setFilterResponsable] = useState('');
    const [filterContrato, setFilterContrato] = useState('');
    const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
    const [filterEstado, setFilterEstado] = useState<string | null>(null);

    // Obtener categorías únicas presentes en la base de datos
    const categoriasUnicas = React.useMemo(() => {
        const cats = activos.map(activo => activo.categoriaActivo).filter(Boolean);
        return Array.from(new Set(cats)).sort();
    }, [activos]);

    const categoriaOptions = React.useMemo(() => {
        return categoriasUnicas.map(cat => ({ label: cat, value: cat }));
    }, [categoriasUnicas]);

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
        setSearchValue('');
        setFilterActa('');
        setFilterResponsable('');
        setFilterContrato('');
        setFilterCategoria(null);
        setFilterEstado(null);
    };

    // Filtrar activos por todos los criterios activos (AND)
    const activosFiltrados = activos.filter(activo => {
        // Bien (Nombre, Serie o Código Institucional)
        if (searchValue.trim()) {
            const search = searchValue.toLowerCase();
            const matchesNombre = activo.nombre?.toLowerCase().includes(search);
            const matchesCodigo = activo.codigoInstitucional?.toLowerCase().includes(search);
            const matchesSerie = activo.numeroSerie?.toLowerCase().includes(search);
            if (!matchesNombre && !matchesCodigo && !matchesSerie) {
                return false;
            }
        }

        // Número de acta
        if (filterActa.trim()) {
            const searchActa = filterActa.toLowerCase();
            if (!activo.numeroActa?.toLowerCase().includes(searchActa)) {
                return false;
            }
        }

        // Responsable de recepción (responsableEntrega)
        if (filterResponsable.trim()) {
            const searchResponsable = filterResponsable.toLowerCase();
            if (!activo.responsableEntrega?.toLowerCase().includes(searchResponsable)) {
                return false;
            }
        }

        // Número de contrato
        if (filterContrato.trim()) {
            const searchContrato = filterContrato.toLowerCase();
            if (!activo.numeroContrato?.toLowerCase().includes(searchContrato)) {
                return false;
            }
        }

        // Categoría (categoriaActivo)
        if (filterCategoria) {
            if (activo.categoriaActivo !== filterCategoria) {
                return false;
            }
        }

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
                    {/* Búsqueda por Bien */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Bien (Nombre o Código)</label>
                        <InputText
                            type="search"
                            placeholder="Buscar bien..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Número de Acta */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Número de Acta</label>
                        <InputText
                            placeholder="Ej: ACTA-2024-001"
                            value={filterActa}
                            onChange={(e) => setFilterActa(e.target.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Responsable de Recepción */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Responsable de Recepción</label>
                        <InputText
                            placeholder="Buscar responsable..."
                            value={filterResponsable}
                            onChange={(e) => setFilterResponsable(e.target.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Número de Contrato */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Número de Contrato</label>
                        <InputText
                            placeholder="Ej: CONTRATO-2024-001"
                            value={filterContrato}
                            onChange={(e) => setFilterContrato(e.target.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Categoría</label>
                        <Dropdown
                            value={filterCategoria}
                            options={categoriaOptions}
                            onChange={(e) => setFilterCategoria(e.value)}
                            placeholder="Todas las categorías"
                            showClear
                            className="w-full text-sm"
                        />
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Estado</label>
                        <Dropdown
                            value={filterEstado}
                            options={estadoOptions}
                            onChange={(e) => setFilterEstado(e.value)}
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
                    <Button
                        label="Registrar Nuevo"
                        icon="pi pi-plus"
                        onClick={() => navigate('/activos/registrar')}
                        className="w-full sm:w-auto"
                    />
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
                        <Column field="categoriaActivo" header="Categoría" />
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
                        <Button
                            label="Registrar el primer activo"
                            icon="pi pi-plus"
                            onClick={() => navigate('/activos/registrar')}
                        />
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
                            </div>
                        </section>

                        {/* SECCIÓN 2: Identificación */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Identificación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-700 uppercase tracking-normal rounded p-2">Código Institucional</div>
                                    <div className="text-sm font-medium text-slate-700 bg-slate-50 rounded p-2">{selectedActivo.codigoInstitucional || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Número de Serie</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.numeroSerie || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Código SBYE</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.codigoSBYE || '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Número de Acta</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.numeroActa || '-'}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 3: Clasificación */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Clasificación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Categoría</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.categoriaActivo || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Origen de Ingreso</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.origenIngreso || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Motivo de Ingreso</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.motivoIngreso || '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Unidad de Medida</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.unidadMedida || '-'}</div>
                                </div>
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
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.condicionDepreciacion || '-'}</div>
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
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Responsable Entrega</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.responsableEntrega || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Administrador del Proceso</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.administradorDelProceso || '-'}</div>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 5: Información Financiera y Contractual */}
                        <section className="mb-5">
                            <h3 className="text-sm uppercase tracking-normal text-slate-700 font-bold mb-2 border-b border-slate-200 pb-2">Información Financiera y Contractual</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Número de Contrato</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.numeroContrato || '-'}</div>
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
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor de Adquisición</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.valorAdquisicion != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(selectedActivo.valorAdquisicion) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Valor Unitario</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.valorUnitario != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(selectedActivo.valorUnitario) : '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Fecha DNS</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.fechaDNS ? new Date(selectedActivo.fechaDNS).toLocaleDateString('es-ES') : '-'}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2    ">Tiempo Vida Útil (años)</div>
                                    <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{selectedActivo.tiempoVidaUtil ?? '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2    ">Bloqueado</div>
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

                        {/* SECCIÓN 6: Código de Barras */}
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
