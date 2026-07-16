import React, { useState, useMemo, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { useAdministracionContext, UsuarioHEP } from '../../context/AdministracionContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const ESTADOS_USUARIO = [
  { label: 'Activo', value: 'Activo' },
  { label: 'Inactivo', value: 'Inactivo' },
  { label: 'Bloqueado', value: 'Bloqueado' }
];

const DEPARTAMENTOS_HEP = [
  { label: 'Activos Fijos', value: 'Activos Fijos' },
  { label: 'TICs', value: 'TICs' },
  { label: 'Mantenimiento', value: 'Mantenimiento' },
  { label: 'Financiero', value: 'Financiero' },
  { label: 'Administrativo', value: 'Administrativo' },
  { label: 'Dirección Médica', value: 'Dirección Médica' }
];

const FORM_DATA_INICIAL = {
  nombres: '',
  apellidos: '',
  email: '',
  cedula: '',
  rolId: '',
  departamento: '',
  estado: 'Activo' as 'Activo' | 'Inactivo' | 'Bloqueado',
  creadoPor: ''
};

/* ------------------------------------------------------------------ */
/*  Funciones Auxiliares                                              */
/* ------------------------------------------------------------------ */
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Nunca';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Nunca';
  return `${String(d.getDate()).padStart(2, '0')}/${
    String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const getIniciales = (nombres: string, apellidos: string): string => {
  const n = (nombres || '').trim().charAt(0);
  const a = (apellidos || '').trim().charAt(0);
  return `${n}${a}`.toUpperCase() || 'U';
};

const Usuarios: React.FC = () => {
  const {
    usuarios,
    roles,
    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario
  } = useAdministracionContext();

  // Estados del componente
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [filtroRol, setFiltroRol] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  const [dialogNuevo, setDialogNuevo] = useState<boolean>(false);
  const [dialogEditar, setDialogEditar] = useState<boolean>(false);
  const [dialogDetalle, setDialogDetalle] = useState<boolean>(false);
  const [dialogCambiarEstado, setDialogCambiarEstado] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<UsuarioHEP | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'Activo' | 'Inactivo' | 'Bloqueado' | null>(null);
  const [formData, setFormData] = useState(FORM_DATA_INICIAL);

  const toast = useRef<Toast>(null);

  // Computar lista filtrada
  const usuariosFiltrados = useMemo(() => {
    let list = usuarios || [];

    if (filtroRol) {
      list = list.filter(u => u.rolId === filtroRol);
    }

    if (filtroEstado) {
      list = list.filter(u => u.estado === filtroEstado);
    }

    if (globalFilter) {
      const term = globalFilter.toLowerCase().trim();
      list = list.filter(u => {
        return (
          (u.nombres || '').toLowerCase().includes(term) ||
          (u.apellidos || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u.cedula || '').toLowerCase().includes(term)
        );
      });
    }

    return list;
  }, [usuarios, filtroRol, filtroEstado, globalFilter]);

  // Validaciones de formulario
  const validarFormulario = (excluirCreadoPor: boolean = false) => {
    if (!formData.nombres.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El campo Nombres es obligatorio', life: 3000 });
      return false;
    }
    if (!formData.apellidos.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El campo Apellidos es obligatorio', life: 3000 });
      return false;
    }
    if (!formData.cedula.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El campo Cédula es obligatorio', life: 3000 });
      return false;
    }
    if (!formData.email.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El campo Email es obligatorio', life: 3000 });
      return false;
    }
    if (!formData.rolId) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar un Rol', life: 3000 });
      return false;
    }
    if (!formData.departamento) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar un Departamento', life: 3000 });
      return false;
    }
    if (!excluirCreadoPor && !formData.creadoPor.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El campo Creado Por es obligatorio', life: 3000 });
      return false;
    }
    return true;
  };

  // Guardar nuevo usuario
  const handleGuardarNuevo = () => {
    if (!validarFormulario()) return;

    crearUsuario(formData);
    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario registrado correctamente.', life: 3000 });
    setDialogNuevo(false);
    setFormData(FORM_DATA_INICIAL);
  };

  // Guardar usuario editado
  const handleGuardarEditar = () => {
    if (!selectedItem) return;
    if (!validarFormulario(true)) return;

    const usuarioActualizado: UsuarioHEP = {
      ...selectedItem,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      email: formData.email,
      cedula: formData.cedula,
      rolId: formData.rolId,
      departamento: formData.departamento,
      estado: formData.estado
    };

    actualizarUsuario(usuarioActualizado);
    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente.', life: 3000 });
    setDialogEditar(false);
    setSelectedItem(null);
  };

  // Templates de DataTable
  const usuarioBodyTemplate = (rowData: UsuarioHEP) => {
    const iniciales = getIniciales(rowData.nombres, rowData.apellidos);
    return (
      <div className="flex align-items-center gap-2">
        <Avatar label={iniciales} shape="circle" style={{ backgroundColor: '#3B82F6', color: '#ffffff', fontWeight: 'bold' }} />
        <span className="font-semibold text-slate-800">{rowData.nombres} {rowData.apellidos}</span>
      </div>
    );
  };

  const rolBodyTemplate = (rowData: UsuarioHEP) => {
    let severity: 'danger' | 'success' | 'warning' | 'info' = 'info';
    const rName = rowData.rolNombre;

    if (rName === 'TICs' || rName === 'Administrador') {
      severity = 'danger';
    } else if (rName === 'Activo Fijo') {
      severity = 'success';
    } else if (rName === 'Mantenimiento') {
      severity = 'warning';
    }

    return <Tag value={rName} severity={severity} />;
  };

  const estadoBodyTemplate = (rowData: UsuarioHEP) => {
    let severity: 'success' | 'secondary' | 'danger' = 'success';
    if (rowData.estado === 'Inactivo') severity = 'secondary';
    else if (rowData.estado === 'Bloqueado') severity = 'danger';
    return <Tag value={rowData.estado} severity={severity} />;
  };

  const accionesBodyTemplate = (rowData: UsuarioHEP) => {
    return (
      <div className="flex gap-2 justify-content-center">
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
        <Button
          icon="pi pi-pencil"
          severity="warning"
          rounded
          tooltip="Editar usuario"
          tooltipOptions={{ position: 'top' }}
          onClick={() => {
            setSelectedItem(rowData);
            setFormData({
              nombres: rowData.nombres,
              apellidos: rowData.apellidos,
              email: rowData.email,
              cedula: rowData.cedula,
              rolId: rowData.rolId,
              departamento: rowData.departamento,
              estado: rowData.estado,
              creadoPor: rowData.creadoPor
            });
            setDialogEditar(true);
          }}
        />
        <Button
          icon="pi pi-user-edit"
          severity="secondary"
          rounded
          tooltip="Cambiar estado"
          tooltipOptions={{ position: 'top' }}
          onClick={() => {
            setSelectedItem(rowData);
            setNuevoEstado(null);
            setDialogCambiarEstado(true);
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Gestión de Usuarios
          </h1>
          <p className="text-slate-500 m-0">
            Administración de cuentas y accesos al sistema — Hospital de Especialidades Portoviejo
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tag severity="success" value={`Activos: ${usuarios.filter(u => u.estado === 'Activo').length}`} className="px-3 py-2 text-sm" />
          <Tag severity="secondary" value={`Inactivos: ${usuarios.filter(u => u.estado === 'Inactivo').length}`} className="px-3 py-2 text-sm" />
          <Tag severity="danger" value={`Bloqueados: ${usuarios.filter(u => u.estado === 'Bloqueado').length}`} className="px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        className="mb-4"
        left={
          <Button
            label="Nuevo Usuario"
            icon="pi pi-user-plus"
            severity="success"
            onClick={() => {
              setFormData(FORM_DATA_INICIAL);
              setDialogNuevo(true);
            }}
          />
        }
        center={
          <div className="flex gap-2 flex-wrap align-items-center">
            <Dropdown
              value={filtroRol}
              options={[{ label: 'Todos los roles', value: '' }, ...roles.map(r => ({ label: r.nombre, value: r.id }))]}
              onChange={e => setFiltroRol(e.value)}
              placeholder="Todos los roles"
              style={{ minWidth: '14rem' }}
            />
            <Dropdown
              value={filtroEstado}
              options={[{ label: 'Todos los estados', value: '' }, ...ESTADOS_USUARIO]}
              onChange={e => setFiltroEstado(e.value)}
              placeholder="Todos los estados"
              style={{ minWidth: '12rem' }}
            />
          </div>
        }
        right={
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Buscar..."
            />
          </IconField>
        }
      />

      {/* Tabla de Usuarios */}
      <div className="card shadow-sm border-round bg-white p-3">
        <DataTable
          value={usuariosFiltrados}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay usuarios registrados"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          sortMode="multiple"
        >
          <Column field="nombres" header="Usuario" body={usuarioBodyTemplate} sortable style={{ minWidth: '18rem' }} />
          <Column field="email" header="Email" sortable style={{ minWidth: '15rem' }} />
          <Column field="cedula" header="Cédula" sortable style={{ minWidth: '10rem' }} />
          <Column field="rolNombre" header="Rol" body={rolBodyTemplate} sortable style={{ minWidth: '12rem' }} />
          <Column field="departamento" header="Departamento" sortable style={{ minWidth: '12rem' }} />
          <Column
            field="ultimoAcceso"
            header="Último acceso"
            body={(row: UsuarioHEP) => formatDate(row.ultimoAcceso)}
            sortable
            style={{ minWidth: '12rem' }}
          />
          <Column field="estado" header="Estado" body={estadoBodyTemplate} sortable style={{ minWidth: '10rem' }} />
          <Column header="Acciones" body={accionesBodyTemplate} style={{ minWidth: '12rem', textAlign: 'center' }} />
        </DataTable>
      </div>

      {/* Dialog Nuevo Usuario */}
      <Dialog
        header="Registrar Nuevo Usuario"
        visible={dialogNuevo}
        style={{ width: '650px' }}
        modal
        resizable
        onHide={() => setDialogNuevo(false)}
        footer={
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => {
                setDialogNuevo(false);
                setFormData(FORM_DATA_INICIAL);
              }}
            />
            <Button
              label="Registrar usuario"
              icon="pi pi-user-plus"
              severity="success"
              onClick={handleGuardarNuevo}
            />
          </div>
        }
      >
        <div className="p-fluid">
          {/* SECCIÓN Datos personales */}
          <span className="font-bold text-base text-slate-700 block mb-3">Datos personales</span>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="nombres" className="block text-sm font-semibold text-slate-700 mb-2">Nombres</label>
              <InputText
                id="nombres"
                value={formData.nombres}
                onChange={e => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                placeholder="Ingrese nombres"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="apellidos" className="block text-sm font-semibold text-slate-700 mb-2">Apellidos</label>
              <InputText
                id="apellidos"
                value={formData.apellidos}
                onChange={e => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                placeholder="Ingrese apellidos"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="cedula" className="block text-sm font-semibold text-slate-700 mb-2">Cédula</label>
              <InputText
                id="cedula"
                value={formData.cedula}
                onChange={e => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                placeholder="Ingrese cédula"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <InputText
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ejemplo@hospital.gob.ec"
              />
            </div>
          </div>

          <Divider />

          {/* SECCIÓN Acceso al sistema */}
          <span className="font-bold text-base text-slate-700 block mb-3">Acceso al sistema</span>
          <div className="grid">
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="rol" className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
              <Dropdown
                id="rol"
                value={formData.rolId}
                options={roles.map(r => ({ label: `${r.nombre} — ${r.descripcion}`, value: r.id }))}
                onChange={e => setFormData(prev => ({ ...prev, rolId: e.value }))}
                placeholder="Seleccione un rol"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="departamento" className="block text-sm font-semibold text-slate-700 mb-2">Departamento</label>
              <Dropdown
                id="departamento"
                value={formData.departamento}
                options={DEPARTAMENTOS_HEP}
                onChange={e => setFormData(prev => ({ ...prev, departamento: e.value }))}
                placeholder="Seleccione departamento"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="estado" className="block text-sm font-semibold text-slate-700 mb-2">Estado inicial</label>
              <Dropdown
                id="estado"
                value={formData.estado}
                options={ESTADOS_USUARIO}
                onChange={e => setFormData(prev => ({ ...prev, estado: e.value as any }))}
                placeholder="Seleccione estado"
              />
            </div>
            <div className="col-12 md:col-6 mb-3">
              <label htmlFor="creadoPor" className="block text-sm font-semibold text-slate-700 mb-2">Creado por</label>
              <InputText
                id="creadoPor"
                value={formData.creadoPor}
                onChange={e => setFormData(prev => ({ ...prev, creadoPor: e.target.value }))}
                placeholder="Nombre del creador"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog Editar Usuario */}
      <Dialog
        header={selectedItem ? `Editar Usuario — ${selectedItem.nombres}` : 'Editar Usuario'}
        visible={dialogEditar}
        style={{ width: '650px' }}
        modal
        onHide={() => setDialogEditar(false)}
        footer={
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => {
                setDialogEditar(false);
                setSelectedItem(null);
              }}
            />
            <Button
              label="Guardar cambios"
              icon="pi pi-check"
              severity="success"
              onClick={handleGuardarEditar}
            />
          </div>
        }
      >
        {selectedItem && (
          <div className="p-fluid">
            {/* SECCIÓN Datos personales */}
            <span className="font-bold text-base text-slate-700 block mb-3">Datos personales</span>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_nombres" className="block text-sm font-semibold text-slate-700 mb-2">Nombres</label>
                <InputText
                  id="edit_nombres"
                  value={formData.nombres}
                  onChange={e => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  placeholder="Ingrese nombres"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_apellidos" className="block text-sm font-semibold text-slate-700 mb-2">Apellidos</label>
                <InputText
                  id="edit_apellidos"
                  value={formData.apellidos}
                  onChange={e => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Ingrese apellidos"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_cedula" className="block text-sm font-semibold text-slate-700 mb-2">Cédula</label>
                <InputText
                  id="edit_cedula"
                  value={formData.cedula}
                  onChange={e => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                  placeholder="Ingrese cédula"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_email" className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <InputText
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@hospital.gob.ec"
                />
              </div>
            </div>

            <Divider />

            {/* SECCIÓN Acceso al sistema */}
            <span className="font-bold text-base text-slate-700 block mb-3">Acceso al sistema</span>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_rol" className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
                <Dropdown
                  id="edit_rol"
                  value={formData.rolId}
                  options={roles.map(r => ({ label: `${r.nombre} — ${r.descripcion}`, value: r.id }))}
                  onChange={e => setFormData(prev => ({ ...prev, rolId: e.value }))}
                  placeholder="Seleccione un rol"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_departamento" className="block text-sm font-semibold text-slate-700 mb-2">Departamento</label>
                <Dropdown
                  id="edit_departamento"
                  value={formData.departamento}
                  options={DEPARTAMENTOS_HEP}
                  onChange={e => setFormData(prev => ({ ...prev, departamento: e.value }))}
                  placeholder="Seleccione departamento"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_estado" className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                <Dropdown
                  id="edit_estado"
                  value={formData.estado}
                  options={ESTADOS_USUARIO}
                  onChange={e => setFormData(prev => ({ ...prev, estado: e.value as any }))}
                  placeholder="Seleccione estado"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <label htmlFor="edit_creadoPor" className="block text-sm font-semibold text-slate-700 mb-2">Creado por</label>
                <InputText
                  id="edit_creadoPor"
                  value={formData.creadoPor}
                  readOnly
                  disabled
                  className="bg-slate-100"
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Detalle Usuario */}
      <Dialog
        header="Detalle de Usuario"
        visible={dialogDetalle}
        style={{ width: '550px' }}
        modal
        onHide={() => setDialogDetalle(false)}
        footer={
          <div className="flex justify-content-between pt-2 w-full">
            <Button
              label="Editar"
              icon="pi pi-pencil"
              severity="warning"
              onClick={() => {
                if (selectedItem) {
                  setFormData({
                    nombres: selectedItem.nombres,
                    apellidos: selectedItem.apellidos,
                    email: selectedItem.email,
                    cedula: selectedItem.cedula,
                    rolId: selectedItem.rolId,
                    departamento: selectedItem.departamento,
                    estado: selectedItem.estado,
                    creadoPor: selectedItem.creadoPor
                  });
                  setDialogDetalle(false);
                  setDialogEditar(true);
                }
              }}
            />
            <Button label="Cerrar" severity="secondary" onClick={() => setDialogDetalle(false)} />
          </div>
        }
      >
        {selectedItem && (
          <div className="p-fluid">
            <div className="flex flex-column align-items-center mb-4">
              <Avatar
                label={getIniciales(selectedItem.nombres, selectedItem.apellidos)}
                size="large"
                shape="circle"
                className="mb-2 bg-blue-500 text-white font-bold"
                style={{ width: '4rem', height: '4rem', fontSize: '2rem' }}
              />
              <h2 className="text-xl font-bold m-0 mb-1 text-slate-800">{selectedItem.nombres} {selectedItem.apellidos}</h2>
              <Tag
                value={selectedItem.rolNombre}
                severity={
                  selectedItem.rolNombre === 'TICs' || selectedItem.rolNombre === 'Administrador' ? 'danger' :
                  selectedItem.rolNombre === 'Activo Fijo' ? 'success' :
                  selectedItem.rolNombre === 'Mantenimiento' ? 'warning' : 'info'
                }
              />
            </div>
            <div className="grid">
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.email}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cédula</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.cedula}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Departamento</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.departamento}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Estado</span>
                <Tag
                  value={selectedItem.estado}
                  severity={
                    selectedItem.estado === 'Activo' ? 'success' :
                    selectedItem.estado === 'Inactivo' ? 'secondary' : 'danger'
                  }
                  className="w-max block mt-1"
                />
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Último acceso</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.ultimoAcceso)}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Creado por</span>
                <span className="text-sm font-medium text-slate-800">{selectedItem.creadoPor}</span>
              </div>
              <div className="col-12 md:col-6 mb-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha de creación</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(selectedItem.fechaCreacion)}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Cambiar Estado */}
      <Dialog
        header="Cambiar Estado de Usuario"
        visible={dialogCambiarEstado}
        style={{ width: '420px' }}
        modal
        onHide={() => {
          setDialogCambiarEstado(false);
          setNuevoEstado(null);
        }}
        footer={
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => {
                setDialogCambiarEstado(false);
                setNuevoEstado(null);
              }}
            />
            <Button
              label="Confirmar cambio"
              severity={
                nuevoEstado === 'Activo' ? 'success' :
                nuevoEstado === 'Inactivo' ? 'secondary' :
                nuevoEstado === 'Bloqueado' ? 'danger' : undefined
              }
              disabled={nuevoEstado === null || nuevoEstado === selectedItem?.estado}
              onClick={() => {
                if (selectedItem && nuevoEstado) {
                  cambiarEstadoUsuario(selectedItem.id, nuevoEstado);
                  toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `Estado actualizado a ${nuevoEstado}`, life: 3000 });
                  setDialogCambiarEstado(false);
                  setNuevoEstado(null);
                  setSelectedItem(null);
                }
              }}
            />
          </div>
        }
      >
        {selectedItem && (
          <div className="p-fluid">
            <div className="mb-3">
              <p className="text-slate-600 mb-2">
                Seleccione el nuevo estado para <strong className="text-slate-850">{selectedItem.nombres} {selectedItem.apellidos}</strong>:
              </p>
              <div className="flex align-items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-slate-500">Estado actual:</span>
                <Tag
                  value={selectedItem.estado}
                  severity={
                    selectedItem.estado === 'Activo' ? 'success' :
                    selectedItem.estado === 'Inactivo' ? 'secondary' : 'danger'
                  }
                />
              </div>
            </div>
            <div className="flex flex-column gap-3 mb-4">
              <Button
                label="Activo"
                icon="pi pi-check-circle"
                severity="success"
                outlined={nuevoEstado !== 'Activo'}
                onClick={() => setNuevoEstado('Activo')}
                className="w-full text-left"
              />
              <Button
                label="Inactivo"
                icon="pi pi-minus-circle"
                severity="secondary"
                outlined={nuevoEstado !== 'Inactivo'}
                onClick={() => setNuevoEstado('Inactivo')}
                className="w-full text-left"
              />
              <Button
                label="Bloqueado"
                icon="pi pi-ban"
                severity="danger"
                outlined={nuevoEstado !== 'Bloqueado'}
                onClick={() => setNuevoEstado('Bloqueado')}
                className="w-full text-left"
              />
            </div>
            {nuevoEstado === 'Bloqueado' && (
              <div className="mb-3">
                <Tag
                  severity="danger"
                  value="El usuario no podrá iniciar sesión mientras esté bloqueado."
                  className="w-full py-2 font-semibold"
                />
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Usuarios;
