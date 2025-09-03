import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, MessageCircle, Send, RotateCcw, Upload, FileText, X, Download, Video, Mic, MicOff, VideoOff, User } from 'lucide-react';
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

// Avatar options with diverse representation
const getAvatarOptions = (t: (key: any) => string) => [
  {
    id: 'sarah',
    name: t('avatar.sarah.name'),
    gender: 'female',
    ethnicity: 'Asian',
    voice: 'female-professional',
    image: '👩🏻‍💼',
    description: t('avatar.sarah.description')
  },
  {
    id: 'marcus',
    name: t('avatar.marcus.name'),
    gender: 'male',
    ethnicity: 'African American',
    voice: 'male-authoritative',
    image: '👨🏿‍💼',
    description: t('avatar.marcus.description')
  },
  {
    id: 'elena',
    name: t('avatar.elena.name'),
    gender: 'female',
    ethnicity: 'Hispanic',
    voice: 'female-warm',
    image: '👩🏽‍💼',
    description: t('avatar.elena.description')
  },
  {
    id: 'raj',
    name: t('avatar.raj.name'),
    gender: 'male',
    ethnicity: 'South Asian',
    voice: 'male-professional',
    image: '👨🏽‍💼',
    description: t('avatar.raj.description')
  },
  {
    id: 'anna',
    name: t('avatar.anna.name'),
    gender: 'female',
    ethnicity: 'European',
    voice: 'female-confident',
    image: '👩🏼‍💼',
    description: t('avatar.anna.description')
  },
  {
    id: 'james',
    name: t('avatar.james.name'),
    gender: 'male',
    ethnicity: 'Caucasian',
    voice: 'male-friendly',
    image: '👨🏻‍💼',
    description: t('avatar.james.description')
  }
];

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
    recruiterPersona: 'friendly',
    interviewMode: 'text' // 'text' or 'avatar'
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

  // Avatar mode state
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Blob[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [videoPermissionGranted, setVideoPermissionGranted] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

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

  const handleStopInterview = async () => {
    if (!sessionData) return;
    
    try {
      setIsProcessing(true);
      
      // Stop any ongoing speech and media
      stopSpeaking();
      stopMediaStream();
      setIsRecording(false);
      
      // Save current answer if there is one
      let allQA = [...previousQA];
      if (currentAnswer.trim() && currentQuestion) {
        allQA.push({
          question: currentQuestion.question,
          answer: currentAnswer.trim(),
          evaluation: null // No evaluation for the current answer since interview stopped
        });
      }
      
      // Prepare the interview data for completion
      const questions = allQA.map(qa => qa.question);
      const answers = allQA.map(qa => qa.answer);
      const context = {
        jobTitle: sessionData.jobTitle,
        company: sessionData.company,
        interviewType: sessionData.interviewType,
        difficultyLevel: sessionData.difficultyLevel,
        language: 'en' // Default to English for now
      };
      
      // Call the complete interview endpoint with current progress including current answer
      const response = await apiRequest('POST', `/api/interviews/${sessionData.id}/complete`, {
        questions,
        answers,
        context,
        forcedStop: true,
        currentProgress: {
          questionsAnswered: allQA.length,
          totalQuestions: 10
        }
      });
      
      const result = await response.json();
      
      // Update previousQA to include current answer for display
      setPreviousQA(allQA);
      setFinalFeedback(result.feedback);
      setIsInterviewActive(false);
      setCurrentAnswer(''); // Clear current answer
      setIsProcessing(false);
      
      toast({
        title: 'Interview Stopped' as any,
        description: 'Interview ended early. You can review your feedback below.' as any,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error' as any,
        description: 'Failed to stop interview properly' as any,
        variant: 'destructive'
      });
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
    stopMediaStream();
    setIsRecording(false);
    setRecordedBlobs([]);
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

  // Initialize speech synthesis and set default avatar
  useEffect(() => {
    initializeSpeechSynthesis();
    if (!selectedAvatar) {
      setSelectedAvatar(getAvatarOptions(t)[0]); // Default to first avatar
    }
  }, [selectedAvatar]);

  // Auto-speak question when it changes in avatar mode
  useEffect(() => {
    if (setupForm.interviewMode === 'avatar' && currentQuestion && isInterviewActive && selectedAvatar) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        speakQuestion(currentQuestion.question);
      }, 1000);
    }
  }, [currentQuestion, isInterviewActive, selectedAvatar, setupForm.interviewMode]);

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

  // Avatar mode functions
  const initializeMedia = async () => {
    try {
      // Get video and audio streams
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      setMediaStream(videoStream);
      setAudioStream(audioStream);
      setVideoPermissionGranted(true);
      
      toast({
        title: 'Camera & Microphone Ready!' as any,
        description: 'You can now start the avatar interview' as any,
      });
    } catch (error: any) {
      toast({
        title: 'Media Access Denied' as any,
        description: 'Please allow camera and microphone access for avatar mode' as any,
        variant: 'destructive'
      });
    }
  };

  const startRecording = () => {
    if (!mediaStream || !audioStream) return;

    try {
      // Start audio recording for transcription
      const audioOptions = MediaRecorder.isTypeSupported('audio/webm') 
        ? { mimeType: 'audio/webm' } 
        : {};
      
      const audioRec = new MediaRecorder(audioStream, audioOptions);
      const audioChunks: Blob[] = [];
      
      audioRec.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      audioRec.onstop = () => {
        setAudioBlobs(audioChunks);
        if (audioChunks.length > 0) {
          transcribeAudio(audioChunks);
        }
      };
      
      // Start video recording for visual feedback
      const videoOptions = MediaRecorder.isTypeSupported('video/webm') 
        ? { mimeType: 'video/webm' } 
        : {};
      
      const videoRec = new MediaRecorder(mediaStream, videoOptions);
      const videoChunks: Blob[] = [];
      
      videoRec.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data);
        }
      };
      
      videoRec.onstop = () => {
        setRecordedBlobs(videoChunks);
      };
      
      setAudioRecorder(audioRec);
      setMediaRecorder(videoRec);
      setAudioBlobs([]);
      setRecordedBlobs([]);
      
      audioRec.start(1000);
      videoRec.start(1000);
      setIsRecording(true);
      
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Failed' as any,
        description: 'Unable to start recording. Please check your permissions.' as any,
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if ((mediaRecorder || audioRecorder) && isRecording) {
      try {
        if (audioRecorder) audioRecorder.stop();
        if (mediaRecorder) mediaRecorder.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        toast({
          title: 'Recording Error' as any,
          description: 'Failed to stop recording properly' as any,
          variant: 'destructive'
        });
      }
    }
  };

  const transcribeAudio = async (audioBlobs: Blob[]) => {
    if (!audioBlobs || audioBlobs.length === 0) {
      toast({
        title: 'No Audio Found' as any,
        description: 'Please record your answer first' as any,
        variant: 'destructive'
      });
      return;
    }

    setIsTranscribing(true);
    
    try {
      // Create audio blob
      const audioBlob = new Blob(audioBlobs, { type: 'audio/webm' });
      
      // Check if blob has content
      if (audioBlob.size === 0) {
        throw new Error('Recording is empty');
      }
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Transcription failed');
      }
      
      const data = await response.json();
      
      if (data.transcription && data.transcription.trim()) {
        setCurrentAnswer(data.transcription.trim());
        toast({
          title: 'Speech Transcribed!' as any,
          description: 'Your answer has been converted to text' as any,
        });
      } else {
        throw new Error('No speech detected in recording');
      }
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription Failed' as any,
        description: error.message || 'Please type your answer manually' as any,
        variant: 'destructive'
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    setVideoPermissionGranted(false);
  };

  // Initialize speech synthesis
  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  };

  // Speak the question using text-to-speech
  const speakQuestion = (text: string) => {
    if (!speechSynthesis || !selectedAvatar) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice based on selected avatar
    const voices = speechSynthesis.getVoices();
    
    // Try to find appropriate voice based on avatar characteristics
    let selectedVoice = null;
    
    if (selectedAvatar.gender === 'female') {
      selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen')
      ) || voices.find(voice => voice.name.toLowerCase().includes('en'));
    } else {
      selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('daniel')
      ) || voices.find(voice => voice.name.toLowerCase().includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Configure speech parameters
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = selectedAvatar.gender === 'female' ? 1.1 : 0.9;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
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

          {/* Interview Mode Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium mb-2">
              Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  setupForm.interviewMode === 'text' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSetupForm({ ...setupForm, interviewMode: 'text' })}
                data-testid="mode-text"
              >
                <div className="text-center space-y-2">
                  <MessageCircle className="h-8 w-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold">Text Interview</h3>
                  <p className="text-xs text-gray-600">Type your answers to interview questions</p>
                </div>
              </div>
              
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  setupForm.interviewMode === 'avatar' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSetupForm({ ...setupForm, interviewMode: 'avatar' })}
                data-testid="mode-avatar"
              >
                <div className="text-center space-y-2">
                  <Video className="h-8 w-8 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Avatar Interview</h3>
                  <p className="text-xs text-gray-600">AI avatar asks questions, record video answers</p>
                </div>
              </div>
            </div>
            
            {setupForm.interviewMode === 'avatar' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Video className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Avatar Mode Features</p>
                      <ul className="text-xs text-purple-700 mt-1 space-y-1">
                        <li>• AI avatar presents questions</li>
                        <li>• Record video/audio responses</li>
                        <li>• Automatic speech-to-text transcription</li>
                        <li>• More realistic interview experience</li>
                      </ul>
                      {!videoPermissionGranted && (
                        <Button 
                          onClick={initializeMedia}
                          size="sm" 
                          className="mt-3 bg-purple-600 hover:bg-purple-700"
                          data-testid="button-enable-camera"
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Enable Camera & Microphone
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Choose Your AI Interviewer
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getAvatarOptions(t).map((avatar) => (
                      <Card 
                        key={avatar.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedAvatar?.id === avatar.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAvatar(avatar)}
                        data-testid={`avatar-${avatar.id}`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl mb-2">{avatar.image}</div>
                          <h4 className="font-semibold text-sm">{avatar.name}</h4>
                          <p className="text-xs text-gray-600 mb-1">{avatar.description}</p>
                          <div className="flex justify-center space-x-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                              {avatar.ethnicity}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {selectedAvatar && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{selectedAvatar.image}</span>
                        <div>
                          <p className="font-medium">{selectedAvatar.name}</p>
                          <p className="text-sm text-gray-600">{selectedAvatar.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => speakQuestion("Hello! I'm your AI interviewer. Let's begin when you're ready.")}
                          disabled={isSpeaking}
                          data-testid="button-test-voice"
                        >
                          {isSpeaking ? '🔊 Speaking...' : '🔊 Test Voice'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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
            disabled={
              !setupForm.jobTitle || 
              !setupForm.company || 
              isLoading ||
              (setupForm.interviewMode === 'avatar' && !videoPermissionGranted)
            }
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Starting...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                Start {setupForm.interviewMode === 'avatar' ? 'Avatar' : 'Text'} Interview
              </>
            )}
          </Button>
          
          {setupForm.interviewMode === 'avatar' && !videoPermissionGranted && (
            <p className="text-sm text-orange-600 text-center">
              Please enable camera & microphone to start avatar interview
            </p>
          )}
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

            {/* Answer Input - Avatar Mode */}
            {!finalFeedback && setupForm.interviewMode === 'avatar' && (
              <div className="space-y-4">
                {/* AI Avatar Section */}
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
                        {selectedAvatar?.image || '👨🏻‍💼'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-800">
                          {selectedAvatar?.name || 'AI Recruiter'}
                        </h4>
                        <p className="text-sm text-purple-700">
                          {selectedAvatar?.description || 'Ready to hear your response'}
                        </p>
                        {isSpeaking && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-700">Speaking...</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => speakQuestion(currentQuestion?.question || "")}
                          disabled={isSpeaking || !currentQuestion}
                          data-testid="button-replay-question"
                        >
                          {isSpeaking ? '🔊' : '🔄'}
                        </Button>
                        {isSpeaking && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={stopSpeaking}
                            data-testid="button-stop-speaking"
                          >
                            🛑
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Recording Interface */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* User Video Feed */}
                      <div>
                        <h4 className="font-semibold mb-3">Your Video</h4>
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                          {mediaStream ? (
                            <video
                              ref={(video) => {
                                if (video && mediaStream) {
                                  video.srcObject = mediaStream;
                                  video.play().catch(err => console.log('Video play error:', err));
                                }
                              }}
                              className="w-full h-full object-cover"
                              muted
                              autoPlay
                              playsInline
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-gray-400">
                                <VideoOff className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Camera not enabled</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Recording Indicator */}
                          {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-white text-sm font-medium">Recording</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Recording Controls */}
                        <div className="flex justify-center space-x-3 mt-4">
                          {!isRecording ? (
                            <Button 
                              onClick={startRecording}
                              disabled={!mediaStream}
                              className="bg-red-600 hover:bg-red-700"
                              data-testid="button-start-recording"
                            >
                              <Mic className="w-4 h-4 mr-2" />
                              Start Recording
                            </Button>
                          ) : (
                            <Button 
                              onClick={stopRecording}
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50"
                              data-testid="button-stop-recording"
                            >
                              <MicOff className="w-4 h-4 mr-2" />
                              Stop Recording
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Transcribed Answer */}
                      <div>
                        <h4 className="font-semibold mb-3">Transcribed Answer</h4>
                        <div className="space-y-3">
                          {isTranscribing && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                <span className="text-blue-800">Transcribing your response...</span>
                              </div>
                            </div>
                          )}
                          
                          <Textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Your answer will appear here after recording, or you can type manually..."
                            className="min-h-32 resize-none"
                            rows={6}
                            data-testid="textarea-answer"
                          />
                          
                          <p className="text-xs text-gray-500">
                            You can edit the transcribed text before submitting your answer
                          </p>
                        </div>
                        
                        {/* Submit & Stop Buttons for Avatar Mode */}
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            onClick={handleStopInterview}
                            variant="destructive"
                            size="sm"
                            data-testid="button-stop-interview-avatar"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Stop Interview
                          </Button>
                          
                          <Button
                            onClick={handleSubmitAnswer}
                            disabled={isProcessing || !currentAnswer.trim()}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid="button-submit-answer-avatar"
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Answer Input - Text Mode */}
            {!finalFeedback && setupForm.interviewMode === 'text' && (
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
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleStopInterview}
                      variant="destructive"
                      size="sm"
                      data-testid="button-stop-interview"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Stop Interview
                    </Button>
                    
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