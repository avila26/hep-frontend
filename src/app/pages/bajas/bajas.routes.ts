import { Routes } from '@angular/router';
import { BajasSolicitudes } from './solicitudes';
import { BajasInformes } from './informes';
import { BajasRevision } from './revision';
import { BajasAprobados } from './aprobados';
import { BajasEgresos } from './egresos';

export default [
    { path: 'solicitudes', component: BajasSolicitudes },
    { path: 'informes', component: BajasInformes },
    { path: 'revision', component: BajasRevision },
    { path: 'aprobados', component: BajasAprobados },
    { path: 'egresos', component: BajasEgresos },
    { path: '', redirectTo: 'solicitudes', pathMatch: 'full' }
] as Routes;
