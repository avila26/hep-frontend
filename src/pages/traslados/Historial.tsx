import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';

interface Traslado {
    id: string;
    codigoActivo: string;
    nombreActivo: string;
    ubicacionOrigen: string;
    ubicacionDestino: string;
    responsableAnterior: string;
    nuevoResponsable: string;
    fechaTraslado: Date | string;
    motivo: string;
    estado: 'Pendiente' | 'Aprobado' | 'Ejecutado';
}

const MOCK_HISTORIAL: Traslado[] = [
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
        id: '5',
        codigoActivo: 'CI-2025-0010',
        nombreActivo: 'Desfibrilador',
        ubicacionOrigen: 'Emergencias',
        ubicacionDestino: 'Quirófano B',
        responsableAnterior: 'Dr. Luis Molina',
        nuevoResponsable: 'Dra. Ana Torres',
        fechaTraslado: new Date(2025, 11, 10),
        motivo: 'Equipamiento de nuevo quirófano',
        estado: 'Ejecutado'
    },
    {
        id: '6',
        codigoActivo: 'CI-2025-0025',
        nombreActivo: 'Electrocardiógrafo',
        ubicacionOrigen: 'Consulta Externa',
        ubicacionDestino: 'Cardiología',
        responsableAnterior: 'Lic. Rosa Mendez',
        nuevoResponsable: 'Dr. Héctor Salas',
        fechaTraslado: new Date(2026, 0, 5),
        motivo: 'Traslado a unidad especializada',
        estado: 'Ejecutado'
    },
    {
        id: '7',
        codigoActivo: 'CI-2026-0008',
        nombreActivo: 'Oxímetro de pulso',
        ubicacionOrigen: 'UCI',
        ubicacionDestino: 'Neonatología',
        responsableAnterior: 'Ing. Mario Vera',
        nuevoResponsable: 'Dr. Carlos Ruiz',
        fechaTraslado: new Date(2026, 2, 18),
        motivo: 'Cobertura en área de recién nacidos',
        estado: 'Ejecutado'
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

const HistorialTraslados: React.FC = () => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
    const [fechaHasta, setFechaHasta] = useState<Date | null>(null);

    const trasladosFiltrados = MOCK_HISTORIAL.filter(t => {
        const fecha = t.fechaTraslado instanceof Date ? t.fechaTraslado : new Date(t.fechaTraslado);
        const matchDesde = fechaDesde ? fecha >= fechaDesde : true;
        const matchHasta = fechaHasta ? fecha <= fechaHasta : true;
        return matchDesde && matchHasta;
    });

    const header = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Historial de Traslados</h2>
                <small>Registro completo de todos los traslados registrados en el sistema HEP</small>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Calendar
                    value={fechaDesde}
                    onChange={e => setFechaDesde(e.value as Date | null)}
                    placeholder="Desde"
                    dateFormat="dd/mm/yy"
                    showIcon
                    style={{ width: 150 }}
                />
                <Calendar
                    value={fechaHasta}
                    onChange={e => setFechaHasta(e.value as Date | null)}
                    placeholder="Hasta"
                    dateFormat="dd/mm/yy"
                    showIcon
                    style={{ width: 150 }}
                />
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
        </div>
    );

    const estadoSeverity = (estado: string): 'warning' | 'success' | 'info' => {
        if (estado === 'Pendiente') return 'warning';
        if (estado === 'Ejecutado') return 'success';
        return 'info';
    };

    const estadoBody = (row: Traslado) => (
        <Tag value={row.estado} severity={estadoSeverity(row.estado)} />
    );

    const fechaBody = (row: Traslado) => <span>{formatDate(row.fechaTraslado)}</span>;

    const accionesBody = (_row: Traslado) => (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button icon="pi pi-eye" className="p-button-rounded p-button-info" title="Ver detalle" />
            <Button icon="pi pi-file-pdf" className="p-button-rounded p-button-secondary" title="Descargar acta" />
        </div>
    );

    return (
        <div className="p-4">
            <DataTable
                value={trasladosFiltrados}
                header={header}
                globalFilter={globalFilter}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay registros en el historial"
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="codigoActivo" header="Código del activo" sortable />
                <Column field="nombreActivo" header="Nombre del activo" sortable />
                <Column field="ubicacionOrigen" header="Origen" sortable />
                <Column field="ubicacionDestino" header="Destino" sortable />
                <Column field="responsableAnterior" header="Resp. anterior" sortable />
                <Column field="nuevoResponsable" header="Nuevo resp." sortable />
                <Column header="Fecha traslado" body={fechaBody} sortable />
                <Column field="motivo" header="Motivo" />
                <Column header="Estado" body={estadoBody} sortable />
                <Column header="Acciones" body={accionesBody} />
            </DataTable>
        </div>
    );
};

export default HistorialTraslados;
