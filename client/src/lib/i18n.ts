import { useState, useEffect } from 'react';

export type Language = 'nl' | 'en' | 'ar' | 'tr';

// Language translations
export const translations = {
  nl: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'AI-Aangedreven Carrière Assistent',
    logout: 'Uitloggen',
    
    // Navigation
    adminPanel: 'Admin Paneel',
    
    // AI Modes
    createMode: 'Aanmaken',
    reviewMode: 'Beoordelen', 
    assessMode: 'Evalueren',
    createModeDescription: 'Genereer nieuwe CV en motivatiebrief op basis van uw profiel en functieomschrijving',
    reviewModeDescription: 'Krijg gedetailleerde feedback op uw geüploade documenten',
    assessModeDescription: 'Vergelijk uw documenten met functieomschrijvingen en krijg een matching score',
    
    // File Upload
    fileUploadTitle: 'Documenten Uploaden',
    fileUploadDescription: 'Sleep uw CV of motivatiebrief hierheen',
    dragDropText: 'Sleep bestanden hierheen of klik om te selecteren',
    supportedFormats: 'PDF en DOCX bestanden worden ondersteund',
    uploadedDocuments: 'Geüploade Documenten',
    deleteDocument: 'Document verwijderen',
    
    // Job Description
    jobDescriptionTitle: 'Functieomschrijving',
    jobDescriptionPlaceholder: 'Plak hier de functieomschrijving...',
    jobDescriptionDescription: 'Voeg de functieomschrijving toe om betere resultaten te krijgen',
    
    // Personal Profile
    personalProfileTitle: 'Persoonlijk Profiel',
    personalProfileDescription: 'Vul uw gegevens in voor gepersonaliseerde resultaten',
    name: 'Naam',
    namePlaceholder: 'Uw volledige naam',
    email: 'E-mail',
    emailPlaceholder: 'uw.email@voorbeeld.nl',
    phone: 'Telefoon',
    phonePlaceholder: '+31 6 12345678',
    position: 'Gewenste Functie',
    positionPlaceholder: 'Bijvoorbeeld: Senior Software Developer',
    skills: 'Vaardigheden',
    skillsPlaceholder: 'Bijvoorbeeld: JavaScript, React, Node.js, Python',
    saveProfile: 'Profiel Opslaan',
    updateProfile: 'Profiel Bijwerken',
    
    // Action Buttons
    generateCvCoverLetter: 'Genereer CV & Motivatiebrief',
    analyzeDocuments: 'Analyseer Documenten',
    calculateMatchScore: 'Bereken Match Score',
    processing: 'Verwerken...',
    clearAll: 'Alles Wissen',
    
    // Results
    resultsTitle: 'AI Resultaten',
    noResults: 'Nog geen resultaten. Selecteer een modus en klik op de procesknop om te beginnen.',
    copyToClipboard: 'Kopieer naar Klembord',
    downloadAsWord: 'Download als Word',
    copied: 'Gekopieerd!',
    
    // Messages
    profileRequired: 'Profiel Vereist',
    profileRequiredDescription: 'Vul eerst uw persoonlijke profiel in',
    documentsRequired: 'Documenten Vereist',
    documentsRequiredDescription: 'Upload eerst uw documenten om door te gaan',
    jobDescriptionRequired: 'Functieomschrijving Vereist',
    jobDescriptionRequiredDescription: 'Voeg een functieomschrijving toe voor deze modus',
    success: 'Succes',
    aiProcessingComplete: 'AI verwerking succesvol voltooid',
    error: 'Fout',
    aiProcessingFailed: 'AI verwerking mislukt',
    unauthorized: 'Niet Geautoriseerd',
    unauthorizedDescription: 'U bent uitgelogd. Opnieuw inloggen...',
    profileSaved: 'Profiel opgeslagen',
    profileSavedDescription: 'Uw persoonlijke profiel is succesvol opgeslagen',
    profileSaveFailed: 'Profiel opslaan mislukt',
    documentDeleted: 'Document verwijderd',
    documentDeletedDescription: 'Het document is succesvol verwijderd',
    documentDeleteFailed: 'Document verwijderen mislukt',
    
    // Processing Status
    aiAnalyzing: 'AI analyseert uw inhoud...',
    
    // Language Selector
    language: 'Taal',
    dutch: 'Nederlands',
    english: 'Engels',
    arabic: 'Arabisch',
    turkish: 'Turks',
    
    // Footer translations
    allRightsReserved: "Alle rechten voorbehouden",
    privacyPolicy: "Privacybeleid",
    termsOfService: "Algemene Voorwaarden",
    support: "Ondersteuning",
  },
  en: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'AI-Powered Career Assistant',
    logout: 'Logout',
    
    // Navigation
    adminPanel: 'Admin Panel',
    
    // AI Modes
    createMode: 'Create',
    reviewMode: 'Review',
    assessMode: 'Assess',
    createModeDescription: 'Generate new CV and cover letter based on your profile and job description',
    reviewModeDescription: 'Get detailed feedback on your uploaded documents',
    assessModeDescription: 'Compare your documents against job descriptions with match scoring',
    
    // File Upload
    fileUploadTitle: 'Upload Documents',
    fileUploadDescription: 'Drop your CV or cover letter here',
    dragDropText: 'Drag files here or click to select',
    supportedFormats: 'PDF and DOCX files are supported',
    uploadedDocuments: 'Uploaded Documents',
    deleteDocument: 'Delete document',
    
    // Job Description
    jobDescriptionTitle: 'Job Description',
    jobDescriptionPlaceholder: 'Paste the job description here...',
    jobDescriptionDescription: 'Add the job description to get better results',
    
    // Personal Profile
    personalProfileTitle: 'Personal Profile',
    personalProfileDescription: 'Fill in your details for personalized results',
    name: 'Name',
    namePlaceholder: 'Your full name',
    email: 'Email',
    emailPlaceholder: 'your.email@example.com',
    phone: 'Phone',
    phonePlaceholder: '+1 (555) 123-4567',
    position: 'Desired Position',
    positionPlaceholder: 'e.g., Senior Software Developer',
    skills: 'Skills',
    skillsPlaceholder: 'e.g., JavaScript, React, Node.js, Python',
    saveProfile: 'Save Profile',
    updateProfile: 'Update Profile',
    
    // Action Buttons
    generateCvCoverLetter: 'Generate CV & Cover Letter',
    analyzeDocuments: 'Analyze Documents',
    calculateMatchScore: 'Calculate Match Score',
    processing: 'Processing...',
    clearAll: 'Clear All',
    
    // Results
    resultsTitle: 'AI Results',
    noResults: 'No results yet. Select a mode and click the process button to get started.',
    copyToClipboard: 'Copy to Clipboard',
    downloadAsWord: 'Download as Word',
    copied: 'Copied!',
    
    // Messages
    profileRequired: 'Profile Required',
    profileRequiredDescription: 'Please fill out your personal profile first',
    documentsRequired: 'Documents Required',
    documentsRequiredDescription: 'Please upload your documents first to proceed',
    jobDescriptionRequired: 'Job Description Required',
    jobDescriptionRequiredDescription: 'Please add a job description for this mode',
    success: 'Success',
    aiProcessingComplete: 'AI processing completed successfully',
    error: 'Error',
    aiProcessingFailed: 'AI processing failed',
    unauthorized: 'Unauthorized',
    unauthorizedDescription: 'You are logged out. Logging in again...',
    profileSaved: 'Profile saved',
    profileSavedDescription: 'Your personal profile has been saved successfully',
    profileSaveFailed: 'Failed to save profile',
    documentDeleted: 'Document deleted',
    documentDeletedDescription: 'The document has been deleted successfully',
    documentDeleteFailed: 'Failed to delete document',
    
    // Processing Status
    aiAnalyzing: 'AI is analyzing your content...',
    
    // Language Selector
    language: 'Language',
    dutch: 'Dutch',
    english: 'English',
    arabic: 'Arabic',
    turkish: 'Turkish',
    
    // Footer translations
    allRightsReserved: "All rights reserved",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    support: "Support",
  },
  ar: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'مساعد المهنة المدعوم بالذكاء الاصطناعي',
    logout: 'تسجيل الخروج',
    
    // Navigation
    adminPanel: 'لوحة الإدارة',
    
    // AI Modes
    createMode: 'إنشاء',
    reviewMode: 'مراجعة',
    assessMode: 'تقييم',
    createModeDescription: 'إنشاء سيرة ذاتية ورسالة تغطية جديدة بناءً على ملفك الشخصي ووصف الوظيفة',
    reviewModeDescription: 'احصل على تعليقات مفصلة على المستندات المرفوعة',
    assessModeDescription: 'قارن مستنداتك مع أوصاف الوظائف واحصل على درجة التطابق',
    
    // File Upload
    fileUploadTitle: 'رفع المستندات',
    fileUploadDescription: 'اسحب سيرتك الذاتية أو رسالة التغطية هنا',
    dragDropText: 'اسحب الملفات هنا أو انقر للاختيار',
    supportedFormats: 'ملفات PDF و DOCX مدعومة',
    uploadedDocuments: 'المستندات المرفوعة',
    deleteDocument: 'حذف المستند',
    
    // Job Description
    jobDescriptionTitle: 'وصف الوظيفة',
    jobDescriptionPlaceholder: 'الصق وصف الوظيفة هنا...',
    jobDescriptionDescription: 'أضف وصف الوظيفة للحصول على نتائج أفضل',
    
    // Personal Profile
    personalProfileTitle: 'الملف الشخصي',
    personalProfileDescription: 'املأ تفاصيلك للحصول على نتائج مخصصة',
    name: 'الاسم',
    namePlaceholder: 'اسمك الكامل',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'your.email@example.com',
    phone: 'الهاتف',
    phonePlaceholder: '+966 50 123 4567',
    position: 'المنصب المطلوب',
    positionPlaceholder: 'مثال: مطور برمجيات أول',
    skills: 'المهارات',
    skillsPlaceholder: 'مثال: JavaScript, React, Node.js, Python',
    saveProfile: 'حفظ الملف الشخصي',
    updateProfile: 'تحديث الملف الشخصي',
    
    // Action Buttons
    generateCvCoverLetter: 'إنشاء السيرة الذاتية ورسالة التغطية',
    analyzeDocuments: 'تحليل المستندات',
    calculateMatchScore: 'حساب درجة التطابق',
    processing: 'جاري المعالجة...',
    clearAll: 'مسح الكل',
    
    // Results
    resultsTitle: 'نتائج الذكاء الاصطناعي',
    noResults: 'لا توجد نتائج بعد. اختر وضعًا وانقر على زر المعالجة للبدء.',
    copyToClipboard: 'نسخ إلى الحافظة',
    downloadAsWord: 'تحميل كـ Word',
    copied: 'تم النسخ!',
    
    // Messages
    profileRequired: 'الملف الشخصي مطلوب',
    profileRequiredDescription: 'يرجى ملء ملفك الشخصي أولاً',
    documentsRequired: 'المستندات مطلوبة',
    documentsRequiredDescription: 'يرجى رفع مستنداتك أولاً للمتابعة',
    jobDescriptionRequired: 'وصف الوظيفة مطلوب',
    jobDescriptionRequiredDescription: 'يرجى إضافة وصف وظيفة لهذا الوضع',
    success: 'نجح',
    aiProcessingComplete: 'تمت معالجة الذكاء الاصطناعي بنجاح',
    error: 'خطأ',
    aiProcessingFailed: 'فشلت معالجة الذكاء الاصطناعي',
    unauthorized: 'غير مصرح',
    unauthorizedDescription: 'تم تسجيل خروجك. جاري تسجيل الدخول مرة أخرى...',
    profileSaved: 'تم حفظ الملف الشخصي',
    profileSavedDescription: 'تم حفظ ملفك الشخصي بنجاح',
    profileSaveFailed: 'فشل في حفظ الملف الشخصي',
    documentDeleted: 'تم حذف المستند',
    documentDeletedDescription: 'تم حذف المستند بنجاح',
    documentDeleteFailed: 'فشل في حذف المستند',
    
    // Processing Status
    aiAnalyzing: 'الذكاء الاصطناعي يحلل المحتوى...',
    
    // Language Selector
    language: 'اللغة',
    dutch: 'الهولندية',
    english: 'الإنجليزية',
    arabic: 'العربية',
    turkish: 'التركية',
    
    // Footer translations
    allRightsReserved: "جميع الحقوق محفوظة",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة",
    support: "الدعم",
  },
  tr: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'AI Destekli Kariyer Asistanı',
    logout: 'Çıkış Yap',
    
    // Navigation
    adminPanel: 'Yönetici Paneli',
    
    // AI Modes
    createMode: 'Oluştur',
    reviewMode: 'İncele',
    assessMode: 'Değerlendir',
    createModeDescription: 'Profiliniz ve iş tanımına dayalı yeni CV ve ön yazı oluşturun',
    reviewModeDescription: 'Yüklenen belgeleriniz hakkında ayrıntılı geri bildirim alın',
    assessModeDescription: 'Belgelerinizi iş tanımlarıyla karşılaştırın ve eşleşme puanı alın',
    
    // File Upload
    fileUploadTitle: 'Belge Yükle',
    fileUploadDescription: 'CV\'nizi veya ön yazınızı buraya sürükleyin',
    dragDropText: 'Dosyaları buraya sürükleyin veya seçmek için tıklayın',
    supportedFormats: 'PDF ve DOCX dosyaları desteklenir',
    uploadedDocuments: 'Yüklenen Belgeler',
    deleteDocument: 'Belgeyi sil',
    
    // Job Description
    jobDescriptionTitle: 'İş Tanımı',
    jobDescriptionPlaceholder: 'İş tanımını buraya yapıştırın...',
    jobDescriptionDescription: 'Daha iyi sonuçlar için iş tanımını ekleyin',
    
    // Personal Profile
    personalProfileTitle: 'Kişisel Profil',
    personalProfileDescription: 'Kişiselleştirilmiş sonuçlar için bilgilerinizi doldurun',
    name: 'Ad',
    namePlaceholder: 'Tam adınız',
    email: 'E-posta',
    emailPlaceholder: 'sizin.email@ornek.com',
    phone: 'Telefon',
    phonePlaceholder: '+90 555 123 4567',
    position: 'İstenen Pozisyon',
    positionPlaceholder: 'örn., Kıdemli Yazılım Geliştirici',
    skills: 'Yetenekler',
    skillsPlaceholder: 'örn., JavaScript, React, Node.js, Python',
    saveProfile: 'Profili Kaydet',
    updateProfile: 'Profili Güncelle',
    
    // Action Buttons
    generateCvCoverLetter: 'CV ve Ön Yazı Oluştur',
    analyzeDocuments: 'Belgeleri Analiz Et',
    calculateMatchScore: 'Eşleşme Puanını Hesapla',
    processing: 'İşleniyor...',
    clearAll: 'Tümünü Temizle',
    
    // Results
    resultsTitle: 'AI Sonuçları',
    noResults: 'Henüz sonuç yok. Bir mod seçin ve başlamak için işlem düğmesine tıklayın.',
    copyToClipboard: 'Panoya Kopyala',
    downloadAsWord: 'Word Olarak İndir',
    copied: 'Kopyalandı!',
    
    // Messages
    profileRequired: 'Profil Gerekli',
    profileRequiredDescription: 'Lütfen önce kişisel profilinizi doldurun',
    documentsRequired: 'Belgeler Gerekli',
    documentsRequiredDescription: 'Devam etmek için lütfen önce belgelerinizi yükleyin',
    jobDescriptionRequired: 'İş Tanımı Gerekli',
    jobDescriptionRequiredDescription: 'Bu mod için lütfen bir iş tanımı ekleyin',
    success: 'Başarılı',
    aiProcessingComplete: 'AI işleme başarıyla tamamlandı',
    error: 'Hata',
    aiProcessingFailed: 'AI işleme başarısız',
    unauthorized: 'Yetkisiz',
    unauthorizedDescription: 'Çıkış yaptınız. Tekrar giriş yapılıyor...',
    profileSaved: 'Profil kaydedildi',
    profileSavedDescription: 'Kişisel profiliniz başarıyla kaydedildi',
    profileSaveFailed: 'Profil kaydetme başarısız',
    documentDeleted: 'Belge silindi',
    documentDeletedDescription: 'Belge başarıyla silindi',
    documentDeleteFailed: 'Belge silme başarısız',
    
    // Processing Status
    aiAnalyzing: 'AI içeriğinizi analiz ediyor...',
    
    // Language Selector
    language: 'Dil',
    dutch: 'Flemenkçe',
    english: 'İngilizce',
    arabic: 'Arapça',
    turkish: 'Türkçe',
    
    // Footer translations
    allRightsReserved: "Tüm hakları saklıdır",
    privacyPolicy: "Gizlilik Politikası",
    termsOfService: "Hizmet Şartları",
    support: "Destek",
  },
};

// Language context hook
export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    // Default to Dutch as requested
    const saved = localStorage.getItem('careercopilot-language');
    return (saved as Language) || 'nl';
  });

  useEffect(() => {
    localStorage.setItem('careercopilot-language', language);
  }, [language]);

  const t = (key: keyof typeof translations.nl): string => {
    return translations[language][key] || key;
  };

  const switchLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return {
    language,
    t,
    switchLanguage,
    isNL: language === 'nl',
    isEN: language === 'en',
    isAR: language === 'ar',
    isTR: language === 'tr',
    isRTL: language === 'ar',
  };
}