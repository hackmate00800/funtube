const { GoogleGenerativeAI } = require('@google/generative-ai');
const Video = require('../models/Video');
const ErrorResponse = require('../utils/errorResponse');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const checkAI = () => {
  if (!genAI) {
    throw new ErrorResponse('Gemini API key not configured. Please set GEMINI_API_KEY in .env', 503);
  }
};

const model = (name = 'gemini-2.5-flash') => genAI.getGenerativeModel({ model: name });

async function parseJSON(content) {
  const cleaned = content.replace(/```(?:json)?\s*/gi, '').trim();
  return JSON.parse(cleaned);
}

async function generateContent(systemPrompt, userPrompt) {
  const m = model();
  const result = await m.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
  });
  return result.response.text();
}

exports.generateTitle = async (req, res, next) => {
  try {
    checkAI();
    const { description, tags, category } = req.body;

    const text = await generateContent(
      'You are a YouTube title generator. Generate 5 catchy, SEO-optimized video titles based on the given context. Return the result as a JSON array of strings with no markdown formatting.',
      `Generate 5 video titles. Context: Description: "${description}", Tags: ${tags?.join(', ')}, Category: ${category}`
    );

    const titles = await parseJSON(text);

    res.status(200).json({ success: true, data: titles });
  } catch (err) {
    next(new ErrorResponse('AI title generation failed', 500));
  }
};

exports.generateTags = async (req, res, next) => {
  try {
    checkAI();
    const { title, description, category } = req.body;

    const text = await generateContent(
      'You are a YouTube SEO expert. Generate 10-15 relevant tags for a video. Return the result as a JSON array of strings with no markdown formatting.',
      `Generate SEO tags for video titled "${title}". Description: "${description}", Category: ${category}`
    );

    const tags = await parseJSON(text);

    res.status(200).json({ success: true, data: tags });
  } catch (err) {
    next(new ErrorResponse('AI tag generation failed', 500));
  }
};

exports.generateThumbnailDescription = async (req, res, next) => {
  try {
    checkAI();
    const { title, description } = req.body;

    const text = await generateContent(
      'You are a thumbnail designer. Describe in detail what a YouTube thumbnail should look like for maximum click-through rate. Return a JSON object with "description" and "style" fields. No markdown formatting.',
      `Design a thumbnail for video titled "${title}". Context: ${description}`
    );

    const result = await parseJSON(text);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(new ErrorResponse('AI thumbnail suggestion failed', 500));
  }
};

exports.generateCaptions = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    res.status(200).json({
      success: true,
      message:
        'Caption generation queued. This feature requires audio transcription service.',
    });
  } catch (err) {
    next(err);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return next(new ErrorResponse('Messages array is required', 400));
    }

    if (genAI) {
      const m = model();
      let history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      while (history.length > 0 && history[0].role !== 'user') {
        history = history.slice(1);
      }
      const lastMsg = messages[messages.length - 1];

      const chat = m.startChat({
        history,
        systemInstruction: {
          role: 'user',
          parts: [
            {
              text: 'You are a helpful assistant for FunTube, a YouTube-like video platform. Help users with navigating the platform, creating content, growing their channel, and using features like video upload, quality selection, playlists, subscriptions, and analytics. Keep responses concise and friendly.',
            },
          ],
        },
      });

      const result = await chat.sendMessage(lastMsg.content);
      const reply = result.response.text();

      return res.status(200).json({
        success: true,
        data: { message: reply },
      });
    }

    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let reply = mockChatReply(lastMsg);

    res.status(200).json({
      success: true,
      data: { message: reply },
    });
  } catch (err) {
    next(new ErrorResponse('AI chat failed', 500));
  }
};

exports.moderateContent = async (req, res, next) => {
  try {
    checkAI();
    const { text } = req.body;

    const resultText = await generateContent(
      'You are a content moderation system. Analyze the given text and return a JSON object (no markdown) with "flagged" (boolean), "categories" (object with boolean fields: hate, harassment, sexual, violence, self-harm, spam), and "scores" (object with the same keys as numbers 0-1).',
      `Analyze this content for moderation: "${text}"`
    );

    const data = await parseJSON(resultText);

    res.status(200).json({
      success: true,
      data: {
        flagged: data.flagged || false,
        categories: data.categories || {},
        scores: data.scores || {},
      },
    });
  } catch (err) {
    next(new ErrorResponse('Content moderation failed', 500));
  }
};

function mockChatReply(msg) {
  if (msg.includes('upload') || msg.includes('video')) {
    return 'To upload a video, click the **+** button in the top navbar or go to the Upload page. Supported formats include MP4, WebM, and AVI. You can add a title, description, tags, and choose a thumbnail.';
  }
  if (msg.includes('quality') || msg.includes('resolution')) {
    return 'FunTube supports multiple video qualities! While watching a video, hover over the player and click the quality selector button (bottom-right) to switch between 144p, 240p, 360p, 480p, 720p, 1080p, and even 1440p.';
  }
  if (msg.includes('subscribe') || msg.includes('subscription')) {
    return 'You can subscribe to any creator by clicking the **Subscribe** button on their channel page or video. Your subscriptions feed shows the latest videos from channels you follow.';
  }
  if (msg.includes('channel') || msg.includes('create')) {
    return 'To create a channel, go to the sidebar and click **Create Channel**. You can upload a profile picture, cover image, and write a description. Once created, you\'ll get access to the Creator Dashboard with analytics.';
  }
  if (msg.includes('dashboard') || msg.includes('analytics')) {
    return 'The Creator Dashboard gives you insights into your video performance: views, likes, comments, subscriber growth, and more. Access it from the sidebar after creating a channel.';
  }
  if (msg.includes('playlist')) {
    return 'You can create playlists to organize your videos. Go to any video and use the **Save** button to add it to a playlist. You can also create new playlists from the Library page.';
  }
  if (msg.includes('comment')) {
    return 'Leave comments on any video by scrolling down below the player. You can also reply to other comments and like them. Keep the community friendly!';
  }
  if (msg.includes('library') || msg.includes('history') || msg.includes('later')) {
    return 'Your Library page shows your Liked Videos, Watch Later list, and Watch History. Access it from the sidebar. Videos you like are saved automatically, and you can add any video to Watch Later.';
  }
  if (msg.includes('theme') || msg.includes('dark') || msg.includes('light')) {
    return 'FunTube supports both dark and light themes. Toggle between them from the Settings page or using the theme switch in the navbar.';
  }
  if (msg.includes('language') || msg.includes('translate')) {
    return 'FunTube supports multiple languages! Go to Settings > Language to switch between English, Spanish, and French.';
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hey there! 👋 Welcome to FunTube. I\'m your AI assistant. Ask me anything about using the platform — uploading videos, creating a channel, subscriptions, and more!';
  }
  if (msg.includes('thank')) {
    return 'You\'re welcome! 😊 Let me know if you need anything else.';
  }

  return 'I\'m here to help you with FunTube! You can ask me about uploading videos, creating channels, subscriptions, video quality, playlists, comments, library features, themes, and more. What would you like to know?';
}
