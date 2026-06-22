import React, { useState, useRef } from 'react';
import { UbicacionCascada } from '../../components/UbicacionCascada';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { useActivos } from '../../context/ActivosContext';
import { useTrasladosContext } from '../../context/TrasladosContext';

interface Traslado {
    activo: string;
    ubicacionOrigen: string;
    ubicacionDestino: string;
    responsableAnterior: string;
    nuevoResponsable: string;
    fechaTraslado: Date | null;
    motivo: string;
    observaciones: string;
    estado: string;
}

const initial: Traslado = {
    activo: '',
    ubicacionOrigen: '',
    ubicacionDestino: '',
    responsableAnterior: '',
    nuevoResponsable: '',
    fechaTraslado: null,
    motivo: '',
    observaciones: '',
    estado: 'Pendiente'
};

const MOTIVOS_TRASLADO = [
    { label: 'Reasignación de Oficina / Departamento', value: 'Reasignación' },
    { label: 'Mantenimiento Correctivo / Preventivo', value: 'Mantenimiento' },
    { label: 'Préstamo Temporal entre Departamentos', value: 'Préstamo Temporal' },
    { label: 'Reparación Externa', value: 'Reparación Externa' },
    { label: 'Reorganización Física de Espacios', value: 'Reorganización' },
    { label: 'Baja Parcial / Inspección Técnica', value: 'Baja Parcial' }
];



const RESPONSABLES_CUSTODIA = [
    { label: 'ING. Antonio Alarcón (Analista Administrativo)', value: 'ING. Antonio Alarcón' },
    { label: 'LIC. Lisbeth Mero Garcia (Responsable de Activos Fijos)', value: 'LIC. Lisbeth Mero Garcia' },
    { label: 'LIC. Wagner Navarrete Vargas (Analista de Activos Fijos 2)', value: 'LIC. Wagner Navarrete Vargas' },
    { label: 'Mgs. Belén Villao Loor (Tutora / Jefa de Docencia)', value: 'Mgs. Belén Villao Loor' },
    { label: 'Ing. Carlos Ortega (Jefe de TICs)', value: 'Ing. Carlos Ortega' },
    { label: 'Dra. Elena Larrea (Directora Médica)', value: 'Dra. Elena Larrea' },
    { label: 'Dr. Juan Pérez (Jefe de Quirófano)', value: 'Dr. Juan Pérez' },
    { label: 'Lic. María Gómez (Jefa de Enfermería)', value: 'Lic. María Gómez' }
];

const fieldPrompts: { key: keyof Traslado; label: string }[] = [
    { key: 'activo', label: 'Activo a trasladar' },
    { key: 'ubicacionOrigen', label: 'Ubicación de origen' },
    { key: 'ubicacionDestino', label: 'Ubicación de destino' },
    { key: 'responsableAnterior', label: 'Responsable anterior' },
    { key: 'nuevoResponsable', label: 'Nuevo responsable' },
    { key: 'fechaTraslado', label: 'Fecha del traslado' },
    { key: 'motivo', label: 'Motivo del traslado' },
    { key: 'observaciones', label: 'Observaciones' }
];

const RegistrarTraslado: React.FC = () => {
    const { activos } = useActivos();
    const { agregarTraslado } = useTrasladosContext();
    const activosList = activos || [];
    const [data, setData] = useState<Traslado>(initial);
    const [showSummary, setShowSummary] = useState(false);
    const toast = useRef<Toast>(null);

    const handleChange = (key: keyof Traslado, value: any) => {
        setData(prev => ({ ...prev, [key]: value } as Traslado));
    };

    const handleActivoChange = (codigoInst: any) => {
        const seleccionado = activosList.find(a => a.codigoInstitucional === codigoInst);
        if (seleccionado) {
            setData(prev => ({
                ...prev,
                activo: codigoInst,
                ubicacionOrigen: seleccionado.ubicacion || 'Sin Ubicación',
                responsableAnterior: seleccionado.responsableEntrega || 'Sin Custodio'
            }));
        } else {
            setData(prev => ({
                ...prev,
                activo: codigoInst || '',
                ubicacionOrigen: '',
                responsableAnterior: ''
            }));
        }
    };

    const validate = (): { ok: boolean; missing?: string } => {
        for (const f of fieldPrompts) {
            const v = (data as any)[f.key];
            if (f.key === 'fechaTraslado') {
                if (!v) return { ok: false, missing: f.label };
            } else {
                if (f.key !== 'estado') {
                    if (!v || String(v).trim() === '') return { ok: false, missing: f.label };
                }
            }
        }
        return { ok: true };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const v = validate();
        if (!v.ok) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Falta información',
                detail: `${v.missing} es obligatorio.`,
                life: 3000
            });
            return;
        }
        setShowSummary(true);
    };

    const handleConfirm = () => {
        try {
            agregarTraslado({
                codigoActivo: data.activo,
                nombreActivo: activoSeleccionado?.nombre ?? data.activo,
                categoria: (activoSeleccionado as any)?.categoria ?? (activoSeleccionado as any)?.categoriaActivo ?? 'Sin categoría',
                ubicacionOrigen: data.ubicacionOrigen,
                ubicacionDestino: data.ubicacionDestino,
                responsableAnterior: data.responsableAnterior,
                nuevoResponsable: data.nuevoResponsable,
                fechaTraslado: data.fechaTraslado
                    ? `${data.fechaTraslado.getFullYear()}-${String(data.fechaTraslado.getMonth() + 1).padStart(2, '0')}-${String(data.fechaTraslado.getDate()).padStart(2, '0')}`
                    : '',
                motivo: data.motivo,
                observaciones: data.observaciones
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Traslado registrado',
                detail: 'Traslado registrado como PENDIENTE. Puedes verlo en la pestaña Pendientes.',
                life: 4000
            });
            setData(initial);
            setShowSummary(false);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo guardar el traslado.',
                life: 3000
            });
        }
    };

    const activoSeleccionado = activosList.find(a => a.codigoInstitucional === data.activo);

    // Parsear ubicación origen en sus 4 niveles
    const partesOrigen = data.ubicacionOrigen ? data.ubicacionOrigen.split(' > ') : [];
    const origenBloque = partesOrigen[0] ?? '';
    const origenPiso = partesOrigen[1] ?? '';
    const origenServicio = partesOrigen[2] ?? '';
    const origenAmbiente = partesOrigen[3] ?? '';
    const origenValido = partesOrigen.length === 4;

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-4">Registrar Traslado</h1>

            <Card className="shadow-lg">
                {!showSummary && (
                    <form onSubmit={handleSubmit}>
                        {/* SECCIÓN 1: Detalles del Traslado */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Detalles del Traslado
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Activo a trasladar <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        value={data.activo}
                                        onChange={e => handleActivoChange(e.value)}
                                        options={activosList.map(a => ({
                                            label: `${a.codigoInstitucional} - ${a.nombre} (${a.numeroSerie})`,
                                            value: a.codigoInstitucional
                                        }))}
                                        placeholder="Seleccione el activo a trasladar"
                                        filter
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Fecha del traslado <span className="text-red-500">*</span>
                                    </label>
                                    <Calendar
                                        value={data.fechaTraslado}
                                        onChange={e => handleChange('fechaTraslado', e.value)}
                                        dateFormat="dd/mm/yy"
                                        placeholder="DD/MM/AAAA"
                                        showIcon
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <Divider className="my-4" />

                        {/* SECCIÓN 2: Ruta del Traslado */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Ubicaciones y Custodios
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* ── Panel Origen ── */}
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <i className="pi pi-map-marker text-slate-400 text-sm" />
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Origen (Actual)</span>
                                    </div>

                                    {data.ubicacionOrigen ? (
                                        origenValido ? (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bloque</label>
                                                    <InputText value={origenBloque} disabled className="w-full" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Piso</label>
                                                    <InputText value={origenPiso} disabled className="w-full" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Servicio / Departamento</label>
                                                    <InputText value={origenServicio} disabled className="w-full" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Ambiente / Sala</label>
                                                    <InputText value={origenAmbiente} disabled className="w-full" />
                                                </div>
                                                <div className="mt-1 p-2 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
                                                    <i className="pi pi-map-marker mt-0.5 flex-shrink-0" />
                                                    <span>{data.ubicacionOrigen}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Ubicación de origen</label>
                                                <InputText value={data.ubicacionOrigen} disabled className="w-full" />
                                            </div>
                                        )
                                    ) : (
                                        <p className="text-sm text-slate-400 italic py-2">
                                            Se autocompleta al seleccionar el activo
                                        </p>
                                    )}

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Responsable anterior</label>
                                        <InputText
                                            value={data.responsableAnterior}
                                            disabled
                                            placeholder="Se autocompleta al seleccionar el activo"
                                            className="w-full"
                                        />
                                    </div>
                                </div>


                                {/* ── Panel Destino ── */}
                                <div className="bg-blue-50 rounded-xl border border-blue-300 p-4 space-y-4" style={{ boxShadow: '0 0 0 1px #93c5fd22' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <i className="pi pi-send text-blue-400 text-sm" />
                                        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Destino (Nuevo)</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Ubicación de destino <span className="text-red-500">*</span>
                                        </label>
                                        <UbicacionCascada
                                            value={data.ubicacionDestino}
                                            onChange={val => handleChange('ubicacionDestino', val)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Nuevo responsable <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            value={data.nuevoResponsable}
                                            onChange={e => handleChange('nuevoResponsable', e.value)}
                                            options={RESPONSABLES_CUSTODIA}
                                            placeholder="Seleccione el nuevo responsable"
                                            filter
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>


                        <Divider className="my-4" />

                        {/* SECCIÓN 3: Justificación */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Justificación
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Motivo del traslado <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            value={data.motivo}
                                            onChange={e => handleChange('motivo', e.value)}
                                            options={MOTIVOS_TRASLADO}
                                            placeholder="Seleccione el motivo del traslado"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Observaciones / Detalles del motivo <span className="text-red-500">*</span>
                                    </label>
                                    <InputTextarea
                                        rows={4}
                                        value={data.observaciones}
                                        onChange={e => handleChange('observaciones', e.target.value)}
                                        placeholder="Escriba la justificación detallada y observaciones para el traslado de este bien..."
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BOTONES */}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                type="submit"
                                label="Ver resumen"
                                severity="success"
                                className="w-full md:w-auto"
                            />
                        </div>
                    </form>
                )}

                {showSummary && (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            Resumen del Traslado
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Activo a trasladar</span>
                                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                                    {data.activo} - {activoSeleccionado ? activoSeleccionado.nombre : ''}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Fecha del traslado</span>
                                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">
                                    {data.fechaTraslado ? new Date(data.fechaTraslado).toLocaleDateString('es-ES') : ''}
                                </span>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Ubicación de Origen (Anterior)</span>
                                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">{data.ubicacionOrigen}</span>
                                <span className="block text-xs text-slate-500 mt-1">Custodio: {data.responsableAnterior}</span>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Ubicación de Destino (Nueva)</span>
                                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">{data.ubicacionDestino}</span>
                                <span className="block text-xs text-slate-500 mt-1">Nuevo custodio: {data.nuevoResponsable}</span>
                            </div>

                            <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Motivo del traslado</span>
                                <span className="text-base text-slate-800 dark:text-slate-100 font-medium">{data.motivo}</span>
                            </div>

                            <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Observaciones / Justificación</span>
                                <span className="text-base text-slate-800 dark:text-slate-100 block whitespace-pre-wrap">{data.observaciones}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                label="Editar"
                                severity="secondary"
                                onClick={() => setShowSummary(false)}
                                className="w-full md:w-auto"
                            />
                            <Button
                                label="Confirmar registro"
                                severity="success"
                                onClick={handleConfirm}
                                className="w-full md:w-auto"
                            />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RegistrarTraslado;
