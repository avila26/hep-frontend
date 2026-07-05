import React, { useState, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Divider } from 'primereact/divider';
import { Tooltip } from 'primereact/tooltip';
import { useBajasContext, InformeBajaHEP, BienEnInforme } from '../../context/BajasContext';
import { useActivos } from '../../context/ActivosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const TIPO_SOLICITANTE = [
  { label: 'TICs', value: 'TICS' },
  { label: 'Mantenimiento', value: 'Mantenimiento' }
];

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

interface SolicitudFormData {
  tipoSolicitante: 'TICS' | 'Mantenimiento';
  elaboradoPor: string;
  fechaElaboracion: Date | null;
  antecedentes: string;
  justificacionTecnica: string;
  recomendacion: string;
}

const initialFormData: SolicitudFormData = {
  tipoSolicitante: 'TICS',
  elaboradoPor: '',
  fechaElaboracion: null,
  antecedentes: '',
  justificacionTecnica: '',
  recomendacion: ''
};

const Solicitudes: React.FC = () => {
  const { informes, crearInforme, reenviarInforme } = useBajasContext();
  const { activos } = useActivos();
  const activosList = activos || [];

  // Estados
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [dialogNuevo, setDialogNuevo] = useState<boolean>(false);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [dialogReenviar, setDialogReenviar] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InformeBajaHEP | null>(null);
  const [bienesSeleccionados, setBienesSeleccionados] = useState<BienEnInforme[]>([]);
  const [formData, setFormData] = useState<SolicitudFormData>(initialFormData);
  const [formReenvio, setFormReenvio] = useState({
    justificacionTecnica: '',
    recomendacion: ''
  });
  const [activoSeleccionadoId, setActivoSeleccionadoId] = useState<string | null>(null);

  const toast = useRef<Toast>(null);

  // Computar datos de informes para incluir el campo de códigos de búsqueda global
  const informesConBusqueda = useMemo(() => {
    return informes.map(inf => ({
      ...inf,
      buscarCodigosActivos: inf.bienes.map(b => b.codigoActivo).join(' ')
    }));
  }, [informes]);

  // Contadores para el encabezado
  const pendientesCount = useMemo(() => informes.filter(i => i.estado === 'Pendiente').length, [informes]);
  const devueltosCount = useMemo(() => informes.filter(i => i.estado === 'Devuelto').length, [informes]);
  const totalCount = informes.length;

  // Filtrado de activos para el Dropdown
  const activosDisponiblesOptions = useMemo(() => {
    return activosList.map(a => ({
      label: `${a.codigoInstitucional} - ${a.nombre} (S/N: ${a.numeroSerie || 'S/S'})`,
      value: a.codigoInstitucional
    }));
  }, [activosList]);

  // Manejadores
  const handleOpenNuevo = () => {
    setFormData(initialFormData);
    setBienesSeleccionados([]);
    setActivoSeleccionadoId(null);
    setDialogNuevo(true);
  };

  const handleCancelarNuevo = () => {
    setDialogNuevo(false);
    setFormData(initialFormData);
    setBienesSeleccionados([]);
    setActivoSeleccionadoId(null);
  };

  const handleFieldChange = (key: keyof SolicitudFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAgregarBien = () => {
    if (!activoSeleccionadoId) return;

    const seleccionado = activosList.find(a => a.codigoInstitucional === activoSeleccionadoId);
    if (!seleccionado) return;

    // Validar si ya está en bienesSeleccionados
    const yaExiste = bienesSeleccionados.some(b => b.codigoActivo === seleccionado.codigoInstitucional);
    if (yaExiste) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Este activo ya fue agregado al informe',
        life: 3000
      });
      return;
    }

    const nuevoBien: BienEnInforme = {
      codigoActivo: seleccionado.codigoInstitucional,
      nombreActivo: seleccionado.nombre,
      categoria: (seleccionado as any).categoriaActivo || 'Sin Categoría',
      ubicacion: seleccionado.ubicacion || 'Sin Ubicación',
      custodioActual: seleccionado.responsableEntrega || 'Sin Custodio'
    };

    setBienesSeleccionados(prev => [...prev, nuevoBien]);
    setActivoSeleccionadoId(null);
  };

  const handleQuitarBien = (codigoActivo: string) => {
    setBienesSeleccionados(prev => prev.filter(b => b.codigoActivo !== codigoActivo));
  };

  const handleGenerarInforme = () => {
    if (bienesSeleccionados.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Debe agregar al menos un bien',
        life: 3000
      });
      return;
    }

    if (!formData.elaboradoPor.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Debe especificar quién elabora el informe',
        life: 3000
      });
      return;
    }

    if (!formData.fechaElaboracion) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Debe especificar la fecha de elaboración',
        life: 3000
      });
      return;
    }

    if (!formData.antecedentes.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Debe completar los antecedentes',
        life: 3000
      });
      return;
    }

    if (!formData.justificacionTecnica.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Debe completar la justificación técnica',
        life: 3000
      });
      return;
    }

    if (!formData.recomendacion.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Debe completar la recomendación',
        life: 3000
      });
      return;
    }

    // Convertir fecha de elaboración a ISO 'YYYY-MM-DD'
    const fechaISO = formData.fechaElaboracion.toISOString().split('T')[0];

    crearInforme({
      tipoSolicitante: formData.tipoSolicitante,
      elaboradoPor: formData.elaboradoPor,
      fechaElaboracion: fechaISO,
      antecedentes: formData.antecedentes,
      justificacionTecnica: formData.justificacionTecnica,
      recomendacion: formData.recomendacion,
      bienes: bienesSeleccionados
    });

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Informe técnico generado. Quedará pendiente de revisión por Activo Fijo.',
      life: 3000
    });

    setDialogNuevo(false);
    setFormData(initialFormData);
    setBienesSeleccionados([]);
  };

  const handleOpenReenviar = (item: InformeBajaHEP) => {
    setSelectedItem(item);
    setFormReenvio({
      justificacionTecnica: item.justificacionTecnica,
      recomendacion: item.recomendacion
    });
    setDialogReenviar(true);
  };

  const handleReenviar = () => {
    if (!selectedItem) return;

    if (!formReenvio.justificacionTecnica.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La justificación técnica no puede estar vacía.',
        life: 3000
      });
      return;
    }

    if (!formReenvio.recomendacion.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La recomendación no puede estar vacía.',
        life: 3000
      });
      return;
    }

    reenviarInforme(selectedItem.id, formReenvio.justificacionTecnica, formReenvio.recomendacion);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Informe reenviado. Vuelve a estado Pendiente para revisión.',
      life: 3000
    });

    setDialogReenviar(false);
    setSelectedItem(null);
  };

  // Templates para la tabla
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
          tooltip="Ver detalle"
          tooltipOptions={{ position: 'top' }}
          onClick={() => {
            setSelectedItem(row);
            setDialogDetalle(true);
          }}
        />
        {row.estado === 'Devuelto' && (
          <Button
            icon="pi pi-send"
            severity="warning"
            rounded
            tooltip="Corregir y reenviar"
            tooltipOptions={{ position: 'top' }}
            onClick={() => handleOpenReenviar(row)}
          />
        )}
      </div>
    );
  };

  // Toolbars
  const headerToolbarLeft = () => {
    return (
      <Button
        label="Nuevo Informe Técnico"
        icon="pi pi-file-edit"
        severity="success"
        onClick={handleOpenNuevo}
      />
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
          placeholder="Buscar informe..."
        />
      </IconField>
    );
  };

  // Footers de diálogos
  const newDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={handleCancelarNuevo} />
      <Button label="Generar Informe" icon="pi pi-file-pdf" severity="success" onClick={handleGenerarInforme} />
    </div>
  );

  const detailDialogFooter = (
    <div className="flex justify-end pt-2">
      <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
    </div>
  );

  const reenviarDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={() => setDialogReenviar(false)} />
      <Button label="Reenviar para revisión" icon="pi pi-send" severity="warning" onClick={handleReenviar} />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Solicitudes — Informes Técnicos de Baja
          </h1>
          <p className="text-slate-500 m-0">
            Elaboración de informes técnicos que justifican la baja de bienes institucionales del HEP
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag value={`Pendientes: ${pendientesCount}`} severity="warning" className="px-3 py-2 text-sm" />
          <Tag value={`Devueltos: ${devueltosCount}`} severity="danger" className="px-3 py-2 text-sm" />
          <Tag value={`Total informes: ${totalCount}`} severity="info" className="px-3 py-2 text-sm" />
        </div>
      </div>

      <Toolbar className="mb-4" left={headerToolbarLeft} right={headerToolbarRight} />

      {/* Tabla Maestro de Informes */}
      <div className="card shadow-sm border-round bg-white p-3">
        <DataTable
          value={informesConBusqueda}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay informes técnicos registrados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          globalFilter={globalFilter}
          globalFilterFields={[
            'referencia',
            'elaboradoPor',
            'antecedentes',
            'justificacionTecnica',
            'buscarCodigosActivos'
          ]}
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
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '130px' }} />
          <Column header="Acciones" body={accionesBodyTemplate} style={{ minWidth: '130px', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Dialog Nuevo Informe Técnico */}
      <Dialog
        header="Elaborar Informe Técnico de Baja"
        visible={dialogNuevo}
        style={{ width: '800px' }}
        modal
        resizable
        onHide={handleCancelarNuevo}
        footer={newDialogFooter}
      >
        <div className="p-fluid">
          {/* SECCIÓN Datos generales */}
          <h5 className="text-slate-700 font-semibold mb-2 mt-0">Datos generales</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="tipoSolicitante" className="block text-sm font-semibold text-slate-700 mb-1">
                Tipo de solicitante <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="tipoSolicitante"
                value={formData.tipoSolicitante}
                onChange={e => handleFieldChange('tipoSolicitante', e.value)}
                options={TIPO_SOLICITANTE}
                placeholder="Seleccione tipo..."
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="elaboradoPor" className="block text-sm font-semibold text-slate-700 mb-1">
                Elaborado por <span className="text-red-500">*</span>
              </label>
              <InputText
                id="elaboradoPor"
                value={formData.elaboradoPor}
                onChange={e => handleFieldChange('elaboradoPor', e.target.value)}
                placeholder="Nombre del técnico elaborador"
              />
            </div>
            <div className="col-12 mb-3">
              <label htmlFor="fechaElaboracion" className="block text-sm font-semibold text-slate-700 mb-1">
                Fecha de elaboración <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fechaElaboracion"
                value={formData.fechaElaboracion}
                onChange={e => handleFieldChange('fechaElaboracion', e.value)}
                dateFormat="dd/mm/yy"
                placeholder="DD/MM/AAAA"
                showIcon
                className="w-full"
              />
            </div>
          </div>

          <Divider className="my-3" />

          {/* SECCIÓN Bienes a incluir */}
          <h5 className="text-slate-700 font-semibold mb-1">Bienes a incluir en el informe</h5>
          <p className="text-xs text-slate-500 mt-0 mb-3 leading-normal">
            Seleccione uno o más activos. El sistema enlazará automáticamente su historial completo como anexo del informe (RF-BA-15).
          </p>

          <div className="grid align-items-end mb-3">
            <div className="col-12 md:col-9">
              <label htmlFor="selectActivo" className="block text-sm font-semibold text-slate-700 mb-1">
                Activo
              </label>
              <Dropdown
                id="selectActivo"
                value={activoSeleccionadoId}
                options={activosDisponiblesOptions}
                onChange={e => setActivoSeleccionadoId(e.value)}
                filter
                placeholder="Buscar activo por código, nombre o serie..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <Button
                label="Agregar"
                icon="pi pi-plus"
                severity="success"
                className="w-full"
                onClick={handleAgregarBien}
                disabled={!activoSeleccionadoId}
              />
            </div>
          </div>

          <DataTable
            value={bienesSeleccionados}
            emptyMessage="Aún no ha agregado ningún bien a este informe."
            stripedRows
            showGridlines
            size="small"
            className="mb-3"
          >
            <Column field="codigoActivo" header="Código" style={{ width: '15%' }} />
            <Column field="nombreActivo" header="Nombre" style={{ width: '30%' }} />
            <Column field="categoria" header="Categoría" style={{ width: '20%' }} />
            <Column field="ubicacion" header="Ubicación" style={{ width: '15%' }} />
            <Column field="custodioActual" header="Custodio" style={{ width: '15%' }} />
            <Column
              header="Acción"
              body={(row: BienEnInforme) => (
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  size="small"
                  tooltip="Quitar del informe"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => handleQuitarBien(row.codigoActivo)}
                />
              )}
              style={{ width: '5%', textAlign: 'center' }}
            />
          </DataTable>

          <Divider className="my-3" />

          {/* SECCIÓN Justificación técnica */}
          <h5 className="text-slate-700 font-semibold mb-2">Justificación técnica</h5>
          <div className="field mb-3">
            <label htmlFor="antecedentes" className="block text-sm font-semibold text-slate-700 mb-1">
              Antecedentes <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              id="antecedentes"
              rows={3}
              value={formData.antecedentes}
              onChange={e => handleFieldChange('antecedentes', e.target.value)}
              placeholder="Describa el contexto y antecedentes de la situación que motiva esta solicitud de baja..."
              className="w-full"
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="justificacionTecnica" className="block text-sm font-semibold text-slate-700 mb-1">
              Justificación técnica <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              id="justificacionTecnica"
              rows={3}
              value={formData.justificacionTecnica}
              onChange={e => handleFieldChange('justificacionTecnica', e.target.value)}
              placeholder="Detalle técnicamente las razones por las cuales se solicita la baja de estos bienes..."
              className="w-full"
            />
          </div>

          <div className="field mb-1">
            <label htmlFor="recomendacion" className="block text-sm font-semibold text-slate-700 mb-1">
              Recomendación <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              id="recomendacion"
              rows={2}
              value={formData.recomendacion}
              onChange={e => handleFieldChange('recomendacion', e.target.value)}
              placeholder="Indique la recomendación final (ej: dar de baja definitiva, reciclaje, donación...)"
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

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

            {/* Panel de Devolución si el estado es Devuelto */}
            {selectedItem.estado === 'Devuelto' && (
              <div className="p-3 border-round bg-red-50 text-red-700 border-left-3 border-red-500 mt-3">
                <span className="block font-bold text-sm mb-1">Observaciones de devolución:</span>
                <p className="m-0 text-sm">{selectedItem.observacionesRevision}</p>
              </div>
            )}

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

      {/* Dialog Corregir y Reenviar */}
      <Dialog
        header={selectedItem ? `Corregir Informe — ${selectedItem.referencia}` : 'Corregir Informe'}
        visible={dialogReenviar}
        style={{ width: '650px' }}
        modal
        onHide={() => setDialogReenviar(false)}
        footer={reenviarDialogFooter}
      >
        {selectedItem && (
          <div className="p-fluid">
            {/* Panel de información de devolución */}
            <div className="p-3 border-round bg-red-50 text-red-700 border-left-3 border-red-500 mb-4">
              <span className="block font-bold text-sm mb-1">Devuelto por: {selectedItem.revisadoPor}</span>
              <span className="block font-semibold text-xs mb-2">
                Fecha revisión: {formatDate(selectedItem.fechaRevision)}
              </span>
              <p className="m-0 text-sm">
                <strong>Motivo de devolución: </strong>
                {selectedItem.observacionesRevision}
              </p>
            </div>

            {/* Formulario de Reenvío */}
            <div className="field mb-3">
              <label htmlFor="justificacionReenvio" className="block text-sm font-semibold text-slate-700 mb-1">
                Justificación técnica (corregida) <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                id="justificacionReenvio"
                rows={3}
                value={formReenvio.justificacionTecnica}
                onChange={e => setFormReenvio(prev => ({ ...prev, justificacionTecnica: e.target.value }))}
                placeholder="Detalle técnicamente las correcciones de la baja..."
                className="w-full"
              />
            </div>

            <div className="field mb-1">
              <label htmlFor="recomendacionReenvio" className="block text-sm font-semibold text-slate-700 mb-1">
                Recomendación (corregida) <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                id="recomendacionReenvio"
                rows={2}
                value={formReenvio.recomendacion}
                onChange={e => setFormReenvio(prev => ({ ...prev, recomendacion: e.target.value }))}
                placeholder="Indique la recomendación final corregida..."
                className="w-full"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Solicitudes;
