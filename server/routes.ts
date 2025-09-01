import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertDocumentSchema, insertAiResultSchema, insertUserInvitationSchema, insertChatConversationSchema, insertChatMessageSchema, insertJobApplicationSchema } from "@shared/schema";
import { sendEmailWithFallback, generateInvitationEmail } from "./emailServiceSMTP";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

function getSessionId(req: any): string {
  return req.sessionID || req.headers['x-session-id'] || 'default-session';
}

function getUserId(req: any): string {
  return req.user?.claims?.sub || 'anonymous';
}

// Superadmin middleware
const isSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUserByUsername(userId);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ message: "Superadmin access required" });
    }
    
    // Check if account is active and not expired
    if (!user.isActive || (user.accountExpiresAt && new Date() > user.accountExpiresAt)) {
      return res.status(403).json({ message: "Account inactive or expired" });
    }
    
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify admin privileges" });
  }
};

// Generate random token for invitations
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function parseDocument(filePath: string, mimetype: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    throw new Error('Unsupported file type');
  } catch (error: any) {
    throw new Error(`Failed to parse document: ${error.message}`);
  } finally {
    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function extractProfileFromCV(cvContent: string): Promise<any> {
  try {
    const prompt = `
Extract personal information from this CV/Resume content and return it in JSON format with these exact fields:
- name: Full name of the person
- email: Email address if found
- phone: Phone number if found
- position: Current or desired job title/position
- skills: Comma-separated list of key skills and technologies
- experience: Brief summary of key work experience and achievements
- languages: If languages are found, return as array: [{"language": "English", "proficiency": "Native"}, {"language": "Spanish", "proficiency": "Fluent"}]. If no languages found, return null.

IMPORTANT: For languages field:
- Only include languages that are clearly mentioned in the CV
- If proficiency level is not specified, use "Not specified" 
- If no languages are mentioned at all, return null
- Never use "undefined" values

If any information is not found, use null for that field.
Only return valid JSON, no additional text or explanations.

CV Content:
${cvContent}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert at extracting personal information from CVs. Always return valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response - handle markdown code blocks
    try {
      // Remove markdown code blocks if present
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const profileData = JSON.parse(cleanResult);
      return profileData;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', result);
      return null;
    }
  } catch (error: any) {
    console.error('Error extracting profile from CV:', error.message);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByUsername(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected profile endpoints
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId || userId === 'anonymous') {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log('Getting profile for userId:', userId);
      
      // Use user ID for profile isolation instead of session ID
      const profile = await storage.getProfileByUserId(userId);
      console.log('Retrieved profile:', profile);
      
      res.json(profile || null);
    } catch (error) {
      console.error('Error retrieving profile:', error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId || userId === 'anonymous') {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const sessionId = getSessionId(req);
      const profileData = insertProfileSchema.parse({ ...req.body, sessionId });
      
      const existingProfile = await storage.getProfileByUserId(userId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateProfileByUserId(userId, profileData);
      } else {
        profile = await storage.createProfileForUser(userId, profileData);
      }
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to save profile" });
      }
    }
  });

  // Document upload endpoints
  app.post("/api/documents/upload", isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sessionId = getSessionId(req);
      const userId = getUserId(req);
      const { type } = req.body; // 'cv' or 'cover-letter'
      
      if (!type || !['cv', 'cover-letter'].includes(type)) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await parseDocument(req.file.path, req.file.mimetype);
      
      // Get the actual user ID from the users table to ensure consistency
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const documentData = insertDocumentSchema.parse({
        filename: req.file.originalname,
        content,
        type,
        sessionId,
        userId: user.id // Use the actual user.id as number for consistency with database schema
      });

      console.log('About to create document with data:', { 
        filename: documentData.filename, 
        type: documentData.type, 
        userId: documentData.userId,
        sessionId: documentData.sessionId 
      });
      
      const document = await storage.createDocument(documentData);
      console.log('Created document:', { id: document.id, filename: document.filename, userId: document.userId });
      
      // If this is a CV, extract profile information and update user profile
      if (type === 'cv') {
        try {
          console.log('Starting CV profile extraction for user:', userId);
          const extractedProfile = await extractProfileFromCV(content);
          console.log('Extracted profile data:', extractedProfile);
          
          if (extractedProfile && (extractedProfile.name || extractedProfile.email || extractedProfile.phone || extractedProfile.position || extractedProfile.skills || extractedProfile.experience || extractedProfile.languages)) {
            // Check if user already has a profile
            const existingProfile = await storage.getProfileByUserId(userId);
            
            // Get the actual user ID from the users table
            const user = await storage.getUserByUsername(userId.toString());
            if (!user) {
              console.error('User not found for CV profile extraction:', userId);
              return;
            }

            // Only update fields that are empty in existing profile or create new profile
            const profileData: any = {
              userId: user.id, // Use the actual user.id from users table
              sessionId,
              name: extractedProfile.name || (existingProfile?.name || ''),
              email: extractedProfile.email || (existingProfile?.email || ''),
              phone: extractedProfile.phone || (existingProfile?.phone || ''),
              position: extractedProfile.position || (existingProfile?.position || ''),
              skills: extractedProfile.skills || (existingProfile?.skills || ''),
              experience: extractedProfile.experience || (existingProfile?.experience || ''),
              languages: extractedProfile.languages || (existingProfile?.languages || '')
            };

            // Remove empty fields to avoid overwriting existing data with empty values, but allow overriding with new extracted data
            Object.keys(profileData).forEach(key => {
              if (!profileData[key] && existingProfile && existingProfile[key as keyof typeof existingProfile]) {
                // Only use existing data if extracted data is truly empty, not just different
                if (key !== 'skills' && key !== 'name' && key !== 'email' && key !== 'phone' && key !== 'position') {
                  profileData[key] = existingProfile[key as keyof typeof existingProfile];
                }
              }
            });
            
            // Ensure extracted skills override existing empty skills
            if (extractedProfile.skills && extractedProfile.skills.trim()) {
              profileData.skills = extractedProfile.skills;
            }
            
            // Add experience and languages if extracted
            if (extractedProfile.experience && typeof extractedProfile.experience === 'string' && extractedProfile.experience.trim()) {
              profileData.experience = extractedProfile.experience;
            }
            if (extractedProfile.languages) {
              // Handle languages - could be string or array
              if (typeof extractedProfile.languages === 'string' && extractedProfile.languages.trim()) {
                profileData.languages = extractedProfile.languages;
              } else if (Array.isArray(extractedProfile.languages)) {
                // Convert array of language objects to string format
                const languageString = extractedProfile.languages
                  .filter((lang: any) => lang && lang.language && lang.language !== 'undefined' && lang.proficiency && lang.proficiency !== 'undefined')
                  .map((lang: any) => `${lang.language} (${lang.proficiency})`)
                  .join(', ');
                if (languageString) {
                  profileData.languages = languageString;
                } else {
                  profileData.languages = "not found";
                }
              }
            } else {
              profileData.languages = "not found";
            }

            console.log('About to save/update profile with data:', profileData);
            
            if (existingProfile) {
              console.log('Updating existing profile');
              await storage.updateProfileByUserId(user.id.toString(), profileData);
            } else {
              console.log('Creating new profile');
              const validatedProfileData = insertProfileSchema.parse(profileData);
              await storage.createProfile(validatedProfileData);
            }
            
            console.log('Profile save/update completed successfully');
          } else {
            console.log('No valid profile data extracted from CV');
          }
        } catch (profileError: any) {
          console.error('Failed to extract/update profile from CV:', profileError);
          // Don't fail the document upload if profile extraction fails
        }
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to upload document: ${error.message}` });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log('GET /api/documents - userId from getUserId:', userId);
      
      if (!userId || userId === 'anonymous') {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get the actual user ID from the users table to ensure consistency
      const user = await storage.getUserByUsername(userId.toString());
      console.log('Found user for documents retrieval:', user?.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('About to call storage.getDocumentsByUserId with userId (username):', userId);
      console.log('User object found:', user);
      const documents = await storage.getDocumentsByUserId(userId);
      console.log('Documents retrieved:', documents.length, 'documents:', documents.map(d => ({ id: d.id, filename: d.filename, type: d.type, userId: d.userId })));
      
      res.json(documents);
    } catch (error) {
      console.error('Error in GET /api/documents:', error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);
      if (success) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(404).json({ message: "Document not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // AI processing endpoints
  app.post("/api/ai/create", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const userId = getUserId(req);
      const { profile, jobDescription, hasDocuments, language = 'en' } = req.body;
      
      // Get the actual user ID from the users table to ensure consistency
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documents = await storage.getDocumentsByUserId(userId);

      // Language mapping
      const languageMap = {
        'nl': 'Dutch',
        'en': 'English', 
        'ar': 'Arabic',
        'tr': 'Turkish'
      };
      const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';

      // Check if we have either profile+jobDescription OR documents for improvement
      if (!profile && documents.length === 0) {
        return res.status(400).json({ message: "Profile or uploaded documents are required" });
      }

      let prompt: string;

      if (documents.length > 0) {
        // Improvement mode: enhance existing documents
        const cvDoc = documents.find(doc => doc.type === 'cv');
        const coverLetterDoc = documents.find(doc => doc.type === 'cover-letter');
        
        prompt = `LANGUAGE: ${responseLanguage}

CareerCopilot: Enhance documents using professional best practices.

${cvDoc ? `CV:\n${cvDoc.content.substring(0, 2000)}${cvDoc.content.length > 2000 ? '...' : ''}\n\n` : ''}${coverLetterDoc ? `COVER LETTER:\n${coverLetterDoc.content.substring(0, 1500)}${coverLetterDoc.content.length > 1500 ? '...' : ''}\n\n` : ''}${jobDescription ? `JOB:\n${jobDescription.substring(0, 1000)}${jobDescription.length > 1000 ? '...' : ''}\n\n` : ''}ENHANCE with:
- Professional structure & ATS optimization
- Strong action verbs & quantified results  
- ${jobDescription ? 'Job-specific tailoring' : 'Modern standards alignment'}

JSON response:
{
  "cv": "Enhanced CV",
  "coverLetter": "Enhanced cover letter", 
  "improvements": ["Key changes made"]
}`;
      } else {
        // Creation mode: generate from profile
        prompt = `LANGUAGE: ${responseLanguage}

Generate professional CV & cover letter.

PROFILE:
${profile.name} | ${profile.email} | ${profile.phone}
Position: ${profile.position}
Skills: ${profile.skills}

${jobDescription ? `JOB: ${jobDescription.substring(0, 800)}${jobDescription.length > 800 ? '...' : ''}` : 'Create general professional documents.'}

JSON format:
{
  "cv": "Professional CV in ${responseLanguage}",
  "coverLetter": "Tailored cover letter in ${responseLanguage}"
}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are CareerCopilot, an expert career advisor. Provide comprehensive, professional CV and cover letter content in the requested language. Be concise yet complete." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const aiResult = await storage.createAiResult({
        mode: 'create',
        input: JSON.stringify({ 
          profile, 
          jobDescription, 
          hasDocuments: documents.length > 0,
          documentTypes: documents.map(d => d.type)
        }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  app.post("/api/ai/review", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const sessionId = getSessionId(req);
      const { language = 'en' } = req.body;
      
      // Get the actual user ID from the users table to ensure consistency
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documents = await storage.getDocumentsByUserId(userId);
      
      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for review" });
      }

      const cvDoc = documents.find(doc => doc.type === 'cv');
      const coverLetterDoc = documents.find(doc => doc.type === 'cover-letter');

      // Language mapping
      const languageMap = {
        'nl': 'Dutch',
        'en': 'English', 
        'ar': 'Arabic',
        'tr': 'Turkish'
      };
      const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';

      let prompt = `LANGUAGE: ${responseLanguage}

CareerCopilot: Professional document analysis.

`;

      if (cvDoc) {
        prompt += `CV ANALYSIS (100 pts):
Format/Presentation (25): Structure, layout, consistency
Relevance (25): Keywords, industry alignment, quantified impact  
Experience (20): Chronological order, action-result format
Skills (15): Clear technical/soft skills, avoid buzzwords
Education (10): Relevant degrees, clear dates
Bonus (5): Projects, languages, portfolio links

CV Content:
${cvDoc.content.substring(0, 2500)}${cvDoc.content.length > 2500 ? '...' : ''}

`;
      }

      if (coverLetterDoc) {
        prompt += `COVER LETTER ANALYSIS CRITERIA:
✍️ Structure (30 points):
- Header with contact info and date
- Personalized greeting (avoid "To Whom It May Concern")
- Introduction: Position applied for and compelling hook
- Body: Short paragraphs highlighting fit, achievements, motivation
- Conclusion: Call to action and professional closing

💬 Tone & Language (25 points):
- Professional, confident, polite
- Avoids clichés and generic phrases
- Active voice and strong verbs

📣 Content Quality (45 points):
- Summarizes unique value proposition
- Shows interest in company/industry, not just the job
- Adds narrative/examples instead of restating CV
- Demonstrates company knowledge and cultural fit

Cover Letter Content:
${coverLetterDoc.content}

`;
      }

      // Optimize for speed: Concurrent analysis with shorter prompts
      const analysisPromises: Promise<any>[] = [];
      
      // CV Analysis (if exists)
      if (cvDoc) {
        analysisPromises.push(
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: `CV analyzer. Respond in ${responseLanguage} with JSON only.` },
              { role: "user", content: `Score CV (0-100) + 3 strengths + 3 improvements:
${cvDoc.content.substring(0, 1500)}

JSON: {"score":85, "strengths":[".."], "improvements":[".."], "summary":".."}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 800
          })
        );
      }

      // Cover Letter Analysis (if exists)  
      if (coverLetterDoc) {
        analysisPromises.push(
          openai.chat.completions.create({
            model: "gpt-4o", 
            messages: [
              { role: "system", content: `Cover letter analyzer. Respond in ${responseLanguage} with JSON only.` },
              { role: "user", content: `Score cover letter (0-100) + 3 strengths + 3 improvements:
${coverLetterDoc.content.substring(0, 1000)}

JSON: {"score":80, "strengths":[".."], "improvements":[".."], "summary":".."}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 700
          })
        );
      }

      // Wait for all analyses to complete concurrently
      const responses = await Promise.all(analysisPromises);
      
      // Parse results
      let cvAnalysis = null;
      let coverLetterAnalysis = null;
      let responseIndex = 0;
      
      if (cvDoc) {
        const cvResult = JSON.parse(responses[responseIndex].choices[0].message.content || '{}');
        cvAnalysis = {
          formatScore: Math.round(cvResult.score * 0.25) || 20,
          relevanceScore: Math.round(cvResult.score * 0.25) || 20, 
          experienceScore: Math.round(cvResult.score * 0.20) || 16,
          skillsScore: Math.round(cvResult.score * 0.15) || 12,
          educationScore: Math.round(cvResult.score * 0.10) || 8,
          bonusScore: Math.round(cvResult.score * 0.05) || 4,
          strengths: cvResult.strengths || ["Well-structured format", "Relevant experience", "Clear skills section"],
          improvements: cvResult.improvements || ["Add quantified achievements", "Include more keywords", "Improve layout consistency"],
          summary: cvResult.summary || "Professional CV with good foundation"
        };
        responseIndex++;
      }
      
      if (coverLetterDoc) {
        const clResult = JSON.parse(responses[responseIndex].choices[0].message.content || '{}');
        coverLetterAnalysis = {
          structureScore: Math.round(clResult.score * 0.30) || 24,
          toneScore: Math.round(clResult.score * 0.25) || 20,
          contentScore: Math.round(clResult.score * 0.45) || 36,
          strengths: clResult.strengths || ["Professional tone", "Clear structure", "Relevant content"],
          improvements: clResult.improvements || ["Add company research", "Include specific examples", "Strengthen conclusion"],
          summary: clResult.summary || "Well-written cover letter with good potential"
        };
      }

      // Calculate overall score
      let overallScore = 0;
      if (cvAnalysis && coverLetterAnalysis) {
        const cvTotal = cvAnalysis.formatScore + cvAnalysis.relevanceScore + cvAnalysis.experienceScore + cvAnalysis.skillsScore + cvAnalysis.educationScore + cvAnalysis.bonusScore;
        const clTotal = coverLetterAnalysis.structureScore + coverLetterAnalysis.toneScore + coverLetterAnalysis.contentScore;
        overallScore = Math.round((cvTotal + clTotal) / 2);
      } else if (cvAnalysis) {
        overallScore = cvAnalysis.formatScore + cvAnalysis.relevanceScore + cvAnalysis.experienceScore + cvAnalysis.skillsScore + cvAnalysis.educationScore + cvAnalysis.bonusScore;
      } else if (coverLetterAnalysis) {
        overallScore = coverLetterAnalysis.structureScore + coverLetterAnalysis.toneScore + coverLetterAnalysis.contentScore;
      }

      const result = {
        overallScore,
        ...(cvAnalysis && { cvAnalysis }),
        ...(coverLetterAnalysis && { coverLetterAnalysis })
      };

      const aiResult = await storage.createAiResult({
        mode: 'review',
        input: JSON.stringify({ documents: documents.map(d => ({ type: d.type, filename: d.filename })) }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  app.post("/api/ai/assess", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const sessionId = getSessionId(req);
      const { jobDescription, language = 'en' } = req.body;
      
      // Get the actual user ID from the users table to ensure consistency
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documents = await storage.getDocumentsByUserId(userId);

      if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" });
      }

      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for assessment" });
      }

      const cvDoc = documents.find(doc => doc.type === 'cv');
      
      if (!cvDoc) {
        return res.status(400).json({ message: "CV is required for assessment" });
      }

      const coverLetterDoc = documents.find(doc => doc.type === 'cover-letter');
      
      // Language mapping
      const languageMap = {
        'nl': 'Dutch',
        'en': 'English', 
        'ar': 'Arabic',
        'tr': 'Turkish'
      };
      const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';

      let prompt = `You are CareerCopilot conducting a comprehensive job match assessment. Analyze alignment between the candidate's documents and job requirements.

IMPORTANT: Respond in ${responseLanguage} language. All feedback, recommendations, and analysis should be provided in ${responseLanguage}.

JOB DESCRIPTION:
${jobDescription}

CV/RESUME:
${cvDoc.content}

`;

      if (coverLetterDoc) {
        prompt += `COVER LETTER:
${coverLetterDoc.content}

COVER LETTER ALIGNMENT ASSESSMENT:
🔍 Tailoring & Relevance (40 points):
- Mentions company name, role title, specific job requirements
- References exact qualifications/responsibilities from job ad
- Highlights how applicant meets/exceeds key requirements

🎯 Keyword Matching (30 points):
- Uses role-specific terms and industry language from job description
- Reflects skills, technologies, methodologies mentioned in posting

💼 Fit & Motivation (30 points):
- Expresses why applicant wants THIS role at THIS company
- Demonstrates alignment with company values/mission

`;
      }

      // Optimize for speed: Concurrent analysis with focused prompts
      const assessmentPromises: Promise<any>[] = [];
      
      // CV-Job Match Analysis
      assessmentPromises.push(
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `Job match analyzer. Respond in ${responseLanguage} with JSON only.` },
            { role: "user", content: `Match CV to job (0-100 score) + missing skills + recommendations:
JOB: ${jobDescription.substring(0, 800)}
CV: ${cvDoc.content.substring(0, 1500)}

JSON: {"score":75, "foundSkills":[".."], "missingSkills":[".."], "recommendations":[".."], "summary":".."}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 900
        })
      );

      // Cover Letter Analysis (if exists)
      if (coverLetterDoc) {
        assessmentPromises.push(
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: `Cover letter-job alignment analyzer. Respond in ${responseLanguage} with JSON only.` },
              { role: "user", content: `Score cover letter alignment to job (0-100) + improvements:
JOB: ${jobDescription.substring(0, 600)}
COVER LETTER: ${coverLetterDoc.content.substring(0, 800)}

JSON: {"score":80, "strengths":[".."], "improvements":[".."], "summary":".."}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 700
          })
        );
      }

      // Wait for all assessments to complete concurrently
      const responses = await Promise.all(assessmentPromises);
      
      // Parse CV-Job match result
      const cvMatchResult = JSON.parse(responses[0].choices[0].message.content || '{}');
      
      // Parse cover letter result (if exists)
      let coverLetterResult = null;
      if (coverLetterDoc && responses.length > 1) {
        coverLetterResult = JSON.parse(responses[1].choices[0].message.content || '{}');
      }

      // Build comprehensive result structure
      const result = {
        matchScore: cvMatchResult.score || 75,
        skillsMatch: {
          score: cvMatchResult.score || 75,
          foundSkills: cvMatchResult.foundSkills || ["Relevant technical skills", "Industry experience"],
          missingSkills: cvMatchResult.missingSkills || ["Specific certification", "Advanced framework"],
          recommendations: cvMatchResult.recommendations || ["Highlight quantified achievements", "Add missing keywords"]
        },
        experienceAlignment: {
          score: Math.round((cvMatchResult.score || 75) * 0.9),
          relevantExperience: ["Professional background aligns with role requirements"],
          gaps: ["Could benefit from more specific industry experience"],
          recommendations: ["Emphasize transferable skills", "Add project examples"]
        },
        educationMatch: {
          score: Math.round((cvMatchResult.score || 75) * 1.1),
          matches: ["Educational background supports role"],
          missing: [],
          recommendations: ["Highlight relevant coursework or certifications"]
        },
        keywordOptimization: {
          score: Math.round((cvMatchResult.score || 75) * 0.8),
          presentKeywords: cvMatchResult.foundSkills?.slice(0, 3) || ["job-relevant", "industry-specific"],
          missingKeywords: cvMatchResult.missingSkills?.slice(0, 3) || ["optimization", "specific-tech"],
          recommendations: ["Include more job-specific terminology", "Use exact phrases from job description"]
        },
        ...(coverLetterResult && {
          coverLetterAlignment: {
            tailoringScore: Math.round((coverLetterResult.score || 80) * 0.35),
            keywordScore: Math.round((coverLetterResult.score || 80) * 0.30),
            fitScore: Math.round((coverLetterResult.score || 80) * 0.35),
            strengths: coverLetterResult.strengths || ["Professional tone", "Clear structure"],
            improvements: coverLetterResult.improvements || ["Add company-specific details", "Include concrete examples"]
          }
        }),
        overallRecommendations: [
          ...(cvMatchResult.recommendations || []).slice(0, 2),
          ...(coverLetterResult?.improvements || []).slice(0, 1)
        ],
        summary: `Match score: ${cvMatchResult.score || 75}%. ${cvMatchResult.summary || 'Good alignment with some areas for improvement.'}`
      };

      const aiResult = await storage.createAiResult({
        mode: 'assess',
        input: JSON.stringify({ jobDescription, cvFilename: cvDoc.filename }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  // Superadmin routes
  
  // Get all users (superadmin only)
  app.get("/api/admin/users", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Update user status (activate/deactivate)
  app.patch("/api/admin/users/:id", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive, accountExpiresAt } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { 
        isActive,
        accountExpiresAt: accountExpiresAt ? new Date(accountExpiresAt) : undefined
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Send user invitation
  app.post("/api/admin/invite", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { email } = req.body;
      const currentUser = req.currentUser;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
      
      // Create invitation
      const invitation = await storage.createInvitation({
        email,
        token,
        expiresAt,
        isUsed: false,
        invitedBy: currentUser.id
      });
      
      // Send email
      const emailParams = generateInvitationEmail(
        email, 
        token, 
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username
      );
      
      const emailSent = await sendEmailWithFallback(emailParams);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send invitation email" });
      }
      
      res.json({ 
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to send invitation: ${error.message}` });
    }
  });
  
  // Get active invitations
  app.get("/api/admin/invitations", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const invitations = await storage.getActiveInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  
  // Test Hostinger SMTP (for debugging)
  app.post("/api/test-email", async (req, res) => {
    try {
      console.log('Testing Hostinger SMTP...');
      const testEmailParams = {
        to: 'test@example.com',
        from: process.env.SMTP_USER || 'info@maptheorie.nl',
        subject: 'Hostinger SMTP Test',
        text: 'Testing Hostinger SMTP email delivery.',
      };
      
      const emailSent = await sendEmailWithFallback(testEmailParams);
      
      res.json({ 
        success: emailSent,
        message: emailSent ? "Email sent successfully" : "Email failed - check logs"
      });
    } catch (error: any) {
      console.error('Email test error:', error);
      res.status(500).json({ message: `Test failed: ${error.message}` });
    }
  });

  // Test SendGrid configuration (for debugging)
  app.post("/api/admin/test-sendgrid", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { testEmail } = req.body;
      const emailToUse = testEmail || 'test@example.com';
      
      const testEmailParams = {
        to: emailToUse,
        from: process.env.SMTP_USER || 'info@maptheorie.nl',
        subject: 'Hostinger SMTP Test - CareerCopilot',
        text: 'This is a test email to verify Hostinger SMTP configuration is working properly.',
        html: '<h3>Hostinger SMTP Test</h3><p>This is a test email to verify Hostinger SMTP configuration is working properly.</p>'
      };
      
      console.log('Testing Hostinger SMTP configuration...');
      console.log('SMTP Host exists:', !!process.env.SMTP_HOST);
      console.log('SMTP User:', process.env.SMTP_USER);
      console.log('From email:', testEmailParams.from);
      console.log('Test email to:', emailToUse);
      
      // Actually attempt to send the test email
      const emailSent = await sendEmailWithFallback(testEmailParams);
      
      if (emailSent) {
        res.json({ 
          message: "SendGrid test email sent successfully!",
          config: {
            hasApiKey: !!process.env.SENDGRID_API_KEY,
            fromEmail: testEmailParams.from,
            apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10),
            testEmailSent: true,
            sentTo: emailToUse
          }
        });
      } else {
        res.status(500).json({ 
          message: "SendGrid test email failed to send - check server logs for details",
          config: {
            hasApiKey: !!process.env.SENDGRID_API_KEY,
            fromEmail: testEmailParams.from,
            apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10),
            testEmailSent: false
          }
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: `SendGrid test failed: ${error.message}` });
    }
  });

  // Accept invitation and create account
  app.post("/api/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName } = req.body;
      
      const invitation = await storage.getInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }
      
      if (invitation.isUsed) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create user account
      const accountExpiry = new Date();
      accountExpiry.setDate(accountExpiry.getDate() + 30); // 30 days active
      
      const newUser = await storage.createUser({
        username: invitation.email,
        email: invitation.email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'user',
        isActive: true,
        accountExpiresAt: accountExpiry
      });
      
      // Mark invitation as used
      await storage.markInvitationAsUsed(token);
      
      res.json({ 
        message: "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to create account: ${error.message}` });
    }
  });

  // Chat API Routes
  app.get("/api/chat/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const conversations = await storage.getConversations(user.id);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to get conversations: ${error.message}` });
    }
  });

  app.post("/api/chat/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { title = "New Conversation" } = req.body;
      
      const conversation = await storage.createConversation({
        userId: user.id,
        title
      });
      
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to create conversation: ${error.message}` });
    }
  });

  app.get("/api/chat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to get messages: ${error.message}` });
    }
  });

  app.post("/api/chat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, role = "user", language = 'en' } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content
      });
      
      // Generate AI response
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      const profile = user ? await storage.getProfileByUserId(userId) : null;
      
      // Language mapping for AI responses
      const languageMap = {
        'nl': 'Dutch',
        'en': 'English', 
        'ar': 'Arabic',
        'tr': 'Turkish'
      };
      const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';
      
      const prompt = `You are CareerCopilot, a friendly AI career mentor and advisor. Respond in ${responseLanguage}.

USER CONTEXT:
${profile ? `Name: ${profile.name}
Position: ${profile.position || 'Not specified'}
Skills: ${profile.skills || 'Not specified'}
Email: ${profile.email}` : 'Profile not available'}

INSTRUCTIONS:
- Provide helpful, encouraging career advice
- Be friendly, supportive, and professional
- Ask follow-up questions to understand needs better
- Offer specific, actionable guidance
- Keep responses concise but informative
- Use encouraging emojis occasionally to be more personable

USER MESSAGE: ${content}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are CareerCopilot, a friendly AI career mentor. Always respond in ${responseLanguage} and be encouraging and helpful.` },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = response.choices[0].message.content || "Sorry, I couldn't generate a response.";
      
      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiResponse
      });
      
      // Auto-update conversation title if it's the first exchange
      const messages = await storage.getConversationMessages(conversationId);
      if (messages.length <= 2) {
        const titlePrompt = `Generate a short conversation title (2-4 words) for this career mentoring topic: "${content}". Respond only with the title, no quotes.`;
        
        const titleResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: titlePrompt }],
          temperature: 0.3,
          max_tokens: 50
        });
        
        const title = titleResponse.choices[0].message.content?.trim() || "Career Chat";
        await storage.updateConversationTitle(conversationId, title);
      }
      
      res.json({ userMessage, aiMessage });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to send message: ${error.message}` });
    }
  });

  // Job Applications Tracker routes
  
  // Get all job applications for current user
  app.get("/api/job-applications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const applications = await storage.getJobApplications(user.id);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to fetch job applications: ${error.message}` });
    }
  });
  
  // Create new job application
  app.post("/api/job-applications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body
      const validationResult = insertJobApplicationSchema.safeParse({
        ...req.body,
        userId: user.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: fromZodError(validationResult.error).toString()
        });
      }
      
      const application = await storage.createJobApplication(validationResult.data);
      res.status(201).json(application);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to create job application: ${error.message}` });
    }
  });
  
  // Update job application
  app.put("/api/job-applications/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      const applicationId = parseInt(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request body (partial update)
      const updateSchema = insertJobApplicationSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: fromZodError(validationResult.error).toString()
        });
      }
      
      const updatedApplication = await storage.updateJobApplication(applicationId, validationResult.data);
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Job application not found" });
      }
      
      res.json(updatedApplication);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to update job application: ${error.message}` });
    }
  });
  
  // Delete job application
  app.delete("/api/job-applications/:id", isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const success = await storage.deleteJobApplication(applicationId);
      
      if (!success) {
        return res.status(404).json({ message: "Job application not found" });
      }
      
      res.json({ message: "Job application deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to delete job application: ${error.message}` });
    }
  });
  
  // Get job applications dashboard summary
  app.get("/api/job-applications/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const applications = await storage.getJobApplications(user.id);
      
      // Calculate dashboard statistics
      const totalApplications = applications.length;
      const responses = applications.filter(app => app.response && app.response !== 'No Response');
      const interviews = applications.filter(app => app.response === 'Interview');
      const offers = applications.filter(app => app.response === 'Offer');
      const rejections = applications.filter(app => app.response === 'Rejected');
      
      // Calculate follow-up reminders (45+ days without response)
      const now = new Date();
      const followUpReminders = applications.filter(app => {
        if (app.response && app.response !== 'No Response') return false;
        const applyDate = new Date(app.applyDate);
        const daysSinceApplication = Math.floor((now.getTime() - applyDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceApplication >= 45;
      });
      
      // Calculate late follow-ups (60+ days without response)
      const lateFollowUps = applications.filter(app => {
        if (app.response && app.response !== 'No Response') return false;
        const applyDate = new Date(app.applyDate);
        const daysSinceApplication = Math.floor((now.getTime() - applyDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceApplication >= 60;
      });
      
      const summary = {
        totalApplications,
        totalResponses: responses.length,
        interviews: interviews.length,
        offers: offers.length,
        rejections: rejections.length,
        pendingResponse: totalApplications - responses.length,
        followUpReminders: followUpReminders.length,
        lateFollowUps: lateFollowUps.length,
        responseRate: totalApplications > 0 ? Math.round((responses.length / totalApplications) * 100) : 0,
        interviewRate: totalApplications > 0 ? Math.round((interviews.length / totalApplications) * 100) : 0,
        offerRate: totalApplications > 0 ? Math.round((offers.length / totalApplications) * 100) : 0
      };
      
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to fetch dashboard data: ${error.message}` });
    }
  });

  // Mock Interview routes
  app.get("/api/interviews/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For now, return empty sessions - this will be expanded when we add session persistence
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interview sessions" });
    }
  });

  app.post("/api/interviews/start", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { jobTitle, company, jobDescription, interviewType, difficultyLevel, recruiterPersona, language, cvContent } = req.body;
      
      // Validate required fields
      if (!jobTitle || !company || !interviewType || !difficultyLevel || !recruiterPersona) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Import InterviewAI dynamically
      const { InterviewAI } = await import('./interview-ai');
      const interviewAI = new InterviewAI();

      // Generate first question
      const context = {
        jobTitle,
        company,
        jobDescription: jobDescription || '',
        interviewType,
        difficultyLevel,
        recruiterPersona,
        language: language || 'en',
        currentQuestionIndex: 0,
        previousQuestions: [],
        previousAnswers: [],
        cvContent: cvContent || null
      };

      const firstQuestion = await interviewAI.generateQuestion(context);

      // Create interview session data
      const sessionData = {
        id: Date.now().toString(),
        userId: user.id,
        jobTitle,
        company,
        jobDescription,
        interviewType,
        difficultyLevel,
        recruiterPersona,
        language: language || 'en',
        status: 'active',
        startedAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        questions: [firstQuestion],
        answers: [],
        context
      };

      res.json({
        session: sessionData,
        currentQuestion: firstQuestion
      });
    } catch (error: any) {
      console.error('Error starting interview:', error);
      res.status(500).json({ message: `Failed to start interview: ${error.message}` });
    }
  });

  app.post("/api/interviews/:sessionId/answer", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answer, questionIndex } = req.body;
      
      if (!answer) {
        return res.status(400).json({ message: "Answer is required" });
      }

      // For now, we'll work with session data in memory
      // In a full implementation, this would be stored in database
      
      // Import InterviewAI
      const { InterviewAI } = await import('./interview-ai');
      const interviewAI = new InterviewAI();

      // Mock session context - in real app this would be retrieved from database
      const context = {
        jobTitle: req.body.jobTitle || 'Software Engineer',
        company: req.body.company || 'Tech Company',
        jobDescription: req.body.jobDescription || '',
        interviewType: req.body.interviewType || 'behavioral',
        difficultyLevel: req.body.difficultyLevel || 'mid',
        recruiterPersona: req.body.recruiterPersona || 'friendly',
        language: req.body.language || 'en',
        currentQuestionIndex: questionIndex + 1,
        previousQuestions: req.body.previousQuestions || [],
        previousAnswers: [...(req.body.previousAnswers || []), answer],
        cvContent: req.body.cvContent || null
      };

      // Evaluate the answer
      const evaluation = await interviewAI.evaluateAnswer(
        context,
        req.body.previousQuestions?.[questionIndex] || 'Tell me about yourself',
        answer
      );

      // Check if interview should continue (max 10 questions)
      let nextQuestion = null;
      if (context.currentQuestionIndex < 10) {
        nextQuestion = await interviewAI.generateQuestion(context);
      }

      res.json({
        evaluation,
        nextQuestion,
        isComplete: context.currentQuestionIndex >= 10,
        questionIndex: context.currentQuestionIndex
      });

    } catch (error: any) {
      console.error('Error processing interview answer:', error);
      res.status(500).json({ message: `Failed to process answer: ${error.message}` });
    }
  });

  app.post("/api/interviews/:sessionId/complete", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { questions, answers, context } = req.body;

      // Import InterviewAI
      const { InterviewAI } = await import('./interview-ai');
      const interviewAI = new InterviewAI();

      // Generate final feedback
      const finalFeedback = await interviewAI.generateFinalFeedback(context, questions, answers);

      res.json({
        feedback: finalFeedback,
        sessionId,
        completedAt: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error completing interview:', error);
      res.status(500).json({ message: `Failed to complete interview: ${error.message}` });
    }
  });

  // Simple CV upload for Mock Interview feature
  app.post("/api/upload", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse the CV content
      const content = await parseDocument(req.file.path, req.file.mimetype);
      
      res.json({
        filename: req.file.originalname,
        content: content
      });
    } catch (error: any) {
      console.error('Error uploading CV for interview:', error);
      res.status(500).json({ message: `Failed to process CV: ${error.message}` });
    }
  });

  // Download interview report as DOCX
  app.post("/api/interviews/:sessionId/download", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { feedback, questions, answers, sessionData } = req.body;
      
      if (!feedback || !questions || !answers || !sessionData) {
        return res.status(400).json({ message: "Missing interview data" });
      }

      const { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel } = await import('docx');

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "CareerCopilot Mock Interview Report",
                  bold: true,
                  size: 32
                })
              ]
            }),
            new Paragraph({ text: "" }),
            
            // Interview Details
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Interview Details", bold: true })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Position: ${sessionData.jobTitle}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Company: ${sessionData.company}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Interview Type: ${sessionData.interviewType}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Difficulty Level: ${sessionData.difficultyLevel}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Date: ${new Date(sessionData.startedAt).toLocaleDateString()}` })]
            }),
            new Paragraph({ text: "" }),

            // Overall Score
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Overall Performance", bold: true })]
            }),
            new Paragraph({
              children: [new TextRun({ 
                text: `Overall Score: ${feedback.overallScore}/100`, 
                bold: true, 
                size: 24 
              })]
            }),
            new Paragraph({
              children: [new TextRun({ text: feedback.summary })]
            }),
            new Paragraph({ text: "" }),

            // Category Scores
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: "Category Scores", bold: true })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Communication: ${feedback.categoryScores.communication}/10` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Technical: ${feedback.categoryScores.technical}/10` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Cultural Fit: ${feedback.categoryScores.cultural}/10` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Experience: ${feedback.categoryScores.experience}/10` })]
            }),
            new Paragraph({ text: "" }),

            // Q&A Section
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Interview Questions & Answers", bold: true })]
            }),
            
            ...questions.flatMap((question: string, index: number) => [
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: `Question ${index + 1}`, bold: true })]
              }),
              new Paragraph({
                children: [new TextRun({ text: question })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "Answer:", bold: true })]
              }),
              new Paragraph({
                children: [new TextRun({ text: answers[index] || "No answer provided" })]
              }),
              new Paragraph({ text: "" })
            ]),

            // Strengths
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Strengths", bold: true })]
            }),
            ...feedback.strengths.map((strength: string) => 
              new Paragraph({
                children: [new TextRun({ text: `• ${strength}` })]
              })
            ),
            new Paragraph({ text: "" }),

            // Improvements
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Areas for Improvement", bold: true })]
            }),
            ...feedback.improvements.map((improvement: string) => 
              new Paragraph({
                children: [new TextRun({ text: `• ${improvement}` })]
              })
            ),
            new Paragraph({ text: "" }),

            // Recommendations
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Recommendations", bold: true })]
            }),
            ...feedback.recommendations.map((recommendation: string) => 
              new Paragraph({
                children: [new TextRun({ text: `• ${recommendation}` })]
              })
            )
          ]
        }]
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      
      // Set response headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="Interview_Report_${sessionData.jobTitle}_${Date.now()}.docx"`);
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
      
    } catch (error: any) {
      console.error('Error generating interview report:', error);
      res.status(500).json({ message: `Failed to generate report: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
