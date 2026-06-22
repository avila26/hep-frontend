import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Timeline } from 'primereact/timeline';
import {
    useActivos,
    AtributosEquipoBiomedico,
    AtributosCPU,
    AtributosMonitor,
    AtributosTeclado,
    AtributosMouse,
    AtributosImpresoraRed,
    AtributosTelefonoIp,
    AtributosCCTV,
    AtributosAccessPoint,
    AtributosLaboratorio,
    AtributosRayosImagen
} from '../../context/ActivosContext';
import { useTrasladosContext } from '../../context/TrasladosContext';
import { useActas, calcularVigenciaGarantia } from '../../context/ActasContext';
import { useMantenimientosContext } from '../../context/MantenimientosContext';
import { useBajasContext } from '../../context/BajasContext';

const ETIQUETAS_ESTADO: Record<string, string> = {
    BUE: 'Bueno',
    REG: 'Regular',
    BOD: 'En bodega',
    MAL: 'Malo',
    MAN: 'En mantenimiento',
    OBS: 'Obsoleto',
    EGR: 'Egresado',
    BAJ: 'Dado de baja',
    Bueno: 'Bueno',
    Regular: 'Regular',
    Malo: 'Malo',
    'En Reparación': 'En mantenimiento',
    'Dado de Baja': 'Dado de baja'
};

const normalizarEstadoActivo = (estado: string): string => {
    const mapaLegacy: Record<string, string> = {
        Bueno: 'BUE',
        Regular: 'REG',
        Malo: 'MAL',
        'En bodega': 'BOD',
        'En Bodega': 'BOD',
        'En mantenimiento': 'MAN',
        'En Mantenimiento': 'MAN',
        Obsoleto: 'OBS',
        Egresado: 'EGR',
        'Dado de baja': 'BAJ',
        'Dado de Baja': 'BAJ',
        'En Reparación': 'MAN'
    };
    return mapaLegacy[estado] ?? estado.toUpperCase();
};

const NOMBRES_CPU = new Set(['CPU / Unidad Central', 'Laptop', 'Tablet', 'Servidor']);

const getCategoryCodeFromLabel = (categoryLabel: string): string => {
    if (!categoryLabel) return '';
    const match = categoryLabel.match(/\(([^)]+)\)$/);
    return match ? match[1] : categoryLabel;
};

const getEspecificoKey = (categoriaActivo: string, nombre: string): string => {
    const cat = getCategoryCodeFromLabel(categoriaActivo);
    const nom = nombre;
    if (cat === 'EQM') return 'EQM';
    if (cat === 'EQL') return 'EQL';
    if (cat === 'EQR') return 'EQR';
    if (cat === 'EQI') {
        if (NOMBRES_CPU.has(nom)) return 'CPU';
        if (nom === 'Monitor') return 'MON';
        if (nom === 'Teclado') return 'TEC';
        if (nom === 'Mouse') return 'MOU';
        if (nom === 'Impresora de red') return 'IMP';
        if (nom === 'Teléfono IP') return 'TEL';
        if (nom === 'Cámara CCTV / NVR') return 'CCTV';
        if (nom === 'Access Point / WiFi') return 'AP';
    }
    return '';
};

interface TimelineEvent {
    id: string;
    fecha: Date;
    tipo: 'registro' | 'traslado' | 'mantenimiento' | 'cambio_estado' | 'egreso';
    titulo: string;
    detalleShort: string;
    icon: string;
    color: string;
    extraInfo: React.ReactNode;
}

export const HojaDeVida: React.FC = () => {
    const { idActivo } = useParams<{ idActivo?: string }>();
    const navigate = useNavigate();
    const { activos } = useActivos();
    const { traslados } = useTrasladosContext();
    const { actas } = useActas();
    const { mantenimientos } = useMantenimientosContext();
    const { informes } = useBajasContext();
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

    const activo = useMemo(() => {
        if (!idActivo) return null;
        return activos.find(a => String(a.idActivo) === idActivo) || null;
    }, [activos, idActivo]);

    const toggleExpand = (eventId: string) => {
        setExpandedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    };

    // Recopilar y estructurar todos los eventos del activo
    const timelineEvents = useMemo(() => {
        if (!activo) return [];
        const events: TimelineEvent[] = [];

        // 1. Registro Inicial
        events.push({
            id: 'reg-inicial',
            fecha: activo.fechaAdquisicion ? new Date(activo.fechaAdquisicion) : new Date(2025, 0, 1),
            tipo: 'registro',
            titulo: 'Registro Inicial del Activo',
            detalleShort: `Activo registrado con Código Institucional ${activo.codigoInstitucional || 'autogenerado'}.`,
            icon: 'pi pi-plus-circle',
            color: '#10B981', // Emerald
            extraInfo: (
                <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p><strong>Fecha de Adquisición:</strong> {activo.fechaAdquisicion ? new Date(activo.fechaAdquisicion).toLocaleDateString('es-ES') : '—'}</p>
                    <p><strong>Ubicación de Registro:</strong> {activo.ubicacion || '—'}</p>
                    <p><strong>Custodio Inicial:</strong> {activo.responsableEntrega || '—'}</p>
                    <p><strong>Origen de Ingreso:</strong> {activo.origenIngreso || '—'}</p>
                    <p><strong>Motivo de Ingreso:</strong> {activo.motivoIngreso || '—'}</p>
                    {activo.valorAdquisicion !== null && (
                        <p><strong>Valor de Adquisición:</strong> ${new Intl.NumberFormat('es-ES').format(activo.valorAdquisicion)} USD</p>
                    )}
                </div>
            )
        });

        // 2. Traslados (desde TrasladosContext)
        const trasladosActivo = traslados.filter(t => t.codigoActivo === activo.codigoInstitucional);

        const allTraslados = trasladosActivo.map((t, i) => ({
            id: t.id,
            codigoActivo: t.codigoActivo,
            nombreActivo: t.nombreActivo,
            ubicacionOrigen: t.ubicacionOrigen,
            ubicacionDestino: t.ubicacionDestino,
            responsableAnterior: t.responsableAnterior,
            nuevoResponsable: t.nuevoResponsable,
            fechaTraslado: t.fechaTraslado ? new Date(t.fechaTraslado + 'T00:00:00') : new Date(),
            motivo: t.motivo,
            estado: t.estado,
            key: `traslado-${i}`
        }));

        allTraslados.forEach((t) => {
            const dateVal = t.fechaTraslado;
            events.push({
                id: `traslado-${t.id}-${t.key}`,
                fecha: dateVal,
                tipo: 'traslado',
                titulo: `Traslado - Estado: ${t.estado}`,
                detalleShort: `Reubicación desde "${t.ubicacionOrigen}" hacia "${t.ubicacionDestino}".`,
                icon: 'pi pi-exchange',
                color: t.estado === 'Ejecutado' ? '#3B82F6' : '#F59E0B', // Blue (Ejecutado), Amber (Pendiente)
                extraInfo: (
                    <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p><strong>Ubicación Origen:</strong> {t.ubicacionOrigen}</p>
                        <p><strong>Ubicación Destino:</strong> {t.ubicacionDestino}</p>
                        <p><strong>Custodio Anterior:</strong> {t.responsableAnterior}</p>
                        <p><strong>Nuevo Custodio:</strong> {t.nuevoResponsable}</p>
                        <p><strong>Motivo del Traslado:</strong> {t.motivo}</p>
                    </div>
                )
            });
        });

        // 3. Mantenimientos (desde MantenimientosContext)
        const mantenimientosActivo = (mantenimientos || []).filter(m => m.codigoActivo === activo.codigoInstitucional);
        mantenimientosActivo.forEach(m => {
            const dateVal = m.fechaCierre ? new Date(m.fechaCierre + 'T00:00:00') : (m.fechaInicio ? new Date(m.fechaInicio + 'T00:00:00') : new Date(m.fechaRegistro));
            events.push({
                id: `maint-${m.id}`,
                fecha: dateVal,
                tipo: 'mantenimiento',
                titulo: `Mantenimiento ${m.tipo}`,
                detalleShort: `${m.descripcionTrabajo || 'Acción técnica de tipo ' + m.tipo.toLowerCase()}. Estado: ${m.estado}.`,
                icon: m.tipo === 'Correctivo' ? 'pi pi-wrench' : 'pi pi-cog',
                color: m.tipo === 'Correctivo' ? '#EF4444' : '#6366F1', // Red, Indigo
                extraInfo: (
                    <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p><strong>Referencia:</strong> {m.referencia}</p>
                        <p><strong>Tipo:</strong> {m.tipo}</p>
                        <p><strong>Estado:</strong> {m.estado}</p>
                        <p><strong>Fecha Programada:</strong> {m.fechaProgramada || '—'}</p>
                        {m.fechaInicio && <p><strong>Fecha de Inicio:</strong> {m.fechaInicio}</p>}
                        {m.fechaCierre && <p><strong>Fecha de Cierre:</strong> {m.fechaCierre}</p>}
                        <p><strong>Descripción del Trabajo:</strong> {m.descripcionTrabajo || '—'}</p>
                        {m.diagnostico && <p><strong>Diagnóstico:</strong> {m.diagnostico}</p>}
                        {m.repuestosUtilizados && <p><strong>Repuestos Utilizados:</strong> {m.repuestosUtilizados}</p>}
                        <p><strong>Responsable Técnico:</strong> {m.responsableTecnico || '—'}</p>
                        {m.observaciones && <p><strong>Observaciones:</strong> {m.observaciones}</p>}
                    </div>
                )
            });
        });

        // 4. Solicitudes de Baja (desde BajasContext)
        const informesActivo = (informes || []).filter(inf => inf.bienes.some(b => b.codigoActivo === activo.codigoInstitucional));
        informesActivo.forEach(inf => {
            const dateVal = inf.fechaEgreso ? new Date(inf.fechaEgreso + 'T00:00:00') : (inf.fechaAprobacion ? new Date(inf.fechaAprobacion + 'T00:00:00') : new Date(inf.fechaRegistro));
            events.push({
                id: `baja-${inf.id}`,
                fecha: dateVal,
                tipo: 'egreso',
                titulo: `Solicitud de Baja - Ref: ${inf.referencia}`,
                detalleShort: `Informe técnico de baja en estado: ${inf.estado}.`,
                icon: inf.estado === 'Egresado' ? 'pi pi-ban' : 'pi pi-file',
                color: inf.estado === 'Egresado' ? '#6B7280' : '#8B5CF6', // Gray (Egresado), Purple
                extraInfo: (
                    <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p><strong>Referencia de Informe:</strong> {inf.referencia}</p>
                        <p><strong>Estado:</strong> {inf.estado}</p>
                        <p><strong>Elaborado por:</strong> {inf.elaboradoPor} ({inf.tipoSolicitante})</p>
                        <p><strong>Fecha Elaboración:</strong> {inf.fechaElaboracion}</p>
                        <p><strong>Antecedentes:</strong> {inf.antecedentes}</p>
                        <p><strong>Justificación Técnica:</strong> {inf.justificacionTecnica}</p>
                        <p><strong>Recomendación:</strong> {inf.recomendacion}</p>
                        {inf.fechaRevision && <p><strong>Revisado por:</strong> {inf.revisadoPor} el {inf.fechaRevision}</p>}
                        {inf.fechaAprobacion && <p><strong>Aprobado por:</strong> {inf.aprobadoPor} el {inf.fechaAprobacion}</p>}
                        {inf.fechaEgreso && (
                            <>
                                <p><strong>Fecha Egreso:</strong> {inf.fechaEgreso}</p>
                                <p><strong>Motivo Egreso:</strong> {inf.motivoEgreso}</p>
                                <p><strong>Registrado por:</strong> {inf.registradoPorEgreso}</p>
                            </>
                        )}
                    </div>
                )
            });
        });

        // 5. Egreso de Bien (Bajas / Egresos generales si no hay informe específico)
        const estadoNorm = normalizarEstadoActivo(activo.estadoActivo);
        if ((estadoNorm === 'BAJ' || estadoNorm === 'EGR') && !informesActivo.some(inf => inf.estado === 'Egresado')) {
            events.push({
                id: 'egreso-final',
                fecha: activo.fechaDNS ? new Date(activo.fechaDNS) : new Date(),
                tipo: 'egreso',
                titulo: 'Baja / Egreso Definitivo del Activo',
                detalleShort: `Retirado formalmente de la custodia del hospital. Estado: ${activo.estadoActivo}.`,
                icon: 'pi pi-ban',
                color: '#6B7280', // Gray
                extraInfo: (
                    <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p><strong>Fecha de Salida/DNS:</strong> {activo.fechaDNS ? new Date(activo.fechaDNS).toLocaleDateString('es-ES') : '—'}</p>
                        <p><strong>Ubicación de Salida:</strong> {activo.ubicacion || '—'}</p>
                        {activo.numeroActa && <p><strong>Número de Acta de Baja:</strong> {activo.numeroActa}</p>}
                    </div>
                )
            });
        }

        // Ordenar descendentemente por fecha
        return events.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    }, [activo, traslados, mantenimientos, informes]);

    if (!activo) {
        return (
            <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
                <Card className="max-w-md w-full text-center shadow-lg p-6 bg-white dark:bg-slate-800">
                    <i className="pi pi-history text-5xl text-slate-400 mb-4"></i>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hoja de Vida de Activo</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        No se ha seleccionado ningún activo o el identificador es inválido. Por favor, regrese a la consulta de activos para seleccionar uno.
                    </p>
                    <Button
                        label="Ir a Consultar Activos"
                        icon="pi pi-arrow-left"
                        onClick={() => navigate('/activos/consultar')}
                        className="w-full"
                    />
                </Card>
            </div>
        );
    }

    const customizeMarker = (item: TimelineEvent) => {
        return (
            <span
                className="flex items-center justify-center text-white rounded-full w-8 h-8 shadow-md"
                style={{ backgroundColor: item.color }}
            >
                <i className={`${item.icon} text-sm`}></i>
            </span>
        );
    };

    const customizeContent = (item: TimelineEvent) => {
        const isExpanded = !!expandedEvents[item.id];
        return (
            <Card className="mb-4 shadow-sm border border-slate-100 dark:border-slate-850 p-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.titulo}</span>
                    <span className="text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                        {item.fecha.toLocaleDateString('es-ES')} {item.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 m-0 leading-relaxed">{item.detalleShort}</p>

                {isExpanded && item.extraInfo}

                <div className="flex justify-end mt-2">
                    <Button
                        label={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        icon={isExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
                        onClick={() => toggleExpand(item.id)}
                        className="p-button-text p-button-sm p-0 text-blue-500 hover:text-blue-600 font-medium text-xs"
                    />
                </div>
            </Card>
        );
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-6">Hoja de Vida</h1>

            {/* Cabecera estilizada de Identificación */}
            <Card className="shadow-lg mb-6 pt-0 border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-850 dark:text-slate-100">{activo.nombre}</h2>
                        <p className="text-sm text-slate-500 m-0 mt-1">
                            Código Institucional: <strong className="text-slate-700 dark:text-slate-300">{activo.codigoInstitucional || '—'}</strong>
                        </p>
                    </div>
                    <Button
                        label="Volver a Consultar Activos"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        outlined
                        onClick={() => navigate('/activos/consultar')}
                        className="w-full sm:w-auto"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Número de Serie</div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">
                            {activo.numeroSerie || '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Categoría</div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">
                            {activo.categoriaActivo || '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Ubicación Actual</div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">
                            {activo.ubicacion || '—'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Estado Actual</div>
                        <div className="mt-1">
                            <span
                                className={`px-3 py-1.5 rounded text-sm font-semibold inline-block
                                ${normalizarEstadoActivo(activo.estadoActivo) === 'BUE' ? 'bg-green-100 text-green-800' : ''}
                                ${normalizarEstadoActivo(activo.estadoActivo) === 'REG' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${normalizarEstadoActivo(activo.estadoActivo) === 'MAL' ? 'bg-red-100 text-red-800' : ''}
                                ${normalizarEstadoActivo(activo.estadoActivo) === 'MAN' ? 'bg-blue-100 text-blue-800' : ''}
                                ${normalizarEstadoActivo(activo.estadoActivo) === 'BAJ' ? 'bg-gray-100 text-gray-800' : ''}
                            `}
                            >
                                {ETIQUETAS_ESTADO[activo.estadoActivo] || ETIQUETAS_ESTADO[normalizarEstadoActivo(activo.estadoActivo)] || activo.estadoActivo}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* ─ Acta de Ingreso ─ (solo si el activo fue creado desde un acta) */}
            {activo.idActa && (() => {
                const acta = actas.find(a => a.idActa === activo.idActa);
                if (!acta) return null;
                const formatDate = (d: Date | null | undefined) => {
                    if (!d) return '—';
                    const date = d instanceof Date ? d : new Date(d);
                    return isNaN(date.getTime()) ? '—' : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                };
                const vigencia = calcularVigenciaGarantia(acta.fechaInicioGarantia, acta.fechaFinGarantia);
                const vigColor = { vigente: '#16a34a', por_vencer: '#d97706', vencida: '#dc2626', sin_datos: '#94a3b8' }[vigencia.nivel];
                const vigBg = { vigente: '#f0fdf4', por_vencer: '#fffbeb', vencida: '#fef2f2', sin_datos: '#f8fafc' }[vigencia.nivel];
                return (
                    <Card className="shadow-lg mb-6 border border-amber-100 dark:border-amber-900">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100 dark:border-amber-900">
                            <h3 className="text-base font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 m-0">
                                <i className="pi pi-file-edit" /> Acta de Ingreso
                            </h3>
                            <Button
                                label="Ver Acta"
                                icon="pi pi-external-link"
                                text size="small"
                                onClick={() => navigate(`/activos/actas/${acta.idActa}`)}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Referencia', value: acta.referencia },
                                { label: 'Tipo de ingreso', value: acta.tipoIngreso },
                                { 
                                    label: acta.tipoIngreso === 'Acta de Entrega-Recepción' ? 'Empresa proveedora / Institución' : 'Empresa proveedora', 
                                    value: acta.tipoIngreso === 'Memorando de ingreso' ? '' : acta.empresaProveedora 
                                },
                                { 
                                    label: 
                                        acta.tipoIngreso === 'Orden de compra' ? 'N.º de Orden de Compra' :
                                        acta.tipoIngreso === 'Memorando de ingreso' ? 'N.º de Memorando' :
                                        acta.tipoIngreso === 'Acta de Entrega-Recepción' ? 'N.º de Acta' :
                                        acta.tipoIngreso === 'Contrato' ? 'N.º de Contrato' : 'N.º Orden / Memo',
                                    value: acta.numeroOrdenMemorandum 
                                },
                                { label: 'Técnico receptor', value: acta.tecnicoReceptor },
                                { label: 'Fecha de ingreso', value: formatDate(acta.fechaIngreso) },
                            ].filter(item => item.label && (item.value !== '' && item.value !== undefined)).map(item => (
                                <div key={item.label} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded p-2">
                                    <div className="text-xs text-amber-700 dark:text-amber-400 uppercase font-semibold mb-1">{item.label}</div>
                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.value || '—'}</div>
                                </div>
                            ))}
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded p-2">
                                <div className="text-xs text-amber-700 dark:text-amber-400 uppercase font-semibold mb-1">Garantía</div>
                                {acta.tieneGarantia ? (
                                    <div>
                                        <div className="text-xs text-slate-500">{formatDate(acta.fechaInicioGarantia)} → {formatDate(acta.fechaFinGarantia)}</div>
                                        <span style={{ display: 'inline-block', marginTop: 4, padding: '1px 8px', borderRadius: 999, background: vigBg, color: vigColor, fontSize: 11, fontWeight: 700 }}>
                                            {vigencia.texto}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">Sin garantía</span>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })()}

            {/* Ficha Técnica Específica */}
            {activo.atributosEspecificos && (() => {
                const key = getEspecificoKey(activo.categoriaActivo, activo.nombre);
                if (!key) return null;
                return (
                    <Card className="shadow-lg mb-6 border border-slate-100 dark:border-slate-800">
                        {/* --- EQUIPO BIOMÉDICO --- */}
                        {key === 'EQM' && (() => {
                            const b = activo.atributosEspecificos as AtributosEquipoBiomedico;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-blue-700 dark:text-blue-400 mb-4 pb-3 border-b border-blue-100 dark:border-blue-900 flex items-center gap-2">
                                        <i className="pi pi-heart text-blue-400" />
                                        Ficha Técnica — Equipo Biomédico
                                    </h3>

                                    {(b.voltaje || b.corriente || b.potencia || b.frecuencia || b.numeroFases || b.bateria || b.numeroCanales || b.memoria || b.tipoImpresora) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Datos Técnicos</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { label: 'Voltaje', value: b.voltaje },
                                                    { label: 'N.º de Fases', value: b.numeroFases },
                                                    { label: 'Corriente', value: b.corriente },
                                                    { label: 'Potencia', value: b.potencia },
                                                    { label: 'Frecuencia', value: b.frecuencia },
                                                    { label: 'Batería', value: b.bateria },
                                                    { label: 'N.º de Canales', value: b.numeroCanales },
                                                    { label: 'Memoria', value: b.memoria },
                                                    { label: 'Tipo de Impresora', value: b.tipoImpresora },
                                                ].filter(f => f.value).map(f => (
                                                    <div key={f.label}>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {b.requerimientosFuncionamiento && b.requerimientosFuncionamiento.length > 0 && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Requerimientos de Funcionamiento</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {b.requerimientosFuncionamiento.map(r => (
                                                    <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">{r}</span>
                                                ))}
                                                {b.requerimientoOtroDetalle && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">Otro: {b.requerimientoOtroDetalle}</span>}
                                            </div>
                                        </>
                                    )}

                                    {b.parametrosMedidos && b.parametrosMedidos.length > 0 && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Parámetros Medidos</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {b.parametrosMedidos.map(p => (
                                                    <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900">{p}</span>
                                                ))}
                                                {b.parametroOtroDetalle && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">Otro: {b.parametroOtroDetalle}</span>}
                                            </div>
                                        </>
                                    )}

                                    {(b.tieneGarantia !== undefined || b.fechaFinGarantia || b.frecuenciaMantenimientoPreventivo || b.responsableMantenimiento) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Garantía y Mantenimiento</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {b.tieneGarantia !== undefined && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tiene Garantía</div>
                                                        <div className="mt-1">
                                                            {b.tieneGarantia
                                                                ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded dark:bg-green-900/30 dark:text-green-400">Sí</span>
                                                                : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded dark:bg-slate-850 dark:text-slate-400">No</span>
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                                {b.fechaFinGarantia && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Fin de Garantía</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">
                                                            {new Date(b.fechaFinGarantia).toLocaleDateString('es-ES')}
                                                        </div>
                                                    </div>
                                                )}
                                                {b.frecuenciaMantenimientoPreventivo && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Frec. Mant. Preventivo</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{b.frecuenciaMantenimientoPreventivo}</div>
                                                    </div>
                                                )}
                                                {b.responsableMantenimiento && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Responsable Mantenimiento</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{b.responsableMantenimiento}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {[
                                        { label: 'Fabricante', data: b.fabricante },
                                        { label: 'Proveedor de Consumibles', data: b.proveedorConsumibles },
                                        { label: 'Proveedor de Mantenimiento', data: b.proveedorMantenimiento },
                                        { label: 'Proveedor de Calibración', data: b.proveedorCalibracion },
                                    ].filter(p => p.data?.nombre).map(p => (
                                        <div key={p.label} className="mt-4">
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">{p.label}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900/50 rounded p-3 border border-slate-100 dark:border-slate-800">
                                                {p.data!.nombre && <div><span className="text-xs text-slate-400 block">Nombre</span><span className="text-sm text-slate-700 dark:text-slate-300">{p.data!.nombre}</span></div>}
                                                {p.data!.telefono && <div><span className="text-xs text-slate-400 block">Teléfono</span><span className="text-sm text-slate-700 dark:text-slate-300">{p.data!.telefono}</span></div>}
                                                {p.data!.email && <div><span className="text-xs text-slate-400 block">Email</span><span className="text-sm text-slate-700 dark:text-slate-300">{p.data!.email}</span></div>}
                                                {p.data!.direccion && <div><span className="text-xs text-slate-400 block">Dirección</span><span className="text-sm text-slate-700 dark:text-slate-300">{p.data!.direccion}</span></div>}
                                            </div>
                                        </div>
                                    ))}

                                    {b.accesorios && b.accesorios.length > 0 && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Accesorios</h4>
                                            <div className="space-y-1">
                                                {b.accesorios.map((acc, i) => (
                                                    <div key={i} className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-900/50 rounded px-3 py-1.5 border border-slate-100 dark:border-slate-800">
                                                        <span className="text-slate-800 dark:text-slate-200">{acc.nombre}</span>
                                                        <span className="text-xs text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5">{acc.estado}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {b.informacionTecnica && b.informacionTecnica.length > 0 && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Información Técnica Adicional</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {b.informacionTecnica.map((item, i) => (
                                                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300">{item}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </>
                            );
                        })()}

                        {/* --- CPU / Unidad Central --- */}
                        {key === 'CPU' && (() => {
                            const inf = activo.atributosEspecificos as AtributosCPU;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-desktop text-purple-400" />
                                        Ficha Técnica — {activo.nombre}
                                    </h3>
                                    {inf.conjuntoEstacion && (
                                        <div className="p-2 mb-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">
                                            <strong>Conjunto / Estación de Trabajo: </strong> {inf.conjuntoEstacion}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Marca Procesador', value: inf.procesadorMarca },
                                            { label: 'Tipo Procesador', value: inf.procesadorTipo },
                                            { label: 'N.º Procesadores', value: inf.numeroProcesadores },
                                            { label: 'N.º Núcleos', value: inf.numeroNucleos },
                                            { label: 'Marca RAM', value: inf.ramMarca },
                                            { label: 'Capacidad RAM', value: inf.ramCapacidad },
                                            { label: 'Tipo RAM', value: inf.ramTipo },
                                            { label: 'Marca Disco', value: inf.almacenamientoMarca },
                                            { label: 'Capacidad Disco', value: inf.almacenamientoCapacidad },
                                            { label: 'Marca Placa Madre', value: inf.tarjetaMadreMarca },
                                            { label: 'Modelo Placa Madre', value: inf.tarjetaMadreModelo }
                                        ].filter(f => f.value).map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {inf.redHabilitada && inf.interfacesRed && inf.interfacesRed.length > 0 && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Interfaces de Red</h4>
                                            <div className="space-y-2">
                                                {inf.interfacesRed.map((iface, idx) => (
                                                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 border border-slate-100 dark:border-slate-800">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{iface.tipo}</span>
                                                            <span className={`px-2 py-0.5 text-xs rounded ${iface.estado === 'Activo' || iface.estado === 'Activa' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-850 dark:text-slate-400'}`}>{iface.estado}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs font-mono">
                                                            {iface.ip && <div><span className="text-slate-400 font-sans">IP: </span><span className="text-slate-700 dark:text-slate-300">{iface.ip}</span></div>}
                                                            {iface.mac && <div><span className="text-slate-400 font-sans">MAC: </span><span className="text-slate-700 dark:text-slate-300">{iface.mac}</span></div>}
                                                            {iface.gateway && <div><span className="text-slate-400 font-sans">Gateway: </span><span className="text-slate-700 dark:text-slate-300">{iface.gateway}</span></div>}
                                                            {iface.vlan && <div><span className="text-slate-400 font-sans font-normal">VLAN: </span><span className="text-slate-700 dark:text-slate-300">{iface.vlan}</span></div>}
                                                            {iface.idVlan && <div><span className="text-slate-400 font-sans font-normal">ID VLAN: </span><span className="text-slate-700 dark:text-slate-300">{iface.idVlan}</span></div>}
                                                            {iface.red && <div><span className="text-slate-400 font-sans">Red: </span><span className="text-slate-700 dark:text-slate-300">{iface.red}</span></div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {(inf.sistemaOperativoNombre || inf.softwareOfimaticoNombre || inf.usuarioAcceso) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Software & Acceso</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { label: 'Sistema Operativo', value: inf.sistemaOperativoNombre },
                                                    { label: 'Versión S.O.', value: inf.sistemaOperativoVersion },
                                                    { label: 'Licencia S.O.', value: inf.sistemaOperativoLicencia },
                                                    { label: 'Software Ofimático', value: inf.softwareOfimaticoNombre },
                                                    { label: 'Versión Ofimática', value: inf.softwareOfimaticoVersion },
                                                    { label: 'Usuario Acceso', value: inf.usuarioAcceso },
                                                    { label: 'Password Acceso', value: inf.passwordAcceso ? '••••••••' : null }
                                                ].filter(f => f.value).map(f => (
                                                    <div key={f.label}>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}

                        {/* --- MONITOR --- */}
                        {key === 'MON' && (() => {
                            const m = activo.atributosEspecificos as AtributosMonitor;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-desktop text-purple-400" />
                                        Ficha Técnica — Monitor
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {m.conjuntoEstacion && (
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Conjunto Estación</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{m.conjuntoEstacion}</div>
                                            </div>
                                        )}
                                        {m.pulgadas && (
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Pulgadas / Tamaño</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{m.pulgadas}</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- TECLADO --- */}
                        {key === 'TEC' && (() => {
                            const t = activo.atributosEspecificos as AtributosTeclado;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-desktop text-purple-400" />
                                        Ficha Técnica — Teclado
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {t.conjuntoEstacion && (
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Conjunto Estación</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{t.conjuntoEstacion}</div>
                                            </div>
                                        )}
                                        {t.interfaz && (
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tipo de Interfaz</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{t.interfaz}</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- MOUSE --- */}
                        {key === 'MOU' && (() => {
                            const mo = activo.atributosEspecificos as AtributosMouse;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-desktop text-purple-400" />
                                        Ficha Técnica — Mouse
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {mo.conjuntoEstacion && (
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Conjunto Estación</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{mo.conjuntoEstacion}</div>
                                            </div>
                                        )}
                                        {mo.interfaz && (
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tipo de Interfaz</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{mo.interfaz}</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- IMPRESORA DE RED --- */}
                        {key === 'IMP' && (() => {
                            const imp = activo.atributosEspecificos as AtributosImpresoraRed;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-print text-purple-400" />
                                        Ficha Técnica — Impresora de Red
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        {[
                                            { label: 'Dirección IP', value: imp.ip },
                                            { label: 'Dirección MAC', value: imp.mac },
                                            { label: 'Nombre Impresora', value: imp.nombreImpresora },
                                            { label: 'Correo Asociado', value: imp.correoAsociado },
                                            { label: 'Contador de Páginas', value: imp.contador !== null && imp.contador !== undefined ? String(imp.contador) : null },
                                            { label: 'Usuario / Puerto', value: imp.usuarioPuerto }
                                        ].filter(f => f.value).map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- TELÉFONO IP --- */}
                        {key === 'TEL' && (() => {
                            const tel = activo.atributosEspecificos as AtributosTelefonoIp;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-phone text-purple-400" />
                                        Ficha Técnica — Teléfono IP
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        {[
                                            { label: 'Extensión', value: tel.extension },
                                            { label: 'Dirección IP', value: tel.ip },
                                            { label: 'Dirección MAC', value: tel.mac },
                                            { label: 'Responsable(s)', value: tel.responsables },
                                            { label: 'Especialidad', value: tel.especialidad }
                                        ].filter(f => f.value).map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- CCTV / NVR --- */}
                        {key === 'CCTV' && (() => {
                            const cam = activo.atributosEspecificos as AtributosCCTV;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-video text-purple-400" />
                                        Ficha Técnica — Cámara CCTV / NVR
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        {[
                                            { label: 'Tipo Dispositivo', value: cam.tipoDispositivo },
                                            { label: 'Dirección IP', value: cam.ip },
                                            { label: 'Etiqueta Punto', value: cam.etiquetaPunto }
                                        ].filter(f => f.value).map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- ACCESS POINT --- */}
                        {key === 'AP' && (() => {
                            const ap = activo.atributosEspecificos as AtributosAccessPoint;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                        <i className="pi pi-wifi text-purple-400" />
                                        Ficha Técnica — Access Point / WiFi
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                        {[
                                            { label: 'Dirección MAC', value: ap.mac },
                                            { label: 'Cod HSN', value: ap.codHSN },
                                            { label: 'Etiqueta Punto', value: ap.etiquetaPunto },
                                            { label: 'Puerto Switch', value: ap.puertoSwitch }
                                        ].filter(f => f.value).map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}

                        {/* --- EQUIPO DE LABORATORIO --- */}
                        {key === 'EQL' && (() => {
                            const lab = activo.atributosEspecificos as AtributosLaboratorio;
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-teal-700 dark:text-teal-400 mb-4 pb-3 border-b border-teal-100 dark:border-teal-900 flex items-center gap-2">
                                        <i className="pi pi-shield text-teal-400" />
                                        Ficha Técnica — Equipo de Laboratorio
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        {[
                                            { label: 'Tipo Dispositivo', value: lab.tipoDispositivo },
                                            { label: 'Marca/Serie CPU', value: lab.marcaSerieCPU },
                                            { label: 'Marca/Serie Monitor', value: lab.marcaSerieMonitor },
                                            { label: 'IP LAN Hospital', value: lab.ipLanHospital },
                                            { label: 'MAC LAN Hospital', value: lab.macLanHospital },
                                            { label: 'IP LAN Biomédica', value: lab.ipLanBiomedica },
                                            { label: 'MAC LAN Biomédica', value: lab.macLanBiomedica },
                                            { label: 'Puerto Conexión', value: lab.puertoCnx },
                                            { label: 'Usuario', value: lab.usuario },
                                            { label: 'Password', value: lab.password ? '••••••••' : null },
                                            { label: 'Impresora Dedicada', value: lab.impresoraAsociadaMarca ? `${lab.impresoraAsociadaMarca} (S/N: ${lab.impresoraAsociadaSerie || '—'})` : null }
                                        ].filter(f => f.value).map(f => (
                                            <div key={f.label}>
                                                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.licenciaWindows ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-655 dark:bg-slate-850 dark:text-slate-400'}`}>
                                                Windows Licenciado: {lab.licenciaWindows ? 'Sí' : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.antivirus ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-655 dark:bg-slate-850 dark:text-slate-400'}`}>
                                                Antivirus Instalado: {lab.antivirus ? 'Sí' : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lab.firewall ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-655 dark:bg-slate-850 dark:text-slate-400'}`}>
                                                Firewall Habilitado: {lab.firewall ? 'Sí' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                    {(lab.tieneGarantia !== undefined || lab.fechaFinGarantia || lab.frecuenciaMantenimientoPreventivo || lab.responsableMantenimiento) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Garantía y Mantenimiento</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <div>
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tipo Posesión</div>
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{lab.tipoPostesion === 'ApoyoTecnologico' ? 'Apoyo Tecnológico' : 'Propio'}</div>
                                                </div>
                                                {lab.tieneGarantia !== undefined && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tiene Garantía</div>
                                                        <div className="mt-1">
                                                            {lab.tieneGarantia
                                                                ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded dark:bg-green-900/30 dark:text-green-400">Sí</span>
                                                                : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded dark:bg-slate-850 dark:text-slate-400">No</span>
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                                {lab.fechaFinGarantia && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Fin de Garantía</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{new Date(lab.fechaFinGarantia).toLocaleDateString('es-ES')}</div>
                                                    </div>
                                                )}
                                                {lab.frecuenciaMantenimientoPreventivo && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Frec. Mant. Preventivo</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{lab.frecuenciaMantenimientoPreventivo}</div>
                                                    </div>
                                                )}
                                                {lab.responsableMantenimiento && (
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Responsable Mantenimiento</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{lab.responsableMantenimiento}</div>
                                                    </div>
                                                )}
                                                {lab.tipoPostesion === 'ApoyoTecnologico' && (
                                                    <>
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Empresa Apoyo</div>
                                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{lab.empresaApoyo || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Orden de Servicio</div>
                                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{lab.ordenServicio || '—'}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}

                        {/* --- EQUIPO DE RAYOS E IMAGEN --- */}
                        {key === 'EQR' && (() => {
                            const r = activo.atributosEspecificos as AtributosRayosImagen;
                            const TIPOS_NO_IONIZANTES = new Set(['Ecógrafo', 'Resonancia Magnética (RM)']);
                            const esIonizante = r.tipoEquipo ? !TIPOS_NO_IONIZANTES.has(r.tipoEquipo) : true;
                            const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('es-ES') : '—';
                            return (
                                <>
                                    <h3 className="text-base font-semibold text-amber-700 dark:text-amber-400 mb-4 pb-3 border-b border-amber-100 dark:border-amber-900 flex items-center gap-2">
                                        <i className="pi pi-shield text-amber-400" />
                                        Ficha Técnica — Equipo de Rayos e Imagen
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tipo de Equipo</div>
                                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{r.tipoEquipo || '—'}</div>
                                        </div>
                                    </div>
                                    {esIonizante && (r.tensionPicoKvp || r.corrienteMa || r.tiempoExposicionMs || r.potenciaMaxKw || r.dosisEntradaMgy) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Parámetros de Radiación</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Tensión Pico (kVp)', value: r.tensionPicoKvp },
                                                    { label: 'Corriente (mA)', value: r.corrienteMa },
                                                    { label: 'Tiempo Exp. (ms)', value: r.tiempoExposicionMs },
                                                    { label: 'Potencia Máx (kW)', value: r.potenciaMaxKw },
                                                    { label: 'Dosis Entrada (mGy)', value: r.dosisEntradaMgy },
                                                    { label: 'Filtración (mm Al)', value: r.filtracionInherenteAlMm },
                                                    { label: 'Distancia Foco (cm)', value: r.distanciaFocoReceptorCm }
                                                ].filter(f => f.value).map(f => (
                                                    <div key={f.label}>
                                                        <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {(r.numeroLicenciaSCAN || r.titularLicencia || r.estadoLicencia) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Licenciamiento SCAN</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded p-3">
                                                {r.numeroLicenciaSCAN && <div><span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">N.º Licencia SCAN</span><span className="text-sm font-semibold text-slate-850 dark:text-slate-200">{r.numeroLicenciaSCAN}</span></div>}
                                                {r.estadoLicencia && <div><span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">Estado Licencia</span><span className="text-sm font-semibold text-slate-850 dark:text-slate-200">{r.estadoLicencia}</span></div>}
                                                {r.titularLicencia && <div><span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">Titular</span><span className="text-sm text-slate-700 dark:text-slate-300">{r.titularLicencia}</span></div>}
                                                {r.categoriaFuenteSCAN && <div><span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">Cat. Fuente</span><span className="text-sm text-slate-700 dark:text-slate-300">{r.categoriaFuenteSCAN}</span></div>}
                                                {r.fechaEmisionLicencia && <div><span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">Fecha Emisión</span><span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(r.fechaEmisionLicencia)}</span></div>}
                                                {r.fechaVencimientoLicencia && <div><span className="text-xs text-amber-700 dark:text-amber-400 block uppercase font-semibold">Fecha Vencimiento</span><span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(r.fechaVencimientoLicencia)}</span></div>}
                                            </div>
                                        </>
                                    )}
                                    {r.oprNombre && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Oficial de Protección Radiológica (OPR)</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 rounded p-3 border border-slate-100 dark:border-slate-800">
                                                <div><span className="text-xs text-slate-400 block">Nombre</span><span className="text-sm text-slate-700 dark:text-slate-300">{r.oprNombre}</span></div>
                                                {r.oprTelefono && <div><span className="text-xs text-slate-400 block">Teléfono</span><span className="text-sm text-slate-700 dark:text-slate-300">{r.oprTelefono}</span></div>}
                                                {r.oprEmail && <div><span className="text-xs text-slate-400 block">Email</span><span className="text-sm text-slate-700 dark:text-slate-300">{r.oprEmail}</span></div>}
                                            </div>
                                        </>
                                    )}
                                    {esIonizante && (r.materialBlindaje || r.grosorBlindajePbMm || r.areaControladaDefinida || r.planEmergenciaRadiologica) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Blindaje & Seguridad</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {r.materialBlindaje && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Material Blindaje</div><div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{r.materialBlindaje}</div></div>}
                                                {r.grosorBlindajePbMm && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Grosor (mm Pb)</div><div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{r.grosorBlindajePbMm}</div></div>}
                                                {r.areaControladaDefinida !== undefined && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Área Delimitada</div><div className="mt-1"><span className={`px-2 py-0.5 text-xs rounded font-semibold ${r.areaControladaDefinida ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-655 dark:bg-slate-850 dark:text-slate-400'}`}>{r.areaControladaDefinida ? 'Sí' : 'No'}</span></div></div>}
                                                {r.planEmergenciaRadiologica !== undefined && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Plan Emergencia SCAN</div><div className="mt-1"><span className={`px-2 py-0.5 text-xs rounded font-semibold ${r.planEmergenciaRadiologica ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-655 dark:bg-slate-850 dark:text-slate-400'}`}>{r.planEmergenciaRadiologica ? 'Sí' : 'No'}</span></div></div>}
                                            </div>
                                        </>
                                    )}
                                    {(r.frecuenciaCalibración || r.laboratorioCalibración || r.fechaUltimoControlCalidad) && (
                                        <>
                                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Calibración & Calidad</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {r.frecuenciaCalibración && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Frec. Calibración</div><div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{r.frecuenciaCalibración}</div></div>}
                                                {r.laboratorioCalibración && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Laboratorio</div><div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{r.laboratorioCalibración}</div></div>}
                                                {r.fechaUltimoControlCalidad && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Último Control</div><div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{formatDate(r.fechaUltimoControlCalidad)}</div></div>}
                                                {r.fechaProximoControlCalidad && <div><div className="text-xs text-slate-500 uppercase font-semibold mb-1">Próximo Control</div><div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{formatDate(r.fechaProximoControlCalidad)}</div></div>}
                                            </div>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </Card>
                );
            })()}

            {/* Timeline Histórico */}
            <Card className="shadow-lg border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
                    Línea de Tiempo del Activo Fijo
                </h3>

                {timelineEvents.length > 0 ? (
                    <Timeline
                        value={timelineEvents}
                        align="alternate"
                        className="customized-timeline px-2 md:px-6"
                        marker={customizeMarker}
                        content={customizeContent}
                    />
                ) : (
                    <div className="text-center py-8">
                        <i className="pi pi-calendar text-4xl text-slate-300 mb-3"></i>
                        <p className="text-slate-500">No se registran eventos históricos asociados a este activo.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default HojaDeVida;
