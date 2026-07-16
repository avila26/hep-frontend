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
import { useActas, ActaIngreso } from '../../context/ActasContext';
import { useActivos } from '../../context/ActivosContext';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const formatDate = (d: Date | string | null | undefined): string => {
    if (!d) return '—';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '—';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

/* ─── Componente ─────────────────────────────────────────────────────────── */

const ConsultarActas: React.FC = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { actas } = useActas();
    const { activos } = useActivos();

    /* ── Filtros ── */
    const [globalFilter, setGlobalFilter] = useState('');
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
    }, [actas, filtroTipo, filtroDesde, filtroHasta, globalFilter]);

    const totalSeries = (acta: ActaIngreso) =>
        acta.lineas.reduce((sum, l) => sum + l.series.length, 0);

    /* ── Templates de columna ── */

    const seriesBody = (row: ActaIngreso) => {
        const total = totalSeries(row);
        const completo = row.lineas.every(l => l.series.length === l.cantidadDeclarada);
        return (
            <span className={`text-sm font-semibold ${completo ? 'text-green-600' : 'text-amber-600'}`}>
                {total} {row.lineas.length > 1 ? `(${row.lineas.length} líneas)` : ''}
            </span>
        );
    };

    const actionBodyTemplate = (row: ActaIngreso) => (
        <Button icon="pi pi-eye" rounded text severity="info" title="Ver detalle"
            onClick={() => setDetalle(row)} />
    );

    const fechaBody = (row: ActaIngreso) => formatDate(row.fechaIngreso);

    /* ── Header DataTable ── */
    const header = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Actas de Ingreso</h2>
                <small>Registro de todos los ingresos al sistema HEP</small>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
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
                        placeholder="N.º Comprobante / Acta..."
                        style={{ paddingLeft: '2.2rem', width: 230 }}
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
                    </div>

                    {/* Grid de info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {[
                            { label: 'Tipo de ingreso', value: detalle.tipoIngreso },
                            {
                                label: 'N.º Comprobante / Acta',
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


                    {/* Activos vinculados */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                            Activos registrados en el acta ({detalle.lineas.reduce((acc: number, l: any) => acc + l.series.length, 0)})
                        </div>
                        {detalle.lineas.flatMap((l: any) => l.series).map((s: any, idx: number) => (
                            <div key={s.idSerie} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 6 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 12 }}>{s.codigoBarras || 'Sin código'}</div>
                                    <div style={{ color: '#64748b', fontSize: 11 }}>Serie: {s.numeroSerie}</div>
                                </div>
                                <Tag value={s.estadoIndividual} severity={s.estadoIndividual === 'Bueno' ? 'success' : s.estadoIndividual === 'Regular' ? 'warning' : 'danger'} style={{ fontSize: 10 }} />
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
                <Column field="numeroOrdenMemorandum" header="N.º Comprobante / Acta" style={{ minWidth: '150px' }} />
                <Column field="totalSeries" header="Series" style={{ minWidth: '100px' }} body={seriesBody} />
                <Column field="fechaIngreso" header="Fecha ingreso" sortable body={fechaBody} style={{ minWidth: '130px' }} />
                <Column body={actionBodyTemplate} header="Acciones" align="center" style={{ minWidth: '80px' }} />
            </DataTable>

            {renderDetalle()}
        </div>
    );
};

export default ConsultarActas;
