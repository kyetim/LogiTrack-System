'use client';

import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="h-full relative overflow-hidden">
            <div className={`hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-all duration-300 ${sidebarCollapsed ? 'md:w-20' : 'md:w-72'}`}>
                <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            </div>
            <div className={`h-full bg-transparent overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-72'}`}>
                <DashboardHeader />
                <main className="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
