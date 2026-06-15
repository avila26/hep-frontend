
import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

/* ------------------------------------------------------------------ */
/*  Interfaz TypeScript                                                 */
/* ------------------------------------------------------------------ */
interface TrasladoEjecutado {
    id: string;
    codigoActivo: string;
    nombreActivo: string;
    ubicacionOrigen: string;
    ubicacionDestino: string;
    responsableAnterior: string;
    nuevoResponsable: string;
    fechaTraslado: Date | string;
    fechaEjecucion: Date | string;
    motivo: string;
    estado: 'Ejecutado';
}

/* ------------------------------------------------------------------ */
/*  Datos mock  (fechas como strings ISO para evitar errores de        */
/*  hidratación / renderizado)                                          */
/* ------------------------------------------------------------------ */
const MOCK_EJECUTADOS: TrasladoEjecutado[] = [
    {
        id: '1',
        codigoActivo: 'CI-2025-0010',
        nombreActivo: 'Desfibrilador',
        ubicacionOrigen: 'Emergencias',
        ubicacionDestino: 'Quirófano B',
        responsableAnterior: 'Dr. Luis Molina',
        nuevoResponsable: 'Dra. Ana Torres',
        fechaTraslado: '2025-12-10',
        fechaEjecucion: '2025-12-12',
        motivo: 'Equipamiento de nuevo quirófano',
        estado: 'Ejecutado',
    },
    {
        id: '2',
        codigoActivo: 'CI-2025-0025',
        nombreActivo: 'Electrocardiógrafo',
        ubicacionOrigen: 'Consulta Externa',
        ubicacionDestino: 'Cardiología',
        responsableAnterior: 'Lic. Rosa Méndez',
        nuevoResponsable: 'Dr. Héctor Salas',
        fechaTraslado: '2026-01-05',
        fechaEjecucion: '2026-01-08',
        motivo: 'Traslado a unidad especializada',
        estado: 'Ejecutado',
    },
    {
        id: '3',
        codigoActivo: 'CI-2026-0008',
        nombreActivo: 'Oxímetro de pulso',
        ubicacionOrigen: 'UCI',
        ubicacionDestino: 'Neonatología',
        responsableAnterior: 'Ing. Mario Vera',
        nuevoResponsable: 'Dr. Carlos Ruiz',
        fechaTraslado: '2026-03-18',
        fechaEjecucion: '2026-03-20',
        motivo: 'Cobertura en área de recién nacidos',
        estado: 'Ejecutado',
    },
    {
        id: '4',
        codigoActivo: 'CI-2026-0015',
        nombreActivo: 'Lámpara quirúrgica',
        ubicacionOrigen: 'Bodega Central',
        ubicacionDestino: 'Quirófano A',
        responsableAnterior: 'Mgs. Belén Villao',
        nuevoResponsable: 'Dra. Elena Larrea',
        fechaTraslado: '2026-04-02',
        fechaEjecucion: '2026-04-03',
        motivo: 'Reposición por mantenimiento del equipo anterior',
        estado: 'Ejecutado',
    },
];

/* ------------------------------------------------------------------ */
/*  Utilidad de formato de fechas — tolerante a string / Date / null   */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | null | undefined): string => {
    if (date === null || date === undefined) return 'Sin fecha';

    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return 'Fecha inválida';

    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();

    return `${day}/${month}/${year}`;
};

/* ------------------------------------------------------------------ */
/*  Componente principal                                                */
/* ------------------------------------------------------------------ */
const EjecutadosTraslados: React.FC = () => {
    const [globalFilter, setGlobalFilter] = useState<string>('');

    /* ---------- body templates ------------------------------------ */
    const fechaTrasladoBody = (row: TrasladoEjecutado): React.ReactNode => (
        <span>{formatDate(row.fechaTraslado)}</span>
    );

    const fechaEjecucionBody = (row: TrasladoEjecutado): React.ReactNode => (
        <span>{formatDate(row.fechaEjecucion)}</span>
    );

    const estadoBody = (_row: TrasladoEjecutado): React.ReactNode => (
        <Tag value="Ejecutado" severity="success" />
    );

    const accionesBody = (_row: TrasladoEjecutado): React.ReactNode => (
        <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-text p-button-info"
            tooltip="Ver detalle"
            tooltipOptions={{ position: 'top' }}
            aria-label="Ver detalle"
        />
    );

    /* ---------- header con buscador ------------------------------- */
    const header = (
        <div className="flex flex-wrap gap-3 justify-content-between align-items-center">
            <div>
                <h2 className="m-0 text-900 font-semibold">Traslados Ejecutados</h2>
                <small className="text-500">
                    Listado de traslados completados y ejecutados en el sistema HEP
                </small>
            </div>

            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilter}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setGlobalFilter(e.target.value)
                    }
                    placeholder="Buscar..."
                />
            </span>
        </div>
    );

    /* ---------- render -------------------------------------------- */
    return (
        <div className="p-4">
            <DataTable
                value={MOCK_EJECUTADOS}
                header={header}
                globalFilter={globalFilter}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay traslados ejecutados"
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="codigoActivo"       header="Código del activo"      sortable />
                <Column field="nombreActivo"        header="Nombre del activo"      sortable />
                <Column field="ubicacionOrigen"     header="Ubicación de origen"    sortable />
                <Column field="ubicacionDestino"    header="Ubicación de destino"   sortable />
                <Column field="responsableAnterior" header="Responsable anterior"   sortable />
                <Column field="nuevoResponsable"    header="Nuevo responsable"      sortable />
                <Column
                    header="Fecha del traslado"
                    body={fechaTrasladoBody}
                    sortable
                    sortField="fechaTraslado"
                />
                <Column
                    header="Fecha de ejecución"
                    body={fechaEjecucionBody}
                    sortable
                    sortField="fechaEjecucion"
                />
                <Column field="motivo" header="Motivo" />
                <Column header="Estado"   body={estadoBody}   />
                <Column header="Acciones" body={accionesBody} style={{ width: '6rem' }} />
            </DataTable>
        </div>
    );
};

export default EjecutadosTraslados;
