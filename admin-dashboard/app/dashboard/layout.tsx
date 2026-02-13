'use client';

import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative overflow-hidden">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar />
            </div>
            <div className="md:pl-72 h-full bg-transparent overflow-x-hidden">
                <DashboardHeader />
                <main className="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
