const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String },
  startTime: { type: Number },
  endTime: { type: Number },
}, { _id: false });

const KeyConceptSchema = new mongoose.Schema({
  concept: { type: String, required: true },
  explanation: { type: String },
  importance: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  relatedConcepts: [{ type: String }],
}, { _id: false });

const CodeSnippetSchema = new mongoose.Schema({
  language: { type: String },
  code: { type: String },
  explanation: { type: String },
  context: { type: String },
}, { _id: false });

const FormulaSchema = new mongoose.Schema({
  formula: { type: String },
  description: { type: String },
  variables: { type: String },
  context: { type: String },
}, { _id: false });

const FlashcardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  hint: { type: String },
  tags: [{ type: String }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  mastered: { type: Boolean, default: false },
  timesReviewed: { type: Number, default: 0 },
  lastReviewed: { type: Date },
}, { _id: false });

const QuizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number },
  explanation: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  category: { type: String },
}, { _id: false });

const InterviewQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  category: { type: String },
  tips: [{ type: String }],
  expectedDuration: { type: String },
}, { _id: false });

const NotesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  title: { type: String },
  thumbnail: { type: String },
  videoTitle: { type: String },
  channelName: { type: String },
  duration: { type: Number },
  language: { type: String, default: 'en' },

  chapters: [ChapterSchema],
  keyConcepts: [KeyConceptSchema],
  codeSnippets: [CodeSnippetSchema],
  formulas: [FormulaSchema],
  flashcards: [FlashcardSchema],
  quizQuestions: [QuizQuestionSchema],
  interviewQuestions: [InterviewQuestionSchema],

  customNotes: { type: String, default: '' },
  tags: [{ type: String }],

  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending',
  },
  error: { type: String },
  cached: { type: Boolean, default: false },
  cachedAt: { type: Date },

  generationOptions: {
    includeChapters: { type: Boolean, default: true },
    includeConcepts: { type: Boolean, default: true },
    includeCode: { type: Boolean, default: true },
    includeFormulas: { type: Boolean, default: true },
    includeFlashcards: { type: Boolean, default: true },
    includeQuiz: { type: Boolean, default: true },
    includeInterview: { type: Boolean, default: true },
  },
}, { timestamps: true });

NotesSchema.index({ user: 1, createdAt: -1 });
NotesSchema.index({ video: 1 });
NotesSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model('Notes', NotesSchema);
