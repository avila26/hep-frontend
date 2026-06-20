import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Steps } from 'primereact/steps';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { useMantenimientosContext, MantenimientoHEP } from '../../context/MantenimientosContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
export const RESULTADO_MANTENIMIENTO = [
  { label: 'Reparado completamente', value: 'Reparado' },
  { label: 'Reparado parcialmente — requiere seguimiento', value: 'Reparado parcialmente' },
  { label: 'Requiere repuesto — en espera', value: 'Requiere repuesto' },
  { label: 'Dado de baja — no tiene reparación', value: 'Sin reparación' },
  { label: 'Mantenimiento preventivo completado', value: 'Preventivo completado' }
];

export const STEPS_CIERRE = [
  { label: 'Seleccionar' },
  { label: 'Documentar' },
  { label: 'Confirmar' }
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

interface FormCierre {
  descripcionTrabajo: string;
  repuestosUtilizados: string;
  observacionesCierre: string;
  resultadoMantenimiento: string;
  tecnicoCierra: string;
  conformidadCustodia: boolean;
}

const initialFormCierre: FormCierre = {
  descripcionTrabajo: '',
  repuestosUtilizados: '',
  observacionesCierre: '',
  resultadoMantenimiento: '',
  tecnicoCierra: '',
  conformidadCustodia: false
};

const CerrarMantenimiento: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { enProceso, obtenerPorId, cerrarMantenimiento } = useMantenimientosContext();

  // Estados
  const [activeStep, setActiveStep] = useState<number>(0);
  const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState<MantenimientoHEP | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [formCierre, setFormCierre] = useState<FormCierre>(initialFormCierre);
  const [dialogConfirmar, setDialogConfirmar] = useState<boolean>(false);
  const [dialogExito, setDialogExito] = useState<boolean>(false);
  const [cierreFechaHora, setCierreFechaHora] = useState<string>('');

  const toast = useRef<Toast>(null);

  // Inicialización
  useEffect(() => {
    const state = location.state as { id?: string } | null;
    if (state?.id) {
      const found = obtenerPorId(state.id);
      if (found && found.estado === 'En Proceso') {
        setMantenimientoSeleccionado(found);
        setActiveStep(1); // saltar directo al paso 2 (index 1 en Steps)
        // prellenar formCierre con datos existentes:
        setFormCierre(prev => ({
          ...prev,
          descripcionTrabajo: found.descripcionTrabajo || '',
          repuestosUtilizados: found.repuestosUtilizados || '',
          tecnicoCierra: found.responsableTecnico || ''
        }));
      }
    }
  }, [location.state, obtenerPorId]);

  const resetAll = () => {
    setActiveStep(0);
    setMantenimientoSeleccionado(null);
    setGlobalFilter('');
    setDialogConfirmar(false);
    setDialogExito(false);
    setFormCierre(initialFormCierre);
    setCierreFechaHora('');
  };

  const handleFieldChange = (key: keyof FormCierre, value: any) => {
    setFormCierre(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectMantenimiento = (row: MantenimientoHEP) => {
    setMantenimientoSeleccionado(row);
    setFormCierre({
      descripcionTrabajo: row.descripcionTrabajo || '',
      repuestosUtilizados: row.repuestosUtilizados || '',
      tecnicoCierra: row.responsableTecnico || '',
      resultadoMantenimiento: '',
      observacionesCierre: '',
      conformidadCustodia: false
    });
    setActiveStep(1);
  };

  const validatePaso1 = () => {
    if (!formCierre.descripcionTrabajo.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'La Descripción del trabajo realizado es obligatoria.',
        life: 3000
      });
      return false;
    }
    if (!formCierre.resultadoMantenimiento) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El Resultado del mantenimiento es obligatorio.',
        life: 3000
      });
      return false;
    }
    if (!formCierre.tecnicoCierra.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo faltante',
        detail: 'El Técnico que cierra es obligatorio.',
        life: 3000
      });
      return false;
    }
    return true;
  };

  const handleAdvanceToPaso2 = () => {
    if (validatePaso1()) {
      setActiveStep(2);
    }
  };

  const handleBackToPaso0 = () => {
    setActiveStep(0);
    setMantenimientoSeleccionado(null);
    setFormCierre(initialFormCierre);
  };

  const handleConfirmarCierreDefinitivo = () => {
    if (mantenimientoSeleccionado) {
      cerrarMantenimiento(
        mantenimientoSeleccionado.id,
        formCierre.descripcionTrabajo,
        formCierre.repuestosUtilizados,
        formCierre.observacionesCierre
      );
      setCierreFechaHora(new Date().toLocaleString());
      setDialogConfirmar(false);
      setDialogExito(true);
    }
  };

  // Plantillas de celdas para DataTable
  const tipoBodyTemplate = (rowData: MantenimientoHEP) => {
    const severity = rowData.tipo === 'Preventivo' ? 'info' : 'danger';
    return <Tag value={rowData.tipo} severity={severity} />;
  };

  const prioridadBodyTemplate = (rowData: MantenimientoHEP) => {
    let severity: 'danger' | 'warning' | 'success' | 'info' = 'info';
    if (rowData.prioridad === 'Alta') severity = 'danger';
    else if (rowData.prioridad === 'Media') severity = 'warning';
    else if (rowData.prioridad === 'Baja') severity = 'success';

    return <Tag value={rowData.prioridad} severity={severity} />;
  };

  const accionesBodyTemplate = (rowData: MantenimientoHEP) => {
    return (
      <Button
        label="Seleccionar"
        icon="pi pi-check"
        severity="success"
        onClick={() => handleSelectMantenimiento(rowData)}
      />
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="mb-4">
        <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 m-0 mb-1">
          Cerrar Mantenimiento
        </h1>
        <p className="text-slate-500 dark:text-slate-400 m-0">
          Documentación formal del cierre de trabajos de mantenimiento del HEP
        </p>
      </div>

      {/* Control de pasos */}
      <div className="card mb-4 bg-white dark:bg-slate-900 shadow-sm p-3 border-round">
        <Steps model={STEPS_CIERRE} activeIndex={activeStep} readOnly={true} />
      </div>

      {/* Resumen del mantenimiento seleccionado */}
      {mantenimientoSeleccionado && (
        <Card className="mb-4 shadow-sm bg-slate-50 dark:bg-slate-800">
          <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <div>
              <div className="flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                  {mantenimientoSeleccionado.referencia}
                </span>
                <Tag
                  value={mantenimientoSeleccionado.tipo}
                  severity={mantenimientoSeleccionado.tipo === 'Preventivo' ? 'info' : 'danger'}
                />
                <Tag value={mantenimientoSeleccionado.estado} severity="warning" />
              </div>
              <div className="grid">
                <div className="col-12 md:col-6 text-sm text-slate-600 dark:text-slate-300">
                  <strong>Activo:</strong> {mantenimientoSeleccionado.codigoActivo} -{' '}
                  {mantenimientoSeleccionado.nombreActivo}
                </div>
                <div className="col-12 md:col-6 text-sm text-slate-600 dark:text-slate-300">
                  <strong>Responsable:</strong> {mantenimientoSeleccionado.responsableTecnico}
                </div>
                <div className="col-12 md:col-6 text-sm text-slate-600 dark:text-slate-300">
                  <strong>Fecha de inicio:</strong> {formatDate(mantenimientoSeleccionado.fechaInicio)}
                </div>
                <div className="col-12 md:col-6 text-sm text-slate-600 dark:text-slate-300">
                  <strong>Ubicación:</strong> {mantenimientoSeleccionado.ubicacion}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/* PASO 0 — Seleccionar mantenimiento         */}
      {/* ========================================== */}
      {activeStep === 0 && (
        <Card className="shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 m-0 mb-2">
              Paso 1: Seleccionar mantenimiento en proceso
            </h3>
            <p className="text-slate-500 m-0">
              Seleccione el mantenimiento que desea cerrar de la lista de trabajos En Proceso.
            </p>
          </div>

          {enProceso.length === 0 ? (
            <div className="text-center p-5 bg-slate-50 dark:bg-slate-800 border-round border-1 border-slate-200 dark:border-slate-700">
              <i className="pi pi-info-circle text-4xl text-slate-400 mb-3" />
              <p className="m-0 text-slate-600 dark:text-slate-300 font-medium">
                No hay mantenimientos en proceso disponibles para cerrar.
              </p>
              <p className="m-0 text-slate-400 text-sm mt-1">
                Debe iniciar un mantenimiento desde Preventivos o Correctivos primero.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex justify-content-end mb-3">
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search" />
                  <InputText
                    type="search"
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full md:w-15rem"
                  />
                </IconField>
              </div>

              <DataTable
                value={enProceso}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay mantenimientos en proceso"
                stripedRows
                showGridlines
                responsiveLayout="scroll"
                globalFilter={globalFilter}
                sortMode="multiple"
              >
                <Column field="referencia" header="Referencia" sortable />
                <Column field="tipo" header="Tipo" body={tipoBodyTemplate} sortable />
                <Column field="codigoActivo" header="Código activo" sortable />
                <Column field="nombreActivo" header="Nombre activo" sortable />
                <Column field="ubicacion" header="Ubicación" sortable />
                <Column field="responsableTecnico" header="Técnico responsable" sortable />
                <Column
                  field="fechaInicio"
                  header="Fecha inicio"
                  body={row => formatDate(row.fechaInicio)}
                  sortable
                />
                <Column field="prioridad" header="Prioridad" body={prioridadBodyTemplate} sortable />
                <Column header="Acciones" body={accionesBodyTemplate} style={{ width: '150px' }} />
              </DataTable>
            </div>
          )}
        </Card>
      )}

      {/* ========================================== */}
      {/* PASO 1 — Documentar cierre                 */}
      {/* ========================================== */}
      {activeStep === 1 && (
        <Card className="shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 m-0">
              Paso 2: Documentar cierre
            </h3>
            <p className="text-slate-500 m-0">
              Complete los detalles técnicos del trabajo finalizado.
            </p>
          </div>

          <div className="p-fluid">
            {/* SECCIÓN 1: Resumen del trabajo realizado */}
            <div className="mb-4">
              <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">
                Resumen del trabajo realizado
              </h5>
              <div className="grid">
                <div className="col-12 mb-3">
                  <label htmlFor="descripcionTrabajo" className="block text-sm font-medium mb-1">
                    Descripción del trabajo realizado <span className="text-red-500">*</span>
                  </label>
                  <InputTextarea
                    id="descripcionTrabajo"
                    rows={4}
                    value={formCierre.descripcionTrabajo}
                    onChange={e => handleFieldChange('descripcionTrabajo', e.target.value)}
                    placeholder="Detalle todas las actividades realizadas durante el mantenimiento, procedimientos aplicados y estado final del equipo..."
                  />
                </div>
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="resultadoMantenimiento" className="block text-sm font-medium mb-1">
                    Resultado del mantenimiento <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="resultadoMantenimiento"
                    value={formCierre.resultadoMantenimiento}
                    onChange={e => handleFieldChange('resultadoMantenimiento', e.value)}
                    options={RESULTADO_MANTENIMIENTO}
                    placeholder="Seleccione el resultado obtenido"
                  />
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            {/* SECCIÓN 2: Materiales y recursos utilizados */}
            <div className="mb-4">
              <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">
                Materiales y recursos utilizados
              </h5>
              <div className="grid">
                <div className="col-12 mb-3">
                  <label htmlFor="repuestosUtilizados" className="block text-sm font-medium mb-1">
                    Repuestos y materiales utilizados
                  </label>
                  <InputTextarea
                    id="repuestosUtilizados"
                    rows={3}
                    value={formCierre.repuestosUtilizados}
                    onChange={e => handleFieldChange('repuestosUtilizados', e.target.value)}
                    placeholder="Liste los repuestos, materiales y herramientas utilizados durante el mantenimiento (uno por línea)..."
                  />
                </div>
                <div className="col-12 md:col-6 mb-3">
                  <label htmlFor="tecnicoCierra" className="block text-sm font-medium mb-1">
                    Técnico que cierra <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="tecnicoCierra"
                    value={formCierre.tecnicoCierra}
                    onChange={e => handleFieldChange('tecnicoCierra', e.target.value)}
                    placeholder="Nombre completo del técnico"
                  />
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            {/* SECCIÓN 3: Observaciones finales */}
            <div className="mb-4">
              <h5 className="text-slate-600 dark:text-slate-300 font-semibold mb-2">
                Observaciones finales
              </h5>
              <div className="grid">
                <div className="col-12 mb-3">
                  <label htmlFor="observacionesCierre" className="block text-sm font-medium mb-1">
                    Observaciones del cierre
                  </label>
                  <InputTextarea
                    id="observacionesCierre"
                    rows={3}
                    value={formCierre.observacionesCierre}
                    onChange={e => handleFieldChange('observacionesCierre', e.target.value)}
                    placeholder="Recomendaciones, próximas acciones, advertencias sobre el equipo o cualquier observación relevante para el historial..."
                  />
                </div>
                <div className="col-12 md:col-6 mb-3">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-user text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      ¿El custodio del activo dio su conformidad con el trabajo realizado?
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      label="Sí"
                      icon="pi pi-check"
                      severity="success"
                      outlined={!formCierre.conformidadCustodia}
                      onClick={() => handleFieldChange('conformidadCustodia', true)}
                      className="w-6rem"
                    />
                    <Button
                      label="No"
                      icon="pi pi-times"
                      severity="danger"
                      outlined={formCierre.conformidadCustodia}
                      onClick={() => handleFieldChange('conformidadCustodia', false)}
                      className="w-6rem"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones Navegación Paso 1 */}
          <div className="flex justify-content-between pt-4">
            <Button
              label="Volver"
              icon="pi pi-arrow-left"
              severity="secondary"
              onClick={handleBackToPaso0}
            />
            <Button
              label="Revisar y confirmar"
              icon="pi pi-arrow-right"
              iconPos="right"
              severity="success"
              onClick={handleAdvanceToPaso2}
            />
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/* PASO 2 — Confirmar cierre                  */}
      {/* ========================================== */}
      {activeStep === 2 && mantenimientoSeleccionado && (
        <Card className="shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 m-0 mb-1">
              Paso 3: Confirmar cierre
            </h3>
            <p className="text-slate-500 m-0">
              Resumen del cierre — verifique antes de confirmar
            </p>
          </div>

          <div className="grid bg-slate-50 dark:bg-slate-800 p-4 border-round border-1 border-slate-200 dark:border-slate-700 mb-4">
            {/* DATOS DEL ACTIVO */}
            <div className="col-12 md:col-6 mb-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 m-0 mb-3 border-b border-slate-200 dark:border-slate-700 pb-1">
                Datos del activo y mantenimiento
              </h5>
              <div className="flex flex-column gap-2">
                <div>
                  <span className="text-slate-500 text-xs block">Referencia:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-semibold">
                    {mantenimientoSeleccionado.referencia}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Tipo:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {mantenimientoSeleccionado.tipo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Activo:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {mantenimientoSeleccionado.codigoActivo} - {mantenimientoSeleccionado.nombreActivo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Categoría:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {mantenimientoSeleccionado.categoria}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Ubicación:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {mantenimientoSeleccionado.ubicacion}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Técnico Responsable Original:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {mantenimientoSeleccionado.responsableTecnico}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Fecha Programada:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {formatDate(mantenimientoSeleccionado.fechaProgramada)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Fecha de Inicio:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {formatDate(mantenimientoSeleccionado.fechaInicio)}
                  </span>
                </div>
              </div>
            </div>

            {/* DATOS DEL CIERRE */}
            <div className="col-12 md:col-6 mb-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 m-0 mb-3 border-b border-slate-200 dark:border-slate-700 pb-1">
                Datos del cierre
              </h5>
              <div className="flex flex-column gap-2">
                <div>
                  <span className="text-slate-500 text-xs block">Técnico que cierra:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-semibold">
                    {formCierre.tecnicoCierra}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Resultado del mantenimiento:</span>
                  <Tag
                    value={formCierre.resultadoMantenimiento}
                    severity={
                      formCierre.resultadoMantenimiento === 'Sin reparación' ? 'danger' : 'success'
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Conformidad del custodio:</span>
                  <Tag
                    value={formCierre.conformidadCustodia ? 'Sí (Conforme)' : 'No (No Conforme)'}
                    severity={formCierre.conformidadCustodia ? 'success' : 'danger'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Fecha de cierre:</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {formatDate(new Date())}
                  </span>
                </div>
              </div>
            </div>

            <Divider className="col-12 my-2" />

            {/* TRABAJO REALIZADO */}
            <div className="col-12 mt-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 m-0 mb-2">
                Trabajo realizado y observaciones
              </h5>
              <div className="flex flex-column gap-3">
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Descripción del trabajo realizado:</span>
                  <div className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 border-round border-1 border-slate-200 dark:border-slate-700">
                    {formCierre.descripcionTrabajo}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Repuestos y materiales utilizados:</span>
                  <div className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 border-round border-1 border-slate-200 dark:border-slate-700">
                    {formCierre.repuestosUtilizados || 'Ninguno'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Observaciones del cierre:</span>
                  <div className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 border-round border-1 border-slate-200 dark:border-slate-700">
                    {formCierre.observacionesCierre || 'Ninguna'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de no reversibilidad */}
          <div className="p-3 border-round bg-yellow-50 border-1 border-yellow-200 text-yellow-850 flex align-items-center gap-2 mb-4">
            <i className="pi pi-exclamation-triangle text-xl text-yellow-600" />
            <span className="font-medium text-sm">
              Una vez confirmado el cierre, el mantenimiento pasará a estado CERRADO y no podrá modificarse.
            </span>
          </div>

          {/* Botones Navegación Paso 2 */}
          <div className="flex justify-content-between pt-2">
            <Button
              label="Editar documentación"
              icon="pi pi-pencil"
              severity="secondary"
              onClick={() => setActiveStep(1)}
            />
            <Button
              label="Confirmar cierre definitivo"
              icon="pi pi-lock"
              severity="success"
              onClick={() => setDialogConfirmar(true)}
            />
          </div>
        </Card>
      )}

      {/* DIALOG: Confirmar cierre definitivo */}
      <Dialog
        header="Confirmar cierre"
        visible={dialogConfirmar}
        style={{ width: '420px' }}
        modal
        onHide={() => setDialogConfirmar(false)}
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setDialogConfirmar(false)} />
            <Button
              label="Sí, cerrar definitivamente"
              icon="pi pi-check"
              severity="success"
              onClick={handleConfirmarCierreDefinitivo}
            />
          </div>
        }
      >
        <div className="flex flex-column align-items-center text-center gap-3">
          <i className="pi pi-lock-open text-green-500" style={{ fontSize: '3rem' }} />
          <p className="m-0 text-lg">
            ¿Está seguro de cerrar definitivamente el mantenimiento <br />
            <strong>{mantenimientoSeleccionado?.referencia}</strong>?
          </p>
          <span className="text-slate-400 text-sm">Esta acción no puede deshacerse.</span>
        </div>
      </Dialog>

      {/* DIALOG: Cierre exitoso */}
      <Dialog
        header="✓ Mantenimiento cerrado exitosamente"
        visible={dialogExito}
        style={{ width: '500px' }}
        modal
        closable={false}
        onHide={() => {}}
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              label="Ver historial"
              icon="pi pi-history"
              severity="info"
              onClick={() => {
                resetAll();
                navigate('/mantenimientos/historial');
              }}
            />
            <Button label="Cerrar otro mantenimiento" icon="pi pi-plus" severity="success" onClick={resetAll} />
          </div>
        }
      >
        <div className="flex flex-column align-items-center text-center gap-3">
          <i className="pi pi-check-circle text-green-500" style={{ fontSize: '4.5rem' }} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 m-0">
            ¡Mantenimiento cerrado!
          </h2>
          {mantenimientoSeleccionado && (
            <div className="flex flex-column align-items-center gap-2">
              <span className="text-lg text-slate-600 dark:text-slate-350">
                Referencia: <strong>{mantenimientoSeleccionado.referencia}</strong>
              </span>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Resultado:</span>
                <Tag value={formCierre.resultadoMantenimiento} severity="success" />
              </div>
              <div className="text-xs text-slate-400 mt-2">Cerrado el: {cierreFechaHora}</div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default CerrarMantenimiento;
