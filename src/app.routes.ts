import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
    {
        path: '',
        component: AppLayout,
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'activos', loadChildren: () => import('./app/pages/activos/activos.routes').then(m => m.default) },
            { path: 'traslados', loadChildren: () => import('./app/pages/traslados/traslados.routes').then(m => m.default) },
            { path: 'mantenimientos', loadChildren: () => import('./app/pages/mantenimientos/mantenimientos.routes').then(m => m.default) },
            { path: 'bajas', loadChildren: () => import('./app/pages/bajas/bajas.routes').then(m => m.default) },
            { path: 'reportes', loadChildren: () => import('./app/pages/reportes/reportes.routes').then(m => m.default) },
            { path: 'administracion', loadChildren: () => import('./app/pages/administracion/administracion.routes').then(m => m.default) }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes').then(m => m.default) },
    { path: '**', redirectTo: '/notfound' }
];
