import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useTrasladosContext, TrasladoHEP } from '../../context/TrasladosContext';
import { useActivos } from '../../context/ActivosContext';
import ExcelJS from 'exceljs';

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
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/* ------------------------------------------------------------------ */
/*  Componente Principal                                              */
/* ------------------------------------------------------------------ */
const EjecutadosTraslados: React.FC = () => {
  const { ejecutados } = useTrasladosContext();
  const { activos } = useActivos();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  // Filtros
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);

  // Selección
  const [selectedRows, setSelectedRows] = useState<TrasladoHEP[]>([]);

  // Estados para el modal de detalle completo
  const [selected, setSelected] = useState<TrasladoHEP | null>(null);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);

  // Filtrado local por rango de fechas y globalFilter
  const ejecutadosVisibles = useMemo(() => {
    return ejecutados.filter(t => {
      // 1. Filtro por fechaDesde
      let matchDesde = true;
      if (fechaDesde && t.fechaTraslado) {
        const dateObj = safeParseDate(t.fechaTraslado);
        if (dateObj) {
          matchDesde = dateObj >= fechaDesde;
        }
      }

      // 2. Filtro por fechaHasta
      let matchHasta = true;
      if (fechaHasta && t.fechaTraslado) {
        const dateObj = safeParseDate(t.fechaTraslado);
        if (dateObj) {
          matchHasta = dateObj <= fechaHasta;
        }
      }

      // 3. Filtro por globalFilter (búsqueda de texto)
      let matchGlobal = true;
      if (globalFilter.trim()) {
        const search = globalFilter.toLowerCase().trim();
        const fieldsToSearch = [
          t.referencia,
          t.codigoActivo,
          t.nombreActivo,
          t.categoria,
          t.ubicacionOrigen,
          t.ubicacionDestino,
          t.responsableAnterior,
          t.nuevoResponsable,
          t.motivo,
          t.ejecutadoPor,
          t.observaciones,
          t.estado
        ];
        matchGlobal = fieldsToSearch.some(field => 
          field && field.toLowerCase().includes(search)
        );
      }

      return matchDesde && matchHasta && matchGlobal;
    });
  }, [ejecutados, fechaDesde, fechaHasta, globalFilter]);


  const exportarExcel = async (datos: TrasladoHEP[], esSeleccion: boolean) => {
    if (datos.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay registros para exportar.',
        life: 3000
      });
      return;
    }

    try {
      const response = await fetch('/formato actas.xlsx');
      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet('FORMATO') || workbook.worksheets[0];

      if (datos.length > 0) {
        const first = datos[0];
        
        worksheet.getRow(5).getCell(8).value = 'FECHA';
        worksheet.getRow(5).getCell(9).value = formatDate(first.fechaTraslado);
        worksheet.getRow(5).getCell(5).value = first.ubicacionOrigen;
        worksheet.getRow(6).getCell(5).value = first.ubicacionDestino;
        worksheet.getRow(7).getCell(5).value = first.responsableAnterior;
        worksheet.getRow(7).getCell(9).value = 'ENTREGANTE';
        worksheet.getRow(9).getCell(5).value = first.nuevoResponsable;
        worksheet.getRow(9).getCell(9).value = 'RECEPTOR';
        worksheet.getRow(12).getCell(2).value = first.motivo;
      }

      const startRow = 15;
      const totalEmptyRows = 19;

      if (datos.length > totalEmptyRows) {
        const extraRowsNeeded = datos.length - totalEmptyRows;
        for (let k = 0; k < extraRowsNeeded; k++) {
          worksheet.insertRow(33, []);
          
          const templateRow = worksheet.getRow(32);
          const newRow = worksheet.getRow(33);
          for (let col = 1; col <= 9; col++) {
            newRow.getCell(col).style = { ...templateRow.getCell(col).style };
          }
          newRow.commit();
        }
      }

      datos.forEach((t, index) => {
        const rowNum = startRow + index;
        const row = worksheet.getRow(rowNum);
        const activo = activos.find(a => a.codigoInstitucional === t.codigoActivo);

        row.getCell(1).value = t.ubicacionDestino || '—';
        row.getCell(2).value = activo?.estadoActivo || 'Bueno';
        row.getCell(3).value = activo?.codigoSBYE || '—';
        row.getCell(4).value = t.nombreActivo || '—';
        row.getCell(5).value = activo?.numeroSerie || '—';
        row.getCell(6).value = activo?.modelo || '—';
        row.getCell(7).value = activo?.marca || '—';
        row.getCell(8).value = activo?.color || '—';
        row.getCell(9).value = activo?.valorContable !== undefined && activo?.valorContable !== null 
          ? Number(activo.valorContable) 
          : 0;

        row.commit();
      });

      const totalRowNum = startRow + Math.max(totalEmptyRows, datos.length);
      const totalRow = worksheet.getRow(totalRowNum);

      const totalSum = datos.reduce((sum, t) => {
        const activo = activos.find(a => a.codigoInstitucional === t.codigoActivo);
        return sum + Number(activo?.valorContable || 0);
      }, 0);

      totalRow.getCell(9).value = totalSum;
      totalRow.commit();

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fechaActual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const sufijo = esSeleccion ? '_seleccion' : '';
      link.download = `traslados_ejecutados_HEP_${fechaActual}${sufijo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.current?.show({
        severity: 'success',
        summary: 'Exportación exitosa',
        detail: `Se exportaron ${datos.length} registros correctamente.`,
        life: 3000
      });
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      toast.current?.show({
        severity: 'error',
        summary: 'Error de exportación',
        detail: 'Ocurrió un error al cargar la plantilla o generar el archivo.',
        life: 5000
      });
    }
  };


  // Header de la tabla (con título, filtros de fecha y buscador general)
  const header = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2 style={{ margin: 0 }}>Traslados Ejecutados</h2>
        <small>Listado de traslados confirmados y completados</small>
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
        <div style={{ position: 'relative' }}>
          <i className="pi pi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
          <InputText
            type="search"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Buscar..."
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 flex flex-column gap-4">
      <Toast ref={toast} />
      <Tooltip target=".p-button[data-pr-tooltip]" />

      {/* Barra de herramientas de exportación */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
        <Button
          label="Exportar todo"
          icon="pi pi-download"
          severity="secondary"
          onClick={() => exportarExcel(ejecutadosVisibles, false)}
        />
        <Button
          label="Exportar selección"
          icon="pi pi-check-square"
          severity="info"
          disabled={selectedRows.length === 0}
          onClick={() => exportarExcel(selectedRows, true)}
        />

      </div>

      {/* Contador de registros */}
      <div style={{ marginBottom: '4px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
        Mostrando {ejecutadosVisibles.length} de {ejecutados.length} traslados | {selectedRows.length} seleccionados
      </div>

      {/* DataTable */}
      <div className="card shadow-1 border-round surface-card overflow-x-auto">
        <DataTable
          value={ejecutadosVisibles}
          selection={selectedRows}
          onSelectionChange={e => setSelectedRows(e.value as TrasladoHEP[])}
          selectionMode="multiple"
          paginator={true}
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No hay traslados ejecutados registrados"
          responsiveLayout="scroll"
          stripedRows={true}
          showGridlines={true}
          sortMode="multiple"
          removableSort={true}
          tableStyle={{ minWidth: '120rem' }}
          dataKey="id"
          header={header}
        >
          {/* Checkbox de Selección */}
          <Column selectionMode="multiple" style={{ width: '3rem' }} />

          {/* # (campo: id) */}
          <Column field="id" header="#" sortable style={{ width: '5rem' }} />

          {/* Referencia */}
          <Column field="referencia" header="Referencia" sortable />

          {/* Código activo */}
          <Column field="codigoActivo" header="Código activo" sortable />

          {/* Nombre del activo */}
          <Column field="nombreActivo" header="Nombre del activo" sortable />

          {/* Categoría */}
          <Column field="categoria" header="Categoría" sortable />

          {/* Origen */}
          <Column field="ubicacionOrigen" header="Origen" sortable />

          {/* Destino */}
          <Column field="ubicacionDestino" header="Destino" sortable />

          {/* Responsable anterior */}
          <Column field="responsableAnterior" header="Responsable anterior" sortable />

          {/* Nuevo responsable */}
          <Column field="nuevoResponsable" header="Nuevo responsable" sortable />

          {/* Fecha traslado */}
          <Column
            field="fechaTraslado"
            header="Fecha traslado"
            body={(rowData: TrasladoHEP) => formatDate(rowData.fechaTraslado)}
            sortable
          />

          {/* Fecha ejecución */}
          <Column
            field="fechaEjecucion"
            header="Fecha ejecución"
            body={(rowData: TrasladoHEP) => formatDate(rowData.fechaEjecucion)}
            sortable
          />

          {/* Motivo */}
          <Column field="motivo" header="Motivo" sortable />

          {/* Ejecutado por */}
          <Column field="ejecutadoPor" header="Ejecutado por" sortable />

          {/* Observaciones */}
          <Column field="observaciones" header="Observaciones" sortable />

          {/* Estado */}
          <Column
            field="estado"
            header="Estado"
            body={(rowData: TrasladoHEP) => (
              <Tag value={rowData.estado} severity="success" icon="pi pi-check-circle" />
            )}
            sortable
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
