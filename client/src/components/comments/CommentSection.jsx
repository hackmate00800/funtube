import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { commentsAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import GlassTooltip from '../ui/Tooltip';
import { HiThumbUp, HiReply, HiTrash, HiDotsHorizontal } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CommentSection = ({ videoId }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await commentsAPI.getComments(videoId);
      setComments(data.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const { data } = await commentsAPI.addComment(videoId, { text: newComment });
      setComments((prev) => [data.data || data, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleReply = async (commentId, text) => {
    try {
      const { data } = await commentsAPI.replyToComment(videoId, commentId, { text });
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, replies: [...(c.replies || []), data.data || data] } : c
        )
      );
      setReplyTo(null);
      toast.success('Reply added');
    } catch { toast.error('Failed to reply'); }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.deleteComment(videoId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleLike = async (commentId) => {
    try {
      await commentsAPI.likeComment(videoId, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likes: c.likes?.includes(user?.id) ? c.likes.filter((l) => l !== user?.id) : [...(c.likes || []), user?.id] }
            : c
        )
      );
    } catch { toast.error('Failed to like comment'); }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-white flex items-center gap-2">
        Comments
        <span className="text-sm text-gray-500 font-normal">({comments.length})</span>
      </h3>

      {user && (
        <div className="flex gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-500/20" />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {user.username?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-b border-white/10 pb-2 text-sm text-white placeholder-gray-500 focus:border-primary-500/50 transition-colors"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewComment('')}
                className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-xs bg-primary-500 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment, i) => (
          <motion.div
            key={comment._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <div className="flex gap-3 group">
              {comment.user?.avatar ? (
                <img src={comment.user.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-sm font-medium flex-shrink-0">
                  {comment.user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${comment.user?._id}`} className="text-xs font-medium text-white hover:text-primary-400 transition-colors">
                    {comment.user?.username}
                  </Link>
                  <span className="text-[10px] text-gray-500">
                    {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-0.5">{comment.text}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  <GlassTooltip content="Like">
                    <button
                      onClick={() => handleLike(comment._id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        comment.likes?.includes(user?.id) ? 'text-primary-400' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      <HiThumbUp className="w-3.5 h-3.5" />
                      {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                    </button>
                  </GlassTooltip>
                  <button
                    onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    <HiReply className="w-3.5 h-3.5" />
                    Reply
                  </button>
                  {(user?.id === comment.user?._id || user?.role === 'admin') && (
                    <GlassTooltip content="Delete">
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    </GlassTooltip>
                  )}
                </div>

                {replyTo === comment._id && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex gap-3"
                  >
                    <input
                      placeholder="Write a reply..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleReply(comment._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500/30 transition-colors"
                      autoFocus
                    />
                  </motion.div>
                )}

                {comment.replies?.length > 0 && (
                  <div className="mt-3 ml-4 space-y-3 border-l-2 border-white/5 pl-4">
                    {comment.replies.map((reply, ri) => (
                      <div key={ri} className="flex gap-3 group">
                        {reply.user?.avatar ? (
                          <img src={reply.user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-[10px] font-medium flex-shrink-0">
                            {reply.user?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{reply.user?.username}</span>
                            <span className="text-[10px] text-gray-500">
                              {reply.createdAt && formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-0.5">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {!loading && comments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No comments yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
