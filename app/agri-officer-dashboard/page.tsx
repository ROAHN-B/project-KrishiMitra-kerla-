// app/agri-officer-dashboard/page.tsx
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, CheckCircle, Clock, LogOut } from "lucide-react"; // Import LogOut
import { useRouter } from "next/navigation";
import { useAdvisory } from "@/contexts/AdvisoryContext";

interface EscalatedQuestion {
  id: string;
  title: string;
  details: string;
  category: string;
  status: string;
  user_id: string;
}

export default function AgriOfficerDashboard() {
  const { user, logout } = useAuth(); // Get logout function
  const { setEscalatedQuestion } = useAdvisory();
  const [questions, setQuestions] = useState<EscalatedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEscalatedQuestions = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("escalated_questions")
        .select("*")
        .eq("officer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching escalated questions:", error);
      } else {
        setQuestions(data as EscalatedQuestion[]);
      }
      setLoading(false);
    };

    fetchEscalatedQuestions();
  }, [user]);

  const handleResolveClick = (question: EscalatedQuestion) => {
    setEscalatedQuestion({ title: question.title, details: question.details, id: question.id });
    router.push("/community");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Agri-Officer Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2"/>
          Logout
        </Button>
      </header>
      <main className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Escalated Questions for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p>No escalated questions at the moment.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{q.title}</h3>
                      <p className="text-sm text-gray-600">{q.details}</p>
                      <Badge variant={q.status === 'pending' ? 'destructive' : 'default'}>
                        {q.status === 'pending' ? <Clock className="w-4 h-4 mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                        {q.status}
                      </Badge>
                    </div>
                    {q.status === 'pending' && (
                      <Button onClick={() => handleResolveClick(q)}>
                        <MessageSquare className="w-4 h-4 mr-2"/>
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}