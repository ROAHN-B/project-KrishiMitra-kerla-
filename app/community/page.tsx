"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Users,
  Star,
  Send,
  ArrowLeft,
  Search,
  Filter,
  ThumbsUp,
  MessageSquare,
  User,
  Shield,
  Upload,
  Video,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LanguageSelector } from "@/components/language-selector";
import { BottomNavigation } from "@/components/bottom-navigation";
import { NotificationBell } from "@/components/notification-bell";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useAdvisory } from "@/contexts/AdvisoryContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

// --- TYPE DEFINITIONS ---
interface Question {
  id: number;
  title: string;
  category: string;
  author: string;
  time: string;
  likes: number;
  replies: number;
  status: "answered" | "pending";
  preview: string;
}

interface Expert {
  name: string;
  specialty: string;
  rating: number;
  answers: number;
  avatar: string;
}

// --- DUMMY DATA (Replace with API calls) ---
const dummyData = {
    questions: [
        { id: 1, title: "White spots on cotton leaves - what could this be?", category: "Crop Diseases", author: "Ramesh Kumar", time: "2 hours ago", likes: 12, replies: 5, status: "answered", preview: "I noticed white spots appearing on my cotton plants..." },
        { id: 2, title: "Best time for wheat sowing in Punjab?", category: "Seeds", author: "Gurpreet Singh", time: "5 hours ago", likes: 8, replies: 3, status: "answered", preview: "When is the optimal time to sow wheat in Punjab region?..." },
    ],
    experts: [
        { name: "Dr. Suresh Patel", specialty: "Plant Pathology", rating: 4.9, answers: 234, avatar: "SP" },
        { name: "Prof. Meera Joshi", specialty: "Soil Science", rating: 4.8, answers: 189, avatar: "MJ" },
    ],
    categories: ["Crop Diseases", "Pest Control", "Fertilizers", "Weather", "Market Prices", "Irrigation", "Seeds", "General"]
};


export default function CommunityPage() {
  const { currentLang, translations } = useLanguage();
  const { user } = useAuth();
  const { escalatedQuestion, setEscalatedQuestion } = useAdvisory();
  
  const [showAskForm, setShowAskForm] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDetails, setQuestionDetails] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(dummyData.categories[0]);
  const [questionMedia, setQuestionMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [officerAnswer, setOfficerAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const t = translations.community || {}; // Fallback to empty object to avoid errors

  useEffect(() => {
    // If an officer lands here with an escalated question in context, show the answer form
    if (user?.role === 'agri-officer' && escalatedQuestion) {
      setShowAskForm(true);
    }
  }, [user, escalatedQuestion]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuestionMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEscalateConfirm = async () => {
    if (!user || !questionTitle) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/esclate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: questionTitle,
          details: questionDetails,
          category: selectedCategory,
          userId: user.id,
          district: user.district,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Success!", { description: "Your question has been escalated to an Agri-Officer." });
      setShowAskForm(false);
      setQuestionTitle("");
      setQuestionDetails("");
      setQuestionMedia(null);
      setMediaPreview(null);

    } catch (error: any) {
      toast.error("Escalation Failed", { description: error.message });
    } finally {
      setIsSubmitting(false);
      setShowEscalationModal(false);
    }
  };

  const handleOfficerSubmit = async () => {
    if (!officerAnswer || !escalatedQuestion?.id) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/answer-escalated', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionId: escalatedQuestion.id,
                answer: officerAnswer,
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        toast.success("Answer Submitted!", { description: "The user has been notified." });
        setOfficerAnswer("");
        setEscalatedQuestion(null);
        setShowAskForm(false);
        // Potentially refresh the list of questions or navigate away
        router.push('/agri-officer-dashboard');

    } catch (error: any) {
        toast.error("Submission Failed", { description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  // UI for Officer to answer a question
  const renderOfficerAnswerForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Answer Escalated Question</CardTitle>
        <CardDescription>
            <strong>Question:</strong> {escalatedQuestion?.title} <br/>
            <strong>Details:</strong> {escalatedQuestion?.details}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="officerAnswer">Your Answer</Label>
          <Textarea
            id="officerAnswer"
            placeholder="Provide a detailed and helpful answer..."
            className="mt-1"
            rows={6}
            value={officerAnswer}
            onChange={(e) => setOfficerAnswer(e.target.value)}
          />
        </div>
        <Button onClick={handleOfficerSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Answer
        </Button>
      </CardContent>
    </Card>
  );

  // UI for User to ask a question
  const renderUserAskForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t.askQuestion || "Ask a Question"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="questionTitle">{t.questionTitle || "Question Title"}</Label>
          <Input id="questionTitle" placeholder="e.g., Why are my tomato leaves yellow?" className="mt-1" value={questionTitle} onChange={(e) => setQuestionTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="questionDetails">{t.questionDetails || "Question Details"}</Label>
          <Textarea id="questionDetails" placeholder="Describe your issue in detail..." className="mt-1" rows={4} value={questionDetails} onChange={(e) => setQuestionDetails(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="media-upload">Add Photo/Video</Label>
          <Input id="media-upload" type="file" accept="image/*,video/*" className="mt-1" onChange={handleMediaChange} />
          {mediaPreview && (
            <div className="mt-2">
                {questionMedia?.type.startsWith('image/') ?
                    <Image src={mediaPreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" /> :
                    <video src={mediaPreview} controls width="200" className="rounded-md" />
                }
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="category">{t.selectCategory || "Select Category"}</Label>
          <select id="category" className="w-full mt-1 p-2 border border-border rounded-md bg-background" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {(t.categories || dummyData.categories).map((category: string, index: number) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {t.submitQuestion || "Submit"}
          </Button>
          <Button variant="outline" onClick={() => setShowAskForm(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button variant="destructive" onClick={() => setShowEscalationModal(true)} disabled={!questionTitle}>
            <Shield className="mr-2 h-4 w-4" />
            {t.escalate || "Escalate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold text-foreground">{t.title || "Farmer Community"}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <NotificationBell />
                <LanguageSelector />
            </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {user?.role !== 'agri-officer' && (
             <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t.searchPlaceholder || "Search questions..."} className="pl-10" />
                </div>
                <Button onClick={() => setShowAskForm(!showAskForm)} className="whitespace-nowrap">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t.askQuestion || "Ask a Question"}
                </Button>
            </div>
        )}

        {showAskForm && (
            user?.role === 'agri-officer' && escalatedQuestion ? renderOfficerAnswerForm() : renderUserAskForm()
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />{t.recentQuestions || "Recent Questions"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {(t.questions || dummyData.questions).map((question: Question) => (
                  <div key={question.id} className="border-b border-border pb-4 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">{question.category}</Badge>
                                  <Badge variant={question.status === "answered" ? "default" : "destructive"} className="text-xs">
                                      {question.status === "answered" ? (t.answered || "Answered") : (t.pending || "Pending")}
                                  </Badge>
                              </div>
                              <h3 className="font-semibold text-sm mb-1">{question.title}</h3>
                              <p className="text-xs text-muted-foreground mb-2">{question.preview}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{question.author}</span>
                                  <span>{question.time}</span>
                                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{question.likes} {t.likes || "likes"}</span>
                                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{question.replies} {t.replies || "replies"}</span>
                              </div>
                          </div>
                      </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t.topExperts || "Top Experts"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(t.experts || dummyData.experts).map((expert: Expert, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-sm font-semibold">{expert.avatar}</span></div>
                      <div className="flex-1">
                          <div className="font-medium text-sm">{expert.name}</div>
                          <div className="text-xs text-muted-foreground">{expert.specialty}</div>
                          <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-current" />{expert.rating}</div>
                              <span className="text-muted-foreground">{expert.answers} answers</span>
                          </div>
                      </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />{t.categoriesTitle || "Categories"}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(t.categories || dummyData.categories).map((category: string, index: number) => (
                    <Button key={index} variant="ghost" size="sm" className="w-full justify-start text-xs">{category}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNavigation />

      <AlertDialog open={showEscalationModal} onOpenChange={setShowEscalationModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.escalateTitle || "Confirm Escalation"}</AlertDialogTitle>
            <AlertDialogDescription>{t.escalateDescription || "This will send your question to a local agricultural officer. Proceed?"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEscalateConfirm} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t.confirm || "Confirm & Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
