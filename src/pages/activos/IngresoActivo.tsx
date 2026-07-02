import React, { useState } from 'react';
import RegistrarActivo from './RegistrarActivo';
import RegistrarActa from './RegistrarActa';
import CargaMasiva from './CargaMasiva';
import { Button } from 'primereact/button';

type FlowType = 'individual' | 'lote' | 'masiva' | null;

export const IngresoActivo: React.FC = () => {
    const [selectedFlow, setSelectedFlow] = useState<FlowType>(null);

    const renderSelector = () => (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ingresar Activo</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
                Seleccione el método de registro de activos que mejor se adapte a sus necesidades actuales.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {/* Individual Card */}
                <div 
                    onClick={() => setSelectedFlow('individual')}
                    className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                    <div>
                        <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                            <i className="pi pi-plus-circle text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Individual
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                            Permite registrar un único activo en el sistema, detallando sus características específicas de manera precisa.
                        </p>
                    </div>
                    <span className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 gap-2">
                        Comenzar registro <i className="pi pi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </span>
                </div>

                {/* En Lote Card */}
                <div 
                    onClick={() => setSelectedFlow('lote')}
                    className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                    <div>
                        <div className="w-14 h-14 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                            <i className="pi pi-clone text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            En lote (Acta)
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                            Ideal para registrar múltiples activos que ingresan bajo una misma acta, orden de compra o memorando.
                        </p>
                    </div>
                    <span className="inline-flex items-center text-sm font-semibold text-amber-600 dark:text-amber-400 gap-2">
                        Crear acta <i className="pi pi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </span>
                </div>

                {/* Carga Masiva Card */}
                <div 
                    onClick={() => setSelectedFlow('masiva')}
                    className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                    <div>
                        <div className="w-14 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                            <i className="pi pi-file-excel text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            Carga masiva
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                            Importación rápida de grandes volúmenes de activos mediante un archivo de plantilla Excel (.xlsx).
                        </p>
                    </div>
                    <span className="inline-flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 gap-2">
                        Subir archivo <i className="pi pi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </span>
                </div>
            </div>
        </div>
    );

    const renderActiveFlow = () => {
        return (
            <div className="p-2">
                <div className="flex justify-between items-center mb-4 px-4">
                    <Button 
                        label="Volver al Selector" 
                        icon="pi pi-arrow-left" 
                        onClick={() => setSelectedFlow(null)} 
                        className="p-button-outlined p-button-secondary text-sm font-semibold border-slate-300 text-slate-700 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                    />
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                        {selectedFlow === 'individual' && 'Registro Individual'}
                        {selectedFlow === 'lote' && 'Registro en Lote'}
                        {selectedFlow === 'masiva' && 'Carga Masiva'}
                    </span>
                </div>
                
                <div className="transition-opacity duration-300 animate-fade-in">
                    {selectedFlow === 'individual' && <RegistrarActivo />}
                    {selectedFlow === 'lote' && <RegistrarActa />}
                    {selectedFlow === 'masiva' && <CargaMasiva />}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {selectedFlow === null ? renderSelector() : renderActiveFlow()}
        </div>
    );
};

export default IngresoActivo;
