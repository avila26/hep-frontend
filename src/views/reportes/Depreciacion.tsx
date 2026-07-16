import React, { useState, useMemo, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { ProgressBar } from 'primereact/progressbar';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useActivos, Activo } from '../../context/ActivosContext';

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */
interface ActivoConDepreciacion extends Activo {
  esDepreciable: boolean;
  depreciacionAnual: number | null;
  aniosTranscurridos: number | null;
  depreciacionAcumulada: number | null;
  valorEnLibros: number | null;
  porcentajeDepreciado: number | null;
  totalmenteDepreciado: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const FILTRO_CATEGORIA_DEFAULT = { label: 'Todas las categorías', value: '' };

const FILTRO_ESTADO_DEPRECIACION = [
  { label: 'Todos', value: '' },
  { label: 'En depreciación', value: 'en_proceso' },
  { label: 'Totalmente depreciado', value: 'total' },
  { label: 'No depreciable', value: 'no_depreciable' }
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

/* ------------------------------------------------------------------ */
/*  Función de Formato de Moneda                                      */
/* ------------------------------------------------------------------ */
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/* ------------------------------------------------------------------ */
/*  Función calcularDepreciacion                                      */
/* ------------------------------------------------------------------ */
const calcularDepreciacion = (activo: Activo): ActivoConDepreciacion => {
  const hoy = new Date();
  const valorAdq = activo.valorAdquisicion;
  const vidaUtil = activo.tiempoVidaUtil;
  const fechaAdq = activo.fechaAdquisicion;

  const esDepreciable =
    valorAdq !== null &&
    valorAdq > 0 &&
    vidaUtil !== null &&
    vidaUtil > 0 &&
    fechaAdq !== null &&
    !isNaN(new Date(fechaAdq).getTime());

  if (!esDepreciable || valorAdq === null || vidaUtil === null || fechaAdq === null) {
    return {
      ...activo,
      esDepreciable: false,
      depreciacionAnual: null,
      aniosTranscurridos: null,
      depreciacionAcumulada: null,
      valorEnLibros: null,
      porcentajeDepreciado: null,
      totalmenteDepreciado: false
    };
  }

  const dateAdq = fechaAdq instanceof Date ? fechaAdq : new Date(fechaAdq);
  const diffTime = hoy.getTime() - dateAdq.getTime();
  const dias = diffTime > 0 ? diffTime / (1000 * 60 * 60 * 24) : 0;
  const aniosTranscurridos = dias / 365.25;

  const depreciacionAnual = valorAdq / vidaUtil;
  let depreciacionAcumulada = depreciacionAnual * aniosTranscurridos;
  let valorEnLibros = valorAdq - depreciacionAcumulada;
  let porcentajeDepreciado = (depreciacionAcumulada / valorAdq) * 100;
  let totalmenteDepreciado = false;

  if (aniosTranscurridos >= vidaUtil) {
    depreciacionAcumulada = valorAdq;
    valorEnLibros = 0;
    porcentajeDepreciado = 100;
    totalmenteDepreciado = true;
  } else {
    if (depreciacionAcumulada > valorAdq) {
      depreciacionAcumulada = valorAdq;
    }
    if (valorEnLibros < 0) {
      valorEnLibros = 0;
    }
    if (porcentajeDepreciado > 100) {
      porcentajeDepreciado = 100;
    }
  }

  return {
    ...activo,
    esDepreciable: true,
    depreciacionAnual,
    aniosTranscurridos,
    depreciacionAcumulada,
    valorEnLibros,
    porcentajeDepreciado,
    totalmenteDepreciado
  };
};

const ReporteDepreciacion: React.FC = () => {
  const { activos } = useActivos();

  // Estados
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroEstadoDepreciacion, setFiltroEstadoDepreciacion] = useState<string>('');
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<ActivoConDepreciacion[]>([]);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ActivoConDepreciacion | null>(null);
  const toast = useRef<Toast>(null);

  // Computar todos los activos con su depreciación
  const activosConDepreciacion = useMemo(() => {
    const list = activos || [];
    return list.map(calcularDepreciacion);
  }, [activos]);

  // Extraer categorías disponibles
  const categoriasDisponibles = useMemo(() => {
    const cats = Array.from(
      new Set(activosConDepreciacion.map(a => (a as any).categoriaActivo).filter(Boolean))
    );
    return [
      FILTRO_CATEGORIA_DEFAULT,
      ...cats.map(c => ({ label: c, value: c }))
    ];
  }, [activosConDepreciacion]);

  // Aplicar filtros
  const resultados = useMemo(() => {
    return activosConDepreciacion.filter(a => {
      // 1. Categoría
      if (filtroCategoria && (a as any).categoriaActivo !== filtroCategoria) {
        return false;
      }
      // 2. Estado Depreciación
      if (filtroEstadoDepreciacion) {
        if (filtroEstadoDepreciacion === 'en_proceso' && (!a.esDepreciable || a.totalmenteDepreciado)) {
          return false;
        }
        if (filtroEstadoDepreciacion === 'total' && (!a.esDepreciable || !a.totalmenteDepreciado)) {
          return false;
        }
        if (filtroEstadoDepreciacion === 'no_depreciable' && a.esDepreciable) {
          return false;
        }
      }
      // 3. Búsqueda global
      if (globalFilter) {
        const query = globalFilter.toLowerCase().trim();
        const cod = (a.codigoInstitucional || '').toLowerCase();
        const nom = (a.nombre || '').toLowerCase();
        const cat = ((a as any).categoriaActivo || '').toLowerCase();
        if (!cod.includes(query) && !nom.includes(query) && !cat.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [activosConDepreciacion, filtroCategoria, filtroEstadoDepreciacion, globalFilter]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalActivos = resultados.length;
    const depreciablesList = resultados.filter(a => a.esDepreciable);
    const depreciables = depreciablesList.length;
    const totalmenteDepreciados = resultados.filter(a => a.totalmenteDepreciado).length;

    let valorAdquisicionTotal = 0;
    let depreciacionAcumuladaTotal = 0;
    let valorEnLibrosTotal = 0;
    let sumaPorcentaje = 0;

    depreciablesList.forEach(a => {
      if (a.valorAdquisicion !== null) valorAdquisicionTotal += a.valorAdquisicion;
      if (a.depreciacionAcumulada !== null) depreciacionAcumuladaTotal += a.depreciacionAcumulada;
      if (a.valorEnLibros !== null) valorEnLibrosTotal += a.valorEnLibros;
      if (a.porcentajeDepreciado !== null) sumaPorcentaje += a.porcentajeDepreciado;
    });

    const porcentajePromedioDepreciado = depreciables > 0
      ? sumaPorcentaje / depreciables
      : 0;

    return {
      totalActivos,
      depreciables,
      totalmenteDepreciados,
      valorAdquisicionTotal,
      depreciacionAcumuladaTotal,
      valorEnLibrosTotal,
      porcentajePromedioDepreciado
    };
  }, [resultados]);

  // Exportar Excel
  const buildRowsForExport = (data: ActivoConDepreciacion[]) => {
    return data.map(row => ({
      'Código': row.codigoInstitucional,
      'Nombre': row.nombre,
      'Categoría': (row as any).categoriaActivo || 'Activo Fijo',
      'Fecha Adquisición': formatDate(row.fechaAdquisicion),
      'Valor Adquisición': formatCurrency(row.valorAdquisicion),
      'Vida Útil (años)': row.tiempoVidaUtil ?? '—',
      'Años Transcurridos': row.aniosTranscurridos !== null
        ? row.aniosTranscurridos.toFixed(1) : '—',
      'Depreciación Anual': formatCurrency(row.depreciacionAnual),
      'Depreciación Acumulada': formatCurrency(row.depreciacionAcumulada),
      'Valor en Libros': formatCurrency(row.valorEnLibros),
      '% Depreciado': row.porcentajeDepreciado !== null
        ? row.porcentajeDepreciado.toFixed(1) + '%' : '—',
      'Estado': !row.esDepreciable ? 'No depreciable' :
        row.totalmenteDepreciado ? 'Totalmente depreciado' :
        'En depreciación'
    }));
  };

  const exportarExcel = (data: ActivoConDepreciacion[], suffix: string = '') => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Depreciacion');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `reporte_depreciacion_HEP${suffix}_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Exportación completada',
      life: 3000
    });
  };

  // Exportar PDF
  const exportarPDF = (data: ActivoConDepreciacion[]) => {
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
    const fechaHoraStr = `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;

    // Encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Hospital de Especialidades Portoviejo — HEP', 14, 15);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Depreciación de Activos (Línea Recta)', 14, 22);

    doc.setFontSize(9);
    doc.text(`Generado: ${fechaHoraStr}`, 14, 28);
    doc.text(`Total de registros: ${data.length}`, 14, 33);
    doc.text(
      `Valor adquisición total: ${formatCurrency(estadisticas.valorAdquisicionTotal)} | ` +
      `Depreciación acumulada: ${formatCurrency(estadisticas.depreciacionAcumuladaTotal)} | ` +
      `Valor en libros: ${formatCurrency(estadisticas.valorEnLibrosTotal)}`,
      14,
      38
    );

    const headers = [
      [
        'Código',
        'Nombre',
        'Categoría',
        'F. Adquisición',
        'Valor Adq.',
        'Vida Útil',
        'Dep. Acumulada',
        'Valor en Libros',
        '% Dep.',
        'Estado'
      ]
    ];

    const body = data.map(row => [
      row.codigoInstitucional,
      row.nombre,
      (row as any).categoriaActivo || 'Activo Fijo',
      formatDate(row.fechaAdquisicion),
      formatCurrency(row.valorAdquisicion),
      row.tiempoVidaUtil ? `${row.tiempoVidaUtil} años` : '—',
      formatCurrency(row.depreciacionAcumulada),
      formatCurrency(row.valorEnLibros),
      row.porcentajeDepreciado !== null ? `${row.porcentajeDepreciado.toFixed(1)}%` : '—',
      !row.esDepreciable ? 'No depreciable' :
        row.totalmenteDepreciado ? 'Totalmente depreciado' : 'En depreciación'
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

    doc.save(`reporte_depreciacion_HEP_${fecha}.pdf`);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF generado correctamente',
      life: 3000
    });
  };

  // Templates de DataTable
  const porcentajeBodyTemplate = (rowData: ActivoConDepreciacion) => {
    if (!rowData.esDepreciable || rowData.porcentajeDepreciado === null) {
      return <span>—</span>;
    }
    const val = Math.round(rowData.porcentajeDepreciado);
    return (
      <div className="flex align-items-center gap-2" style={{ minWidth: '8rem' }}>
        <ProgressBar value={val} showValue={false} style={{ height: '8px', flex: 1 }} />
        <span className="text-xs font-semibold">{rowData.porcentajeDepreciado.toFixed(1)}%</span>
      </div>
    );
  };

  const estadoBodyTemplate = (rowData: ActivoConDepreciacion) => {
    if (!rowData.esDepreciable) {
      return <Tag value="No depreciable" severity="secondary" />;
    }
    if (rowData.totalmenteDepreciado) {
      return <Tag value="Totalmente depreciado" severity="danger" />;
    }
    return <Tag value="En depreciación" severity="warning" />;
  };

  const accionesBodyTemplate = (rowData: ActivoConDepreciacion) => {
    return (
      <Button
        icon="pi pi-eye"
        severity="info"
        rounded
        tooltip="Ver cálculo detallado"
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
            Reporte de Depreciación
          </h1>
          <p className="text-slate-500 m-0">
            Cálculo de depreciación por método de línea recta — Hospital de Especialidades Portoviejo
          </p>
        </div>
        <div>
          <Tag
            severity="info"
            icon="pi pi-info-circle"
            value="Método: Línea recta — Depreciación anual = Valor de adquisición / Vida útil (años)"
            className="px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* KPIs Grid Financiero Prominente */}
      <div className="grid mb-4">
        {/* Valor adquisición total */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-blue-50 text-blue-850 border-left-3 border-blue-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(estadisticas.valorAdquisicionTotal)}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Valor adquisición total
              </div>
            </div>
            <i className="pi pi-dollar text-3xl text-blue-400"></i>
          </div>
        </div>

        {/* Depreciación acumulada */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-orange-50 text-orange-850 border-left-3 border-orange-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(estadisticas.depreciacionAcumuladaTotal)}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                Depreciación acumulada
              </div>
            </div>
            <i className="pi pi-chart-line text-3xl text-orange-400"></i>
          </div>
        </div>

        {/* Valor en libros */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-green-50 text-green-850 border-left-3 border-green-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(estadisticas.valorEnLibrosTotal)}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-600">
                Valor en libros
              </div>
            </div>
            <i className="pi pi-wallet text-3xl text-green-400"></i>
          </div>
        </div>

        {/* % Promedio depreciado */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-purple-50 text-purple-805 border-left-3 border-purple-500 flex flex-column justify-content-between">
            <div className="flex justify-content-between align-items-center mb-2">
              <div>
                <div className="text-2xl font-bold mb-1">
                  {estadisticas.porcentajePromedioDepreciado.toFixed(1)}%
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                  % Promedio depreciado
                </div>
              </div>
              <i className="pi pi-percentage text-3xl text-purple-400"></i>
            </div>
            <ProgressBar
              value={Math.round(estadisticas.porcentajePromedioDepreciado)}
              showValue={false}
              style={{ height: '6px' }}
            />
          </div>
        </div>
      </div>

      {/* Card Filtros */}
      <Card className="mb-4 shadow-sm border-round">
        <div className="flex align-items-center gap-2 mb-3">
          <i className="pi pi-filter text-primary text-xl"></i>
          <span className="font-bold text-lg text-slate-800">Filtros</span>
        </div>

        <div className="grid">
          <div className="col-12 md:col-4">
            <label htmlFor="categoriaDropdown" className="block text-sm font-semibold text-slate-700 mb-2">
              Categoría
            </label>
            <Dropdown
              id="categoriaDropdown"
              value={filtroCategoria}
              options={categoriasDisponibles}
              onChange={e => {
                setFiltroCategoria(e.value);
                setSelectedRows([]);
              }}
              placeholder="Todas las categorías"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-4">
            <label htmlFor="estadoDropdown" className="block text-sm font-semibold text-slate-700 mb-2">
              Estado depreciación
            </label>
            <Dropdown
              id="estadoDropdown"
              value={filtroEstadoDepreciacion}
              options={FILTRO_ESTADO_DEPRECIACION}
              onChange={e => {
                setFiltroEstadoDepreciacion(e.value);
                setSelectedRows([]);
              }}
              placeholder="Todos"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-4">
            <label htmlFor="busquedaInput" className="block text-sm font-semibold text-slate-700 mb-2">
              Búsqueda
            </label>
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                id="busquedaInput"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Buscar código, nombre, categoría..."
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
              setFiltroCategoria('');
              setFiltroEstadoDepreciacion('');
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
              <span className="font-bold">{activos?.length || 0}</span> activos totales |{' '}
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

      {/* DataTable */}
      <div className="card shadow-sm border-round bg-white p-3">
        <DataTable
          value={resultados}
          selection={selectedRows}
          onSelectionChange={e => setSelectedRows(e.value as ActivoConDepreciacion[])}
          selectionMode="multiple"
          dataKey="idActivo"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          emptyMessage="No se encontraron activos con los filtros aplicados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
          tableStyle={{ minWidth: '120rem' }}
        >
          <Column selectionMode="multiple" style={{ width: '3rem' }} />
          <Column field="codigoInstitucional" header="Código" sortable style={{ minWidth: '10rem' }} />
          <Column field="nombre" header="Nombre" sortable style={{ minWidth: '15rem' }} />
          <Column field="categoriaActivo" header="Categoría" body={row => (row as any).categoriaActivo || 'Activo Fijo'} sortable style={{ minWidth: '12rem' }} />
          <Column
            field="fechaAdquisicion"
            header="Fecha adquisición"
            body={(row: ActivoConDepreciacion) => formatDate(row.fechaAdquisicion)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="valorAdquisicion"
            header="Valor adquisición"
            body={(row: ActivoConDepreciacion) => formatCurrency(row.valorAdquisicion)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="tiempoVidaUtil"
            header="Vida útil"
            body={(row: ActivoConDepreciacion) => row.tiempoVidaUtil ? `${row.tiempoVidaUtil} años` : '—'}
            sortable
            style={{ minWidth: '10rem' }}
          />
          <Column
            field="depreciacionAcumulada"
            header="Depreciación acumulada"
            body={(row: ActivoConDepreciacion) => formatCurrency(row.depreciacionAcumulada)}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column
            field="valorEnLibros"
            header="Valor en libros"
            body={(row: ActivoConDepreciacion) => formatCurrency(row.valorEnLibros)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="porcentajeDepreciado"
            header="% Depreciado"
            body={porcentajeBodyTemplate}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column
            field="esDepreciable"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
            style={{ minWidth: '12rem' }}
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
        header={selectedItem ? `${selectedItem.codigoInstitucional} — ${selectedItem.nombre}` : 'Cálculo Detallado de Depreciación'}
        visible={dialogDetalle}
        style={{ width: '650px' }}
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
            {/* SECCIÓN Datos base */}
            <span className="font-bold text-base text-slate-700 block mb-3">Datos base</span>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Valor de adquisición</span>
                <span className="text-sm font-medium text-slate-800">{formatCurrency(selectedItem.valorAdquisicion)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha de adquisición</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaAdquisicion)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vida útil (años)</span>
                <span className="text-sm font-medium text-slate-800">
                  {selectedItem.tiempoVidaUtil ? `${selectedItem.tiempoVidaUtil} años` : '—'}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Años transcurridos</span>
                <span className="text-sm font-medium text-slate-800">
                  {selectedItem.aniosTranscurridos !== null ? `${selectedItem.aniosTranscurridos.toFixed(4)}` : '—'}
                </span>
              </div>
            </div>

            <Divider />

            {/* SECCIÓN Cálculo línea recta */}
            {selectedItem.esDepreciable ? (
              <>
                <span className="font-bold text-base text-slate-700 block mb-3">Cálculo línea recta</span>
                <div className="bg-slate-50 border-1 border-slate-200 border-round p-3 mb-3">
                  <div className="mb-3">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Depreciación anual = Valor adquisición / Vida útil
                    </span>
                    <div className="flex justify-content-between align-items-center">
                      <span className="text-sm text-slate-600">
                        {formatCurrency(selectedItem.valorAdquisicion)} / {selectedItem.tiempoVidaUtil} años
                      </span>
                      <span className="font-bold text-slate-800 font-monospace" style={{ fontFamily: 'monospace' }}>
                        {formatCurrency(selectedItem.depreciacionAnual)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Depreciación acumulada = Depreciación anual × Años transcurridos
                    </span>
                    <div className="flex justify-content-between align-items-center">
                      <span className="text-sm text-slate-600">
                        {formatCurrency(selectedItem.depreciacionAnual)} × {selectedItem.aniosTranscurridos?.toFixed(2)}
                      </span>
                      <span className="font-bold text-slate-800 font-monospace" style={{ fontFamily: 'monospace' }}>
                        {formatCurrency(selectedItem.depreciacionAcumulada)}
                      </span>
                    </div>
                    {selectedItem.totalmenteDepreciado && (
                      <span className="block text-xs text-amber-600 mt-1">
                        * Acumulado topado al valor de adquisición (100% depreciado).
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Valor en libros = Valor adquisición − Depreciación acumulada
                    </span>
                    <div className="flex justify-content-between align-items-center">
                      <span className="text-sm text-slate-600">
                        {formatCurrency(selectedItem.valorAdquisicion)} − {formatCurrency(selectedItem.depreciacionAcumulada)}
                      </span>
                      <span className="font-bold text-success text-base font-monospace" style={{ fontFamily: 'monospace' }}>
                        {formatCurrency(selectedItem.valorEnLibros)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Porcentaje depreciado</span>
                  <ProgressBar
                    value={Math.round(selectedItem.porcentajeDepreciado || 0)}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <div className="p-3 border-round bg-blue-50 text-blue-700 border-left-3 border-blue-500 flex align-items-center gap-2 mb-3">
                <i className="pi pi-info-circle text-xl"></i>
                <span className="text-sm font-medium">
                  Este activo no cuenta con datos suficientes (valor de adquisición o vida útil) para calcular su depreciación.
                </span>
              </div>
            )}

            {selectedItem.totalmenteDepreciado && (
              <div className="mt-2">
                <Tag
                  severity="danger"
                  value={`Activo totalmente depreciado — valor en libros: ${formatCurrency(0)}`}
                  className="w-full text-sm py-2 font-semibold"
                />
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReporteDepreciacion;
