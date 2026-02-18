'use client';

import { NotificationsPopover } from '@/components/NotificationsPopover';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';

export function DashboardHeader() {
    const { user, logout } = useAuth();
    const t = useTranslations();

    if (!user) return null;

    return (
        <header className="h-16 border-b border-border bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all duration-300">
            {/* Search Bar */}
            <div className="hidden md:flex items-center relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Ara..."
                    className="pl-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 ml-auto">
                <LanguageSwitcher />

                <NotificationsPopover />

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                            {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 border border-gray-200">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user.email}&background=0D8ABC&color=fff`} />
                                    <AvatarFallback>AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.email}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.role}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => console.log('Profile')}>
                                Profil Ayarları
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('Billing')}>
                                Abonelik
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={logout}>
                                {t('common.logout')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
