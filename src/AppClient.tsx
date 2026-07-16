import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import routes from './routes';
import { LayoutProvider } from './layout/context/layoutcontext';
import { ActivosProvider } from './context/ActivosContext';
import { ActasProvider } from './context/ActasContext';
import { TrasladosProvider } from './context/TrasladosContext';
import { MantenimientosProvider } from './context/MantenimientosContext';
import { BajasProvider } from './context/BajasContext';
import { AdministracionProvider } from './context/AdministracionContext';

// Configurar el enrutador cliente
const router = createBrowserRouter(routes);

export default function AppClient() {
    return (
        <ActivosProvider>
            <ActasProvider>
                <TrasladosProvider>
                    <MantenimientosProvider>
                        <BajasProvider>
                            <AdministracionProvider>
                                <LayoutProvider>
                                    <RouterProvider router={router} />
                                </LayoutProvider>
                            </AdministracionProvider>
                        </BajasProvider>
                    </MantenimientosProvider>
                </TrasladosProvider>
            </ActasProvider>
        </ActivosProvider>
    );
}
