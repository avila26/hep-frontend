import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { Ripple } from 'primereact/ripple';
import { useLayout } from './context/layoutcontext';

interface AppMenuitemProps {
    item: any;
    index: number;
    root?: boolean;
    parentPath?: string | null;
}

export const AppMenuitem: React.FC<AppMenuitemProps> = ({ item, root = false, parentPath = null }) => {
    const { layoutState, setLayoutState } = useLayout();
    const location = useLocation();

    const hasChildren = item.items && item.items.length > 0;
    const hasRouterLink = !!item.routerLink;
    const isVisible = item.visible !== false;

    // Compute full path for nested items
    const fullPath = React.useMemo(() => {
        const itemPath = item.path;
        if (!itemPath) return parentPath;
        if (parentPath && !itemPath.startsWith(parentPath)) {
            return parentPath + itemPath;
        }
        return itemPath;
    }, [item.path, parentPath]);

    // Determine if this item is currently open (for parents) or active (for leaves)
    const isActive = React.useMemo(() => {
        if (hasChildren) {
            return layoutState.activePath === fullPath;
        }

        if (item.routerLink && item.routerLink.length > 0) {
            return location.pathname === item.routerLink[0];
        }

        return false;
    }, [hasChildren, item.routerLink, fullPath, layoutState.activePath, location.pathname]);

    // Keep route-synced parents open on initial route load, unless manually closed.
    useEffect(() => {
        if (item.routerLink && location.pathname === item.routerLink[0] && parentPath) {
            const shouldSyncRoute = layoutState.activePath === null && layoutState.manualClosedPath !== parentPath;

            if (shouldSyncRoute) {
                setLayoutState((prev) => ({
                    ...prev,
                    activePath: parentPath
                }));
            }
        }
    }, [location.pathname, item.routerLink, parentPath, setLayoutState, layoutState.manualClosedPath, layoutState.activePath]);

    if (!isVisible) return null;

    const itemClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (item.disabled) {
            event.preventDefault();
            return;
        }

        if (hasChildren) {
            event.preventDefault();
        }

        if (item.command) {
            item.command({ originalEvent: event, item: item });
        }

        if (hasChildren) {
            if (isActive) {
                setLayoutState((prev) => ({
                    ...prev,
                    activePath: null,
                    manualClosedPath: fullPath
                }));
            } else {
                setLayoutState((prev) => ({
                    ...prev,
                    activePath: fullPath,
                    manualClosedPath: null,
                    menuHoverActive: true
                }));
            }
        } else {
            setLayoutState((prev) => ({
                ...prev,
                activePath: root ? null : prev.activePath,
                manualClosedPath: null,
                overlayMenuActive: false,
                mobileMenuActive: false,
                menuHoverActive: false
            }));
        }
    };

    const renderLinkContent = () => (
        <>
            <i className={classNames(item.icon, 'layout-menuitem-icon')}></i>
            <span className="layout-menuitem-text">{item.label}</span>
            {hasChildren && (
                <i
                    className={classNames('pi pi-fw layout-submenu-toggler', {
                        'pi-angle-up': isActive,
                        'pi-angle-down': !isActive
                    })}
                ></i>
            )}
            <Ripple />
        </>
    );

    return (
        <li className={classNames({ 'active-menuitem': isActive, 'layout-root-menuitem': root })}>
            {hasRouterLink ? (
                <Link
                    to={item.routerLink[0]}
                    onClick={itemClick}
                    className={classNames(item.class, 'p-ripple', { 'active-route': isActive })}
                    target={item.target}
                    tabIndex={0}
                >
                    {renderLinkContent()}
                </Link>
            ) : (
                <a 
                    href={item.url || '#'} 
                    onClick={itemClick} 
                    className={classNames(item.class, 'p-ripple')}
                    target={item.target} 
                    tabIndex={0}
                >
                    {renderLinkContent()}
                </a>
            )}

            {/* Render submenus */}
            {hasChildren && isActive && (
                <ul className={classNames({ 'layout-root-submenulist': root })}>
                    {item.items.map((child: any, i: number) => (
                        <AppMenuitem 
                            key={child.label || i} 
                            item={child} 
                            index={i} 
                            parentPath={fullPath} 
                            root={false} 
                            // Add any badge/classes
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export default AppMenuitem;
