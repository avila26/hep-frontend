import { Routes } from '@angular/router';
import { ReporteActivos } from './activos';
import { ReporteMantenimientos } from './mantenimientos';
import { ReporteTraslados } from './traslados';
import { ReporteDepreciacion } from './depreciacion';

export default [
    { path: 'activos', component: ReporteActivos },
    { path: 'mantenimientos', component: ReporteMantenimientos },
    { path: 'traslados', component: ReporteTraslados },
    { path: 'depreciacion', component: ReporteDepreciacion },
    { path: '', redirectTo: 'activos', pathMatch: 'full' }
] as Routes;
