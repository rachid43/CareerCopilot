import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { ModeSelector } from "@/components/mode-selector";
import { PersonalProfile } from "@/components/personal-profile";
import { JobDescription } from "@/components/job-description";
import { ResultsDisplay } from "@/components/results-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, HelpCircle, Settings, Trash2, Wand2 } from "lucide-react";

type AIMode = 'create' | 'review' | 'assess';

export default function Home() {
  const [activeMode, setActiveMode] = useState<AIMode>('create');
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        title: "Success",
        description: "AI processing completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "AI processing failed",
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
        title: "Profile Required",
        description: "Please fill out your personal profile first",
        variant: "destructive",
      });
      return;
    }

    if (!jobDescription && (activeMode === 'create' || activeMode === 'assess')) {
      toast({
        title: "Job Description Required",
        description: "Please enter a job description",
        variant: "destructive",
      });
      return;
    }

    if (!documents.length && (activeMode === 'review' || activeMode === 'assess')) {
      toast({
        title: "Documents Required",
        description: "Please upload your CV/resume first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setAiResults(null);

    const data: any = {};
    if (activeMode === 'create') {
      data.profile = profile;
      data.jobDescription = jobDescription;
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
      case 'create': return 'Generate CV & Cover Letter';
      case 'review': return 'Analyze Documents';
      case 'assess': return 'Calculate Match Score';
      default: return 'Process';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">CareerCopilot</h1>
                <p className="text-sm text-secondary">AI-Powered Career Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-secondary hover:text-neutral-900 transition-colors">
                <HelpCircle size={20} />
              </button>
              <button className="text-secondary hover:text-neutral-900 transition-colors">
                <Settings size={20} />
              </button>
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
                    {isProcessing ? 'Processing...' : getButtonText()}
                  </Button>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="lg"
                  >
                    <Trash2 className="mr-2" size={16} />
                    Clear All
                  </Button>
                </div>

                {isProcessing && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-primary font-medium">
                        AI is analyzing your content...
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Bot className="text-white" size={12} />
              </div>
              <span className="text-sm text-secondary">Powered by OpenAI GPT-4</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-secondary">
              <a href="#" className="hover:text-neutral-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
