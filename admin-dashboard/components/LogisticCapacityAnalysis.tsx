'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';

// Custom shape for the bars to give them an organic, rounded top look
const OrganicBar = (props: any) => {
    const { fill, x, y, width, height } = props;

    // Calculate a soft curve for the top
    const radius = width / 2;

    return (
        <motion.path
            d={`M${x},${y + height} L${x},${y + radius} Q${x},${y} ${x + radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`}
            stroke="none"
            fill={fill}
            initial={{ d: `M${x},${y + height} L${x},${y + height} Q${x},${y + height} ${x + radius},${y + height} Q${x + width},${y + height} ${x + width},${y + height} L${x + width},${y + height} Z` }}
            animate={{ d: `M${x},${y + height} L${x},${y + radius} Q${x},${y} ${x + radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z` }}
            transition={{ duration: 0.8, ease: "circOut", delay: props.index * 0.1 }}
        />
    );
};

// Custom artistic background resembling a stylized mountain/forest silhouette
const NatureBackground = () => (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full h-1/2" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#2E5B43" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <path fill="#4A3728" fillOpacity="0.5" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,234.7C672,256,768,288,864,298.7C960,309,1056,299,1152,277.3C1248,256,1344,224,1392,208L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
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
            <NatureBackground />

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
                            <span className="w-3 h-3 rounded-full bg-primary/80"></span>
                            <span>Kullanılan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#D4AF37]/50"></span>
                            <span>Müsait</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 h-[320px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={40}>
                        <defs>
                            <linearGradient id="natureGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2E5B43" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#F5F5DC" stopOpacity={0.4} />
                            </linearGradient>
                            <filter id="shadow" height="200%">
                                <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#2E5B43" floodOpacity="0.2" />
                            </filter>
                        </defs>

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4A3728', fontSize: 12, fontWeight: 500 }}
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
                                        <div className="glass-card px-4 py-2 rounded-xl border border-white/20 shadow-lg">
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
                            fill="#F5F5DC"
                            radius={[20, 20, 20, 20]}
                            isAnimationActive={false} // Static background
                            className="opacity-50"
                        />

                        {/* Active Load Bar with Art Shape */}
                        <Bar
                            dataKey="load"
                            shape={<OrganicBar />}
                            fill="url(#natureGradient)"
                            filter="url(#shadow)"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="url(#natureGradient)" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
