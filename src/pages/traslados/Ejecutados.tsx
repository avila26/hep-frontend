import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Toolbar } from 'primereact/toolbar';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog';
import { useTrasladosContext, TrasladoHEP } from '../../context/TrasladosContext';

/* ------------------------------------------------------------------ */
/*  Función formatDate Segura (Obligatoria sin excepciones)          */
/* ------------------------------------------------------------------ */
const safeParseDate = (d: Date | string | null | undefined): Date | null => {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [year, month, day] = d.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) {
      const [year, month, day] = d.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
  }
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (date: Date | string | undefined): string => {
  const d = safeParseDate(date);
  if (!d) return 'Sin fecha';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

/* ------------------------------------------------------------------ */
/*  Componente Principal                                              */
/* ------------------------------------------------------------------ */
const EjecutadosTraslados: React.FC = () => {
  const { ejecutados } = useTrasladosContext();
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<string>('');
  
  // Estados para el modal de detalle completo
  const [selected, setSelected] = useState<TrasladoHEP | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);

  // Campos de texto para el filtro global
  const globalFilterFields = [
    'referencia',
    'codigoActivo',
    'nombreActivo',
    'categoria',
    'ubicacionOrigen',
    'ubicacionDestino',
    'responsableAnterior',
    'nuevoResponsable',
    'motivo',
    'ejecutadoPor',
    'observaciones',
    'estado'
  ];

  return (
    <div className="p-4 flex flex-column gap-4">
      {/* Inicialización de Tooltips globales */}
      <Tooltip target=".p-button[data-pr-tooltip]" />

      {/* 1. Encabezado */}
      <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
        <div>
          <div className="flex align-items-center gap-3">
            <h1 className="m-0 text-3xl font-bold text-900">Traslados Ejecutados</h1>
            <Tag value={ejecutados.length.toString()} severity="info" className="px-2 text-sm font-semibold" />
          </div>
          <p className="m-0 mt-1 text-600 text-sm">Listado de traslados confirmados y completados</p>
        </div>
      </div>

      {/* 2. Barra de herramientas */}
      <Toolbar
        start={
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
              className="w-12rem md:w-20rem"
            />
          </IconField>
        }
        end={
          <Button
            label="Exportar"
            icon="pi pi-file-excel"
            severity="success"
            type="button"
          />
        }
      />

      {/* 3. DataTable */}
      <div className="card shadow-1 border-round surface-card overflow-x-auto">
        <DataTable
          value={ejecutados}
          globalFilter={globalFilter}
          globalFilterFields={globalFilterFields}
          paginator={true}
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No hay traslados ejecutados registrados"
          responsiveLayout="scroll"
          stripedRows={true}
          showGridlines={true}
          filterDisplay="row"
          sortMode="multiple"
          removableSort={true}
          tableStyle={{ minWidth: '120rem' }}
          dataKey="id"
        >
          {/* # (campo: id) */}
          <Column field="id" header="#" sortable style={{ width: '5rem' }} />

          {/* Referencia */}
          <Column field="referencia" header="Referencia" sortable filter filterPlaceholder="Filtrar" />

          {/* Código activo */}
          <Column field="codigoActivo" header="Código activo" sortable filter filterPlaceholder="Filtrar" />

          {/* Nombre del activo */}
          <Column field="nombreActivo" header="Nombre del activo" sortable filter filterPlaceholder="Filtrar" />

          {/* Categoría */}
          <Column field="categoria" header="Categoría" sortable filter filterPlaceholder="Filtrar" />

          {/* Origen */}
          <Column field="ubicacionOrigen" header="Origen" sortable filter filterPlaceholder="Filtrar" />

          {/* Destino */}
          <Column field="ubicacionDestino" header="Destino" sortable filter filterPlaceholder="Filtrar" />

          {/* Responsable anterior */}
          <Column field="responsableAnterior" header="Responsable anterior" sortable filter filterPlaceholder="Filtrar" />

          {/* Nuevo responsable */}
          <Column field="nuevoResponsable" header="Nuevo responsable" sortable filter filterPlaceholder="Filtrar" />

          {/* Fecha traslado (usar formatDate) */}
          <Column
            field="fechaTraslado"
            header="Fecha traslado"
            body={(rowData: TrasladoHEP) => formatDate(rowData.fechaTraslado)}
            sortable
            filter
            filterPlaceholder="Filtrar"
          />

          {/* Fecha ejecución (usar formatDate) */}
          <Column
            field="fechaEjecucion"
            header="Fecha ejecución"
            body={(rowData: TrasladoHEP) => formatDate(rowData.fechaEjecucion)}
            sortable
            filter
            filterPlaceholder="Filtrar"
          />

          {/* Motivo */}
          <Column field="motivo" header="Motivo" sortable filter filterPlaceholder="Filtrar" />

          {/* Ejecutado por */}
          <Column field="ejecutadoPor" header="Ejecutado por" sortable filter filterPlaceholder="Filtrar" />

          {/* Observaciones */}
          <Column field="observaciones" header="Observaciones" sortable filter filterPlaceholder="Filtrar" />

          {/* Estado */}
          <Column
            field="estado"
            header="Estado"
            body={(rowData: TrasladoHEP) => (
              <Tag value={rowData.estado} severity="success" icon="pi pi-check-circle" />
            )}
            sortable
            filter
            filterPlaceholder="Filtrar"
            style={{ minWidth: '10rem' }}
          />

          {/* Acciones */}
          <Column
            header="Acciones"
            body={(rowData: TrasladoHEP) => (
              <div className="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  type="button"
                  data-pr-tooltip="Ver detalle"
                  aria-label="Ver detalle del traslado"
                  onClick={() => {
                    setSelected(rowData);
                    setDetailVisible(true);
                  }}
                />
                <Button
                  icon="pi pi-history"
                  severity="secondary"
                  rounded
                  type="button"
                  data-pr-tooltip="Ver historial del activo"
                  aria-label={`Ver historial de ${rowData.nombreActivo}`}
                  onClick={() => navigate('/traslados/historial', { state: { codigoActivo: rowData.codigoActivo } })}
                />
              </div>
            )}
            style={{ width: '8rem' }}
          />
        </DataTable>
      </div>

      {/* Diálogo de Detalle Completo */}
      <Dialog 
        header="Detalle del Traslado Ejecutado" 
        visible={detailVisible} 
        style={{ width: '560px' }} 
        modal 
        onHide={() => setDetailVisible(false)}
      >
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p><strong>Referencia:</strong> {selected.referencia}</p>
            <p><strong>Código Activo:</strong> {selected.codigoActivo}</p>
            <p><strong>Nombre Activo:</strong> {selected.nombreActivo}</p>
            <p><strong>Categoría:</strong> {selected.categoria}</p>
            <p><strong>Ubicación de Origen:</strong> {selected.ubicacionOrigen}</p>
            <p><strong>Ubicación de Destino:</strong> {selected.ubicacionDestino}</p>
            <p><strong>Responsable Anterior:</strong> {selected.responsableAnterior}</p>
            <p><strong>Nuevo Responsable:</strong> {selected.nuevoResponsable}</p>
            <p><strong>Fecha Traslado:</strong> {formatDate(selected.fechaTraslado)}</p>
            <p><strong>Fecha Ejecución:</strong> {formatDate(selected.fechaEjecucion)}</p>
            <p><strong>Ejecutado por:</strong> {selected.ejecutadoPor || '—'}</p>
            <p><strong>Motivo:</strong> {selected.motivo}</p>
            <p><strong>Observaciones:</strong> {selected.observaciones || 'Sin observaciones'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <strong>Estado:</strong>
              <Tag value={selected.estado} severity="success" icon="pi pi-check-circle" />
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
};

export default EjecutadosTraslados;
