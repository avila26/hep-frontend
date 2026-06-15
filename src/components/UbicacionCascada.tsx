import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { UBICACIONES_HEP } from '../constants/ubicacionesHep';

export interface UbicacionCascadaProps {
    value: string;
    onChange: (rutaCompleta: string) => void;
    error?: string;
    disabled?: boolean;
}

export const UbicacionCascada: React.FC<UbicacionCascadaProps> = ({
    value,
    onChange,
    error,
    disabled = false
}) => {
    const [bloqueSelec, setBloqueSelec] = useState('');
    const [pisoSelec, setPisoSelec] = useState('');
    const [servicioSelec, setServicioSelec] = useState('');
    const [ambienteSelec, setAmbienteSelec] = useState('');
    const omitirSincronizacionVacia = useRef(false);

    useEffect(() => {
        if (omitirSincronizacionVacia.current && !value) {
            omitirSincronizacionVacia.current = false;
            return;
        }

        omitirSincronizacionVacia.current = false;

        if (value) {
            const partes = value.split(' > ');
            if (partes.length === 4) {
                const [bloqueLabel, pisoLabel, servicioLabel, ambienteLabel] = partes;
                const bloque = UBICACIONES_HEP.find(b => b.label === bloqueLabel);
                const piso = bloque?.pisos.find(p => p.label === pisoLabel);
                const servicio = piso?.servicios.find(s => s.label === servicioLabel);
                const ambienteValido = servicio?.ambientes.includes(ambienteLabel);

                if (bloque && piso && servicio && ambienteValido) {
                    setBloqueSelec(bloque.id);
                    setPisoSelec(piso.id);
                    setServicioSelec(servicio.id);
                    setAmbienteSelec(ambienteLabel);
                    return;
                }
            }
        }

        setBloqueSelec('');
        setPisoSelec('');
        setServicioSelec('');
        setAmbienteSelec('');
    }, [value]);

    const bloqueOptions = useMemo(
        () => UBICACIONES_HEP.map(b => ({ label: b.label, value: b.id })),
        []
    );

    const bloqueActual = useMemo(
        () => UBICACIONES_HEP.find(b => b.id === bloqueSelec),
        [bloqueSelec]
    );

    const pisoOptions = useMemo(
        () => bloqueActual?.pisos.map(p => ({ label: p.label, value: p.id })) ?? [],
        [bloqueActual]
    );

    const pisoActual = useMemo(
        () => bloqueActual?.pisos.find(p => p.id === pisoSelec),
        [bloqueActual, pisoSelec]
    );

    const servicioOptions = useMemo(
        () => pisoActual?.servicios.map(s => ({ label: s.label, value: s.id })) ?? [],
        [pisoActual]
    );

    const servicioActual = useMemo(
        () => pisoActual?.servicios.find(s => s.id === servicioSelec),
        [pisoActual, servicioSelec]
    );

    const ambienteOptions = useMemo(
        () => servicioActual?.ambientes.map(a => ({ label: a, value: a })) ?? [],
        [servicioActual]
    );

    const invalidClass = error ? 'p-invalid' : '';

    const handleBloqueChange = (e: DropdownChangeEvent) => {
        setBloqueSelec(e.value ?? '');
        setPisoSelec('');
        setServicioSelec('');
        setAmbienteSelec('');
        omitirSincronizacionVacia.current = true;
        onChange('');
    };

    const handlePisoChange = (e: DropdownChangeEvent) => {
        setPisoSelec(e.value ?? '');
        setServicioSelec('');
        setAmbienteSelec('');
        omitirSincronizacionVacia.current = true;
        onChange('');
    };

    const handleServicioChange = (e: DropdownChangeEvent) => {
        setServicioSelec(e.value ?? '');
        setAmbienteSelec('');
        omitirSincronizacionVacia.current = true;
        onChange('');
    };

    const handleAmbienteChange = (e: DropdownChangeEvent) => {
        const ambiente = e.value ?? '';
        setAmbienteSelec(ambiente);

        if (bloqueActual && pisoActual && servicioActual && ambiente) {
            onChange(`${bloqueActual.label} > ${pisoActual.label} > ${servicioActual.label} > ${ambiente}`);
        }
    };

    return (
        <>
            <div>
                <label className="block text-sm font-medium mb-2">
                    Bloque <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    value={bloqueSelec || null}
                    options={bloqueOptions}
                    onChange={handleBloqueChange}
                    placeholder="Seleccione bloque"
                    className={`w-full ${invalidClass}`}
                    disabled={disabled}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Piso <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    value={pisoSelec || null}
                    options={pisoOptions}
                    onChange={handlePisoChange}
                    placeholder="Seleccione piso"
                    className={`w-full ${invalidClass}${disabled || !bloqueSelec ? ' opacity-50 cursor-not-allowed' : ''}`}
                    disabled={disabled || !bloqueSelec}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Servicio / Departamento <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    value={servicioSelec || null}
                    options={servicioOptions}
                    onChange={handleServicioChange}
                    placeholder="Seleccione servicio"
                    className={`w-full ${invalidClass}${disabled || !pisoSelec ? ' opacity-50 cursor-not-allowed' : ''}`}
                    disabled={disabled || !pisoSelec}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Ambiente / Sala <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    value={ambienteSelec || null}
                    options={ambienteOptions}
                    onChange={handleAmbienteChange}
                    placeholder="Seleccione ambiente"
                    className={`w-full ${invalidClass}${disabled || !servicioSelec ? ' opacity-50 cursor-not-allowed' : ''}`}
                    disabled={disabled || !servicioSelec}
                />
            </div>

            {value && (
                <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
                    <i className="pi pi-map-marker text-blue-500" />
                    {value}
                </div>
            )}

            {error && (
                <div className="col-span-1 md:col-span-2">
                    <small className="text-red-500">{error}</small>
                </div>
            )}
        </>
    );
};

export default UbicacionCascada;
