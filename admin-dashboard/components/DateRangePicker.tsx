'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface DateRangePickerProps {
    value?: DateRange;
    onChange?: (range: DateRange | undefined) => void;
    className?: string;
}

export function DateRangePicker({
    value,
    onChange,
    className,
}: DateRangePickerProps) {
    const [date, setDate] = useState<DateRange | undefined>(value);
    const [preset, setPreset] = useState<string>('custom');

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const today = new Date();
        let newRange: DateRange | undefined;

        switch (value) {
            case 'today':
                newRange = { from: today, to: today };
                break;
            case '7days':
                newRange = {
                    from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
                    to: today,
                };
                break;
            case '30days':
                newRange = {
                    from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                    to: today,
                };
                break;
            case '90days':
                newRange = {
                    from: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
                    to: today,
                };
                break;
            case 'all':
                newRange = undefined;
                break;
            default:
                return;
        }

        setDate(newRange);
        onChange?.(newRange);
    };

    const handleDateChange = (newDate: DateRange | undefined) => {
        setDate(newDate);
        setPreset('custom');
        onChange?.(newDate);
    };

    return (
        <div className={cn('flex gap-2', className)}>
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tarih Aralığı" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="today">Bugün</SelectItem>
                    <SelectItem value="7days">Son 7 Gün</SelectItem>
                    <SelectItem value="30days">Son 30 Gün</SelectItem>
                    <SelectItem value="90days">Son 90 Gün</SelectItem>
                    <SelectItem value="custom">Özel</SelectItem>
                </SelectContent>
            </Select>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn(
                            'w-[280px] justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'dd/MM/yyyy')} -{' '}
                                    {format(date.to, 'dd/MM/yyyy')}
                                </>
                            ) : (
                                format(date.from, 'dd/MM/yyyy')
                            )
                        ) : (
                            <span>Tarih seçin</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            {date && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setDate(undefined);
                        setPreset('all');
                        onChange?.(undefined);
                    }}
                >
                    Temizle
                </Button>
            )}
        </div>
    );
}
