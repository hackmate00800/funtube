const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const LEVEL_PROMPTS = {
  beginner: {
    system: 'You are a helpful tutor explaining video content to a beginner. Use simple language, avoid jargon, and explain concepts thoroughly. Return valid JSON only.',
    shortSummary: 'Summarize this transcript in 2-3 simple sentences for a beginner. Return JSON: {"shortSummary": "..."}',
    detailedSummary: 'Provide a detailed summary explaining every concept simply. Return JSON: {"detailedSummary": "..."}',
    bulletPoints: 'List 5-7 key points in very simple terms. Return JSON: {"bulletPoints": ["..."]}',
    timestamps: 'Create 3-5 clickable timestamps with beginner-friendly labels. Return JSON: {"timestamps": [{"time": seconds, "label": "...", "description": "..."}]}',
    faqs: 'Generate 3 FAQs a beginner would ask about this content. Return JSON: {"faqs": [{"question": "...", "answer": "..."}]}',
    revisionNotes: 'Create simple revision notes a beginner can study from. Return JSON: {"revisionNotes": ["..."]}',
  },
  intermediate: {
    system: 'You are a knowledgeable tutor explaining video content to an intermediate learner. Use appropriate terminology but explain key concepts clearly. Return valid JSON only.',
    shortSummary: 'Summarize this transcript in 3-4 concise sentences. Return JSON: {"shortSummary": "..."}',
    detailedSummary: 'Provide a comprehensive detailed summary with technical accuracy. Return JSON: {"detailedSummary": "..."}',
    bulletPoints: 'List 8-10 key technical points. Return JSON: {"bulletPoints": ["..."]}',
    timestamps: 'Create 5-8 timestamps with technical descriptions. Return JSON: {"timestamps": [{"time": seconds, "label": "...", "description": "..."}]}',
    faqs: 'Generate 4-5 FAQs covering technical aspects. Return JSON: {"faqs": [{"question": "...", "answer": "..."}]}',
    revisionNotes: 'Create detailed revision notes covering all important concepts. Return JSON: {"revisionNotes": ["..."]}',
  },
  expert: {
    system: 'You are an expert analyst reviewing video content for a professional audience. Use advanced terminology, cite specific details, and provide deep insights. Return valid JSON only.',
    shortSummary: 'Summarize this transcript in 2-3 dense, information-rich sentences for an expert audience. Return JSON: {"shortSummary": "..."}',
    detailedSummary: 'Provide an exhaustive technical analysis with advanced insights and critical evaluation. Return JSON: {"detailedSummary": "..."}',
    bulletPoints: 'List 10-15 advanced bullet points with specific technical details. Return JSON: {"bulletPoints": ["..."]}',
    timestamps: 'Create 8-12 precise timestamps with technical labels and insights. Return JSON: {"timestamps": [{"time": seconds, "label": "...", "description": "..."}]}',
    faqs: 'Generate 5-6 advanced FAQs with in-depth technical answers. Return JSON: {"faqs": [{"question": "...", "answer": "..."}]}',
    revisionNotes: 'Create comprehensive expert-level revision notes with advanced concepts and references. Return JSON: {"revisionNotes": ["..."]}',
  },
};

const generateWithGemini = async (systemPrompt, userPrompt) => {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
    });
    const text = result.response.text();
    const cleaned = text.replace(/```(?:json)?\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
};

const generateSection = async (level, field, transcript, duration) => {
  const config = LEVEL_PROMPTS[level];
  if (!config || !config[field]) return null;

  const contextPrompt = `Video duration: ${Math.floor(duration / 60)} min ${duration % 60} sec.\n\nTranscript:\n${transcript}\n\n${config[field]}`;
  const result = await generateWithGemini(config.system, contextPrompt);
  return result?.[field] || null;
};

const generateFullSummaryForLevel = async (level, transcript, duration) => {
  const config = LEVEL_PROMPTS[level];
  if (!config || !genAI) {
    return fallbackSummary(level, transcript, duration);
  }

  const userPrompt = `Video duration: ${Math.floor(duration / 60)} min ${duration % 60} sec.\n\nTranscript:\n${transcript}\n\nGenerate ALL of the following. Return a single JSON object with all fields:
{
  "shortSummary": "...",
  "detailedSummary": "...",
  "bulletPoints": ["..."],
  "timestamps": [{"time": seconds, "label": "...", "description": "..."}],
  "faqs": [{"question": "...", "answer": "..."}],
  "revisionNotes": ["..."]
}`;

  const result = await generateWithGemini(config.system, userPrompt);
  if (result) return result;
  return fallbackSummary(level, transcript, duration);
};

function fallbackSummary(level, transcript, duration) {
  const words = transcript.split(/\s+/).length;
  const minutes = Math.floor(duration / 60);
  const levelPrefix = level.charAt(0).toUpperCase() + level.slice(1);

  return {
    shortSummary: `${levelPrefix} summary of this ${minutes}-minute video (${words} words in transcript).`,
    detailedSummary: `This is a ${level}-level detailed summary generated from the video transcript. The video covers approximately ${minutes} minutes of content with ${words} words of spoken material.`,
    bulletPoints: [
      `Key concept explained in the video (${level} level)`,
      `Important takeaway for ${level} audience`,
      `Core principle demonstrated`,
      `Practical application discussed`,
      `Related topics mentioned`,
    ],
    timestamps: [
      { time: 0, label: 'Introduction', description: 'Video starts with introduction' },
      { time: Math.floor(duration * 0.25), label: 'Main Content', description: 'Key concepts explained' },
      { time: Math.floor(duration * 0.5), label: 'Deep Dive', description: 'Detailed analysis' },
      { time: Math.floor(duration * 0.75), label: 'Examples', description: 'Practical examples shown' },
      { time: Math.floor(duration * 0.9), label: 'Conclusion', description: 'Summary and wrap-up' },
    ],
    faqs: [
      { question: `What is the main topic of this video?`, answer: `The video covers content tailored for ${level} learners.` },
      { question: `Who is this video for?`, answer: `This content is designed for ${level} level audiences.` },
      { question: `What will I learn?`, answer: `Key concepts and practical applications related to the video topic.` },
    ],
    revisionNotes: [
      `${level}-level revision note 1: Core concept summary`,
      `${level}-level revision note 2: Key terminology explained`,
      `${level}-level revision note 3: Important relationships and connections`,
    ],
  };
}

module.exports = {
  generateFullSummaryForLevel,
  generateSection,
  LEVEL_PROMPTS,
};
