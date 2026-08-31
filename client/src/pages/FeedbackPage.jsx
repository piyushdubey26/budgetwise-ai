import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Send, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFeedbackHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/api/feedback/my');
      setHistory(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Failed to fetch feedback logs:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post('/api/feedback', { rating, comment });
      setComment('');
      setRating(5);
      setSuccess(true);
      fetchFeedbackHistory();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] scrollbar-none animate-fadeIn">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand-indigo" /> Feedback Hub
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Share your experience, report issues, or suggest new features to help us build a smarter BudgetWise AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-sm font-bold text-white">Share Your Review</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Rating Star Selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Overall Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-300 ml-2">
                    {rating === 5 ? 'Excellent 🏆' : rating === 4 ? 'Very Good 👍' : rating === 3 ? 'Good 🙂' : rating === 2 ? 'Fair 😐' : 'Poor 👎'}
                  </span>
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Your Review & Suggestions</label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What features do you want to see? What can we do better? Report any bugs here..."
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-indigo/60 transition-all resize-none placeholder-gray-500"
                />
              </div>

              {/* Status Alert Messages */}
              {success && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl animate-scaleIn">
                  <CheckCircle className="h-4 w-4 shrink-0" /> Feedback submitted successfully! Thank you.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl animate-scaleIn">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className={`w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitting || !comment.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Submit Feedback
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Your Past Feedback</h3>
            <button 
              onClick={fetchFeedbackHistory}
              className="text-[10px] font-semibold text-blue-400 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {loadingHistory ? (
              <div className="text-center py-12 text-xs text-gray-500 font-bold">
                Loading feedback history...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 border border-dashed border-white/10 rounded-3xl text-xs text-gray-500 font-bold">
                No feedback submitted yet.
              </div>
            ) : (
              history.map((fb) => (
                <div key={fb._id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{fb.date}</span>
                  </div>
                  
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">
                    {fb.comment}
                  </p>

                  {/* Admin Reply Block */}
                  {fb.reply ? (
                    <div className="bg-slate-950/80 border border-brand-indigo/15 rounded-xl p-3.5 mt-2 space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-purple">
                        💬 Admin Response
                      </span>
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                        {fb.reply}
                      </p>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 italic mt-1">
                      Awaiting admin review...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
