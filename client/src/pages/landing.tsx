import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Brain, CheckCircle, Sparkles, MessageCircle, Globe, Upload, Download, Star, User } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";

export function Landing() {
  const { t } = useLanguage();
  const [isEuropean, setIsEuropean] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [price, setPrice] = useState('9.97');
  
  // Detect user location for currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const europeanCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
        if (europeanCountries.includes(data.country_code)) {
          setIsEuropean(true);
          setCurrency('€');
          setPrice('8.97');
        }
      } catch (error) {
        console.log('Could not detect location, defaulting to USD');
      }
    };
    
    detectLocation();
  }, []);
  
  const features = [
    {
      icon: PenTool,
      title: t('create'),
      description: t('createDescription'),
      color: "bg-primary",
    },
    {
      icon: Brain,
      title: t('review'),
      description: t('reviewDescription'),
      color: "bg-secondary",
    },
    {
      icon: CheckCircle,
      title: t('assess'),
      description: t('assessDescription'),
      color: "bg-accent",
    },
    {
      icon: MessageCircle,
      title: t('careerMentor'),
      description: t('careerMentorDescription'),
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F08A5D' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='80' cy='20' r='1'/%3E%3Ccircle cx='20' cy='80' r='1'/%3E%3Ccircle cx='80' cy='80' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300/10 rounded-full blur-xl" />
      <div className="absolute bottom-40 left-20 w-40 h-40 bg-primary/3 rounded-full blur-2xl" />
      
      {/* Content */}
      <div className="relative z-10">
      {/* Top Navigation with Language Selector and Login */}
      <div className="w-full py-4 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Sparkles className="text-primary mr-2" size={24} />
            <span className="text-xl font-bold text-gray-900">CareerCopilot</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button 
              size="sm" 
              className="bg-primary hover:bg-orange-600 text-white"
              onClick={() => window.location.href = '/api/login'}
            >
              {t('getStarted')}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">CareerCopilot</h1>
          <h2 className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
            Get Hired, Get Ahead — AI-Powered Help with Resumes, Cover Letters & Career Growth
          </h2>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Demo Video Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Watch CareerCopilot in Action</h2>
            <p className="text-lg text-gray-600">Experience How AI Helps You Build Job-Winning Applications — Fast</p>
          </div>
          
          <Card className="overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <div className="relative w-full h-96 bg-gradient-to-br from-primary/10 to-orange-100 flex items-center justify-center">
                {/* Video placeholder - replace with actual video */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-orange-600 transition-colors">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Demo Video Coming Soon</h3>
                  <p className="text-gray-600">
                    See how CareerCopilot helps users create professional CVs,<br/>
                    get detailed feedback, and chat with our AI career mentor
                  </p>
                </div>
                
                {/* Optional: Add actual video element when ready */}
                {/* 
                <video 
                  className="w-full h-full object-cover" 
                  controls 
                  poster="/path-to-video-thumbnail.jpg"
                >
                  <source src="/path-to-demo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                */}
              </div>
            </CardContent>
          </Card>
          
          {/* Feature highlights below video */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Upload className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">Smart Upload & Analysis</h4>
              <p className="text-sm text-gray-600">Upload your CV and watch AI extract and optimize your profile instantly</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">AI Career Conversations</h4>
              <p className="text-sm text-gray-600">Get personalized career advice through intelligent chat interactions</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">Professional Output</h4>
              <p className="text-sm text-gray-600">Download polished, ATS-friendly documents ready for job applications</p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('pricing')}</h2>
            <p className="text-lg text-gray-600">{t('pricingSubtitle')}</p>
          </div>
          
          <Card className="relative border-2 border-primary shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                {t('mostPopular')}
              </span>
            </div>
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">{t('professionalPlan')}</CardTitle>
              <div className="text-4xl font-bold text-primary mt-4">
                {currency}{price}
                <span className="text-lg text-gray-500 font-normal">/{t('month')}</span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <span>{t('unlimitedAccess')}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="text-blue-500 mr-3" size={20} />
                  <span>{t('multiLanguageSupport')}</span>
                </div>
                <div className="flex items-center">
                  <Upload className="text-purple-500 mr-3" size={20} />
                  <span>{t('unlimitedUploads')}</span>
                </div>
                <div className="flex items-center">
                  <Download className="text-orange-500 mr-3" size={20} />
                  <span>{t('editableOutput')}</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="text-green-500 mr-3" size={20} />
                  <span>{t('unlimitedChatbot')}</span>
                </div>
                <div className="flex items-center">
                  <Star className="text-yellow-500 mr-3" size={20} />
                  <span>{t('matchScoring')}</span>
                </div>
                <div className="flex items-center">
                  <User className="text-indigo-500 mr-3" size={20} />
                  <span>{t('profileManagement')}</span>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-orange-600 text-white py-3"
                onClick={() => window.location.href = '/api/login'}
              >
                {t('startFreeTrial')}
              </Button>
              <p className="text-center text-sm text-gray-500 mt-2">
                {t('noCommitment')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">{t('howItWorks')}</CardTitle>
            <CardDescription className="text-lg">
              {t('howItWorksSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">{t('step1Title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('step1Description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">{t('step2Title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('step2Description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">{t('step3Title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('step3Description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">{t('step4Title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('step4Description')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>AI powered • Secure • Fast • Professional</p>
        </div>
      </div>
      </div>
    </div>
  );
}