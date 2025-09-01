import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, MessageCircle, Send, RotateCcw, Upload, FileText, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';
// FileUpload component will be inline

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

  // CV import state
  const [importedCV, setImportedCV] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Interview state
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [previousQA, setPreviousQA] = useState<any[]>([]);
  const [finalFeedback, setFinalFeedback] = useState<any>(null);

  const handleStartInterview = async () => {
    if (!setupForm.jobTitle || !setupForm.company) {
      toast({
        title: 'Error' as any,
        description: 'Please fill in the job title and company name' as any,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/interviews/start', {
        ...setupForm,
        cvContent: importedCV?.content || null,
        language: 'en'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start interview');
      }
      
      setSessionData(data.session);
      setCurrentQuestion(data.currentQuestion);
      setIsInterviewActive(true);
      setCurrentQuestionIndex(0);
      setPreviousQA([]);
      setFinalFeedback(null);
      
      toast({
        title: 'Interview Started!' as any,
        description: 'Good luck with your mock interview!' as any,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error' as any,
        description: error.message || 'Failed to start interview' as any,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    setIsProcessing(true);

    try {
      const response = await apiRequest('POST', `/api/interviews/${sessionData?.id}/answer`, {
        answer: currentAnswer,
        questionIndex: currentQuestionIndex,
        jobTitle: setupForm.jobTitle,
        company: setupForm.company,
        jobDescription: setupForm.jobDescription,
        interviewType: setupForm.interviewType,
        difficultyLevel: setupForm.difficultyLevel,
        recruiterPersona: setupForm.recruiterPersona,
        language: 'en',
        cvContent: importedCV?.content || null,
        previousQuestions: previousQA.map(qa => qa.question),
        previousAnswers: previousQA.map(qa => qa.answer)
      });

      const data = await response.json();

      const newQA = {
        question: currentQuestion.question,
        answer: currentAnswer,
        evaluation: data.evaluation
      };
      
      setPreviousQA(prev => [...prev, newQA]);

      if (data.isComplete || currentQuestionIndex >= 9) {
        const finalResponse = await apiRequest('POST', `/api/interviews/${sessionData?.id}/complete`, {
          questions: [...previousQA.map(qa => qa.question), currentQuestion.question],
          answers: [...previousQA.map(qa => qa.answer), currentAnswer],
          context: {
            jobTitle: setupForm.jobTitle,
            company: setupForm.company,
            jobDescription: setupForm.jobDescription,
            interviewType: setupForm.interviewType,
            difficultyLevel: setupForm.difficultyLevel,
            recruiterPersona: setupForm.recruiterPersona,
            language: 'en'
          }
        });

        const finalData = await finalResponse.json();
        setFinalFeedback(finalData.feedback);
      } else {
        setCurrentQuestion(data.nextQuestion);
        setCurrentQuestionIndex(prev => prev + 1);
      }

      setCurrentAnswer('');

    } catch (error: any) {
      toast({
        title: 'Error' as any,
        description: error.message || 'Failed to process answer' as any,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetInterview = () => {
    setIsInterviewActive(false);
    setSessionData(null);
    setCurrentQuestion(null);
    setCurrentAnswer('');
    setCurrentQuestionIndex(0);
    setPreviousQA([]);
    setFinalFeedback(null);
    setImportedCV(null);
  };

  const handleCVImport = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.match(/\.(pdf|docx?)$/i)) {
      toast({
        title: 'Invalid File Type' as any,
        description: 'Please upload a PDF or Word document' as any,
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload CV');
      }
      
      setImportedCV({
        filename: file.name,
        content: data.content
      });
      
      toast({
        title: 'CV Imported Successfully!' as any,
        description: 'Your CV will be used to personalize interview questions' as any,
      });
      
    } catch (error: any) {
      toast({
        title: 'Import Failed' as any,
        description: error.message || 'Failed to import CV' as any,
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const removeCVImport = () => {
    setImportedCV(null);
  };

  const downloadInterviewReport = async () => {
    if (!finalFeedback || !sessionData) return;
    
    try {
      const response = await fetch(`/api/interviews/${sessionData.id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: finalFeedback,
          questions: previousQA.map(qa => qa.question),
          answers: previousQA.map(qa => qa.answer),
          sessionData: sessionData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'Interview_Report.docx';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Complete!' as any,
        description: 'Interview report downloaded successfully' as any,
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed' as any,
        description: error.message || 'Failed to download interview report' as any,
        variant: 'destructive'
      });
    }
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
        {isInterviewActive && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
            <p className="text-green-800 dark:text-green-200">
              🎯 <strong>Interview Active!</strong> Answer the questions below to practice your interview skills.
            </p>
          </div>
        )}
      </div>

      {/* Interview Setup or Active Interview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            {isInterviewActive ? 'Mock Interview' : 'Interview Setup'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
        {!isInterviewActive ? (
          <div className="space-y-4">
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

          {/* CV Import Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">
                Import Your CV (Optional)
              </label>
              {importedCV && (
                <Button
                  onClick={removeCVImport}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  data-testid="button-remove-cv"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            
            {!importedCV ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-3">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Upload your CV to get personalized interview questions
                    </p>
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => e.target.files && handleCVImport(e.target.files)}
                        className="hidden"
                        id="cv-upload"
                        data-testid="file-input-cv"
                      />
                      <label htmlFor="cv-upload">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isImporting}
                          data-testid="button-upload-cv"
                          asChild
                        >
                          <span style={{ cursor: 'pointer' }}>
                            {isImporting ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Choose CV File
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF or Word documents only, max 100MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      CV Imported Successfully
                    </p>
                    <p className="text-xs text-green-600">
                      {importedCV.filename}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Your interview questions will be personalized based on your CV content
                </p>
              </div>
            )}
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
            disabled={!setupForm.jobTitle || !setupForm.company || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Starting...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Mock Interview
              </>
            )}
          </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interview Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {currentQuestionIndex + 1} / 10
                </span>
                <Badge variant="secondary">
                  {sessionData?.interviewType} - {sessionData?.difficultyLevel}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        AI Interviewer
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {currentQuestion.question}
                      </p>
                      {currentQuestion.expectedTopics && currentQuestion.expectedTopics.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Key topics to address:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentQuestion.expectedTopics.map((topic: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Answer Input */}
            {!finalFeedback && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <Textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-32 resize-none"
                    rows={6}
                    data-testid="textarea-answer"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {currentAnswer.length} characters
                  </div>
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={isProcessing || !currentAnswer.trim()}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-answer"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {currentQuestionIndex >= 9 ? 'Finish Interview' : 'Next Question'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Previous Q&A */}
            {previousQA.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Previous Questions</h4>
                {previousQA.map((qa: any, index: number) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm text-gray-700 mb-1">
                            Q{index + 1}:
                          </p>
                          <p className="text-sm text-gray-800">{qa.question}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-700 mb-1">
                            Your Answer:
                          </p>
                          <p className="text-sm text-gray-600">{qa.answer}</p>
                        </div>
                        {qa.evaluation && (
                          <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-sm text-gray-700 mb-1">
                              Feedback:
                            </p>
                            <p className="text-sm text-gray-600">{qa.evaluation.feedback}</p>
                            {qa.evaluation.score && (
                              <p className="text-xs text-green-600 mt-1">
                                Score: {qa.evaluation.score}/10
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Final Feedback */}
            {finalFeedback && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <h4 className="font-bold text-lg text-green-800 mb-4">
                    🎉 Interview Complete!
                  </h4>
                  
                  {/* Overall Score - Prominently displayed */}
                  <div className="bg-white p-6 rounded-lg border-2 border-green-300 mb-6 text-center">
                    <h5 className="font-semibold text-gray-700 mb-2">Overall Interview Score</h5>
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {finalFeedback.overallScore || finalFeedback.score || 'N/A'}<span className="text-2xl">/100</span>
                    </div>
                    {finalFeedback.summary && (
                      <p className="text-gray-600 mt-2">{finalFeedback.summary}</p>
                    )}
                  </div>

                  {/* Category Scores */}
                  {finalFeedback.categoryScores && (
                    <div className="bg-white p-4 rounded-lg border mb-4">
                      <h5 className="font-semibold text-green-700 mb-3">Category Breakdown</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">{finalFeedback.categoryScores.communication}/10</div>
                          <div className="text-sm text-gray-600">Communication</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">{finalFeedback.categoryScores.technical}/10</div>
                          <div className="text-sm text-gray-600">Technical</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">{finalFeedback.categoryScores.cultural}/10</div>
                          <div className="text-sm text-gray-600">Cultural Fit</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-700">{finalFeedback.categoryScores.experience}/10</div>
                          <div className="text-sm text-gray-600">Experience</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {finalFeedback.overallFeedback && (
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2">Overall Performance</h5>
                        <p className="text-green-800">{finalFeedback.overallFeedback}</p>
                      </div>
                    )}
                    
                    {finalFeedback.strengths && finalFeedback.strengths.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2">Strengths</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {finalFeedback.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-green-700">{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {finalFeedback.improvements && finalFeedback.improvements.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2">Areas for Improvement</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {finalFeedback.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="text-green-700">{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {finalFeedback.recommendations && finalFeedback.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2">Recommendations</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {finalFeedback.recommendations.map((recommendation: string, index: number) => (
                            <li key={index} className="text-green-700">{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={downloadInterviewReport}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-download-report"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report (DOCX)
                    </Button>
                    <Button
                      onClick={handleResetInterview}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                      data-testid="button-new-interview"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Start New Interview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}