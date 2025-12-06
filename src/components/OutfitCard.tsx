import React, { useState } from 'react';
import { feedbackAPI } from '../services/api';

interface OutfitItem {
  slot: string;
  category?: string;
  name: string;
  price?: string;
  priceValue?: number;
  url?: string;
  productUrl?: string;
  image_url?: string;
  imageUrl?: string;
  retailer?: string;
  brand?: string;
  product_id?: string;
}

interface OutfitReasoning {
  occasion?: string;
  weather?: string;
  color?: string;
  fit?: string;
  trend?: string;
}

interface Outfit {
  id?: string;
  outfit_id?: number;
  name: string;
  summary?: string;
  items: OutfitItem[];
  total_price?: string;
  totalPrice?: number;
  score?: number;
  reasoning?: OutfitReasoning;
  style?: string;
  tags?: string[];
}

interface OutfitCardProps {
  outfit: Outfit;
  index: number;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, index }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOutfitFeedback = async (action: 'like' | 'save') => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const outfitId = outfit.id || `outfit-${outfit.outfit_id || index}`;

      if (action === 'like') {
        await feedbackAPI.submitOutfitFeedback({
          outfitId,
          rating: liked ? 3 : 5,
          wouldWear: !liked,
        });
        setLiked(!liked);
      } else {
        // For save, we use the product feedback with type 'save'
        await feedbackAPI.submitOutfitFeedback({
          outfitId,
          rating: 4,
          feedback: saved ? 'unsaved' : 'saved',
          wouldWear: true,
        });
        setSaved(!saved);
      }
    } catch (error) {
      console.error('Failed to submit outfit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by slot for organized display
  const groupedItems: { [key: string]: OutfitItem[] } = {};
  (outfit.items || []).forEach((item) => {
    const slot = item.slot || item.category || 'other';
    if (!groupedItems[slot]) {
      groupedItems[slot] = [];
    }
    groupedItems[slot].push(item);
  });

  // Order of slots for display
  const slotOrder = ['top', 'bottom', 'dress', 'shoes', 'outerwear', 'accessory', 'accessories', 'other'];
  const orderedSlots = slotOrder.filter((slot) => groupedItems[slot]);

  const getSlotLabel = (slot: string): string => {
    const labels: { [key: string]: string } = {
      top: 'Top',
      bottom: 'Bottom',
      dress: 'Dress',
      shoes: 'Footwear',
      outerwear: 'Outerwear',
      accessory: 'Accessories',
      accessories: 'Accessories',
      other: 'Other',
    };
    return labels[slot] || slot.charAt(0).toUpperCase() + slot.slice(1);
  };

  const handleItemClick = (item: OutfitItem) => {
    const url = item.url || item.productUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">{outfit.name || `Outfit ${index + 1}`}</h3>
            {outfit.summary && (
              <p className="text-purple-100 text-sm mt-0.5">{outfit.summary}</p>
            )}
          </div>
          {outfit.score !== undefined && outfit.score > 0 && (
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-sm font-semibold">{outfit.score.toFixed(1)}/10</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4">
        {orderedSlots.map((slot) => (
          <div key={slot} className="mb-4 last:mb-0">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {getSlotLabel(slot)}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {groupedItems[slot].map((item, itemIndex) => (
                <div
                  key={item.product_id || itemIndex}
                  onClick={() => handleItemClick(item)}
                  className="bg-gray-50 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {/* Item Image */}
                  <div className="aspect-square bg-gray-200 rounded-md mb-2 overflow-hidden">
                    {(item.image_url || item.imageUrl) ? (
                      <img
                        src={item.image_url || item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Item Details */}
                  <p className="text-xs text-gray-700 font-medium truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-purple-600 font-semibold">
                      {item.price || (item.priceValue ? `$${item.priceValue.toFixed(2)}` : '-')}
                    </span>
                    {item.retailer && (
                      <span className="text-xs text-gray-400 truncate ml-1" title={item.retailer}>
                        {item.retailer}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Total:</span>
            <span className="text-lg font-bold text-purple-600 ml-2">
              {outfit.total_price || (outfit.totalPrice ? `$${outfit.totalPrice.toFixed(2)}` : '-')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Feedback buttons */}
            <button
              onClick={() => handleOutfitFeedback('like')}
              disabled={isSubmitting}
              className={`p-2 rounded-full transition-all ${
                liked
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={liked ? 'Unlike' : 'Like this outfit'}
            >
              <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={() => handleOutfitFeedback('save')}
              disabled={isSubmitting}
              className={`p-2 rounded-full transition-all ${
                saved
                  ? 'text-purple-500 bg-purple-50'
                  : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
              }`}
              title={saved ? 'Unsave' : 'Save for later'}
            >
              <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium ml-2"
            >
              {showReasoning ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>

        {/* Reasoning (Expandable) */}
        {showReasoning && outfit.reasoning && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Style Notes</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {outfit.reasoning.occasion && (
                <p><span className="font-medium">Occasion:</span> {outfit.reasoning.occasion}</p>
              )}
              {outfit.reasoning.weather && (
                <p><span className="font-medium">Weather:</span> {outfit.reasoning.weather}</p>
              )}
              {outfit.reasoning.color && (
                <p><span className="font-medium">Color:</span> {outfit.reasoning.color}</p>
              )}
              {outfit.reasoning.fit && (
                <p><span className="font-medium">Fit:</span> {outfit.reasoning.fit}</p>
              )}
              {outfit.reasoning.trend && (
                <p><span className="font-medium">Trend:</span> {outfit.reasoning.trend}</p>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {outfit.tags && outfit.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {outfit.tags.map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitCard;
