import React from 'react';
import { Button } from 'primereact/button';
import classNames from 'classnames';
import { useLayout } from './context/layoutcontext';

interface AppFloatingConfiguratorProps {
    float?: boolean;
}

export const AppFloatingConfigurator: React.FC<AppFloatingConfiguratorProps> = ({ float = true }) => {
    const { layoutConfig, setLayoutConfig } = useLayout();

    const toggleDarkMode = () => {
        setLayoutConfig((prev) => ({ ...prev, darkTheme: !prev.darkTheme }));
    };

    return (
        <div className={classNames('flex gap-4 top-8 right-8', { 'fixed': float })}>
            <Button
                type="button"
                onClick={toggleDarkMode}
                rounded
                icon={layoutConfig.darkTheme ? 'pi pi-moon' : 'pi pi-sun'}
                severity="secondary"
            />
        </div>
    );
};

export default AppFloatingConfigurator;
