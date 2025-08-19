import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();

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
        title: t('success'),
        description: t('profileSavedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('profileSaveFailed'),
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

  const handleClear = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      skills: '',
    });
    toast({
      title: t('success'),
      description: t('profileCleared') || 'Profile cleared successfully',
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: t('requiredFields'),
        description: t('requiredFieldsDescription'),
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
          {t('personalProfileTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">{t('name')} *</Label>
          <Input
            id="name"
            type="text"
            placeholder={t('namePlaceholder')}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">{t('email')} *</Label>
          <Input
            id="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={t('phonePlaceholder')}
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="position">{t('position')}</Label>
          <Input
            id="position"
            type="text"
            placeholder={t('positionPlaceholder')}
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="skills">{t('skills')}</Label>
          <Textarea
            id="skills"
            placeholder={t('skillsPlaceholder')}
            value={formData.skills}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            className="mt-1 h-20 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 bg-secondary text-white hover:bg-slate-600"
          >
            <Save className="mr-2" size={16} />
            {saveMutation.isPending ? t('processing') : t('saveProfile')}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2" size={16} />
            {t('clearProfile')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
