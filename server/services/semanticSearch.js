const EmbeddingChunk = require('../models/EmbeddingChunk');
const Summary = require('../models/Summary');
const Video = require('../models/Video');
const logger = require('../utils/logger');

class SemanticSearchService {
  constructor() {
    this.openaiAvailable = !!process.env.OPENAI_API_KEY;
    this.pineconeAvailable = !!process.env.PINECONE_API_KEY;
  }

  async getEmbedding(text) {
    if (!this.openaiAvailable) return this.mockEmbedding(text);
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text, model: 'text-embedding-3-small' }),
      });
      const data = await response.json();
      return data.data[0].embedding;
    } catch (err) {
      logger.error('OpenAI embedding failed:', err.message);
      return this.mockEmbedding(text);
    }
  }

  mockEmbedding(text) {
    const hash = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return Array.from({ length: 128 }, (_, i) => Math.sin(hash * (i + 1)) * 0.1);
  }

  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  chunkTranscript(transcript, maxChunkSize = 500) {
    const segments = transcript.split('\n').filter(s => s.trim());
    const chunks = [];
    let current = { text: '', startTime: 0, endTime: 0 };

    for (const seg of segments) {
      const timeMatch = seg.match(/\[(\d{2}):(\d{2}):(\d{2})\]\s*(.+)/);
      if (timeMatch) {
        const secs = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
        const text = timeMatch[4];
        if (current.text.length + text.length > maxChunkSize && current.text) {
          chunks.push({ ...current });
          current = { text: '', startTime: secs, endTime: secs };
        }
        if (!current.text) current.startTime = secs;
        current.text += (current.text ? ' ' : '') + text;
        current.endTime = secs;
      } else {
        current.text += (current.text ? ' ' : '') + seg;
      }
    }
    if (current.text) chunks.push(current);
    return chunks;
  }

  async indexVideo(videoId) {
    try {
      const summary = await Summary.findOne({ video: videoId });
      if (!summary?.transcript) return { indexed: 0, error: 'No transcript' };

      const video = await Video.findById(videoId);
      const chunks = this.chunkTranscript(summary.transcript);
      const embedding = await this.getEmbedding(summary.transcript.slice(0, 1000));

      await EmbeddingChunk.deleteMany({ video: videoId });

      const docs = chunks.map((chunk, i) => ({
        video: videoId,
        text: chunk.text,
        embedding,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        chunkIndex: i,
        pineconeId: `${videoId}_chunk_${i}`,
        metadata: {
          videoTitle: video?.title || 'Untitled',
          videoUrl: video?.url || '',
          thumbnail: video?.thumbnail || '',
          category: video?.category || '',
        },
      }));

      await EmbeddingChunk.insertMany(docs);
      logger.info(`Indexed ${docs.length} chunks for video ${videoId}`);
      return { indexed: docs.length };
    } catch (err) {
      logger.error('Indexing failed:', err);
      return { indexed: 0, error: err.message };
    }
  }

  async search(query, filters = {}) {
    try {
      const queryEmbedding = await this.getEmbedding(query);
      const match = {};

      if (filters.videoId) match.video = filters.videoId;
      if (filters.category) match['metadata.category'] = filters.category;

      const chunks = await EmbeddingChunk.find(match).limit(200).lean();

      const scored = chunks.map(chunk => ({
        ...chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding || this.mockEmbedding(chunk.text)),
      }));

      scored.sort((a, b) => b.score - a.score);
      const topResults = scored.slice(0, filters.limit || 20);

      return {
        query,
        results: topResults.map(r => ({
          videoId: r.video,
          text: r.text,
          startTime: r.startTime,
          endTime: r.endTime,
          score: Math.round(r.score * 1000) / 1000,
          videoTitle: r.metadata?.videoTitle,
          thumbnail: r.metadata?.thumbnail,
        })),
        totalResults: topResults.length,
      };
    } catch (err) {
      logger.error('Search failed:', err);
      return { query, results: [], totalResults: 0, error: err.message };
    }
  }

  async getVideoContext(videoId, timestamp) {
    const chunks = await EmbeddingChunk.find({
      video: videoId,
      startTime: { $lte: timestamp + 30 },
      endTime: { $gte: Math.max(0, timestamp - 30) },
    }).sort({ chunkIndex: 1 }).limit(3).lean();

    return chunks.map(c => ({ text: c.text, startTime: c.startTime, endTime: c.endTime }));
  }
}

module.exports = new SemanticSearchService();
