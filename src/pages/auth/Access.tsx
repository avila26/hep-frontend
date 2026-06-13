import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import AppFloatingConfigurator from '../../layout/AppFloatingConfigurator';

export const Access: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <AppFloatingConfigurator />
            <div className="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
                <div className="flex flex-col items-center justify-center">
                    <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, rgba(247, 149, 48, 0.4) 10%, rgba(247, 149, 48, 0) 30%)' }}>
                        <div className="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style={{ borderRadius: '53px' }}>
                            <div className="gap-4 flex flex-col items-center">
                                <div className="flex justify-center items-center border-2 border-orange-500 rounded-full" style={{ width: '3.2rem', height: '3.2rem' }}>
                                    <i className="text-orange-500 pi pi-fw pi-lock text-2xl!"></i>
                                </div>
                                <h1 className="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-5xl mb-2">Acceso denegado</h1>
                                <span className="text-muted-color mb-8">No tiene los permisos necesarios. Contacte al administrador del sistema.</span>
                                <img src="https://primefaces.org/cdn/templates/sakai/auth/asset-access.svg" alt="Acceso denegado" className="mb-8" width="80%" />
                                <div className="col-span-12 mt-8 text-center">
                                    <Button label="Ir al Panel Principal" onClick={() => navigate('/dashboard')} severity="warning" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Access;
