import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Divider } from 'primereact/divider';
import { Tooltip } from 'primereact/tooltip';
import { useBajasContext, InformeBajaHEP } from '../../context/BajasContext';

/* ------------------------------------------------------------------ */
/*  Función de Formato de Fecha Segura                                */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const Aprobados: React.FC = () => {
  const navigate = useNavigate();
  const { aprobados, procesarInforme } = useBajasContext();

  // Estados
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [dialogProcesar, setDialogProcesar] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InformeBajaHEP | null>(null);

  const toast = useRef<Toast>(null);

  // Contadores para el encabezado (Aprobado + Procesado)
  const aprobadosCount = useMemo(() => {
    return aprobados.filter(i => i.estado === 'Aprobado').length;
  }, [aprobados]);

  const procesadosCount = useMemo(() => {
    return aprobados.filter(i => i.estado === 'Procesado').length;
  }, [aprobados]);

  // Manejadores
  const handleOpenProcesar = (row: InformeBajaHEP) => {
    setSelectedItem(row);
    setDialogProcesar(true);
  };

  const handleConfirmarProcesar = () => {
    if (!selectedItem) return;

    procesarInforme(selectedItem.id);

    toast.current?.show({
      severity: 'success',
      summary: 'Informe Procesado',
      detail: `Informe ${selectedItem.referencia} derivado al proceso administrativo correctamente.`,
      life: 4000
    });

    setDialogProcesar(false);
    setSelectedItem(null);
  };

  const handleProcesarDesdeDetalle = () => {
    if (!selectedItem) return;
    setDialogDetalle(false);
    setDialogProcesar(true);
  };

  const handleIrAEgresoDesdeDetalle = () => {
    if (!selectedItem) return;
    setDialogDetalle(false);
    navigate('/bajas/egresos', { state: { id: selectedItem.id } });
  };

  // Templates de DataTable
  const bienesBodyTemplate = (row: InformeBajaHEP) => {
    const codes = row.bienes.map(b => b.codigoActivo).join(', ');
    const tooltipId = `tooltip-bienes-${row.id}`;
    return (
      <>
        <span
          className="bienes-tooltip-target font-medium cursor-pointer text-primary hover:underline"
          data-pr-tooltip={codes}
          id={tooltipId}
        >
          {row.bienes.length} bien(es)
        </span>
        <Tooltip target={`#${tooltipId}`} position="top" />
      </>
    );
  };

  const sortBienesLength = (event: any) => {
    event.data.sort((data1: any, data2: any) => {
      const len1 = data1.bienes ? data1.bienes.length : 0;
      const len2 = data2.bienes ? data2.bienes.length : 0;
      return event.order * (len1 - len2);
    });
    return event.data;
  };

  const solicitanteBodyTemplate = (row: InformeBajaHEP) => {
    const severity = row.tipoSolicitante === 'TICS' ? 'info' : 'secondary';
    return <Tag value={row.tipoSolicitante === 'TICS' ? 'TICs' : 'Mantenimiento'} severity={severity} />;
  };

  const estadoBodyTemplate = (row: InformeBajaHEP) => {
    const severity = row.estado === 'Aprobado' ? 'success' : 'info';
    return <Tag value={row.estado} severity={severity} />;
  };

  const accionesBodyTemplate = (row: InformeBajaHEP) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          severity="info"
          rounded
          tooltip="Ver detalle"
          tooltipOptions={{ position: 'top' }}
          onClick={() => {
            setSelectedItem(row);
            setDialogDetalle(true);
          }}
        />
        {row.estado === 'Aprobado' && (
          <Button
            icon="pi pi-send"
            severity="warning"
            rounded
            tooltip="Derivar a proceso administrativo"
            tooltipOptions={{ position: 'top' }}
            onClick={() => handleOpenProcesar(row)}
          />
        )}
        {row.estado === 'Procesado' && (
          <Button
            icon="pi pi-arrow-right-circle"
            severity="success"
            rounded
            tooltip="Ir a registrar egreso"
            tooltipOptions={{ position: 'top' }}
            onClick={() => navigate('/bajas/egresos', { state: { id: row.id } })}
          />
        )}
      </div>
    );
  };

  // Toolbars
  const headerToolbarLeft = () => {
    return (
      <div className="flex align-items-center text-slate-600 gap-2">
        <i className="pi pi-info-circle text-info text-lg" />
        <span className="text-sm">
          Los informes en estado <strong>Procesado</strong> están listos para registrar su egreso desde el módulo correspondiente.
        </span>
      </div>
    );
  };

  const headerToolbarRight = () => {
    return (
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          type="search"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
      </IconField>
    );
  };

  // Footers de diálogos
  const detailDialogFooter = (
    <div className="flex justify-content-between align-items-center pt-2">
      <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
      {selectedItem && selectedItem.estado === 'Aprobado' && (
        <Button
          label="Derivar a proceso administrativo"
          icon="pi pi-send"
          severity="warning"
          onClick={handleProcesarDesdeDetalle}
        />
      )}
      {selectedItem && selectedItem.estado === 'Procesado' && (
        <Button
          label="Ir a registrar egreso"
          icon="pi pi-arrow-right-circle"
          severity="success"
          onClick={handleIrAEgresoDesdeDetalle}
        />
      )}
    </div>
  );

  const procesarDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={() => setDialogProcesar(false)} />
      <Button
        label="Confirmar derivación"
        icon="pi pi-check"
        severity="success"
        onClick={handleConfirmarProcesar}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Informes Aprobados
          </h1>
          <p className="text-slate-500 m-0">
            Informes técnicos validados por Activo Fijo, listos para derivar al proceso administrativo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag value={`Aprobados (sin derivar): ${aprobadosCount}`} severity="success" className="px-3 py-2 text-sm" />
          <Tag value={`Procesados (en trámite admin.): ${procesadosCount}`} severity="info" className="px-3 py-2 text-sm" />
        </div>
      </div>

      <Toolbar className="mb-4" left={headerToolbarLeft} right={headerToolbarRight} />

      {/* Tabla Maestro de Aprobados */}
      <div className="card shadow-sm border-round bg-white p-3">
        <DataTable
          value={aprobados}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay informes aprobados registrados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          globalFilter={globalFilter}
          globalFilterFields={['referencia', 'elaboradoPor', 'aprobadoPor', 'justificacionTecnica']}
          sortMode="multiple"
        >
          <Column field="referencia" header="Referencia" sortable style={{ minWidth: '140px' }} />
          <Column
            header="Bienes incluidos"
            body={bienesBodyTemplate}
            sortable
            sortFunction={sortBienesLength}
            style={{ minWidth: '150px' }}
          />
          <Column
            field="tipoSolicitante"
            header="Solicitante"
            body={solicitanteBodyTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column field="elaboradoPor" header="Elaborado por" sortable style={{ minWidth: '180px' }} />
          <Column field="aprobadoPor" header="Aprobado por" sortable style={{ minWidth: '180px' }} />
          <Column
            field="fechaAprobacion"
            header="Fecha aprobación"
            body={row => formatDate(row.fechaAprobacion)}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '130px' }} />
          <Column header="Acciones" body={accionesBodyTemplate} style={{ minWidth: '160px', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Dialog Detalle del Informe */}
      <Dialog
        header={selectedItem ? `Informe — ${selectedItem.referencia}` : 'Detalle del Informe'}
        visible={dialogDetalle}
        style={{ width: '700px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={detailDialogFooter}
      >
        {selectedItem && (
          <div className="p-fluid">
            {/* SECCIÓN Datos generales */}
            <div className="grid mb-2">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Referencia
                </span>
                <span className="text-base text-slate-800 font-medium">{selectedItem.referencia}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Estado
                </span>
                <div>{estadoBodyTemplate(selectedItem)}</div>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tipo Solicitante
                </span>
                <span className="text-base text-slate-800 font-medium">
                  {selectedItem.tipoSolicitante === 'TICS' ? 'TICs' : 'Mantenimiento'}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Elaborado Por
                </span>
                <span className="text-base text-slate-800 font-medium">{selectedItem.elaboradoPor}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Fecha Elaboración
                </span>
                <span className="text-base text-slate-800 font-medium">{formatDate(selectedItem.fechaElaboracion)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  —
                </span>
                <span className="text-base text-slate-800 font-medium">—</span>
              </div>
            </div>

            <Divider className="my-3" />

            {/* SECCIÓN Bienes incluidos */}
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Bienes incluidos</h5>
            <DataTable
              value={selectedItem.bienes}
              size="small"
              stripedRows
              showGridlines
              emptyMessage="No hay bienes incluidos."
              className="mb-3"
            >
              <Column field="codigoActivo" header="Código" />
              <Column field="nombreActivo" header="Nombre" />
              <Column field="categoria" header="Categoría" />
              <Column field="ubicacion" header="Ubicación" />
              <Column field="custodioActual" header="Custodio" />
            </DataTable>

            <Divider className="my-3" />

            {/* SECCIÓN Justificación */}
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Justificación</h5>
            <div className="flex flex-column gap-3 bg-slate-50 p-3 border-round border-1 border-200">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Antecedentes
                </span>
                <span className="text-sm text-slate-700 block whitespace-pre-wrap">{selectedItem.antecedentes}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Justificación Técnica
                </span>
                <span className="text-sm text-slate-700 block whitespace-pre-wrap">{selectedItem.justificacionTecnica}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Recomendación
                </span>
                <span className="text-sm text-slate-700 block whitespace-pre-wrap">{selectedItem.recomendacion}</span>
              </div>
            </div>

            <Divider className="my-3" />

            {/* SECCIÓN Aprobación */}
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Aprobación</h5>
            <div className="grid bg-slate-50 p-3 border-round border-1 border-200">
              <div className="col-12 md:col-6 mb-2">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Aprobado por
                </span>
                <span className="text-sm text-slate-800 font-medium">{selectedItem.aprobadoPor || '—'}</span>
              </div>
              <div className="col-12 md:col-6 mb-2">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Fecha de aprobación
                </span>
                <span className="text-sm text-slate-800 font-medium">{formatDate(selectedItem.fechaAprobacion)}</span>
              </div>
              <div className="col-12">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Observaciones de revisión
                </span>
                <span className="text-sm text-slate-700 block whitespace-pre-wrap">
                  {selectedItem.observacionesRevision || '—'}
                </span>
              </div>
            </div>

            {/* SECCIÓN Historial de revisiones */}
            {selectedItem.historialRevisiones && selectedItem.historialRevisiones.length > 0 && (
              <>
                <Divider className="my-3" />
                <h5 className="text-slate-700 font-semibold mb-3 mt-0">Historial de revisiones</h5>
                <div className="flex flex-column gap-3">
                  {selectedItem.historialRevisiones.map((rev, idx) => (
                    <div key={idx} className="p-3 border-round bg-slate-50 border-1 border-200">
                      <div className="flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                        <div className="flex align-items-center gap-2">
                          <Tag
                            value={rev.accion}
                            severity={rev.accion === 'Aprobado' ? 'success' : 'danger'}
                          />
                          <span className="font-semibold text-slate-800 text-sm">{rev.revisadoPor}</span>
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(rev.fecha)}</span>
                      </div>
                      <p className="m-0 text-sm text-slate-600 italic">"{rev.comentario}"</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Dialog>

      {/* Dialog Derivar a Proceso Administrativo */}
      <Dialog
        header="Derivar al proceso administrativo"
        visible={dialogProcesar}
        style={{ width: '480px' }}
        modal
        onHide={() => setDialogProcesar(false)}
        footer={procesarDialogFooter}
      >
        {selectedItem && (
          <div className="text-center">
            <i className="pi pi-send text-blue-500 text-6xl block mb-3 text-center" />
            <p className="text-base text-slate-800 font-semibold mb-3">
              ¿Confirma derivar el informe <span className="text-primary">{selectedItem.referencia}</span> al proceso administrativo?
            </p>

            <div className="p-3 border-round bg-slate-50 border-1 border-200 text-left mb-3">
              <div className="mb-2 text-sm">
                <strong>Bienes incluidos:</strong> {selectedItem.bienes.length} bien(es)
              </div>
              <div className="mb-2 text-sm">
                <strong>Aprobado por:</strong> {selectedItem.aprobadoPor || '—'}
              </div>
              <div className="text-sm">
                <strong>Fecha aprobación:</strong> {formatDate(selectedItem.fechaAprobacion)}
              </div>
            </div>

            <div className="p-3 border-round bg-blue-50 text-blue-700 border-left-3 border-blue-500 text-left text-xs mb-1">
              <i className="pi pi-info-circle mr-1" />
              Una vez derivado, el informe pasará a estado <strong>Procesado</strong> y quedará disponible para registrar el egreso del bien.
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Aprobados;
