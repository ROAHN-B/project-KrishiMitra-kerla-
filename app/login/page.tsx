// app/login/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Globe, Leaf, LogIn, UserPlus, AlertCircle, Shield } from "lucide-react"
import { useAuth, User } from "@/contexts/auth-context"
import { useLanguage, type Language } from "@/contexts/language-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface LocationData {
  [key: string]: {
    name: string
    districts: {
      [key: string]: string[]
    }
  }
}

const locationData: LocationData = {
  MH: {
    name: "Maharashtra",
    districts: {
      Mumbai: ["Mumbai City", "Mumbai Suburban", "Thane", "Kalyan"],
      Pune: ["Pune City", "Pimpri-Chinchwad", "Baramati", "Maval"],
      Nashik: ["Nashik City", "Malegaon", "Sinnar", "Dindori"],
      Aurangabad: ["Aurangabad City", "Jalna", "Beed", "Osmanabad"],
      Solapur: ["Solapur City", "Pandharpur", "Barshi", "Karmala"],
      Nagpur: ["Nagpur City", "Wardha", "Bhandara", "Gondia"],
    },
  },
  KA: {
    name: "Karnataka",
    districts: {
      Bangalore: ["Bangalore Urban", "Bangalore Rural", "Ramanagara", "Tumkur"],
      Mysore: ["Mysore City", "Mandya", "Hassan", "Kodagu"],
      Hubli: ["Hubli-Dharwad", "Gadag", "Haveri", "Uttara Kannada"],
      Mangalore: ["Dakshina Kannada", "Udupu", "Kasaragod", "Chikmagalur"],
      Belgaum: ["Belgaum City", "Bagalkot", "Bijapur", "Gulbarga"],
    },
  },
  PB: {
    name: "Punjab",
    districts: {
      Ludhiana: ["Ludhiana City", "Khanna", "Samrala", "Payal"],
      Amritsar: ["Amritsar City", "Tarn Taran", "Gurdaspur", "Pathankot"],
      Jalandhar: ["Jalandhar City", "Kapurthala", "Hoshiarpur", "Nawanshahr"],
      Patiala: ["Patiala City", "Rajpura", "Samana", "Patran"],
      Bathinda: ["Bathinda City", "Mansa", "Sardulgarh", "Rampura"],
    },
  },
  UP: {
    name: "Uttar Pradesh",
    districts: {
      Lucknow: ["Lucknow City", "Barabanki", "Sitapur", "Hardoi"],
      Kanpur: ["Kanpur City", "Kanpur Dehat", "Unnao", "Fatehpur"],
      Agra: ["Agra City", "Mathura", "Firozabad", "Mainpuri"],
      Varanasi: ["Varanasi City", "Jaunpur", "Ghazipur", "Ballia"],
      Allahabad: ["Prayagraj", "Kaushambi", "Pratapgarh", "Sultanpur"],
      Meerut: ["Meerut City", "Ghaziabad", "Gautam Buddha Nagar", "Bulandshahr"],
    },
  },
  KL: {
    name: "Kerala",
    districts: {
      Thiruvananthapuram: ["Thiruvananthapuram", "Neyyattinkara", "Nedumangad", "Varkala"],
      Kollam: ["Kollam", "Punalur", "Kottarakkara", "Karunagappally"],
      Alappuzha: ["Alappuzha", "Chengannur", "Kayamkulam", "Mavelikkara"],
      Idukki: ["Idukki", "Thodupuzha", "Devikulam", "Peerumade"],
      Ernakulam: ["Kochi", "Aluva", "Muvattupuzha", "Kothamangalam"],
      Thrissur: ["Thrissur", "Irinjalakuda", "Chalakudy", "Kodungallur"],
      Palakkad: ["Palakkad", "Ottapalam", "Chittur", "Mannarkkad"],
      Malappuram: ["Malappuram", "Tirur", "Perinthalmanna", "Ponnani"],
      Kozhikode: ["Kozhikode", "Vatakara", "Koyilandy", "Thamarassery"],
      Wayanad: ["Kalpetta", "Sulthan Bathery", "Mananthavady"],
      Kannur: ["Kannur", "Thalassery", "Taliparamba", "Payyanur"],
      Kasaragod: ["Kasaragod", "Kanhangad", "Nileshwaram", "Vellarikundu"],
      Pathanamthitta: ["Pathanamthitta", "Thiruvalla", "Adoor", "Ranni"],
      Kottayam: ["Kottayam", "Changanassery", "Pala", "Vaikom"],
    },
  },
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<"user" | "agri-officer">("user");
  const [officerCode, setOfficerCode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedTaluka, setSelectedTaluka] = useState("")
  const [selectedVillage, setSelectedVillage] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { login, register, isAuthenticated, user } = useAuth()
  const { translations: t, setCurrentLang } = useLanguage()

  useEffect(() => {
    if (isAuthenticated && user) {
        if (user.role === 'agri-officer') {
            router.push("/agri-officer-dashboard");
        } else {
            router.push("/dashboard");
        }
    }
  }, [isAuthenticated, user, router])

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 10) {
      setMobileNumber(value)
      setError(null)
    }
  }

  const validateMobileNumber = (num: string) => /^\d{10}$/.test(num)

  const mapDbUserToAppUser = (dbUser: any): User => ({
    id: dbUser.id,
    mobileNumber: dbUser.mobile_number,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    state: dbUser.state,
    district: dbUser.district,
    taluka: dbUser.taluka,
    village: dbUser.village,
    language: dbUser.language,
    role: dbUser.role,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateMobileNumber(mobileNumber)) {
      setError(t.invalidMobile || "Please enter a valid 10-digit mobile number")
      return
    }
    if (role === 'agri-officer' && !officerCode) {
        setError("Please enter your officer code.");
        return;
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            mobileNumber, 
            role, 
            officerCode: role === 'agri-officer' ? officerCode : undefined,
            isSignUp: false 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed.');

      login(mapDbUserToAppUser(data));
      toast.success(t.loginSuccess || "Login successful!")
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName || !lastName || !mobileNumber || !selectedState || !selectedDistrict || !selectedTaluka || !selectedVillage || !selectedLanguage) {
      setError(t.fillAllFields || "Please fill all fields")
      return
    }

    if (!validateMobileNumber(mobileNumber)) {
      setError(t.invalidMobile || "Please enter a valid 10-digit mobile number")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber, firstName, lastName,
          state: locationData[selectedState].name,
          district: selectedDistrict,
          taluka: selectedTaluka,
          village: selectedVillage,
          language: selectedLanguage,
          isSignUp: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign up failed.');
      
      setCurrentLang(selectedLanguage);
      register(mapDbUserToAppUser(data));
      toast.success(t.signupSuccess || "Registration successful!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }
  
  const getDistricts = () => {
      return selectedState ? Object.keys(locationData[selectedState].districts) : []
  }

  const getTalukas = () => {
      return selectedState && selectedDistrict ? locationData[selectedState].districts[selectedDistrict] : []
  }

  const getVillages = () => {
      // For simplicity, talukas are treated as villages in this demo
      return selectedState && selectedDistrict && selectedTaluka ? [selectedTaluka] : []
  }

  const languageOptions: { value: Language; label: string }[] = [
      { value: "en", label: "English" },
      { value: "hi", label: "हिंदी" },
      { value: "mr", label: "मराठी" },
      { value: "pa", label: "ਪੰਜਾਬੀ" },
      { value: "kn", label: "ಕನ್ನಡ" },
      { value: "ta", label: "தமிழ்" },
      { value: "ml", label: "മലയാളം" },
  ]


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 container-padding py-8">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-card/80 backdrop-blur-md animate-fade-in">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-lg">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl md:text-4xl font-bold gradient-text text-balance">
              {isSignUp ? t.signup : t.login}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground text-pretty max-w-md mx-auto">
              {t.loginDescription || "Please provide your details to get started with smart farming."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-0 bg-destructive/10">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {isSignUp ? (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-semibold">
                    {t.firstName}
                  </Label>
                  <Input
                    id="firstName"
                    placeholder={t.firstName}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-semibold">
                    {t.lastName}
                  </Label>
                  <Input
                    id="lastName"
                    placeholder={t.lastName}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="mobileNumber" className="text-base font-semibold">
                  {t.mobileNumber}
                </Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={handleMobileNumberChange}
                  maxLength={10}
                  className="h-12 text-base rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="language" className="text-base font-semibold">
                  {t.selectLanguage}
                </Label>
                <Select value={selectedLanguage} onValueChange={(value: Language) => setSelectedLanguage(value)}>
                  <SelectTrigger className="h-12 text-base rounded-xl border-2">
                    <Globe className="h-5 w-5 mr-3 text-muted-foreground" />
                    <SelectValue placeholder={t.selectLanguage} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-base py-3">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="state" className="text-base font-semibold">
                    {t.selectState}
                  </Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="h-12 text-base rounded-xl border-2">
                      <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                      <SelectValue placeholder={t.selectState} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(locationData).map(([code, data]) => (
                        <SelectItem key={code} value={code} className="text-base py-3">
                          {data.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="district" className="text-base font-semibold">
                    {t.selectDistrict}
                  </Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedState}>
                    <SelectTrigger className="h-12 text-base rounded-xl border-2">
                      <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                      <SelectValue placeholder={t.selectDistrict} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {getDistricts().map((district) => (
                        <SelectItem key={district} value={district} className="text-base py-3">
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="taluka" className="text-base font-semibold">
                    {t.selectTaluka}
                  </Label>
                  <Select value={selectedTaluka} onValueChange={setSelectedTaluka} disabled={!selectedDistrict}>
                    <SelectTrigger className="h-12 text-base rounded-xl border-2">
                      <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                      <SelectValue placeholder={t.selectTaluka} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {getTalukas().map((taluka) => (
                        <SelectItem key={taluka} value={taluka} className="text-base py-3">
                          {taluka}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="village" className="text-base font-semibold">
                    {t.selectVillage}
                  </Label>
                  <Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedTaluka}>
                    <SelectTrigger className="h-12 text-base rounded-xl border-2">
                      <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                      <SelectValue placeholder={t.selectVillage} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {getVillages().map((village) => (
                        <SelectItem key={village} value={village} className="text-base py-3">
                          {village}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : <UserPlus className="mr-3 h-5 w-5" />}
                {isLoading ? "Registering..." : t.register}
              </Button>

              <div className="text-center pt-4">
                <p className="text-base text-muted-foreground">
                  {t.alreadyHaveAccount}{" "}
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(false)}
                    className="p-0 h-auto text-base font-semibold text-primary hover:text-primary/80"
                  >
                    {t.login}
                  </Button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Role</Label>
                <RadioGroup defaultValue="user" value={role} onValueChange={(value: "user" | "agri-officer") => setRole(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user">Farmer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agri-officer" id="agri-officer" />
                    <Label htmlFor="agri-officer">Agri-Officer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="mobileNumber" className="text-base font-semibold">
                  {t.mobileNumber}
                </Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="1234567890"
                  value={mobileNumber}
                  onChange={handleMobileNumberChange}
                  maxLength={10}
                  className="h-12 text-base rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>

              {role === 'agri-officer' && (
                <div className="space-y-3">
                  <Label htmlFor="officerCode" className="text-base font-semibold">Officer Code</Label>
                  <Input 
                    id="officerCode" 
                    placeholder="Enter your unique officer code" 
                    value={officerCode} 
                    onChange={(e) => setOfficerCode(e.target.value)} 
                    className="h-12 text-base rounded-xl border-2 focus:border-primary"
                    required 
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : <LogIn className="mr-3 h-5 w-5" />}
                {isLoading ? "Logging in..." : t.continue}
              </Button>

              <div className="text-center pt-4">
                <p className="text-base text-muted-foreground">
                  {t.dontHaveAccount}{" "}
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(true)}
                    className="p-0 h-auto text-base font-semibold text-primary hover:text-primary/80"
                  >
                    {t.signup}
                  </Button>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}