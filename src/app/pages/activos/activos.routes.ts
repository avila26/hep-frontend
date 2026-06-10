import { Routes } from '@angular/router';
import { RegistrarActivo } from './registrar-activo';
import { ConsultarActivos } from './consultar-activos';
import { CargaMasiva } from './carga-masiva';
import { CodigoBarras } from './codigo-barras';
import { HojaVida } from './hoja-vida';

export default [
    { path: 'registrar', component: RegistrarActivo },
    { path: 'consultar', component: ConsultarActivos },
    { path: 'carga-masiva', component: CargaMasiva },
    { path: 'codigo-barras', component: CodigoBarras },
    { path: 'hoja-vida', component: HojaVida },
    { path: '', redirectTo: 'consultar', pathMatch: 'full' }
] as Routes;
