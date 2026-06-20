import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from 'react-router-dom';
    import routes from './routes';
    import { LayoutProvider } from './layout/context/layoutcontext';
    import { ActivosProvider } from './context/ActivosContext';
    import { ActasProvider } from './context/ActasContext';
    import { TrasladosProvider } from './context/TrasladosContext';
    import { MantenimientosProvider } from './context/MantenimientosContext';
    
    // Global Styles
    import './assets/tailwind.css';
    import './assets/styles.scss';
    import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
    const router = createBrowserRouter(routes);
    
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <ActivosProvider>
                <ActasProvider>
                    <TrasladosProvider>
                        <MantenimientosProvider>
                            <LayoutProvider>
                                <RouterProvider router={router} />
                            </LayoutProvider>
                        </MantenimientosProvider>
                    </TrasladosProvider>
                </ActasProvider>
            </ActivosProvider>
        </React.StrictMode>
    );

