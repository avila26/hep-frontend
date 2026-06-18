import React, { useState, useRef } from 'react';
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
  'Ing. Carlos Ortega (TICs)',
  'Tec. Mario Vera (Mantenimiento General)',
  'Tec. Luis Paredes (Equipos Médicos)',
  'Tec. Rosa Mendez (Infraestructura)',
  'Ing. Sofia Ponce (Biomédica)'
];

export const UBICACIONES_HOSPITAL = [
  'UCI', 'Quirófano A', 'Quirófano B',
  'Emergencias', 'Hospitalización - Piso 1',
  'Hospitalización - Piso 2', 'Consulta Externa',
  'Laboratorio Clínico', 'Rayos X / Imagenología',
  'Área Administrativa', 'TICs', 'Bodega Central'
];

export const PRIORIDADES = ['Alta', 'Media', 'Baja'];

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
  observaciones: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  creadoPor: string;
  tipo: 'Preventivo';
  diagnostico: string;
  repuestosUtilizados: string;
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
  observaciones: '',
  prioridad: 'Media',
  creadoPor: '',
  tipo: 'Preventivo',
  diagnostico: '',
  repuestosUtilizados: ''
};

const Preventivos: React.FC = () => {
  const navigate = useNavigate();
  const { preventivos, agregarMantenimiento, iniciarMantenimiento } = useMantenimientosContext();
  const { activos } = useActivos();
  const activosList = activos || [];

  // Estados
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [dialogNuevo, setDialogNuevo] = useState<boolean>(false);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [dialogIniciar, setDialogIniciar] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MantenimientoHEP | null>(null);
  const [formData, setFormData] = useState<MantenimientoFormData>(initialFormData);

  const toast = useRef<Toast>(null);

  // Autocompletado al seleccionar activo
  const handleActivoChange = (codigoInst: string) => {
    const seleccionado = activosList.find(a => a.codigoInstitucional === codigoInst);
    if (seleccionado) {
      setFormData(prev => ({
        ...prev,
        codigoActivo: codigoInst,
        nombreActivo: seleccionado.nombre,
        categoria: seleccionado.categoriaActivo || 'Sin Categoría',
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
        detail: 'El Activo a mantener es obligatorio.',
        life: 3000
      });
      return false;
    }
    if (!formData.fechaProgramada) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'La Fecha programada es obligatoria.',
        life: 3000
      });
      return false;
    }
    if (!formData.responsableTecnico) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El Técnico responsable es obligatorio.',
        life: 3000
      });
      return false;
    }
    if (!formData.descripcionTrabajo.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'La Descripción del trabajo es obligatoria.',
        life: 3000
      });
      return false;
    }
    return true;
  };

  const handleSaveMantenimiento = () => {
    if (!validateForm()) return;

    const formattedDate = convertDateToYYYYMMDD(formData.fechaProgramada);

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
      summary: 'Éxito',
      detail: 'Mantenimiento preventivo registrado correctamente.',
      life: 3000
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
        summary: 'Éxito',
        detail: 'Mantenimiento iniciado correctamente',
        life: 3000
      });
      setDialogIniciar(false);
      setSelectedItem(null);
    }
  };

  // Contadores para el encabezado
  const totalCount = preventivos.length;
  const programadosCount = preventivos.filter(p => p.estado === 'Programado').length;
  const cerradosCount = preventivos.filter(p => p.estado === 'Cerrado').length;

  // Templates para la tabla
  const prioridadBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'danger' | 'warning' | 'success' | 'info' = 'info';
    if (rowData.prioridad === 'Alta') severity = 'danger';
    else if (rowData.prioridad === 'Media') severity = 'warning';
    else if (rowData.prioridad === 'Baja') severity = 'success';

    return <Tag value={rowData.prioridad} severity={severity} />;
  };

  const estadoBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'warning' | 'info' | 'success' | 'danger' = 'info';
    if (rowData.estado === 'Programado') severity = 'warning';
    else if (rowData.estado === 'En Proceso') severity = 'info';
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
            severity="success"
            rounded
            tooltip="Iniciar mantenimiento"
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
        label="Nuevo Mantenimiento"
        icon="pi pi-plus"
        severity="success"
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
      <Button label="Registrar" severity="success" onClick={handleSaveMantenimiento} />
    </div>
  );

  const detailDialogFooter = (
    <div className="flex justify-end pt-2">
      <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
    </div>
  );

  const iniciarDialogFooter = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancelar" severity="secondary" onClick={() => setDialogIniciar(false)} />
      <Button label="Confirmar inicio" severity="success" onClick={handleConfirmIniciar} />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 m-0 mb-1">
            Mantenimientos Preventivos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 m-0">
            Planificación y seguimiento de mantenimientos preventivos del HEP
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag value={`Total preventivos: ${totalCount}`} severity="info" className="px-3 py-2 text-sm" />
          <Tag value={`Programados: ${programadosCount}`} severity="warning" className="px-3 py-2 text-sm" />
          <Tag value={`Cerrados: ${cerradosCount}`} severity="success" className="px-3 py-2 text-sm" />
        </div>
      </div>

      <Toolbar className="mb-4" left={headerToolbarLeft} right={headerToolbarRight} />

      {/* Tabla */}
      <div className="card shadow-sm border-round bg-white dark:bg-slate-900">
        <DataTable
          value={preventivos}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay mantenimientos preventivos registrados"
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
          <Column field="responsableTecnico" header="Técnico responsable" sortable style={{ minWidth: '160px' }} />
          <Column
            field="fechaProgramada"
            header="Fecha programada"
            body={row => formatDate(row.fechaProgramada)}
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

      {/* Dialog Nuevo Mantenimiento */}
      <Dialog
        header="Registrar Mantenimiento Preventivo"
        visible={dialogNuevo}
        style={{ width: '700px' }}
        modal
        resizable
        onHide={handleCancelNew}
        footer={newMantenimientoDialogFooter}
      >
        <div className="p-fluid">
          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">Datos del Activo</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="activo" className="block text-sm font-medium mb-1">
                Activo a mantener <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="activo"
                value={formData.codigoActivo}
                onChange={e => handleActivoChange(e.value)}
                options={activosList.map(a => ({
                  label: `${a.codigoInstitucional} - ${a.nombre} (${a.numeroSerie})`,
                  value: a.codigoInstitucional
                }))}
                placeholder="Seleccione el activo a mantener"
                filter
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="fechaProgramada" className="block text-sm font-medium mb-1">
                Fecha programada <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fechaProgramada"
                value={formData.fechaProgramada}
                onChange={e => handleFieldChange('fechaProgramada', e.value)}
                dateFormat="dd/mm/yy"
                placeholder="DD/MM/AAAA"
                showIcon
              />
            </div>

            {/* Campos autocompletados */}
            <div className="col-12 md:col-6 mb-3">
              <label className="block text-sm font-medium mb-1 text-slate-400">
                Nombre del activo (Auto)
              </label>
              <InputText
                value={formData.nombreActivo}
                disabled
                placeholder="Se autocompleta al seleccionar el activo"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label className="block text-sm font-medium mb-1 text-slate-400">
                Categoría (Auto)
              </label>
              <InputText
                value={formData.categoria}
                disabled
                placeholder="Se autocompleta al seleccionar el activo"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label className="block text-sm font-medium mb-1 text-slate-400">
                Ubicación (Auto)
              </label>
              <InputText
                value={formData.ubicacion}
                disabled
                placeholder="Se autocompleta al seleccionar el activo"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label className="block text-sm font-medium mb-1 text-slate-400">
                Responsable Custodia (Auto)
              </label>
              <InputText
                value={formData.responsableCustodia}
                disabled
                placeholder="Se autocompleta al seleccionar el activo"
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <Divider className="my-3" />

          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">Responsables</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="responsableTecnico" className="block text-sm font-medium mb-1">
                Técnico responsable <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="responsableTecnico"
                value={formData.responsableTecnico}
                onChange={e => handleFieldChange('responsableTecnico', e.value)}
                options={TECNICOS_MANTENIMIENTO.map(t => ({ label: t, value: t }))}
                placeholder="Seleccione el técnico"
                filter
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="creadoPor" className="block text-sm font-medium mb-1">
                Creado por
              </label>
              <InputText
                id="creadoPor"
                value={formData.creadoPor}
                onChange={e => handleFieldChange('creadoPor', e.target.value)}
                placeholder="Nombre de quien registra"
              />
            </div>
          </div>

          <Divider className="my-3" />

          <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">Detalles</h5>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="prioridad" className="block text-sm font-medium mb-1">
                Prioridad
              </label>
              <Dropdown
                id="prioridad"
                value={formData.prioridad}
                onChange={e => handleFieldChange('prioridad', e.value)}
                options={PRIORIDADES.map(p => ({ label: p, value: p }))}
                placeholder="Seleccione la prioridad"
              />
            </div>
            <div className="col-12 mb-3">
              <label htmlFor="descripcionTrabajo" className="block text-sm font-medium mb-1">
                Descripción del trabajo <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                id="descripcionTrabajo"
                rows={3}
                value={formData.descripcionTrabajo}
                onChange={e => handleFieldChange('descripcionTrabajo', e.target.value)}
                placeholder="Describa las actividades de mantenimiento preventivo a realizar..."
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

      {/* Dialog Detalle */}
      <Dialog
        header={`Detalle — ${selectedItem?.referencia}`}
        visible={dialogDetalle}
        style={{ width: '600px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={detailDialogFooter}
      >
        {selectedItem && (
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
                Técnico responsable
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
                Prioridad
              </span>
              <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                {selectedItem.prioridad}
              </span>
            </div>
            <div className="col-12 md:col-6 mb-3">
              <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Estado
              </span>
              <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                {selectedItem.estado}
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
                Observaciones
              </span>
              <span className="text-base text-slate-800 dark:text-slate-100 font-medium block whitespace-pre-wrap">
                {selectedItem.observaciones || '—'}
              </span>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Iniciar */}
      <Dialog
        header="Iniciar Mantenimiento"
        visible={dialogIniciar}
        style={{ width: '400px' }}
        modal
        onHide={() => setDialogIniciar(false)}
        footer={iniciarDialogFooter}
      >
        <p className="m-0 leading-normal">
          ¿Confirma que desea iniciar el mantenimiento preventivo para <strong>{selectedItem?.nombreActivo}</strong>?
          <br />
          Se registrará la fecha de inicio como hoy.
        </p>
      </Dialog>
    </div>
  );
};

export default Preventivos;
