const mongoose = require('mongoose');

const EmbeddingChunkSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  embedding: { type: [Number] },
  startTime: { type: Number },
  endTime: { type: Number },
  chunkIndex: { type: Number },
  pineconeId: { type: String },
  language: { type: String, default: 'en' },
  metadata: {
    videoTitle: String,
    videoUrl: String,
    thumbnail: String,
    category: String,
    chapterTitle: String,
  },
}, { timestamps: true });

EmbeddingChunkSchema.index({ video: 1, chunkIndex: 1 });
EmbeddingChunkSchema.index({ user: 1 });

module.exports = mongoose.model('EmbeddingChunk', EmbeddingChunkSchema);
