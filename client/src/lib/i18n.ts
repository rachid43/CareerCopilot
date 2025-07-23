import { useState, useEffect } from 'react';

export type Language = 'nl' | 'en';

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
  };
}