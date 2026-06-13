import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
}

export interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
    manualClosedPath: string | null;
}

interface LayoutContextProps {
    layoutConfig: LayoutConfig;
    setLayoutConfig: React.Dispatch<React.SetStateAction<LayoutConfig>>;
    layoutState: LayoutState;
    setLayoutState: React.Dispatch<React.SetStateAction<LayoutState>>;
    onMenuToggle: () => void;
    showConfigSidebar: () => void;
    hideConfigSidebar: () => void;
    toggleDarkMode: (config?: LayoutConfig) => void;
    isDarkTheme: boolean;
    isDesktop: () => boolean;
    isMobile: () => boolean;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null,
        manualClosedPath: null
    });

    const isDesktop = useCallback(() => window.innerWidth > 991, []);
    const isMobile = useCallback(() => !isDesktop(), [isDesktop]);

    const toggleDarkMode = useCallback((config?: LayoutConfig) => {
        const activeConfig = config || layoutConfig;
        if (activeConfig.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }, [layoutConfig]);

    // Apply dark mode on configuration change
    useEffect(() => {
        const supportsViewTransition = 'startViewTransition' in document;
        if (supportsViewTransition) {
            // @ts-ignore
            document.startViewTransition(() => {
                toggleDarkMode(layoutConfig);
            });
        } else {
            toggleDarkMode(layoutConfig);
        }
    }, [layoutConfig.darkTheme, toggleDarkMode]);

    const onMenuToggle = () => {
        const isOverlay = layoutConfig.menuMode === 'overlay';

        if (isOverlay) {
            setLayoutState((prev) => ({ ...prev, overlayMenuActive: !prev.overlayMenuActive }));
        }

        if (isDesktop()) {
            setLayoutState((prev) => ({ ...prev, staticMenuDesktopInactive: !prev.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prev) => ({ ...prev, mobileMenuActive: !prev.mobileMenuActive }));
        }
    };

    const showConfigSidebar = () => {
        setLayoutState((prev) => ({ ...prev, configSidebarVisible: true }));
    };

    const hideConfigSidebar = () => {
        setLayoutState((prev) => ({ ...prev, configSidebarVisible: false }));
    };

    const value: LayoutContextProps = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showConfigSidebar,
        hideConfigSidebar,
        toggleDarkMode,
        isDarkTheme: layoutConfig.darkTheme,
        isDesktop,
        isMobile
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
