"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { LanguageSelector } from "@/components/language-selector"
import { BottomNavigation } from "@/components/bottom-navigation" // Import BottomNavigation
import { NotificationBell } from "@/components/notification-bell" // Import NotificationBell
import { useLanguage } from "@/contexts/language-context" // Import useLanguage
import { useAuth } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Question {
  id: number
  title: string
  category: string
  author: string
  time: string
  likes: number
  replies: number
  status: "answered" | "pending"
  preview: string
}

interface Expert {
  name: string
  specialty: string
  rating: number
  answers: number
  avatar: string
}

interface AgriOfficer {
  name: string
  district: string
  contact: string
}

interface CommunityLanguageContent {
  title: string
  askExperts: string
  recentQuestions: string
  topExperts: string
  categories: string[]
  searchPlaceholder: string
  askQuestion: string
  questionTitle: string
  questionDetails: string
  selectCategory: string
  submitQuestion: string
  back: string
  answered: string
  pending: string
  likes: string
  replies: string
  questions: Question[]
  experts: Expert[]
  escalate: string
  escalateTitle: string
  escalateDescription: string
  escalateTo: string
  escalateMessage: string
  cancel: string
  confirm: string
}

// Dummy data for agricultural officers
const agriOfficers: AgriOfficer[] = [
  { name: "Sunita Sharma", district: "Pune", contact: "s.sharma@agri.gov.in" },
  { name: "Rajesh Kumar", district: "Mumbai", contact: "r.kumar@agri.gov.in" },
  { name: "Amit Singh", district: "Ludhiana", contact: "a.singh@agri.gov.in" },
  { name: "Priya Patel", district: "Bangalore", contact: "p.patel@agri.gov.in" },
  { name: "Kavita Nair", district: "Thiruvananthapuram", contact: "k.nair@agri.gov.in" },
];

// Language support for community
const communityLanguages: Record<string, CommunityLanguageContent> = {
  en: {
    title: "Farmer Community",
    askExperts: "Ask Experts",
    recentQuestions: "Recent Questions",
    topExperts: "Top Experts",
    categories: [
      "Crop Diseases",
      "Pest Control",
      "Fertilizers",
      "Weather",
      "Market Prices",
      "Irrigation",
      "Seeds",
      "General",
    ],
    searchPlaceholder: "Search questions...",
    askQuestion: "Ask a Question",
    questionTitle: "Question Title",
    questionDetails: "Question Details",
    selectCategory: "Select Category",
    submitQuestion: "Submit Question",
    back: "Back",
    answered: "Answered",
    pending: "Pending",
    likes: "likes",
    replies: "replies",
    questions: [
      {
        id: 1,
        title: "White spots on cotton leaves - what could this be?",
        category: "Crop Diseases",
        author: "Ramesh Kumar",
        time: "2 hours ago",
        likes: 12,
        replies: 5,
        status: "answered",
        preview: "I noticed white spots appearing on my cotton plants. The spots are small and scattered...",
      },
      {
        id: 2,
        title: "Best time for wheat sowing in Punjab?",
        category: "Seeds",
        author: "Gurpreet Singh",
        time: "5 hours ago",
        likes: 8,
        replies: 3,
        status: "answered",
        preview: "When is the optimal time to sow wheat in Punjab region? Weather has been unpredictable...",
      },
      {
        id: 3,
        title: "Organic fertilizer recommendations for tomatoes",
        category: "Fertilizers",
        author: "Priya Sharma",
        time: "1 day ago",
        likes: 15,
        replies: 7,
        status: "answered",
        preview: "Looking for organic fertilizer options for my tomato crop. Want to avoid chemicals...",
      },
    ],
    experts: [
      {
        name: "Dr. Suresh Patel",
        specialty: "Plant Pathology",
        rating: 4.9,
        answers: 234,
        avatar: "SP",
      },
      {
        name: "Prof. Meera Joshi",
        specialty: "Soil Science",
        rating: 4.8,
        answers: 189,
        avatar: "MJ",
      },
      {
        name: "Rajesh Verma",
        specialty: "Pest Management",
        rating: 4.7,
        answers: 156,
        avatar: "RV",
      },
    ],
    escalate: "Escalate to Agri Officer",
    escalateTitle: "Confirm Escalation",
    escalateDescription: "This will send your question to the local agricultural officer for your district. Do you want to proceed?",
    escalateTo: "Escalate to:",
    escalateMessage: "Message:",
    cancel: "Cancel",
    confirm: "Confirm & Send",
  },
  hi: {
    title: "किसान समुदाय",
    askExperts: "विशेषज्ञों से पूछें",
    recentQuestions: "हाल के प्रश्न",
    topExperts: "शीर्ष विशेषज्ञ",
    categories: ["फसल रोग", "कीट नियंत्रण", "उर्वरक", "मौसम", "बाजार भाव", "सिंचाई", "बीज", "सामान्य"],
    searchPlaceholder: "प्रश्न खोजें...",
    askQuestion: "एक प्रश्न पूछें",
    questionTitle: "प्रश्न शीर्षक",
    questionDetails: "प्रश्न विवरण",
    selectCategory: "श्रेणी चुनें",
    submitQuestion: "प्रश्न सबमिट करें",
    back: "वापस",
    answered: "उत्तर दिया गया",
    pending: "लंबित",
    likes: "पसंद",
    replies: "उत्तर",
    questions: [
      {
        id: 1,
        title: "कपास के पत्तों पर सफेद धब्बे - यह क्या हो सकता है?",
        category: "फसल रोग",
        author: "रमेश कुमार",
        time: "2 घंटे पहले",
        likes: 12,
        replies: 5,
        status: "answered",
        preview: "मैंने अपने कपास के पौधों पर सफेद धब्बे देखे। धब्बे छोटे और बिखरे हुए हैं...",
      },
      {
        id: 2,
        title: "पंजाब में गेहूं बोने का सबसे अच्छा समय?",
        category: "बीज",
        author: "गुरप्रीत सिंह",
        time: "5 घंटे पहले",
        likes: 8,
        replies: 3,
        status: "answered",
        preview: "पंजाब क्षेत्र में गेहूं बोने का सबसे अच्छा समय कब है? मौसम अप्रत्याशित रहा है...",
      },
      {
        id: 3,
        title: "टमाटर के लिए जैविक उर्वरक की सिफारिशें",
        category: "उर्वरक",
        author: "प्रिया शर्मा",
        time: "1 दिन पहले",
        likes: 15,
        replies: 7,
        status: "answered",
        preview: "अपने टमाटर की फसल के लिए जैविक उर्वरक विकल्पों की तलाश में हूं। रसायनों से बचना चाहता हूं...",
      },
    ],
    experts: [
      {
        name: "डॉ. सुरेश पटेल",
        specialty: "पादप रोग विज्ञान",
        rating: 4.9,
        answers: 234,
        avatar: "एसपी",
      },
      {
        name: "प्रो. मीरा जोशी",
        specialty: "मृदा विज्ञान",
        rating: 4.8,
        answers: 189,
        avatar: "एमजे",
      },
      {
        name: "राजेश वर्मा",
        specialty: "कीट प्रबंधन",
        rating: 4.7,
        answers: 156,
        avatar: "आरवी",
      },
    ],
    escalate: "कृषि अधिकारी को भेजें",
    escalateTitle: "अग्रेषण की पुष्टि करें",
    escalateDescription: "यह आपके प्रश्न को आपके जिले के स्थानीय कृषि अधिकारी को भेज देगा। क्या आप आगे बढ़ना चाहते हैं?",
    escalateTo: "को भेजें:",
    escalateMessage: "संदेश:",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें और भेजें",
  },
  // Add other languages here...
  ml: {
    title: "കർഷക സമൂഹം",
    askExperts: "വിദഗ്ധരോട് ചോദിക്കുക",
    recentQuestions: "സമീപകാല ചോദ്യങ്ങൾ",
    topExperts: "മുൻനിര വിദഗ്ദ്ധർ",
    categories: [
      "വിള രോഗങ്ങൾ",
      "കീട നിയന്ത്രണം",
      "വളങ്ങൾ",
      "കാലാവസ്ഥ",
      "വിപണി വിലകൾ",
      "ജലസേചനം",
      "വിത്തുകൾ",
      "പൊതുവായത്",
    ],
    searchPlaceholder: "ചോദ്യങ്ങൾ തിരയുക...",
    askQuestion: "ഒരു ചോദ്യം ചോദിക്കുക",
    questionTitle: "ചോദ്യത്തിൻ്റെ തലക്കെട്ട്",
    questionDetails: "ചോദ്യത്തിൻ്റെ വിശദാംശങ്ങൾ",
    selectCategory: "വിഭാഗം തിരഞ്ഞെടുക്കുക",
    submitQuestion: "ചോദ്യം സമർപ്പിക്കുക",
    back: "പുറകോട്ട്",
    answered: "ഉത്തരം നൽകി",
    pending: "തീരുമാനമായിട്ടില്ല",
    likes: "ലൈക്കുകൾ",
    replies: "മറുപടികൾ",
    questions: [
      {
        id: 1,
        title: "പരുത്തി ഇലകളിലെ വെളുത്ത പാടുകൾ - ഇതെന്തായിരിക്കാം?",
        category: "വിള രോഗങ്ങൾ",
        author: "രമേഷ് കുമാർ",
        time: "2 മണിക്കൂർ മുൻപ്",
        likes: 12,
        replies: 5,
        status: "answered",
        preview: "എൻ്റെ പരുത്തി ചെടികളിൽ വെളുത്ത പാടുകൾ പ്രത്യക്ഷപ്പെടുന്നത് ഞാൻ ശ്രദ്ധിച്ചു. പാടുകൾ ചെറുതും ചിതറിയതുമാണ്...",
      },
      {
        id: 2,
        title: "പഞ്ചാബിൽ ഗോതമ്പ് വിതയ്ക്കാൻ ഏറ്റവും അനുയോജ്യമായ സമയം?",
        category: "വിത്തുകൾ",
        author: "ഗുർപ്രീത് സിംഗ്",
        time: "5 മണിക്കൂർ മുൻപ്",
        likes: 8,
        replies: 3,
        status: "answered",
        preview: "പഞ്ചാബ് മേഖലയിൽ ഗോതമ്പ് വിതയ്ക്കാൻ ഏറ്റവും അനുയോജ്യമായ സമയം എപ്പോഴാണ്? കാലാവസ്ഥ പ്രവചനാതീതമായിരുന്നു...",
      },
      {
        id: 3,
        title: "തക്കാളിക്ക് ജൈവ വളം ശുപാർശകൾ",
        category: "വളങ്ങൾ",
        author: "പ്രിയ ശർമ്മ",
        time: "1 ദിവസം മുൻപ്",
        likes: 15,
        replies: 7,
        status: "answered",
        preview: "എൻ്റെ തക്കാളി കൃഷിക്ക് ജൈവവള ഓപ്ഷനുകൾക്കായി തിരയുന്നു. രാസവസ്തുക്കൾ ഒഴിവാക്കാൻ ആഗ്രഹിക്കുന്നു...",
      },
    ],
    experts: [
      {
        name: "ഡോ. സുരേഷ് പട്ടേൽ",
        specialty: "സസ്യ രോഗശാസ്ത്രം",
        rating: 4.9,
        answers: 234,
        avatar: "SP",
      },
      {
        name: "പ്രൊഫ. മീര ജോഷി",
        specialty: "മണ്ണ് ശാസ്ത്രം",
        rating: 4.8,
        answers: 189,
        avatar: "MJ",
      },
      {
        name: "രാജേഷ് വർമ്മ",
        specialty: "കീട നിയന്ത്രണം",
        rating: 4.7,
        answers: 156,
        avatar: "RV",
      },
    ],
    escalate: "കൃഷി ഓഫീസർക്ക് കൈമാറുക",
    escalateTitle: "കൈമാറ്റം സ്ഥിരീകരിക്കുക",
    escalateDescription: "ഇത് നിങ്ങളുടെ ചോദ്യം നിങ്ങളുടെ ജില്ലയിലെ പ്രാദേശിക കൃഷി ഓഫീസർക്ക് അയയ്ക്കും. നിങ്ങൾ തുടരാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?",
    escalateTo: "ഇയാൾക്ക് കൈമാറുക:",
    escalateMessage: "സന്ദേശം:",
    cancel: "റദ്ദാക്കുക",
    confirm: "സ്ഥിരീകരിച്ച് അയയ്ക്കുക",
  },
}


export default function CommunityPage() {
  const { currentLang } = useLanguage()
  const { user } = useAuth()
  const [showAskForm, setShowAskForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [questionTitle, setQuestionTitle] = useState("")
  const [questionDetails, setQuestionDetails] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(communityLanguages[currentLang]?.categories[0] || "")
  const [showEscalationModal, setShowEscalationModal] = useState(false)
  const [escalationDetails, setEscalationDetails] = useState<{ officer: AgriOfficer, message: string } | null>(null)
  const router = useRouter()
  const t = communityLanguages[currentLang] || communityLanguages.en // Fallback to English

  const handleEscalate = () => {
    if (!user) {
      // Handle case where user is not logged in
      return;
    }
    const officer = agriOfficers.find(o => o.district === user.district) || agriOfficers[0];
    const message = `Question from ${user.firstName} ${user.lastName} (${user.village}, ${user.district}):\n\nTitle: ${questionTitle}\n\nDetails: ${questionDetails}\n\nCategory: ${selectedCategory}`;
    setEscalationDetails({ officer, message });
    setShowEscalationModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {" "}
      {/* Added pb-20 for bottom navigation */}
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">{t.title}</span>
            </div>
          </div>

          {/* Language Selector and Notification Bell */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSelector />
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search and Ask Question */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowAskForm(!showAskForm)} className="whitespace-nowrap">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t.askQuestion}
          </Button>
        </div>

        {/* Ask Question Form */}
        {showAskForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t.askQuestion}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t.questionTitle}</label>
                <Input placeholder="Enter your question title..." className="mt-1" value={questionTitle} onChange={(e) => setQuestionTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">{t.questionDetails}</label>
                <Textarea placeholder="Describe your question in detail..." className="mt-1" rows={4} value={questionDetails} onChange={(e) => setQuestionDetails(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">{t.selectCategory}</label>
                <select className="w-full mt-1 p-2 border border-border rounded-md bg-background" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {t.categories.map((category: string, index: number) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  {t.submitQuestion}
                </Button>
                <Button variant="outline" onClick={() => setShowAskForm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleEscalate}>
                  <Shield className="mr-2 h-4 w-4" />
                  {t.escalate}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t.recentQuestions}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {t.questions.map((question: Question) => (
                  <div key={question.id} className="border-b border-border pb-4 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {question.category}
                          </Badge>
                          <Badge
                            variant={question.status === "answered" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {question.status === "answered" ? t.answered : t.pending}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{question.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{question.preview}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {question.author}
                          </span>
                          <span>{question.time}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {question.likes} {t.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {question.replies} {t.replies}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Experts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.topExperts}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {t.experts.map((expert: Expert, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">{expert.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{expert.name}</div>
                      <div className="text-xs text-muted-foreground">{expert.specialty}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {expert.rating}
                        </div>
                        <span className="text-muted-foreground">{expert.answers} answers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t.categories}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {t.categories.map((category: string, index: number) => (
                    <Button key={index} variant="ghost" size="sm" className="w-full justify-start text-xs">
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNavigation /> {/* Add BottomNavigation here */}

      {/* Escalation Confirmation Modal */}
      <AlertDialog open={showEscalationModal} onOpenChange={setShowEscalationModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.escalateTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.escalateDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {escalationDetails && (
            <div className="text-sm">
              <p><strong>{t.escalateTo}</strong> {escalationDetails.officer.name} ({escalationDetails.officer.district})</p>
              <p className="mt-2"><strong>{t.escalateMessage}</strong></p>
              <blockquote className="mt-1 border-l-2 pl-6 italic">{escalationDetails.message}</blockquote>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              // In a real app, this would trigger an API call to send the message
              setShowEscalationModal(false);
            }}>{t.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}