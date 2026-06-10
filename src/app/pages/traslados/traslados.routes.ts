import { Routes } from '@angular/router';
import { RegistrarTraslado } from './registrar-traslado';
import { Pendientes } from './pendientes';
import { Ejecutados } from './ejecutados';
import { Historial } from './historial';

export default [
    { path: 'registrar', component: RegistrarTraslado },
    { path: 'pendientes', component: Pendientes },
    { path: 'ejecutados', component: Ejecutados },
    { path: 'historial', component: Historial },
    { path: '', redirectTo: 'pendientes', pathMatch: 'full' }
] as Routes;
