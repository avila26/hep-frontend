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
import EjecutadosTraslados from './pages/traslados/Ejecutados';
import HistorialTraslados from './pages/traslados/Historial';
import ConsultarActivos from './pages/activos/ConsultarActivos';
import HojaDeVida from './pages/activos/HojaDeVida';
import RegistrarActa from './pages/activos/RegistrarActa';
import ConsultarActas from './pages/activos/ConsultarActas';
import IngresoActivo from './pages/activos/IngresoActivo';
import Preventivos from './pages/mantenimientos/Preventivos';
import Correctivos from './pages/mantenimientos/Correctivos';
import CerrarMantenimiento from './pages/mantenimientos/CerrarMantenimiento';
import Historial from './pages/mantenimientos/Historial';
import Solicitudes from './pages/bajas/Solicitudes';
import Revision from './pages/bajas/Revision';
import Aprobados from './pages/bajas/Aprobados';
import Egresos from './pages/bajas/Egresos';
import ReporteActivos from './pages/reportes/Activos';
import ReporteMantenimientos from './pages/reportes/Mantenimientos';
import ReporteTraslados from './pages/reportes/Traslados';
import ReporteDepreciacion from './pages/reportes/Depreciacion';
import Usuarios from './pages/administracion/Usuarios';
import Roles from './pages/administracion/Roles';
import Catalogos from './pages/administracion/Catalogos';
import Auditoria from './pages/administracion/Auditoria';






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
                    { path: 'actas/nueva', element: <RegistrarActa /> },
                    { path: 'actas/:idActa', element: <RegistrarActa /> }
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
