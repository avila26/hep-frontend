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
import { useMantenimientosContext, MantenimientoHEP } from '../../context/MantenimientosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const FILTRO_TIPO = [
  { label: 'Todos los tipos', value: '' },
  { label: 'Preventivo', value: 'Preventivo' },
  { label: 'Correctivo', value: 'Correctivo' }
];

const FILTRO_ESTADO = [
  { label: 'Todos los estados', value: '' },
  { label: 'Programado', value: 'Programado' },
  { label: 'En Proceso', value: 'En Proceso' },
  { label: 'Cerrado', value: 'Cerrado' }
];

const FILTRO_PRIORIDAD = [
  { label: 'Todas las prioridades', value: '' },
  { label: 'Alta', value: 'Alta' },
  { label: 'Media', value: 'Media' },
  { label: 'Baja', value: 'Baja' }
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

const ReporteMantenimientos: React.FC = () => {
  const { mantenimientos } = useMantenimientosContext();

  // Estados
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<MantenimientoHEP[]>([]);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MantenimientoHEP | null>(null);
  const toast = useRef<Toast>(null);

  // Computar resultados filtrados
  const resultados = useMemo(() => {
    const list = mantenimientos || [];
    return list.filter(m => {
      // 1. Tipo
      if (filtroTipo && m.tipo !== filtroTipo) {
        return false;
      }
      // 2. Estado
      if (filtroEstado && m.estado !== filtroEstado) {
        return false;
      }
      // 3. Prioridad
      if (filtroPrioridad && m.prioridad !== filtroPrioridad) {
        return false;
      }
      // 4. Fecha Desde
      if (fechaDesde) {
        if (!m.fechaProgramada) return false;
        const parts = m.fechaProgramada.split('-');
        const dateProgramada = new Date(
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
        if (dateProgramada < limitDesde) {
          return false;
        }
      }
      // 5. Fecha Hasta
      if (fechaHasta) {
        if (!m.fechaProgramada) return false;
        const parts = m.fechaProgramada.split('-');
        const dateProgramada = new Date(
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
        if (dateProgramada > limitHasta) {
          return false;
        }
      }
      // 6. Búsqueda global
      if (globalFilter) {
        const query = globalFilter.toLowerCase().trim();
        const ref = (m.referencia || '').toLowerCase();
        const cod = (m.codigoActivo || '').toLowerCase();
        const nom = (m.nombreActivo || '').toLowerCase();
        const cat = (m.categoria || '').toLowerCase();
        const ubi = (m.ubicacion || '').toLowerCase();
        const res = (m.responsableTecnico || '').toLowerCase();
        const dia = (m.diagnostico || '').toLowerCase();

        if (
          !ref.includes(query) &&
          !cod.includes(query) &&
          !nom.includes(query) &&
          !cat.includes(query) &&
          !ubi.includes(query) &&
          !res.includes(query) &&
          !dia.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [mantenimientos, filtroTipo, filtroEstado, filtroPrioridad, fechaDesde, fechaHasta, globalFilter]);

  // Computar estadísticas
  const estadisticas = useMemo(() => {
    const total = resultados.length;
    const preventivos = resultados.filter(m => m.tipo === 'Preventivo').length;
    const correctivos = resultados.filter(m => m.tipo === 'Correctivo').length;
    const programados = resultados.filter(m => m.estado === 'Programado').length;
    const enProceso = resultados.filter(m => m.estado === 'En Proceso').length;
    const cerrados = resultados.filter(m => m.estado === 'Cerrado').length;
    const prioridadAlta = resultados.filter(m => m.prioridad === 'Alta').length;
    const tasaCierre = total > 0
      ? Math.round((cerrados / total) * 100)
      : 0;

    return {
      total,
      preventivos,
      correctivos,
      programados,
      enProceso,
      cerrados,
      prioridadAlta,
      tasaCierre
    };
  }, [resultados]);

  // Exportar Excel
  const buildRowsForExport = (data: MantenimientoHEP[]) => {
    return data.map(row => ({
      'Referencia': row.referencia,
      'Tipo': row.tipo,
      'Código Activo': row.codigoActivo,
      'Nombre Activo': row.nombreActivo,
      'Categoría': row.categoria,
      'Ubicación': row.ubicacion,
      'Técnico Responsable': row.responsableTecnico,
      'Diagnóstico': row.diagnostico || '—',
      'Prioridad': row.prioridad,
      'Estado': row.estado,
      'Fecha Programada': formatDate(row.fechaProgramada),
      'Fecha Inicio': formatDate(row.fechaInicio),
      'Fecha Cierre': formatDate(row.fechaCierre),
      'Descripción Trabajo': row.descripcionTrabajo,
      'Repuestos Utilizados': row.repuestosUtilizados || '—',
      'Observaciones': row.observaciones || '—',
      'Creado Por': row.creadoPor
    }));
  };

  const exportarExcel = (data: MantenimientoHEP[], suffix: string = '') => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `reporte_mantenimientos_HEP${suffix}_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Exportación completada',
      life: 3000
    });
  };

  // Exportar PDF
  const exportarPDF = (data: MantenimientoHEP[]) => {
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
    doc.text('Reporte de Mantenimientos', 14, 22);

    doc.setFontSize(9);
    doc.text(`Generado: ${fechaHoraActual}`, 14, 28);
    doc.text(`Total de registros: ${data.length}`, 14, 33);
    doc.text(
      `Resumen: ${estadisticas.preventivos} Preventivos, ${estadisticas.correctivos} Correctivos | Tasa de cierre: ${estadisticas.tasaCierre}%`,
      14,
      38
    );

    const headers = [
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
    ];

    const body = data.map(row => [
      row.referencia,
      row.tipo,
      `${row.codigoActivo} - ${row.nombreActivo}`,
      row.ubicacion,
      row.responsableTecnico,
      row.prioridad,
      row.estado,
      formatDate(row.fechaProgramada),
      formatDate(row.fechaInicio),
      formatDate(row.fechaCierre)
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

    doc.save(`reporte_mantenimientos_HEP_${fecha}.pdf`);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF generado correctamente',
      life: 3000
    });
  };

  // Plantillas de columnas
  const tipoBodyTemplate = (rowData: MantenimientoHEP) => {
    const severity = rowData.tipo === 'Preventivo' ? 'info' : 'danger';
    return <Tag value={rowData.tipo} severity={severity} />;
  };

  const prioridadBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'danger' | 'warning' | 'success' = 'success';
    if (rowData.prioridad === 'Alta') severity = 'danger';
    else if (rowData.prioridad === 'Media') severity = 'warning';
    return <Tag value={rowData.prioridad} severity={severity} />;
  };

  const estadoBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'warning' | 'info' | 'success' = 'warning';
    if (rowData.estado === 'En Proceso') severity = 'info';
    else if (rowData.estado === 'Cerrado') severity = 'success';
    return <Tag value={rowData.estado} severity={severity} />;
  };

  const accionesBodyTemplate = (rowData: MantenimientoHEP) => {
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
            Reporte de Mantenimientos
          </h1>
          <p className="text-slate-500 m-0">
            Estadísticas y reportes de mantenimientos preventivos y correctivos — Hospital de Especialidades Portoviejo
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid mb-4">
        {/* Total */}
        <div className="col-12 md:col-4 lg:col-2">
          <div className="card shadow-sm border-round p-3 bg-blue-50 text-blue-800 border-left-3 border-blue-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.total}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total</div>
            </div>
            <i className="pi pi-list text-3xl text-blue-400"></i>
          </div>
        </div>

        {/* Preventivos */}
        <div className="col-12 md:col-4 lg:col-2">
          <div className="card shadow-sm border-round p-3 bg-green-50 text-green-800 border-left-3 border-green-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.preventivos}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-600">Preventivos</div>
            </div>
            <i className="pi pi-calendar text-3xl text-green-400"></i>
          </div>
        </div>

        {/* Correctivos */}
        <div className="col-12 md:col-4 lg:col-2">
          <div className="card shadow-sm border-round p-3 bg-red-50 text-red-800 border-left-3 border-red-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.correctivos}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-600">Correctivos</div>
            </div>
            <i className="pi pi-exclamation-triangle text-3xl text-red-400"></i>
          </div>
        </div>

        {/* En Proceso */}
        <div className="col-12 md:col-4 lg:col-2">
          <div className="card shadow-sm border-round p-3 bg-orange-50 text-orange-800 border-left-3 border-orange-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.enProceso}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-orange-600">En Proceso</div>
            </div>
            <i className="pi pi-wrench text-3xl text-orange-400"></i>
          </div>
        </div>

        {/* Cerrados */}
        <div className="col-12 md:col-4 lg:col-2">
          <div className="card shadow-sm border-round p-3 bg-teal-50 text-teal-900 border-left-3 border-teal-600 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.cerrados}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">Cerrados</div>
            </div>
            <i className="pi pi-check-circle text-3xl text-teal-500"></i>
          </div>
        </div>

        {/* Tasa de Cierre */}
        <div className="col-12 md:col-4 lg:col-2">
          <div className="card shadow-sm border-round p-3 bg-purple-50 text-purple-800 border-left-3 border-purple-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.tasaCierre}%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">Tasa de cierre</div>
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

        {/* Fila 1 */}
        <div className="grid mb-3">
          <div className="col-12 md:col-3">
            <label htmlFor="tipoDropdown" className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo
            </label>
            <Dropdown
              id="tipoDropdown"
              value={filtroTipo}
              options={FILTRO_TIPO}
              onChange={e => {
                setFiltroTipo(e.value);
                setSelectedRows([]);
              }}
              placeholder="Todos los tipos"
              className="w-full"
            />
          </div>
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
            <label htmlFor="prioridadDropdown" className="block text-sm font-semibold text-slate-700 mb-2">
              Prioridad
            </label>
            <Dropdown
              id="prioridadDropdown"
              value={filtroPrioridad}
              options={FILTRO_PRIORIDAD}
              onChange={e => {
                setFiltroPrioridad(e.value);
                setSelectedRows([]);
              }}
              placeholder="Todas las prioridades"
              className="w-full"
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
                placeholder="Buscar referencia, activo, técnico..."
                className="w-full"
              />
            </IconField>
          </div>
        </div>

        {/* Fila 2 */}
        <div className="grid align-items-end">
          <div className="col-12 md:col-4">
            <label htmlFor="fechaDesde" className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha desde
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
          <div className="col-12 md:col-4">
            <label htmlFor="fechaHasta" className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha hasta
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
          <div className="col-12 md:col-4 flex gap-2">
            <Button
              label="Limpiar filtros"
              icon="pi pi-filter-slash"
              severity="secondary"
              onClick={() => {
                setFiltroTipo('');
                setFiltroEstado('');
                setFiltroPrioridad('');
                setFechaDesde(null);
                setFechaHasta(null);
                setGlobalFilter('');
                setSelectedRows([]);
              }}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Toolbar Exportaciones */}
      {resultados.length > 0 && (
        <Toolbar
          className="mb-4"
          left={
            <div className="text-sm font-medium text-slate-700">
              Mostrando <span className="text-primary font-bold">{resultados.length}</span> de{' '}
              <span className="font-bold">{mantenimientos?.length || 0}</span> registros totales |{' '}
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
          onSelectionChange={e => setSelectedRows(e.value as MantenimientoHEP[])}
          selectionMode="multiple"
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No se encontraron mantenimientos con los filtros aplicados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
          tableStyle={{ minWidth: '110rem' }}
        >
          <Column selectionMode="multiple" style={{ width: '3rem' }} />
          <Column field="referencia" header="Referencia" sortable style={{ minWidth: '10rem' }} />
          <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column field="codigoActivo" header="Código activo" sortable style={{ minWidth: '10rem' }} />
          <Column field="nombreActivo" header="Nombre activo" sortable style={{ minWidth: '15rem' }} />
          <Column field="ubicacion" header="Ubicación" sortable style={{ minWidth: '12rem' }} />
          <Column field="responsableTecnico" header="Técnico responsable" sortable style={{ minWidth: '15rem' }} />
          <Column field="prioridad" header="Prioridad" body={prioridadBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column
            field="fechaProgramada"
            header="Fecha programada"
            body={(row: MantenimientoHEP) => formatDate(row.fechaProgramada)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="fechaCierre"
            header="Fecha cierre"
            body={(row: MantenimientoHEP) => formatDate(row.fechaCierre)}
            sortable
            style={{ minWidth: '10rem' }}
          />
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
              <Tag value={selectedItem.tipo} severity={selectedItem.tipo === 'Preventivo' ? 'info' : 'danger'} />
            </div>
          ) : (
            'Detalle del Mantenimiento'
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
            <span className="font-bold text-base text-slate-700 block mb-3">Identificación</span>
            <div className="grid">
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Referencia</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.referencia}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tipo</span>
                <Tag value={selectedItem.tipo} severity={selectedItem.tipo === 'Preventivo' ? 'info' : 'danger'} className="mt-1 w-max block" />
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Estado</span>
                <Tag
                  value={selectedItem.estado}
                  severity={selectedItem.estado === 'Programado' ? 'warning' : selectedItem.estado === 'En Proceso' ? 'info' : 'success'}
                  className="mt-1 w-max block"
                />
              </div>

              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Código activo</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.codigoActivo}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre activo</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.nombreActivo}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Categoría</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.categoria}</span>
              </div>

              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ubicación</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.ubicacion}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Técnico responsable</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.responsableTecnico}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Prioridad</span>
                <Tag
                  value={selectedItem.prioridad}
                  severity={selectedItem.prioridad === 'Alta' ? 'danger' : selectedItem.prioridad === 'Media' ? 'warning' : 'success'}
                  className="mt-1 w-max block"
                />
              </div>
            </div>

            <Divider />

            {/* SECCIÓN fechas */}
            <span className="font-bold text-base text-slate-700 block mb-3">Fechas</span>
            <div className="grid">
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha programada</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaProgramada)}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha inicio</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaInicio)}</span>
              </div>
              <div className="col-12 md:col-4 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha cierre</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaCierre)}</span>
              </div>
            </div>

            <Divider />

            {/* SECCIÓN trabajo */}
            <span className="font-bold text-base text-slate-700 block mb-3">Detalle del Trabajo</span>
            <div className="grid">
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción del trabajo</span>
                <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.descripcionTrabajo || '—'}</span>
              </div>

              {selectedItem.tipo === 'Correctivo' && (
                <div className="col-12 mb-3">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diagnóstico</span>
                  <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.diagnostico || '—'}</span>
                </div>
              )}

              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Repuestos utilizados</span>
                <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.repuestosUtilizados || '—'}</span>
              </div>

              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Observaciones</span>
                <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.observaciones || '—'}</span>
              </div>

              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Creado por</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.creadoPor || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReporteMantenimientos;
