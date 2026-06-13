import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { useRef } from 'react';
import { useActivos, Activo } from '../../context/ActivosContext';
import { useNavigate } from 'react-router-dom';

export const ConsultarActivos: React.FC = () => {
    const { activos, eliminarActivo } = useActivos();
    const toast = useRef<Toast>(null);
    const navigate = useNavigate();

    const [searchValue, setSearchValue] = useState('');
    const [selectedActivo, setSelectedActivo] = useState<Activo | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteActivoId, setDeleteActivoId] = useState<number | null>(null);

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
            <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                onClick={() => {
                    setDeleteActivoId(rowData.idActivo);
                    setShowDeleteDialog(true);
                }}
                title="Eliminar"
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
        const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' } = {
            'Bueno': 'success',
            'Regular': 'warning',
            'Malo': 'danger',
            'En Reparación': 'info',
            'Dado de Baja': 'secondary'
        };
        return (
            <span className={`px-3 py-1 rounded text-sm font-medium 
                ${severityMap[rowData.estadoActivo] === 'success' ? 'bg-green-100 text-green-800' : ''}
                ${severityMap[rowData.estadoActivo] === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${severityMap[rowData.estadoActivo] === 'danger' ? 'bg-red-100 text-red-800' : ''}
                ${severityMap[rowData.estadoActivo] === 'info' ? 'bg-blue-100 text-blue-800' : ''}
                ${severityMap[rowData.estadoActivo] === 'secondary' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
                {rowData.estadoActivo}
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

    // Confirmar eliminación
    const confirmarEliminar = () => {
        if (deleteActivoId) {
            eliminarActivo(deleteActivoId);
            setShowDeleteDialog(false);
            setDeleteActivoId(null);
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Activo eliminado correctamente',
                life: 3000
            });
        }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />

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

            {/* Dialog de detalles */}
            <Dialog
                visible={selectedActivo !== null}
                onHide={() => setSelectedActivo(null)}
                header="Detalles del Activo"
                modal
                style={{ width: '90vw', maxWidth: '600px' }}
            >
                {selectedActivo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium text-slate-700">ID:</label>
                            <p>{selectedActivo.idActivo}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Nombre:</label>
                            <p>{selectedActivo.nombre}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Número de Serie:</label>
                            <p>{selectedActivo.numeroSerie}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Marca:</label>
                            <p>{selectedActivo.marca}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Categoría:</label>
                            <p>{selectedActivo.categoriaActivo}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Estado:</label>
                            <p>{selectedActivo.estadoActivo}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Ubicación:</label>
                            <p>{selectedActivo.ubicacion}</p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Fecha Adquisición:</label>
                            <p>
                                {selectedActivo.fechaAdquisicion
                                    ? new Date(selectedActivo.fechaAdquisicion).toLocaleDateString('es-ES')
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Valor Total:</label>
                            <p>
                                {selectedActivo.valorTotal
                                    ? new Intl.NumberFormat('es-ES', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(selectedActivo.valorTotal)
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">Responsable Entrega:</label>
                            <p>{selectedActivo.responsableEntrega || '-'}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="font-medium text-slate-700">Descripción:</label>
                            <p>{selectedActivo.descripcion || '-'}</p>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Dialog de confirmación de eliminación */}
            <Dialog
                visible={showDeleteDialog}
                onHide={() => setShowDeleteDialog(false)}
                header="Confirmar Eliminación"
                modal
                footer={
                    <div className="flex gap-2">
                        <Button
                            label="Cancelar"
                            onClick={() => setShowDeleteDialog(false)}
                            severity="secondary"
                        />
                        <Button
                            label="Eliminar"
                            onClick={confirmarEliminar}
                            severity="danger"
                        />
                    </div>
                }
            >
                <p>¿Está seguro de que desea eliminar este activo? Esta acción no se puede deshacer.</p>
            </Dialog>
        </div>
    );
};

export default ConsultarActivos;
