import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function FileUpload() {
  const [dragActive, setDragActive] = useState({ cv: false, coverLetter: false });
  const cvInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: documents = [] } = useQuery({
    queryKey: ['/api/documents'],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', type);

      // Get authentication headers
      const storedSession = localStorage.getItem('supabase-session');
      const headers: Record<string, string> = {};
      
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
        } catch (error) {
          console.error('Error parsing stored session for auth header:', error);
        }
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.message || 'Upload failed');
        } catch {
          throw new Error(errorText || 'Upload failed');
        }
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // If CV was uploaded, refresh profile to show auto-populated data
      if (variables.type === 'cv') {
        queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
        toast({
          title: t('success'),
          description: t('cvUploadedWithProfile') || 'CV uploaded and profile updated with extracted information',
        });
      } else {
        toast({
          title: t('success'),
          description: t('coverLetterUploaded') || 'Cover letter uploaded successfully',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Get authentication headers
      const storedSession = localStorage.getItem('supabase-session');
      const headers: Record<string, string> = {};
      
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
        } catch (error) {
          console.error('Error parsing stored session for auth header:', error);
        }
      }

      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.message || 'Delete failed');
        } catch {
          throw new Error(errorText || 'Delete failed');
        }
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent, type: 'cv' | 'coverLetter') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'cv' | 'coverLetter') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0], type === 'cv' ? 'cv' : 'cover-letter');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'cover-letter') => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0], type);
    }
  };

  const handleFile = (file: File, type: 'cv' | 'cover-letter') => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or DOCX files only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file, type });
  };

  const documentsArray = Array.isArray(documents) ? documents : [];
  const cvDoc = documentsArray.find((doc: any) => doc.type === 'cv');
  const coverLetterDoc = documentsArray.find((doc: any) => doc.type === 'cover-letter');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="text-primary mr-2" size={20} />
          {t('fileUploadTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CV Upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">{t('cvOptional')}</label>
          {cvDoc ? (
            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-green-800">{cvDoc.filename}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(cvDoc.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                dragActive.cv 
                  ? 'border-primary bg-blue-50' 
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
              onDragEnter={(e) => handleDrag(e, 'cv')}
              onDragLeave={(e) => handleDrag(e, 'cv')}
              onDragOver={(e) => handleDrag(e, 'cv')}
              onDrop={(e) => handleDrop(e, 'cv')}
              onClick={() => cvInputRef.current?.click()}
            >
              <FileText className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-secondary">
                {t('dropCvText')} <span className="text-primary font-medium">{t('browseFiles')}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('pdfDocxMax')}</p>
              <input
                ref={cvInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={(e) => handleFileInput(e, 'cv')}
              />
            </div>
          )}
        </div>

        {/* Cover Letter Upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">{t('coverLetterOptional')}</label>
          {coverLetterDoc ? (
            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-green-800">{coverLetterDoc.filename}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(coverLetterDoc.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                dragActive.coverLetter
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
              onDragEnter={(e) => handleDrag(e, 'coverLetter')}
              onDragLeave={(e) => handleDrag(e, 'coverLetter')}
              onDragOver={(e) => handleDrag(e, 'coverLetter')}
              onDrop={(e) => handleDrop(e, 'coverLetter')}
              onClick={() => coverLetterInputRef.current?.click()}
            >
              <FileText className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-secondary">
                {t('dropCoverLetterText')} <span className="text-primary font-medium">{t('browseFiles')}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('pdfDocxMax')}</p>
              <input
                ref={coverLetterInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={(e) => handleFileInput(e, 'cover-letter')}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
