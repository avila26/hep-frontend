import { Routes } from '@angular/router';
import { Preventivos } from './preventivos';
import { Correctivos } from './correctivos';
import { CerrarMantenimiento } from './cerrar-mantenimiento';
import { MantenimientosHistorial } from './historial';

export default [
    { path: 'preventivos', component: Preventivos },
    { path: 'correctivos', component: Correctivos },
    { path: 'cerrar', component: CerrarMantenimiento },
    { path: 'historial', component: MantenimientosHistorial },
    { path: '', redirectTo: 'preventivos', pathMatch: 'full' }
] as Routes;
