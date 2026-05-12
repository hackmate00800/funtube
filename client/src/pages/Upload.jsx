import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { videosAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiUpload, HiX, HiSparkles, HiPhotograph, HiTag } from 'react-icons/hi';

const categories = [
  'Music', 'Gaming', 'Education', 'Entertainment', 'Sports',
  'News', 'Technology', 'Science', 'Travel', 'Food',
  'Fashion', 'Comedy', 'Documentary', 'Vlog', 'Tutorial', 'Other',
];

const Upload = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Other',
    tags: '',
    isPublic: true,
    allowComments: true,
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [generating, setGenerating] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      setStep(2);
    } else {
      toast.error('Please select a valid video file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mkv', '.webm', '.avi', '.mov'] },
    maxSize: 500000000,
    multiple: false,
  });

  const generateAIContent = async () => {
    if (!form.description && !form.title) {
      toast.error('Add a description or title first for AI suggestions');
      return;
    }
    setGenerating(true);
    try {
      const [titles, tags] = await Promise.all([
        aiAPI.generateTitle({
          description: form.description,
          tags: form.tags.split(',').map((t) => t.trim()),
          category: form.category,
        }),
        aiAPI.generateTags({
          title: form.title,
          description: form.description,
          category: form.category,
        }),
      ]);
      setAiSuggestions({
        titles: titles.data.data,
        tags: tags.data.data,
      });
      toast.success('AI suggestions ready!');
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!video || !form.title) {
      toast.error('Please provide a video and title');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', video);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('tags', form.tags);
      formData.append('isPublic', form.isPublic);
      formData.append('allowComments', form.allowComments);

      const { data } = await videosAPI.uploadVideo(formData, (e) => {
        setProgress(Math.round((e.loaded * 100) / e.total));
      });

      if (thumbnail) {
        const thumbFormData = new FormData();
        thumbFormData.append('thumbnail', thumbnail);
        await videosAPI.uploadThumbnail(data.data._id, thumbFormData);
      }

      toast.success('Video uploaded successfully!');
      navigate(`/watch/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Video</h1>

      {step === 1 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-20 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-dark-600 hover:border-primary-500 hover:bg-dark-800/50'
          }`}
        >
          <input {...getInputProps()} />
          <HiUpload className="text-6xl text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-300 font-medium">
            {isDragActive ? 'Drop your video here' : 'Drag & drop your video here'}
          </p>
          <p className="text-sm text-gray-500 mt-2">or click to browse (MP4, MKV, WebM, AVI, MOV)</p>
          <p className="text-xs text-gray-600 mt-1">Max file size: 500MB</p>
        </div>
      )}

      {step === 2 && video && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl">
            <video src={URL.createObjectURL(video)} className="w-40 h-24 object-cover rounded-lg" controls />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{video.name}</p>
              <p className="text-sm text-gray-400">{(video.size / 1000000).toFixed(1)} MB</p>
            </div>
            <button onClick={() => { setVideo(null); setStep(1); }} className="text-gray-400 hover:text-white">
              <HiX className="text-xl" />
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter video title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field h-32 resize-none"
                  placeholder="Describe your video..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="input-field"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="rounded border-dark-600 bg-dark-800"
                  />
                  Public
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.allowComments}
                    onChange={(e) => setForm({ ...form, allowComments: e.target.checked })}
                    className="rounded border-dark-600 bg-dark-800"
                  />
                  Allow Comments
                </label>
              </div>
            </div>

            <div className="w-64 space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  thumbnail ? 'border-primary-500' : 'border-dark-600 hover:border-dark-500'
                }`}
                onClick={() => document.getElementById('thumbnail-input').click()}
              >
                {thumbnail ? (
                  <img src={URL.createObjectURL(thumbnail)} alt="" className="w-full aspect-video object-cover rounded-lg" />
                ) : (
                  <>
                    <HiPhotograph className="text-3xl text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Upload Thumbnail</p>
                  </>
                )}
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setThumbnail(e.target.files[0])}
                />
              </div>

              <button
                onClick={generateAIContent}
                disabled={generating}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <HiSparkles className="text-lg" />
                {generating ? 'Generating...' : 'AI Suggestions'}
              </button>

              {aiSuggestions && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <HiSparkles className="text-primary-400" /> AI Title Suggestions
                    </p>
                    <div className="space-y-1">
                      {aiSuggestions.titles?.map((title, i) => (
                        <button
                          key={i}
                          onClick={() => setForm({ ...form, title })}
                          className="text-xs text-left text-gray-300 hover:text-primary-400 block p-1.5 rounded hover:bg-dark-700 w-full transition-colors"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                      <HiTag className="text-primary-400" /> AI Tag Suggestions
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {aiSuggestions.tags?.slice(0, 10).map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => setForm({ ...form, tags: form.tags ? `${form.tags}, ${tag}` : tag })}
                          className="text-xs text-primary-400 bg-primary-500/10 px-2 py-1 rounded-full hover:bg-primary-500/20 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {uploading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Uploading...</span>
                <span className="text-primary-400">{progress}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button onClick={() => { setVideo(null); setStep(1); }} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title || uploading}
                className="btn-primary"
              >
                Upload Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
