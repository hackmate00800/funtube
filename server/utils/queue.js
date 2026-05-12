class ProcessingQueue {
  constructor(concurrency = 2) {
    this.queue = [];
    this.concurrency = concurrency;
    this.running = 0;
    this.processing = new Map();
  }

  add(taskId, handler) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskId, handler, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    this.running++;
    const item = this.queue.shift();
    this.processing.set(item.taskId, item);
    try {
      const result = await item.handler((progress) => {
        item.resolve({ status: 'processing', progress });
      });
      this.processing.delete(item.taskId);
      item.resolve({ status: 'completed', data: result });
    } catch (err) {
      this.processing.delete(item.taskId);
      item.reject(err);
    } finally {
      this.running--;
      this.processNext();
    }
  }

  getStatus(taskId) {
    if (this.processing.has(taskId)) return 'processing';
    return 'completed';
  }

  getQueueLength() {
    return this.queue.length;
  }
}

module.exports = new ProcessingQueue(2);
