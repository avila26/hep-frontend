import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AppMenu from './AppMenu';
import { useLayout } from './context/layoutcontext';

export const AppSidebar: React.FC = () => {
    const { layoutState, setLayoutState, isDesktop } = useLayout();
    const location = useLocation();
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Close sidebar on route change
    useEffect(() => {
        setLayoutState((prev) => ({
            ...prev,
            overlayMenuActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));
    }, [location.pathname, setLayoutState]);

    // Outside click listener for overlay & mobile menus
    useEffect(() => {
        const active = isDesktop() ? layoutState.overlayMenuActive : layoutState.mobileMenuActive;
        if (!active) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const menuButton = document.querySelector('.layout-menu-button');
            const target = event.target as Node;

            if (sidebarRef.current && !sidebarRef.current.contains(target) && menuButton && !menuButton.contains(target)) {
                setLayoutState((prev) => ({
                    ...prev,
                    overlayMenuActive: false,
                    mobileMenuActive: false,
                    menuHoverActive: false
                }));
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [layoutState.overlayMenuActive, layoutState.mobileMenuActive, isDesktop, setLayoutState]);

    return (
        <div ref={sidebarRef} className="layout-sidebar">
            <AppMenu />
        </div>
    );
};

export default AppSidebar;
