import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { useActivos, Activo, AtributosEquipoBiomedico, AtributosEquipoInformatico } from '../../context/ActivosContext';
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

                        {/* SECCIÓN 6: Ficha Técnica Específica (EQM o EQI) */}
                        {selectedActivo.atributosEspecificos && (
                            <section className="mb-5">
                                {/* --- EQUIPO BIOMÉDICO --- */}
                                {selectedActivo.categoriaActivo?.includes('EQM') && (() => {
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

                                {/* --- EQUIPO INFORMÁTICO --- */}
                                {selectedActivo.categoriaActivo?.includes('EQI') && (() => {
                                    const inf = selectedActivo.atributosEspecificos as AtributosEquipoInformatico;
                                    return (
                                        <>
                                            <h3 className="text-sm uppercase tracking-normal text-purple-700 font-bold mb-2 border-b border-purple-100 pb-2">
                                                <i className="pi pi-desktop mr-2 text-purple-400" />Ficha Técnica — Equipo Informático
                                            </h3>

                                            {/* Procesador & Memoria */}
                                            {(inf.procesadorMarca || inf.procesadorTipo || inf.numeroProcesadores || inf.numeroNucleos || inf.ramMarca || inf.ramCapacidad || inf.ramTipo) && (
                                                <>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Procesador y Memoria RAM</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Marca Procesador', value: inf.procesadorMarca },
                                                            { label: 'Tipo Procesador', value: inf.procesadorTipo },
                                                            { label: 'N.º Procesadores', value: inf.numeroProcesadores },
                                                            { label: 'N.º Núcleos', value: inf.numeroNucleos },
                                                            { label: 'Marca RAM', value: inf.ramMarca },
                                                            { label: 'Capacidad RAM', value: inf.ramCapacidad },
                                                            { label: 'Tipo RAM', value: inf.ramTipo },
                                                        ].filter(f => f.value).map(f => (
                                                            <div key={f.label}>
                                                                <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                                <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Almacenamiento & Tarjeta Madre */}
                                            {(inf.almacenamientoMarca || inf.almacenamientoCapacidad || inf.tarjetaMadreMarca || inf.tarjetaMadreModelo) && (
                                                <>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Almacenamiento y Tarjeta Madre</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Marca Almacenamiento', value: inf.almacenamientoMarca },
                                                            { label: 'Capacidad Almacenamiento', value: inf.almacenamientoCapacidad },
                                                            { label: 'Marca T. Madre', value: inf.tarjetaMadreMarca },
                                                            { label: 'Modelo T. Madre', value: inf.tarjetaMadreModelo },
                                                        ].filter(f => f.value).map(f => (
                                                            <div key={f.label}>
                                                                <div className="text-xs text-slate-500 uppercase p-1">{f.label}</div>
                                                                <div className="text-sm font-medium text-slate-800 bg-slate-50 rounded p-2">{f.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Periféricos */}
                                            {(inf.mouse?.marca || inf.teclado?.marca) && (
                                                <>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Periféricos</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {inf.mouse?.marca && (
                                                            <div className="bg-slate-50 rounded p-3 border border-slate-100">
                                                                <div className="text-xs font-semibold text-slate-600 mb-2">Mouse</div>
                                                                <div className="grid grid-cols-2 gap-1 text-xs">
                                                                    {inf.mouse.marca && <div><span className="text-slate-400">Marca: </span><span className="text-slate-700">{inf.mouse.marca}</span></div>}
                                                                    {inf.mouse.modelo && <div><span className="text-slate-400">Modelo: </span><span className="text-slate-700">{inf.mouse.modelo}</span></div>}
                                                                    {inf.mouse.serie && <div><span className="text-slate-400">Serie: </span><span className="text-slate-700">{inf.mouse.serie}</span></div>}
                                                                    {inf.mouse.color && <div><span className="text-slate-400">Color: </span><span className="text-slate-700">{inf.mouse.color}</span></div>}
                                                                    {inf.mouse.tipoInterfaz && <div><span className="text-slate-400">Interfaz: </span><span className="text-slate-700">{inf.mouse.tipoInterfaz}</span></div>}
                                                                    {inf.mouse.codigoActivoFijo && <div><span className="text-slate-400">Cód. Activo: </span><span className="text-slate-700">{inf.mouse.codigoActivoFijo}</span></div>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {inf.teclado?.marca && (
                                                            <div className="bg-slate-50 rounded p-3 border border-slate-100">
                                                                <div className="text-xs font-semibold text-slate-600 mb-2">Teclado</div>
                                                                <div className="grid grid-cols-2 gap-1 text-xs">
                                                                    {inf.teclado.marca && <div><span className="text-slate-400">Marca: </span><span className="text-slate-700">{inf.teclado.marca}</span></div>}
                                                                    {inf.teclado.modelo && <div><span className="text-slate-400">Modelo: </span><span className="text-slate-700">{inf.teclado.modelo}</span></div>}
                                                                    {inf.teclado.serie && <div><span className="text-slate-400">Serie: </span><span className="text-slate-700">{inf.teclado.serie}</span></div>}
                                                                    {inf.teclado.color && <div><span className="text-slate-400">Color: </span><span className="text-slate-700">{inf.teclado.color}</span></div>}
                                                                    {inf.teclado.tipoInterfaz && <div><span className="text-slate-400">Interfaz: </span><span className="text-slate-700">{inf.teclado.tipoInterfaz}</span></div>}
                                                                    {inf.teclado.codigoActivoFijo && <div><span className="text-slate-400">Cód. Activo: </span><span className="text-slate-700">{inf.teclado.codigoActivoFijo}</span></div>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {/* Red */}
                                            {inf.redHabilitada && inf.interfacesRed && inf.interfacesRed.length > 0 && (
                                                <>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Interfaces de Red</h4>
                                                    <div className="space-y-2">
                                                        {inf.interfacesRed.map((iface, idx) => (
                                                            <div key={idx} className="bg-slate-50 rounded p-3 border border-slate-100">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="text-xs font-bold text-slate-600 uppercase">{iface.tipo}</span>
                                                                    <span className={`px-2 py-0.5 text-xs rounded ${iface.estado === 'Activa' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{iface.estado}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                                                                    {iface.ip && <div><span className="text-slate-400">IP: </span><span className="text-slate-700 font-mono">{iface.ip}</span></div>}
                                                                    {iface.mac && <div><span className="text-slate-400">MAC: </span><span className="text-slate-700 font-mono">{iface.mac}</span></div>}
                                                                    {iface.gateway && <div><span className="text-slate-400">Gateway: </span><span className="text-slate-700 font-mono">{iface.gateway}</span></div>}
                                                                    {iface.vlan && <div><span className="text-slate-400">VLAN: </span><span className="text-slate-700">{iface.vlan}</span></div>}
                                                                    {iface.idVlan && <div><span className="text-slate-400">ID VLAN: </span><span className="text-slate-700">{iface.idVlan}</span></div>}
                                                                    {iface.red && <div><span className="text-slate-400">Red: </span><span className="text-slate-700 font-mono">{iface.red}</span></div>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            {/* Software */}
                                            {(inf.sistemaOperativoNombre || inf.softwareOfimaticoNombre || inf.usuarioAcceso) && (
                                                <>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mt-4 mb-2">Software</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Sistema Operativo', value: inf.sistemaOperativoNombre },
                                                            { label: 'Versión S.O.', value: inf.sistemaOperativoVersion },
                                                            { label: 'Licencia S.O.', value: inf.sistemaOperativoLicencia },
                                                            { label: 'Software Ofimático', value: inf.softwareOfimaticoNombre },
                                                            { label: 'Versión Ofimática', value: inf.softwareOfimaticoVersion },
                                                            { label: 'Usuario de Acceso', value: inf.usuarioAcceso },
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
                            </section>
                        )}

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
