import React, { useState, useMemo, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTrasladosContext, TrasladoHEP } from '../../context/TrasladosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const FILTRO_ESTADO = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente', value: 'Pendiente' },
  { label: 'Ejecutado', value: 'Ejecutado' }
];

/* ------------------------------------------------------------------ */
/*  Función de Formato de Fecha Segura                                */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const ReporteTraslados: React.FC = () => {
  const { traslados } = useTrasladosContext();

  // Estados
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<TrasladoHEP[]>([]);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<TrasladoHEP | null>(null);
  const toast = useRef<Toast>(null);

  // Computar resultados filtrados
  const resultados = useMemo(() => {
    const list = traslados || [];
    return list.filter(t => {
      // 1. Estado
      if (filtroEstado && t.estado !== filtroEstado) {
        return false;
      }
      // 2. Fecha Desde (comparando fechaTraslado)
      if (fechaDesde) {
        if (!t.fechaTraslado) return false;
        const parts = t.fechaTraslado.split('-');
        const dateProg = new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
          0,
          0,
          0,
          0
        );
        const limitDesde = new Date(fechaDesde);
        limitDesde.setHours(0, 0, 0, 0);
        if (dateProg < limitDesde) {
          return false;
        }
      }
      // 3. Fecha Hasta (comparando fechaTraslado)
      if (fechaHasta) {
        if (!t.fechaTraslado) return false;
        const parts = t.fechaTraslado.split('-');
        const dateProg = new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
          0,
          0,
          0,
          0
        );
        const limitHasta = new Date(fechaHasta);
        limitHasta.setHours(0, 0, 0, 0);
        if (dateProg > limitHasta) {
          return false;
        }
      }
      // 4. Búsqueda global
      if (globalFilter) {
        const query = globalFilter.toLowerCase().trim();
        const ref = (t.referencia || '').toLowerCase();
        const cod = (t.codigoActivo || '').toLowerCase();
        const nom = (t.nombreActivo || '').toLowerCase();
        const cat = (t.categoria || '').toLowerCase();
        const orig = (t.ubicacionOrigen || '').toLowerCase();
        const dest = (t.ubicacionDestino || '').toLowerCase();
        const prevResp = (t.responsableAnterior || '').toLowerCase();
        const newResp = (t.nuevoResponsable || '').toLowerCase();
        const mot = (t.motivo || '').toLowerCase();
        const ejec = (t.ejecutadoPor || '').toLowerCase();

        if (
          !ref.includes(query) &&
          !cod.includes(query) &&
          !nom.includes(query) &&
          !cat.includes(query) &&
          !orig.includes(query) &&
          !dest.includes(query) &&
          !prevResp.includes(query) &&
          !newResp.includes(query) &&
          !mot.includes(query) &&
          !ejec.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [traslados, filtroEstado, fechaDesde, fechaHasta, globalFilter]);

  // Computar estadísticas
  const estadisticas = useMemo(() => {
    const total = resultados.length;
    const pendientes = resultados.filter(t => t.estado === 'Pendiente').length;
    const ejecutados = resultados.filter(t => t.estado === 'Ejecutado').length;
    const tasaEjecucion = total > 0
      ? Math.round((ejecutados / total) * 100)
      : 0;

    return {
      total,
      pendientes,
      ejecutados,
      tasaEjecucion
    };
  }, [resultados]);

  // Exportar Excel
  const buildRowsForExport = (data: TrasladoHEP[]) => {
    return data.map(row => ({
      'Referencia': row.referencia,
      'Código Activo': row.codigoActivo,
      'Nombre Activo': row.nombreActivo,
      'Categoría': row.categoria,
      'Ubicación Origen': row.ubicacionOrigen,
      'Ubicación Destino': row.ubicacionDestino,
      'Responsable Anterior': row.responsableAnterior,
      'Nuevo Responsable': row.nuevoResponsable,
      'Fecha Programada': formatDate(row.fechaTraslado),
      'Fecha Ejecución': formatDate(row.fechaEjecucion),
      'Estado': row.estado,
      'Motivo': row.motivo,
      'Observaciones': row.observaciones || '—',
      'Ejecutado Por': row.ejecutadoPor || '—'
    }));
  };

  const exportarExcel = (data: TrasladoHEP[], suffix: string = '') => {
    if (data.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay datos para exportar',
        life: 3000
      });
      return;
    }
    const rows = buildRowsForExport(data);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Traslados');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `reporte_traslados_HEP${suffix}_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Exportación completada',
      life: 3000
    });
  };

  // Exportar PDF
  const exportarPDF = (data: TrasladoHEP[]) => {
    if (data.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay datos para exportar',
        life: 3000
      });
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    const fecha = new Date().toISOString().split('T')[0];
    const fechaHoraActual = `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;

    // Encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Hospital de Especialidades Portoviejo — HEP', 14, 15);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Traslados de Activos', 14, 22);

    doc.setFontSize(9);
    doc.text(`Generado: ${fechaHoraActual}`, 14, 28);
    doc.text(`Total de registros: ${data.length}`, 14, 33);
    doc.text(
      `Resumen: ${estadisticas.pendientes} Pendientes, ${estadisticas.ejecutados} Ejecutados | Tasa de ejecución: ${estadisticas.tasaEjecucion}%`,
      14,
      38
    );

    const headers = [
      [
        'Ref.',
        'Activo',
        'Origen',
        'Destino',
        'Responsable Ant.',
        'Nuevo Responsable',
        'F. Traslado',
        'F. Ejecución',
        'Estado'
      ]
    ];

    const body = data.map(row => [
      row.referencia,
      `${row.codigoActivo} - ${row.nombreActivo}`,
      row.ubicacionOrigen,
      row.ubicacionDestino,
      row.responsableAnterior,
      row.nuevoResponsable,
      formatDate(row.fechaTraslado),
      formatDate(row.fechaEjecucion),
      row.estado
    ]);

    autoTable(doc, {
      startY: 43,
      head: headers,
      body: body,
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: (dataPage) => {
        const str = `Página ${dataPage.pageNumber}`;
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.text(str, pageWidth - 30, pageHeight - 10);
      }
    });

    doc.save(`reporte_traslados_HEP_${fecha}.pdf`);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF generado correctamente',
      life: 3000
    });
  };

  // Plantillas de columnas
  const estadoBodyTemplate = (rowData: TrasladoHEP) => {
    const severity = rowData.estado === 'Ejecutado' ? 'success' : 'warning';
    return <Tag value={rowData.estado} severity={severity} />;
  };

  const accionesBodyTemplate = (rowData: TrasladoHEP) => {
    return (
      <Button
        icon="pi pi-eye"
        severity="info"
        rounded
        tooltip="Ver detalle"
        tooltipOptions={{ position: 'top' }}
        onClick={() => {
          setSelectedItem(rowData);
          setDialogDetalle(true);
        }}
      />
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Reporte de Traslados
          </h1>
          <p className="text-slate-500 m-0">
            Estadísticas y reportes de traslados planificados y ejecutados de activos — Hospital de Especialidades Portoviejo
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid mb-4">
        {/* Total */}
        <div className="col-12 md:col-6 lg:col-3">
          <div className="card shadow-sm border-round p-3 bg-blue-50 text-blue-800 border-left-3 border-blue-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.total}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total</div>
            </div>
            <i className="pi pi-list text-3xl text-blue-400"></i>
          </div>
        </div>

        {/* Pendientes */}
        <div className="col-12 md:col-6 lg:col-3">
          <div className="card shadow-sm border-round p-3 bg-orange-50 text-orange-800 border-left-3 border-orange-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.pendientes}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-orange-600">Pendientes</div>
            </div>
            <i className="pi pi-clock text-3xl text-orange-400"></i>
          </div>
        </div>

        {/* Ejecutados */}
        <div className="col-12 md:col-6 lg:col-3">
          <div className="card shadow-sm border-round p-3 bg-green-50 text-green-800 border-left-3 border-green-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.ejecutados}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-600">Ejecutados</div>
            </div>
            <i className="pi pi-check-circle text-3xl text-green-400"></i>
          </div>
        </div>

        {/* Tasa de Ejecución */}
        <div className="col-12 md:col-6 lg:col-3">
          <div className="card shadow-sm border-round p-3 bg-purple-50 text-purple-800 border-left-3 border-purple-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.tasaEjecucion}%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">Tasa de ejecución</div>
            </div>
            <i className="pi pi-chart-line text-3xl text-purple-400"></i>
          </div>
        </div>
      </div>

      {/* Card Filtros */}
      <Card className="mb-4 shadow-sm border-round">
        <div className="flex align-items-center gap-2 mb-3">
          <i className="pi pi-filter text-primary text-xl"></i>
          <span className="font-bold text-lg text-slate-800">Filtros avanzados</span>
        </div>

        <div className="grid align-items-end">
          <div className="col-12 md:col-3">
            <label htmlFor="estadoDropdown" className="block text-sm font-semibold text-slate-700 mb-2">
              Estado
            </label>
            <Dropdown
              id="estadoDropdown"
              value={filtroEstado}
              options={FILTRO_ESTADO}
              onChange={e => {
                setFiltroEstado(e.value);
                setSelectedRows([]);
              }}
              placeholder="Todos los estados"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-3">
            <label htmlFor="fechaDesde" className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha traslado desde
            </label>
            <Calendar
              id="fechaDesde"
              value={fechaDesde}
              onChange={e => {
                setFechaDesde(e.value as Date | null);
                setSelectedRows([]);
              }}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
              placeholder="Seleccionar fecha"
            />
          </div>
          <div className="col-12 md:col-3">
            <label htmlFor="fechaHasta" className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha traslado hasta
            </label>
            <Calendar
              id="fechaHasta"
              value={fechaHasta}
              onChange={e => {
                setFechaHasta(e.value as Date | null);
                setSelectedRows([]);
              }}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
              placeholder="Seleccionar fecha"
            />
          </div>
          <div className="col-12 md:col-3">
            <label htmlFor="busquedaInput" className="block text-sm font-semibold text-slate-700 mb-2">
              Búsqueda
            </label>
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                id="busquedaInput"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Buscar referencia, activo, ubicaciones..."
                className="w-full"
              />
            </IconField>
          </div>
        </div>

        <div className="flex justify-content-end mt-3">
          <Button
            label="Limpiar filtros"
            icon="pi pi-filter-slash"
            severity="secondary"
            onClick={() => {
              setFiltroEstado('');
              setFechaDesde(null);
              setFechaHasta(null);
              setGlobalFilter('');
              setSelectedRows([]);
            }}
          />
        </div>
      </Card>

      {/* Toolbar Exportaciones */}
      {resultados.length > 0 && (
        <Toolbar
          className="mb-4"
          left={
            <div className="text-sm font-medium text-slate-700">
              Mostrando <span className="text-primary font-bold">{resultados.length}</span> de{' '}
              <span className="font-bold">{traslados?.length || 0}</span> registros totales |{' '}
              <span className="text-info font-bold">{selectedRows.length}</span> seleccionados
            </div>
          }
          right={
            <div className="flex gap-2 flex-wrap">
              <Button
                label="Exportar Excel"
                icon="pi pi-file-excel"
                severity="success"
                onClick={() => exportarExcel(resultados)}
              />
              <Button
                label="Exportar selección"
                icon="pi pi-check-square"
                severity="info"
                disabled={selectedRows.length === 0}
                onClick={() => exportarExcel(selectedRows, '_seleccion')}
              />
              <Button
                label="Exportar PDF"
                icon="pi pi-file-pdf"
                severity="danger"
                onClick={() => exportarPDF(resultados)}
              />
            </div>
          }
        />
      )}

      {/* Tabla de Resultados */}
      <div className="card shadow-sm border-round bg-white p-3">
        <DataTable
          value={resultados}
          selection={selectedRows}
          onSelectionChange={e => setSelectedRows(e.value as TrasladoHEP[])}
          selectionMode="multiple"
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No se encontraron traslados con los filtros aplicados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
          tableStyle={{ minWidth: '110rem' }}
        >
          <Column selectionMode="multiple" style={{ width: '3rem' }} />
          <Column field="referencia" header="Referencia" sortable style={{ minWidth: '10rem' }} />
          <Column field="codigoActivo" header="Código activo" sortable style={{ minWidth: '10rem' }} />
          <Column field="nombreActivo" header="Nombre activo" sortable style={{ minWidth: '15rem' }} />
          <Column field="ubicacionOrigen" header="Ubicación origen" sortable style={{ minWidth: '12rem' }} />
          <Column field="ubicacionDestino" header="Ubicación destino" sortable style={{ minWidth: '12rem' }} />
          <Column field="responsableAnterior" header="Responsable anterior" sortable style={{ minWidth: '15rem' }} />
          <Column field="nuevoResponsable" header="Nuevo responsable" sortable style={{ minWidth: '15rem' }} />
          <Column
            field="fechaTraslado"
            header="Fecha traslado"
            body={(row: TrasladoHEP) => formatDate(row.fechaTraslado)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="fechaEjecucion"
            header="Fecha ejecución"
            body={(row: TrasladoHEP) => formatDate(row.fechaEjecucion)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column
            header="Acciones"
            body={accionesBodyTemplate}
            style={{ minWidth: '8rem', textAlign: 'center' }}
          />
        </DataTable>
      </div>

      {/* Dialog Detalle */}
      <Dialog
        header={
          selectedItem ? (
            <div className="flex align-items-center gap-2">
              <span className="font-bold">{selectedItem.referencia}</span>
              <Tag value={selectedItem.estado} severity={selectedItem.estado === 'Ejecutado' ? 'success' : 'warning'} />
            </div>
          ) : (
            'Detalle del Traslado'
          )
        }
        visible={dialogDetalle}
        style={{ width: '700px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={
          <div className="flex justify-content-end pt-2">
            <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
          </div>
        }
      >
        {selectedItem && (
          <div className="p-fluid">
            {/* SECCIÓN identificación */}
            <span className="font-bold text-base text-slate-700 block mb-3">Identificación del Activo</span>
            <div className="grid">
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Referencia</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.referencia}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Código activo</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.codigoActivo}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Categoría</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.categoria}</span>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre activo</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.nombreActivo}</span>
              </div>
            </div>

            <Divider />

            {/* SECCIÓN ruta del traslado */}
            <span className="font-bold text-base text-slate-700 block mb-3">Ruta del Traslado</span>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ubicación origen</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.ubicacionOrigen}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ubicación destino</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.ubicacionDestino}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Responsable anterior</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.responsableAnterior}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nuevo responsable</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.nuevoResponsable}</span>
              </div>
            </div>

            <Divider />

            {/* SECCIÓN ejecución y fechas */}
            <span className="font-bold text-base text-slate-700 block mb-3">Registro y Ejecución</span>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha de registro</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaRegistro)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha programada</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaTraslado)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha ejecución</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaEjecucion)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ejecutado por</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.ejecutadoPor || '—'}</span>
              </div>
            </div>

            <Divider />

            {/* SECCIÓN motivo y observaciones */}
            <span className="font-bold text-base text-slate-700 block mb-3">Motivo y Observaciones</span>
            <div className="grid">
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Motivo del traslado</span>
                <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.motivo}</span>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Observaciones</span>
                <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.observaciones || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReporteTraslados;
