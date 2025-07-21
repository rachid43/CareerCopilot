import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Save } from "lucide-react";

export function PersonalProfile() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    skills: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile = null } = useQuery({
    queryKey: ['/api/profile'],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: (profile as any).name || '',
        email: (profile as any).email || '',
        phone: (profile as any).phone || '',
        position: (profile as any).position || '',
        skills: (profile as any).skills || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in at least your name and email",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="text-primary mr-2" size={20} />
          Personal Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="position">Current Position</Label>
          <Input
            id="position"
            type="text"
            placeholder="Software Engineer"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="skills">Key Skills</Label>
          <Textarea
            id="skills"
            placeholder="React, JavaScript, Python..."
            value={formData.skills}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            className="mt-1 h-20 resize-none"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full bg-secondary text-white hover:bg-slate-600"
        >
          <Save className="mr-2" size={16} />
          {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}
