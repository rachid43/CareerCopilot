import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Brain, CheckCircle, Sparkles } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/i18n";

export function Landing() {
  const { t } = useLanguage();
  
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Top Navigation with Language Selector */}
      <div className="w-full py-4 px-4">
        <div className="container mx-auto flex justify-end">
          <LanguageSelector />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-primary mr-3" size={32} />
            <h1 className="text-4xl font-bold text-gray-900">CareerCopilot</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landingSubtitle')}
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-orange-600 text-white px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            {t('getStarted')}
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
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

        {/* How it works */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold mb-2">{t('howItWorks')}</CardTitle>
            <CardDescription className="text-lg">
              {t('howItWorksSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-8">
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
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Powered by OpenAI GPT-4o • Secure • Fast • Professional</p>
        </div>
      </div>
    </div>
  );
}