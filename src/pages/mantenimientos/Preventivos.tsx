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
import { Chip } from 'primereact/chip';
import { Checkbox } from 'primereact/checkbox';
import { useMantenimientosContext, MantenimientoHEP } from '../../context/MantenimientosContext';
import { useActivos, Activo } from '../../context/ActivosContext';

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
  responsableTecnico: string;
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
  responsableTecnico: '',
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

  // Nuevos Estados
  const [paso, setPaso] = useState<1 | 2>(1);
  const [filtros, setFiltros] = useState({ busqueda: '', categoria: '', ubicacion: '' });
  const [activosSeleccionados, setActivosSeleccionados] = useState<Activo[]>([]);

  const toast = useRef<Toast>(null);

  // Helper to check provider coverage
  const hasActiveProviderCoverage = (a: Activo): boolean => {
    if (!a.tieneCoberturaProveedor || !a.fechaFinCobertura) return false;
    const finCobertura = new Date(a.fechaFinCobertura);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    finCobertura.setHours(0, 0, 0, 0);
    return finCobertura >= hoy;
  };

  // Filtrado de activos
  const listableActivos = activosList.filter(a => !hasActiveProviderCoverage(a));

  const matchBusqueda = (a: Activo) => {
    if (!filtros.busqueda.trim()) return true;
    const searchVal = filtros.busqueda.toLowerCase();
    return (
      a.codigoInstitucional?.toLowerCase().includes(searchVal) ||
      a.nombre?.toLowerCase().includes(searchVal) ||
      a.numeroSerie?.toLowerCase().includes(searchVal)
    );
  };

  const matchCategoria = (a: Activo) => {
    if (!filtros.categoria) return true;
    return a.categoriaActivo === filtros.categoria;
  };

  const matchUbicacion = (a: Activo) => {
    if (!filtros.ubicacion) return true;
    return a.ubicacion === filtros.ubicacion;
  };

  const activosFiltrados = listableActivos.filter(
    a => matchBusqueda(a) && matchCategoria(a) && matchUbicacion(a)
  );

  // Opciones de filtros
  const categoriasOptions = Array.from(
    new Set(activosList.map(a => a.categoriaActivo).filter(Boolean))
  ).map(cat => ({ label: cat, value: cat }));

  const ubicacionesOptions = Array.from(
    new Set(activosList.map(a => a.ubicacion).filter(Boolean))
  ).map(ub => ({ label: ub, value: ub }));

  // Selección masiva contextual
  const unFiltroActivo = !!(filtros.busqueda.trim() || filtros.categoria || filtros.ubicacion);

  let activeFilterLabel = '';
  let activeFilterIcon = 'pi pi-filter';

  if (filtros.ubicacion) {
    activeFilterLabel = `ubicación "${filtros.ubicacion}"`;
    activeFilterIcon = 'pi pi-map-marker';
  } else if (filtros.categoria) {
    activeFilterLabel = `categoría "${filtros.categoria}"`;
    activeFilterIcon = 'pi pi-tag';
  } else if (filtros.busqueda.trim()) {
    activeFilterLabel = `búsqueda "${filtros.busqueda.trim()}"`;
    activeFilterIcon = 'pi pi-search';
  }

  const todosFiltradosSeleccionados =
    activosFiltrados.length > 0 &&
    activosFiltrados.every(a => activosSeleccionados.some(sel => sel.idActivo === a.idActivo));

  const countSelectedInFiltered = activosFiltrados.filter(a =>
    activosSeleccionados.some(sel => sel.idActivo === a.idActivo)
  ).length;

  const checkedAllFiltered =
    activosFiltrados.length > 0 && countSelectedInFiltered === activosFiltrados.length;
  const indeterminateAllFiltered =
    countSelectedInFiltered > 0 && countSelectedInFiltered < activosFiltrados.length;

  const selectAllFilteredRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllFilteredRef.current) {
      selectAllFilteredRef.current.indeterminate = indeterminateAllFiltered;
    }
  }, [indeterminateAllFiltered]);

  // Handlers de selección
  const handleToggleAsset = (activo: Activo) => {
    setActivosSeleccionados(prev => {
      const exists = prev.some(sel => sel.idActivo === activo.idActivo);
      if (exists) {
        return prev.filter(sel => sel.idActivo !== activo.idActivo);
      } else {
        return [...prev, activo];
      }
    });
  };

  const handleToggleAllFiltered = (checked: boolean) => {
    if (checked) {
      setActivosSeleccionados(prev => {
        const newSelection = [...prev];
        activosFiltrados.forEach(a => {
          if (!newSelection.some(sel => sel.idActivo === a.idActivo)) {
            newSelection.push(a);
          }
        });
        return newSelection;
      });
    } else {
      setActivosSeleccionados(prev =>
        prev.filter(sel => !activosFiltrados.some(a => a.idActivo === sel.idActivo))
      );
    }
  };

  const handleRemoveAsset = (idActivo: number) => {
    setActivosSeleccionados(prev => prev.filter(sel => sel.idActivo !== idActivo));
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

  const resetFormAndSteps = () => {
    setFormData(initialFormData);
    setActivosSeleccionados([]);
    setFiltros({ busqueda: '', categoria: '', ubicacion: '' });
    setPaso(1);
  };

  const validateForm = () => {
    if (activosSeleccionados.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Falta selección',
        detail: 'Debe seleccionar al menos un activo.',
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

    activosSeleccionados.forEach(activo => {
      agregarMantenimiento({
        codigoActivo: activo.codigoInstitucional,
        nombreActivo: activo.nombre,
        categoria: activo.categoriaActivo || 'Sin Categoría',
        ubicacion: activo.ubicacion || 'Sin Ubicación',
        responsableTecnico: formData.responsableTecnico,
        responsableCustodia: activo.responsableEntrega || 'Sin Custodio',
        fechaProgramada: formattedDate,
        descripcionTrabajo: formData.descripcionTrabajo,
        diagnostico: formData.diagnostico || '',
        repuestosUtilizados: formData.repuestosUtilizados || '',
        observaciones: formData.observaciones,
        prioridad: formData.prioridad,
        creadoPor: formData.creadoPor,
        tipo: formData.tipo
      });
    });

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: `${activosSeleccionados.length} mantenimiento(s) preventivo(s) registrado(s) correctamente.`,
      life: 3000
    });

    setDialogNuevo(false);
    resetFormAndSteps();
  };

  const handleCancelNew = () => {
    setDialogNuevo(false);
    resetFormAndSteps();
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

  const newMantenimientoDialogFooter = paso === 1 ? (
    <div className="flex align-items-center justify-content-between w-full pt-2">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {activosSeleccionados.length} activo(s) seleccionado(s)
      </div>
      <div className="flex gap-2">
        <Button label="Cancelar" severity="secondary" onClick={handleCancelNew} />
        <Button
          label="Continuar →"
          severity="success"
          disabled={activosSeleccionados.length === 0}
          onClick={() => setPaso(2)}
        />
      </div>
    </div>
  ) : (
    <div className="flex align-items-center justify-content-between w-full pt-2">
      <Button
        label="← Volver"
        severity="secondary"
        outlined
        onClick={() => setPaso(1)}
      />
      <div className="flex gap-2">
        <Button label="Cancelar" severity="secondary" onClick={handleCancelNew} />
        <Button
          label={`Registrar ${activosSeleccionados.length} mantenimiento(s)`}
          severity="success"
          onClick={handleSaveMantenimiento}
        />
      </div>
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
        style={{ width: '750px' }}
        modal
        resizable
        onHide={handleCancelNew}
        footer={newMantenimientoDialogFooter}
      >
        <div className="p-fluid">
          {paso === 1 ? (
            <div>
              <h5 className="text-slate-650 dark:text-slate-350 font-semibold mb-2">Paso 1: Selección de Activos</h5>
              
              {/* Barra de Filtros */}
              <div className="grid mb-3">
                <div className="col-12 md:col-4">
                  <label htmlFor="searchFilter" className="block text-sm font-medium mb-1">
                    Buscar activo
                  </label>
                  <IconField iconPosition="left" className="w-full">
                    <InputIcon className="pi pi-search" />
                    <InputText
                      id="searchFilter"
                      value={filtros.busqueda}
                      onChange={e => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                      placeholder="Código, nombre o serie..."
                      className="w-full"
                    />
                  </IconField>
                </div>
                <div className="col-12 md:col-4">
                  <label htmlFor="categoriaFilter" className="block text-sm font-medium mb-1">
                    Categoría
                  </label>
                  <Dropdown
                    id="categoriaFilter"
                    value={filtros.categoria}
                    options={categoriasOptions}
                    onChange={e => setFiltros(prev => ({ ...prev, categoria: e.value }))}
                    placeholder="Todas las categorías"
                    showClear
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-4">
                  <label htmlFor="ubicacionFilter" className="block text-sm font-medium mb-1">
                    Ubicación
                  </label>
                  <Dropdown
                    id="ubicacionFilter"
                    value={filtros.ubicacion}
                    options={ubicacionesOptions}
                    onChange={e => setFiltros(prev => ({ ...prev, ubicacion: e.value }))}
                    placeholder="Todas las ubicaciones"
                    showClear
                    className="w-full"
                  />
                </div>
              </div>

              {/* Botón de selección masiva contextual */}
              {unFiltroActivo && (
                <div className="mb-3">
                  <Button
                    type="button"
                    label={`${
                      todosFiltradosSeleccionados ? 'Deseleccionar' : 'Seleccionar'
                    } todos los bienes de ${activeFilterLabel} (${activosFiltrados.length})`}
                    icon={activeFilterIcon}
                    severity="warning"
                    className="w-full"
                    onClick={() => handleToggleAllFiltered(!todosFiltradosSeleccionados)}
                  />
                </div>
              )}

              {/* Checkbox Seleccionar Todos / Deseleccionar Todos (Filtrados) */}
              <div className="flex align-items-center gap-2 mb-2 px-2 py-1 bg-slate-50 dark:bg-slate-800/40 border-round">
                <Checkbox
                  id="selectAllFiltered"
                  checked={checkedAllFiltered}
                  inputRef={selectAllFilteredRef}
                  onChange={() => handleToggleAllFiltered(!checkedAllFiltered)}
                />
                <label
                  htmlFor="selectAllFiltered"
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  Seleccionar todos / Deseleccionar todos (Filtrados)
                </label>
              </div>

              {/* Lista scrolleable de activos */}
              <div className="border-1 border-slate-200 dark:border-slate-700 border-round overflow-hidden">
                {/* Cabecera de la lista */}
                <div className="flex align-items-center gap-3 p-2.5 bg-slate-100 dark:bg-slate-800 border-bottom-1 border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div style={{ width: '20px' }}></div>
                  <div className="flex-1 flex gap-2">
                    <span style={{ width: '100px' }}>Código</span>
                    <span style={{ flex: 2 }}>Nombre</span>
                    <span style={{ flex: 1.2 }}>Categoría</span>
                    <span style={{ flex: 1.2 }}>Ubicación</span>
                    <span style={{ width: '120px' }}>Serie</span>
                  </div>
                </div>
                {/* Cuerpo scrolleable */}
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {activosFiltrados.map(a => {
                    const isSelected = activosSeleccionados.some(sel => sel.idActivo === a.idActivo);
                    return (
                      <div
                        key={a.idActivo}
                        onClick={() => handleToggleAsset(a)}
                        className={`flex align-items-center gap-3 p-2.5 border-bottom-1 border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-green-50 text-green-950 dark:bg-green-950/20 dark:text-green-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        <Checkbox checked={isSelected} onChange={() => {}} />
                        <div className="flex-1 flex gap-2 text-sm align-items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200" style={{ width: '100px' }}>
                            {a.codigoInstitucional}
                          </span>
                          <span className="text-slate-755 dark:text-slate-300 font-medium" style={{ flex: 2 }}>
                            {a.nombre}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-xs" style={{ flex: 1.2 }}>
                            {a.categoriaActivo || '—'}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-xs" style={{ flex: 1.2 }}>
                            {a.ubicacion || '—'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-500 text-xs" style={{ width: '120px' }}>
                            {a.numeroSerie || '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {activosFiltrados.length === 0 && (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No hay activos disponibles que coincidan con los filtros.
                    </div>
                  )}
                </div>
              </div>

              {/* Chips de activos seleccionados */}
              <div className="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto p-1">
                {activosSeleccionados.map(a => (
                  <Chip
                    key={a.idActivo}
                    label={`${a.codigoInstitucional} - ${a.nombre}`}
                    removable
                    onRemove={() => {
                      handleRemoveAsset(a.idActivo);
                      return true;
                    }}
                    className="text-xs"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h5 className="text-slate-650 dark:text-slate-350 font-semibold mb-2">Paso 2: Datos del Mantenimiento</h5>
              
              {/* Resumen visual de seleccionados */}
              <div className="p-3 mb-3 bg-slate-50 dark:bg-slate-850/50 border-round">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Activos Seleccionados ({activosSeleccionados.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {activosSeleccionados.map(a => (
                    <Tag
                      key={a.idActivo}
                      value={`${a.codigoInstitucional} - ${a.nombre}`}
                      severity="info"
                    />
                  ))}
                </div>
              </div>

              {/* Formulario de Mantenimiento (Paso 2) */}
              <div className="grid">
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
          )}
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
