import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Steps } from 'primereact/steps';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { useBajasContext, InformeBajaHEP } from '../../context/BajasContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const STEPS_EGRESO = [
  { label: 'Seleccionar' },
  { label: 'Confirmar datos' },
  { label: 'Egreso registrado' }
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

const initialFormEgreso = {
  motivoEgreso: '',
  registradoPorEgreso: ''
};

const Egresos: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { aprobados, confirmarEgreso, obtenerPorId } = useBajasContext();

  // Estados
  const [activeStep, setActiveStep] = useState<number>(0);
  const [informeSeleccionado, setInformeSeleccionado] = useState<InformeBajaHEP | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [formEgreso, setFormEgreso] = useState(initialFormEgreso);
  const [dialogConfirmar, setDialogConfirmar] = useState<boolean>(false);

  const toast = useRef<Toast>(null);

  // Inicialización desde useLocation state
  useEffect(() => {
    const state = location.state as { id?: string } | null;
    if (state?.id) {
      const found = obtenerPorId(state.id);
      if (found && found.estado === 'Procesado') {
        setInformeSeleccionado(found);
        setActiveStep(1);
      }
    }
  }, [location.state, obtenerPorId]);

  // Filtrado de informes para el paso 0
  const informesProcesados = useMemo(() => {
    const list = aprobados.filter(i => i.estado === 'Procesado');
    if (!globalFilter.trim()) return list;
    const query = globalFilter.toLowerCase();
    return list.filter(
      i =>
        i.referencia.toLowerCase().includes(query) ||
        i.elaboradoPor.toLowerCase().includes(query) ||
        (i.aprobadoPor && i.aprobadoPor.toLowerCase().includes(query))
    );
  }, [aprobados, globalFilter]);

  const resetAll = () => {
    setActiveStep(0);
    setInformeSeleccionado(null);
    setGlobalFilter('');
    setDialogConfirmar(false);
    setFormEgreso(initialFormEgreso);
  };

  const handleSeleccionarInforme = (row: InformeBajaHEP) => {
    setInformeSeleccionado(row);
    setActiveStep(1);
  };

  const handleVolverPaso0 = () => {
    setActiveStep(0);
    setInformeSeleccionado(null);
    setFormEgreso(initialFormEgreso);
  };

  const handleRevisarConfirmar = () => {
    if (!formEgreso.motivoEgreso.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Debe especificar el motivo formal del egreso.',
        life: 3000
      });
      return;
    }

    if (!formEgreso.registradoPorEgreso.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Debe ingresar el nombre del responsable del egreso.',
        life: 3000
      });
      return;
    }

    setDialogConfirmar(true);
  };

  const handleConfirmarEgresoDefinitivo = () => {
    if (!informeSeleccionado) return;

    confirmarEgreso(informeSeleccionado.id, formEgreso.motivoEgreso, formEgreso.registradoPorEgreso);

    setDialogConfirmar(false);
    setActiveStep(2);
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="mb-4">
        <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
          Registro de Egresos
        </h1>
        <p className="text-slate-500 m-0 mb-4">
          Confirmación final del egreso de bienes dados de baja del HEP
        </p>
        <div className="card bg-white p-3 border-round shadow-sm">
          <Steps model={STEPS_EGRESO} activeIndex={activeStep} readOnly={true} />
        </div>
      </div>

      {/* Card de Resumen de Informe Seleccionado */}
      {informeSeleccionado && activeStep < 2 && (
        <Card className="mb-4 shadow-sm border-round border-1 border-200">
          <div className="flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="flex align-items-center gap-2">
              <span className="text-xl font-bold text-slate-800">{informeSeleccionado.referencia}</span>
              <Tag value={informeSeleccionado.estado} severity="info" />
            </div>
            <div className="flex gap-4 flex-wrap text-sm text-slate-600">
              <div>
                <strong>Bienes incluidos:</strong> {informeSeleccionado.bienes.length} bien(es)
              </div>
              <div>
                <strong>Aprobado por:</strong> {informeSeleccionado.aprobadoPor || '—'}
              </div>
              <div>
                <strong>Fecha aprobación:</strong> {formatDate(informeSeleccionado.fechaAprobacion)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/*  PASO 0: Seleccionar informe               */}
      {/* ========================================== */}
      {activeStep === 0 && (
        <Card className="shadow-sm border-round">
          <div className="flex align-items-center gap-2 mb-3 bg-blue-50 text-blue-700 p-3 border-round border-left-3 border-blue-500 text-sm">
            <i className="pi pi-info-circle text-lg" />
            <span>
              Seleccione el informe en estado <strong>Procesado</strong> para registrar el egreso definitivo de sus bienes.
            </span>
          </div>

          <div className="flex justify-content-end mb-3">
            <IconField iconPosition="left">
              <InputIcon className="pi pi-search" />
              <InputText
                type="search"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Buscar por referencia, creador..."
                style={{ width: '280px' }}
              />
            </IconField>
          </div>

          <DataTable
            value={informesProcesados}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            emptyMessage="No hay informes listos para egreso. Los informes deben estar Aprobados y derivados al proceso administrativo primero desde el módulo Aprobados."
          >
            <Column field="referencia" header="Referencia" sortable style={{ minWidth: '140px' }} />
            <Column
              header="Bienes incluidos"
              body={row => <span className="font-semibold">{row.bienes.length} bien(es)</span>}
              style={{ minWidth: '150px' }}
            />
            <Column field="aprobadoPor" header="Aprobado por" sortable style={{ minWidth: '180px' }} />
            <Column
              field="fechaAprobacion"
              header="Fecha aprobación"
              body={row => formatDate(row.fechaAprobacion)}
              sortable
              style={{ minWidth: '150px' }}
            />
            <Column
              header="Acción"
              body={(row: InformeBajaHEP) => (
                <Button
                  label="Seleccionar para egresar"
                  icon="pi pi-arrow-right"
                  severity="success"
                  onClick={() => handleSeleccionarInforme(row)}
                />
              )}
              style={{ width: '220px', textAlign: 'center' }}
            />
          </DataTable>
        </Card>
      )}

      {/* ========================================== */}
      {/*  PASO 1: Confirmar datos del egreso        */}
      {/* ========================================== */}
      {activeStep === 1 && informeSeleccionado && (
        <Card className="shadow-sm border-round">
          {/* Bienes que serán egresados */}
          <div className="mb-4">
            <div className="flex align-items-center gap-2 mb-3 text-orange-700 bg-orange-50 p-3 border-round border-left-3 border-orange-500 text-sm">
              <i className="pi pi-exclamation-triangle text-lg" />
              <span className="font-bold">
                Los siguientes bienes cambiarán su disponibilidad a EGRESADO de forma irreversible.
              </span>
            </div>
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Bienes que serán egresados</h5>
            <DataTable
              value={informeSeleccionado.bienes}
              size="small"
              stripedRows
              showGridlines
              emptyMessage="No hay bienes incluidos."
            >
              <Column field="codigoActivo" header="Código" />
              <Column field="nombreActivo" header="Nombre" />
              <Column field="categoria" header="Categoría" />
              <Column field="ubicacion" header="Ubicación" />
              <Column field="custodioActual" header="Custodio actual" />
            </DataTable>
          </div>

          <Divider className="my-4" />

          {/* Resumen del informe técnico */}
          <div className="mb-4">
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Resumen del informe técnico</h5>
            <div className="p-3 border-round bg-slate-50 border-1 border-200 grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Referencia
                </span>
                <span className="text-sm font-medium text-slate-700">{informeSeleccionado.referencia}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tipo solicitante
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {informeSeleccionado.tipoSolicitante === 'TICS' ? 'TICs' : 'Mantenimiento'}
                </span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Elaborado por
                </span>
                <span className="text-sm font-medium text-slate-700">{informeSeleccionado.elaboradoPor}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Aprobado por
                </span>
                <span className="text-sm font-medium text-slate-700">{informeSeleccionado.aprobadoPor || '—'}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Fecha elaboración
                </span>
                <span className="text-sm font-medium text-slate-700">{formatDate(informeSeleccionado.fechaElaboracion)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Fecha aprobación
                </span>
                <span className="text-sm font-medium text-slate-700">{formatDate(informeSeleccionado.fechaAprobacion)}</span>
              </div>
              <div className="col-12 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Justificación técnica
                </span>
                <p className="m-0 text-sm text-slate-700 whitespace-pre-wrap">{informeSeleccionado.justificacionTecnica}</p>
              </div>
              <div className="col-12">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Recomendación
                </span>
                <p className="m-0 text-sm text-slate-700 whitespace-pre-wrap">{informeSeleccionado.recomendacion}</p>
              </div>
            </div>
          </div>

          <Divider className="my-4" />

          {/* Datos del egreso */}
          <div className="mb-4 p-fluid">
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Datos del egreso</h5>
            <div className="field mb-3">
              <label htmlFor="motivoEgreso" className="block text-sm font-semibold text-slate-700 mb-1">
                Motivo del egreso <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                id="motivoEgreso"
                rows={3}
                value={formEgreso.motivoEgreso}
                onChange={e => setFormEgreso(prev => ({ ...prev, motivoEgreso: e.target.value }))}
                placeholder="Especifique el motivo formal del egreso (ej: Baja definitiva por obsolescencia técnica según informe INF-2026-XXXX, destino final del bien: reciclaje/donación/desecho...)"
              />
            </div>
            <div className="field">
              <label htmlFor="registradoPor" className="block text-sm font-semibold text-slate-700 mb-1">
                Registrado por <span className="text-red-500">*</span>
              </label>
              <InputText
                id="registradoPor"
                value={formEgreso.registradoPorEgreso}
                onChange={e => setFormEgreso(prev => ({ ...prev, registradoPorEgreso: e.target.value }))}
                placeholder="Nombre completo del responsable que registra el egreso"
              />
            </div>
          </div>

          <Divider className="my-4" />

          {/* Botones de navegación */}
          <div className="flex justify-content-between">
            <Button
              label="Volver"
              icon="pi pi-arrow-left"
              severity="secondary"
              onClick={handleVolverPaso0}
            />
            <Button
              label="Revisar y confirmar egreso"
              icon="pi pi-arrow-right"
              severity="danger"
              onClick={handleRevisarConfirmar}
            />
          </div>
        </Card>
      )}

      {/* ========================================== */}
      {/*  PASO 2: Egreso registrado                 */}
      {/* ========================================== */}
      {activeStep === 2 && informeSeleccionado && (
        <Card className="shadow-sm border-round max-w-3xl mx-auto">
          <div className="text-center py-4">
            <i className="pi pi-check-circle text-green-500 text-6xl block mb-3 text-center" />
            <h2 className="text-2xl font-bold text-slate-800 m-0 mb-1">Egreso registrado exitosamente</h2>
            <p className="text-slate-500 m-0">El proceso de baja ha culminado de manera definitiva.</p>
          </div>

          <Divider className="my-3" />

          {/* Detalles del Egreso */}
          <div className="grid mb-4">
            <div className="col-12 md:col-6 mb-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Referencia del informe
              </span>
              <span className="text-sm font-bold text-slate-800">{informeSeleccionado.referencia}</span>
            </div>
            <div className="col-12 md:col-6 mb-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cantidad de bienes egresados
              </span>
              <span className="text-sm font-bold text-slate-800">{informeSeleccionado.bienes.length} bien(es)</span>
            </div>
            <div className="col-12 md:col-6 mb-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Fecha del egreso
              </span>
              <span className="text-sm font-medium text-slate-700">{formatDate(new Date())}</span>
            </div>
            <div className="col-12 md:col-6 mb-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Registrado por
              </span>
              <span className="text-sm font-medium text-slate-700">{formEgreso.registradoPorEgreso}</span>
            </div>
            <div className="col-12">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Motivo del egreso
              </span>
              <p className="m-0 text-sm text-slate-700 bg-slate-50 p-2 border-round border-1 border-200">
                {formEgreso.motivoEgreso}
              </p>
            </div>
          </div>

          {/* Tabla de Bienes Egresados */}
          <div className="mb-4">
            <h5 className="text-slate-700 font-semibold mb-2 mt-0">Bienes Egresados</h5>
            <DataTable
              value={informeSeleccionado.bienes}
              size="small"
              stripedRows
              showGridlines
              emptyMessage="No hay bienes egresados."
            >
              <Column field="codigoActivo" header="Código" style={{ width: '25%' }} />
              <Column field="nombreActivo" header="Nombre" style={{ width: '45%' }} />
              <Column
                header="Disponibilidad"
                body={() => <Tag value="Egresado" severity="secondary" />}
                style={{ width: '30%', textAlign: 'center' }}
              />
            </DataTable>
          </div>

          <Divider className="my-4" />

          {/* Acciones finales */}
          <div className="flex justify-content-between flex-wrap gap-2">
            <Button
              label="Ver informes aprobados"
              icon="pi pi-list"
              severity="info"
              onClick={() => navigate('/bajas/aprobados')}
            />
            <Button
              label="Registrar otro egreso"
              icon="pi pi-plus"
              severity="success"
              onClick={resetAll}
            />
          </div>
        </Card>
      )}

      {/* Dialog Confirmar Egreso Definitivo */}
      <Dialog
        header="Confirmar egreso definitivo"
        visible={dialogConfirmar}
        style={{ width: '480px' }}
        modal
        onHide={() => setDialogConfirmar(false)}
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setDialogConfirmar(false)} />
            <Button
              label="Sí, confirmar egreso definitivo"
              icon="pi pi-lock"
              severity="danger"
              onClick={handleConfirmarEgresoDefinitivo}
            />
          </div>
        }
      >
        {informeSeleccionado && (
          <div className="text-center">
            <i className="pi pi-exclamation-triangle text-red-500 text-6xl block mb-3 text-center" />
            <h3 className="text-xl font-bold text-red-600 m-0 mb-2">Esta acción es IRREVERSIBLE</h3>
            <p className="text-slate-800 text-sm mb-3">
              ¿Confirma el egreso definitivo de <strong>{informeSeleccionado.bienes.length}</strong> bien(es) bajo el informe <strong>{informeSeleccionado.referencia}</strong>?
            </p>

            <div className="p-3 border-round bg-slate-50 border-1 border-200 text-left mb-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Códigos de activos afectados:
              </span>
              <ul className="m-0 pl-3 text-sm text-slate-700">
                {informeSeleccionado.bienes.map((b, idx) => (
                  <li key={idx} className="mb-1">
                    <strong>{b.codigoActivo}</strong> - {b.nombreActivo}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 border-round bg-red-50 text-red-700 border-left-3 border-red-500 text-left text-xs mb-1">
              <i className="pi pi-exclamation-circle mr-1" />
              Los bienes quedarán bloqueados para edición, traslado y mantenimiento
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Egresos;
