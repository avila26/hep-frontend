import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from 'react-router-dom';
    import routes from './routes';
    import { LayoutProvider } from './layout/context/layoutcontext';
    import { ActivosProvider } from './context/ActivosContext';
    
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
                <LayoutProvider>
                    <RouterProvider router={router} />
                </LayoutProvider>
            </ActivosProvider>
        </React.StrictMode>
    );
