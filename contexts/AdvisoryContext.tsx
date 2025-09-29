// roahn-b/final-project/Final-project-master/contexts/AdvisoryContext.tsx

"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "@/contexts/language-context";

// Define the shape of a single notification
interface Notification {
  id: number;
  title: string;
  description: string;
  type: "weather" | "market"; // The allowed types
  read: boolean;
}

// Define the shape of soil report data
interface SoilReport {
  ph: number;
  ec: number;
  oc: number;
  n: number;
  p: number;
  k: number;
  s: number;
  ca: number;
  mg: number;
  zn: number;
  b: number;
  fe: number;
  mn: number;
  cu: number;
  timestamp: number;
}

interface EscalatedQuestion {
    id?: string;
    title: string;
    details: string;
}

// Define the shape of your context data
interface AdvisoryContextType {
  advisories: { title: string; description: string; priority: string; time: string }[];
  addAdvisory: (newAdvisory: { title: string; description: string; priority: string; time: string }) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  latestSoilReport: SoilReport | null;
  setLatestSoilReport: (report: SoilReport | null) => void;
  escalatedQuestion: EscalatedQuestion | null;
  setEscalatedQuestion: (question: EscalatedQuestion | null) => void;
}

const AdvisoryContext = createContext<AdvisoryContextType | undefined>(undefined);

export function AdvisoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { translations } = useLanguage();
  const [advisories, setAdvisories] = useState([
    { title: "Pest Infestation Alert", description: "Monitor your crops for whitefly and aphids.", priority: "high", time: "2 hours ago" },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestSoilReport, setLatestSoilReport] = useState<SoilReport | null>(null);
  const [escalatedQuestion, setEscalatedQuestion] = useState<EscalatedQuestion | null>(null);

  const addAdvisory = (newAdvisory: { title: string; description: string; priority: string; time: string }) => {
    setAdvisories(prevAdvisories => [newAdvisory, ...prevAdvisories]);
  };

  const addNotification = (notification: Omit<Notification, "id" | "read">) => {
    setNotifications(prev => [{ ...notification, id: Date.now(), read: false }, ...prev]);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  useEffect(() => {
    async function fetchLatestSoilReport() {
      if (!user?.id) {
        setLatestSoilReport(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('soil_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) 
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching latest soil report:", error);
        return;
      }

      if (data) {
        const mappedReport: SoilReport = {
          ph: data.ph, ec: data.ec, oc: data.oc, n: data.n, p: data.p, k: data.k,
          s: data.s, ca: data.ca, mg: data.mg, zn: data.zn, b: data.b, fe: data.fe,
          mn: data.mn, cu: data.cu,
          timestamp: new Date(data.created_at || Date.now()).getTime(),
        };
        setLatestSoilReport(mappedReport);
      } else {
         setLatestSoilReport(null);
      }
    }

    fetchLatestSoilReport();
  }, [user]);


  useEffect(() => {
    const getSampleNotifications = () => {
      // FIX: Added a guard clause to ensure translations are loaded
      if (!translations || !translations.notifications?.highWinds) {
        return [];
      }
      return [
          { title: translations.notifications.highWinds.title, description: translations.notifications.highWinds.description, type: "weather" },
          { title: translations.notifications.cottonPrices.title, description: translations.notifications.cottonPrices.description, type: "market" },
          { title: translations.notifications.rainfallWarning.title, description: translations.notifications.rainfallWarning.description, type: "weather" },
          { title: translations.notifications.onionMarket.title, description: translations.notifications.onionMarket.description, type: "market" },
      ] as Omit<Notification, "id" | "read">[];
    };
  
    const interval = setInterval(() => {
      const sampleNotifications = getSampleNotifications();
      if (sampleNotifications.length > 0) {
        const newNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
        addNotification(newNotification);
      }
    }, 200000); // 2 minutes
  
    return () => clearInterval(interval);
  }, [translations]);


  return (
    <AdvisoryContext.Provider value={{ advisories, addAdvisory, notifications, addNotification, markAsRead, markAllAsRead, latestSoilReport, setLatestSoilReport, escalatedQuestion, setEscalatedQuestion }}>
      {children}
    </AdvisoryContext.Provider>
  );
}

export function useAdvisory() {
  const context = useContext(AdvisoryContext);
  if (context === undefined) {
    throw new Error("useAdvisory must be used within an AdvisoryProvider");
  }
  return context;
}