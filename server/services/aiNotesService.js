const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const SYSTEM_PROMPT = `You are an expert AI study assistant that generates comprehensive learning materials from video transcripts. Analyze the transcript deeply and extract structured educational content. Return ONLY valid JSON, no markdown formatting, no code fences.`;

const getModel = (name = 'gemini-2.5-flash') => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: name });
};

async function generateContent(systemPrompt, userPrompt) {
  const model = getModel();
  if (!model) return null;
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
    });
    const text = result.response.text();
    return JSON.parse(text.replace(/```(?:json)?\s*/gi, '').trim());
  } catch (err) {
    return null;
  }
}

function buildTranscriptContext(transcript, duration, title) {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const wordCount = transcript.split(/\s+/).length;
  return `Video: "${title || 'Untitled'}"
Duration: ${minutes}m ${seconds}s
Transcript word count: ${wordCount}

Transcript:
${transcript}

Generate the requested learning materials based STRICTLY on this transcript content.`;
}

async function generateChapters(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Analyze the transcript and divide it into logical chapters/sections. For each chapter provide:
- title: A descriptive title for the chapter
- summary: 2-3 sentence summary of what this chapter covers
- startTime: Approximate start time in seconds from transcript timestamps
- endTime: Approximate end time in seconds

Return a JSON object: { "chapters": [{ "title": "...", "summary": "...", "startTime": 0, "endTime": 0 }] }
Aim for 4-8 chapters depending on content length.`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.chapters || [];
}

async function generateKeyConcepts(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Identify the most important concepts, terms, and ideas from this video. For each concept provide:
- concept: The name of the concept
- explanation: Clear explanation in 1-2 sentences
- importance: One of "low", "medium", "high", "critical"
- relatedConcepts: Array of related concept names (0-3)

Return a JSON object: { "keyConcepts": [{ "concept": "...", "explanation": "...", "importance": "medium", "relatedConcepts": [] }] }
Aim for 6-15 concepts depending on content density.`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.keyConcepts || [];
}

async function generateCodeSnippets(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Extract any code snippets, programming examples, or technical commands mentioned in the transcript. For each snippet provide:
- language: The programming language (e.g., "javascript", "python", "bash", "sql")
- code: The actual code block
- explanation: What this code does
- context: The broader context around this code

If no code is present, return an empty array.
Return a JSON object: { "codeSnippets": [{ "language": "...", "code": "...", "explanation": "...", "context": "..." }] }`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.codeSnippets || [];
}

async function generateFormulas(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Extract any mathematical formulas, equations, or scientific notations mentioned in the transcript. For each formula provide:
- formula: The formula/equation in plain text or LaTeX-like notation
- description: Plain English description of what the formula represents
- variables: Explanation of each variable in the formula
- context: The context where this formula is used

If no formulas are present, return an empty array.
Return a JSON object: { "formulas": [{ "formula": "...", "description": "...", "variables": "...", "context": "..." }] }`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.formulas || [];
}

async function generateFlashcards(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Create study flashcards based on the transcript content. Each flashcard should test understanding of key concepts. For each card provide:
- front: The question/prompt (what the learner sees first)
- back: The answer/explanation
- hint: A subtle hint to help recall
- tags: Array of topic tags (2-4)
- difficulty: One of "easy", "medium", "hard"

Make them progressively harder. Aim for 8-20 flashcards.
Return a JSON object: { "flashcards": [{ "front": "...", "back": "...", "hint": "...", "tags": ["..."], "difficulty": "medium" }] }`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.flashcards || [];
}

async function generateQuizQuestions(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Create multiple-choice quiz questions to test comprehension of the transcript. For each question provide:
- question: The question text
- options: Array of 4 possible answers (strings)
- correctAnswer: The index (0-3) of the correct option in the options array
- explanation: Brief explanation of why this is the correct answer
- difficulty: One of "easy", "medium", "hard"
- category: Topic category for this question

Mix difficulties. Aim for 5-15 questions.
Return a JSON object: { "quizQuestions": [{ "question": "...", "options": ["..."], "correctAnswer": 0, "explanation": "...", "difficulty": "medium", "category": "..." }] }`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.quizQuestions || [];
}

async function generateInterviewQuestions(transcript, duration, title) {
  const prompt = buildTranscriptContext(transcript, duration, title) + `

Create interview-style questions based on the content of this video, as if the interviewer is testing knowledge of this subject. For each question provide:
- question: The interview question
- answer: Model answer that demonstrates deep understanding
- difficulty: One of "easy", "medium", "hard"
- category: Topic category
- tips: Array of 1-3 tips for answering well
- expectedDuration: Expected answer time (e.g., "2-3 minutes")

Aim for 4-10 questions covering different aspects.
Return a JSON object: { "interviewQuestions": [{ "question": "...", "answer": "...", "difficulty": "medium", "category": "...", "tips": ["..."], "expectedDuration": "..." }] }`;

  const result = await generateContent(SYSTEM_PROMPT, prompt);
  return result?.interviewQuestions || [];
}

async function generateAllNotes(transcript, duration, title, options = {}) {
  const defaults = {
    includeChapters: true,
    includeConcepts: true,
    includeCode: true,
    includeFormulas: true,
    includeFlashcards: true,
    includeQuiz: true,
    includeInterview: true,
  };
  const opts = { ...defaults, ...options };

  if (!genAI) return generateFallbackNotes(transcript, duration, title, opts);

  const results = await Promise.allSettled([
    opts.includeChapters ? generateChapters(transcript, duration, title) : Promise.resolve([]),
    opts.includeConcepts ? generateKeyConcepts(transcript, duration, title) : Promise.resolve([]),
    opts.includeCode ? generateCodeSnippets(transcript, duration, title) : Promise.resolve([]),
    opts.includeFormulas ? generateFormulas(transcript, duration, title) : Promise.resolve([]),
    opts.includeFlashcards ? generateFlashcards(transcript, duration, title) : Promise.resolve([]),
    opts.includeQuiz ? generateQuizQuestions(transcript, duration, title) : Promise.resolve([]),
    opts.includeInterview ? generateInterviewQuestions(transcript, duration, title) : Promise.resolve([]),
  ]);

  return {
    chapters: results[0]?.value || [],
    keyConcepts: results[1]?.value || [],
    codeSnippets: results[2]?.value || [],
    formulas: results[3]?.value || [],
    flashcards: results[4]?.value || [],
    quizQuestions: results[5]?.value || [],
    interviewQuestions: results[6]?.value || [],
  };
}

function generateFallbackNotes(transcript, duration, title, opts) {
  const chapters = opts.includeChapters ? [
    { title: 'Introduction', summary: 'Opening of the video content.', startTime: 0, endTime: Math.floor(duration * 0.15) },
    { title: 'Main Content', summary: 'Core concepts and key information presented.', startTime: Math.floor(duration * 0.15), endTime: Math.floor(duration * 0.75) },
    { title: 'Examples & Applications', summary: 'Practical examples and real-world applications.', startTime: Math.floor(duration * 0.75), endTime: Math.floor(duration * 0.9) },
    { title: 'Summary', summary: 'Conclusion and key takeaways.', startTime: Math.floor(duration * 0.9), endTime: duration },
  ] : [];

  const keyConcepts = opts.includeConcepts ? [
    { concept: 'Core Topic', explanation: 'The main subject covered in this video.', importance: 'critical', relatedConcepts: [] },
    { concept: 'Key Principle', explanation: 'Important principle or methodology discussed.', importance: 'high', relatedConcepts: ['Core Topic'] },
    { concept: 'Practical Application', explanation: 'How the concepts are applied in real scenarios.', importance: 'medium', relatedConcepts: ['Core Topic'] },
  ] : [];

  const wordCount = transcript.split(/\s+/).length;
  const flashcardCount = Math.min(Math.max(Math.floor(wordCount / 200), 4), 12);

  const flashcards = opts.includeFlashcards ? Array.from({ length: flashcardCount }, (_, i) => ({
    front: `What is a key concept discussed in part ${i + 1}?`,
    back: `Review the section around timestamp ${Math.floor((duration / flashcardCount) * i / 60)}:${String(Math.floor((duration / flashcardCount) * i % 60)).padStart(2, '0')} for the answer.`,
    hint: `Focus on the main idea in that section.`,
    tags: ['video-content', `part-${i + 1}`],
    difficulty: i < flashcardCount / 3 ? 'easy' : i < (flashcardCount * 2) / 3 ? 'medium' : 'hard',
  })) : [];

  return {
    chapters,
    keyConcepts,
    codeSnippets: [],
    formulas: [],
    flashcards,
    quizQuestions: [],
    interviewQuestions: [],
  };
}

module.exports = {
  generateAllNotes,
  generateChapters,
  generateKeyConcepts,
  generateCodeSnippets,
  generateFormulas,
  generateFlashcards,
  generateQuizQuestions,
  generateInterviewQuestions,
};
