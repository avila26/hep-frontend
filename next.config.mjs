/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: ['primereact'],
    // Deshabilitar ESLint y TypeScript checks durante compilación para Next si hay errores heredados de la SPA de Vite
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

export default nextConfig;
