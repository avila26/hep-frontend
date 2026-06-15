import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { useActivos, Activo } from '../../context/ActivosContext';
import { useNavigate } from 'react-router-dom';

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

    // Filtrar activos por búsqueda
    const activosFiltrados = activos.filter(activo =>
        activo.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
        activo.numeroSerie.toLowerCase().includes(searchValue.toLowerCase()) ||
        activo.codigoInstitucional.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Columna con acciones
    const actionBodyTemplate = (rowData: Activo) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-eye"
                rounded
                severity="info"
                onClick={() => setSelectedActivo(rowData)}
                title="Ver detalles"
            />
            <Button
                icon="pi pi-pencil"
                rounded
                severity="warning"
                onClick={() => console.log('Editar', rowData.idActivo)}
                title="Editar"
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

            <Card className="shadow-lg">
                {/* Barra de búsqueda y acciones */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                    <div className="flex-1 w-full">
                        <InputText
                            type="search"
                            placeholder="Buscar por nombre, serie o código..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button
                        label="Registrar Nuevo"
                        icon="pi pi-plus"
                        onClick={() => navigate('/activos/registrar')}
                        className="w-full md:w-auto"
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
                            header="Acciones"
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
                                    <div className="text-xs text-slate-500 uppercase tracking-normal rounded p-2">Tiempo Vida Útil (años)</div>
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

                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default ConsultarActivos;
