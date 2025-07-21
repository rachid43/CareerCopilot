import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Brain, CheckCircle, Sparkles } from "lucide-react";

export function Landing() {
  const features = [
    {
      icon: PenTool,
      title: "Create",
      description: "Generate tailored CV and cover letter from your profile and job description",
      color: "bg-primary",
    },
    {
      icon: Brain,
      title: "Review",
      description: "Get detailed feedback and suggestions on your uploaded documents",
      color: "bg-secondary",
    },
    {
      icon: CheckCircle,
      title: "Assess",
      description: "Compare your documents against job requirements with match scoring",
      color: "bg-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="text-primary mr-3" size={32} />
            <h1 className="text-4xl font-bold text-gray-900">CareerCopilot</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered career assistant that helps you create, review, and optimize your CVs and cover letters
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-orange-600 text-white px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started
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
            <CardTitle className="text-2xl font-bold mb-2">How It Works</CardTitle>
            <CardDescription className="text-lg">
              Get AI-powered career assistance in three simple steps
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-600 text-sm">
                Set up your personal information, skills, and career objectives
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Choose Your Mode</h3>
              <p className="text-gray-600 text-sm">
                Select from Create, Review, or Assess based on your needs
              </p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Get AI Insights</h3>
              <p className="text-gray-600 text-sm">
                Receive tailored recommendations and optimized documents
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