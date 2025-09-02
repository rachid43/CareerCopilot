import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Brain, CheckCircle, MessageCircle, Globe, Upload, Download, Star, User, Video } from "lucide-react";
import careerCopilotIcon from "@assets/ICON_CareerCopilot_1755719130597.png";
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
        // Use a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const europeanCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
        
        if (data.country_code && europeanCountries.includes(data.country_code)) {
          setIsEuropean(true);
          setCurrency('€');
          setPrice('8.97');
        }
      } catch (error) {
        // Silently default to USD without logging to console to avoid runtime errors
        // Currency detection failed - this is expected in some environments
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
    {
      icon: Video,
      title: t('mockInterview'),
      description: t('mockInterviewDescription'),
      color: "bg-blue-500",
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
            <img 
              src={careerCopilotIcon} 
              alt="CareerCopilot" 
              className="w-10 h-10 mr-3"
            />
            <span className="text-xl font-bold text-gray-900">Career<span className="text-primary">Copilot</span> <span className="text-xs text-gray-500">AI Assistant</span></span>
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
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Career<span className="text-primary">Copilot</span></h1>
          <p className="text-sm text-primary font-semibold mb-2">🤖 {t('appSubtitle')}</p>
          <h2 className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
            {t('landingSubtitle')}
          </h2>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Watch Career<span className="text-primary">Copilot</span> in Action</h2>
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
                    See how Career<span className="text-primary">Copilot</span> helps users create professional CVs,<br/>
                    practice mock interviews, get detailed feedback, and chat with our AI career mentor
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
          <div className="grid md:grid-cols-4 gap-6 mt-8">
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
                <Video className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">Mock Interviews</h4>
              <p className="text-sm text-gray-600">Practice with AI recruiters, record responses, and get detailed feedback scores</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">Professional Output</h4>
              <p className="text-sm text-gray-600">Download polished, ATS-friendly documents ready for job applications</p>
            </div>
          </div>
        </div>

        {/* Mock Interview Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Mock Interviews</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Practice interviews with realistic AI recruiters, record your responses, and receive comprehensive feedback 
              with detailed scoring to improve your interview performance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Card className="border-2 border-blue-200">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Video className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Realistic Interview Experience</h4>
                        <p className="text-gray-600">
                          Choose from diverse AI interviewer personas and practice with questions tailored to your field and experience level.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Comprehensive Scoring</h4>
                        <p className="text-gray-600">
                          Get detailed feedback on your responses with scoring across multiple categories including clarity, relevance, and confidence.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Download className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Detailed Reports</h4>
                        <p className="text-gray-600">
                          Download comprehensive interview reports with full transcripts, scores, and improvement recommendations.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-4">Two Interview Modes</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold mb-2">Text-Based Mode</h4>
                        <p className="text-sm text-gray-600">
                          Practice answering questions through text input for quick feedback and scoring.
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold mb-2">Avatar Mode</h4>
                        <p className="text-sm text-gray-600">
                          Use webcam and microphone for realistic video interviews with AI avatars and voice transcription.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('choosePlan')}</h2>
            <p className="text-lg text-gray-600">{t('choosePlanSubtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Essential Plan */}
            <Card className="relative border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{t('essentialPlan')}</CardTitle>
                <div className="text-3xl font-bold text-gray-700 mt-4">
                  €15
                  <span className="text-lg text-gray-500 font-normal">/{t('month')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{t('orForMonths').replace('{amount}', '39')}</p>
                <p className="text-sm font-medium text-gray-700 mt-3">{t('getStartedRight')}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('cvCoverLetterGeneration')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('matchingScoreAnalysis')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('aiMentorBasic')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('jobTrackerBasic')}</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 py-3"
                  onClick={() => window.location.href = '/api/login'}
                >
                  {t('getStartedBtn')}
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative border-2 border-primary shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                  {t('mostPopular')}
                </span>
              </div>
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{t('professionalPlan')}</CardTitle>
                <div className="text-3xl font-bold text-primary mt-4">
                  €29
                  <span className="text-lg text-gray-500 font-normal">/{t('month')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{t('orForMonths').replace('{amount}', '75')}</p>
                <p className="text-sm font-medium text-primary mt-3">{t('trackApplyPractice')}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('everythingInEssential')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('unlimitedCvScoring')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('fullJobTracker')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('aiMentorAdvanced')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('unlimitedTextInterviews')}</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-primary hover:bg-orange-600 text-white py-3"
                  onClick={() => window.location.href = '/api/login'}
                >
                  {t('startFreeTrial')}
                </Button>
              </CardContent>
            </Card>

            {/* Elite Plan */}
            <Card className="relative border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{t('elitePlan')}</CardTitle>
                <div className="text-3xl font-bold text-purple-600 mt-4">
                  €45
                  <span className="text-lg text-gray-500 font-normal">/{t('month')}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{t('orForMonths').replace('{amount}', '115')}</p>
                <p className="text-sm font-medium text-purple-600 mt-3">{t('simulateRealInterview')}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-8 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('everythingInProfessional')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('unlimitedAvatarInterviews')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('advancedFeedback')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('personalizedReports')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('industryQuestionBanks')}</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    <span>{t('prioritySupport')}</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full border-purple-300 hover:bg-purple-50 text-purple-600 py-3"
                  onClick={() => window.location.href = '/api/login'}
                >
                  {t('getEliteAccess')}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              {t('multilingualSupport')}
            </p>
          </div>
        </div>

        {/* How it works */}
        <Card className="max-w-6xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">{t('howItWorks')}</CardTitle>
            <CardDescription className="text-lg">
              {t('howItWorksSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                5
              </div>
              <h3 className="font-semibold mb-2">{t('step5Title')}</h3>
              <p className="text-gray-600 text-sm">
                {t('step5Description')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>{t('aiPoweredFooter')}</p>
          <p className="text-xs mt-2">{t('careerPartner')}</p>
        </div>
      </div>
      </div>
    </div>
  );
}