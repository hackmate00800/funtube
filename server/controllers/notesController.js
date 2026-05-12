const Notes = require('../models/Notes');
const Video = require('../models/Video');
const Summary = require('../models/Summary');
const ErrorResponse = require('../utils/errorResponse');
const { generateAllNotes } = require('../services/aiNotesService');
const queue = require('../utils/queue');
const logger = require('../utils/logger');

exports.getNotes = async (req, res, next) => {
  try {
    const notes = await Notes.findOne({ video: req.params.videoId, user: req.user._id });
    res.json({ success: true, data: notes || null });
  } catch (err) {
    next(err);
  }
};

exports.listUserNotes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { videoTitle: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const notes = await Notes.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('video', 'title thumbnail duration');

    const total = await Notes.countDocuments(query);

    res.json({
      success: true,
      data: notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.generateNotes = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return next(new ErrorResponse('Video not found', 404));
    }

    let notes = await Notes.findOne({ video: video._id, user: req.user._id });

    if (notes && notes.status === 'completed') {
      notes.cached = true;
      notes.cachedAt = new Date();
      await notes.save();
      return res.json({ success: true, data: notes, cached: true });
    }

    if (notes && notes.status === 'generating') {
      return res.json({ success: true, data: notes, status: 'generating' });
    }

    const summary = await Summary.findOne({ video: video._id });
    const transcript = summary?.transcript;

    if (!transcript) {
      return next(new ErrorResponse('No transcript available. Generate a summary first.', 400));
    }

    const options = {
      includeChapters: req.body.includeChapters !== false,
      includeConcepts: req.body.includeConcepts !== false,
      includeCode: req.body.includeCode !== false,
      includeFormulas: req.body.includeFormulas !== false,
      includeFlashcards: req.body.includeFlashcards !== false,
      includeQuiz: req.body.includeQuiz !== false,
      includeInterview: req.body.includeInterview !== false,
    };

    if (!notes) {
      notes = await Notes.create({
        user: req.user._id,
        video: video._id,
        videoTitle: video.title,
        thumbnail: video.thumbnail,
        channelName: video.user?.username || 'Unknown',
        duration: video.duration || 0,
        status: 'generating',
        generationOptions: options,
      });
    } else {
      notes.status = 'generating';
      notes.generationOptions = options;
      await notes.save();
    }

    res.json({ success: true, data: notes, status: 'queued' });

    queue.add(`notes-${video._id}`, async (onProgress) => {
      try {
        onProgress({ stage: 'generating', progress: 10 });

        const result = await generateAllNotes(
          transcript,
          video.duration || summary.duration || 0,
          video.title,
          options
        );

        onProgress({ stage: 'saving', progress: 90 });

        notes.chapters = result.chapters;
        notes.keyConcepts = result.keyConcepts;
        notes.codeSnippets = result.codeSnippets;
        notes.formulas = result.formulas;
        notes.flashcards = result.flashcards;
        notes.quizQuestions = result.quizQuestions;
        notes.interviewQuestions = result.interviewQuestions;
        notes.status = 'completed';
        notes.cached = true;
        notes.cachedAt = new Date();
        notes.error = null;

        const conceptTags = result.keyConcepts.slice(0, 5).map(c => c.concept.toLowerCase().replace(/\s+/g, '-'));
        notes.tags = [...new Set(conceptTags)];

        await notes.save();
        onProgress({ progress: 100 });
      } catch (err) {
        logger.error('Notes generation failed:', err);
        notes.status = 'failed';
        notes.error = err.message;
        await notes.save();
        throw err;
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateNotes = async (req, res, next) => {
  try {
    const { customNotes, tags, flashcards, quizQuestions, interviewQuestions } = req.body;

    const notes = await Notes.findOne({ _id: req.params.notesId, user: req.user._id });
    if (!notes) {
      return next(new ErrorResponse('Notes not found', 404));
    }

    if (customNotes !== undefined) notes.customNotes = customNotes;
    if (tags !== undefined) notes.tags = tags;
    if (flashcards !== undefined) notes.flashcards = flashcards;
    if (quizQuestions !== undefined) notes.quizQuestions = quizQuestions;
    if (interviewQuestions !== undefined) notes.interviewQuestions = interviewQuestions;

    await notes.save();
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};

exports.updateFlashcard = async (req, res, next) => {
  try {
    const { cardIndex, ...updates } = req.body;
    const notes = await Notes.findOne({ _id: req.params.notesId, user: req.user._id });
    if (!notes) return next(new ErrorResponse('Notes not found', 404));
    if (!notes.flashcards[cardIndex]) return next(new ErrorResponse('Flashcard not found', 404));

    Object.assign(notes.flashcards[cardIndex], updates);
    await notes.save();
    res.json({ success: true, data: notes.flashcards[cardIndex] });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotes = async (req, res, next) => {
  try {
    const notes = await Notes.findOneAndDelete({ _id: req.params.notesId, user: req.user._id });
    if (!notes) return next(new ErrorResponse('Notes not found', 404));
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

exports.getNotesStatus = async (req, res, next) => {
  try {
    const notes = await Notes.findOne({ video: req.params.videoId, user: req.user._id });
    if (!notes) {
      return res.json({ success: true, status: 'none' });
    }
    res.json({
      success: true,
      status: notes.status,
      error: notes.error,
      videoTitle: notes.videoTitle,
      cached: notes.cached,
    });
  } catch (err) {
    next(err);
  }
};

exports.exportMarkdown = async (req, res, next) => {
  try {
    const notes = await Notes.findOne({ _id: req.params.notesId, user: req.user._id });
    if (!notes) return next(new ErrorResponse('Notes not found', 404));
    if (notes.status !== 'completed') return next(new ErrorResponse('Notes not ready', 400));

    const md = generateMarkdown(notes);
    const filename = `notes-${(notes.videoTitle || 'untitled').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(md);
  } catch (err) {
    next(err);
  }
};

function generateMarkdown(notes) {
  const lines = [];
  const title = notes.videoTitle || 'Untitled Video';
  const date = new Date().toLocaleDateString();

  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> AI-generated study notes from FunTube`);
  lines.push(`> Generated: ${date}`);
  if (notes.channelName) lines.push(`> Channel: ${notes.channelName}`);
  if (notes.duration) lines.push(`> Duration: ${Math.floor(notes.duration / 60)}m ${notes.duration % 60}s`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (notes.chapters?.length > 0) {
    lines.push('## 📖 Chapters');
    lines.push('');
    for (const ch of notes.chapters) {
      const start = ch.startTime != null ? `${Math.floor(ch.startTime / 60)}:${String(ch.startTime % 60).padStart(2, '0')}` : '';
      lines.push(`### ${start ? `[${start}] ` : ''}${ch.title}`);
      if (ch.summary) lines.push(`\n${ch.summary}\n`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (notes.keyConcepts?.length > 0) {
    lines.push('## 🔑 Key Concepts');
    lines.push('');
    for (const c of notes.keyConcepts) {
      const importance = { low: '📗', medium: '📙', high: '📘', critical: '📕' }[c.importance] || '📙';
      lines.push(`### ${importance} ${c.concept}`);
      lines.push(`\n${c.explanation}\n`);
      if (c.relatedConcepts?.length > 0) {
        lines.push(`*Related: ${c.relatedConcepts.join(', ')}*\n`);
      }
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (notes.codeSnippets?.length > 0) {
    lines.push('## 💻 Code Snippets');
    lines.push('');
    for (const s of notes.codeSnippets) {
      if (s.context) lines.push(`**Context:** ${s.context}\n`);
      lines.push(`\`\`\`${s.language || ''}`);
      lines.push(s.code);
      lines.push('```');
      if (s.explanation) lines.push(`\n> ${s.explanation}\n`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (notes.formulas?.length > 0) {
    lines.push('## 📐 Formulas');
    lines.push('');
    for (const f of notes.formulas) {
      lines.push(`### ${f.formula}`);
      if (f.description) lines.push(`\n${f.description}\n`);
      if (f.variables) lines.push(`\n**Variables:** ${f.variables}\n`);
      if (f.context) lines.push(`*Context: ${f.context}*\n`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (notes.flashcards?.length > 0) {
    lines.push('## 🃏 Flashcards');
    lines.push('');
    for (let i = 0; i < notes.flashcards.length; i++) {
      const card = notes.flashcards[i];
      const diff = { easy: '🟢', medium: '🟡', hard: '🔴' }[card.difficulty] || '🟡';
      lines.push(`### Card ${i + 1} ${diff}`);
      lines.push('');
      lines.push(`**Q:** ${card.front}`);
      lines.push('');
      lines.push(`<details><summary>Show Answer</summary>\n\n**A:** ${card.back}\n`);
      if (card.hint) lines.push(`\n> 💡 ${card.hint}`);
      lines.push('\n</details>');
      if (card.tags?.length > 0) lines.push(`\n*Tags: ${card.tags.join(', ')}*\n`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (notes.quizQuestions?.length > 0) {
    lines.push('## 📝 Quiz Questions');
    lines.push('');
    for (let i = 0; i < notes.quizQuestions.length; i++) {
      const q = notes.quizQuestions[i];
      const diff = { easy: '🟢', medium: '🟡', hard: '🔴' }[q.difficulty] || '🟡';
      lines.push(`### Question ${i + 1} ${diff}`);
      lines.push('');
      lines.push(`${q.question}`);
      lines.push('');
      for (let j = 0; j < (q.options || []).length; j++) {
        const prefix = j === q.correctAnswer ? '✅' : '   ';
        lines.push(`${prefix} ${j + 1}. ${q.options[j]}`);
      }
      lines.push('');
      lines.push(`<details><summary>Show Answer</summary>\n\n**Correct:** Option ${(q.correctAnswer || 0) + 1}\n`);
      if (q.explanation) lines.push(`\n> ${q.explanation}`);
      lines.push('\n</details>');
      if (q.category) lines.push(`\n*Category: ${q.category}*\n`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (notes.interviewQuestions?.length > 0) {
    lines.push('## 🎙️ Interview Questions');
    lines.push('');
    for (let i = 0; i < notes.interviewQuestions.length; i++) {
      const q = notes.interviewQuestions[i];
      const diff = { easy: '🟢', medium: '🟡', hard: '🔴' }[q.difficulty] || '🟡';
      lines.push(`### Q${i + 1}: ${q.question} ${diff}`);
      lines.push('');
      if (q.expectedDuration) lines.push(`*Expected: ${q.expectedDuration}*\n`);
      lines.push(`<details><summary>View Answer</summary>\n\n${q.answer}\n`);
      if (q.tips?.length > 0) {
        lines.push('\n**Tips:**');
        for (const tip of q.tips) lines.push(`- ${tip}`);
      }
      lines.push('\n</details>');
      if (q.category) lines.push(`\n*Category: ${q.category}*\n`);
    }
    lines.push('');
  }

  if (notes.customNotes) {
    lines.push('## 📝 Custom Notes');
    lines.push('');
    lines.push(notes.customNotes);
    lines.push('');
  }

  return lines.join('\n');
}
