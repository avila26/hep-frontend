import React, { useState, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
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

const Revision: React.FC = () => {
  const { pendientes, aprobarInforme, devolverInforme } = useBajasContext();

  // Estados
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [dialogRevisar, setDialogRevisar] = useState<boolean>(false);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InformeBajaHEP | null>(null);
  const [accionSeleccionada, setAccionSeleccionada] = useState<'Aprobar' | 'Devolver' | null>(null);
  const [revisadoPor, setRevisadoPor] = useState<string>('');
  const [comentario, setComentario] = useState<string>('');

  const toast = useRef<Toast>(null);

  // Contadores para el encabezado (sobre 'pendientes' del contexto: Pendiente + Devuelto)
  const pendientesRevisionCount = useMemo(() => {
    return pendientes.filter(i => i.estado === 'Pendiente').length;
  }, [pendientes]);

  const enCorreccionCount = useMemo(() => {
    return pendientes.filter(i => i.estado === 'Devuelto').length;
  }, [pendientes]);

  // Lista a mostrar en el DataTable: solo estado === 'Pendiente'
  const informesPendientes = useMemo(() => {
    return pendientes.filter(i => i.estado === 'Pendiente');
  }, [pendientes]);

  // Manejadores
  const handleOpenRevisar = (row: InformeBajaHEP) => {
    setSelectedItem(row);
    setAccionSeleccionada(null);
    setRevisadoPor('');
    setComentario('');
    setDialogRevisar(true);
  };

  const handleCancelarRevisar = () => {
    setDialogRevisar(false);
    setAccionSeleccionada(null);
    setRevisadoPor('');
    setComentario('');
  };

  const handleRevisarDesdeDetalle = () => {
    if (!selectedItem) return;
    setDialogDetalle(false);
    setAccionSeleccionada(null);
    setRevisadoPor('');
    setComentario('');
    setDialogRevisar(true);
  };

  const handleConfirmar = () => {
    if (!selectedItem || !accionSeleccionada) return;

    if (!revisadoPor.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe indicar quién revisa',
        life: 3000
      });
      return;
    }

    if (accionSeleccionada === 'Devolver' && !comentario.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe indicar el motivo de la devolución',
        life: 3000
      });
      return;
    }

    if (accionSeleccionada === 'Aprobar') {
      aprobarInforme(selectedItem.id, revisadoPor, comentario);
      toast.current?.show({
        severity: 'success',
        summary: 'Informe Aprobado',
        detail: `Informe aprobado. Referencia: ${selectedItem.referencia}. Será derivado al proceso administrativo.`,
        life: 4000
      });
    } else {
      devolverInforme(selectedItem.id, revisadoPor, comentario);
      toast.current?.show({
        severity: 'warn',
        summary: 'Informe Devuelto',
        detail: `Informe devuelto para corrección. ${selectedItem.elaboradoPor} deberá reenviarlo desde Solicitudes.`,
        life: 4000
      });
    }

    setDialogRevisar(false);
    setAccionSeleccionada(null);
    setRevisadoPor('');
    setComentario('');
    setSelectedItem(null);
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

  const vecesReenviadoBodyTemplate = (row: InformeBajaHEP) => {
    const count = row.historialRevisiones.filter(h => h.accion === 'Devuelto').length;
    if (count > 0) {
      return <Tag value={`Reenviado ${count}x`} severity="warning" />;
    }
    return <span>—</span>;
  };

  const estadoBodyTemplate = (row: InformeBajaHEP) => {
    let severity: 'warning' | 'danger' | 'success' | 'info' | 'secondary' = 'warning';
    switch (row.estado) {
      case 'Pendiente':
        severity = 'warning';
        break;
      case 'Devuelto':
        severity = 'danger';
        break;
      case 'Aprobado':
        severity = 'success';
        break;
      case 'Procesado':
        severity = 'info';
        break;
      case 'Egresado':
        severity = 'secondary';
        break;
    }
    return <Tag value={row.estado} severity={severity} />;
  };

  const accionesBodyTemplate = (row: InformeBajaHEP) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          severity="info"
          rounded
          tooltip="Ver detalle completo"
          tooltipOptions={{ position: 'top' }}
          onClick={() => {
            setSelectedItem(row);
            setDialogDetalle(true);
          }}
        />
        <Button
          icon="pi pi-clipboard-check"
          severity="success"
          rounded
          tooltip="Revisar informe"
          tooltipOptions={{ position: 'top' }}
          onClick={() => handleOpenRevisar(row)}
        />
      </div>
    );
  };

  // Toolbars
  const headerToolbarLeft = () => {
    return (
      <div className="flex align-items-center text-slate-600 gap-2">
        <i className="pi pi-info-circle text-info text-lg" />
        <span className="text-sm">
          Solo se muestran informes en estado <strong>Pendiente</strong>. Los informes devueltos aparecen en seguimiento hasta su reenvío.
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
      <Button
        label="Revisar este informe"
        icon="pi pi-clipboard-check"
        severity="success"
        onClick={handleRevisarDesdeDetalle}
      />
    </div>
  );

  const revisarDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={handleCancelarRevisar} />
      <Button
        label={accionSeleccionada === 'Devolver' ? 'Devolver Informe' : 'Aprobar Informe'}
        icon={accionSeleccionada === 'Devolver' ? 'pi pi-times-circle' : 'pi pi-check-circle'}
        severity={accionSeleccionada === 'Devolver' ? 'danger' : 'success'}
        onClick={handleConfirmar}
        disabled={accionSeleccionada === null}
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
            Revisión de Informes Técnicos
          </h1>
          <p className="text-slate-500 m-0">
            Validación de informes técnicos de baja elaborados por TICS o Mantenimiento — Activo Fijo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag value={`Pendientes de revisión: ${pendientesRevisionCount}`} severity="warning" className="px-3 py-2 text-sm" />
          <Tag value={`En corrección (Devueltos): ${enCorreccionCount}`} severity="danger" className="px-3 py-2 text-sm" />
        </div>
      </div>

      <Toolbar className="mb-4" left={headerToolbarLeft} right={headerToolbarRight} />

      {/* Tabla de Pendientes */}
      <div className="card shadow-sm border-round bg-white p-3">
        <DataTable
          value={informesPendientes}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay informes pendientes de revisión"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          globalFilter={globalFilter}
          globalFilterFields={['referencia', 'elaboradoPor', 'antecedentes', 'justificacionTecnica']}
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
          <Column
            field="fechaElaboracion"
            header="Fecha elaboración"
            body={row => formatDate(row.fechaElaboracion)}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Veces reenviado"
            body={vecesReenviadoBodyTemplate}
            style={{ minWidth: '140px', textAlign: 'center' }}
          />
          <Column header="Acciones" body={accionesBodyTemplate} style={{ minWidth: '140px', textAlign: 'center' }} />
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
                  Fecha Registro
                </span>
                <span className="text-base text-slate-800 font-medium">{formatDate(selectedItem.fechaRegistro)}</span>
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

      {/* Dialog Revisar Informe */}
      <Dialog
        header={selectedItem ? `Revisar Informe — ${selectedItem.referencia}` : 'Revisar Informe'}
        visible={dialogRevisar}
        style={{ width: '650px' }}
        modal
        onHide={handleCancelarRevisar}
        footer={revisarDialogFooter}
      >
        {selectedItem && (
          <div className="p-fluid">
            {/* Resumen compacto de lectura */}
            <div className="p-3 border-round bg-slate-50 border-1 border-200 mb-3">
              <div className="mb-2">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Bienes Incluidos
                </span>
                <ul className="m-0 pl-3 text-sm text-slate-700">
                  {selectedItem.bienes.map((b, idx) => (
                    <li key={idx}>
                      <strong>{b.codigoActivo}</strong> - {b.nombreActivo}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-2">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Justificación Técnica
                </span>
                <p className="m-0 text-sm text-slate-700 whitespace-pre-wrap">{selectedItem.justificacionTecnica}</p>
              </div>
              <div className="mb-2">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Recomendación
                </span>
                <p className="m-0 text-sm text-slate-700 whitespace-pre-wrap">{selectedItem.recomendacion}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">
                  Elaborado por: <strong>{selectedItem.elaboradoPor}</strong> el {formatDate(selectedItem.fechaElaboracion)}
                </span>
              </div>
            </div>

            <Divider className="my-3" />

            {/* Selección de Decisión */}
            <p className="text-sm font-semibold text-slate-700 mb-2 mt-0">
              ¿Cuál es su decisión sobre este informe técnico?
            </p>
            <div className="flex gap-3 mb-4">
              <Button
                label="Aprobar"
                icon="pi pi-check-circle"
                severity="success"
                outlined={accionSeleccionada !== 'Aprobar'}
                className="flex-1 py-3"
                onClick={() => setAccionSeleccionada('Aprobar')}
              />
              <Button
                label="Devolver para corrección"
                icon="pi pi-times-circle"
                severity="danger"
                outlined={accionSeleccionada !== 'Devolver'}
                className="flex-1 py-3"
                onClick={() => setAccionSeleccionada('Devolver')}
              />
            </div>

            {/* Campos Dinámicos */}
            {accionSeleccionada && (
              <div className="grid">
                <div className="col-12 mb-3">
                  <label htmlFor="revisadoPor" className="block text-sm font-semibold text-slate-700 mb-1">
                    Revisado por <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="revisadoPor"
                    value={revisadoPor}
                    onChange={e => setRevisadoPor(e.target.value)}
                    placeholder="Nombre del responsable de Activo Fijo"
                    className="w-full"
                  />
                </div>
                <div className="col-12 mb-3">
                  <label htmlFor="comentario" className="block text-sm font-semibold text-slate-700 mb-1">
                    Comentario {accionSeleccionada === 'Devolver' && <span className="text-red-500">*</span>}
                  </label>
                  <InputTextarea
                    id="comentario"
                    rows={3}
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    placeholder={
                      accionSeleccionada === 'Aprobar'
                        ? 'Comentarios de aprobación (opcional)'
                        : 'Explique claramente qué debe corregirse para que el informe pueda ser reenviado...'
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Revision;
