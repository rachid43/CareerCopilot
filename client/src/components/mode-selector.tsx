import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Brain, CheckCircle } from "lucide-react";

type AIMode = 'create' | 'review' | 'assess';

interface ModeSelectorProps {
  activeMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  const modes = [
    {
      id: 'create' as AIMode,
      icon: PenTool,
      title: '✍️ Create',
      description: 'Generate tailored CV and cover letter from scratch using your profile and job description',
      color: 'bg-primary',
    },
    {
      id: 'review' as AIMode,
      icon: Brain,
      title: '🧠 Review',
      description: 'Get detailed feedback and suggestions on your uploaded CV and cover letter',
      color: 'bg-secondary',
    },
    {
      id: 'assess' as AIMode,
      icon: CheckCircle,
      title: '✅ Assess',
      description: 'Compare your documents against the job description with match score and improvement tips',
      color: 'bg-accent',
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Choose Your AI Mode</CardTitle>
        <p className="text-sm text-secondary mt-1">Select how you'd like CareerCopilot to assist you</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            
            return (
              <Button
                key={mode.id}
                variant="ghost"
                className={`w-full p-6 h-auto text-left justify-start rounded-none ${
                  index < modes.length - 1 ? 'border-b border-gray-200' : ''
                } ${isActive ? 'bg-orange-50 border-l-4 border-l-primary' : 'hover:bg-gray-50'}`}
                onClick={() => onModeChange(mode.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className={`w-8 h-8 ${mode.color} rounded-lg flex items-center justify-center mt-1 flex-shrink-0`}>
                    <Icon className="text-white" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 mb-1">{mode.title}</h3>
                    <p className="text-sm text-secondary leading-relaxed">{mode.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
