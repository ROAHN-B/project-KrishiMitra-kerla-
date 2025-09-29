"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage, Language } from "@/contexts/language-context";
import { useAdvisory } from "@/contexts/AdvisoryContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

// UI Components
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatHistorySidebar } from "@/app/chatbot/ChatHistorySidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Send, 
  Bot, 
  User, 
  Paperclip, 
  Mic, 
  X, 
  LoaderCircle, 
  Sparkles, 
  Languages, 
  Menu,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- FIX FOR TYPESCRIPT ERROR ----------
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
// ------------------------------------------

// ---------- ERROR BOUNDARY ----------
class ChatbotErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex bg-background text-foreground items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Chatbot Error</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {this.state.error?.message || 'Unable to load chat interface'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Chat
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---------- TYPES ----------
type Message = {
  role: "user" | "bot";
  text: string;
  html?: string;
  image?: string;
  suggestions?: string[];
  timestamp?: number;
};

type Chat = {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
};

type ChatHistory = {
  [id: string]: Chat;
};

// ---------- HELPER FUNCTIONS ----------
const fileToBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => { 
    const reader = new FileReader(); 
    reader.readAsDataURL(file); 
    reader.onload = () => resolve((reader.result as string).split(",")[1]); 
    reader.onerror = reject; 
  });

const mdToHtml = (md: string): string => 
  md.replace(/^## (.*$)/gim, "<h2 class='font-bold text-lg mt-4 mb-2 text-foreground'>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold text-foreground'>$1</strong>")
    .replace(/^[\*\-] (.*$)/gim, "<li class='ml-4 my-1 list-disc'>$1</li>")
    .replace(/\n/g, "<br />");

// ---------- SAFE TRANSLATION HELPER ----------
const getSafeTranslation = (translations: any, path: string, fallback: any = '') => {
  try {
    const keys = path.split('.');
    let result = translations;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return fallback;
      }
    }
    
    return result || fallback;
  } catch (error) {
    console.warn(`Translation missing: ${path}`, error);
    return fallback;
  }
};

// ---------- MULTILINGUAL MESSAGE GENERATORS ----------
const getMultilingualMessages = (lang: Language) => {
  const messages: Record<Language, { welcome: string; suggestions: string[] }> = {
    en: {
      welcome: "🌾 Welcome to Krishi-Mitra! I'm your AI agricultural assistant. How can I help you today?",
      suggestions: [
        "🌱 What crops are suitable for my region?",
        "🔍 Help me identify this plant disease",
        "📅 When should I plant rice?",
        "💰 What are the current market prices?"
      ]
    },
    hi: {
      welcome: "🌾 कृषिमित्र में आपका स्वागत है! मैं आपका AI कृषि सहायक हूं। मैं आज आपकी कैसे मदद कर सकता हूं?",
      suggestions: [
        "🌱 मेरे क्षेत्र के लिए कौी फसलें उपयुक्त हैं?",
        "🔍 इस पौधे की बीमारी की पहचान करने में मेरी सहायता करें",
        "📅 मुझे चावल कब लगाना चाहिए?",
        "💰 वर्तमान बाजार भाव क्या हैं?"
      ]
    },
    mr: {
      welcome: "🌾 कृषीमित्रमध्ये आपले स्वागत आहे! मी तुमचा AI शेती सहाय्यक आहे. मी आज तुमची कशी मदत करू शकतो?",
      suggestions: [
        "🌱 माझ्या भागासाठी कोणते पीक उपयुक्त आहे?",
        "🔍 या वनस्पती रोगाची ओळख पटवण्यात माझी मदत करा",
        "📅 मला तांदूळ कधी लावावा?",
        "💰 सध्याचे बाजार भाव काय आहेत?"
      ]
    },
    pa: {
      welcome: "🌾 ਕ੍ਰਿਸ਼ੀਮਿੱਤਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ! ਮੈਂ ਤੁਹਾਡਾ AI ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਅੱਜ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
      suggestions: [
        "🌱 ਮੇਰੇ ਖੇਤਰ ਲਈ ਕਿਹੜੀਆਂ ਫਸਲਾਂ ਢੁੱਕਵੀਆਂ ਹਨ?",
        "🔍 ਮੈਨੂੰ ਇਸ ਪੌਦੇ ਦੀ ਬਿਮਾਰੀ ਦੀ ਪਛਾਣ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰੋ",
        "📅 ਮੈਨੂੰ ਚਾਵਲ ਕਦੋਂ ਲਗਾਉਣੇ ਚਾਹੀਦੇ ਹਨ?",
        "💰 ਮੌਜੂਦਾ ਬਾਜ਼ਾਰ ਭਾਅ ਕੀ ਹਨ?"
      ]
    },
    kn: {
      welcome: "🌾 ಕೃಷಿಮಿತ್ರಕ್ಕೆ ಸುಸ್ವಾಗತ! ನಾನು ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕನಾಗಿದ್ದೇನೆ. ನಾನು ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      suggestions: [
        "🌱 ನನ್ನ ಪ್ರದೇಶಕ್ಕೆ ಯಾವ ಬೆಳೆಗಳು ಯೋಗ್ಯವಾಗಿವೆ?",
        "🔍 ಈ ಸಸ್ಯದ ರೋಗವನ್ನು ಗುರುತಿಸಲು ನನಗೆ ಸಹಾಯ ಮಾಡಿ",
        "📅 ನಾನು ಅಕ್ಕಿಯನ್ನು ಯಾವಾಗ ನಾಟು ಮಾಡಬೇಕು?",
        "💰 ಪ್ರಸ್ತುತ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು ಏನು?"
      ]
    },
    ta: {
      welcome: "🌾 கிருஷிமித்ராவுக்கு வரவேற்கிறேன்! நான் உங்கள் AI விவசாய உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
      suggestions: [
        "🌱 என் பகுதிக்கு எந்த பயிர்கள் ஏற்றவை?",
        "🔍 இந்த தாவர நோயை அடையாளம் காண எனக்கு உதவுங்கள்",
        "📅 எனக்கு அரிசி எப்போது நட வேண்டும்?",
        "💰 தற்போதைய சந்தை விலைகள் என்ன?"
      ]
    },
    ml: {
      welcome: "🌾 കൃഷിമിത്രയിലേക്ക് സ്വാഗതം! ഞാൻ നിങ്ങളുടെ AI കാർഷിക സഹായിയാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?",
      suggestions: [
        "🌱 എൻ്റെ പ്രദേശത്തിന് അനുയോജ്യമായ വിളകൾ ഏതാണ്?",
        "🔍 ഈ സസ്യരോഗം തിരിച്ചറിയാൻ എന്നെ സഹായിക്കൂ",
        "📅 ഞാൻ എപ്പോഴാണ് അരി നടേണ്ടത്?",
        "💰 നിലവിലെ വിപണി വിലകൾ എന്തൊക്കെയാണ്?"
      ]
    }
  };
  
  return messages[lang] || messages.en;
};

// ---------- SPEAKER COMPONENT ----------
function Speaker({ text, lang }: { text: string; lang: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const checkSupport = () => {
      const supported = 'speechSynthesis' in window;
      setIsSupported(supported);
    };
    
    checkSupport();
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    try {
      const cleanText = text.replace(/<[^>]*>/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const voices = speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang.startsWith(lang)) || 
                      voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || lang;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      speechSynthesis.speak(utterance);
      setSpeaking(true);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setSpeaking(false);
    }
  }, [text, lang, isSupported, speaking]);

  if (!isSupported) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" 
      onClick={toggle}
      title="Listen to response"
    >
      {speaking ? <X size={16} /> : <Sparkles size={16} className="text-primary" />}
    </Button>
  );
}

// ---------- SUGGESTION BUTTONS ----------
function SuggestionButtons({ suggestions, onSuggestionClick }: { suggestions: string[]; onSuggestionClick: (s: string) => void }) {
  return (
    <div className="w-full mt-3 space-y-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="flex items-center gap-2 text-sm bg-card border border-border text-foreground px-4 py-2 rounded-full hover:bg-muted transition-colors shadow-sm w-max"
        >
          <Sparkles size={16} className="flex-shrink-0 text-primary" />
          <span>{suggestion}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- VOICE RECOGNITION HOOK ----------
function useVoiceRecognition(lang: Language, onTranscript: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError("Speech recognition not available.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      const langCode = lang === 'hi' ? 'hi-IN' : 
                       lang === 'mr' ? 'mr-IN' :
                       lang === 'pa' ? 'pa-IN' :
                       lang === 'kn' ? 'kn-IN' :
                       lang === 'ta' ? 'ta-IN' :
                       lang === 'ml' ? 'ml-IN' : 'en-US';
      
      recognition.lang = langCode;
      recognition.interimResults = false;
      recognition.continuous = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (error) {
      console.error('Speech recognition setup error:', error);
      setError("Failed to start voice recognition. Please try again.");
      setIsListening(false);
    }
  }, [lang, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, error, startListening, stopListening };
}

// ---------- MAIN COMPONENT ----------
function ChatbotContent() {
  const { translations: t, currentLang, setCurrentLang } = useLanguage();
  const { latestSoilReport, setEscalatedQuestion } = useAdvisory();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY_CHATBOT;

  const { isListening, error: voiceError, startListening, stopListening } = useVoiceRecognition(
    currentLang,
    (transcript) => {
      setInput(prev => (prev ? prev + " " : "") + transcript);
    }
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNewChat = useCallback(() => {
    const multilingualMessages = getMultilingualMessages(currentLang);
    
    const newChatId = Date.now().toString();
    const initialMessage: Message = {
      role: 'bot',
      text: multilingualMessages.welcome,
      html: `<strong>${multilingualMessages.welcome}</strong>`,
      suggestions: multilingualMessages.suggestions,
      timestamp: Date.now()
    };
    
    const newChat: Chat = {
      id: newChatId,
      title: getSafeTranslation(t, 'chatbotUI.newChat', 'New Chat'),
      timestamp: Date.now(),
      messages: [initialMessage],
    };
    
    setChatHistory(prev => ({ ...prev, [newChatId]: newChat }));
    setActiveChatId(newChatId);
    setMessages([initialMessage]);
    setIsSheetOpen(false);
  }, [currentLang, t]);

  useEffect(() => {
    if (!isMounted) return;
    
    try {
      const savedHistory = localStorage.getItem("krishi-mitra-conversations");
      const lastActiveId = localStorage.getItem("krishi-mitra-active-chat-id");
      
      let history: ChatHistory = {};
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (typeof parsed === 'object' && parsed !== null) {
            history = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse chat history');
        }
      }
      
      setChatHistory(history);
      
      if (lastActiveId && history[lastActiveId]) {
        setActiveChatId(lastActiveId);
        setMessages(history[lastActiveId].messages);
      } else {
        handleNewChat();
      }
    } catch (error) {
      console.error('Initialization error:', error);
      handleNewChat();
    }
  }, [isMounted, currentLang, handleNewChat]);

  useEffect(() => {
    if (!isMounted || Object.keys(chatHistory).length === 0) return;
    
    try {
      localStorage.setItem("krishi-mitra-conversations", JSON.stringify(chatHistory));
      if (activeChatId) {
        localStorage.setItem("krishi-mitra-active-chat-id", activeChatId);
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [chatHistory, activeChatId, isMounted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      setChatHistory(prev => ({
        ...prev,
        [activeChatId]: {
          ...prev[activeChatId],
          messages: messages,
          timestamp: Date.now(),
        },
      }));
    }
  }, [messages, activeChatId]);


  const sendMessageToGemini = useCallback(async (message: string, image: File | null = null) => {
    if (!GEMINI_API_KEY || !activeChatId) return;
    setIsLoading(true);

    const { data: resolvedAnswer } = await supabase
        .from('escalated_questions')
        .select('answer')
        .textSearch('title', message, { type: 'websearch' })
        .eq('status', 'resolved')
        .limit(1)
        .single();

    if (resolvedAnswer?.answer) {
        const expertResponse = `An expert has provided an answer for a similar question: "${resolvedAnswer.answer}"`;
        setMessages(p => [...p, { role: "bot", text: expertResponse, html: mdToHtml(expertResponse) }]);
        setIsLoading(false);
        return;
    }

    const languageMap: Record<Language, string> = { en: "English", hi: "Hindi", mr: "Marathi", pa: "Punjabi", kn: "Kannada", ta: "Tamil", ml: "Malayalam" };
    const languageName = languageMap[currentLang];
    const isFirstUserMessage = messages.length === 1 && chatHistory[activeChatId]?.title.includes("New Chat");
    const titleInstruction = isFirstUserMessage ? "After your response, on a new line, provide a short, 3-5 word title for this conversation prefixed with `Title: `." : "";
    
    let soilDataContext = "";
    if (latestSoilReport) {
      const reportDate = new Date(latestSoilReport.timestamp).toLocaleDateString();
      const reportEntries = Object.entries(latestSoilReport)
        .filter(([key, value]) => key !== 'timestamp' && value !== undefined && value !== null && !isNaN(Number(value)))
        .map(([key, value]) => `  - ${key.toUpperCase()}: ${value}`)
        .join("\n");

      soilDataContext = `
---
IMPORTANT CONTEXT: SOIL HEALTH REPORT
This is the user's soil health data from a report analyzed on ${reportDate}. You MUST use this information to answer any relevant questions about their soil, crops, or fertilizers. Do not ask for this information again.
Soil Data:
${reportEntries}
---
`;
    }

    const STRICT_SYSTEM_PROMPT = `You are Krishi-Mitra, an expert Indian agricultural assistant. You have access to the user's soil health data provided below if available.
${soilDataContext}
You MUST reply in ${languageName}, using simple words. Provide short, practical, and low-cost advice.
${titleInstruction}`;
    
    let userParts: any[] = [{ text: `${message || "Please analyze the image."}` }];
    if (image) {
        try {
            const base64Image = await fileToBase64(image);
            userParts.push({ inline_data: { mime_type: image.type, data: base64Image } });
        } catch (error) {
            console.error("Error converting file to base64:", error);
            setMessages(p => [...p, { role: "bot", text: "⚠️ Error processing the image file.", html: "⚠️ Error processing the image file." }]);
            setIsLoading(false);
            return;
        }
    }
    
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ 
                contents: [
                    { role: "user", parts: [{ text: STRICT_SYSTEM_PROMPT }] }, 
                    { role: "model", parts: [{ text: "Ok, I am Krishi-Mitra. I will help." }] }, 
                    ...messages.map((m) => ({ role: m.role === "bot" ? "model" : "user", parts: [{ text: m.text }] })), 
                    { role: "user", parts: userParts }, 
                ], 
            }), 
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        
        const data = await res.json();
        let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const aiResponse = JSON.parse(raw.replace(/```json\n?/, "").replace(/```$/, "").trim());
        const titleMatch = raw.match(/Title: (.*)/);

        if (titleMatch?.[1] && activeChatId) {
            const newTitle = titleMatch[1].trim();
            setChatHistory(prev => ({ ...prev, [activeChatId]: { ...prev[activeChatId], title: newTitle } }));
        }
        
        if (aiResponse.is_complex) {
            setMessages(p => [...p, { role: "bot", text: aiResponse.response_text, html: mdToHtml(aiResponse.response_text) }]);
            setEscalatedQuestion({ title: aiResponse.question_summary, details: message });
            toast.info("This question seems complex. Redirecting you to an expert...", { duration: 3000 });
            setTimeout(() => {
                router.push('/community');
            }, 3000);
        } else {
            setMessages(p => [...p, { role: "bot", text: aiResponse.response_text, html: mdToHtml(aiResponse.response_text) }]);
        }
    } catch (err: any) {
        setMessages(p => [...p, { role: "bot", text: `⚠️ Error: ${err.message}`, html: `⚠️ Error: ${err.message}` }]);
    } finally {
        setIsLoading(false);
    }
  }, [activeChatId, chatHistory, currentLang, messages, GEMINI_API_KEY, latestSoilReport, router, setEscalatedQuestion]);

  const handleSelectChat = useCallback((id: string) => {
    if (id === activeChatId) {
      setIsSheetOpen(false);
      return;
    }
    
    if (chatHistory[id]) {
      setActiveChatId(id);
      setMessages(chatHistory[id].messages);
      setIsSheetOpen(false);
    }
  }, [activeChatId, chatHistory]);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSpeechError('Please select a valid image file.');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setSpeechError('Image size must be less than 10MB.');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSpeechError(null);
    }
  }, []);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    setSpeechError(null);
    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    if (voiceError) {
      setSpeechError(voiceError);
    }
  }, [voiceError]);

  const handleSend = useCallback(() => {
    if (!t || (input.trim() === "" && !imageFile)) return;
    
    const userMsg: Message = {
      role: "user",
      text: input.trim(),
      image: imagePreview || undefined,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    sendMessageToGemini(input.trim(), imageFile);
    setInput("");
    handleRemoveImage();
  }, [input, imageFile, imagePreview, handleRemoveImage, sendMessageToGemini, t]);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 z-50 flex bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Krishi-Mitra Chat...</p>
        </div>
      </div>
    );
  }

  const currentChatTitle = activeChatId && chatHistory[activeChatId] 
    ? chatHistory[activeChatId].title 
    : "Chat Bot";

  const placeholderText = getSafeTranslation(t, 'chatbotUI.placeholder', 'Ask a farming question...');

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex md:w-72 lg:w-80"> 
        <ChatHistorySidebar 
          chatHistory={Object.values(chatHistory)} 
          activeChatId={activeChatId} 
          onNewChat={handleNewChat} 
          onSelectChat={handleSelectChat} 
        /> 
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-md flex-shrink-0">
          <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <ChatHistorySidebar 
                  chatHistory={Object.values(chatHistory)} 
                  activeChatId={activeChatId} 
                  onNewChat={handleNewChat} 
                  onSelectChat={handleSelectChat} 
                />
              </SheetContent>
            </Sheet>

            <div className="flex flex-col items-center">
              <h1 className="text-lg font-bold text-foreground truncate max-w-[150px] sm:max-w-xs">
                {currentChatTitle}
              </h1>
              <p className="text-xs text-primary font-medium">Online</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["en", "hi", "mr", "pa", "kn", "ta", "ml"].map(lang => (
                  <DropdownMenuItem key={lang} onSelect={() => setCurrentLang(lang as Language)}>
                    {lang === "en" ? "English" : 
                     lang === "hi" ? "हिंदी" :
                     lang === "mr" ? "मराठी" :
                     lang === "pa" ? "ਪੰਜਾਬੀ" :
                     lang === "kn" ? "ಕನ್ನಡ" :
                     lang === "ta" ? "தமிழ்" : "മലയാളം"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6 container mx-auto max-w-4xl">
            {messages.map((message, index) => (
              <div key={index} className={cn(
                "flex items-start gap-3 w-full", 
                message.role === "user" ? "justify-end" : "justify-start"
              )}>
                {message.role === "bot" && (
                  <Avatar className="h-8 w-8 bg-primary/20 flex-shrink-0">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="w-full">
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm inline-block", 
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-none float-right" 
                      : "bg-card border rounded-bl-none text-foreground"
                  )}>
                    {message.image && (
                      <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-full" />
                    )}
                    <div dangerouslySetInnerHTML={{ __html: message.html || message.text }} />
                  </div>
                  
                  {message.role === "bot" && (
                    <>
                      <div className="flex items-center gap-1 mt-1">
                        <Speaker text={message.text} lang={currentLang} />
                      </div>
                      {message.suggestions?.length ? (
                        <SuggestionButtons 
                          suggestions={message.suggestions} 
                          onSuggestionClick={(suggestion) => {
                            const userMsg: Message = {
                              role: "user",
                              text: suggestion,
                              timestamp: Date.now()
                            };
                            setMessages(prev => [...prev, userMsg]);
                            sendMessageToGemini(suggestion, null);
                          }} 
                        />
                      ) : null}
                    </>
                  )}
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-primary/20">
                  <AvatarFallback className="bg-transparent">
                    <Bot className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl p-3 text-sm rounded-bl-none shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="animate-spin h-4 w-4 text-primary" />
                    <span>{getSafeTranslation(t, 'chatbotUI.thinking', 'Thinking...')}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Footer */}
        <footer className="border-t border-border bg-card/80 backdrop-blur-md flex-shrink-0">
          <div className="container mx-auto max-w-4xl p-2 sm:p-4">
            {imagePreview && (
              <div className="relative w-fit mb-2 ml-2">
                <img src={imagePreview} alt="Selected preview" className="h-20 w-20 object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {speechError && (
              <p className="text-xs text-destructive mb-2 ml-4">{speechError}</p>
            )}

            <div className="relative flex w-full items-center rounded-full border bg-background focus-within:ring-1 focus-within:ring-primary transition-all">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
              />

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 ml-1 rounded-full flex-shrink-0" 
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />

              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-9 w-9 rounded-full flex-shrink-0", 
                  isListening && "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                )} 
                onClick={handleMicClick}
                title="Voice input"
                disabled={isLoading}
              >
                <Mic className="h-5 w-5" />
              </Button>

              <Button 
                type="submit" 
                size="icon" 
                className="h-9 w-9 mr-1 rounded-full flex-shrink-0" 
                onClick={handleSend} 
                disabled={isLoading || (input.trim() === "" && !imageFile)}
                title="Send"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ---------- EXPORT WITH ERROR BOUNDARY ----------
export default function ChatbotPage() {
  return (
    <ChatbotErrorBoundary>
      <ChatbotContent />
    </ChatbotErrorBoundary>
  );
}