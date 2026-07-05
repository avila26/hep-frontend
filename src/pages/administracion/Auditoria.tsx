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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAdministracionContext, EventoAuditoria } from '../../context/AdministracionContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const FILTRO_MODULO = [
  { label: 'Todos los módulos', value: '' },
  { label: 'Activos', value: 'Activos' },
  { label: 'Traslados', value: 'Traslados' },
  { label: 'Mantenimientos', value: 'Mantenimientos' },
  { label: 'Bajas', value: 'Bajas' },
  { label: 'Reportes', value: 'Reportes' },
  { label: 'Administracion', value: 'Administracion' },
  { label: 'Autenticación', value: 'Autenticación' }
];

const FILTRO_RESULTADO = [
  { label: 'Todos', value: '' },
  { label: 'Exitoso', value: 'Exitoso' },
  { label: 'Fallido', value: 'Fallido' }
];

/* ------------------------------------------------------------------ */
/*  Funciones Auxiliares                                              */
/* ------------------------------------------------------------------ */
const formatDateTime = (date: string | undefined): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const fecha = `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const hora = `${String(d.getHours()).padStart(2, '0')}:${
    String(d.getMinutes()).padStart(2, '0')}`;
  return `${fecha} ${hora}`;
};

const Auditoria: React.FC = () => {
  const { eventosAuditoria } = useAdministracionContext();

  // Estados del componente
  const [filtroModulo, setFiltroModulo] = useState<string>('');
  const [filtroResultado, setFiltroResultado] = useState<string>('');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<EventoAuditoria | null>(null);
  const toast = useRef<Toast>(null);

  // Extraer usuarios únicos para el dropdown
  const usuariosUnicos = useMemo(() => {
    const list = eventosAuditoria || [];
    const users = Array.from(new Set(list.map(e => e.usuario).filter(Boolean)));
    return [
      { label: 'Todos los usuarios', value: '' },
      ...users.map(u => ({ label: u, value: u }))
    ];
  }, [eventosAuditoria]);

  // Filtrado de eventos
  const resultados = useMemo(() => {
    let list = eventosAuditoria || [];

    return list.filter(e => {
      // 1. Módulo
      if (filtroModulo && e.modulo !== filtroModulo) {
        return false;
      }
      // 2. Resultado
      if (filtroResultado && e.resultado !== filtroResultado) {
        return false;
      }
      // 3. Usuario
      if (filtroUsuario && e.usuario !== filtroUsuario) {
        return false;
      }
      // 4. Fecha Desde
      if (fechaDesde) {
        const eDate = new Date(e.fecha);
        const limitDesde = new Date(fechaDesde);
        limitDesde.setHours(0, 0, 0, 0);
        if (eDate < limitDesde) return false;
      }
      // 5. Fecha Hasta
      if (fechaHasta) {
        const eDate = new Date(e.fecha);
        const limitHasta = new Date(fechaHasta);
        limitHasta.setHours(23, 59, 59, 999);
        if (eDate > limitHasta) return false;
      }
      // 6. Búsqueda global
      if (globalFilter) {
        const query = globalFilter.toLowerCase().trim();
        const user = (e.usuario || '').toLowerCase();
        const action = (e.accion || '').toLowerCase();
        const mod = (e.modulo || '').toLowerCase();
        const detail = (e.detalle || '').toLowerCase();
        const ip = (e.ipOrigen || '').toLowerCase();

        if (
          !user.includes(query) &&
          !action.includes(query) &&
          !mod.includes(query) &&
          !detail.includes(query) &&
          !ip.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [eventosAuditoria, filtroModulo, filtroResultado, filtroUsuario, fechaDesde, fechaHasta, globalFilter]);

  // Estadísticas calculadas en base a resultados
  const estadisticas = useMemo(() => {
    const total = resultados.length;
    const exitosos = resultados.filter(e => e.resultado === 'Exitoso').length;
    const fallidos = resultados.filter(e => e.resultado === 'Fallido').length;
    const usuariosActivos = new Set(resultados.map(e => e.usuario).filter(Boolean)).size;

    return {
      total,
      exitosos,
      fallidos,
      usuariosActivos
    };
  }, [resultados]);

  // Exportar Excel
  const buildRowsForExport = (data: EventoAuditoria[]) => {
    return data.map(row => ({
      'Fecha y Hora': formatDateTime(row.fecha),
      'Usuario': row.usuario,
      'Rol': row.rol,
      'Acción': row.accion,
      'Módulo': row.modulo,
      'Detalle': row.detalle,
      'IP Origen': row.ipOrigen,
      'Resultado': row.resultado
    }));
  };

  const exportarExcel = (data: EventoAuditoria[]) => {
    if (data.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay eventos para exportar',
        life: 3000
      });
      return;
    }
    const rows = buildRowsForExport(data);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `auditoria_HEP_${fecha}.xlsx`);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Exportación completada',
      life: 3000
    });
  };

  // Exportar PDF
  const exportarPDF = (data: EventoAuditoria[]) => {
    if (data.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay eventos para exportar',
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
    doc.text('Registro de Auditoría del Sistema', 14, 22);

    doc.setFontSize(9);
    doc.text(`Generado: ${fechaHoraActual}`, 14, 28);
    doc.text(`Total de eventos: ${data.length} | Exitosos: ${estadisticas.exitosos} | Fallidos: ${estadisticas.fallidos}`, 14, 33);

    const headers = [
      ['Fecha/Hora', 'Usuario', 'Rol', 'Acción', 'Módulo', 'Detalle', 'IP', 'Resultado']
    ];

    const body = data.map(row => [
      formatDateTime(row.fecha),
      row.usuario,
      row.rol,
      row.accion,
      row.modulo,
      row.detalle,
      row.ipOrigen,
      row.resultado
    ]);

    autoTable(doc, {
      startY: 38,
      head: headers,
      body: body,
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (dataCell) => {
        if (dataCell.row.raw && (dataCell.row.raw as any)[7] === 'Fallido') {
          if (dataCell.column.index === 7) {
            dataCell.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
      didDrawPage: (dataPage) => {
        const str = `Página ${dataPage.pageNumber}`;
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.text(str, pageWidth - 30, pageHeight - 10);
      }
    });

    doc.save(`auditoria_HEP_${fecha}.pdf`);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'PDF generado correctamente',
      life: 3000
    });
  };

  // Templates de DataTable
  const rolBodyTemplate = (rowData: EventoAuditoria) => {
    let severity: 'danger' | 'success' | 'warning' | 'info' = 'info';
    const rName = rowData.rol;

    if (rName === 'TICs' || rName === 'Administrador') {
      severity = 'danger';
    } else if (rName === 'Activo Fijo') {
      severity = 'success';
    } else if (rName === 'Mantenimiento') {
      severity = 'warning';
    }

    return <Tag value={rName} severity={severity} />;
  };

  const resultadoBodyTemplate = (rowData: EventoAuditoria) => {
    const severity = rowData.resultado === 'Exitoso' ? 'success' : 'danger';
    return <Tag value={rowData.resultado} severity={severity} />;
  };

  const accionesBodyTemplate = (rowData: EventoAuditoria) => {
    return (
      <Button
        icon="pi pi-eye"
        severity="info"
        rounded
        tooltip="Ver detalle completo"
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
            Auditoría del Sistema
          </h1>
          <p className="text-slate-500 m-0">
            Registro de accesos y acciones realizadas por los usuarios — Hospital de Especialidades Portoviejo
          </p>
        </div>
        <div>
          <Tag
            severity="secondary"
            icon="pi pi-shield"
            value="Vista de solo lectura — Los registros de auditoría no pueden modificarse ni eliminarse"
            className="px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid mb-4">
        {/* Total de eventos */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-blue-50 text-blue-800 border-left-3 border-blue-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.total}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total de eventos</div>
            </div>
            <i className="pi pi-list text-3xl text-blue-400"></i>
          </div>
        </div>

        {/* Accesos exitosos */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-green-50 text-green-800 border-left-3 border-green-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.exitosos}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-600">Accesos exitosos</div>
            </div>
            <i className="pi pi-check-circle text-3xl text-green-400"></i>
          </div>
        </div>

        {/* Eventos fallidos */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-red-50 text-red-800 border-left-3 border-red-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.fallidos}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-red-600">Eventos fallidos</div>
            </div>
            <i className="pi pi-times-circle text-3xl text-red-400"></i>
          </div>
        </div>

        {/* Usuarios con actividad */}
        <div className="col-12 md:col-3">
          <div className="card shadow-sm border-round p-3 bg-purple-50 text-purple-800 border-left-3 border-purple-500 flex justify-content-between align-items-center">
            <div>
              <div className="text-2xl font-bold mb-1">{estadisticas.usuariosActivos}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">Usuarios con actividad</div>
            </div>
            <i className="pi pi-users text-3xl text-purple-400"></i>
          </div>
        </div>
      </div>

      {/* Card Filtros avanzados */}
      <Card className="mb-4 shadow-sm border-round">
        <div className="flex align-items-center gap-2 mb-3">
          <i className="pi pi-filter text-primary text-xl"></i>
          <span className="font-bold text-lg text-slate-800">Filtros avanzados</span>
        </div>

        {/* Fila 1 */}
        <div className="grid mb-3">
          <div className="col-12 md:col-3">
            <label htmlFor="moduloDropdown" className="block text-sm font-semibold text-slate-700 mb-2">Módulo</label>
            <Dropdown
              id="moduloDropdown"
              value={filtroModulo}
              options={FILTRO_MODULO}
              onChange={e => setFiltroModulo(e.value)}
              placeholder="Todos los módulos"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-3">
            <label htmlFor="resultadoDropdown" className="block text-sm font-semibold text-slate-700 mb-2">Resultado</label>
            <Dropdown
              id="resultadoDropdown"
              value={filtroResultado}
              options={FILTRO_RESULTADO}
              onChange={e => setFiltroResultado(e.value)}
              placeholder="Todos"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-3">
            <label htmlFor="usuarioDropdown" className="block text-sm font-semibold text-slate-700 mb-2">Usuario</label>
            <Dropdown
              id="usuarioDropdown"
              value={filtroUsuario}
              options={usuariosUnicos}
              onChange={e => setFiltroUsuario(e.value)}
              placeholder="Todos los usuarios"
              className="w-full"
            />
          </div>
          <div className="col-12 md:col-3">
            <label htmlFor="busquedaInput" className="block text-sm font-semibold text-slate-700 mb-2">Búsqueda</label>
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                id="busquedaInput"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Buscar usuario, acción..."
                className="w-full"
              />
            </IconField>
          </div>
        </div>

        {/* Fila 2 */}
        <div className="grid align-items-end">
          <div className="col-12 md:col-4">
            <label htmlFor="fechaDesde" className="block text-sm font-semibold text-slate-700 mb-2">Fecha desde</label>
            <Calendar
              id="fechaDesde"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.value as Date | null)}
              dateFormat="dd/mm/yy"
              showIcon
              className="w-full"
              placeholder="Seleccionar fecha"
            />
          </div>
          <div className="col-12 md:col-4">
            <label htmlFor="fechaHasta" className="block text-sm font-semibold text-slate-700 mb-2">Fecha hasta</label>
            <Calendar
              id="fechaHasta"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.value as Date | null)}
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
                setFiltroModulo('');
                setFiltroResultado('');
                setFiltroUsuario('');
                setFechaDesde(null);
                setFechaHasta(null);
                setGlobalFilter('');
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
              <span className="font-bold">{eventosAuditoria?.length || 0}</span> eventos totales
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
          dataKey="id"
          paginator
          rows={15}
          rowsPerPageOptions={[10, 15, 25, 50]}
          emptyMessage="No se encontraron eventos con los filtros aplicados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
          defaultSortOrder={-1}
          sortField="fecha"
        >
          <Column
            field="fecha"
            header="Fecha y hora"
            body={(row: EventoAuditoria) => formatDateTime(row.fecha)}
            sortable
            style={{ minWidth: '13rem' }}
          />
          <Column field="usuario" header="Usuario" sortable style={{ minWidth: '15rem' }} />
          <Column field="rol" header="Rol" body={rolBodyTemplate} sortable style={{ minWidth: '12rem' }} />
          <Column field="accion" header="Acción" sortable style={{ minWidth: '12rem' }} />
          <Column field="modulo" header="Módulo" sortable style={{ minWidth: '10rem' }} />
          <Column field="ipOrigen" header="IP Origen" style={{ minWidth: '10rem' }} />
          <Column field="resultado" header="Resultado" body={resultadoBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column header="Acciones" body={accionesBodyTemplate} style={{ minWidth: '8rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Dialog Detalle completo */}
      <Dialog
        header="Detalle del Evento de Auditoría"
        visible={dialogDetalle}
        style={{ width: '550px' }}
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
            {selectedItem.resultado === 'Fallido' && (
              <div className="mb-3">
                <Tag
                  severity="danger"
                  value="⚠ Este evento indica un intento fallido"
                  className="w-full py-2 font-semibold text-sm animate-pulse"
                />
              </div>
            )}

            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha y hora</span>
                <span className="text-sm font-medium text-slate-800">{formatDateTime(selectedItem.fecha)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Resultado</span>
                <Tag
                  value={selectedItem.resultado}
                  severity={selectedItem.resultado === 'Exitoso' ? 'success' : 'danger'}
                  className="w-max block mt-1"
                />
              </div>

              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Usuario</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.usuario}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rol</span>
                <Tag
                  value={selectedItem.rol}
                  severity={
                    selectedItem.rol === 'TICs' || selectedItem.rol === 'Administrador' ? 'danger' :
                    selectedItem.rol === 'Activo Fijo' ? 'success' :
                    selectedItem.rol === 'Mantenimiento' ? 'warning' : 'info'
                  }
                  className="w-max block mt-1"
                />
              </div>

              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Acción</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.accion}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Módulo</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.modulo}</span>
              </div>

              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">IP de origen</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.ipOrigen}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">—</span>
                <span className="text-sm font-medium text-slate-400">—</span>
              </div>

              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Detalle completo</span>
                <div className="bg-slate-50 border-1 border-slate-200 border-round p-3 text-sm text-slate-700 block line-height-3 whitespace-pre-wrap mt-1">
                  {selectedItem.detalle}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Auditoria;
