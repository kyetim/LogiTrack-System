import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: string;
    type?: 'shipment' | 'user' | 'vehicle' | 'driver';
    className?: string;
    labels?: Record<string, string>; // Optional mapping for translated labels
}

export function StatusBadge({ status, type = 'shipment', className, labels }: StatusBadgeProps) {

    // Define color maps based on status
    const getColor = (status: string) => {
        const s = status.toUpperCase();

        // Success / Completed / Active
        if (['DELIVERED', 'COMPLETED', 'ACTIVE', 'ON_DUTY', 'ADMIN'].includes(s)) {
            return {
                bg: 'bg-primary/10',
                text: 'text-primary',
                dot: 'bg-primary',
                border: 'border-primary/20'
            };
        }

        // Processing / In Progress / Info
        if (['IN_TRANSIT', 'DRIVER', 'DISPATCHER'].includes(s)) {
            return {
                bg: 'bg-secondary/10',
                text: 'text-secondary',
                dot: 'bg-secondary',
                border: 'border-secondary/20'
            };
        }

        // Warning / Pending
        if (['PENDING', 'MAINTENANCE'].includes(s)) {
            return {
                bg: 'bg-accent/10',
                text: 'text-accent-foreground',
                dot: 'bg-accent',
                border: 'border-accent/20'
            };
        }

        // Destructive / Cancelled
        if (['CANCELLED', 'INACTIVE', 'OFF_DUTY'].includes(s)) {
            return {
                bg: 'bg-destructive/10',
                text: 'text-destructive', // Destructive is usually readable on light
                dot: 'bg-destructive',
                border: 'border-destructive/20'
            };
        }

        // Default
        return {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            dot: 'bg-gray-400',
            border: 'border-gray-200'
        };
    };

    const colors = getColor(status);
    const label = labels ? labels[status] : status; // Use translated label if provided

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium transition-all shadow-sm",
            colors.bg,
            colors.text,
            colors.border,
            className
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]", colors.dot)}></span>
            <span className="capitalize">{label}</span>
        </div>
    );
}
