import React from 'react';
import { Link } from 'react-router-dom';
import { useLayout } from './context/layoutcontext';

export const AppTopbar: React.FC = () => {
    const { onMenuToggle } = useLayout();

    return (
        <div className="layout-topbar">
            <div className="layout-topbar-logo-container">
                <button className="layout-menu-button layout-topbar-action" onClick={onMenuToggle}>
                    <i className="pi pi-bars"></i>
                </button>
                <Link className="layout-topbar-logo" to="/dashboard">
                    <img 
                        className="layout-topbar-logo-img"
                        src="/demo/images/imagenes/Ministerio_de_Salud_P%C3%BAblica_de_Ecuador_logo.svg.png"
                        alt="HEP Logo"
                    />
                </Link>
            </div>

            <div className="layout-topbar-actions">
                <button 
                    className="layout-topbar-menu-button layout-topbar-action"
                    // In React we can toggle state or use standard prime styleclass equivalent if needed.
                    // But for simple topbar profile, we can implement toggle or just render it directly.
                >
                    <i className="pi pi-ellipsis-v"></i>
                </button>

                <div className="layout-topbar-menu hidden lg:block">
                    <div className="layout-topbar-menu-content">
                        <button 
                            type="button" 
                            className="layout-topbar-action"
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que deseas limpiar todo el LocalStorage? Esto borrará todos los activos, traslados, mantenimientos y configuraciones, restableciendo la aplicación.')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                        >
                            <i className="pi pi-trash" style={{ color: '#ef4444' }}></i>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Limpiar Datos</span>
                        </button>
                        <button type="button" className="layout-topbar-action">
                            <i className="pi pi-user"></i>
                            <span>Perfil</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppTopbar;
