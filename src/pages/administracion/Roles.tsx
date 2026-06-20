import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';
import { useAdministracionContext, RolHEP, PermisoModulo } from '../../context/AdministracionContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const MODULOS_SISTEMA: { key: PermisoModulo['modulo']; label: string; icon: string }[] = [
  { key: 'Activos', label: 'Activos', icon: 'pi-box' },
  { key: 'Traslados', label: 'Traslados', icon: 'pi-arrow-right-arrow-left' },
  { key: 'Mantenimientos', label: 'Mantenimientos', icon: 'pi-wrench' },
  { key: 'Bajas', label: 'Bajas', icon: 'pi-trash' },
  { key: 'Reportes', label: 'Reportes', icon: 'pi-chart-bar' },
  { key: 'Administracion', label: 'Administración', icon: 'pi-cog' }
];

const ACCIONES_PERMISO: { key: keyof Omit<PermisoModulo, 'modulo'>; label: string }[] = [
  { key: 'ver', label: 'Ver' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' }
];

/* ------------------------------------------------------------------ */
/*  Funciones Auxiliares                                              */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const Roles: React.FC = () => {
  const {
    roles,
    actualizarPermisosRol,
    crearRol
  } = useAdministracionContext();

  // Estados del componente
  const [dialogPermisos, setDialogPermisos] = useState<boolean>(false);
  const [dialogNuevoRol, setDialogNuevoRol] = useState<boolean>(false);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);

  const [selectedRol, setSelectedRol] = useState<RolHEP | null>(null);
  const [permisosEditando, setPermisosEditando] = useState<PermisoModulo[]>([]);
  const [formNuevoRol, setFormNuevoRol] = useState<{ nombre: string; descripcion: string }>({
    nombre: '',
    descripcion: ''
  });

  const toast = useRef<Toast>(null);

  // Marcar todo 'Ver' como atajo útil
  const handleMarcarTodoVer = () => {
    setPermisosEditando(prev =>
      prev.map(p => ({
        ...p,
        ver: true
      }))
    );
  };

  // Guardar cambio de checkboxes locales en copia editable
  const handleCheckboxChange = (
    moduloKey: PermisoModulo['modulo'],
    accionKey: keyof Omit<PermisoModulo, 'modulo'>,
    value: boolean
  ) => {
    setPermisosEditando(prev =>
      prev.map(p => {
        if (p.modulo === moduloKey) {
          return {
            ...p,
            [accionKey]: value
          };
        }
        return p;
      })
    );
  };

  // Confirmar y guardar permisos del rol
  const handleGuardarPermisos = () => {
    if (!selectedRol) return;

    actualizarPermisosRol(selectedRol.id, permisosEditando);
    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: `Permisos de ${selectedRol.nombre} actualizados correctamente.`,
      life: 3000
    });
    setDialogPermisos(false);
  };

  // Guardar nuevo rol personalizado
  const handleCrearRol = () => {
    if (!formNuevoRol.nombre.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El nombre del rol es obligatorio', life: 3000 });
      return;
    }
    if (!formNuevoRol.descripcion.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'La descripción del rol es obligatoria', life: 3000 });
      return;
    }

    const permisos = MODULOS_SISTEMA.map(m => ({
      modulo: m.key,
      ver: false,
      crear: false,
      editar: false,
      eliminar: false
    }));

    crearRol({
      nombre: formNuevoRol.nombre.trim(),
      descripcion: formNuevoRol.descripcion.trim(),
      permisos
    });

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Rol creado. Configure sus permisos desde la tarjeta del rol.',
      life: 3000
    });
    setDialogNuevoRol(false);
    setFormNuevoRol({ nombre: '', descripcion: '' });
  };

  // Renderizador de puntos visuales en la tarjeta del rol
  const renderDots = (permiso: PermisoModulo | undefined) => {
    if (!permiso) {
      return (
        <div className="flex gap-1">
          <span className="border-circle bg-slate-200" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
          <span className="border-circle bg-slate-200" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
          <span className="border-circle bg-slate-200" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
          <span className="border-circle bg-slate-200" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
        </div>
      );
    }
    return (
      <div className="flex gap-1">
        <span
          className="border-circle"
          style={{
            width: '8px',
            height: '8px',
            display: 'inline-block',
            backgroundColor: permiso.ver ? '#3B82F6' : '#E2E8F0'
          }}
          title="Ver"
        ></span>
        <span
          className="border-circle"
          style={{
            width: '8px',
            height: '8px',
            display: 'inline-block',
            backgroundColor: permiso.crear ? '#22C55E' : '#E2E8F0'
          }}
          title="Crear"
        ></span>
        <span
          className="border-circle"
          style={{
            width: '8px',
            height: '8px',
            display: 'inline-block',
            backgroundColor: permiso.editar ? '#F59E0B' : '#E2E8F0'
          }}
          title="Editar"
        ></span>
        <span
          className="border-circle"
          style={{
            width: '8px',
            height: '8px',
            display: 'inline-block',
            backgroundColor: permiso.eliminar ? '#EF4444' : '#E2E8F0'
          }}
          title="Eliminar"
        ></span>
      </div>
    );
  };

  const renderCheckIcon = (val: boolean) => {
    return val ? (
      <i className="pi pi-check text-green-500 font-bold text-sm"></i>
    ) : (
      <i className="pi pi-times text-slate-350 text-sm"></i>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Gestión de Roles y Permisos
          </h1>
          <p className="text-slate-500 m-0">
            Configuración de accesos por módulo según el perfil de cada usuario — Hospital de Especialidades Portoviejo
          </p>
        </div>
        <div>
          <Tag
            severity="info"
            icon="pi pi-info-circle"
            value="Los 6 roles base no pueden eliminarse, pero sus permisos son completamente editables."
            className="px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        className="mb-4"
        left={
          <Button
            label="Nuevo Rol Personalizado"
            icon="pi pi-plus"
            severity="success"
            onClick={() => {
              setFormNuevoRol({ nombre: '', descripcion: '' });
              setDialogNuevoRol(true);
            }}
          />
        }
        right={
          <div className="text-sm font-semibold text-slate-500">
            Total de roles: {roles.length}
          </div>
        }
      />

      {/* Grid de Tarjetas (Cards) */}
      <div className="grid">
        {roles.map(rol => (
          <div key={rol.id} className="col-12 md:col-6 lg:col-4 mb-4">
            <Card
              title={
                <div className="flex justify-content-between align-items-center mb-1">
                  <span className="font-bold text-lg text-slate-800">{rol.nombre}</span>
                  {rol.esRolBase && <Tag value="Base" severity="secondary" />}
                </div>
              }
              subTitle={<span className="text-slate-500 text-sm block mb-3 line-height-3">{rol.descripcion}</span>}
              footer={
                <div className="flex justify-content-between gap-2">
                  <Button
                    label="Ver detalle"
                    icon="pi pi-eye"
                    severity="info"
                    outlined
                    onClick={() => {
                      setSelectedRol(rol);
                      setDialogDetalle(true);
                    }}
                    className="w-full"
                  />
                  <Button
                    label="Editar permisos"
                    icon="pi pi-shield"
                    severity="warning"
                    onClick={() => {
                      setSelectedRol(rol);
                      setPermisosEditando(JSON.parse(JSON.stringify(rol.permisos)));
                      setDialogPermisos(true);
                    }}
                    className="w-full"
                  />
                </div>
              }
              className="shadow-sm border-round border-1 border-slate-100 hover:shadow-md transition-duration-200"
            >
              <Divider className="my-2" />
              <div className="flex flex-column gap-2 py-2">
                {MODULOS_SISTEMA.map(m => {
                  const perm = rol.permisos.find(p => p.modulo === m.key);
                  return (
                    <div key={m.key} className="flex justify-content-between align-items-center py-1 border-bottom-1 border-slate-50">
                      <div className="flex align-items-center gap-2">
                        <i className={`pi ${m.icon} text-slate-400 text-sm`}></i>
                        <span className="text-sm text-slate-600 font-medium">{m.label}</span>
                      </div>
                      {renderDots(perm)}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Dialog Editar Permisos */}
      <Dialog
        header={selectedRol ? `Permisos — ${selectedRol.nombre}` : 'Editar Permisos'}
        visible={dialogPermisos}
        style={{ width: '750px' }}
        modal
        resizable
        onHide={() => setDialogPermisos(false)}
        footer={
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => {
                setDialogPermisos(false);
                setPermisosEditando([]);
              }}
            />
            <Button
              label="Guardar permisos"
              icon="pi pi-check"
              severity="success"
              onClick={handleGuardarPermisos}
            />
          </div>
        }
      >
        {selectedRol && (
          <div className="p-fluid">
            {(selectedRol.nombre === 'TICs' || selectedRol.nombre === 'Administrador') && (
              <div className="mb-3">
                <Tag
                  severity="warning"
                  icon="pi pi-exclamation-triangle"
                  value="Este rol tiene control total del sistema. Modifique sus permisos con precaución."
                  className="w-full py-2 font-semibold text-sm"
                />
              </div>
            )}

            <div className="flex justify-content-end mb-3">
              <Button
                label="Marcar todo Ver"
                icon="pi pi-eye"
                severity="secondary"
                outlined
                className="w-auto text-xs py-1"
                onClick={handleMarcarTodoVer}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: '500px' }}>
                <thead>
                  <tr className="border-bottom-2 border-slate-200">
                    <th className="py-2 text-sm font-bold text-slate-700">Módulo</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Ver</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Crear</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Editar</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULOS_SISTEMA.map(m => {
                    const pEdit = permisosEditando.find(p => p.modulo === m.key);
                    return (
                      <tr key={m.key} className="border-bottom-1 border-slate-100 hover:bg-slate-50">
                        <td className="py-3 flex align-items-center gap-2">
                          <i className={`pi ${m.icon} text-slate-500`}></i>
                          <span className="font-semibold text-slate-700 text-sm">{m.label}</span>
                        </td>
                        <td className="py-3 text-center">
                          <Checkbox
                            checked={pEdit?.ver ?? false}
                            onChange={e => handleCheckboxChange(m.key, 'ver', e.checked ?? false)}
                          />
                        </td>
                        <td className="py-3 text-center">
                          <Checkbox
                            checked={pEdit?.crear ?? false}
                            onChange={e => handleCheckboxChange(m.key, 'crear', e.checked ?? false)}
                          />
                        </td>
                        <td className="py-3 text-center">
                          <Checkbox
                            checked={pEdit?.editar ?? false}
                            onChange={e => handleCheckboxChange(m.key, 'editar', e.checked ?? false)}
                          />
                        </td>
                        <td className="py-3 text-center">
                          <Checkbox
                            checked={pEdit?.eliminar ?? false}
                            onChange={e => handleCheckboxChange(m.key, 'eliminar', e.checked ?? false)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Detalle del Rol */}
      <Dialog
        header={selectedRol ? `Detalle de Rol: ${selectedRol.nombre}` : 'Detalle de Rol'}
        visible={dialogDetalle}
        style={{ width: '600px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={
          <div className="flex justify-content-between w-full pt-2">
            <Button
              label="Editar permisos"
              icon="pi pi-shield"
              severity="warning"
              onClick={() => {
                if (selectedRol) {
                  setPermisosEditando(JSON.parse(JSON.stringify(selectedRol.permisos)));
                  setDialogDetalle(false);
                  setDialogPermisos(true);
                }
              }}
            />
            <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
          </div>
        }
      >
        {selectedRol && (
          <div className="p-fluid">
            <div className="mb-3">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción</span>
              <span className="text-sm text-slate-800 line-height-3 block mb-2">{selectedRol.descripcion}</span>
            </div>

            <div className="grid mb-3">
              <div className="col-6">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tipo de Rol</span>
                <Tag
                  severity={selectedRol.esRolBase ? 'secondary' : 'info'}
                  value={selectedRol.esRolBase ? 'Rol base del sistema' : 'Rol personalizado'}
                  className="w-max block mt-1"
                />
              </div>
              <div className="col-6">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha de creación</span>
                <span className="text-sm text-slate-800 block mt-1">{formatDate(selectedRol.fechaCreacion)}</span>
              </div>
            </div>

            <Divider />

            <span className="font-bold text-base text-slate-700 block mb-3">Permisos del Rol</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: '400px' }}>
                <thead>
                  <tr className="border-bottom-2 border-slate-200">
                    <th className="py-2 text-sm font-bold text-slate-700">Módulo</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Ver</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Crear</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Editar</th>
                    <th className="py-2 text-center text-sm font-bold text-slate-700">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULOS_SISTEMA.map(m => {
                    const perm = selectedRol.permisos.find(p => p.modulo === m.key);
                    return (
                      <tr key={m.key} className="border-bottom-1 border-slate-100">
                        <td className="py-2.5 flex align-items-center gap-2">
                          <i className={`pi ${m.icon} text-slate-500`}></i>
                          <span className="font-semibold text-slate-700 text-sm">{m.label}</span>
                        </td>
                        <td className="py-2.5 text-center">{renderCheckIcon(perm?.ver ?? false)}</td>
                        <td className="py-2.5 text-center">{renderCheckIcon(perm?.crear ?? false)}</td>
                        <td className="py-2.5 text-center">{renderCheckIcon(perm?.editar ?? false)}</td>
                        <td className="py-2.5 text-center">{renderCheckIcon(perm?.eliminar ?? false)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Nuevo Rol Personalizado */}
      <Dialog
        header="Crear Rol Personalizado"
        visible={dialogNuevoRol}
        style={{ width: '500px' }}
        modal
        onHide={() => setDialogNuevoRol(false)}
        footer={
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => {
                setDialogNuevoRol(false);
                setFormNuevoRol({ nombre: '', descripcion: '' });
              }}
            />
            <Button
              label="Crear rol"
              icon="pi pi-plus"
              severity="success"
              onClick={handleCrearRol}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="mb-3">
            <label htmlFor="nombreRol" className="block text-sm font-semibold text-slate-700 mb-2">Nombre del rol</label>
            <InputText
              id="nombreRol"
              value={formNuevoRol.nombre}
              onChange={e => setFormNuevoRol(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Auditor Externo"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="descRol" className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
            <InputTextarea
              id="descRol"
              value={formNuevoRol.descripcion}
              onChange={e => setFormNuevoRol(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              placeholder="Describa el propósito y alcance de este rol..."
            />
          </div>
          <div className="p-3 border-round bg-blue-50 text-blue-700 border-left-3 border-blue-500 flex align-items-center gap-2 text-sm font-medium">
            <i className="pi pi-info-circle text-lg"></i>
            <span>
              El nuevo rol se creará sin permisos asignados. Podrá configurarlos después desde "Editar permisos".
            </span>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Roles;
