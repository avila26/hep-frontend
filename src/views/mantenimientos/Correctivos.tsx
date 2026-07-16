import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useMantenimientosContext, MantenimientoHEP } from '../../context/MantenimientosContext';
import { useActivos } from '../../context/ActivosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
export const TECNICOS_MANTENIMIENTO = [
  { label: 'Ing. Carlos Ortega (TICs)', value: 'Ing. Carlos Ortega' },
  { label: 'Tec. Mario Vera (Mantenimiento General)', value: 'Tec. Mario Vera' },
  { label: 'Tec. Luis Paredes (Equipos Médicos)', value: 'Tec. Luis Paredes' },
  { label: 'Tec. Rosa Mendez (Infraestructura)', value: 'Tec. Rosa Mendez' },
  { label: 'Ing. Sofia Ponce (Biomédica)', value: 'Ing. Sofia Ponce' }
];

export const TIPO_FALLA = [
  { label: 'Falla eléctrica', value: 'Falla eléctrica' },
  { label: 'Falla mecánica', value: 'Falla mecánica' },
  { label: 'Falla de software', value: 'Falla de software' },
  { label: 'Daño físico / golpe', value: 'Daño físico' },
  { label: 'Desgaste por uso', value: 'Desgaste por uso' },
  { label: 'Falla de calibración', value: 'Falla de calibración' },
  { label: 'Derrame de líquidos', value: 'Derrame de líquidos' },
  { label: 'Otro', value: 'Otro' }
];

export const PRIORIDADES = [
  { label: 'Alta — Requiere atención inmediata', value: 'Alta' },
  { label: 'Media — Atender en 48 horas', value: 'Media' },
  { label: 'Baja — Puede esperar', value: 'Baja' }
];

export const UBICACIONES_HOSPITAL = [
  { label: 'UCI', value: 'UCI' },
  { label: 'Quirófano A', value: 'Quirófano A' },
  { label: 'Quirófano B', value: 'Quirófano B' },
  { label: 'Emergencias', value: 'Emergencias' },
  { label: 'Hospitalización - Piso 1', value: 'Hospitalización - Piso 1' },
  { label: 'Hospitalización - Piso 2', value: 'Hospitalización - Piso 2' },
  { label: 'Consulta Externa', value: 'Consulta Externa' },
  { label: 'Laboratorio Clínico', value: 'Laboratorio Clínico' },
  { label: 'Rayos X / Imagenología', value: 'Rayos X / Imagenología' },
  { label: 'Área Administrativa', value: 'Área Administrativa' },
  { label: 'TICs', value: 'TICs' },
  { label: 'Bodega Central', value: 'Bodega Central' }
];

/* ------------------------------------------------------------------ */
/*  Función de formato de fecha                                       */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

interface MantenimientoFormData {
  codigoActivo: string;
  nombreActivo: string;
  categoria: string;
  ubicacion: string;
  responsableTecnico: string;
  responsableCustodia: string;
  fechaProgramada: Date | null;
  descripcionTrabajo: string;
  diagnostico: string;
  repuestosUtilizados: string;
  observaciones: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  creadoPor: string;
  tipo: 'Correctivo';
}

const initialFormData: MantenimientoFormData = {
  codigoActivo: '',
  nombreActivo: '',
  categoria: '',
  ubicacion: '',
  responsableTecnico: '',
  responsableCustodia: '',
  fechaProgramada: null,
  descripcionTrabajo: '',
  diagnostico: '',
  repuestosUtilizados: '',
  observaciones: '',
  prioridad: 'Alta',
  creadoPor: '',
  tipo: 'Correctivo'
};

const Correctivos: React.FC = () => {
  const navigate = useNavigate();
  const { correctivos, agregarMantenimiento, iniciarMantenimiento } = useMantenimientosContext();
  const { activos } = useActivos();
  const activosList = activos || [];

  // Estados
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [dialogNuevo, setDialogNuevo] = useState<boolean>(false);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [dialogIniciar, setDialogIniciar] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MantenimientoHEP | null>(null);
  const [formData, setFormData] = useState<MantenimientoFormData>(initialFormData);
  const [tecnicoInicia, setTecnicoInicia] = useState<string>('');

  const toast = useRef<Toast>(null);

  // Sincronizar el técnico que inicia cuando cambia el selectedItem
  useEffect(() => {
    if (selectedItem) {
      setTecnicoInicia(selectedItem.responsableTecnico);
    }
  }, [selectedItem]);

  // Autocompletado al seleccionar activo
  const handleActivoChange = (codigoInst: string) => {
    const seleccionado = activosList.find(a => a.codigoInstitucional === codigoInst);
    if (seleccionado) {
      setFormData(prev => ({
        ...prev,
        codigoActivo: codigoInst,
        nombreActivo: seleccionado.nombre,
        categoria: (seleccionado as any).categoriaActivo || 'Sin Categoría',
        ubicacion: seleccionado.ubicacion || 'Sin Ubicación',
        responsableCustodia: seleccionado.responsableEntrega || 'Sin Custodio'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        codigoActivo: '',
        nombreActivo: '',
        categoria: '',
        ubicacion: '',
        responsableCustodia: ''
      }));
    }
  };

  const handleFieldChange = (key: keyof MantenimientoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const convertDateToYYYYMMDD = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  };

  const validateForm = () => {
    if (!formData.codigoActivo) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El Activo con falla es obligatorio.',
        life: 3000
      });
      return false;
    }
    if (!formData.diagnostico) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El Tipo de falla es obligatorio.',
        life: 3000
      });
      return false;
    }
    if (!formData.responsableTecnico) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El Técnico asignado es obligatorio.',
        life: 3000
      });
      return false;
    }
    if (!formData.fechaProgramada) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'La Fecha programada de atención es obligatoria.',
        life: 3000
      });
      return false;
    }
    if (!formData.creadoPor.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El campo Reportado por es obligatorio.',
        life: 3000
      });
      return false;
    }
    return true;
  };

  const handleSaveMantenimiento = () => {
    if (!validateForm()) return;

    const formattedDate = convertDateToYYYYMMDD(formData.fechaProgramada);

    // Calcular la referencia esperada para mostrarla en el toast
    const year = new Date().getFullYear();
    const prefix = 'MC';
    const countOfType = correctivos.length;
    const nextNum = countOfType + 1;
    const expectedReferencia = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;

    agregarMantenimiento({
      codigoActivo: formData.codigoActivo,
      nombreActivo: formData.nombreActivo,
      categoria: formData.categoria,
      ubicacion: formData.ubicacion,
      responsableTecnico: formData.responsableTecnico,
      responsableCustodia: formData.responsableCustodia,
      fechaProgramada: formattedDate,
      descripcionTrabajo: formData.descripcionTrabajo,
      diagnostico: formData.diagnostico,
      repuestosUtilizados: formData.repuestosUtilizados,
      observaciones: formData.observaciones,
      prioridad: formData.prioridad,
      creadoPor: formData.creadoPor,
      tipo: formData.tipo
    });

    toast.current?.show({
      severity: 'success',
      summary: 'Falla Reportada',
      detail: `Falla reportada. Ref: ${expectedReferencia}`,
      life: 4000
    });

    setDialogNuevo(false);
    setFormData(initialFormData);
  };

  const handleCancelNew = () => {
    setDialogNuevo(false);
    setFormData(initialFormData);
  };

  const handleConfirmIniciar = () => {
    if (selectedItem) {
      iniciarMantenimiento(selectedItem.id);
      toast.current?.show({
        severity: 'success',
        summary: 'Reparación Iniciada',
        detail: `Reparación iniciada. Ref: ${selectedItem.referencia}`,
        life: 4000
      });
      setDialogIniciar(false);
      setSelectedItem(null);
    }
  };

  // Contadores para el encabezado
  const totalCount = correctivos.length;
  const programadosCount = correctivos.filter(c => c.estado === 'Programado').length;
  const enProcesoCount = correctivos.filter(c => c.estado === 'En Proceso').length;
  const cerradosCount = correctivos.filter(c => c.estado === 'Cerrado').length;

  // Templates para la tabla
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
    else if (rowData.estado === 'En Proceso') severity = 'danger'; // severity="danger" en lugar de severity="info" para correctivos
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
            tooltip="Iniciar reparación"
            tooltipOptions={{ position: 'top' }}
            onClick={() => {
              setSelectedItem(rowData);
              setDialogIniciar(true);
            }}
          />
        )}
        {rowData.estado === 'En Proceso' && (
          <Button
            icon="pi pi-lock"
            severity="secondary"
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

  const headerToolbarLeft = () => {
    return (
      <Button
        label="Reportar Falla"
        icon="pi pi-exclamation-triangle"
        severity="danger"
        onClick={() => setDialogNuevo(true)}
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
          placeholder="Buscar..."
        />
      </IconField>
    );
  };

  const newMantenimientoDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={handleCancelNew} />
      <Button
        label="Reportar falla"
        icon="pi pi-exclamation-triangle"
        severity="danger"
        onClick={handleSaveMantenimiento}
      />
    </div>
  );

  const detailDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
      {selectedItem?.estado === 'Programado' && (
        <Button
          label="Iniciar reparación"
          severity="warning"
          onClick={() => {
            setDialogDetalle(false);
            setDialogIniciar(true);
          }}
        />
      )}
      {selectedItem?.estado === 'En Proceso' && (
        <Button
          label="Cerrar mantenimiento"
          severity="success"
          onClick={() => {
            setDialogDetalle(false);
            navigate('/mantenimientos/cerrar', { state: { id: selectedItem.id } });
          }}
        />
      )}
    </div>
  );

  const iniciarDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={() => setDialogIniciar(false)} />
      <Button
        label="Confirmar inicio"
        icon="pi pi-play"
        severity="warning"
        onClick={handleConfirmIniciar}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 m-0 mb-1">
            Mantenimientos Correctivos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 m-0">
            Registro y seguimiento de fallas y reparaciones en activos del HEP
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag value={`Total correctivos: ${totalCount}`} severity="info" className="px-3 py-2 text-sm" />
          <Tag value={`Programados: ${programadosCount}`} severity="warning" className="px-3 py-2 text-sm" />
          <Tag value={`En Proceso: ${enProcesoCount}`} severity="danger" className="px-3 py-2 text-sm" />
          <Tag value={`Cerrados: ${cerradosCount}`} severity="success" className="px-3 py-2 text-sm" />
        </div>
      </div>

      <Toolbar className="mb-4" left={headerToolbarLeft} right={headerToolbarRight} />

      {/* Tabla */}
      <div className="card shadow-sm border-round bg-white dark:bg-slate-900">
        <DataTable
          value={correctivos}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay mantenimientos correctivos registrados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          globalFilter={globalFilter}
          globalFilterFields={[
            'referencia',
            'codigoActivo',
            'nombreActivo',
            'categoria',
            'ubicacion',
            'responsableTecnico',
            'diagnostico',
            'creadoPor',
            'descripcionTrabajo',
            'observaciones'
          ]}
          sortMode="multiple"
        >
          <Column field="referencia" header="Referencia" sortable style={{ minWidth: '130px' }} />
          <Column field="codigoActivo" header="Código activo" sortable style={{ minWidth: '130px' }} />
          <Column field="nombreActivo" header="Nombre activo" sortable style={{ minWidth: '160px' }} />
          <Column field="categoria" header="Categoría" sortable style={{ minWidth: '150px' }} />
          <Column field="ubicacion" header="Ubicación" sortable style={{ minWidth: '140px' }} />
          <Column field="responsableTecnico" header="Técnico asignado" sortable style={{ minWidth: '160px' }} />
          <Column field="diagnostico" header="Diagnóstico" sortable style={{ minWidth: '150px' }} />
          <Column
            field="fechaProgramada"
            header="Fecha programada"
            body={row => formatDate(row.fechaProgramada)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column
            field="fechaInicio"
            header="Fecha inicio"
            body={row => formatDate(row.fechaInicio)}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column
            field="prioridad"
            header="Prioridad"
            body={prioridadBodyTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoBodyTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column header="Acciones" body={actionsBodyTemplate} style={{ minWidth: '160px' }} />
        </DataTable>
      </div>

      {/* Dialog Nuevo Mantenimiento Correctivo */}
      <Dialog
        header="Reportar Falla — Mantenimiento Correctivo"
        visible={dialogNuevo}
        style={{ width: '750px' }}
        modal
        resizable
        onHide={handleCancelNew}
        footer={newMantenimientoDialogFooter}
      >
        <div className="p-fluid">
          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">
            Identificación del Activo Afectado
          </h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="activo" className="block text-sm font-medium mb-1">
                Activo con falla <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="activo"
                value={formData.codigoActivo}
                onChange={e => handleActivoChange(e.value)}
                options={activosList.map(a => ({
                  label: `${a.codigoInstitucional} - ${a.nombre} (${a.numeroSerie})`,
                  value: a.codigoInstitucional
                }))}
                placeholder="Seleccione el activo con falla"
                filter
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label className="block text-sm font-medium mb-1 text-slate-400">
                Ubicación actual
              </label>
              <InputText
                value={formData.ubicacion}
                disabled
                placeholder="Se autocompleta al seleccionar el activo"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <Divider className="my-3" />

          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">Diagnóstico de la Falla</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="tipoFalla" className="block text-sm font-medium mb-1">
                Tipo de falla <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="tipoFalla"
                value={formData.diagnostico}
                onChange={e => handleFieldChange('diagnostico', e.value)}
                options={TIPO_FALLA}
                placeholder="Seleccione tipo de falla"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="prioridad" className="block text-sm font-medium mb-1">
                Prioridad
              </label>
              <Dropdown
                id="prioridad"
                value={formData.prioridad}
                onChange={e => handleFieldChange('prioridad', e.value)}
                options={PRIORIDADES}
                placeholder="Seleccione la prioridad"
              />
            </div>
            <div className="col-12 mb-3">
              <label htmlFor="descripcionTrabajo" className="block text-sm font-medium mb-1">
                Diagnóstico / descripción de la falla <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                id="descripcionTrabajo"
                rows={3}
                value={formData.descripcionTrabajo}
                onChange={e => handleFieldChange('descripcionTrabajo', e.target.value)}
                placeholder="Describa detalladamente la falla detectada, síntomas observados y condiciones en que ocurrió..."
              />
            </div>
          </div>

          <Divider className="my-3" />

          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">Asignación y Planificación</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="responsableTecnico" className="block text-sm font-medium mb-1">
                Técnico asignado <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="responsableTecnico"
                value={formData.responsableTecnico}
                onChange={e => handleFieldChange('responsableTecnico', e.value)}
                options={TECNICOS_MANTENIMIENTO}
                placeholder="Seleccione el técnico"
                filter
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="fechaProgramada" className="block text-sm font-medium mb-1">
                Fecha programada de atención <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fechaProgramada"
                value={formData.fechaProgramada}
                onChange={e => handleFieldChange('fechaProgramada', e.value)}
                dateFormat="dd/mm/yy"
                placeholder="DD/MM/AAAA"
                showIcon
                minDate={new Date()}
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="creadoPor" className="block text-sm font-medium mb-1">
                Reportado por <span className="text-red-500">*</span>
              </label>
              <InputText
                id="creadoPor"
                value={formData.creadoPor}
                onChange={e => handleFieldChange('creadoPor', e.target.value)}
                placeholder="Nombre de quien reporta la falla"
              />
            </div>
          </div>

          <Divider className="my-3" />

          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">Información adicional</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="repuestosEstimados" className="block text-sm font-medium mb-1">
                Repuestos estimados
              </label>
              <InputText
                id="repuestosEstimados"
                value={formData.repuestosUtilizados}
                onChange={e => handleFieldChange('repuestosUtilizados', e.target.value)}
                placeholder="Repuestos o materiales que podría requerir"
              />
            </div>
            <div className="col-12 mb-3">
              <label htmlFor="observaciones" className="block text-sm font-medium mb-1">
                Observaciones
              </label>
              <InputTextarea
                id="observaciones"
                rows={2}
                value={formData.observaciones}
                onChange={e => handleFieldChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog Detalle del Correctivo */}
      <Dialog
        header={
          <span className="flex align-items-center gap-2">
            <span>⚠ Detalle — {selectedItem?.referencia}</span>
          </span>
        }
        visible={dialogDetalle}
        style={{ width: '650px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={detailDialogFooter}
      >
        {selectedItem && (
          <div>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Referencia
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.referencia}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Tipo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.tipo}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Código activo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.codigoActivo}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Nombre activo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.nombreActivo}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Categoría
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.categoria}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Ubicación
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.ubicacion}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Técnico asignado
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.responsableTecnico}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Custodio
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.responsableCustodia}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Tipo de falla (diagnóstico)
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.diagnostico || '—'}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Prioridad
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.prioridad}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Fecha programada
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDate(selectedItem.fechaProgramada)}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Fecha inicio
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDate(selectedItem.fechaInicio)}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Fecha cierre
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {formatDate(selectedItem.fechaCierre)}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Creado por
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                  {selectedItem.creadoPor || '—'}
                </span>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Descripción del trabajo
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium block whitespace-pre-wrap">
                  {selectedItem.descripcionTrabajo || '—'}
                </span>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Repuestos utilizados
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium block whitespace-pre-wrap">
                  {selectedItem.repuestosUtilizados || '—'}
                </span>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  Observaciones
                </span>
                <span className="text-base text-slate-800 dark:text-slate-100 font-medium block whitespace-pre-wrap">
                  {selectedItem.observaciones || '—'}
                </span>
              </div>
            </div>

            {/* Tag grande con el estado actual */}
            <div className="text-center mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Estado Actual del Mantenimiento
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
                style={{ fontSize: '1.1rem', padding: '0.4rem 1.5rem' }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Iniciar Reparación */}
      <Dialog
        header="Iniciar Reparación"
        visible={dialogIniciar}
        style={{ width: '450px' }}
        modal
        onHide={() => setDialogIniciar(false)}
        footer={iniciarDialogFooter}
      >
        <div className="flex flex-column align-items-center text-center gap-3">
          <i className="pi pi-wrench text-orange-500" style={{ fontSize: '3rem' }} />
          <p className="m-0 text-lg">
            ¿Confirma el inicio de la reparación para:
            <br />
            <strong>{selectedItem?.nombreActivo}</strong>?
          </p>
          {selectedItem && (
            <div className="text-sm text-slate-500 font-mono">Ref: {selectedItem.referencia}</div>
          )}
          <Tag severity="danger" value="Una vez iniciado no podrá revertirse a Programado" className="mt-1" />

          <div className="w-full text-left mt-3">
            <label htmlFor="tecnicoInicia" className="block text-sm font-medium mb-1">
              Técnico que inicia
            </label>
            <InputText
              id="tecnicoInicia"
              value={tecnicoInicia}
              onChange={e => setTecnicoInicia(e.target.value)}
              placeholder="Nombre del técnico"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Correctivos;
