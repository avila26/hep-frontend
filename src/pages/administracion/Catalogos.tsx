import React, { useState, useMemo, useRef } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { useAdministracionContext, CatalogoItem } from '../../context/AdministracionContext';

/* ------------------------------------------------------------------ */
/*  Constantes                                                        */
/* ------------------------------------------------------------------ */
const TIPOS_CATALOGO: { tipo: CatalogoItem['tipo']; label: string; icon: string; descripcionAyuda: string }[] = [
  {
    tipo: 'Categoria',
    label: 'Categorías de Activos',
    icon: 'pi-tag',
    descripcionAyuda: 'Clasificaciones usadas al registrar activos institucionales.'
  },
  {
    tipo: 'Ubicacion',
    label: 'Ubicaciones',
    icon: 'pi-map-marker',
    descripcionAyuda: 'Áreas y dependencias del hospital usadas en traslados y mantenimientos.'
  },
  {
    tipo: 'Motivo',
    label: 'Motivos de Traslado',
    icon: 'pi-info-circle',
    descripcionAyuda: 'Razones predefinidas para registrar traslados de activos.'
  }
];

const FORM_DATA_INICIAL = { nombre: '', descripcion: '', activo: true };

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

const Catalogos: React.FC = () => {
  const {
    catalogosPorTipo,
    agregarCatalogoItem,
    actualizarCatalogoItem,
    eliminarCatalogoItem
  } = useAdministracionContext();

  // Estados
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [globalFilter, setGlobalFilter] = useState<string>('');

  const [dialogNuevo, setDialogNuevo] = useState<boolean>(false);
  const [dialogEditar, setDialogEditar] = useState<boolean>(false);
  const [dialogEliminar, setDialogEliminar] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<CatalogoItem | null>(null);
  const [formData, setFormData] = useState(FORM_DATA_INICIAL);

  const toast = useRef<Toast>(null);

  // Auxiliar para saber el tipo activo
  const tipoActivoTab = () => {
    return TIPOS_CATALOGO[activeTabIndex].tipo;
  };

  // Filtrado de ítems por tipo y búsqueda global
  const getFilteredItems = (tipo: CatalogoItem['tipo']) => {
    const rawItems = catalogosPorTipo(tipo);
    if (!globalFilter) return rawItems;
    const term = globalFilter.toLowerCase().trim();
    return rawItems.filter(item => {
      return (
        (item.nombre || '').toLowerCase().includes(term) ||
        (item.descripcion || '').toLowerCase().includes(term)
      );
    });
  };

  // Guardar nuevo item
  const handleGuardarNuevo = () => {
    if (!formData.nombre.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El nombre es obligatorio', life: 3000 });
      return;
    }

    agregarCatalogoItem({
      tipo: tipoActivoTab(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      activo: formData.activo
    });

    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Elemento agregado al catálogo.', life: 3000 });
    setDialogNuevo(false);
    setFormData(FORM_DATA_INICIAL);
  };

  // Guardar item editado
  const handleGuardarEditar = () => {
    if (!selectedItem) return;
    if (!formData.nombre.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Advertencia', detail: 'El nombre es obligatorio', life: 3000 });
      return;
    }

    const itemActualizado: CatalogoItem = {
      ...selectedItem,
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      activo: formData.activo
    };

    actualizarCatalogoItem(itemActualizado);
    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Elemento actualizado.', life: 3000 });
    setDialogEditar(false);
    setSelectedItem(null);
  };

  // Eliminar item
  const handleConfirmarEliminar = () => {
    if (!selectedItem) return;

    eliminarCatalogoItem(selectedItem.id);
    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Elemento eliminado del catálogo.', life: 3000 });
    setDialogEliminar(false);
    setSelectedItem(null);
  };

  // Renderizador del contenido del TabPanel
  const renderTabContent = (tipo: CatalogoItem['tipo']) => {
    const currentTipoConfig = TIPOS_CATALOGO.find(tc => tc.tipo === tipo);
    const data = getFilteredItems(tipo);

    const singularLabel =
      tipo === 'Categoria' ? 'Categoría' :
      tipo === 'Ubicacion' ? 'Ubicación' : 'Motivo';

    return (
      <div className="py-2">
        {/* Informativo azul claro */}
        <div className="p-3 border-round bg-blue-50 text-blue-800 border-left-3 border-blue-500 mb-4 text-sm font-medium">
          {currentTipoConfig?.descripcionAyuda}
        </div>

        {/* Toolbar */}
        <Toolbar
          className="mb-4"
          left={
            <Button
              label={`Nueva ${singularLabel}`}
              icon="pi pi-plus"
              severity="success"
              onClick={() => {
                setFormData(FORM_DATA_INICIAL);
                setDialogNuevo(true);
              }}
            />
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

        {/* DataTable */}
        <div className="card shadow-sm border-round bg-white p-3">
          <DataTable
            value={data}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="No hay elementos registrados en este catálogo"
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            sortMode="multiple"
          >
            <Column field="nombre" header="Nombre" sortable style={{ minWidth: '15rem' }} />
            <Column field="descripcion" header="Descripción" sortable style={{ minWidth: '25rem' }} />
            <Column
              field="activo"
              header="Estado"
              body={(row: CatalogoItem) => (
                <div className="flex align-items-center gap-2">
                  <InputSwitch
                    checked={row.activo}
                    onChange={e => {
                      actualizarCatalogoItem({
                        ...row,
                        activo: e.value ?? false
                      });
                      toast.current?.show({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `Estado actualizado para ${row.nombre}`,
                        life: 2000
                      });
                    }}
                  />
                  <Tag value={row.activo ? 'Activo' : 'Inactivo'} severity={row.activo ? 'success' : 'secondary'} />
                </div>
              )}
              style={{ minWidth: '10rem' }}
            />
            <Column
              field="fechaCreacion"
              header="Fecha creación"
              body={(row: CatalogoItem) => formatDate(row.fechaCreacion)}
              sortable
              style={{ minWidth: '12rem' }}
            />
            <Column
              header="Acciones"
              body={(row: CatalogoItem) => (
                <div className="flex gap-2 justify-content-center">
                  <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    rounded
                    tooltip="Editar"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => {
                      setSelectedItem(row);
                      setFormData({
                        nombre: row.nombre,
                        descripcion: row.descripcion,
                        activo: row.activo
                      });
                      setDialogEditar(true);
                    }}
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    tooltip="Eliminar"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => {
                      setSelectedItem(row);
                      setDialogEliminar(true);
                    }}
                  />
                </div>
              )}
              style={{ minWidth: '10rem', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      </div>
    );
  };

  const getSingularLabelActive = () => {
    const activeTipo = tipoActivoTab();
    return activeTipo === 'Categoria' ? 'Categoría' :
           activeTipo === 'Ubicacion' ? 'Ubicación' : 'Motivo';
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Encabezado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 m-0 mb-1">
            Gestión de Catálogos
          </h1>
          <p className="text-slate-500 m-0">
            Administración de listas maestras del sistema — Hospital de Especialidades Portoviejo
          </p>
        </div>
      </div>

      {/* TabView */}
      <TabView activeIndex={activeTabIndex} onTabChange={e => {
        setActiveTabIndex(e.index);
        setGlobalFilter('');
      }}>
        {TIPOS_CATALOGO.map((item, index) => (
          <TabPanel
            key={item.tipo}
            header={
              <div className="flex align-items-center gap-2">
                <i className={`pi ${item.icon}`}></i>
                <span>{item.label}</span>
              </div>
            }
          >
            {renderTabContent(item.tipo)}
          </TabPanel>
        ))}
      </TabView>

      {/* Dialog Nuevo elemento */}
      <Dialog
        header={`Nuevo elemento — ${getSingularLabelActive()}`}
        visible={dialogNuevo}
        style={{ width: '500px' }}
        modal
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
              label="Registrar"
              icon="pi pi-plus"
              severity="success"
              onClick={handleGuardarNuevo}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="mb-3">
            <label htmlFor="nuevoNombre" className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
            <InputText
              id="nuevoNombre"
              value={formData.nombre}
              onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ingrese el nombre"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="nuevoDesc" className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
            <InputTextarea
              id="nuevoDesc"
              value={formData.descripcion}
              onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              placeholder="Ingrese la descripción"
            />
          </div>
          <div className="flex align-items-center gap-2 mb-2 mt-4">
            <InputSwitch
              id="nuevoActivo"
              checked={formData.activo}
              onChange={e => setFormData(prev => ({ ...prev, activo: e.value ?? false }))}
            />
            <label htmlFor="nuevoActivo" className="text-sm font-semibold text-slate-700">Disponible para uso inmediato</label>
          </div>
        </div>
      </Dialog>

      {/* Dialog Editar elemento */}
      <Dialog
        header={selectedItem ? `Editar — ${selectedItem.nombre}` : 'Editar Elemento'}
        visible={dialogEditar}
        style={{ width: '500px' }}
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
            <div className="mb-3">
              <label htmlFor="editNombre" className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
              <InputText
                id="editNombre"
                value={formData.nombre}
                onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ingrese el nombre"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="editDesc" className="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
              <InputTextarea
                id="editDesc"
                value={formData.descripcion}
                onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={3}
                placeholder="Ingrese la descripción"
              />
            </div>
            <div className="flex align-items-center gap-2 mb-2 mt-4">
              <InputSwitch
                id="editActivo"
                checked={formData.activo}
                onChange={e => setFormData(prev => ({ ...prev, activo: e.value ?? false }))}
              />
              <label htmlFor="editActivo" className="text-sm font-semibold text-slate-700">Disponible para uso inmediato</label>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog Confirmar eliminación */}
      <Dialog
        header="Eliminar elemento"
        visible={dialogEliminar}
        style={{ width: '420px' }}
        modal
        onHide={() => setDialogEliminar(false)}
        footer={
          <div className="flex justify-content-end gap-2 pt-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => {
                setDialogEliminar(false);
                setSelectedItem(null);
              }}
            />
            <Button
              label="Sí, eliminar"
              icon="pi pi-trash"
              severity="danger"
              onClick={handleConfirmarEliminar}
            />
          </div>
        }
      >
        {selectedItem && (
          <div className="text-center pt-2">
            <i className="pi pi-exclamation-triangle text-red-500 text-5xl mb-3 block"></i>
            <p className="text-slate-700 text-sm mb-3">
              ¿Está seguro de eliminar '<strong className="text-slate-900">{selectedItem.nombre}</strong>' del catálogo? Esta acción no puede deshacerse.
            </p>
            <p className="text-xs text-slate-400 mt-2 line-height-3">
              Nota: si este ítem está siendo usado en otros módulos (activos, traslados o mantenimientos) podría generar inconsistencias visuales.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Catalogos;
