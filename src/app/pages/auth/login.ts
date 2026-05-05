import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                    <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, #eceeef 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/ministerio_salud_ecuador.png" alt="HEP Logo" class="mb-8 mx-auto" style="height:80px;" />

                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Sistema de Gestión de Activos HEP</div>

                            <span class="text-muted-color font-medium"> Inicie sesión para continuar </span>
                        </div>

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Usuario</label>
                            <input pInputText id="email1" type="text" placeholder="Ingrese el usuario" class="w-full md:w-120 mb-8" style="border-color:#676b6d" [(ngModel)]="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Ingrese la contraseña" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" [inputStyle]="{ 'border-color': '#676b6d' }"></p-password>
                            
                            <p-button label="INGRESAR" styleClass="w-full mt-4" routerLink="/dashboard" [style]="{ 'background-color': '#2196F3', 'border-color': '#2196F3', color: '#ffffff' }"></p-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    email: string = '';

    password: string = '';

    checked: boolean = false;
}
