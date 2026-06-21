import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useTrasladosContext, TrasladoHEP } from '../../context/TrasladosContext';
import { useActivos } from '../../context/ActivosContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



/* ------------------------------------------------------------------ */
/*  Utilidad de Formato de Fecha                                     */
/* ------------------------------------------------------------------ */

const safeParseDate = (d: Date | string | null | undefined): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
            const [year, month, day] = d.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) {
            const [year, month, day] = d.split('/').map(Number);
            return new Date(year, month - 1, day);
        }
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (d: Date | string | null | undefined): string => {
    const date = safeParseDate(d);
    if (!date) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/* ------------------------------------------------------------------ */
/*  Componente Principal                                              */
/* ------------------------------------------------------------------ */
const HistorialTraslados: React.FC = () => {
    const { traslados } = useTrasladosContext();
    const { activos } = useActivos();
    const location = useLocation();

    const [globalFilter, setGlobalFilter] = useState('');
    const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
    const [fechaHasta, setFechaHasta] = useState<Date | null>(null);

    // Estados para el modal de detalle
    const [selected, setSelected] = useState<TrasladoHEP | null>(null);
    const [detailVisible, setDetailVisible] = useState<boolean>(false);

    // Efecto para verificar si se pasa un codigoActivo por el state de navegación
    useEffect(() => {
        if (location.state?.codigoActivo) {
            setGlobalFilter(location.state.codigoActivo);
        }
    }, [location.state]);

    const [selectedRows, setSelectedRows] = useState<TrasladoHEP[]>([]);
    const toast = useRef<Toast>(null);

    // Filtrado local por rango de fechas y globalFilter
    const trasladosVisibles = useMemo(() => {
        return traslados.filter(t => {
            // 1. Filtro por fechaDesde
            let matchDesde = true;
            if (fechaDesde && t.fechaTraslado) {
                const [year, month, day] = t.fechaTraslado.split('-').map(Number);
                const fecha = new Date(year, month - 1, day);
                matchDesde = fecha >= fechaDesde;
            }

            // 2. Filtro por fechaHasta
            let matchHasta = true;
            if (fechaHasta && t.fechaTraslado) {
                const [year, month, day] = t.fechaTraslado.split('-').map(Number);
                const fecha = new Date(year, month - 1, day);
                matchHasta = fecha <= fechaHasta;
            }

            // 3. Filtro por globalFilter (búsqueda de texto)
            let matchGlobal = true;
            if (globalFilter.trim()) {
                const search = globalFilter.toLowerCase().trim();
                const fieldsToSearch = [
                    t.referencia,
                    t.codigoActivo,
                    t.nombreActivo,
                    t.categoria,
                    t.ubicacionOrigen,
                    t.ubicacionDestino,
                    t.responsableAnterior,
                    t.nuevoResponsable,
                    t.motivo,
                    t.ejecutadoPor,
                    t.observaciones,
                    t.estado
                ];
                matchGlobal = fieldsToSearch.some(field => 
                    field && field.toLowerCase().includes(search)
                );
            }

            return matchDesde && matchHasta && matchGlobal;
        });
    }, [traslados, fechaDesde, fechaHasta, globalFilter]);

    const obtenerDatosExportacion = (datos: TrasladoHEP[]) => {
        return datos.map(t => ({
            'Referencia': t.referencia || '—',
            'Código Activo': t.codigoActivo || '—',
            'Nombre Activo': t.nombreActivo || '—',
            'Categoría': t.categoria || '—',
            'Origen': t.ubicacionOrigen || '—',
            'Destino': t.ubicacionDestino || '—',
            'Resp. Anterior': t.responsableAnterior || '—',
            'Nuevo Resp.': t.nuevoResponsable || '—',
            'Fecha Traslado': formatDate(t.fechaTraslado),
            'Fecha Ejecución': formatDate(t.fechaEjecucion),
            'Motivo': t.motivo || '—',
            'Ejecutado Por': t.ejecutadoPor || '—',
            'Observaciones': t.observaciones || '—',
            'Estado': t.estado || '—'
        }));
    };

    const exportarExcel = (datos: TrasladoHEP[], esSeleccion: boolean) => {
        if (datos.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'No hay registros para exportar con los filtros actuales.',
                life: 3000
            });
            return;
        }

        const dataExport = obtenerDatosExportacion(datos);
        const worksheet = XLSX.utils.json_to_sheet(dataExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Traslados');
        
        const fechaActual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sufijo = esSeleccion ? '_seleccion' : '';
        XLSX.writeFile(workbook, `historial_traslados_HEP_${fechaActual}${sufijo}.xlsx`);
    };

    const exportarPDF = () => {
        if (trasladosVisibles.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'No hay registros para exportar con los filtros actuales.',
                life: 3000
            });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        const dataExport = obtenerDatosExportacion(trasladosVisibles);
        const headers = Object.keys(dataExport[0]);
        const rows = dataExport.map(row => Object.values(row));

        // Título y Subtítulo
        doc.setFontSize(18);
        doc.text('Historial de Traslados — HEP', 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 14, 22);

        autoTable(doc, {
            startY: 28,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }, // color slate-900
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(
                    `Página ${data.pageNumber} de ${pageCount}`,
                    doc.internal.pageSize.width - 25,
                    doc.internal.pageSize.height - 10
                );
            }
        });

        const fechaActual = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        doc.save(`historial_traslados_HEP_${fechaActual}.pdf`);
    };


    const estadoSeverity = (estado: string): 'warning' | 'success' | 'info' => {
        if (estado === 'Pendiente') return 'warning';
        if (estado === 'Ejecutado') return 'success';
        return 'info';
    };

    /* ---------- templates de DataTable --------------------------- */
    const header = (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ margin: 0 }}>Historial de Traslados</h2>
                <small>Registro completo de todos los traslados registrados en el sistema HEP</small>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Calendar
                    value={fechaDesde}
                    onChange={e => setFechaDesde(e.value as Date | null)}
                    placeholder="Desde"
                    dateFormat="dd/mm/yy"
                    showIcon
                    style={{ width: 150 }}
                />
                <Calendar
                    value={fechaHasta}
                    onChange={e => setFechaHasta(e.value as Date | null)}
                    placeholder="Hasta"
                    dateFormat="dd/mm/yy"
                    showIcon
                    style={{ width: 150 }}
                />
                <div className="p-input-icon-left" style={{ position: 'relative' }}>
                    <i className="pi pi-search" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                    <InputText
                        type="search"
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder="Buscar..."
                        style={{ paddingLeft: '2.2rem' }}
                    />
                </div>
            </div>
        </div>
    );

    const estadoBody = (row: TrasladoHEP) => (
        <Tag value={row.estado} severity={estadoSeverity(row.estado)} />
    );

    const fechaBody = (row: TrasladoHEP) => <span>{formatDate(row.fechaTraslado)}</span>;

    const fechaEjecucionBody = (row: TrasladoHEP) => (
        <span>{row.fechaEjecucion ? formatDate(row.fechaEjecucion) : '—'}</span>
    );

    const handleDescargarActa = (t: TrasladoHEP) => {
        const activoInfo = activos.find(a => a.codigoInstitucional === t.codigoActivo);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permita las ventanas emergentes en su navegador para poder descargar/imprimir el acta.');
            return;
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Acta de Traslado - ${t.referencia}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 40px;
                    background-color: #ffffff;
                    font-size: 13px;
                    line-height: 1.5;
                }
                
                .header-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .header-logo {
                    font-weight: 700;
                    font-size: 24px;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                }
                
                .header-logo span {
                    color: #3b82f6;
                }
                
                .header-title {
                    text-align: right;
                }
                
                .header-title h1 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                
                .header-title p {
                    margin: 4px 0 0 0;
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                }
                
                .doc-info {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                }
                
                .doc-info-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .doc-info-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                
                .doc-info-value {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0f172a;
                }
                
                .section-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #0f172a;
                    text-transform: uppercase;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 6px;
                    margin-top: 25px;
                    margin-bottom: 12px;
                    letter-spacing: 0.5px;
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                
                .data-table th {
                    background-color: #f1f5f9;
                    color: #475569;
                    font-weight: 600;
                    text-align: left;
                    padding: 8px 12px;
                    font-size: 11px;
                    text-transform: uppercase;
                    border: 1px solid #e2e8f0;
                }
                
                .data-table td {
                    padding: 8px 12px;
                    border: 1px solid #e2e8f0;
                    color: #334155;
                }
                
                .description-box {
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 12px;
                    border-radius: 6px;
                    min-height: 40px;
                    color: #334155;
                }
                
                .signatures-container {
                    margin-top: 60px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 40px;
                    page-break-inside: avoid;
                }
                
                .signature-block {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                
                .signature-line {
                    width: 100%;
                    border-top: 1px solid #94a3b8;
                    margin-bottom: 10px;
                }
                
                .signature-name {
                    font-weight: 600;
                    font-size: 11px;
                    color: #0f172a;
                }
                
                .signature-role {
                    font-size: 10px;
                    color: #64748b;
                    margin-top: 2px;
                }
                
                .footer {
                    position: fixed;
                    bottom: 20px;
                    left: 40px;
                    right: 40px;
                    text-align: center;
                    font-size: 9px;
                    color: #94a3b8;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 10px;
                }

                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                    @page {
                        size: portrait;
                        margin: 20mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <div class="header-logo">
                    HEP<span>.frontend</span>
                </div>
                <div class="header-title">
                    <h1>Acta de Entrega-Recepción y Traslado</h1>
                    <p>Hospital de Especialidades Portoviejo — Control de Activos Fijos</p>
                </div>
            </div>
            
            <div class="doc-info">
                <div class="doc-info-item">
                    <span class="doc-info-label">Referencia Acta</span>
                    <span class="doc-info-value">${t.referencia}</span>
                </div>
                <div class="doc-info-item">
                    <span class="doc-info-label">Fecha del Traslado</span>
                    <span class="doc-info-value">${formatDate(t.fechaTraslado)}</span>
                </div>
                <div class="doc-info-item">
                    <span class="doc-info-label">Fecha de Ejecución</span>
                    <span class="doc-info-value">${t.fechaEjecucion ? formatDate(t.fechaEjecucion) : '—'}</span>
                </div>
            </div>
            
            <div class="section-title">1. Información del Activo Fijo</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 20%;">Código Activo</th>
                        <th style="width: 40%;">Nombre del Activo</th>
                        <th style="width: 20%;">Categoría</th>
                        <th style="width: 20%;">Número de Serie</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: 600;">${t.codigoActivo}</td>
                        <td>${t.nombreActivo}</td>
                        <td>${t.categoria}</td>
                        <td>${activoInfo?.numeroSerie || '—'}</td>
                    </tr>
                    <tr>
                        <td colspan="4">
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 11px; color: #475569;">
                                <div><strong>Marca:</strong> ${activoInfo?.marca || '—'}</div>
                                <div><strong>Modelo:</strong> ${activoInfo?.modelo || '—'}</div>
                                <div><strong>Estado Actual:</strong> ${activoInfo?.estadoActivo || '—'}</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div class="section-title">2. Detalles de Origen y Destino</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Unidad/Ubicación de Origen</th>
                        <th style="width: 50%;">Unidad/Ubicación de Destino</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong style="color: #0f172a;">${t.ubicacionOrigen}</strong><br/>
                            <span style="font-size: 11px; color: #64748b;">Custodio Entrega: ${t.responsableAnterior}</span>
                        </td>
                        <td>
                            <strong style="color: #0f172a;">${t.ubicacionDestino}</strong><br/>
                            <span style="font-size: 11px; color: #64748b;">Custodio Recibe: ${t.nuevoResponsable}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div class="section-title">3. Justificación y Motivo del Traslado</div>
            <div class="description-box" style="margin-bottom: 20px;">
                ${t.motivo}
            </div>
            
            ${t.observaciones ? `
            <div class="section-title">4. Observaciones Técnicas</div>
            <div class="description-box" style="margin-bottom: 20px;">
                ${t.observaciones}
            </div>
            ` : ''}
            
            <div class="section-title">5. Responsables y Firmas</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 40px; line-height: 1.6;">
                Se suscribe la presente acta de entrega-recepción y traslado autorizando el cambio físico y de custodia del bien detallado en este documento, de conformidad con las normativas internas del hospital.
            </div>
            
            <div class="signatures-container">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-name">${t.responsableAnterior}</div>
                    <div class="signature-role">Entrega / Responsable Anterior</div>
                </div>
                
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-name">${t.nuevoResponsable}</div>
                    <div class="signature-role">Recibe / Nuevo Responsable</div>
                </div>
                
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-name">${t.ejecutadoPor || '—'}</div>
                    <div class="signature-role">Ejecuta / Técnico de Traslados</div>
                </div>
            </div>
            
            <div class="footer">
                Este documento es un comprobante de control interno emitido por el sistema HEP. Generado el ${new Date().toLocaleString('es-ES')}.
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const accionesBody = (row: TrasladoHEP) => (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-info"
                title="Ver detalle"
                onClick={() => {
                    setSelected(row);
                    setDetailVisible(true);
                }}
            />
            <Button
                icon="pi pi-file-pdf"
                className="p-button-rounded p-button-secondary"
                title="Descargar acta"
                onClick={() => handleDescargarActa(row)}
            />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />

            {/* Barra de herramientas de exportación */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <Button
                    label="Exportar todo"
                    icon="pi pi-download"
                    severity="secondary"
                    onClick={() => exportarExcel(trasladosVisibles, false)}
                />
                <Button
                    label="Exportar selección"
                    icon="pi pi-check-square"
                    severity="info"
                    disabled={selectedRows.length === 0}
                    onClick={() => exportarExcel(selectedRows, true)}
                />
                <Button
                    label="Exportar PDF"
                    icon="pi pi-file-pdf"
                    severity="danger"
                    onClick={exportarPDF}
                />
            </div>

            {/* Contador de registros */}
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                Mostrando {trasladosVisibles.length} de {traslados.length} traslados | {selectedRows.length} seleccionados
            </div>

            <DataTable
                value={trasladosVisibles}
                selection={selectedRows}
                onSelectionChange={e => setSelectedRows(e.value as TrasladoHEP[])}
                selectionMode="multiple"
                header={header}
                globalFilter={globalFilter}
                globalFilterFields={[
                    'referencia',
                    'codigoActivo',
                    'nombreActivo',
                    'categoria',
                    'ubicacionOrigen',
                    'ubicacionDestino',
                    'responsableAnterior',
                    'nuevoResponsable',
                    'motivo',
                    'ejecutadoPor',
                    'observaciones',
                    'estado'
                ]}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay registros en el historial"
                responsiveLayout="scroll"
                stripedRows
            >
                <Column selectionMode="multiple" style={{ width: '3rem' }} />
                <Column field="codigoActivo" header="Código del activo" sortable />
                <Column field="referencia" header="Referencia" sortable />
                <Column field="nombreActivo" header="Nombre del activo" sortable />
                <Column field="ubicacionOrigen" header="Origen" sortable />
                <Column field="ubicacionDestino" header="Destino" sortable />
                <Column field="responsableAnterior" header="Resp. anterior" sortable />
                <Column field="nuevoResponsable" header="Nuevo resp." sortable />
                <Column field="fechaTraslado" header="Fecha traslado" body={fechaBody} sortable />
                <Column field="fechaEjecucion" header="Fecha ejecución" body={fechaEjecucionBody} sortable />
                <Column field="motivo" header="Motivo" />
                <Column field="ejecutadoPor" header="Ejecutado por" sortable />
                <Column field="estado" header="Estado" body={estadoBody} sortable />
                <Column header="Acciones" body={accionesBody} />
            </DataTable>

            {/* Diálogo de Detalle */}
            <Dialog
                header="Detalle de Traslado"
                visible={detailVisible}
                style={{ width: '560px' }}
                modal
                onHide={() => setDetailVisible(false)}
            >
                {selected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {/* Cabecera del detalle */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>Referencia</div>
                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{selected.referencia}</div>
                            </div>
                            <Tag value={selected.estado} severity={estadoSeverity(selected.estado)} style={{ fontSize: '12px', padding: '4px 12px' }} />
                        </div>

                        {/* Activo */}
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '6px' }}>Activo</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px' }}>
                                <div><span style={{ color: '#94a3b8', fontSize: '11px' }}>Código: </span><strong>{selected.codigoActivo}</strong></div>
                                <div><span style={{ color: '#94a3b8', fontSize: '11px' }}>Categoría: </span>{selected.categoria}</div>
                                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8', fontSize: '11px' }}>Nombre: </span>{selected.nombreActivo}</div>
                            </div>
                        </div>

                        {/* Origen → Destino */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700, marginBottom: '4px' }}>Origen</div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e3a5f' }}>{selected.ubicacionOrigen}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Entrega: {selected.responsableAnterior}</div>
                            </div>
                            <i className="pi pi-arrow-right" style={{ color: '#3b82f6', fontSize: '18px' }} />
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: 700, marginBottom: '4px' }}>Destino</div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e3a5f' }}>{selected.ubicacionDestino}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Recibe: {selected.nuevoResponsable}</div>
                            </div>
                        </div>

                        {/* Fechas y ejecutor */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            {[{ label: 'Fecha traslado', value: formatDate(selected.fechaTraslado) }, { label: 'Fecha ejecución', value: selected.fechaEjecucion ? formatDate(selected.fechaEjecucion) : '—' }, { label: 'Ejecutado por', value: selected.ejecutadoPor || '—' }].map(item => (
                                <div key={item.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>{item.label}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Motivo */}
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Motivo</div>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{selected.motivo}</div>
                        </div>

                        {/* Observaciones */}
                        {selected.observaciones && (
                            <div>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Observaciones</div>
                                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{selected.observaciones}</div>
                            </div>
                        )}
                    </div>
                ) : null}
            </Dialog>
        </div>
    );
};

export default HistorialTraslados;
