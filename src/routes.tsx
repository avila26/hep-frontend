import { Navigate, RouteObject } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import ErrorPage from './pages/auth/Error';
import Access from './pages/auth/Access';
import NotFound from './pages/notfound/NotFound';
import PlaceholderPage from './pages/PlaceholderPage';
import RegistrarTraslado from './pages/traslados/RegistrarTraslado';
import PendientesTraslados from './pages/traslados/Pendientes';
import RegistrarActivo from './pages/activos/RegistrarActivo';
import ConsultarActivos from './pages/activos/ConsultarActivos';
import CargaMasiva from './pages/activos/CargaMasiva';
import HojaDeVida from './pages/activos/HojaDeVida';

export const routes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to="/auth/login" replace />
    },
    {
        path: '/auth/login',
        element: <Login />
    },
    {
        path: '/auth/error',
        element: <ErrorPage />
    },
    {
        path: '/auth/access',
        element: <Access />
    },
    {
        path: '/notfound',
        element: <NotFound />
    },
    {
        path: '/',
        element: <AppLayout />,
        children: [
            {
                path: 'dashboard',
                element: <Dashboard />
            },
            // Activos
            {
                path: 'activos',
                children: [
                    { index: true, element: <PlaceholderPage title="Activos" /> },
                    { path: 'registrar', element: <RegistrarActivo /> },
                    { path: 'consultar', element: <ConsultarActivos /> },
                    { path: 'carga-masiva', element: <CargaMasiva /> },
                    { path: 'codigo-barras', element: <PlaceholderPage title="Código de Barras" /> },
                    { path: 'hoja-vida', element: <HojaDeVida /> },
                    { path: 'hoja-vida/:idActivo', element: <HojaDeVida /> }
                ]
            },
            // Traslados
            {
                path: 'traslados',
                children: [
                    { index: true, element: <PlaceholderPage title="Traslados" /> },
                    { path: 'registrar', element: <RegistrarTraslado /> },
                    { path: 'pendientes', element: <PendientesTraslados /> },
                    { path: 'ejecutados', element: <PlaceholderPage title="Traslados Ejecutados" /> },
                    { path: 'historial', element: <PlaceholderPage title="Historial de Traslados" /> }
                ]
            },
            // Mantenimientos
            {
                path: 'mantenimientos',
                children: [
                    { index: true, element: <PlaceholderPage title="Mantenimientos" /> },
                    { path: 'preventivos', element: <PlaceholderPage title="Mantenimientos Preventivos" /> },
                    { path: 'correctivos', element: <PlaceholderPage title="Mantenimientos Correctivos" /> },
                    { path: 'cerrar', element: <PlaceholderPage title="Cerrar Mantenimiento" /> },
                    { path: 'historial', element: <PlaceholderPage title="Historial de Mantenimientos" /> }
                ]
            },
            // Bajas
            {
                path: 'bajas',
                children: [
                    { index: true, element: <PlaceholderPage title="Bajas" /> },
                    { path: 'solicitudes', element: <PlaceholderPage title="Solicitudes de Baja" /> },
                    { path: 'informes', element: <PlaceholderPage title="Informes Técnicos" /> },
                    { path: 'revision', element: <PlaceholderPage title="Revisión de Bajas" /> },
                    { path: 'aprobados', element: <PlaceholderPage title="Bajas Aprobadas" /> },
                    { path: 'egresos', element: <PlaceholderPage title="Egresos" /> }
                ]
            },
            // Reportes
            {
                path: 'reportes',
                children: [
                    { index: true, element: <PlaceholderPage title="Reportes" /> },
                    { path: 'activos', element: <PlaceholderPage title="Reporte de Activos" /> },
                    { path: 'mantenimientos', element: <PlaceholderPage title="Reporte de Mantenimientos" /> },
                    { path: 'traslados', element: <PlaceholderPage title="Reporte de Traslados" /> },
                    { path: 'depreciacion', element: <PlaceholderPage title="Reporte de Depreciación" /> }
                ]
            },
            // Administración
            {
                path: 'administracion',
                children: [
                    { index: true, element: <PlaceholderPage title="Administración" /> },
                    { path: 'usuarios', element: <PlaceholderPage title="Usuarios" /> },
                    { path: 'roles', element: <PlaceholderPage title="Roles" /> },
                    { path: 'catalogos', element: <PlaceholderPage title="Catálogos" /> },
                    { path: 'auditoria', element: <PlaceholderPage title="Auditoría" /> }
                ]
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to="/notfound" replace />
    }
];

export default routes;
