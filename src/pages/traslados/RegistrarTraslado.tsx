import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { useActivos } from '../../context/ActivosContext';

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

const UBICACIONES_HOSPITAL = [
    { label: 'Bodega Central de Activos', value: 'Bodega Central de Activos' },
    { label: 'Quirófano A (Cirugía General)', value: 'Quirófano A' },
    { label: 'Quirófano B (Cirugía Especializada)', value: 'Quirófano B' },
    { label: 'UCI (Unidad de Cuidados Intensivos)', value: 'UCI' },
    { label: 'Emergencias (Sala de Triaje)', value: 'Emergencias' },
    { label: 'Hospitalización - Piso 1', value: 'Hospitalización - Piso 1' },
    { label: 'Hospitalización - Piso 2', value: 'Hospitalización - Piso 2' },
    { label: 'Consulta Externa', value: 'Consulta Externa' },
    { label: 'Laboratorio Clínico', value: 'Laboratorio Clínico' },
    { label: 'Rayos X / Imagenología', value: 'Rayos X / Imagenología' },
    { label: 'Área Administrativa (Financiero)', value: 'Área Administrativa' },
    { label: 'TICs (Soporte Técnico)', value: 'TICs' }
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
            const existing = JSON.parse(localStorage.getItem('traslados') || '[]');
            const referenceId = `TR-${new Date().getFullYear()}-${String(existing.length + 1).padStart(4, '0')}`;
            const record = { 
                ...data, 
                fechaRegistro: new Date().toISOString(), 
                referencia: referenceId 
            };
            existing.push(record);
            localStorage.setItem('traslados', JSON.stringify(existing));

            toast.current?.show({ 
                severity: 'success', 
                summary: 'Traslado registrado', 
                detail: `El traslado ha sido registrado como PENDIENTE (Ref: ${referenceId}). Puedes ejecutarlo en la pestaña Pendientes.`,
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

                        {/* SECCIÓN 2: Ruta del Traslado (Origen vs Destino lado a lado) */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Ubicaciones y Custodios
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Subsección Origen (Autocompletado y Deshabilitado) */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        Origen (Actual)
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-400">
                                            Ubicación de origen
                                        </label>
                                        <InputText 
                                            value={data.ubicacionOrigen} 
                                            disabled
                                            placeholder="Se autocompleta al seleccionar el activo"
                                            className="w-full bg-slate-100 dark:bg-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-400">
                                            Responsable anterior
                                        </label>
                                        <InputText 
                                            value={data.responsableAnterior} 
                                            disabled
                                            placeholder="Se autocompleta al seleccionar el activo"
                                            className="w-full bg-slate-100 dark:bg-slate-800"
                                        />
                                    </div>
                                </div>

                                {/* Subsección Destino */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                        Destino (Nuevo)
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Ubicación de destino <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown 
                                            value={data.ubicacionDestino} 
                                            onChange={e => handleChange('ubicacionDestino', e.value)} 
                                            options={UBICACIONES_HOSPITAL}
                                            placeholder="Seleccione ubicación de destino" 
                                            filter
                                            className="w-full"
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
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Observaciones / Detalles del motivo <span className="text-red-500">*</span>
                                    </label>
                                    <InputTextarea 
                                        rows={3} 
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
