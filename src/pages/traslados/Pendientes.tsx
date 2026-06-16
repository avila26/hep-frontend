import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useTrasladosContext, TrasladoHEP } from '../../context/TrasladosContext';

<<<<<<< HEAD
export interface Traslado {
    id: string;
    codigoActivo: string;
    nombreActivo: string;
    ubicacionOrigen: string;
    ubicacionDestino: string;
    responsableAnterior: string;
    nuevoResponsable: string;
    fechaTraslado: Date;
    motivo: string;
    estado: 'Pendiente' | 'Aprobado' | 'Ejecutado';
}

export const MOCK_TRASLADOS: Traslado[] = [
    {
        id: '1',
        codigoActivo: 'CI-2026-0001',
        nombreActivo: 'Ventilador mecánico',
        ubicacionOrigen: 'UCI',
        ubicacionDestino: 'Quirófano A',
        responsableAnterior: 'Ing. Carlos Ortega',
        nuevoResponsable: 'Dra. Elena Larrea',
        fechaTraslado: new Date(2026, 5, 20),
        motivo: 'Reasignación por aumento de demanda',
        estado: 'Pendiente'
    },
    {
        id: '2',
        codigoActivo: 'CI-2026-0002',
        nombreActivo: 'Monitor de signos vitales',
        ubicacionOrigen: 'Quirófano B',
        ubicacionDestino: 'UCI',
        responsableAnterior: 'Lic. María Gómez',
        nuevoResponsable: 'Dr. Juan Pérez',
        fechaTraslado: new Date(2026, 5, 22),
        motivo: 'Apoyo temporal para pacientes críticos',
        estado: 'Pendiente'
    },
    {
        id: '3',
        codigoActivo: 'CI-2026-0003',
        nombreActivo: 'Bomba de infusión',
        ubicacionOrigen: 'Hospitalización - Piso 1',
        ubicacionDestino: 'Consulta Externa',
        responsableAnterior: 'Mgs. Belén Villao',
        nuevoResponsable: 'LIC. Lisbeth Mero',
        fechaTraslado: new Date(2026, 6, 2),
        motivo: 'Reposicionamiento para campaña de vacunación',
        estado: 'Pendiente'
    },
    {
        id: '4',
        codigoActivo: 'CI-2025-0042',
        nombreActivo: 'Laptop administrativa',
        ubicacionOrigen: 'Área Administrativa',
        ubicacionDestino: 'TICs',
        responsableAnterior: 'Ing. Antonio Alarcón',
        nuevoResponsable: 'Ing. Carlos Ortega',
        fechaTraslado: new Date(2026, 4, 15),
        motivo: 'Soporte técnico y actualización de software',
        estado: 'Pendiente'
    }
];

=======
/* ------------------------------------------------------------------ */
/*  Utilidad de Formato de Fecha                                     */
/* ------------------------------------------------------------------ */
>>>>>>> cd32ff7 (cambios en traslado)
const formatDate = (d: Date | string | null | undefined): string => {
    if (!d) return '—';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/* ------------------------------------------------------------------ */
/*  Componente Principal                                              */
/* ------------------------------------------------------------------ */
const PendientesTraslados: React.FC = () => {
    const { pendientes, ejecutarTraslado } = useTrasladosContext();
    const [globalFilter, setGlobalFilter] = useState('');
    const [selected, setSelected] = useState<TrasladoHEP | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    // Estado del diálogo de confirmación de ejecución
    const [execDialogVisible, setExecDialogVisible] = useState(false);
    const [execTarget, setExecTarget] = useState<TrasladoHEP | null>(null);
    const [ejecutadoPor, setEjecutadoPor] = useState('');

    const toast = useRef<Toast>(null);

    // Abrir modal de detalle
    const viewDetail = (row: TrasladoHEP) => {
        setSelected(row);
        setDetailVisible(true);
    };

    // Abrir modal de ejecución
    const openExecDialog = (row: TrasladoHEP) => {
        setExecTarget(row);
        setEjecutadoPor('');
        setExecDialogVisible(true);
    };

    // Confirmar la ejecución del traslado
    const handleConfirmExec = () => {
        if (!ejecutadoPor.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Falta información',
                detail: 'El nombre del responsable de ejecución es obligatorio.',
                life: 3000
            });
            return;
        }

        if (execTarget) {
            ejecutarTraslado(execTarget.id, ejecutadoPor.trim());
            toast.current?.show({
                severity: 'success',
                summary: 'Traslado Ejecutado',
                detail: `El traslado de ${execTarget.nombreActivo} (Ref: ${execTarget.referencia}) se ha ejecutado con éxito.`,
                life: 3000
            });
            setExecDialogVisible(false);
            setExecTarget(null);
            setEjecutadoPor('');
        }
    };

    /* ---------- templates de DataTable --------------------------- */
    const header = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Traslados Pendientes</h2>
                <small>Listado de traslados con estado pendiente en el sistema HEP</small>
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText 
                    type="search" 
                    value={globalFilter} 
                    onChange={e => setGlobalFilter(e.target.value)} 
                    placeholder="Buscar..." 
                />
            </span>
        </div>
    );

    const estadoBody = (row: TrasladoHEP) => (
        <Tag value={row.estado} severity="warning" />
    );

    const fechaBody = (row: TrasladoHEP) => <span>{formatDate(row.fechaTraslado)}</span>;

    const accionesBody = (row: TrasladoHEP) => (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button 
                icon="pi pi-eye" 
                severity="info"
                rounded
                aria-label="Ver detalle" 
                onClick={() => viewDetail(row)} 
                tooltip="Ver detalle" 
            />
            <Button 
                icon="pi pi-play-circle" 
                severity="success"
                rounded
                aria-label="Ejecutar traslado" 
                onClick={() => openExecDialog(row)} 
                tooltip="Ejecutar" 
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <DataTable
                value={pendientes}
                header={header}
                globalFilter={globalFilter}
                globalFilterFields={[
                    'referencia',
                    'codigoActivo',
                    'nombreActivo',
                    'categoria',
                    'ubicacionOrigen',
                    'ubicacionDestino',
                    'responsableAnterior',
                    'nuevoResponsable',
                    'motivo',
                    'observaciones'
                ]}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay traslados pendientes"
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="codigoActivo" header="Código del activo" sortable />
                <Column field="referencia" header="Referencia" sortable />
                <Column field="nombreActivo" header="Nombre del activo" sortable />
                <Column field="ubicacionOrigen" header="Ubicación de origen" sortable />
                <Column field="ubicacionDestino" header="Ubicación de destino" sortable />
                <Column field="responsableAnterior" header="Responsable anterior" sortable />
                <Column field="nuevoResponsable" header="Nuevo responsable" sortable />
                <Column header="Fecha del traslado" body={fechaBody} sortable />
                <Column field="motivo" header="Motivo" />
                <Column header="Estado" body={estadoBody} />
                <Column header="Acciones" body={accionesBody} />
            </DataTable>

            {/* Diálogo de Detalle */}
            <Dialog 
                header="Detalle del traslado" 
                visible={detailVisible} 
                style={{ width: '560px' }} 
                modal 
                onHide={() => setDetailVisible(false)}
            >
                {selected ? (
                    <div>
                        <p><strong>Referencia:</strong> {selected.referencia}</p>
                        <p><strong>Código:</strong> {selected.codigoActivo}</p>
                        <p><strong>Nombre:</strong> {selected.nombreActivo}</p>
                        <p><strong>Categoría:</strong> {selected.categoria}</p>
                        <p><strong>Origen:</strong> {selected.ubicacionOrigen}</p>
                        <p><strong>Destino:</strong> {selected.ubicacionDestino}</p>
                        <p><strong>Responsable anterior:</strong> {selected.responsableAnterior}</p>
                        <p><strong>Nuevo responsable:</strong> {selected.nuevoResponsable}</p>
                        <p><strong>Fecha:</strong> {formatDate(selected.fechaTraslado)}</p>
                        <p><strong>Motivo:</strong> {selected.motivo}</p>
                        <p><strong>Observaciones:</strong> {selected.observaciones || 'Sin observaciones'}</p>
                    </div>
                ) : null}
            </Dialog>

            {/* Diálogo de Confirmación de Ejecución */}
            <Dialog 
                header="Confirmar Ejecución" 
                visible={execDialogVisible} 
                style={{ width: '450px' }} 
                modal 
                onHide={() => setExecDialogVisible(false)}
                footer={
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button 
                            label="Cancelar" 
                            icon="pi pi-times" 
                            severity="secondary" 
                            onClick={() => setExecDialogVisible(false)} 
                        />
                        <Button 
                            label="Confirmar ejecución" 
                            icon="pi pi-check" 
                            severity="success" 
                            onClick={handleConfirmExec} 
                        />
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <label htmlFor="ejecutadoPor" style={{ fontWeight: '600' }}>
                        Ejecutado por <span style={{ color: 'red' }}>*</span>
                    </label>
                    <InputText 
                        id="ejecutadoPor" 
                        value={ejecutadoPor} 
                        onChange={e => setEjecutadoPor(e.target.value)} 
                        placeholder="Ingrese el nombre del responsable"
                        className="w-full"
                        autoFocus
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default PendientesTraslados;
