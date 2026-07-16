import React from 'react';
import '@/assets/tailwind.css';
import '@/assets/styles.scss';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

export const metadata = {
    title: 'Hospital de Especialidades Portoviejo - Activos Fijos',
    description: 'Sistema de Control y Gestión de Activos Fijos del Hospital de Especialidades Portoviejo',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>
                <div id="root">
                    {children}
                </div>
            </body>
        </html>
    );
}
