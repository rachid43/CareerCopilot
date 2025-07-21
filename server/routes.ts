import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { storage } from "./storage";
import { insertProfileSchema, insertDocumentSchema, insertAiResultSchema } from "@shared/schema";
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function getSessionId(req: any): string {
  return req.sessionID || req.headers['x-session-id'] || 'default-session';
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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Profile endpoints
  app.get("/api/profile", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const profile = await storage.getProfile(sessionId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const profileData = insertProfileSchema.parse({ ...req.body, sessionId });
      
      const existingProfile = await storage.getProfile(sessionId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateProfile(sessionId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
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
  app.post("/api/documents/upload", upload.single('document'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sessionId = getSessionId(req);
      const { type } = req.body; // 'cv' or 'cover-letter'
      
      if (!type || !['cv', 'cover-letter'].includes(type)) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await parseDocument(req.file.path, req.file.mimetype);
      
      const documentData = insertDocumentSchema.parse({
        filename: req.file.originalname,
        content,
        type,
        sessionId
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to upload document: ${error.message}` });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const documents = await storage.getDocuments(sessionId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
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
  app.post("/api/ai/create", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { profile, jobDescription } = req.body;

      if (!profile || !jobDescription) {
        return res.status(400).json({ message: "Profile and job description are required" });
      }

      const prompt = `Generate a professional CV and cover letter based on the following information:

Profile:
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone}
Position: ${profile.position}
Skills: ${profile.skills}

Job Description:
${jobDescription}

Please create both a CV and cover letter tailored to this job. Return the response in JSON format with the following structure:
{
  "cv": "Complete CV content in plain text",
  "coverLetter": "Complete cover letter content in plain text"
}

Make the content professional, relevant to the job requirements, and well-formatted.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const aiResult = await storage.createAiResult({
        mode: 'create',
        input: JSON.stringify({ profile, jobDescription }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  app.post("/api/ai/review", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const documents = await storage.getDocuments(sessionId);
      
      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for review" });
      }

      const cvDoc = documents.find(doc => doc.type === 'cv');
      const coverLetterDoc = documents.find(doc => doc.type === 'cover-letter');

      let prompt = `Please review the following documents and provide detailed feedback:

`;

      if (cvDoc) {
        prompt += `CV/Resume:
${cvDoc.content}

`;
      }

      if (coverLetterDoc) {
        prompt += `Cover Letter:
${coverLetterDoc.content}

`;
      }

      prompt += `Please analyze these documents and provide feedback in JSON format with the following structure:
{
  "overallScore": 85,
  "strengths": ["List of strengths"],
  "improvements": ["List of improvement suggestions"],
  "summary": "Brief summary of the analysis"
}

Focus on professional formatting, content quality, clarity, and overall effectiveness.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

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

  app.post("/api/ai/assess", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { jobDescription } = req.body;
      const documents = await storage.getDocuments(sessionId);

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

      const prompt = `Compare the following CV against the job description and provide a match assessment:

Job Description:
${jobDescription}

CV:
${cvDoc.content}

Please analyze the match and provide assessment in JSON format with the following structure:
{
  "matchScore": 78,
  "skillsAnalysis": [
    {"skill": "React", "match": 100, "status": "excellent"},
    {"skill": "AWS", "match": 70, "status": "good"},
    {"skill": "Kubernetes", "match": 0, "status": "missing"}
  ],
  "recommendations": {
    "high": ["High priority recommendations"],
    "medium": ["Medium priority recommendations"]
  },
  "summary": "Brief summary of the assessment"
}

Provide a match score from 0-100, analyze key skills, and give specific improvement recommendations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

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

  const httpServer = createServer(app);
  return httpServer;
}
