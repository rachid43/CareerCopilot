import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface InterviewContext {
  jobTitle: string;
  company: string;
  jobDescription: string;
  interviewType: 'behavioral' | 'technical' | 'situational' | 'mixed';
  difficultyLevel: 'junior' | 'mid' | 'senior';
  recruiterPersona: 'friendly' | 'formal' | 'challenging';
  language: string;
  currentQuestionIndex: number;
  previousQuestions: string[];
  previousAnswers: string[];
  cvContent?: string | null;
}

export class InterviewAI {
  
  async generateQuestion(context: InterviewContext): Promise<{
    question: string;
    questionType: string;
    expectedTopics: string[];
  }> {
    const { jobTitle, company, jobDescription, interviewType, difficultyLevel, recruiterPersona, language, currentQuestionIndex, previousQuestions, cvContent } = context;
    
    // Language mapping
    const languageMap = {
      'nl': 'Dutch',
      'en': 'English',
      'ar': 'Arabic', 
      'tr': 'Turkish'
    };
    const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';
    
    // Determine question type based on interview progression
    let questionType = 'behavioral';
    if (currentQuestionIndex === 0) {
      questionType = 'opening';
    } else if (currentQuestionIndex >= 8) {
      questionType = 'closing';
    } else {
      switch (interviewType) {
        case 'behavioral':
          questionType = Math.random() > 0.3 ? 'behavioral' : 'situational';
          break;
        case 'technical':
          questionType = Math.random() > 0.2 ? 'technical' : 'behavioral';
          break;
        case 'situational':
          questionType = Math.random() > 0.3 ? 'situational' : 'behavioral';
          break;
        case 'mixed':
          const types = ['behavioral', 'technical', 'situational'];
          questionType = types[Math.floor(Math.random() * types.length)];
          break;
      }
    }
    
    // Build recruiter persona context
    const personaContext = {
      friendly: "You are a warm, encouraging recruiter who asks questions with genuine interest and provides supportive follow-ups.",
      formal: "You are a professional, structured recruiter who asks precise questions and maintains a business-like tone throughout.",
      challenging: "You are a thorough recruiter who asks probing questions and seeks detailed examples to really test the candidate's capabilities."
    };
    
    const difficultyContext = {
      junior: "Focus on foundational knowledge, willingness to learn, and basic problem-solving abilities.",
      mid: "Focus on practical experience, leadership potential, and ability to work independently on complex tasks.",
      senior: "Focus on strategic thinking, mentorship abilities, architecture decisions, and industry expertise."
    };
    
    const prompt = `You are an AI recruiter conducting a ${interviewType} interview for a ${jobTitle} position at ${company}.

CONTEXT:
- Position: ${jobTitle}
- Company: ${company}
- Interview Type: ${interviewType}
- Difficulty: ${difficultyLevel}
- Your Persona: ${personaContext[recruiterPersona]}
- Question Number: ${currentQuestionIndex + 1}
- Expected Question Type: ${questionType}
- Language: Respond in ${responseLanguage}

JOB REQUIREMENTS:
${jobDescription.substring(0, 1000)}

${cvContent ? `CANDIDATE CV SUMMARY:
${cvContent.substring(0, 800)}

PERSONALIZATION: Use the candidate's CV to create targeted questions about their specific experience, skills, and achievements. Reference their background when relevant.` : ''}

DIFFICULTY FOCUS:
${difficultyContext[difficultyLevel]}

PREVIOUS QUESTIONS (avoid repetition):
${previousQuestions.join('\n')}

Generate a ${questionType} interview question that:
1. Is appropriate for the ${difficultyLevel} level
2. Relates to the job requirements
3. Matches your ${recruiterPersona} persona
4. Follows natural interview progression
5. Is different from previous questions
${cvContent ? '6. References or builds upon the candidate\'s CV experience when relevant' : ''}

Respond in JSON format:
{
  "question": "Your interview question in ${responseLanguage}",
  "questionType": "${questionType}",
  "expectedTopics": ["topic1", "topic2", "topic3"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are an expert AI recruiter specializing in conducting realistic job interviews. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating interview question:', error);
      return {
        question: "Can you tell me about yourself and what interests you about this role?",
        questionType: "opening",
        expectedTopics: ["background", "motivation", "interest"]
      };
    }
  }

  async evaluateAnswer(context: InterviewContext, question: string, answer: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
    strengths: string[];
    improvements: string[];
  }> {
    const { jobTitle, jobDescription, difficultyLevel, language } = context;
    
    const languageMap = {
      'nl': 'Dutch',
      'en': 'English', 
      'ar': 'Arabic',
      'tr': 'Turkish'
    };
    const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';

    const prompt = `Evaluate this interview answer for a ${jobTitle} position.

QUESTION: ${question}
ANSWER: ${answer}
POSITION LEVEL: ${difficultyLevel}
JOB CONTEXT: ${jobDescription.substring(0, 800)}

Evaluate based on:
1. Relevance to the question (25%)
2. Depth and specificity of examples (25%) 
3. Communication clarity (20%)
4. Job-relevant skills demonstration (20%)
5. Professional confidence (10%)

Score: 1-10 scale
Language: Respond in ${responseLanguage}

Provide JSON response:
{
  "score": 7,
  "feedback": "Detailed constructive feedback in ${responseLanguage}",
  "suggestions": ["Specific improvement suggestion 1", "suggestion 2"],
  "strengths": ["What was done well 1", "strength 2"],
  "improvements": ["Area for improvement 1", "area 2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are an expert interview evaluator providing constructive feedback. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 600
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 5,
        feedback: "Unable to evaluate answer at this time.",
        suggestions: ["Try providing more specific examples"],
        strengths: ["Responded to the question"],
        improvements: ["Add more detail and examples"]
      };
    }
  }

  async generateFinalFeedback(
    context: InterviewContext, 
    questions: string[], 
    answers: string[], 
    forcedStop?: boolean, 
    currentProgress?: { questionsAnswered: number; totalQuestions: number }
  ): Promise<{
    overallScore: number;
    summary: string;
    categoryScores: {
      communication: number;
      technical: number;
      cultural: number;
      experience: number;
    };
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }> {
    const { jobTitle, company, language, difficultyLevel } = context;
    
    const languageMap = {
      'nl': 'Dutch',
      'en': 'English',
      'ar': 'Arabic',
      'tr': 'Turkish'
    };
    const responseLanguage = languageMap[language as keyof typeof languageMap] || 'English';

    const qaText = questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i] || 'No answer provided'}`).join('\n\n');
    
    const stopInfo = forcedStop && currentProgress 
      ? `\n\nNOTE: Interview was stopped early after ${currentProgress.questionsAnswered} out of ${currentProgress.totalQuestions} questions.`
      : '';

    const prompt = `Provide comprehensive interview feedback for ${jobTitle} at ${company}.

INTERVIEW TRANSCRIPT:
${qaText}${stopInfo}

POSITION LEVEL: ${difficultyLevel}
LANGUAGE: Respond in ${responseLanguage}

Analyze and provide:
1. Overall interview performance
2. Category-specific scores (1-10)
3. Top strengths demonstrated
4. Key improvement areas  
5. Actionable recommendations

JSON format:
{
  "overallScore": 75,
  "summary": "Comprehensive interview summary in ${responseLanguage}",
  "categoryScores": {
    "communication": 8,
    "technical": 7, 
    "cultural": 6,
    "experience": 7
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"], 
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are an expert interview analyst providing comprehensive performance feedback. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating final feedback:', error);
      return {
        overallScore: 60,
        summary: "Interview completed successfully.",
        categoryScores: {
          communication: 6,
          technical: 6,
          cultural: 6,
          experience: 6
        },
        strengths: ["Participated actively", "Answered all questions"],
        improvements: ["Provide more specific examples", "Show more enthusiasm"],
        recommendations: ["Practice behavioral questions", "Research company culture"]
      };
    }
  }
}