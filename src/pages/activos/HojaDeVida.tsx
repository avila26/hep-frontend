import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Timeline } from 'primereact/timeline';
import { useActivos, AtributosEquipoBiomedico, AtributosEquipoInformatico } from '../../context/ActivosContext';
import { useTrasladosContext } from '../../context/TrasladosContext';

// Mocks locales para Mantenimientos (coherente con RF-MA-11, RF-MA-12, RF-MA-13)
interface Mantenimiento {
    id: string;
    codigoActivo: string;
    fecha: Date;
    tipo: 'Preventivo' | 'Correctivo';
    descripcion: string;
    tecnico: string;
    estado: 'Completado' | 'En proceso' | 'Pendiente';
}

const MOCK_MANTENIMIENTOS: Mantenimiento[] = [
    {
        id: 'm1',
        codigoActivo: 'CI-2026-0001',
        fecha: new Date(2026, 4, 10),
        tipo: 'Preventivo',
        descripcion: 'Calibración de sensores de flujo y presión, limpieza de filtros y validación de batería de respaldo.',
        tecnico: 'Ing. Felipe Restrepo (Bioelectrónica S.A.)',
        estado: 'Completado'
    },
    {
        id: 'm2',
        codigoActivo: 'CI-2026-0001',
        fecha: new Date(2026, 5, 2),
        tipo: 'Correctivo',
        descripcion: 'Cambio de válvula espiratoria por reporte de alarmas falsas de presión alta.',
        tecnico: 'Téc. Laura Méndez (Soporte Interno HEP)',
        estado: 'Completado'
    },
    {
        id: 'm3',
        codigoActivo: 'CI-2026-0002',
        fecha: new Date(2026, 3, 15),
        tipo: 'Preventivo',
        descripcion: 'Mantenimiento de rutina, limpieza interna, verificación de cables de derivación de ECG.',
        tecnico: 'Ing. Carlos Ortega (Técnico TICs)',
        estado: 'Completado'
    },
    {
        id: 'm4',
        codigoActivo: 'CI-2026-0003',
        fecha: new Date(2026, 2, 28),
        tipo: 'Correctivo',
        descripcion: 'Reparación de la carcasa plástica por fisura tras caída accidental.',
        tecnico: 'Téc. Laura Méndez (Soporte Interno HEP)',
        estado: 'Completado'
    }
];

// Mocks locales para Historial de Cambios de Estado
interface CambioEstado {
    id: string;
    codigoActivo: string;
    fecha: Date;
    usuario: string;
    estadoAnterior: string;
    estadoNuevo: string;
    motivo: string;
}

const MOCK_CAMBIOS_ESTADO: CambioEstado[] = [
    {
        id: 'c1',
        codigoActivo: 'CI-2026-0001',
        fecha: new Date(2026, 4, 8),
        usuario: 'LIC. Lisbeth Mero Garcia',
        estadoAnterior: 'Nuevo',
        estadoNuevo: 'Bueno',
        motivo: 'Puesta en marcha y asignación formal de custodio.'
    },
    {
        id: 'c2',
        codigoActivo: 'CI-2026-0001',
        fecha: new Date(2026, 5, 1),
        usuario: 'LIC. Lisbeth Mero Garcia',
        estadoAnterior: 'Bueno',
        estadoNuevo: 'Regular',
        motivo: 'Reporte de desgaste en válvula espiratoria previo a mantenimiento correctivo.'
    },
    {
        id: 'c3',
        codigoActivo: 'CI-2026-0001',
        fecha: new Date(2026, 5, 3),
        usuario: 'LIC. Lisbeth Mero Garcia',
        estadoAnterior: 'Regular',
        estadoNuevo: 'Bueno',
        motivo: 'Restablecimiento del estado tras completarse mantenimiento correctivo exitosamente.'
    }
];

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

        // 3. Mantenimientos
        const mantenimientosActivo = MOCK_MANTENIMIENTOS.filter(m => m.codigoActivo === activo.codigoInstitucional);
        mantenimientosActivo.forEach(m => {
            events.push({
                id: `maint-${m.id}`,
                fecha: new Date(m.fecha),
                tipo: 'mantenimiento',
                titulo: `Mantenimiento ${m.tipo}`,
                detalleShort: `Acción técnica de tipo ${m.tipo.toLowerCase()} en estado: ${m.estado}.`,
                icon: m.tipo === 'Correctivo' ? 'pi pi-wrench' : 'pi pi-cog',
                color: m.tipo === 'Correctivo' ? '#EF4444' : '#6366F1', // Red, Indigo
                extraInfo: (
                    <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p><strong>Tipo:</strong> {m.tipo}</p>
                        <p><strong>Descripción del Trabajo:</strong> {m.descripcion}</p>
                        <p><strong>Responsable Técnico:</strong> {m.tecnico}</p>
                        <p><strong>Estado final de tarea:</strong> {m.estado}</p>
                    </div>
                )
            });
        });

        // 4. Cambios de Estado
        const cambiosEstadoActivo = MOCK_CAMBIOS_ESTADO.filter(c => c.codigoActivo === activo.codigoInstitucional);
        cambiosEstadoActivo.forEach(c => {
            events.push({
                id: `estado-${c.id}`,
                fecha: new Date(c.fecha),
                tipo: 'cambio_estado',
                titulo: 'Cambio de Estado',
                detalleShort: `Estado del bien actualizado de "${c.estadoAnterior}" a "${c.estadoNuevo}".`,
                icon: 'pi pi-refresh',
                color: '#8B5CF6', // Purple
                extraInfo: (
                    <div className="text-xs space-y-1.5 mt-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p><strong>Estado Anterior:</strong> {c.estadoAnterior}</p>
                        <p><strong>Estado Nuevo:</strong> {c.estadoNuevo}</p>
                        <p><strong>Motivo del Cambio:</strong> {c.motivo}</p>
                        <p><strong>Registrado por:</strong> {c.usuario}</p>
                    </div>
                )
            });
        });

        // 5. Egreso de Bien (Bajas / Egresos)
        const estadoNorm = normalizarEstadoActivo(activo.estadoActivo);
        if (estadoNorm === 'BAJ' || estadoNorm === 'EGR') {
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
    }, [activo]);

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

            {/* Ficha Técnica Específica (EQM o EQI) */}
            {activo.atributosEspecificos && (
                <Card className="shadow-lg mb-6 border border-slate-100 dark:border-slate-800">
                    {/* BIOMÉDICO */}
                    {activo.categoriaActivo?.includes('EQM') && (() => {
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
                                                <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{r}</span>
                                            ))}
                                            {b.requerimientoOtroDetalle && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded border border-slate-200">Otro: {b.requerimientoOtroDetalle}</span>}
                                        </div>
                                    </>
                                )}

                                {b.parametrosMedidos && b.parametrosMedidos.length > 0 && (
                                    <>
                                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Parámetros Medidos</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {b.parametrosMedidos.map(p => (
                                                <span key={p} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">{p}</span>
                                            ))}
                                            {b.parametroOtroDetalle && <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded border border-slate-200">Otro: {b.parametroOtroDetalle}</span>}
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
                                                            ? <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Sí</span>
                                                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">No</span>
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

                    {/* INFORMÁTICO */}
                    {activo.categoriaActivo?.includes('EQI') && (() => {
                        const inf = activo.atributosEspecificos as AtributosEquipoInformatico;
                        return (
                            <>
                                <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900 flex items-center gap-2">
                                    <i className="pi pi-desktop text-purple-400" />
                                    Ficha Técnica — Equipo Informático
                                </h3>

                                {(inf.procesadorMarca || inf.procesadorTipo || inf.numeroProcesadores || inf.numeroNucleos || inf.ramMarca || inf.ramCapacidad || inf.ramTipo) && (
                                    <>
                                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Procesador y Memoria RAM</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { label: 'Marca Procesador', value: inf.procesadorMarca },
                                                { label: 'Tipo Procesador', value: inf.procesadorTipo },
                                                { label: 'N.º Procesadores', value: inf.numeroProcesadores },
                                                { label: 'N.º Núcleos', value: inf.numeroNucleos },
                                                { label: 'Marca RAM', value: inf.ramMarca },
                                                { label: 'Capacidad RAM', value: inf.ramCapacidad },
                                                { label: 'Tipo RAM', value: inf.ramTipo },
                                            ].filter(f => f.value).map(f => (
                                                <div key={f.label}>
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {(inf.almacenamientoMarca || inf.almacenamientoCapacidad || inf.tarjetaMadreMarca || inf.tarjetaMadreModelo) && (
                                    <>
                                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Almacenamiento y Tarjeta Madre</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { label: 'Marca Almacenamiento', value: inf.almacenamientoMarca },
                                                { label: 'Capacidad', value: inf.almacenamientoCapacidad },
                                                { label: 'Marca T. Madre', value: inf.tarjetaMadreMarca },
                                                { label: 'Modelo T. Madre', value: inf.tarjetaMadreModelo },
                                            ].filter(f => f.value).map(f => (
                                                <div key={f.label}>
                                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{f.label}</div>
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded p-2 border border-slate-100 dark:border-slate-800">{f.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {(inf.mouse?.marca || inf.teclado?.marca) && (
                                    <>
                                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Periféricos</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {inf.mouse?.marca && (
                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 border border-slate-100 dark:border-slate-800">
                                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Mouse</div>
                                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                                        {inf.mouse.marca && <div><span className="text-slate-400">Marca: </span><span className="text-slate-700 dark:text-slate-300">{inf.mouse.marca}</span></div>}
                                                        {inf.mouse.modelo && <div><span className="text-slate-400">Modelo: </span><span className="text-slate-700 dark:text-slate-300">{inf.mouse.modelo}</span></div>}
                                                        {inf.mouse.serie && <div><span className="text-slate-400">Serie: </span><span className="text-slate-700 dark:text-slate-300">{inf.mouse.serie}</span></div>}
                                                        {inf.mouse.color && <div><span className="text-slate-400">Color: </span><span className="text-slate-700 dark:text-slate-300">{inf.mouse.color}</span></div>}
                                                        {inf.mouse.tipoInterfaz && <div><span className="text-slate-400">Interfaz: </span><span className="text-slate-700 dark:text-slate-300">{inf.mouse.tipoInterfaz}</span></div>}
                                                        {inf.mouse.codigoActivoFijo && <div><span className="text-slate-400">Cód. AF: </span><span className="text-slate-700 dark:text-slate-300">{inf.mouse.codigoActivoFijo}</span></div>}
                                                    </div>
                                                </div>
                                            )}
                                            {inf.teclado?.marca && (
                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 border border-slate-100 dark:border-slate-800">
                                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Teclado</div>
                                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                                        {inf.teclado.marca && <div><span className="text-slate-400">Marca: </span><span className="text-slate-700 dark:text-slate-300">{inf.teclado.marca}</span></div>}
                                                        {inf.teclado.modelo && <div><span className="text-slate-400">Modelo: </span><span className="text-slate-700 dark:text-slate-300">{inf.teclado.modelo}</span></div>}
                                                        {inf.teclado.serie && <div><span className="text-slate-400">Serie: </span><span className="text-slate-700 dark:text-slate-300">{inf.teclado.serie}</span></div>}
                                                        {inf.teclado.color && <div><span className="text-slate-400">Color: </span><span className="text-slate-700 dark:text-slate-300">{inf.teclado.color}</span></div>}
                                                        {inf.teclado.tipoInterfaz && <div><span className="text-slate-400">Interfaz: </span><span className="text-slate-700 dark:text-slate-300">{inf.teclado.tipoInterfaz}</span></div>}
                                                        {inf.teclado.codigoActivoFijo && <div><span className="text-slate-400">Cód. AF: </span><span className="text-slate-700 dark:text-slate-300">{inf.teclado.codigoActivoFijo}</span></div>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {inf.redHabilitada && inf.interfacesRed && inf.interfacesRed.length > 0 && (
                                    <>
                                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Interfaces de Red</h4>
                                        <div className="space-y-2">
                                            {inf.interfacesRed.map((iface, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded p-3 border border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{iface.tipo}</span>
                                                        <span className={`px-2 py-0.5 text-xs rounded ${iface.estado === 'Activa' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{iface.estado}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                                                        {iface.ip && <div><span className="text-slate-400">IP: </span><span className="text-slate-700 dark:text-slate-300 font-mono">{iface.ip}</span></div>}
                                                        {iface.mac && <div><span className="text-slate-400">MAC: </span><span className="text-slate-700 dark:text-slate-300 font-mono">{iface.mac}</span></div>}
                                                        {iface.gateway && <div><span className="text-slate-400">Gateway: </span><span className="text-slate-700 dark:text-slate-300 font-mono">{iface.gateway}</span></div>}
                                                        {iface.vlan && <div><span className="text-slate-400">VLAN: </span><span className="text-slate-700 dark:text-slate-300">{iface.vlan}</span></div>}
                                                        {iface.idVlan && <div><span className="text-slate-400">ID VLAN: </span><span className="text-slate-700 dark:text-slate-300">{iface.idVlan}</span></div>}
                                                        {iface.red && <div><span className="text-slate-400">Red: </span><span className="text-slate-700 dark:text-slate-300 font-mono">{iface.red}</span></div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {(inf.sistemaOperativoNombre || inf.softwareOfimaticoNombre || inf.usuarioAcceso) && (
                                    <>
                                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 mt-4">Software</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { label: 'Sistema Operativo', value: inf.sistemaOperativoNombre },
                                                { label: 'Versión S.O.', value: inf.sistemaOperativoVersion },
                                                { label: 'Licencia S.O.', value: inf.sistemaOperativoLicencia },
                                                { label: 'Software Ofimático', value: inf.softwareOfimaticoNombre },
                                                { label: 'Versión Ofimática', value: inf.softwareOfimaticoVersion },
                                                { label: 'Usuario de Acceso', value: inf.usuarioAcceso },
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
                </Card>
            )}

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
