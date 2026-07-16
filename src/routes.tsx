import { Navigate, RouteObject } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Dashboard from './views/dashboard/Dashboard';
import Login from './views/auth/Login';
import ErrorPage from './views/auth/Error';
import Access from './views/auth/Access';
import NotFound from './views/notfound/NotFound';
import PlaceholderPage from './views/PlaceholderPage';
import RegistrarTraslado from './views/traslados/RegistrarTraslado';
import PendientesTraslados from './views/traslados/Pendientes';
import EjecutadosTraslados from './views/traslados/Ejecutados';
import HistorialTraslados from './views/traslados/Historial';
import ConsultarActivos from './views/activos/ConsultarActivos';
import HojaDeVida from './views/activos/HojaDeVida';
import ConsultarActas from './views/activos/ConsultarActas';
import IngresoActivo from './views/activos/IngresoActivo';
import Preventivos from './views/mantenimientos/Preventivos';
import Correctivos from './views/mantenimientos/Correctivos';
import CerrarMantenimiento from './views/mantenimientos/CerrarMantenimiento';
import Historial from './views/mantenimientos/Historial';
import Solicitudes from './views/bajas/Solicitudes';
import Revision from './views/bajas/Revision';
import Aprobados from './views/bajas/Aprobados';
import Egresos from './views/bajas/Egresos';
import ReporteActivos from './views/reportes/Activos';
import ReporteMantenimientos from './views/reportes/Mantenimientos';
import ReporteTraslados from './views/reportes/Traslados';
import ReporteDepreciacion from './views/reportes/Depreciacion';
import Usuarios from './views/administracion/Usuarios';
import Roles from './views/administracion/Roles';
import Catalogos from './views/administracion/Catalogos';
import Auditoria from './views/administracion/Auditoria';






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
                    {path: 'ingresar', element: <IngresoActivo />},
                    {path: 'consultar', element: <ConsultarActivos />},
                    { path: 'codigo-barras', element: <PlaceholderPage title="Código de Barras" /> },
                    { path: 'hoja-vida', element: <HojaDeVida /> },
                    { path: 'hoja-vida/:idActivo', element: <HojaDeVida /> },
                    { path: 'actas', element: <ConsultarActas /> },
                    { path: 'actas/nueva', element: <Navigate to="/activos/ingresar" replace /> },
                    { path: 'actas/:idActa', element: <Navigate to="/activos/actas" replace /> }
                ]
            },
            // Traslados
            {
                path: 'traslados',
                children: [
                    { index: true, element: <PlaceholderPage title="Traslados" /> },
                    { path: 'registrar', element: <RegistrarTraslado /> },
                    { path: 'pendientes', element: <PendientesTraslados /> },
                    { path: 'ejecutados', element: <EjecutadosTraslados /> },
                    { path: 'historial', element: <HistorialTraslados /> }
                ]
            },
            // Mantenimientos
            {
                path: 'mantenimientos',
                children: [
                    { index: true, element: <PlaceholderPage title="Mantenimientos" /> },
                    { path: 'preventivos', element: <Preventivos /> },
                    { path: 'correctivos', element: <Correctivos /> },
                    { path: 'cerrar', element: <CerrarMantenimiento /> },
                    { path: 'historial', element: <Historial /> }
                ]
            },
            // Bajas
            {
                path: 'bajas',
                children: [
                    { index: true, element: <PlaceholderPage title="Bajas" /> },
                    { path: 'solicitudes', element: <Solicitudes /> },
                    { path: 'informes', element: <Solicitudes /> },
                    { path: 'revision', element: <Revision /> },
                    { path: 'aprobados', element: <Aprobados /> },
                    { path: 'egresos', element: <Egresos /> }
                ]
            },
            // Reportes
            {
                path: 'reportes',
                children: [
                    { index: true, element: <PlaceholderPage title="Reportes" /> },
                    { path: 'activos', element: <ReporteActivos /> },
                    { path: 'mantenimientos', element: <ReporteMantenimientos /> },
                    { path: 'traslados', element: <ReporteTraslados /> },
                    { path: 'depreciacion', element: <ReporteDepreciacion /> },
                ]
            },
            // Administración
            {
                path: 'administracion',
                children: [
                    { index: true, element: <PlaceholderPage title="Administración" /> },
                    { path: 'usuarios', element: <Usuarios /> },
                    { path: 'roles', element: <Roles /> },
                    { path: 'catalogos', element: <Catalogos /> },
                    { path: 'auditoria', element: <Auditoria /> }
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
