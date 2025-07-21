import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Mail, 
  Copy, 
  Download, 
  ClipboardCheck, 
  TrendingUp,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  X
} from "lucide-react";

type AIMode = 'create' | 'review' | 'assess';

interface ResultsDisplayProps {
  mode: AIMode;
  results: any;
  isLoading: boolean;
}

export function ResultsDisplay({ mode, results, isLoading }: ResultsDisplayProps) {
  const { toast } = useToast();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return null; // Loading state is handled in the parent component
  }

  if (!results) {
    return null;
  }

  if (mode === 'create') {
    return (
      <div className="space-y-6">
        {/* Generated CV */}
        {results.cv && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="text-primary mr-2" size={20} />
                  Generated CV
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(results.cv, 'CV')}
                  >
                    <Copy className="mr-1" size={14} />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(results.cv, 'cv.txt')}
                  >
                    <Download className="mr-1" size={14} />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 font-sans">
                  {results.cv}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Cover Letter */}
        {results.coverLetter && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Mail className="text-primary mr-2" size={20} />
                  Generated Cover Letter
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(results.coverLetter, 'Cover Letter')}
                  >
                    <Copy className="mr-1" size={14} />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(results.coverLetter, 'cover-letter.txt')}
                  >
                    <Download className="mr-1" size={14} />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 font-sans">
                  {results.coverLetter}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (mode === 'review') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardCheck className="text-primary mr-2" size={20} />
            Document Review & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-neutral-900">Overall Quality Score</h4>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-primary">{results.overallScore || 0}</div>
                <div className="text-sm text-secondary">/100</div>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {results.strengths && results.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                <ThumbsUp className="text-accent mr-2" size={16} />
                Strengths
              </h4>
              <ul className="space-y-2">
                {results.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="text-accent mt-1 flex-shrink-0" size={14} />
                    <span className="text-sm text-neutral-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {results.improvements && results.improvements.length > 0 && (
            <div>
              <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                <AlertTriangle className="text-yellow-500 mr-2" size={16} />
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {results.improvements.map((improvement: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-3 h-3 border-2 border-yellow-500 rounded-sm mt-1 flex-shrink-0"></div>
                    <span className="text-sm text-neutral-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          {results.summary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Summary</h4>
              <p className="text-sm text-neutral-700">{results.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mode === 'assess') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="text-primary mr-2" size={20} />
            Job Match Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Match Score */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">{results.matchScore || 0}%</div>
              <p className="text-lg font-semibold text-neutral-900">Job Match Score</p>
              <p className="text-sm text-secondary mt-1">
                {results.matchScore >= 80 ? 'Excellent match!' : 
                 results.matchScore >= 60 ? 'Strong match with room for optimization' :
                 'Needs significant improvement'}
              </p>
            </div>
          </div>

          {/* Skills Analysis */}
          {results.skillsAnalysis && results.skillsAnalysis.length > 0 && (
            <div>
              <h4 className="font-semibold text-neutral-900 mb-3">Skills Analysis</h4>
              <div className="space-y-3">
                {results.skillsAnalysis.map((skill: any, index: number) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      skill.status === 'excellent' || skill.match >= 90
                        ? 'bg-green-50 border-green-200'
                        : skill.status === 'good' || skill.match >= 70
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <span className="text-sm font-medium text-neutral-900">{skill.skill}</span>
                    <Badge
                      variant={
                        skill.status === 'excellent' || skill.match >= 90
                          ? 'default'
                          : skill.status === 'good' || skill.match >= 70
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {skill.status === 'missing' || skill.match === 0 
                        ? 'Missing'
                        : `${skill.match}% Match`
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {results.recommendations && (
            <div>
              <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                <Lightbulb className="text-yellow-500 mr-2" size={16} />
                Improvement Recommendations
              </h4>
              <div className="space-y-3">
                {results.recommendations.high && results.recommendations.high.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-neutral-900 mb-2">High Priority</h5>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      {results.recommendations.high.map((rec: string, index: number) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.recommendations.medium && results.recommendations.medium.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-medium text-neutral-900 mb-2">Medium Priority</h5>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      {results.recommendations.medium.map((rec: string, index: number) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {results.summary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Assessment Summary</h4>
              <p className="text-sm text-neutral-700">{results.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
