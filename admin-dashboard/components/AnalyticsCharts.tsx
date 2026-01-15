'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
    data: {
        shipmentsByDate: Array<{
            date: string;
            total: number;
            delivered: number;
            inTransit: number;
            pending: number;
        }>;
        driverPerformance: Array<{
            name: string;
            completed: number;
            inTransit: number;
            total: number;
        }>;
        statusDistribution: {
            PENDING: number;
            IN_TRANSIT: number;
            DELIVERED: number;
            CANCELLED: number;
        };
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
    const statusData = [
        { name: 'Beklemede', value: data.statusDistribution.PENDING },
        { name: 'Yolda', value: data.statusDistribution.IN_TRANSIT },
        { name: 'Teslim Edildi', value: data.statusDistribution.DELIVERED },
        { name: 'İptal', value: data.statusDistribution.CANCELLED },
    ];

    return (
        <div className="grid gap-6">
            {/* Shipments Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Sevkiyat Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.shipmentsByDate}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#8884d8" name="Toplam" />
                            <Line type="monotone" dataKey="delivered" stroke="#82ca9d" name="Teslim Edildi" />
                            <Line type="monotone" dataKey="inTransit" stroke="#ffc658" name="Yolda" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Driver Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sürücü Performansı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.driverPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="completed" fill="#82ca9d" name="Tamamlanan" />
                                <Bar dataKey="inTransit" fill="#ffc658" name="Yolda" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Durum Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
