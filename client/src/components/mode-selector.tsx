import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Brain, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type AIMode = 'create' | 'review' | 'assess';

interface ModeSelectorProps {
  activeMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
  const { t } = useLanguage();
  
  const modes = [
    {
      id: 'create' as AIMode,
      icon: PenTool,
      title: `✍️ ${t('createMode')}`,
      description: t('createModeDescription'),
      color: 'bg-primary',
    },
    {
      id: 'review' as AIMode,
      icon: Brain,
      title: `🧠 ${t('reviewMode')}`,
      description: t('reviewModeDescription'),
      color: 'bg-secondary',
    },
    {
      id: 'assess' as AIMode,
      icon: CheckCircle,
      title: `✅ ${t('assessMode')}`,
      description: t('assessModeDescription'),
      color: 'bg-accent',
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="border-b border-gray-200">
        <CardTitle>Kies uw AI Modus</CardTitle>
        <p className="text-sm text-secondary mt-1">Selecteer hoe u wilt dat CareerCopilot u helpt</p>
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
