import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';

interface InterviewSession {
  id: number;
  jobTitle: string;
  company: string;
  interviewType: string;
  difficultyLevel: string;
  recruiterPersona: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  overallScore?: number;
  duration?: number;
}

interface InterviewQA {
  id: number;
  questionNumber: number;
  question: string;
  questionType: string;
  userAnswer: string;
  answerScore?: number;
  feedback?: string;
  suggestions?: string;
}

export default function MockInterview() {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Setup form state
  const [setupForm, setSetupForm] = useState({
    jobTitle: '',
    company: '',
    jobDescription: '',
    interviewType: 'mixed',
    difficultyLevel: 'mid',
    recruiterPersona: 'friendly'
  });

  const handleStartInterview = () => {
    if (!setupForm.jobTitle || !setupForm.company || !setupForm.jobDescription) {
      toast({
        title: 'Error' as any,
        description: 'Please fill all required fields' as any,
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: 'Coming Soon' as any,
      description: 'Mock Interview feature will be available in the next update!' as any
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mock Interview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Practice with an AI recruiter for realistic interview training
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
          <p className="text-amber-800 dark:text-amber-200">
            🚧 <strong>Coming Soon!</strong> The Mock Interview feature is being developed and will be available in the next update.
          </p>
        </div>
      </div>

      {/* Interview Setup Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Interview Setup (Preview)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={setupForm.jobTitle}
                onChange={(e) => setSetupForm({ ...setupForm, jobTitle: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="e.g. Senior Software Developer"
                data-testid="input-job-title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Company
              </label>
              <input
                type="text"
                value={setupForm.company}
                onChange={(e) => setSetupForm({ ...setupForm, company: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="e.g. Google, Microsoft"
                data-testid="input-company"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Job Description
            </label>
            <Textarea
              value={setupForm.jobDescription}
              onChange={(e) => setSetupForm({ ...setupForm, jobDescription: e.target.value })}
              className="min-h-32"
              placeholder="Paste the full job description here..."
              data-testid="textarea-job-description"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Interview Type
              </label>
              <Select value={setupForm.interviewType} onValueChange={(value) => setSetupForm({ ...setupForm, interviewType: value })}>
                <SelectTrigger data-testid="select-interview-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <Select value={setupForm.difficultyLevel} onValueChange={(value) => setSetupForm({ ...setupForm, difficultyLevel: value })}>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Recruiter Style
              </label>
              <Select value={setupForm.recruiterPersona} onValueChange={(value) => setSetupForm({ ...setupForm, recruiterPersona: value })}>
                <SelectTrigger data-testid="select-recruiter-persona">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStartInterview}
            className="w-full"
            size="lg"
            data-testid="button-start-interview"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Start Mock Interview (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}