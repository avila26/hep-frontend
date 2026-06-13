import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import classNames from 'classnames';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import { useLayout } from './context/layoutcontext';

export const AppLayout: React.FC = () => {
    const { layoutConfig, layoutState, setLayoutState } = useLayout();

    // Block scroll when mobile menu is active
    useEffect(() => {
        if (layoutState.mobileMenuActive) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.classList.remove('blocked-scroll');
        }
    }, [layoutState.mobileMenuActive]);

    const containerClass = classNames('layout-wrapper', {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.mobileMenuActive
    });

    const hideMenu = () => {
        setLayoutState((prev) => ({
            ...prev,
            overlayMenuActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));
    };

    return (
        <div className={containerClass}>
            <AppTopbar />
            <AppSidebar />
            <div className="layout-main-container">
                <div className="layout-main">
                    <Outlet />
                </div>
            </div>
            <div className="layout-mask" onClick={hideMenu}></div>
        </div>
    );
};

export default AppLayout;
