'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface DriverLeaderboardProps {
    data: Array<{
        id: string;
        name: string;
        plateNumber: string;
        totalDistance: number;
        averageSpeed: number;
        totalShipments: number;
        completedShipments: number;
        score: number;
    }>;
}

export function DriverLeaderboard({ data }: DriverLeaderboardProps) {
    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 1:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 2:
                return <Award className="h-5 w-5 text-orange-500" />;
            default:
                return <span className="font-bold text-gray-500 w-5 text-center">{index + 1}</span>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sürücü Sıralaması (Skor Bazlı)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-2 pl-2">Sıra</th>
                                <th className="py-2">Sürücü</th>
                                <th className="py-2">Araç</th>
                                <th className="py-2 text-right">Mesafe</th>
                                <th className="py-2 text-right">Teslimat</th>
                                <th className="py-2 text-right">Ort. Hız</th>
                                <th className="py-2 text-right pr-2">Skor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((driver, index) => (
                                <tr key={driver.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3 pl-2">{getRankIcon(index)}</td>
                                    <td className="py-3 font-medium">{driver.name}</td>
                                    <td className="py-3 text-gray-500">{driver.plateNumber}</td>
                                    <td className="py-3 text-right">{driver.totalDistance} km</td>
                                    <td className="py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <span className="text-green-600 font-medium">{driver.completedShipments}</span>
                                            <span className="text-gray-400">/</span>
                                            <span className="text-gray-500">{driver.totalShipments}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">{driver.averageSpeed} km/h</td>
                                    <td className="py-3 text-right pr-2">
                                        <Badge variant="secondary">{driver.score}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
