'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface TableFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter?: string;
    onStatusFilterChange?: (value: string) => void;
    roleFilter?: string;
    onRoleFilterChange?: (value: string) => void;
    statusOptions?: Array<{ value: string; label: string }>;
    roleOptions?: Array<{ value: string; label: string }>;
    searchPlaceholder?: string;
}

export function TableFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    roleFilter,
    onRoleFilterChange,
    statusOptions,
    roleOptions,
    searchPlaceholder = 'Ara...',
}: TableFiltersProps) {
    return (
        <div className="flex flex-wrap gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Status Filter */}
            {statusOptions && onStatusFilterChange && (
                <div className="w-[180px]">
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Role Filter */}
            {roleOptions && onRoleFilterChange && (
                <div className="w-[180px]">
                    <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            {roleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
