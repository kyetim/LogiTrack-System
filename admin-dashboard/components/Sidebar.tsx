'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Truck,
    MapPin,
    Package,
    BarChart3,
    MessageSquare,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Map as MapIcon,
    LifeBuoy,
    History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useTranslations } from '@/lib/i18n';

interface SidebarProps {
    className?: string;
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ className, collapsed, setCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { notifications } = useSocket();
    const t = useTranslations();

    // If user is not yet loaded, avoid rendering a broken sidebar, or just default to minimal
    const userRole = user?.role || 'DRIVER';

    // Count unread notifications by type for sidebar badges
    const unreadSupportCount = notifications.filter(n => !n.read && (n.type === 'new_ticket' || n.type === 'new_message' || n.type === 'emergency')).length;
    const unreadMessageCount = notifications.filter(n => !n.read && n.type === 'legacy_message').length;

    const routes = [
        {
            label: t('dashboard.title') || 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            color: 'text-sky-500',
            allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPANY_OWNER', 'COMPANY_MANAGER'],
        },
        {
            label: t('dashboard.manageUsers') || 'Users',
            icon: Users,
            href: '/dashboard/users',
            color: 'text-violet-500',
            allowedRoles: ['ADMIN'], // Only Admins can manage users
        },
        {
            label: t('dashboard.manageDrivers') || 'Drivers',
            icon: Truck,
            href: '/dashboard/drivers',
            color: 'text-emerald-500',
            allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPANY_OWNER', 'COMPANY_MANAGER'],
        },
        {
            label: t('dashboard.manageVehicles') || 'Vehicles',
            icon: MapPin,
            href: '/dashboard/vehicles',
            color: 'text-orange-500',
            allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPANY_OWNER', 'COMPANY_MANAGER'],
        },
        {
            label: t('dashboard.manageShipments') || 'Shipments',
            icon: Package,
            href: '/dashboard/shipments',
            color: 'text-pink-500',
            allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPANY_OWNER', 'COMPANY_MANAGER'],
        },
        {
            label: 'Canlı Takip',
            icon: MapPin,
            href: '/dashboard/tracking',
            color: 'text-blue-600',
            allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPANY_OWNER', 'COMPANY_MANAGER'],
        },
        {
            label: 'Harita',
            icon: MapIcon,
            href: '/dashboard/map',
            color: 'text-indigo-500',
            allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPANY_OWNER', 'COMPANY_MANAGER'],
        },
        {
            label: 'Analizler',
            icon: BarChart3,
            href: '/dashboard/analytics',
            color: 'text-purple-600',
            allowedRoles: ['ADMIN', 'COMPANY_OWNER', 'COMPANY_MANAGER'], // Dispatcher hidden
        },
        {
            label: 'Destek',
            icon: LifeBuoy,
            href: '/dashboard/support',
            color: 'text-red-600',
            allowedRoles: ['ADMIN', 'DISPATCHER'],
        },
        {
            label: t('messages.title') || 'Messages',
            icon: MessageSquare,
            href: '/dashboard/messages',
            color: 'text-green-600',
            allowedRoles: ['ADMIN', 'DISPATCHER'],
        },
        {
            label: 'İşlem Geçmişi',
            icon: History,
            href: '/dashboard/audit-logs',
            color: 'text-amber-500',
            allowedRoles: ['ADMIN'],
        },
    ];

    const filteredRoutes = routes.filter(route => route.allowedRoles.includes(userRole));

    return (
        <div
            className={cn(
                'relative flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border/10 transition-all duration-300 shadow-2xl z-50',
                collapsed ? 'w-20' : 'w-72',
                className
            )}
        >
            {/* Toggle Button */}
            <div className="absolute -right-3 top-9 z-50">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg bg-sidebar-primary text-sidebar-primary-foreground border-2 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Logo area */}
            <div className="px-6 py-8 flex items-center">
                <div className="relative h-10 w-10 mr-4">
                    <div className="absolute inset-0 bg-sidebar-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative h-full w-full bg-gradient-to-br from-sidebar-primary to-sidebar-accent rounded-xl flex items-center justify-center shadow-soft">
                        <Truck className="h-6 w-6 text-sidebar-primary-foreground" />
                    </div>
                </div>
                {!collapsed && (
                    <h1 className="text-2xl font-bold tracking-tight text-sidebar-foreground">
                        LogiTrack
                    </h1>
                )}
            </div>

            {/* Navigation */}
            <div className={cn("flex-1 py-6 overflow-y-auto space-y-2 overflow-x-hidden", collapsed ? "px-1" : "px-4")}>
                {filteredRoutes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-2xl transition-all duration-300',
                            pathname === route.href
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1',
                            !collapsed && pathname === route.href && 'scale-105',
                            collapsed && 'justify-center w-12 h-12 p-0 mx-auto rounded-xl' // Make it square and centered when collapsed
                        )}
                    >
                        <div className={cn("relative flex items-center", !collapsed && "flex-1")}>
                            <route.icon className={cn('h-5 w-5 mr-3 transition-colors', pathname === route.href ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground', collapsed && 'mr-0')} />
                            {/* Notification badge for Support */}
                            {route.href === '/dashboard/support' && unreadSupportCount > 0 && (
                                <span className={cn(
                                    'absolute flex items-center justify-center rounded-full bg-red-500 text-white font-bold text-[10px] leading-none border-2 border-sidebar',
                                    collapsed ? '-top-1 -right-1 h-5 w-5' : '-top-1 left-3 h-4 w-4'
                                )}>
                                    {unreadSupportCount > 9 ? '9+' : unreadSupportCount}
                                </span>
                            )}
                            {/* Notification badge for Messages */}
                            {route.href === '/dashboard/messages' && unreadMessageCount > 0 && (
                                <span className={cn(
                                    'absolute flex items-center justify-center rounded-full bg-red-500 text-white font-bold text-[10px] leading-none border-2 border-sidebar',
                                    collapsed ? '-top-1 -right-1 h-5 w-5' : '-top-1 left-3 h-4 w-4'
                                )}>
                                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                </span>
                            )}
                            {!collapsed && (
                                <span className="truncate">
                                    {route.label}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 mt-auto border-t border-sidebar-border/10">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 rounded-2xl",
                        collapsed && "justify-center px-0"
                    )}
                    onClick={logout}
                >
                    <LogOut className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                    {!collapsed && "Çıkış Yap"}
                </Button>
            </div>
        </div>
    );
}
