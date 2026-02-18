'use client';

import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Check, Inbox } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function NotificationsPopover() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
    const router = useRouter();

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        if (notification.ticketId) {
            router.push(`/dashboard/support/${notification.ticketId}`);
        } else if (notification.conversationId) {
            // Redirect to messages page
            router.push(`/dashboard/messages?userId=${notification.conversationId}`);
        } else if (notification.type === 'legacy_message') {
            router.push('/dashboard/messages');
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h4 className="font-semibold text-sm">Bildirimler</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={markAllAsRead}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 space-y-2">
                            <div className="bg-gray-100 p-3 rounded-full">
                                <Inbox className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">Yeni bildirim yok</p>
                            <p className="text-xs text-gray-400">Şu an için her şey sakin görünüyor.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 ${!notification.read ? 'bg-blue-50/30' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'
                                        }`} />
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(notification.timestamp), {
                                                addSuffix: true,
                                                locale: tr
                                            })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
