import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface JobDescriptionProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescription({ value, onChange }: JobDescriptionProps) {
  const { t } = useLanguage();
  const characterLimit = 2000;
  const characterCount = value.length;

  const handleClear = () => {
    onChange('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Briefcase className="text-primary mr-2" size={20} />
          {t('jobDescriptionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('jobDescriptionPlaceholder')}
          className="min-h-32 resize-none"
          maxLength={characterLimit}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {characterCount}/{characterLimit} characters
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-primary hover:text-orange-700 h-auto p-0"
          >
            Wissen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
