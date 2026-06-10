import { Routes } from '@angular/router';
import { AdminUsuarios } from './usuarios';
import { AdminRoles } from './roles';
import { AdminCatalogos } from './catalogos';
import { AdminAuditoria } from './auditoria';

export default [
    { path: 'usuarios', component: AdminUsuarios },
    { path: 'roles', component: AdminRoles },
    { path: 'catalogos', component: AdminCatalogos },
    { path: 'auditoria', component: AdminAuditoria },
    { path: '', redirectTo: 'usuarios', pathMatch: 'full' }
] as Routes;
