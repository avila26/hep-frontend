'use client';

import dynamic from 'next/dynamic';

// Cargar dinámicamente el cliente de la aplicación con SSR desactivado
// Esto asegura que la lógica del frontend clásica de React corra 100% en el cliente
const AppClient = dynamic(() => import('@/AppClient'), {
    ssr: false,
});

export default function Page() {
    return <AppClient />;
}
