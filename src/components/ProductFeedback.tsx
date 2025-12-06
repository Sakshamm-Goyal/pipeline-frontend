import React, { useState } from 'react';
import { feedbackAPI } from '../services/api';

interface ProductFeedbackProps {
  productId: string;
  productTitle?: string;
  onFeedback?: (type: 'like' | 'dislike' | 'save', reason?: string) => void;
  compact?: boolean;
}

const DISLIKE_REASONS = [
  'Price too high',
  'Not my style',
  'Wrong color',
  'Poor quality',
  'Out of stock',
  'Wrong size options',
  'Not what I was looking for',
];

export function ProductFeedback({
  productId,
  productTitle,
  onFeedback,
  compact = false,
}: ProductFeedbackProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDislikeModal, setShowDislikeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: 'like' | 'dislike' | 'save', reason?: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedbackAPI.submitProductFeedback({
        productId,
        type,
        reason,
      });

      if (type === 'like') {
        setLiked(true);
        setDisliked(false);
      } else if (type === 'dislike') {
        setDisliked(true);
        setLiked(false);
      } else if (type === 'save') {
        setSaved(!saved);
      }

      onFeedback?.(type, reason);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Show brief visual feedback even on error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFeedback('like');
          }}
          disabled={isSubmitting}
          className={`p-1.5 rounded-full transition-all ${
            liked
              ? 'text-red-500 bg-red-50'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
          title="Like this item"
        >
          <HeartIcon filled={liked} />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDislikeModal(true);
          }}
          disabled={isSubmitting}
          className={`p-1.5 rounded-full transition-all ${
            disliked
              ? 'text-gray-700 bg-gray-100'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title="Not for me"
        >
          <ThumbsDownIcon />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFeedback('save');
          }}
          disabled={isSubmitting}
          className={`p-1.5 rounded-full transition-all ${
            saved
              ? 'text-purple-500 bg-purple-50'
              : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
          }`}
          title="Save for later"
        >
          <BookmarkIcon filled={saved} />
        </button>

        {showDislikeModal && (
          <DislikeReasonModal
            productTitle={productTitle}
            onSelect={(reason) => {
              handleFeedback('dislike', reason);
              setShowDislikeModal(false);
            }}
            onClose={() => setShowDislikeModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2" onClick={(e) => e.preventDefault()}>
      <span className="text-xs text-gray-500 mr-2">Was this helpful?</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFeedback('like');
        }}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
          liked
            ? 'text-red-600 bg-red-50 border border-red-200'
            : 'text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-200'
        }`}
      >
        <HeartIcon filled={liked} />
        {liked ? 'Liked' : 'Like'}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDislikeModal(true);
        }}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
          disliked
            ? 'text-gray-700 bg-gray-100 border border-gray-300'
            : 'text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <ThumbsDownIcon />
        Not for me
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFeedback('save');
        }}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
          saved
            ? 'text-purple-600 bg-purple-50 border border-purple-200'
            : 'text-gray-600 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'
        }`}
      >
        <BookmarkIcon filled={saved} />
        {saved ? 'Saved' : 'Save'}
      </button>

      {showDislikeModal && (
        <DislikeReasonModal
          productTitle={productTitle}
          onSelect={(reason) => {
            handleFeedback('dislike', reason);
            setShowDislikeModal(false);
          }}
          onClose={() => setShowDislikeModal(false)}
        />
      )}
    </div>
  );
}

// Dislike Reason Modal
function DislikeReasonModal({
  productTitle,
  onSelect,
  onClose,
}: {
  productTitle?: string;
  onSelect: (reason: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Help us improve</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <XIcon />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Why isn't this right for you?
            {productTitle && (
              <span className="block text-gray-500 truncate mt-1">
                {productTitle}
              </span>
            )}
          </p>
          <div className="space-y-2">
            {DISLIKE_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => onSelect(reason)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                {reason}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Skip
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Quick Feedback Buttons (for inline use)
export function QuickFeedback({
  itemId,
  itemType,
}: {
  itemId: string;
  itemType: 'product' | 'outfit';
}) {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickFeedback = async (type: 'like' | 'dislike') => {
    if (isSubmitting || feedback) return;

    setIsSubmitting(true);
    try {
      if (itemType === 'product') {
        await feedbackAPI.submitProductFeedback({
          productId: itemId,
          type,
        });
      } else {
        await feedbackAPI.submitOutfitFeedback({
          outfitId: itemId,
          rating: type === 'like' ? 5 : 1,
          wouldWear: type === 'like',
        });
      }
      setFeedback(type);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedback) {
    return (
      <span className="text-xs text-gray-500">
        {feedback === 'like' ? '👍 Thanks!' : '👎 Got it!'}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleQuickFeedback('like')}
        className="text-gray-400 hover:text-green-500 transition-colors"
        title="Good recommendation"
      >
        👍
      </button>
      <button
        onClick={() => handleQuickFeedback('dislike')}
        className="text-gray-400 hover:text-red-500 transition-colors"
        title="Not what I wanted"
      >
        👎
      </button>
    </div>
  );
}

// Icon Components
function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
  );
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default ProductFeedback;
