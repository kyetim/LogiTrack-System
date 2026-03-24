'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';

// Custom sharp bar for technical look
const TechBar = (props: any) => {
    const { fill, x, y, width, height } = props;

    // Calculate path for full height (Final state)
    // Top-Left: (x, y), Top-Right: (x+width, y), Bottom-Right: (x+width, y+height), Bottom-Left: (x, y+height)
    const finalPath = `M${x},${y + height} L${x},${y} L${x + width},${y} L${x + width},${y + height} Z`;

    // Calculate path for 0 height (Initial state) - All points at y+height
    const initialPath = `M${x},${y + height} L${x},${y + height} L${x + width},${y + height} L${x + width},${y + height} Z`;

    return (
        <motion.path
            d={finalPath}
            stroke="none"
            fill={fill}
            initial={{ d: initialPath }}
            animate={{ d: finalPath }}
            transition={{ duration: 0.5, ease: "circOut", delay: props.index * 0.1 }}
        />
    );
};

// Technical grid background
const TechBackground = () => (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748B" strokeWidth="0.5" opacity="0.3" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Abstract data lines */}
            <path d="M0,300 Q400,250 800,300 T1600,300" fill="none" stroke="#003366" strokeWidth="2" opacity="0.1" />
            <path d="M0,280 Q400,230 800,280 T1600,280" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.1" />
        </svg>
    </div>
);

export function LogisticCapacityAnalysis() {
    const t = useTranslations();

    const data = useMemo(() => [
        { name: 'Pzt', capacity: 65, load: 45 },
        { name: 'Sal', capacity: 70, load: 55 },
        { name: 'Çar', capacity: 85, load: 75 },
        { name: 'Per', capacity: 60, load: 40 },
        { name: 'Cum', capacity: 90, load: 85 },
        { name: 'Cmt', capacity: 50, load: 30 },
        { name: 'Paz', capacity: 40, load: 20 },
    ], []);

    return (
        <Card className="glass-panel border-none relative overflow-hidden h-full min-h-[400px]">
            <TechBackground />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-foreground">
                            {t('dashboard.capacityAnalysis') || 'Lojistik Kapasite Analizi'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Haftalık filo doluluk oranları ve kapasite kullanımı</p>
                    </div>
                    {/* Badge / Legend */}
                    <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-primary/80"></span>
                            <span>Kullanılan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-[#F59E0B]/50"></span>
                            <span>Müsait</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-4">
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={data} barSize={40}>
                            <defs>
                                <linearGradient id="techGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#003366" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#64748B" stopOpacity={0.4} />
                                </linearGradient>
                                <filter id="shadow" height="200%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#003366" floodOpacity="0.3" />
                                </filter>
                            </defs>

                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                cursor={{ fill: 'none' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="glass-card px-4 py-2 rounded-lg border border-white/20 shadow-lg">
                                                <p className="font-bold text-primary mb-1">{payload[0].payload.name}</p>
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Kullanım: </span>
                                                    <span className="font-bold text-foreground">%{payload[0].value}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            {/* Background Bar (Total Capacity) */}
                            <Bar
                                dataKey="capacity"
                                fill="#F1F5F9"
                                radius={[4, 4, 4, 4]}
                                isAnimationActive={false} // Static background
                                className="opacity-50"
                            />

                            {/* Active Load Bar with Tech Shape */}
                            <Bar
                                dataKey="load"
                                shape={<TechBar />}
                                fill="url(#techGradient)"
                                filter="url(#shadow)"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="url(#techGradient)" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
