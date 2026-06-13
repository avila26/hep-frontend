import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

export const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen overflow-hidden">
            <div className="flex flex-col items-center justify-center">
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, var(--surface-ground) 30%)' }}>
                    <div className="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center text-center" style={{ borderRadius: '53px' }}>
                        <span className="text-primary font-bold text-3xl">404</span>
                        <h1 className="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">Página no encontrada</h1>
                        <div className="text-surface-600 dark:text-surface-200 mb-8">El recurso solicitado no está disponible.</div>
                        <Button label="Ir al Panel Principal" icon="pi pi-home" onClick={() => navigate('/dashboard')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
