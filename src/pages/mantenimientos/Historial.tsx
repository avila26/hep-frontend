import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMantenimientosContext, MantenimientoHEP } from '../../context/MantenimientosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
export const FILTRO_TIPO = [
  { label: 'Todos los tipos', value: '' },
  { label: 'Preventivo', value: 'Preventivo' },
  { label: 'Correctivo', value: 'Correctivo' }
];

export const FILTRO_ESTADO = [
  { label: 'Todos los estados', value: '' },
  { label: 'Programado', value: 'Programado' },
  { label: 'En Proceso', value: 'En Proceso' },
  { label: 'Cerrado', value: 'Cerrado' }
];

export const FILTRO_PRIORIDAD = [
  { label: 'Todas las prioridades', value: '' },
  { label: 'Alta', value: 'Alta' },
  { label: 'Media', value: 'Media' },
  { label: 'Baja', value: 'Baja' }
];

/* ------------------------------------------------------------------ */
/*  Funciones de formato de fecha y hora                             */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatDateTime = (date: string | undefined): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${
    String(d.getMinutes()).padStart(2, '0')}`;
};

const HistorialMantenimientos: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mantenimientos, iniciarMantenimiento } = useMantenimientosContext();

  // Estados de filtros
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);

  // Estados de selección y visualización
  const [selectedRows, setSelectedRows] = useState<MantenimientoHEP[]>([]);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MantenimientoHEP | null>(null);

  const dtRef = useRef<DataTable<any>>(null);
  const toast = useRef<Toast>(null);

  // Inicialización desde location.state
  useEffect(() => {
    const state = location.state as { codigoActivo?: string; tipo?: string } | null;
    if (state?.codigoActivo) {
      setGlobalFilter(state.codigoActivo);
    }
    if (state?.tipo) {
      setFiltroTipo(state.tipo);
    }
  }, [location.state]);

  // Filtrado de mantenimientos visibles
  const mantenimientosVisibles = useMemo(() => {
    return mantenimientos.filter(t => {
      // 1. Tipo
      if (filtroTipo && t.tipo !== filtroTipo) return false;

      // 2. Estado
      if (filtroEstado && t.estado !== filtroEstado) return false;

      // 3. Prioridad
      if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false;

      // Helper para convertir strings 'YYYY-MM-DD' a Date local a efectos de comparación
      const getLocalDate = (dStr: string) => {
        if (!dStr) return null;
        const parts = dStr.split('-');
        if (parts.length === 3) {
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(dStr);
      };

      const dateProg = getLocalDate(t.fechaProgramada);

      // 4. Fecha desde
      if (fechaDesde && dateProg) {
        const start = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), fechaDesde.getDate());
        if (dateProg < start) return false;
      }

      // 5. Fecha hasta
      if (fechaHasta && dateProg) {
        const end = new Date(fechaHasta.getFullYear(), fechaHasta.getMonth(), fechaHasta.getDate());
        if (dateProg > end) return false;
      }

      // 6. Filtro Global
      if (globalFilter.trim()) {
        const query = globalFilter.toLowerCase();
        const matches = [
          t.referencia,
          t.codigoActivo,
          t.nombreActivo,
          t.categoria,
          t.ubicacion,
          t.responsableTecnico,
          t.responsableCustodia,
          t.diagnostico,
          t.descripcionTrabajo,
          t.observaciones,
          t.creadoPor,
          (t as any).ejecutadoPor
        ].some(val => val && val.toLowerCase().includes(query));

        if (!matches) return false;
      }

      return true;
    });
  }, [mantenimientos, filtroTipo, filtroEstado, filtroPrioridad, fechaDesde, fechaHasta, globalFilter]);

  // Construcción de filas estructuradas para exportación
  const buildRowsForExport = (data: MantenimientoHEP[]) => {
    return data.map(row => ({
      'Referencia': row.referencia,
      'Tipo': row.tipo,
      'Código Activo': row.codigoActivo,
      'Nombre Activo': row.nombreActivo,
      'Categoría': row.categoria,
      'Ubicación': row.ubicacion,
      'Técnico Responsable': row.responsableTecnico,
      'Custodio': row.responsableCustodia,
      'Diagnóstico': row.diagnostico || '—',
      'Prioridad': row.prioridad,
      'Estado': row.estado,
      'Fecha Programada': formatDate(row.fechaProgramada),
      'Fecha Inicio': formatDate(row.fechaInicio) || '—',
      'Fecha Cierre': formatDate(row.fechaCierre) || '—',
      'Descripción Trabajo': row.descripcionTrabajo,
      'Repuestos Utilizados': row.repuestosUtilizados || '—',
      'Observaciones': row.observaciones || '—',
      'Creado Por': row.creadoPor,
      'Fecha Registro': formatDateTime(row.fechaRegistro)
    }));
  };

  // Funciones de exportación
  const exportarExcelTodo = () => {
    if (mantenimientosVisibles.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay registros para exportar',
        life: 3000
      });
      return;
    }
    const rows = buildRowsForExport(mantenimientosVisibles);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `historial_mantenimientos_HEP_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Exportación Excel completada',
      life: 3000
    });
  };

  const exportarExcelSeleccion = () => {
    if (selectedRows.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione al menos un registro',
        life: 3000
      });
      return;
    }
    const rows = buildRowsForExport(selectedRows);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selección');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `historial_mantenimientos_HEP_seleccion_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: `Exportados ${selectedRows.length} registros`,
      life: 3000
    });
  };

  const exportarPDF = () => {
    if (mantenimientosVisibles.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay registros para exportar',
        life: 3000
      });
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');

    // Encabezado del PDF
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Hospital de Especialidades Portoviejo — HEP', 14, 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Historial de Mantenimientos', 14, 22);
    doc.setFontSize(9);
    doc.text(`Generado: ${fecha} ${hora}`, 14, 28);
    doc.text(`Total de registros: ${mantenimientosVisibles.length}`, 14, 33);

    // Tabla
    autoTable(doc, {
      startY: 38,
      head: [
        [
          'Ref.',
          'Tipo',
          'Activo',
          'Ubicación',
          'Técnico',
          'Prioridad',
          'Estado',
          'F.Programada',
          'F.Inicio',
          'F.Cierre'
        ]
      ],
      body: mantenimientosVisibles.map(row => [
        row.referencia,
        row.tipo,
        `${row.codigoActivo} - ${row.nombreActivo}`,
        row.ubicacion,
        row.responsableTecnico,
        row.prioridad,
        row.estado,
        formatDate(row.fechaProgramada),
        formatDate(row.fechaInicio) || '—',
        formatDate(row.fechaCierre) || '—'
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 5
        );
      }
    });

    const fechaArchivo = new Date().toISOString().split('T')[0];
    doc.save(`historial_mantenimientos_HEP_${fechaArchivo}.pdf`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF generado correctamente',
      life: 3000
    });
  };

  const handleLimpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFechaDesde(null);
    setFechaHasta(null);
    setGlobalFilter('');
  };

  // KPIs de la cabecera
  const totalKPI = mantenimientos.length;
  const programadosKPI = mantenimientos.filter(m => m.estado === 'Programado').length;
  const enProcesoKPI = mantenimientos.filter(m => m.estado === 'En Proceso').length;
  const cerradosKPI = mantenimientos.filter(m => m.estado === 'Cerrado').length;

  // Templates de columna
  const tipoBodyTemplate = (rowData: MantenimientoHEP) => {
    const severity = rowData.tipo === 'Preventivo' ? 'info' : 'danger';
    return <Tag value={rowData.tipo} severity={severity} />;
  };

  const prioridadBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'danger' | 'warning' | 'success' | 'info' = 'info';
    if (rowData.prioridad === 'Alta') severity = 'danger';
    else if (rowData.prioridad === 'Media') severity = 'warning';
    else if (rowData.prioridad === 'Baja') severity = 'success';

    return <Tag value={rowData.prioridad} severity={severity} />;
  };

  const estadoBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'warning' | 'danger' | 'success' | 'info' = 'info';
    if (rowData.estado === 'Programado') severity = 'warning';
    else if (rowData.estado === 'En Proceso') severity = 'danger';
    else if (rowData.estado === 'Cerrado') severity = 'success';

    return <Tag value={rowData.estado} severity={severity} />;
  };

  const actionsBodyTemplate = (rowData: MantenimientoHEP) => {
    return (
      <div className="flex gap-2">
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
        {rowData.estado === 'Programado' && (
          <Button
            icon="pi pi-play-circle"
            severity="warning"
            rounded
            tooltip="Iniciar mantenimiento"
            tooltipOptions={{ position: 'top' }}
            onClick={() => {
              iniciarMantenimiento(rowData.id);
              toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Mantenimiento iniciado',
                life: 3000
              });
            }}
          />
        )}
        {rowData.estado === 'En Proceso' && (
          <Button
            icon="pi pi-lock"
            severity="success"
            rounded
            tooltip="Cerrar mantenimiento"
            tooltipOptions={{ position: 'top' }}
            onClick={() => {
              navigate('/mantenimientos/cerrar', { state: { id: rowData.id } });
            }}
          />
        )}
      </div>
    );
  };

  const headerToolbarRight = () => {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          label="Exportar todo"
          icon="pi pi-download"
          severity="secondary"
          onClick={exportarExcelTodo}
        />
        <Button
          label="Exportar selección"
          icon="pi pi-check-square"
          severity="info"
          disabled={selectedRows.length === 0}
          onClick={exportarExcelSeleccion}
        />
        <Button
          label="Exportar PDF"
          icon="pi pi-file-pdf"
          severity="danger"
          onClick={exportarPDF}
        />
      </div>
    );
  };

  const detailDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
      {selectedItem?.estado === 'En Proceso' && (
        <Button
          label="Cerrar mantenimiento"
          icon="pi pi-lock"
          severity="success"
          onClick={() => {
            setDialogDetalle(false);
            navigate('/mantenimientos/cerrar', { state: { id: selectedItem.id } });
          }}
        />
      )}
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="mb-4">
        <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 m-0 mb-1">
          Historial de Mantenimientos
        </h1>
        <p className="text-slate-500 dark:text-slate-400 m-0">
          Registro completo de todos los mantenimientos del Hospital de Especialidades Portoviejo
        </p>
      </div>

      {/* Mini KPIs */}
      <div className="grid mb-4">
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-sm p-3 border-round bg-blue-50 border-1 border-blue-100 flex justify-content-between align-items-center">
            <div>
              <span className="block text-slate-500 font-medium text-sm mb-1">Total registros</span>
              <div className="text-slate-800 font-bold text-3xl">{totalKPI}</div>
            </div>
            <i className="pi pi-list text-blue-500 text-3xl" />
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-sm p-3 border-round bg-yellow-50 border-1 border-yellow-100 flex justify-content-between align-items-center">
            <div>
              <span className="block text-slate-500 font-medium text-sm mb-1">Programados</span>
              <div className="text-slate-800 font-bold text-3xl">{programadosKPI}</div>
            </div>
            <i className="pi pi-clock text-yellow-500 text-3xl" />
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-sm p-3 border-round bg-orange-50 border-1 border-orange-100 flex justify-content-between align-items-center">
            <div>
              <span className="block text-slate-500 font-medium text-sm mb-1">En Proceso</span>
              <div className="text-slate-800 font-bold text-3xl">{enProcesoKPI}</div>
            </div>
            <i className="pi pi-wrench text-orange-500 text-3xl" />
          </div>
        </div>
        <div className="col-12 sm:col-6 lg:col-3">
          <div className="card shadow-sm p-3 border-round bg-green-50 border-1 border-green-100 flex justify-content-between align-items-center">
            <div>
              <span className="block text-slate-500 font-medium text-sm mb-1">Cerrados</span>
              <div className="text-slate-800 font-bold text-3xl">{cerradosKPI}</div>
            </div>
            <i className="pi pi-check-circle text-green-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Filtros avanzados */}
      <Card
        className="mb-4 shadow-sm"
        title={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-filter text-slate-500" />
            <span className="text-lg font-semibold">Filtros avanzados</span>
          </div>
        }
      >
        <div className="p-fluid grid">
          {/* Fila 1 */}
          <div className="col-12 md:col-3 mb-3">
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <Dropdown
              value={filtroTipo}
              options={FILTRO_TIPO}
              onChange={e => setFiltroTipo(e.value)}
              placeholder="Todos los tipos"
            />
          </div>
          <div className="col-12 md:col-3 mb-3">
            <label className="block text-sm font-medium mb-1">Estado</label>
            <Dropdown
              value={filtroEstado}
              options={FILTRO_ESTADO}
              onChange={e => setFiltroEstado(e.value)}
              placeholder="Todos los estados"
            />
          </div>
          <div className="col-12 md:col-3 mb-3">
            <label className="block text-sm font-medium mb-1">Prioridad</label>
            <Dropdown
              value={filtroPrioridad}
              options={FILTRO_PRIORIDAD}
              onChange={e => setFiltroPrioridad(e.value)}
              placeholder="Todas las prioridades"
            />
          </div>
          <div className="col-12 md:col-3 mb-3">
            <label className="block text-sm font-medium mb-1">Búsqueda</label>
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                type="search"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Buscar en historial..."
              />
            </IconField>
          </div>

          {/* Fila 2 */}
          <div className="col-12 md:col-4 mb-3">
            <label className="block text-sm font-medium mb-1">Fecha desde</label>
            <Calendar
              value={fechaDesde}
              onChange={e => setFechaDesde(e.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div className="col-12 md:col-4 mb-3">
            <label className="block text-sm font-medium mb-1">Fecha hasta</label>
            <Calendar
              value={fechaHasta}
              onChange={e => setFechaHasta(e.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              placeholder="DD/MM/AAAA"
            />
          </div>
          <div className="col-12 md:col-4 flex align-items-end mb-3">
            <Button
              label="Limpiar filtros"
              icon="pi pi-filter-slash"
              severity="secondary"
              onClick={handleLimpiarFiltros}
              className="w-full"
            />
          </div>
        </div>

        <Divider className="my-2" />

        <div className="text-sm text-slate-500 font-medium">
          Mostrando {mantenimientosVisibles.length} de {mantenimientos.length} registros |{' '}
          {selectedRows.length} seleccionados
        </div>
      </Card>

      {/* Toolbar */}
      <Toolbar className="mb-4" right={headerToolbarRight} />

      {/* Tabla */}
      <div className="card shadow-sm border-round bg-white dark:bg-slate-900">
        <DataTable
          ref={dtRef}
          value={mantenimientosVisibles}
          selection={selectedRows}
          onSelectionChange={e => setSelectedRows(e.value as MantenimientoHEP[])}
          selectionMode="multiple"
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No hay registros con los filtros aplicados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          filterDisplay="row"
          sortMode="multiple"
          tableStyle={{ minWidth: '140rem' }}
        >
          <Column selectionMode="multiple" style={{ width: '3rem' }} />
          <Column field="referencia" header="Referencia" sortable filter style={{ minWidth: '130px' }} />
          <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable filter style={{ minWidth: '130px' }} />
          <Column field="codigoActivo" header="Código activo" sortable filter style={{ minWidth: '130px' }} />
          <Column field="nombreActivo" header="Nombre activo" sortable filter style={{ minWidth: '160px' }} />
          <Column field="categoria" header="Categoría" sortable filter style={{ minWidth: '150px' }} />
          <Column field="ubicacion" header="Ubicación" sortable filter style={{ minWidth: '140px' }} />
          <Column field="responsableTecnico" header="Técnico responsable" sortable filter style={{ minWidth: '170px' }} />
          <Column field="prioridad" header="Prioridad" body={prioridadBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column
            field="fechaProgramada"
            header="F. Programada"
            body={row => formatDate(row.fechaProgramada)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column
            field="fechaInicio"
            header="F. Inicio"
            body={row => formatDate(row.fechaInicio)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column
            field="fechaCierre"
            header="F. Cierre"
            body={row => formatDate(row.fechaCierre)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column header="Acciones" body={actionsBodyTemplate} style={{ minWidth: '160px', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Dialog Detalle */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2 flex-wrap">
            <span>Detalle — {selectedItem?.referencia}</span>
            {selectedItem && (
              <Tag
                value={selectedItem.tipo}
                severity={selectedItem.tipo === 'Preventivo' ? 'info' : 'danger'}
              />
            )}
          </div>
        }
        visible={dialogDetalle}
        style={{ width: '700px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={detailDialogFooter}
      >
        {selectedItem && (
          <div className="p-fluid">
            {/* SECCIÓN Identificación */}
            <h5 className="text-slate-600 dark:text-slate-350 font-semibold mb-2">Identificación</h5>
            <div className="grid">
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Referencia
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.referencia}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tipo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.tipo}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estado
                </span>
                <Tag
                  value={selectedItem.estado}
                  severity={
                    selectedItem.estado === 'Programado'
                      ? 'warning'
                      : selectedItem.estado === 'En Proceso'
                      ? 'danger'
                      : 'success'
                  }
                  className="mt-1 w-max block"
                />
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Código activo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.codigoActivo}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nombre activo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.nombreActivo}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Categoría
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.categoria}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ubicación
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.ubicacion}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Custodio
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.responsableCustodia}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Prioridad
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.prioridad}
                </span>
              </div>
            </div>

            <Divider className="my-3" />

            {/* SECCIÓN Responsables y fechas */}
            <h5 className="text-slate-600 dark:text-slate-350 font-semibold mb-2">Responsables y fechas</h5>
            <div className="grid">
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Técnico responsable
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.responsableTecnico}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Creado por
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.creadoPor}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fecha registro
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDateTime(selectedItem.fechaRegistro)}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fecha programada
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDate(selectedItem.fechaProgramada)}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fecha inicio
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDate(selectedItem.fechaInicio)}
                </span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Fecha cierre
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDate(selectedItem.fechaCierre)}
                </span>
              </div>
            </div>

            <Divider className="my-3" />

            {/* SECCIÓN Trabajo realizado */}
            <h5 className="text-slate-600 dark:text-slate-350 font-semibold mb-2">Trabajo realizado</h5>
            <div className="grid">
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Descripción del trabajo
                </span>
                <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap bg-slate-50 dark:bg-slate-850 p-3 border-round border-1 border-slate-200 dark:border-slate-700 mt-1">
                  {selectedItem.descripcionTrabajo || '—'}
                </div>
              </div>
              {selectedItem.tipo === 'Correctivo' && (
                <div className="col-12 mb-3">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Diagnóstico
                  </span>
                  <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap bg-slate-50 dark:bg-slate-850 p-3 border-round border-1 border-slate-200 dark:border-slate-700 mt-1">
                    {selectedItem.diagnostico || '—'}
                  </div>
                </div>
              )}
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Repuestos utilizados
                </span>
                <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap bg-slate-50 dark:bg-slate-850 p-3 border-round border-1 border-slate-200 dark:border-slate-700 mt-1">
                  {selectedItem.repuestosUtilizados || '—'}
                </div>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Observaciones
                </span>
                <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap bg-slate-50 dark:bg-slate-850 p-3 border-round border-1 border-slate-200 dark:border-slate-700 mt-1">
                  {selectedItem.observaciones || '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default HistorialMantenimientos;
