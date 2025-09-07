import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Use service key for database operations to ensure proper access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }
  
  return user;
}

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

async function parseDocument(filePath, mimetype) {
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
  } catch (error) {
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

async function extractProfileFromCV(cvContent) {
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
  } catch (error) {
    console.error('Error extracting profile from CV:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || req.headers['Authorization'];
    const supabaseUser = await getUserFromToken(authHeader);
    
    // Look up local integer user ID using Supabase UUID as username
    const { data: localUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', supabaseUser.id)
      .single();
    
    let userId;
    
    if (userError || !localUser) {
      // Create local user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.first_name || '', // Use camelCase to match schema
          lastName: supabaseUser.user_metadata?.last_name || '', // Use camelCase to match schema
          supabaseUserId: supabaseUser.id // Use camelCase to match schema
        })
        .select('id')
        .single();
      
      if (createError || !newUser) {
        return res.status(404).json({ message: 'User not found and could not be created' });
      }
      userId = newUser.id;
    } else {
      userId = localUser.id;
    }

    // Handle file upload using multer middleware
    await new Promise((resolve, reject) => {
      upload.single('document')(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type } = req.body; // 'cv' or 'cover-letter'
    
    if (!type || !['cv', 'cover-letter'].includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Parse the document
    const content = await parseDocument(req.file.path, req.file.mimetype);

    // Store document in database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        userId: userId, // Use camelCase to match schema
        filename: req.file.originalname,
        content: content,
        type: type,
        sessionId: supabaseUser.id // Use camelCase to match schema
      })
      .select()
      .single();

    if (docError) {
      console.error('Database error:', docError);
      return res.status(500).json({ message: 'Failed to save document' });
    }

    // If this is a CV, extract profile information and update user profile
    if (type === 'cv') {
      try {
        const extractedProfile = await extractProfileFromCV(content);
        
        if (extractedProfile && (extractedProfile.name || extractedProfile.email || extractedProfile.phone || extractedProfile.position || extractedProfile.skills || extractedProfile.experience || extractedProfile.languages)) {
          // Check if user already has a profile
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('userId', userId) // Use camelCase to match schema
            .single();

          const profileData = {
            userId: userId, // Use camelCase to match schema
            sessionId: supabaseUser.id, // Use camelCase to match schema
            name: extractedProfile.name || existingProfile?.name || '',
            email: extractedProfile.email || existingProfile?.email || '',
            phone: extractedProfile.phone || existingProfile?.phone || '',
            position: extractedProfile.position || existingProfile?.position || '',
            skills: extractedProfile.skills || existingProfile?.skills || '',
            experience: extractedProfile.experience || existingProfile?.experience || '',
            languages: extractedProfile.languages ? JSON.stringify(extractedProfile.languages) : existingProfile?.languages || ''
          };

          // Upsert profile
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'userId' }); // Use camelCase to match schema

          if (upsertError) {
            console.error('Error updating profile:', upsertError);
          }
        }
      } catch (error) {
        console.error('Error in CV profile extraction:', error);
        // Don't fail the upload if profile extraction fails
      }
    }

    return res.status(200).json({
      id: document.id,
      filename: document.filename,
      type: document.type,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Upload API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}