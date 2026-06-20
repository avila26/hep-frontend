import React from 'react';
import AppMenuitem from './AppMenuitem';

export interface MenuItem {
    label: string;
    icon?: string;
    routerLink?: string[];
    path?: string;
    items?: MenuItem[];
    separator?: boolean;
    url?: string;
    target?: string;
    visible?: boolean;
    disabled?: boolean;
}

export const AppMenu: React.FC = () => {
    const model: MenuItem[] = [
        {
            label: 'Inicio',
            icon: 'pi pi-fw pi-home',
            routerLink: ['/dashboard']
        },
        {
            label: 'Activos',
            path: '/activos',

            icon: 'pi pi-fw pi-box',
            items: [
                { label: 'Ingresar Activo', icon: 'pi pi-fw pi-plus-circle', routerLink: ['/activos/ingresar'] },
                { label: 'Consultar Activos', icon: 'pi pi-fw pi-search', routerLink: ['/activos/consultar'] },
                { label: 'Hoja de Vida', icon: 'pi pi-fw pi-history', routerLink: ['/activos/hoja-vida'] }
            ]
        },
        {
            label: 'Traslados',
            path: '/traslados',
            icon: 'pi pi-fw pi-arrow-right-arrow-left',
            items: [
                { label: 'Registrar Traslado', icon: 'pi pi-fw pi-plus', routerLink: ['/traslados/registrar'] },
                { label: 'Pendientes', icon: 'pi pi-fw pi-clock', routerLink: ['/traslados/pendientes'] },
                { label: 'Ejecutados', icon: 'pi pi-fw pi-check', routerLink: ['/traslados/ejecutados'] },
                { label: 'Historial', icon: 'pi pi-fw pi-history', routerLink: ['/traslados/historial'] }
            ]
        },
        {
            label: 'Mantenimientos',
            path: '/mantenimientos',
            icon: 'pi pi-fw pi-wrench',
            items: [
                { label: 'Preventivos', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/mantenimientos/preventivos'] },
                { label: 'Correctivos', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/mantenimientos/correctivos'] },
                { label: 'Cerrar Mantenimiento', icon: 'pi pi-fw pi-lock', routerLink: ['/mantenimientos/cerrar'] },
                { label: 'Historial', icon: 'pi pi-fw pi-history', routerLink: ['/mantenimientos/historial'] }
            ]
        },
        {
            label: 'Bajas',
            path: '/bajas',
            icon: 'pi pi-fw pi-trash',
            items: [
                { label: 'Solicitudes', icon: 'pi pi-fw pi-file-edit', routerLink: ['/bajas/solicitudes'] },
                { label: 'Informes Técnicos', icon: 'pi pi-fw pi-file-pdf', routerLink: ['/bajas/informes'] },
                { label: 'Revisión', icon: 'pi pi-fw pi-eye', routerLink: ['/bajas/revision'] },
                { label: 'Aprobados', icon: 'pi pi-fw pi-check-square', routerLink: ['/bajas/aprobados'] },
                { label: 'Egresos', icon: 'pi pi-fw pi-sign-out', routerLink: ['/bajas/egresos'] }
            ]
        },
        {
            label: 'Reportes',
            path: '/reportes',
            icon: 'pi pi-fw pi-chart-bar',
            items: [
                { label: 'Activos', icon: 'pi pi-fw pi-box', routerLink: ['/reportes/activos'] },
                { label: 'Mantenimientos', icon: 'pi pi-fw pi-wrench', routerLink: ['/reportes/mantenimientos'] },
                { label: 'Traslados', icon: 'pi pi-fw pi-exchange', routerLink: ['/reportes/traslados'] },
                { label: 'Depreciación', icon: 'pi pi-fw pi-percentage', routerLink: ['/reportes/depreciacion'] }
            ]
        },
        {
            label: 'Administración',
            path: '/administracion',
            icon: 'pi pi-fw pi-cog',
            items: [
                { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/administracion/usuarios'] },
                { label: 'Roles', icon: 'pi pi-fw pi-shield', routerLink: ['/administracion/roles'] },
                { label: 'Catálogos', icon: 'pi pi-fw pi-list', routerLink: ['/administracion/catalogos'] },
                { label: 'Auditoría', icon: 'pi pi-fw pi-info-circle', routerLink: ['/administracion/auditoria'] }
            ]
        }
    ];

    return (
        <ul className="layout-menu">
            {model.map((item, i) => (
                <React.Fragment key={item.label || i}>
                    {!item.separator ? (
                        <AppMenuitem item={item} index={i} root={true} />
                    ) : (
                        <li className="menu-separator"></li>
                    )}
                </React.Fragment>
            ))}
        </ul>
    );
};

export default AppMenu;
