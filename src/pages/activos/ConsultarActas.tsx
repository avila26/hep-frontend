import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useActas, ActaIngreso, calcularVigenciaGarantia } from '../../context/ActasContext';
import { useActivos } from '../../context/ActivosContext';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const formatDate = (d: Date | string | null | undefined): string => {
    if (!d) return '—';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '—';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const GarantiaBadge: React.FC<{ acta: ActaIngreso }> = ({ acta }) => {
    if (!acta.tieneGarantia) {
        return <span style={{ color: '#94a3b8', fontSize: 12 }}>⚪ Sin garantía</span>;
    }
    const v = calcularVigenciaGarantia(acta.fechaInicioGarantia, acta.fechaFinGarantia);
    const config = {
        vigente:    { icon: '🟢', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        por_vencer: { icon: '🟡', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        vencida:    { icon: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        sin_datos:  { icon: '⚪', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' }
    }[v.nivel];
    return (
        <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 999,
            background: config.bg, color: config.color,
            border: `1px solid ${config.border}`, fontSize: 11, fontWeight: 600
        }}>
            {config.icon} {v.texto}
        </span>
    );
};

/* ─── Componente ─────────────────────────────────────────────────────────── */

const ConsultarActas: React.FC = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { actas, eliminarActa, cerrarActa } = useActas();
    const { activos, agregarActivos } = useActivos();

    /* ── Filtros ── */
    const [globalFilter, setGlobalFilter] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
    const [filtroDesde, setFiltroDesde] = useState<Date | null>(null);
    const [filtroHasta, setFiltroHasta] = useState<Date | null>(null);

    /* ── Modal de detalle ── */
    const [detalle, setDetalle] = useState<ActaIngreso | null>(null);

    const seriesExistentesEnSistema = useMemo(
        () => new Set(activos.map(a => a.numeroSerie).filter(Boolean)),
        [activos]
    );

    const actasFiltradas = useMemo(() => {
        return actas.filter(a => {
            if (filtroEstado && a.estado !== filtroEstado) return false;
            if (filtroTipo && a.tipoIngreso !== filtroTipo) return false;
            if (filtroDesde) {
                const f = new Date(a.fechaIngreso);
                f.setHours(0, 0, 0, 0);
                if (f < filtroDesde) return false;
            }
            if (filtroHasta) {
                const f = new Date(a.fechaIngreso);
                f.setHours(0, 0, 0, 0);
                if (f > filtroHasta) return false;
            }
            if (globalFilter.trim()) {
                const q = globalFilter.toLowerCase().trim();
                const campos = [a.referencia, a.empresaProveedora, a.numeroOrdenMemorandum, a.tecnicoReceptor, a.responsableEntrega];
                if (!campos.some(c => c && c.toLowerCase().includes(q))) return false;
            }
            return true;
        });
    }, [actas, filtroEstado, filtroTipo, filtroDesde, filtroHasta, globalFilter]);

    const totalSeries = (acta: ActaIngreso) =>
        acta.lineas.reduce((sum, l) => sum + l.series.length, 0);

    /* ── Acciones ── */
    const handleEliminar = (acta: ActaIngreso) => {
        confirmDialog({
            message: `¿Eliminar el borrador "${acta.referencia}"? Esta acción no se puede deshacer.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => {
                eliminarActa(acta.idActa);
                toast.current?.show({ severity: 'info', summary: 'Borrador eliminado', detail: acta.referencia, life: 3000 });
            }
        });
    };

    const handleCerrar = (acta: ActaIngreso) => {
        confirmDialog({
            message: `¿Cerrar el acta "${acta.referencia}"? Se generarán ${totalSeries(acta)} hojas de vida. Esta acción no se puede revertir.`,
            header: 'Cerrar Acta',
            icon: 'pi pi-lock',
            acceptLabel: 'Sí, cerrar acta',
            acceptClassName: 'p-button-success',
            accept: () => {
                const result = cerrarActa(acta, seriesExistentesEnSistema, agregarActivos);
                if (!result.success) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'No se pudo cerrar el acta',
                        detail: result.errores.join('\n'),
                        life: 8000
                    });
                } else {
                    toast.current?.show({
                        severity: 'success',
                        summary: '¡Acta cerrada!',
                        detail: `${result.activosCreados?.length ?? 0} hojas de vida generadas`,
                        life: 5000
                    });
                }
            }
        });
    };

    /* ── Templates de columna ── */
    const estadoBody = (row: ActaIngreso) => (
        <Tag value={row.estado} severity={row.estado === 'Cerrada' ? 'success' : 'warning'} />
    );

    const garantiaBody = (row: ActaIngreso) => <GarantiaBadge acta={row} />;

    const seriesBody = (row: ActaIngreso) => {
        const total = totalSeries(row);
        const completo = row.lineas.every(l => l.series.length === l.cantidadDeclarada);
        return (
            <span className={`text-sm font-semibold ${completo ? 'text-green-600' : 'text-amber-600'}`}>
                {total} {row.lineas.length > 1 ? `(${row.lineas.length} líneas)` : ''}
            </span>
        );
    };

    const accionesBody = (row: ActaIngreso) => (
        <div style={{ display: 'flex', gap: 6 }}>
            <Button icon="pi pi-eye" rounded text severity="info" title="Ver detalle"
                onClick={() => setDetalle(row)} />
            {row.estado === 'Borrador' && (<>
                <Button icon="pi pi-pencil" rounded text severity="secondary" title="Editar"
                    onClick={() => navigate(`/activos/actas/${row.idActa}`)} />
                <Button icon="pi pi-lock" rounded text severity="success" title="Cerrar acta"
                    onClick={() => handleCerrar(row)} />
                <Button icon="pi pi-trash" rounded text severity="danger" title="Eliminar borrador"
                    onClick={() => handleEliminar(row)} />
            </>)}
            {row.estado === 'Cerrada' && row.activosGenerados && (
                <Button icon="pi pi-list" rounded text severity="info" title="Ver activos generados"
                    onClick={() => navigate('/activos/consultar')} />
            )}
        </div>
    );

    /* ── Header DataTable ── */
    const header = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Actas de Ingreso</h2>
                <small>Registro de todos los ingresos al sistema HEP</small>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Dropdown
                    value={filtroEstado}
                    options={[{ label: 'Todos los estados', value: null }, { label: 'Borrador', value: 'Borrador' }, { label: 'Cerrada', value: 'Cerrada' }]}
                    onChange={e => setFiltroEstado(e.value)}
                    style={{ width: 160 }}
                    className="text-sm"
                />
                <Dropdown
                    value={filtroTipo}
                    options={[
                        { label: 'Todos los tipos', value: null },
                        { label: 'Orden de compra', value: 'Orden de compra' },
                        { label: 'Memorando', value: 'Memorando de ingreso' },
                        { label: 'Acta de Entrega-Recepción', value: 'Acta de Entrega-Recepción' },
                        { label: 'Contrato', value: 'Contrato' },
                        { label: 'Migración inicial', value: 'Migración inicial' }
                    ]}
                    onChange={e => setFiltroTipo(e.value)}
                    style={{ width: 190 }}
                    className="text-sm"
                />
                <Calendar value={filtroDesde} onChange={e => setFiltroDesde(e.value as Date | null)}
                    placeholder="Desde" dateFormat="dd/mm/yy" showIcon style={{ width: 150 }} />
                <Calendar value={filtroHasta} onChange={e => setFiltroHasta(e.value as Date | null)}
                    placeholder="Hasta" dateFormat="dd/mm/yy" showIcon style={{ width: 150 }} />
                <div style={{ position: 'relative' }}>
                    <i className="pi pi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                    <InputText
                        type="search"
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder="Buscar..."
                        style={{ paddingLeft: '2.2rem', width: 200 }}
                    />
                </div>
            </div>
        </div>
    );

    /* ── Modal de detalle ── */
    const renderDetalle = () => {
        if (!detalle) return null;
        return (
            <Dialog
                header={`Detalle — ${detalle.referencia}`}
                visible={!!detalle}
                style={{ width: 600 }}
                modal
                onHide={() => setDetalle(null)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Cabecera del detalle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px' }}>
                        <div>
                            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Referencia</div>
                            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{detalle.referencia}</div>
                        </div>
                        <Tag value={detalle.estado} severity={detalle.estado === 'Cerrada' ? 'success' : 'warning'} />
                    </div>

                    {/* Grid de info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {[
                            { label: 'Tipo de ingreso', value: detalle.tipoIngreso },
                            {
                                label: 
                                    detalle.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra' :
                                    detalle.tipoIngreso === 'Memorando de ingreso' ? 'N.º de Memorando' :
                                    detalle.tipoIngreso === 'Acta de Entrega-Recepción' ? 'N.º de Acta' :
                                    detalle.tipoIngreso === 'Contrato' ? 'N.º de Contrato' : 'N.º Orden / Memorando',
                                value: detalle.numeroOrdenMemorandum
                            },
                            { 
                                label: detalle.tipoIngreso === 'Acta de Entrega-Recepción' ? 'Empresa proveedora / Institución' : 'Empresa proveedora', 
                                value: detalle.tipoIngreso === 'Memorando de ingreso' ? '' : detalle.empresaProveedora 
                            },
                            { label: 'Fecha de ingreso', value: formatDate(detalle.fechaIngreso) },
                            { label: 'Técnico receptor', value: detalle.tecnicoReceptor },
                            { label: 'Responsable de entrega', value: detalle.responsableEntrega },
                            { label: 'Total de series', value: String(totalSeries(detalle)) }
                        ].filter(item => item.label && (item.value !== '' && item.value !== undefined)).map(item => (
                            <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.value || '—'}</div>
                            </div>
                        ))}
                    </div>

                    {/* Garantía */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#92400e', marginBottom: 6 }}>
                            <i className="pi pi-shield mr-1" />Garantía
                        </div>
                        {detalle.tieneGarantia ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <div><div style={{ fontSize: 10, color: '#78350f' }}>Inicio</div><div style={{ fontWeight: 600 }}>{formatDate(detalle.fechaInicioGarantia)}</div></div>
                                <div><div style={{ fontSize: 10, color: '#78350f' }}>Fin</div><div style={{ fontWeight: 600 }}>{formatDate(detalle.fechaFinGarantia)}</div></div>
                                <div><div style={{ fontSize: 10, color: '#78350f' }}>Vigencia</div><GarantiaBadge acta={detalle} /></div>
                            </div>
                        ) : <span style={{ color: '#94a3b8', fontSize: 13 }}>Sin garantía</span>}
                    </div>

                    {/* Líneas */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                            Líneas del acta ({detalle.lineas.length})
                        </div>
                        {detalle.lineas.map((l, i) => (
                            <div key={l.idLinea} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 4 }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>#{i + 1} {l.tipoActivo}</span>
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}> — {l.marca} {l.modelo}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <Tag value={l.moduloDestino} severity="info" style={{ fontSize: 10 }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: l.series.length === l.cantidadDeclarada ? '#16a34a' : '#d97706' }}>
                                        {l.series.length}/{l.cantidadDeclarada} series
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {detalle.observacionGeneral && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', fontSize: 13, color: '#334155' }}>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Observación general</div>
                            {detalle.observacionGeneral}
                        </div>
                    )}
                </div>
            </Dialog>
        );
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <Button
                    label="Nueva Acta de Ingreso"
                    icon="pi pi-plus"
                    onClick={() => navigate('/activos/actas/nueva')}
                />
            </div>

            {/* Contador */}
            <div style={{ marginBottom: 12, fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                Mostrando {actasFiltradas.length} de {actas.length} actas
            </div>

            <DataTable
                value={actasFiltradas}
                header={header}
                paginator rows={10} rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay actas de ingreso registradas"
                responsiveLayout="scroll"
                stripedRows
            >
                <Column field="referencia" header="Referencia" sortable style={{ fontFamily: 'monospace', fontWeight: 600 }} />
                <Column field="tipoIngreso" header="Tipo" sortable />
                <Column field="empresaProveedora" header="Proveedor" sortable />
                <Column field="numeroOrdenMemorandum" header="N.º Orden / Memo" />
                <Column header="Series" body={seriesBody} />
                <Column field="fechaIngreso" header="Fecha ingreso"
                    body={(row: ActaIngreso) => formatDate(row.fechaIngreso)} sortable />
                <Column header="Garantía" body={garantiaBody} />
                <Column header="Estado" body={estadoBody} sortable />
                <Column header="Acciones" body={accionesBody} style={{ minWidth: 160 }} />
            </DataTable>

            {renderDetalle()}
        </div>
    );
};

export default ConsultarActas;
