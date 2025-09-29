// components/notification-bell.tsx
"use client"

import { useEffect, useState } from "react"
import { Bell, Zap, TrendingUp, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data);
      }
    };

    fetchNotifications();
    
    const channel = supabase.channel('realtime-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, 
      (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      }).subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    };

  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };
  
  const markAllAsRead = async () => {
      await supabase.from("notifications").update({ is_read: true }).eq('user_id', user?.id);
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96 glass-effect border-border shadow-lg rounded-2xl">
        <div className="p-3 flex items-center justify-between">
            <DropdownMenuLabel className="text-base font-semibold text-foreground">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
                <button onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" />
                    Mark all as read
                </button>
            )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} onSelect={() => markAsRead(notification.id)} className={cn("focus:bg-primary/10 rounded-lg m-1",!notification.is_read && "bg-secondary/50")}>
                  <div className="flex items-start gap-3 py-2 px-1 w-full">
                    <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", "bg-blue-100")}>
                      <Bell className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="w-full">
                      <p className="text-sm text-muted-foreground text-pretty">{notification.message}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <p className="p-8 text-sm text-muted-foreground text-center">No new notifications</p>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}