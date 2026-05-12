const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Video = require('./models/Video');
const Analytics = require('./models/Analytics');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/funtime');
    console.log('MongoDB connected');

    await User.deleteMany({ email: 'demo@funtime.com' });
    await Video.deleteMany({});
    await Analytics.deleteMany({});

    const demoUser = await User.create({
      username: 'DemoChannel',
      email: 'demo@funtime.com',
      password: 'demopass',
      channelDescription: 'Welcome to the demo channel! This is a sample channel for testing FunTube.',
      role: 'creator',
    });
    console.log('Demo user created: demo@funtime.com / demopass');

    const now = new Date();
    const sampleVideos = [
      { title: 'Getting Started with FunTube', description: 'A quick tour of FunTube features and how to use the platform.', category: 'Tutorial', views: 15420, duration: 245, tags: ['funtime', 'tutorial', 'getting-started'], createdAt: new Date(now - 86400000 * 1) },
      { title: 'Building Web Apps with React', description: 'Learn how to build modern web applications using React 18 and its latest features.', category: 'Education', views: 8930, duration: 1872, tags: ['react', 'javascript', 'webdev'], createdAt: new Date(now - 86400000 * 2) },
      { title: 'Top 10 Gaming Moments of 2026', description: 'The most epic gaming moments from this year. Watch and enjoy!', category: 'Gaming', views: 45210, duration: 680, tags: ['gaming', 'highlights', 'top10'], createdAt: new Date(now - 86400000 * 3) },
      { title: 'Chill Lo-Fi Beats - Study & Relax', description: '1 hour of chill lo-fi hip hop beats to relax, study, and code to.', category: 'Music', views: 128500, duration: 3600, tags: ['lofi', 'music', 'study', 'chill'], createdAt: new Date(now - 86400000 * 4) },
      { title: 'Exploring Space: The Final Frontier', description: 'A documentary about space exploration and the future of interstellar travel.', category: 'Science', views: 7620, duration: 2400, tags: ['space', 'science', 'documentary'], createdAt: new Date(now - 86400000 * 5) },
      { title: 'Quick & Easy Pasta Recipe', description: 'Make delicious pasta in under 15 minutes with this simple recipe.', category: 'Food', views: 32100, duration: 420, tags: ['cooking', 'recipe', 'pasta', 'quick'], createdAt: new Date(now - 86400000 * 6) },
      { title: 'Morning Workout Routine - 20 Minutes', description: 'Start your day with this energizing 20-minute full body workout.', category: 'Sports', views: 23100, duration: 1200, tags: ['fitness', 'workout', 'morning-routine'], createdAt: new Date(now - 86400000 * 7) },
      { title: 'Funny Cat Compilation', description: 'The funniest cat videos from around the internet. Guaranteed to make you smile!', category: 'Comedy', views: 89500, duration: 360, tags: ['cats', 'funny', 'animals', 'compilation'], createdAt: new Date(now - 86400000 * 8) },
      { title: 'Travel Vlog: Tokyo Adventure', description: 'Exploring the best spots in Tokyo from Shibuya to Senso-ji Temple.', category: 'Travel', views: 18400, duration: 1560, tags: ['travel', 'tokyo', 'japan', 'vlog'], createdAt: new Date(now - 86400000 * 9) },
      { title: 'AI Revolution: What You Need to Know', description: 'Understanding artificial intelligence and how it is transforming our world.', category: 'Technology', views: 9500, duration: 1800, tags: ['ai', 'technology', 'future'], createdAt: new Date(now - 86400000 * 10) },
    ];

    const videoDocs = await Video.insertMany(
      sampleVideos.map((v) => ({
        user: demoUser._id,
        url: '/uploads/videos/demo.mp4',
        thumbnail: '/uploads/thumbnails/demo.jpg',
        format: 'mp4',
        fileSize: 10485760,
        resolution: '720p',
        videoResolutions: ['144p', '240p', '360p', '480p', '720p'],
        isProcessed: true,
        processingProgress: 100,
        status: 'ready',
        isPublic: true,
        tags: v.tags,
        ...v,
      }))
    );
    console.log(`${videoDocs.length} sample videos created`);

    const analyticsDocs = videoDocs.map((v) => ({
      video: v._id,
      user: demoUser._id,
    }));
    await Analytics.insertMany(analyticsDocs);
    console.log('Analytics records created');

    console.log('\nSeed complete! Login with: demo@funtime.com / demopass');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
