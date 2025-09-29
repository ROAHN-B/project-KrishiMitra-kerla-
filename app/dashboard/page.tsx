"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  TrendingUp,
  Leaf,
  MicIcon,
  Volume2,
  Stethoscope,
  MessageCircle,
  Sprout,
  BarChart3,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  ShieldCheck,
  History,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { useAdvisory } from "@/contexts/AdvisoryContext"
import { LanguageSelector } from "@/components/language-selector"
import { BottomNavigation } from "@/components/bottom-navigation"
import { NotificationBell } from "@/components/notification-bell"
import { HamburgerMenu } from "@/components/hamburger-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

interface VoiceMessage {
  role: "user" | "bot";
  text: string;
  html?: string;
}

interface VoiceChat {
  id: string;
  title: string;
  timestamp: number;
  messages: VoiceMessage[];
}

interface WeatherData {
    temp: string;
    condition: string;
    humidity: string;
    rainfall: string;
}

export default function Dashboard() {
  const { translations: t, currentLang } = useLanguage()
  const { user } = useAuth()
  const { advisories, latestSoilReport, setEscalatedQuestion } = useAdvisory()
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing">("idle")
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const [voiceHistory, setVoiceHistory] = useState<VoiceChat[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    const savedHistory = localStorage.getItem("krishi-mitra-voice-history");
    if (savedHistory) {
      try {
        setVoiceHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse voice history from localStorage", e);
      }
    }

    const fetchWeatherData = () => {
      const API_KEY = process.env.NEXT_PUBLIC_WEATHER_KEY;
      if (!API_KEY) {
        setWeatherError("Weather API key not configured.");
        setLoadingWeather(false);
        return;
      }

      if (!navigator.geolocation) {
        setWeatherError("Geolocation is not supported by your browser.");
        setLoadingWeather(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Using the standard /weather endpoint which is available on free plans
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

          try {
            const response = await fetch(url);
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to fetch weather data.");
            }
            const data = await response.json();

            setWeather({
              temp: `${Math.round(data.main.temp)}°C`,
              condition: data.weather[0].main,
              humidity: `${data.main.humidity}%`,
              rainfall: data.rain ? `${data.rain["1h"]}mm` : "0mm",
            });

          } catch (error: any) {
            setWeatherError(error.message);
          } finally {
            setLoadingWeather(false);
          }
        },
        (error) => {
          setWeatherError(`Location Error: ${error.message}. Please enable permissions.`);
          setLoadingWeather(false);
        }
      );
    };

    fetchWeatherData();
  }, []);

  useEffect(() => {
    localStorage.setItem("krishi-mitra-voice-history", JSON.stringify(voiceHistory));
  }, [voiceHistory]);

  const mdToHtml = (md: string): string =>
  md.replace(/^## (.*$)/gim, "<h2 class='font-bold text-lg mt-4 mb-2 text-foreground'>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold text-foreground'>$1</strong>")
    .replace(/^[\*\-] (.*$)/gim, "<li class='ml-4 my-1 list-disc'>$1</li>")
    .replace(/\n/g, "<br />");

  // ... (KRISHI_INTRO, handleVoiceActivation, askGemini, speak, getVoiceStatusText, handleNavigation functions remain the same) ...
  const KRISHI_INTRO: Record<string, string> = {
    en: "Hi, I am Krishi Mitra, your agriculture assistant. How can I help you today?",
    hi: "नमस्ते, मैं कृषि मित्र हूँ, आपका कृषि सहायक। मैं आपकी कैसे मदद कर सकता हूँ?",
    mr: "नमस्कार, मी कृषी मित्र आहे, तुमचा कृषी सहाय्यक। मी तुम्हाला कशात मदत करू शकतो?",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ ਹਾਂ, ਤੁਹਾਡਾ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    kn: "ನಮಸ್ಕಾರ, ನಾನು ಕೃಷಿ ಮಿತ್ರ, ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ। ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    ta: "வணக்கம், நான் கிருஷி மித்ரா, உங்கள் விவசாய உதவியாளர்। நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    ml: "നമസ്കാരം, ഞാൻ കൃഷി മിത്ര, നിങ്ങളുടെ കാർഷിക സഹായി. ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?",
  };
  
  const handleVoiceActivation = async () => {
    if (voiceStatus !== "idle") return;

    window.speechSynthesis.cancel();
    setVoiceStatus("listening");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      setVoiceStatus("idle");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = currentLang === "en" ? "en-US" : currentLang + "-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let heard = false;
    recognition.onresult = (e: any) => {
      heard = true;
      const transcript = e.results[0][0].transcript.trim();
      recognition.stop();
      askGemini(transcript);
    };

    recognition.onerror = () => {
      if (!heard) setVoiceStatus("idle");
    };

    recognition.onend = () => {
      if (!heard) {
        const intro = KRISHI_INTRO[currentLang] || KRISHI_INTRO.en;
        speak(intro);
      }
    };

    recognition.start();
    setTimeout(() => {
      if (!heard) recognition.stop();
    }, 6_000);
  };

  async function askGemini(q: string) {
    setVoiceStatus("processing");

    const { data: resolvedAnswer } = await supabase
        .from('escalated_questions')
        .select('answer')
        .textSearch('title', q, { type: 'websearch' })
        .eq('status', 'resolved')
        .limit(1)
        .single();

    if (resolvedAnswer && resolvedAnswer.answer) {
        const expertResponse = `An expert has previously answered a similar question: ${resolvedAnswer.answer}`;
        speak(expertResponse);
        setVoiceHistory(prev => [{ id: Date.now().toString(), title: q, timestamp: Date.now(), messages: [{ role: "user", text: q }, { role: "bot", text: expertResponse, html: mdToHtml(expertResponse) }] }, ...prev]);
        return;
    }
    
    const system = `You are Krishi Mitra, an expert Indian agriculture assistant.
Analyze the user's question for complexity. A question is "complex" or "critical" if it involves severe symptoms (e.g., "my entire crop is dying"), potential high financial loss, requires detailed local knowledge you might not have, or is very vague.
You MUST reply ONLY with a valid JSON object in the following format. Do not include any other text, explanations, or markdown formatting.

{
  "is_complex": <boolean>,
  "response_text": "<A direct, helpful answer if the question is NOT complex. If it IS complex, this text should inform the user they are being redirected to an expert.>",
  "question_summary": "<A concise summary of the user's original question. This will be used to pre-fill the form for the expert.>"
}

The user is speaking ${currentLang}. Your response_text and question_summary MUST be in ${currentLang}.

User's question: "${q}"
`
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: system }),
      });
      if (!res.ok) throw new Error("Network error");

      const rawJson = await res.text();
      const aiResponse = JSON.parse(rawJson.replace(/```json\n?/, "").replace(/```$/, "").trim());
      
      const newChat: VoiceChat = {
        id: Date.now().toString(),
        title: q,
        timestamp: Date.now(),
        messages: [
          { role: "user", text: q },
          { role: "bot", text: aiResponse.response_text, html: mdToHtml(aiResponse.response_text) },
        ],
      };
      setVoiceHistory(prev => [newChat, ...prev]);

      speak(aiResponse.response_text);

      if (aiResponse.is_complex) {
        setEscalatedQuestion({ title: aiResponse.question_summary, details: q });
        toast.info("This question requires expert help. Redirecting you to our community...", {
            duration: 3000,
        });
        setTimeout(() => {
          router.push('/community');
        }, 3000);
      }

    } catch(err) {
      console.error(err);
      const fallback: Record<string, string> = {
        en: "Please check your connection or ask again.",
        hi: "कृपया अपना कनेक्शन जांचें या फिर से पूछें।",
        mr: "कृपया आपला कनेक्शन तपासा किंवा पुन्हा विचारा।",
        pa: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ ਜਾਂ ਦੁਬਾਰਾ ਪੁੱਛੋ।",
        kn: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಮತ್ತೆ ಕೇಳಿ।",
        ta: "உங்கள் இணைப்பை சரிபார்க்கவும் அல்லது மீண்டும் கேளுங்கள்।",
        ml: "ദയവായി നിങ്ങളുടെ കണക്ഷൻ പരിശോധിക്കുക അല്ലെങ്കിൽ വീണ്ടും ചോദിക്കുക.",
      };
      speak(fallback[currentLang] || fallback.en);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setVoiceStatus("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const voiceMap: Record<string, string> = {
      en: "en-US", hi: "hi-IN", mr: "mr-IN", pa: "pa-IN", kn: "kn-IN", ta: "ta-IN", ml: "ml-IN",
    };
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voiceMap[currentLang] || "hi-IN";
    utter.rate = 0.9;
    utter.onend = () => setVoiceStatus("idle");
    window.speechSynthesis.speak(utter);
  }

  const getVoiceStatusText = () => {
    switch (voiceStatus) {
      case "listening": return t.dashboard.voiceListening;
      case "processing": return t.dashboard.voiceProcessing;
      default: return t.dashboard.voicePrompt;
    }
  };

  const handleNavigation = (path: string) => router.push(path);

  const renderWeatherContent = () => {
    if (loadingWeather) {
      return (
        <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
            <div className="text-base text-muted-foreground font-medium">Loading...</div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-3 bg-card/50 rounded-2xl">
                    <Droplets className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">{t.profile.fields.humidity || "Humidity"}</div>
                    <div className="font-bold text-foreground">--</div>
                </div>
                <div className="text-center p-3 bg-card/50 rounded-2xl">
                    <Wind className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">{t.profile.fields.rainfall || "Rainfall"}</div>
                    <div className="font-bold text-foreground">--</div>
                </div>
            </div>
        </div>
      );
    }

    if (weatherError) {
      return (
        <div className="text-center text-destructive p-4">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-semibold">Could not load weather</p>
          <p className="text-xs">{weatherError}</p>
        </div>
      );
    }

    if (weather) {
      return (
        <>
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">{weather.temp}</div>
            <div className="text-base text-muted-foreground font-medium">{weather.condition}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-card/50 rounded-2xl">
              <Droplets className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">{t.profile.fields.humidity || "Humidity"}</div>
              <div className="font-bold text-foreground">{weather.humidity}</div>
            </div>
            <div className="text-center p-3 bg-card/50 rounded-2xl">
              <Wind className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">{t.profile.fields.rainfall || "Rainfall"}</div>
              <div className="font-bold text-foreground">{weather.rainfall}</div>
            </div>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto container-padding py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <HamburgerMenu />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Leaf className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold gradient-text">{t.dashboard.title}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <NotificationBell />
                <LanguageSelector />
            </div>
        </div>
      </header>

      <div className={`section-padding ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
        <div className="container mx-auto container-padding space-y-8">
          <div className="text-center space-y-4 animate-slide-up">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text text-balance">
              {t.dashboard.welcome}, {user?.firstName || "Farmer"}!
            </h1>
            <p className="text-lg text-muted-foreground">{t.dashboard.welcomeSubtitle}</p>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 border-0 shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] animate-scale-in"
            style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-8 md:p-12 text-center">
              <div className="space-y-6">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-lg">
                  {voiceStatus === "listening" ? (
                    <div className="relative">
                      <MicIcon className="h-12 w-12 text-primary-foreground animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-4 border-primary-foreground/30 animate-ping" />
                    </div>
                  ) : voiceStatus === "processing" ? (
                    <Volume2 className="h-12 w-12 text-primary-foreground animate-bounce" />
                  ) : (
                    <MicIcon className="h-12 w-12 text-primary-foreground" />
                  )}
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
                    {getVoiceStatusText()}
                  </h2>
                  <div className="flex justify-center items-center gap-4">
                    <Button
                      size="lg"
                      onClick={handleVoiceActivation}
                      disabled={voiceStatus !== "idle"}
                      className="text-lg px-10 py-6 h-auto rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <Mic className="mr-3 h-6 w-6" />
                      {t.dashboard.speakNow}
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          size="lg"
                          className="text-lg px-8 py-6 h-auto rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                          <History className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full max-w-md p-0">
                        <SheetHeader className="p-4 border-b">
                          <SheetTitle>{t.dashboard.conversationHistory}</SheetTitle>
                        </SheetHeader>
                        <div className="h-full overflow-y-auto p-4 space-y-4">
                          {voiceHistory.length > 0 ? voiceHistory.map(chat => (
                            <Card key={chat.id} className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{chat.title}</h4>
                                  <p className="text-xs text-muted-foreground">{new Date(chat.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                              {chat.messages.map((msg, index) => (
                                <div key={index} className="mb-2 text-left">
                                  <p className={`font-semibold text-sm ${msg.role === 'user' ? 'text-primary' : 'text-foreground'}`}>
                                    {msg.role === 'user' ? 'You:' : 'Krishi-Mitra:'}
                                  </p>
                                  <div className="flex items-start justify-between">
                                    <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: msg.html || msg.text }}></div>
                                    {msg.role === 'bot' && (
                                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => speak(msg.text)}>
                                        <Volume2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </Card>
                          )) : (
                            <p className="text-sm text-muted-foreground text-center mt-8">No history yet.</p>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">{t.dashboard.quickActions}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickActionCard icon={<Stethoscope />} title={t.dashboard.actions.cropDiagnosis} description={t.dashboard.actions.cropDiagnosisDesc} onClick={() => handleNavigation("/diagnose")} />
              <QuickActionCard icon={<BarChart3 />} title={t.dashboard.actions.marketPrices} description={t.dashboard.actions.marketPricesDesc} onClick={() => handleNavigation("/market")} />
              <QuickActionCard icon={<CloudRain />} title={t.dashboard.actions.weather} description={t.dashboard.actions.weatherDesc} onClick={() => handleNavigation("/weather")} />
              <QuickActionCard icon={<MessageCircle />} title={t.dashboard.actions.community} description={t.dashboard.actions.communityDesc} onClick={() => handleNavigation("/community")} />
              
              <QuickActionCard 
                icon={<ShieldCheck />} 
                title={t.dashboard.actions.governmentSchemes} 
                description={t.dashboard.actions.governmentSchemesDesc} 
                onClick={() => handleNavigation("/schemes")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Sprout className="h-5 w-5 text-primary" />
                  </div>
                  {t.dashboard.recentAdvisories}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {advisories.map((advisory, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl border-l-4 border-primary space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-balance">{advisory.title}</h4>
                      <Badge variant={advisory.priority === "high" ? "destructive" : "secondary"} className="text-xs px-2 py-1">{advisory.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground text-pretty">{advisory.description}</p>
                    <p className="text-xs text-muted-foreground font-medium">{advisory.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card/50 to-accent/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Sun className="h-5 w-5 text-accent-foreground" />
                  </div>
                  {t.dashboard.todayWeather}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderWeatherContent()}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  {t.dashboard.marketPrices}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {t.dashboard.prices.map((price, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-secondary/30 to-transparent rounded-2xl">
                    <div>
                      <div className="font-semibold text-base text-foreground">{price.crop}</div>
                      <div className="text-sm text-muted-foreground font-medium">{price.price}</div>
                    </div>
                    <Badge variant={price.change.startsWith("+") ? "default" : "destructive"} className="text-sm px-3 py-1 font-semibold">{price.change}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

function QuickActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-card/50 backdrop-blur-sm" onClick={onClick}>
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
          {React.cloneElement(icon as React.ReactElement, { className: "h-8 w-8 text-primary-foreground" })}
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-base text-balance">{title}</h3>
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}