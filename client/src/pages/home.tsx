import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { ModeSelector } from "@/components/mode-selector";
import { PersonalProfile } from "@/components/personal-profile";
import { JobDescription } from "@/components/job-description";
import { ResultsDisplay } from "@/components/results-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, HelpCircle, Settings, Trash2, Wand2, LogOut, User, Shield, Users } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Footer } from "@/components/footer";
import careerCopilotIcon from "@assets/ICON_CareerCopilot_1755719130597.png";

type AIMode = 'create' | 'review' | 'assess';

export default function Home() {
  const [activeMode, setActiveMode] = useState<AIMode>('create');
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const { data: profile } = useQuery({
    queryKey: ['/api/profile'],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['/api/documents'],
  });

  const processMutation = useMutation({
    mutationFn: async ({ mode, data }: { mode: AIMode; data: any }) => {
      const response = await apiRequest('POST', `/api/ai/${mode}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiResults(data);
      toast({
        title: t('success'),
        description: t('aiProcessingComplete'),
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('unauthorized'),
          description: t('unauthorizedDescription'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('error'),
        description: error.message || t('aiProcessingFailed'),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleAIProcess = async () => {
    if (!profile && activeMode === 'create') {
      toast({
        title: t('profileRequired'),
        description: t('profileRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    // For create mode: require profile, but job description is optional if documents exist
    // For assess mode: require job description
    if (activeMode === 'assess' && !jobDescription) {
      toast({
        title: t('jobDescriptionRequired'),
        description: t('jobDescriptionRequiredDescription'),
        variant: "destructive",
      });
      return;
    }
    
    // For create mode: require either profile+jobDescription OR documents for improvement
    if (activeMode === 'create' && !profile && (!documents || (documents as any[]).length === 0)) {
      toast({
        title: t('profileRequired'),
        description: t('profileRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    if ((!documents || (documents as any[]).length === 0) && (activeMode === 'review' || activeMode === 'assess')) {
      toast({
        title: t('documentsRequired'),
        description: t('documentsRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setAiResults(null);

    const data: any = { language };
    if (activeMode === 'create') {
      data.profile = profile;
      data.jobDescription = jobDescription;
      data.hasDocuments = documents && (documents as any[]).length > 0;
    } else if (activeMode === 'assess') {
      data.jobDescription = jobDescription;
    }

    processMutation.mutate({ mode: activeMode, data });
  };

  const handleClearAll = () => {
    setJobDescription('');
    setAiResults(null);
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
  };

  const getButtonText = () => {
    switch (activeMode) {
      case 'create': return t('generateCvCoverLetter');
      case 'review': return t('analyzeDocuments');
      case 'assess': return t('calculateMatchScore');
      default: return t('processing');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-20 py-3">
            <div className="flex items-center space-x-3">
              <img 
                src={careerCopilotIcon} 
                alt="CareerCopilot" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  Career<span className="text-primary">Copilot</span>
                </h1>
                <p className="text-sm text-secondary">{t('appSubtitle')}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-3">
              {user && (
                <div className="flex items-center space-x-2">
                  <User size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {String((user as any)?.firstName || (user as any)?.email || (user as any)?.username || 'User')}
                  </span>
                  <LanguageSelector />
                </div>
              )}
              
              {/* 2x2 Grid for navigation buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Link to="/chat">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 border-primary text-primary hover:bg-primary hover:text-white w-full"
                  >
                    <Bot size={16} />
                    <span>{t('aiCareerMentor')}</span>
                  </Button>
                </Link>
                <Link to="/job-applications">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white w-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>Job Tracker</span>
                  </Button>
                </Link>
                <Link to="/mock-interview">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white w-full"
                  >
                    <Users size={16} />
                    <span>Mock Interview</span>
                  </Button>
                </Link>
                <div className="flex space-x-1">
                  {(user as any)?.role === 'superadmin' && (
                    <Link to="/admin-dashboard">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 border-[#F08A5D] text-[#F08A5D] hover:bg-[#F08A5D] hover:text-white text-xs px-2"
                      >
                        <Shield size={14} />
                        <span>Admin</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/api/logout'}
                    className="flex items-center space-x-1 text-xs px-2"
                  >
                    <LogOut size={14} />
                    <span>{t('logout')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <FileUpload />
            <JobDescription 
              value={jobDescription}
              onChange={setJobDescription}
            />
            <PersonalProfile />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <ModeSelector 
              activeMode={activeMode}
              onModeChange={setActiveMode}
            />

            {/* Action Panel */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleAIProcess}
                    disabled={isProcessing}
                    className="flex-1 bg-primary text-white hover:bg-orange-600"
                    size="lg"
                  >
                    <Wand2 className="mr-2" size={16} />
                    {isProcessing ? t('processing') : getButtonText()}
                  </Button>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="lg"
                  >
                    <Trash2 className="mr-2" size={16} />
                    {t('clearAll')}
                  </Button>
                </div>

                {isProcessing && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-primary font-medium">
                        {t('aiAnalyzing')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ResultsDisplay
              mode={activeMode}
              results={aiResults}
              isLoading={isProcessing}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
