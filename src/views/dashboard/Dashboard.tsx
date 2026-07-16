import React from 'react';

export const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-col min-h-[75vh]">
            {/* Header Section */}
            <div className="pb-1">
                <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 m-0">Principal</h1>
            </div>
            
            <hr className="border-t border-slate-200 dark:border-slate-800 my-4" />

            {/* Content Section */}
            <div className="flex-1 mb-8">
                <div className="mb-6">
                    <p className="text-slate-700 dark:text-slate-300 text-base m-0 mb-4">principal</p>
                </div>
            </div>

            {/* Footer Section */}
            <div className="mt-auto pt-16 pb-4 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 text-sm gap-1">
                <span className="m-0">© Copyright <strong>MSP</strong>. All Rights Reserved 2024</span>
                <span className="m-0">Desarrollado por Unidad de Tics @EAMM</span>
                <span className="m-0">Hospital de Especialidades Portoviejo</span>
            </div>
        </div>
    );
};

export default Dashboard;
