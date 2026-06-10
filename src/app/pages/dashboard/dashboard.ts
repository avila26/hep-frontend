import { Component } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    imports: [],
    template: `
        <div class="flex flex-col min-h-[75vh]">
            <!-- Header Section -->
            <div class="pb-1">
                <h1 class="text-3xl font-medium text-slate-800 dark:text-slate-100 m-0">Principal</h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 m-0 mt-1">Principal</p>
            </div>
            
            <hr class="border-t border-slate-200 dark:border-slate-800 my-4" />

            <!-- Content Section -->
            <div class="flex-1">
                <p class="text-slate-700 dark:text-slate-300 text-base m-0">principal</p>
            </div>

            <!-- Footer Section -->
            <div class="mt-auto pt-16 pb-4 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 text-sm gap-1">
                <span class="m-0">© Copyright <strong>MSP</strong>. All Rights Reserved 2024</span>
                <span class="m-0">Desarrollado por Unidad de Tics &#64;EAMM</span>
                <span class="m-0">Hospital de Especialidades Portoviejo</span>
            </div>
        </div>
    `
})
export class Dashboard {}
