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
import { Card } from 'primereact/card';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useActivos, Activo } from '../../context/ActivosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const CRITERIOS_REPORTE = [
  { label: 'General — todos los activos', value: 'general' },
  { label: 'Por Bien (nombre o código)', value: 'bien' },
  { label: 'Por Acta de entrega/recepción', value: 'acta' },
  { label: 'Por Responsable de recepción', value: 'responsable' },
  { label: 'Por Número de contrato', value: 'contrato' }
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

const ReporteActivos: React.FC = () => {
  const { activos } = useActivos();

  // Estados
  const [criterio, setCriterio] = useState<string>('general');
  const [valorBusqueda, setValorBusqueda] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Activo[]>([]);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Activo | null>(null);

  const toast = useRef<Toast>(null);

  // Computar Resultados
  const resultados = useMemo(() => {
    const list = activos || [];
    if (criterio === 'general') {
      return list;
    }

    const valor = valorBusqueda.trim().toLowerCase();
    if (!valor) {
      return [];
    }

    switch (criterio) {
      case 'bien':
        return list.filter(
          a =>
            (a.nombre || '').toLowerCase().includes(valor) ||
            (a.codigoInstitucional || '').toLowerCase().includes(valor)
        );
      case 'acta':
        return list.filter(a => (a.numeroActa || '').toLowerCase().includes(valor));
      case 'responsable':
        return list.filter(a => (a.responsableEntrega || '').toLowerCase().includes(valor));
      case 'contrato':
        return list.filter(a => (a.numeroContrato || '').toLowerCase().includes(valor));
      default:
        return [];
    }
  }, [activos, criterio, valorBusqueda]);

  const deberiaMostrarTabla = criterio === 'general' || valorBusqueda.trim() !== '';

  // Exportar Excel
  const buildRowsForExport = (data: Activo[]) => {
    return data.map(row => ({
      'Código': row.codigoInstitucional,
      'Nombre': row.nombre,
      'Categoría': row.categoriaActivo,
      'Marca': row.marca,
      'Modelo': row.modelo,
      'N° Serie': row.numeroSerie,
      'N° Acta': row.numeroActa || '—',
      'N° Contrato': row.numeroContrato || '—',
      'Responsable': row.responsableEntrega,
      'Ubicación': row.ubicacion,
      'Fecha Adquisición': formatDate(row.fechaAdquisicion),
      'Valor Adquisición': formatCurrency(row.valorAdquisicion),
      'Estado': row.estadoActivo
    }));
  };

  const exportarExcel = (data: Activo[], suffix: string = '') => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Activos');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `reporte_activos_HEP${suffix}_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Exportación completada',
      life: 3000
    });
  };

  // Exportar PDF
  const exportarPDF = (data: Activo[]) => {
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
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');
    const labelCriterio = CRITERIOS_REPORTE.find(c => c.value === criterio)?.label || criterio;

    // Encabezado
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Hospital de Especialidades Portoviejo — HEP', 14, 15);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Activos', 14, 22);

    doc.setFontSize(9);
    doc.text(`Criterio: ${labelCriterio}`, 14, 28);
    doc.text(`Generado: ${fecha} ${hora}`, 14, 33);
    doc.text(`Total de registros: ${data.length}`, 14, 38);

    const headers = [
      ['Código', 'Nombre', 'Categoría', 'N° Acta', 'N° Contrato', 'Responsable', 'Ubicación', 'F. Adquisición', 'Valor', 'Estado']
    ];

    const body = data.map(row => [
      row.codigoInstitucional,
      row.nombre,
      row.categoriaActivo,
      row.numeroActa || '—',
      row.numeroContrato || '—',
      row.responsableEntrega,
      row.ubicacion,
      formatDate(row.fechaAdquisicion),
      formatCurrency(row.valorAdquisicion),
      row.estadoActivo
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

    const fileDate = new Date().toISOString().split('T')[0];
    doc.save(`reporte_activos_HEP_${fileDate}.pdf`);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF generado correctamente',
      life: 3000
    });
  };

  const estadoBodyTemplate = (row: Activo) => {
    let severity: 'success' | 'secondary' | 'info' = 'info';
    if (row.estadoActivo === 'Activo') severity = 'success';
    else if (row.estadoActivo === 'Egresado') severity = 'secondary';
    return <Tag value={row.estadoActivo} severity={severity} />;
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Reporte de Activos
          </h1>
          <p className="text-slate-500 m-0">
            Generación de reportes institucionales según criterio de búsqueda — Hospital de Especialidades Portoviejo
          </p>
        </div>
        <div>
          <Tag value={`Total activos en sistema: ${activos ? activos.length : 0}`} severity="info" className="px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Card Criterios */}
      <Card className="mb-4 shadow-sm border-round">
        <div className="grid align-items-center">
          <div className="col-12 md:col-6">
            <label htmlFor="criterioDropdown" className="block text-sm font-semibold text-slate-700 mb-2">
              Seleccionar Criterio
            </label>
            <Dropdown
              id="criterioDropdown"
              value={criterio}
              options={CRITERIOS_REPORTE}
              onChange={e => {
                setCriterio(e.value);
                setValorBusqueda('');
                setSelectedRows([]);
              }}
              placeholder="Seleccione un criterio..."
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filtro de Búsqueda
            </label>
            {criterio !== 'general' ? (
              <InputText
                value={valorBusqueda}
                onChange={e => setValorBusqueda(e.target.value)}
                placeholder={
                  criterio === 'bien'
                    ? 'Ingrese nombre o código del bien...'
                    : criterio === 'acta'
                    ? 'Ingrese número de acta...'
                    : criterio === 'responsable'
                    ? 'Ingrese nombre del responsable...'
                    : criterio === 'contrato'
                    ? 'Ingrese número de contrato...'
                    : 'Ingrese valor a buscar...'
                }
                className="w-full"
              />
            ) : (
              <div className="p-3 border-round bg-blue-50 text-blue-700 border-left-3 border-blue-500 text-sm font-medium">
                Mostrando todos los activos registrados
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Toolbar Exportaciones */}
      {resultados.length > 0 && (
        <Toolbar
          className="mb-4"
          left={
            <div className="text-sm font-medium text-slate-700">
              Mostrando <span className="text-primary font-bold">{resultados.length}</span> resultados |{' '}
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

      {/* Tabla o Mensaje Informativo */}
      {deberiaMostrarTabla ? (
        <div className="card shadow-sm border-round bg-white p-3">
          <DataTable
            value={resultados}
            selection={selectedRows}
            onSelectionChange={e => setSelectedRows(e.value as Activo[])}
            selectionMode="multiple"
            dataKey="idActivo"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="No se encontraron activos con ese criterio"
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            sortMode="multiple"
          >
            <Column selectionMode="multiple" style={{ width: '3rem' }} />
            <Column field="codigoInstitucional" header="Código" sortable style={{ minWidth: '130px' }} />
            <Column field="nombre" header="Nombre" sortable style={{ minWidth: '160px' }} />
            <Column field="categoriaActivo" header="Categoría" sortable style={{ minWidth: '150px' }} />
            <Column
              field="numeroActa"
              header="N° Acta"
              body={(row: Activo) => row.numeroActa || '—'}
              sortable
              style={{ minWidth: '130px' }}
            />
            <Column
              field="numeroContrato"
              header="N° Contrato"
              body={(row: Activo) => row.numeroContrato || '—'}
              sortable
              style={{ minWidth: '130px' }}
            />
            <Column field="responsableEntrega" header="Responsable" sortable style={{ minWidth: '180px' }} />
            <Column field="ubicacion" header="Ubicación" sortable style={{ minWidth: '140px' }} />
            <Column
              field="fechaAdquisicion"
              header="Fecha adquisición"
              body={(row: Activo) => formatDate(row.fechaAdquisicion)}
              sortable
              style={{ minWidth: '150px' }}
            />
            <Column
              field="valorAdquisicion"
              header="Valor adquisición"
              body={(row: Activo) => formatCurrency(row.valorAdquisicion)}
              sortable
              style={{ minWidth: '150px' }}
            />
            <Column field="estadoActivo" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '120px' }} />
            <Column
              header="Acciones"
              body={(row: Activo) => (
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  tooltip="Ver ficha completa"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => {
                    setSelectedItem(row);
                    setDialogDetalle(true);
                  }}
                />
              )}
              style={{ minWidth: '100px', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      ) : (
        <Card className="shadow-sm border-round text-center py-6">
          <i className="pi pi-search text-slate-400 text-6xl block mb-3 text-center" />
          <p className="text-base text-slate-500 m-0 font-medium">
            Ingrese un criterio de búsqueda para generar el reporte.
          </p>
        </Card>
      )}

      {/* Dialog Detalle Ficha del Activo */}
      <Dialog
        header={selectedItem ? `${selectedItem.codigoInstitucional} — ${selectedItem.nombre}` : 'Ficha del Activo'}
        visible={dialogDetalle}
        style={{ width: '700px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={
          <div className="flex justify-end pt-2">
            <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
          </div>
        }
      >
        {selectedItem && (
          <div className="p-fluid grid">
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Código Institucional
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.codigoInstitucional}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nombre
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.nombre}</span>
            </div>
            <div className="col-12 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Descripción
              </span>
              <span className="text-sm font-medium text-slate-800 block whitespace-pre-wrap">{selectedItem.descripcion || '—'}</span>
            </div>

            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Marca
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.marca || '—'}</span>
            </div>
            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Modelo
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.modelo || '—'}</span>
            </div>
            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                N° Serie
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.numeroSerie || '—'}</span>
            </div>

            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Color
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.color || '—'}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Material
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.material || '—'}</span>
            </div>

            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Categoría
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.categoriaActivo || '—'}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Ubicación
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.ubicacion || '—'}</span>
            </div>

            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                N° Acta
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.numeroActa || '—'}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                N° Contrato
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.numeroContrato || '—'}</span>
            </div>

            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Item Presupuestario
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.itemPresupuestario || '—'}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Partida Presupuestaria
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.partidaPresupuestaria || '—'}</span>
            </div>

            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Responsable Entrega / Custodio
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.responsableEntrega || '—'}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Fecha Adquisición
              </span>
              <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaAdquisicion)}</span>
            </div>

            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Valor Adquisición
              </span>
              <span className="text-sm font-medium text-slate-800">{formatCurrency(selectedItem.valorAdquisicion)}</span>
            </div>
            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Valor Unitario
              </span>
              <span className="text-sm font-medium text-slate-800">{formatCurrency(selectedItem.valorUnitario)}</span>
            </div>
            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Valor Total
              </span>
              <span className="text-sm font-medium text-slate-800">{formatCurrency(selectedItem.valorTotal)}</span>
            </div>

            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Tiempo Vida Útil (Años)
              </span>
              <span className="text-sm font-medium text-slate-800">
                {selectedItem.tiempoVidaUtil !== null ? `${selectedItem.tiempoVidaUtil} años` : '—'}
              </span>
            </div>
            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Condición Depreciación
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.condicionDepreciacion || '—'}</span>
            </div>
            <div className="col-12 md:col-4 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Estado Activo
              </span>
              <Tag
                value={selectedItem.estadoActivo}
                severity={selectedItem.estadoActivo === 'Activo' ? 'success' : selectedItem.estadoActivo === 'Egresado' ? 'secondary' : 'info'}
                className="mt-1 w-max block"
              />
            </div>

            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Origen Ingreso
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.origenIngreso || '—'}</span>
            </div>
            <div className="col-12 md:col-6 mb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Motivo Ingreso
              </span>
              <span className="text-sm font-medium text-slate-800">{selectedItem.motivoIngreso || '—'}</span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReporteActivos;
