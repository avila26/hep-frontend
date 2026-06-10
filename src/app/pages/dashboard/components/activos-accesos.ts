import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface AccesoActivo {
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
    ruta: string;
}

@Component({
    standalone: true,
    selector: 'app-activos-accesos',
    imports: [RouterModule],
    template: `
        <div class="card">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
                    style="width: 2.75rem; height: 2.75rem"
                >
                    <i class="pi pi-box text-blue-500 text-xl!"></i>
                </div>
                <div>
                    <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-xl m-0">Activos</h3>
                    <span class="text-muted-color text-sm">Accesos rápidos al módulo de gestión de activos</span>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                @for (acceso of accesos; track acceso.ruta) {
                    <div>
                        <a
                            [routerLink]="acceso.ruta"
                            class="block no-underline h-full rounded-border border border-surface-200 dark:border-surface-700 p-4 transition-all duration-200 hover:shadow-md hover:border-primary cursor-pointer"
                        >
                            <div class="flex flex-col gap-3 h-full">
                                <div
                                    class="flex items-center justify-center rounded-border"
                                    [style.background-color]="acceso.color + '20'"
                                    style="width: 2.75rem; height: 2.75rem"
                                >
                                    <i [class]="acceso.icono + ' text-xl!'" [style.color]="acceso.color"></i>
                                </div>
                                <div class="flex-1">
                                    <span class="block text-surface-900 dark:text-surface-0 font-medium mb-1">{{ acceso.titulo }}</span>
                                    <span class="text-muted-color text-sm leading-normal">{{ acceso.descripcion }}</span>
                                </div>
                                <span class="text-primary text-sm font-medium flex items-center gap-1">
                                    Ir <i class="pi pi-arrow-right text-xs!"></i>
                                </span>
                            </div>
                        </a>
                    </div>
                }
            </div>
        </div>
    `
})
export class ActivosAccesos {
    accesos: AccesoActivo[] = [
        {
            titulo: 'Registrar Activo',
            descripcion: 'Ingresar un nuevo activo al inventario del hospital.',
            icono: 'pi pi-plus-circle',
            color: '#2196F3',
            ruta: '/activos/registrar'
        },
        {
            titulo: 'Consultar Activos',
            descripcion: 'Buscar, filtrar y revisar el listado de activos.',
            icono: 'pi pi-search',
            color: '#4CAF50',
            ruta: '/activos/consultar'
        },
        {
            titulo: 'Carga Masiva',
            descripcion: 'Importar activos desde un archivo Excel.',
            icono: 'pi pi-file-excel',
            color: '#FF9800',
            ruta: '/activos/carga-masiva'
        },
        {
            titulo: 'Código de Barras',
            descripcion: 'Generar e imprimir códigos de barras de activos.',
            icono: 'pi pi-qrcode',
            color: '#9C27B0',
            ruta: '/activos/codigo-barras'
        },
        {
            titulo: 'Hoja de Vida',
            descripcion: 'Consultar el historial completo de un activo.',
            icono: 'pi pi-history',
            color: '#00BCD4',
            ruta: '/activos/hoja-vida'
        }
    ];
}
