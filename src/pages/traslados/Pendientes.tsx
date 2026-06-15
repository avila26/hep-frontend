import React, { useState, useMemo, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

interface Traslado {
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

const MOCK_TRASLADOS: Traslado[] = [
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

const formatDate = (d: Date | string | null | undefined): string => {
    if (!d) return '—';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const PendientesTraslados: React.FC = () => {
    const [globalFilter, setGlobalFilter] = useState('');
    console.log('PendientesTraslados: render');

    const [trasladosList, setTrasladosList] = useState<Traslado[]>(MOCK_TRASLADOS);
    const traslados = useMemo(() => trasladosList.filter(t => t.estado === 'Pendiente'), [trasladosList]);
    const [selected, setSelected] = useState<Traslado | null>(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const toast = useRef<Toast>(null);

    const header = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Traslados Pendientes</h2>
                <small>Listado de traslados con estado pendiente en el sistema HEP</small>
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
            </span>
        </div>
    );

    const estadoBody = (row: Traslado) => (
        <Tag value={row.estado} severity={row.estado === 'Pendiente' ? 'warning' : 'success'} />
    );

    const fechaBody = (row: Traslado) => <span>{formatDate(row.fechaTraslado)}</span>;

    const viewDetail = (row: Traslado) => {
        setSelected(row);
        setDetailVisible(true);
    };

    const approve = (row: Traslado) => {
        setTrasladosList(prev => prev.map(t => (t.id === row.id ? { ...t, estado: 'Aprobado' } : t)));
        toast.current?.show({ severity: 'success', summary: 'Traslado aprobado', detail: `Ref: ${row.codigoActivo}`, life: 3000 });
    };

    const accionesBody = (row: Traslado) => (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button icon="pi pi-eye" className="p-button-rounded p-button-info" aria-label="Ver detalle" onClick={() => viewDetail(row)} tooltip="Ver detalle" />
            <Button icon="pi pi-check-circle" className="p-button-rounded p-button-success" aria-label="Aprobar traslado" onClick={() => approve(row)} tooltip="Aprobar traslado" />
        </div>
    );

    return (
        <div className="p-4">
            <div style={{ marginBottom: 12, padding: 8, background: '#f3f4f6', borderRadius: 6 }}>
                <strong>DEBUG:</strong> Componente <em>PendientesTraslados</em> cargado.
            </div>
            <Toast ref={toast} />
            <DataTable
                value={traslados}
                header={header}
                globalFilter={globalFilter}
                globalFilterFields={[
                    'codigoActivo',
                    'nombreActivo',
                    'ubicacionOrigen',
                    'ubicacionDestino',
                    'responsableAnterior',
                    'nuevoResponsable',
                    'motivo'
                ]}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay traslados pendientes"
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="codigoActivo" header="Código del activo" sortable />
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

            <Dialog header="Detalle del traslado" visible={detailVisible} style={{ width: '560px' }} modal onHide={() => setDetailVisible(false)}>
                {selected ? (
                    <div>
                        <p><strong>Código:</strong> {selected.codigoActivo}</p>
                        <p><strong>Nombre:</strong> {selected.nombreActivo}</p>
                        <p><strong>Origen:</strong> {selected.ubicacionOrigen}</p>
                        <p><strong>Destino:</strong> {selected.ubicacionDestino}</p>
                        <p><strong>Responsable anterior:</strong> {selected.responsableAnterior}</p>
                        <p><strong>Nuevo responsable:</strong> {selected.nuevoResponsable}</p>
                        <p><strong>Fecha:</strong> {formatDate(selected.fechaTraslado)}</p>
                        <p><strong>Motivo:</strong> {selected.motivo}</p>
                    </div>
                ) : null}
            </Dialog>
        </div>
    );
};

export default PendientesTraslados;
