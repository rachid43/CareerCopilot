import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Brain, CheckCircle, MessageCircle, Globe, Upload, Download, Star, User, Video } from "lucide-react";
import careerCopilotIcon from "@assets/ICON_CareerCopilot_1755719130597.png";
import { LanguageSelector } from "@/components/language-selector";
import { AuthModal } from "@/components/auth/AuthModal";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export function Landing() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  // Use Euro pricing as default since this is for European market
  const [isEuropean] = useState(true);
  const [currency] = useState('€');
  const [price] = useState('8.97');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  

  useEffect(() => {
    // Check if user is already logged in by looking for stored session
    const storedSession = localStorage.getItem('supabase-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('supabase-session');
      }
    }
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
      <div className="w-full py-4 px-4 mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src={careerCopilotIcon} 
              alt="CareerCopilot" 
              className="w-10 h-10 mr-3"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">Career<span className="text-primary">Copilot</span></span>
              <span className="text-xs text-gray-500 leading-none">🤖 {t('aiAssistant')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button 
              size="sm" 
              className="bg-primary hover:bg-orange-600 text-white"
              onClick={() => user ? setLocation('/') : setShowAuthModal(true)}
              data-testid="button-get-started"
            >
              {t('getStarted')}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16 mt-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Career<span className="text-primary">Copilot</span></h1>
          <p className="text-sm text-primary font-semibold mb-2">🤖 {t('appSubtitle')}</p>
          <h2 className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
            {t('landingSubtitle')}
          </h2>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* First row - 2 features */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {features.slice(0, 2).map((feature, index) => {
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
          
          {/* Second row - 2 features */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {features.slice(2, 4).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index + 2} className="text-center hover:shadow-lg transition-shadow">
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
          
          {/* Third row - 1 centered feature (Mock Interview) */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {features.slice(4, 5).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index + 4} className="text-center hover:shadow-lg transition-shadow border-2 border-primary/20">
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
          </div>
        </div>

        {/* Demo Video Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('watchInAction').split('CareerCopilot')[0]}
              Career<span className="text-primary">Copilot</span>
              {t('watchInAction').split('CareerCopilot')[1]}
            </h2>
            <p className="text-lg text-gray-600">{t('experienceAIHelp')}</p>
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('demoVideoComingSoon')}</h3>
                  <p className="text-gray-600">
                    {t('seeHowCareerCopilotHelps')}
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
              <h4 className="font-semibold mb-2">{t('smartUploadAnalysis')}</h4>
              <p className="text-sm text-gray-600">{t('uploadCVDescription')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">{t('aiCareerConversations')}</h4>
              <p className="text-sm text-gray-600">{t('personalizedCareerAdvice')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Video className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">{t('mockInterviews')}</h4>
              <p className="text-sm text-gray-600">{t('practiceWithAIRecruiters')}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="text-white" size={20} />
              </div>
              <h4 className="font-semibold mb-2">{t('professionalOutput')}</h4>
              <p className="text-sm text-gray-600">{t('downloadPolishedDocuments')}</p>
            </div>
          </div>
        </div>

        {/* Mock Interview Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('aiPoweredMockInterviews')}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('practiceInterviewsDescription')}
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
                        <h4 className="font-semibold text-lg mb-2">{t('realisticInterviewExperience')}</h4>
                        <p className="text-gray-600">
                          {t('diverseAIInterviewers')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">{t('comprehensiveScoring')}</h4>
                        <p className="text-gray-600">
                          {t('detailedFeedbackScoring')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Download className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">{t('detailedReports')}</h4>
                        <p className="text-gray-600">
                          {t('downloadInterviewReports')}
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
                    <h3 className="text-xl font-bold mb-4">{t('twoInterviewModes')}</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold mb-2">{t('textBasedMode')}</h4>
                        <p className="text-sm text-gray-600">
                          {t('textInputPractice')}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold mb-2">{t('avatarMode')}</h4>
                        <p className="text-sm text-gray-600">
                          {t('webcamMicrophoneInterviews')}
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
                    <span>{t('jobTrackerBasic')}</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 hover:text-gray-900 py-3"
                  onClick={() => user ? setLocation('/') : setShowAuthModal(true)}
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
                  onClick={() => user ? setLocation('/') : setShowAuthModal(true)}
                >
                  {t('getProAccess')}
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
                  className="w-full border-purple-300 hover:bg-purple-50 hover:text-purple-700 text-purple-600 py-3"
                  onClick={() => user ? setLocation('/') : setShowAuthModal(true)}
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
          {/* Added auth domain debugging - 2025-01-09 */}
        </div>
      </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setLocation('/');
        }}
      />
    </div>
  );
}