import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import AppFloatingConfigurator from '../../layout/AppFloatingConfigurator';

export const ErrorPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <AppFloatingConfigurator />
            <div className="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                    <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                        <div className="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style={{ borderRadius: '53px' }}>
                            <div className="gap-4 flex flex-col items-center">
                                <div className="flex justify-center items-center border-2 border-pink-500 rounded-full" style={{ height: '3.2rem', width: '3.2rem' }}>
                                    <i className="pi pi-fw pi-exclamation-circle text-2xl! text-pink-500"></i>
                                </div>
                                <h1 className="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-2">Error del sistema</h1>
                                <span className="text-muted-color mb-8">Ocurrió un error al procesar la solicitud.</span>
                                <img src="https://primefaces.org/cdn/templates/sakai/auth/asset-error.svg" alt="Error" className="mb-8" width="80%" />
                                <div className="col-span-12 mt-8 text-center">
                                    <Button label="Ir al Panel Principal" onClick={() => navigate('/dashboard')} severity="danger" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ErrorPage;
