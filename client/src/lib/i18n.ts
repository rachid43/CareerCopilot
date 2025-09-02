import { useState, useEffect } from 'react';
import React from 'react';

export type Language = 'nl' | 'en' | 'ar' | 'tr';

// Language translations
export const translations = {
  nl: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'AI-Aangedreven Carrière Assistent',
    logout: 'Uitloggen',
    
    // Landing Page
    landingSubtitle: 'AI-aangedreven carrière-assistent die je helpt bij het maken, beoordelen en optimaliseren van je CV\'s en motivatiebrieven',
    getStarted: 'Inloggen',
    create: 'Aanmaken',
    createDescription: 'Genereer op maat gemaakte CV en motivatiebrief vanuit je profiel en functieomschrijving',
    review: 'Beoordelen',
    reviewDescription: 'Krijg gedetailleerde feedback en suggesties voor je geüploade documenten',
    assess: 'Evalueren',
    assessDescription: 'Vergelijk je documenten met functie-eisen en krijg een matching score',
    howItWorks: 'Hoe Het Werkt',
    howItWorksSubtitle: 'Je complete reis van CV-creatie naar interview succes',
    step1Title: 'Upload & Creëer',
    step1Description: 'Upload je bestaande CV of maak er een vanaf nul met onze AI-aangedreven generatie tools',
    step2Title: 'Beoordeel & Verbeter',
    step2Description: 'Krijg gedetailleerde feedback en suggesties om je CV en motivatiebrief inhoud te verbeteren',
    step3Title: 'Score & Match',
    step3Description: 'Vergelijk je documenten met functieomschrijvingen en krijg matching scores met verbeterpunten',
    step4Title: 'Volg Sollicitaties',
    step4Description: 'Organiseer en volg je sollicitaties met ons uitgebreide applicatie beheersysteem',
    step5Title: 'Oefen Interviews',
    step5Description: 'Beheers je interview vaardigheden met AI mock interviews, krijg feedback en download gedetailleerde rapporten',
    
    // New translations for landing page
    mockInterview: 'Mock Interview',
    mockInterviewDescription: 'Oefen interviews met AI recruiters, krijg persoonlijke feedback en verbeter je prestaties met uitgebreide scoring en rapporten.',
    choosePlan: 'Kies Je Plan',
    choosePlanSubtitle: 'Selecteer het plan dat past bij jouw baan zoektocht',
    
    // Pricing plans
    essentialPlan: 'Essential',
    professionalPlan: 'Professional', 
    elitePlan: 'Elite',
    getStartedRight: 'Goed Beginnen',
    trackApplyPractice: 'Volgen, Solliciteren & Oefenen',
    simulateRealInterview: 'Simuleer Het Echte Interview',
    mostPopular: 'Meest Populair',
    getStartedBtn: 'Aan de Slag',
    startFreeTrial: 'Start Gratis Proefperiode',
    getEliteAccess: 'Krijg Elite Toegang',
    orForMonths: 'of €{amount} voor 3 maanden',
    multilingualSupport: 'Alle plannen bevatten meertalige ondersteuning en veilige gegevensverwerking',
    
    // Plan features
    everythingInEssential: 'Alles in Essential',
    everythingInProfessional: 'Alles in Professional',
    cvCoverLetterGeneration: 'CV + motivatiebrief AI generatie/verbetering',
    matchingScoreAnalysis: 'Matching score analyse vs functieomschrijvingen (5 banen/maand)',
    aiMentorBasic: 'AI mentor chatbot (basis Q&A)',
    jobTrackerBasic: 'Sollicitatie tracker (handmatige basisvolging)',
    unlimitedCvScoring: 'Onbeperkte CV + motivatiebrief scoring vs functieomschrijvingen',
    fullJobTracker: 'Volledige sollicitatie tracker (status updates, rapportage dashboard)',
    aiMentorAdvanced: 'AI mentor chatbot (carrière tips, CV + sollicitatie inzichten)',
    unlimitedTextInterviews: 'Onbeperkte tekst-gebaseerde mock interviews (met feedback & scoring, gecontextualiseerd door CV + baan)',
    unlimitedAvatarInterviews: 'Onbeperkte avatar recruiter simulaties (spraak/video interview oefening)',
    advancedFeedback: 'Geavanceerde feedback: toon, helderheid, vertrouwen, STAR framework analyse',
    personalizedReports: 'Gepersonaliseerde verbeteringsrapporten (PDF)',
    industryQuestionBanks: 'Industrie/rol-specifieke interview vragen banken',
    prioritySupport: 'Prioriteit updates & ondersteuning',
    
    // Footer
    aiPoweredFooter: '🤖 AI-Aangedreven Carrière Assistent • Veilig • Snel • Professioneel',
    careerPartner: 'CareerCopilot: Jouw Intelligente Carrière Groei Partner',
    
    // Navigation
    adminPanel: 'Admin Paneel',
    
    // AI Modes
    aiModeTitle: 'Kies uw AI Modus',
    aiModeSubtitle: 'Selecteer hoe u wilt dat CareerCopilot u helpt',
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
    dropCvText: 'Sleep uw CV hierheen of',
    dropCoverLetterText: 'Sleep uw motivatiebrief hierheen of',
    browseFiles: 'blader door bestanden',
    pdfDocxMax: 'PDF of DOCX, max 100MB',
    cvOptional: 'CV (Optioneel)',
    coverLetterOptional: 'Motivatiebrief (Optioneel)',
    
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
    experience: 'Werkervaring',
    experiencePlaceholder: 'Beschrijf uw belangrijkste werkervaring en prestaties...',
    languages: 'Talen',
    languagesPlaceholder: 'Bijvoorbeeld: Nederlands (moedertaal), Engels (vloeiend), Duits (gemiddeld)',
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
    cvUploadedWithProfile: 'CV geüpload en profiel bijgewerkt met geëxtraheerde informatie',
    coverLetterUploaded: 'Motivatiebrief succesvol geüpload',
    
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
    
    // Chat translations
    aiCareerMentor: 'AI Carrière Mentor',
    yourPersonalCareerGuide: 'Jouw Persoonlijke Carrièregids',
    conversations: 'Gesprekken',
    newConversation: 'Nieuw Gesprek',
    noConversationsYet: 'Nog geen gesprekken',
    startChatting: 'Begin met Chatten',
    typeYourMessage: 'Stel me alles over je carrière...',
    welcomeToCareerMentor: 'Welkom bij je AI Carrière Mentor',
    careerMentor: 'Carrière Mentor',
    careerMentorDescription: 'Ik ben er om je te helpen met carrièreadvies, sollicitatievoorbereidingen, cv-feedback en professionele begeleiding. Laten we een gesprek starten!',
    startConversation: 'Start Gesprek',
    failedToCreateConversation: 'Kon gesprek niet aanmaken',
    failedToSendMessage: 'Kon bericht niet versturen',
    backToHome: 'Terug naar Home',
    clear: 'Wissen',
    clearProfile: 'Profiel Wissen',
    profileCleared: 'Profiel succesvol gewist',
    requiredFields: 'Verplichte velden ontbreken',
    requiredFieldsDescription: 'Vul ten minste uw naam en e-mail in',
    
    // Pricing
    pricing: 'Prijzen',
    pricingSubtitle: 'Eenvoudige, transparante prijzen voor professionals',
    mostPopular: 'Meest Populair',
    professionalPlan: 'Professional Plan',
    month: 'maand',
    unlimitedAccess: 'Onbeperkte toegang tot alle modi',
    multiLanguageSupport: 'Volledige meertalige ondersteuning',
    unlimitedUploads: 'Onbeperkte document uploads',
    editableOutput: 'Bewerkbare AI output en downloads',
    unlimitedChatbot: 'Onbeperkte carrière chatbot toegang',
    matchScoring: 'Match scoring en verbeterings tips',
    profileManagement: 'Profiel opslaan en hergebruiken',
    startFreeTrial: 'Start Gratis Proefperiode',
    noCommitment: 'Geen verplichtingen, stop wanneer je wilt',
    
    // Mock Interview
    'interview.title': 'Mock Interview',
    'interview.subtitle': 'Oefen met een AI recruiter voor realistische sollicitatietraining',
    'interview.setup': 'Interview Instellen',
    'interview.jobTitle': 'Functietitel',
    'interview.jobTitlePlaceholder': 'bijv. Senior Software Developer',
    'interview.company': 'Bedrijf',
    'interview.companyPlaceholder': 'bijv. Google, Microsoft',
    'interview.jobDescription': 'Functiebeschrijving',
    'interview.jobDescriptionPlaceholder': 'Plak de volledige functiebeschrijving hier...',
    'interview.type': 'Interview Type',
    'interview.behavioral': 'Gedragsmatig',
    'interview.technical': 'Technisch',
    'interview.situational': 'Situationeel',
    'interview.mixed': 'Gemengd',
    'interview.difficulty': 'Moeilijkheidsgraad',
    'interview.junior': 'Junior',
    'interview.mid': 'Midden',
    'interview.senior': 'Senior',
    'interview.recruiterStyle': 'Recruiter Stijl',
    'interview.friendly': 'Vriendelijk',
    'interview.formal': 'Formeel',
    'interview.challenging': 'Uitdagend',
    'interview.startInterview': 'Interview Starten',
    'interview.starting': 'Interview wordt gestart...',
    'interview.endInterview': 'Interview Beëindigen',
    'interview.progress': 'Voortgang',
    'interview.recruiterQuestion': 'Recruiter Vraag',
    'interview.yourAnswer': 'Typ je antwoord hier...',
    'interview.submitAnswer': 'Antwoord Versturen',
    'interview.submitting': 'Antwoord wordt verstuurd...',
    'interview.previousSessions': 'Eerdere Sessies',
    'interview.started': 'Interview Gestart',
    'interview.goodLuck': 'Veel succes met je interview!',
    'interview.completed': 'Interview Voltooid',
    'interview.reviewFeedback': 'Bekijk je feedback in eerdere sessies',
    'interview.startError': 'Fout bij het starten van interview',
    'interview.questionError': 'Fout bij het ophalen van vraag',
    'interview.fillAllFields': 'Vul alle vereiste velden in',
    'interview.status.active': 'Actief',
    'interview.status.completed': 'Voltooid',
    'interview.status.paused': 'Gepauzeerd',
    'common.error': 'Fout',
  },
  en: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'AI-Powered Career Assistant',
    logout: 'Logout',
    
    // Landing Page
    landingSubtitle: 'AI-powered career assistant that helps you create, review, and optimize your CVs and cover letters',
    getStarted: 'Login',
    create: 'Create',
    createDescription: 'Generate tailored CV and cover letter from your profile and job description',
    review: 'Review',
    reviewDescription: 'Get detailed feedback and suggestions on your uploaded documents',
    assess: 'Assess',
    assessDescription: 'Compare your documents against job requirements with match scoring',
    howItWorks: 'How It Works',
    howItWorksSubtitle: 'Your complete journey from CV creation to interview success',
    step1Title: 'Upload & Create',
    step1Description: 'Upload your existing CV or create one from scratch using our AI-powered generation tools',
    step2Title: 'Review & Enhance',
    step2Description: 'Get detailed feedback and suggestions to improve your CV and cover letter content',
    step3Title: 'Score & Match',
    step3Description: 'Compare your documents against job descriptions and get matching scores with improvement tips',
    step4Title: 'Track Applications',
    step4Description: 'Organize and track your job applications with our comprehensive application management system',
    step5Title: 'Practice Interviews',
    step5Description: 'Master your interview skills with AI mock interviews, get feedback, and download detailed reports',
    
    // New translations for landing page
    mockInterview: 'Mock Interview',
    mockInterviewDescription: 'Practice interviews with AI recruiters, get personalized feedback, and improve your performance with comprehensive scoring and reports.',
    choosePlan: 'Choose Your Plan',
    choosePlanSubtitle: 'Select the plan that matches your job search journey',
    
    // Pricing plans
    essentialPlan: 'Essential',
    professionalPlan: 'Professional', 
    elitePlan: 'Elite',
    getStartedRight: 'Get Started Right',
    trackApplyPractice: 'Track, Apply & Practice',
    simulateRealInterview: 'Simulate the Real Interview',
    mostPopular: 'Most Popular',
    getStartedBtn: 'Get Started',
    startFreeTrial: 'Start Free Trial',
    getEliteAccess: 'Get Elite Access',
    orForMonths: 'or €{amount} for 3 months',
    multilingualSupport: 'All plans include multilingual support and secure data handling',
    
    // Plan features
    everythingInEssential: 'Everything in Essential',
    everythingInProfessional: 'Everything in Professional',
    cvCoverLetterGeneration: 'CV + cover letter AI generation/enhancement',
    matchingScoreAnalysis: 'Matching score analysis vs job descriptions (5 jobs/month)',
    aiMentorBasic: 'AI mentor chatbot (basic Q&A)',
    jobTrackerBasic: 'Job application tracker (basic manual tracking)',
    unlimitedCvScoring: 'Unlimited CV + cover letter scoring vs job descriptions',
    fullJobTracker: 'Full job application tracker (status updates, reporting dashboard)',
    aiMentorAdvanced: 'AI mentor chatbot (career tips, CV + application insights)',
    unlimitedTextInterviews: 'Unlimited text-based mock interviews (with feedback & scoring, contextualized by CV + job)',
    unlimitedAvatarInterviews: 'Unlimited avatar recruiter simulations (voice/video interview practice)',
    advancedFeedback: 'Advanced feedback: tone, clarity, confidence, STAR framework analysis',
    personalizedReports: 'Personalized improvement reports (PDF)',
    industryQuestionBanks: 'Industry/role-specific interview question banks',
    prioritySupport: 'Priority updates & support',
    
    // Footer
    aiPoweredFooter: '🤖 AI-Powered Career Assistant • Secure • Fast • Professional',
    careerPartner: 'CareerCopilot: Your Intelligent Career Growth Partner',
    
    // Navigation
    adminPanel: 'Admin Panel',
    
    // AI Modes
    aiModeTitle: 'Choose Your AI Mode',
    aiModeSubtitle: 'Select how you want CareerCopilot to help you',
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
    dropCvText: 'Drop your CV here or',
    dropCoverLetterText: 'Drop your cover letter here or',
    browseFiles: 'browse files',
    pdfDocxMax: 'PDF or DOCX, max 100MB',
    cvOptional: 'CV (Optional)',
    coverLetterOptional: 'Cover Letter (Optional)',
    
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
    experience: 'Experience',
    experiencePlaceholder: 'Describe your key work experience and achievements...',
    languages: 'Languages',
    languagesPlaceholder: 'e.g., English (native), Spanish (fluent), French (intermediate)',
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
    cvUploadedWithProfile: 'CV uploaded and profile updated with extracted information',
    coverLetterUploaded: 'Cover letter uploaded successfully',
    
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
    
    // Chat translations
    aiCareerMentor: 'AI Career Mentor',
    yourPersonalCareerGuide: 'Your Personal Career Guide',
    conversations: 'Conversations',
    newConversation: 'New Conversation',
    noConversationsYet: 'No conversations yet',
    startChatting: 'Start Chatting',
    typeYourMessage: 'Ask me anything about your career...',
    welcomeToCareerMentor: 'Welcome to your AI Career Mentor',
    careerMentor: 'Career Mentor',
    careerMentorDescription: 'I\'m here to help you with career advice, interview preparation, resume feedback, and professional guidance. Let\'s start a conversation!',
    startConversation: 'Start Conversation',
    failedToCreateConversation: 'Failed to create conversation',
    failedToSendMessage: 'Failed to send message',
    backToHome: 'Back to Home',
    clear: 'Clear',
    clearProfile: 'Clear Profile',
    profileCleared: 'Profile cleared successfully',
    requiredFields: 'Required fields missing',
    requiredFieldsDescription: 'Please fill in at least your name and email',
    
    // Pricing
    pricing: 'Pricing',
    pricingSubtitle: 'Simple, transparent pricing for professionals',
    mostPopular: 'Most Popular',
    professionalPlan: 'Professional Plan',
    month: 'month',
    unlimitedAccess: 'Unlimited access to all modes',
    multiLanguageSupport: 'Full multi-language support',
    unlimitedUploads: 'Unlimited document uploads',
    editableOutput: 'Editable AI output and downloads',
    unlimitedChatbot: 'Unlimited career chatbot access',
    matchScoring: 'Match scoring and improvement tips',
    profileManagement: 'Save and reuse personal profiles',
    startFreeTrial: 'Start Free Trial',
    noCommitment: 'No commitment, cancel anytime',
    
    // Mock Interview
    'interview.title': 'Mock Interview',
    'interview.subtitle': 'Practice with an AI recruiter for realistic interview training',
    'interview.setup': 'Interview Setup',
    'interview.jobTitle': 'Job Title',
    'interview.jobTitlePlaceholder': 'e.g. Senior Software Developer',
    'interview.company': 'Company',
    'interview.companyPlaceholder': 'e.g. Google, Microsoft',
    'interview.jobDescription': 'Job Description',
    'interview.jobDescriptionPlaceholder': 'Paste the full job description here...',
    'interview.type': 'Interview Type',
    'interview.behavioral': 'Behavioral',
    'interview.technical': 'Technical',
    'interview.situational': 'Situational',
    'interview.mixed': 'Mixed',
    'interview.difficulty': 'Difficulty Level',
    'interview.junior': 'Junior',
    'interview.mid': 'Mid-Level',
    'interview.senior': 'Senior',
    'interview.recruiterStyle': 'Recruiter Style',
    'interview.friendly': 'Friendly',
    'interview.formal': 'Formal',
    'interview.challenging': 'Challenging',
    'interview.startInterview': 'Start Interview',
    'interview.starting': 'Starting interview...',
    'interview.endInterview': 'End Interview',
    'interview.progress': 'Progress',
    'interview.recruiterQuestion': 'Recruiter Question',
    'interview.yourAnswer': 'Type your answer here...',
    'interview.submitAnswer': 'Submit Answer',
    'interview.submitting': 'Submitting answer...',
    'interview.previousSessions': 'Previous Sessions',
    'interview.started': 'Interview Started',
    'interview.goodLuck': 'Good luck with your interview!',
    'interview.completed': 'Interview Completed',
    'interview.reviewFeedback': 'Review your feedback in previous sessions',
    'interview.startError': 'Error starting interview',
    'interview.questionError': 'Error getting question',
    'interview.fillAllFields': 'Please fill all required fields',
    'interview.status.active': 'Active',
    'interview.status.completed': 'Completed',
    'interview.status.paused': 'Paused',
    'common.error': 'Error',
  },
  ar: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'مساعد المهنة المدعوم بالذكاء الاصطناعي',
    logout: 'تسجيل الخروج',
    
    // Landing Page
    landingSubtitle: 'مساعد مهني مدعوم بالذكاء الاصطناعي يساعدك في إنشاء ومراجعة وتحسين سيرتك الذاتية ورسائل التغطية',
    getStarted: 'تسجيل الدخول',
    create: 'إنشاء',
    createDescription: 'إنشاء سيرة ذاتية ورسالة تغطية مخصصة من ملفك الشخصي ووصف الوظيفة',
    review: 'مراجعة',
    reviewDescription: 'احصل على تعليقات مفصلة واقتراحات حول مستنداتك المحملة',
    assess: 'تقييم',
    assessDescription: 'قارن مستنداتك مع متطلبات الوظيفة واحصل على نقاط المطابقة',
    howItWorks: 'كيف يعمل',
    howItWorksSubtitle: 'احصل على مساعدة مهنية مدعومة بالذكاء الاصطناعي في أربع خطوات بسيطة',
    step1Title: 'أنشئ ملفك الشخصي',
    step1Description: 'قم بإعداد معلوماتك الشخصية ومهاراتك وأهدافك المهنية',
    step2Title: 'اختر وضعك',
    step2Description: 'اختر من إنشاء أو مراجعة أو تقييم حسب احتياجاتك',
    step3Title: 'احصل على رؤى الذكاء الاصطناعي',
    step3Description: 'تلقَّ توصيات مخصصة ومستندات محسّنة',
    step4Title: 'تحدث مع مرشد الذكاء الاصطناعي',
    step4Description: 'احصل على نصائح مهنية شخصية من خلال روبوت الدردشة الذكي',
    
    // Navigation
    adminPanel: 'لوحة الإدارة',
    
    // AI Modes
    aiModeTitle: 'اختر وضع الذكاء الاصطناعي',
    aiModeSubtitle: 'حدد كيف تريد من CareerCopilot أن يساعدك',
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
    dropCvText: 'اسحب سيرتك الذاتية هنا أو',
    dropCoverLetterText: 'اسحب رسالة التغطية هنا أو',
    browseFiles: 'تصفح الملفات',
    pdfDocxMax: 'PDF أو DOCX، حد أقصى 100 ميجابايت',
    cvOptional: 'السيرة الذاتية (اختيارية)',
    coverLetterOptional: 'رسالة التغطية (اختيارية)',
    
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
    experience: 'الخبرة المهنية',
    experiencePlaceholder: 'اوصف خبرتك المهنية الأساسية وإنجازاتك...',
    languages: 'اللغات',
    languagesPlaceholder: 'مثال: العربية (لغة أم)، الإنجليزية (طلاقة)، الفرنسية (متوسط)',
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
    cvUploadedWithProfile: 'تم رفع السيرة الذاتية وتحديث الملف الشخصي بالمعلومات المستخرجة',
    coverLetterUploaded: 'تم رفع رسالة التغطية بنجاح',
    
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
    
    // Chat translations
    aiCareerMentor: 'مرشد المهنة الذكي',
    yourPersonalCareerGuide: 'دليل المهنة الشخصي الخاص بك',
    conversations: 'المحادثات',
    newConversation: 'محادثة جديدة',
    noConversationsYet: 'لا توجد محادثات بعد',
    startChatting: 'ابدأ المحادثة',
    typeYourMessage: 'اسأل أي شيء عن مهنتك...',
    welcomeToCareerMentor: 'مرحباً بك في مرشد المهنة الذكي',
    careerMentor: 'مرشد مهني',
    careerMentorDescription: 'أنا هنا لمساعدتك في النصائح المهنية وإعداد المقابلات وتقييم السيرة الذاتية والإرشاد المهني. لنبدأ محادثة!',
    startConversation: 'ابدأ المحادثة',
    failedToCreateConversation: 'فشل في إنشاء المحادثة',
    failedToSendMessage: 'فشل في إرسال الرسالة',
    backToHome: 'العودة للرئيسية',
    clear: 'مسح',
    clearProfile: 'مسح الملف الشخصي',
    profileCleared: 'تم مسح الملف الشخصي بنجاح',
    requiredFields: 'الحقول المطلوبة مفقودة',
    requiredFieldsDescription: 'الرجاء ملء الاسم والبريد الإلكتروني على الأقل',
    
    // Pricing
    pricing: 'الأسعار',
    pricingSubtitle: 'أسعار بسيطة وشفافة للمحترفين',
    mostPopular: 'الأكثر شعبية',
    professionalPlan: 'الخطة المهنية',
    month: 'شهر',
    unlimitedAccess: 'وصول غير محدود لجميع الأوضاع',
    multiLanguageSupport: 'دعم كامل متعدد اللغات',
    unlimitedUploads: 'رفع مستندات غير محدود',
    editableOutput: 'مخرجات AI قابلة للتحرير والتنزيل',
    unlimitedChatbot: 'وصول غير محدود لروبوت المحادثة المهني',
    matchScoring: 'تسجيل المطابقة ونصائح التحسين',
    profileManagement: 'حفظ وإعادة استخدام الملفات الشخصية',
    startFreeTrial: 'ابدأ الفترة التجريبية المجانية',
    noCommitment: 'بدون التزام، ألغ في أي وقت',
  },
  tr: {
    // Header
    appTitle: 'CareerCopilot',
    appSubtitle: 'AI Destekli Kariyer Asistanı',
    logout: 'Çıkış Yap',
    
    // Landing Page
    landingSubtitle: 'CV ve ön yazılarınızı oluşturmanıza, incelemenize ve optimize etmenize yardımcı olan AI destekli kariyer asistanı',
    getStarted: 'Giriş Yap',
    create: 'Oluştur',
    createDescription: 'Profiliniz ve iş tanımınızdan özel CV ve ön yazı oluşturun',
    review: 'İncele',
    reviewDescription: 'Yüklediğiniz belgeler için ayrıntılı geri bildirim ve öneriler alın',
    assess: 'Değerlendir',
    assessDescription: 'Belgelerinizi iş gereksinimleriyle karşılaştırın ve eşleşme puanı alın',
    howItWorks: 'Nasıl Çalışır',
    howItWorksSubtitle: 'Dört basit adımda AI destekli kariyer yardımı alın',
    step1Title: 'Profilinizi Oluşturun',
    step1Description: 'Kişisel bilgilerinizi, yeteneklerinizi ve kariyer hedeflerinizi ayarlayın',
    step2Title: 'Modunuzu Seçin',
    step2Description: 'İhtiyaçlarınıza göre Oluştur, İncele veya Değerlendir\'den seçin',
    step3Title: 'AI İçgörüleri Alın',
    step3Description: 'Özelleştirilmiş öneriler ve optimize edilmiş belgeler alın',
    step4Title: 'AI Mentor ile Sohbet Edin',
    step4Description: 'Akıllı AI sohbet robotumuz aracılığıyla kişiselleştirilmiş kariyer tavsiyesi alın',
    
    // Navigation
    adminPanel: 'Yönetici Paneli',
    
    // AI Modes
    aiModeTitle: 'AI Modunuzu Seçin',
    aiModeSubtitle: 'CareerCopilot\'un size nasıl yardım etmesini istediğinizi seçin',
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
    dropCvText: 'CV\'nizi buraya sürükleyin veya',
    dropCoverLetterText: 'Ön yazınızı buraya sürükleyin veya',
    browseFiles: 'dosyalara göz atın',
    pdfDocxMax: 'PDF veya DOCX, maksimum 100MB',
    cvOptional: 'CV (İsteğe Bağlı)',
    coverLetterOptional: 'Ön Yazı (İsteğe Bağlı)',
    
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
    experience: 'Deneyim',
    experiencePlaceholder: 'Temel iş deneyiminizi ve başarılarınızı açıklayın...',
    languages: 'Diller',
    languagesPlaceholder: 'örn., Türkçe (ana dil), İngilizce (akıcı), Almanca (orta)',
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
    cvUploadedWithProfile: 'CV yüklendi ve profil çıkarılan bilgilerle güncellendi',
    coverLetterUploaded: 'Ön yazı başarıyla yüklendi',
    
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
    
    // Chat translations
    aiCareerMentor: 'AI Kariyer Mentoru',
    yourPersonalCareerGuide: 'Kişisel Kariyer Rehberiniz',
    conversations: 'Konuşmalar',
    newConversation: 'Yeni Konuşma',
    noConversationsYet: 'Henüz konuşma yok',
    startChatting: 'Sohbete Başla',
    typeYourMessage: 'Kariyeriniz hakkında her şeyi sorun...',
    welcomeToCareerMentor: 'AI Kariyer Mentorunuza Hoş Geldiniz',
    careerMentor: 'Kariyer Mentoru',
    careerMentorDescription: 'Size kariyer tavsiyeleri, mülakat hazırlığı, CV geri bildirimi ve profesyonel rehberlik konularında yardımcı olmak için buradayım. Bir konuşma başlatalım!',
    startConversation: 'Konuşmayı Başlat',
    failedToCreateConversation: 'Konuşma oluşturulamadı',
    failedToSendMessage: 'Mesaj gönderilemedi',
    backToHome: 'Ana Sayfaya Dön',
    clear: 'Temizle',
    clearProfile: 'Profili Temizle',
    profileCleared: 'Profil başarıyla temizlendi',
    requiredFields: 'Gerekli alanlar eksik',
    requiredFieldsDescription: 'Lütfen en az adınızı ve e-postanızı doldurun',
    
    // Pricing
    pricing: 'Fiyatlandırma',
    pricingSubtitle: 'Profesyoneller için basit, şeffaf fiyatlandırma',
    mostPopular: 'En Popüler',
    professionalPlan: 'Profesyonel Plan',
    month: 'ay',
    unlimitedAccess: 'Tüm modlara sınırsız erişim',
    multiLanguageSupport: 'Tam çok dilli destek',
    unlimitedUploads: 'Sınırsız belge yükleme',
    editableOutput: 'Düzenlenebilir AI çıktısı ve indirmeler',
    unlimitedChatbot: 'Sınırsız kariyer chatbot erişimi',
    matchScoring: 'Eşleşme puanlama ve iyileştirme ipuçları',
    profileManagement: 'Kişisel profilleri kaydet ve yeniden kullan',
    startFreeTrial: 'Ücretsiz Deneme Başlat',
    noCommitment: 'Taahhüt yok, istediğiniz zaman iptal edin',
  },
};

// Global language state to force re-renders
let globalLanguage: Language = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('careercopilot-language');
    return (saved as Language) || 'nl';
  }
  return 'nl';
})();

const listeners: (() => void)[] = [];

// Language context hook
// Helper component to render CareerCopilot with styled "Copilot"
export function CareerCopilotText({ className = "" }: { className?: string }): JSX.Element {
  return React.createElement(
    'span', 
    { className }, 
    'Career',
    React.createElement('span', { className: 'text-primary' }, 'Copilot')
  );
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(globalLanguage);

  useEffect(() => {
    const listener = () => setLanguage(globalLanguage);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const t = (key: keyof typeof translations.nl): string => {
    const translation = translations[language]?.[key];
    return typeof translation === 'string' ? translation : key;
  };

  const switchLanguage = (newLanguage: Language) => {
    console.log('switchLanguage called with:', newLanguage);
    globalLanguage = newLanguage;
    localStorage.setItem('careercopilot-language', newLanguage);
    // Notify all listeners
    listeners.forEach(listener => listener());
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