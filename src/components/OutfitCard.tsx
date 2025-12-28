import React, { useState } from 'react';
import { feedbackAPI } from '../services/api';
import { V2Outfit, V2OutfitItem } from '../types/v2';

interface OutfitCardProps {
  outfit: V2Outfit;
  index: number;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, index }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showStyling, setShowStyling] = useState(false);
  const [showAccessories, setShowAccessories] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New features data
  const stylingAnalysis = outfit.stylingAnalysis;
  const accessorySuggestions = outfit.accessorySuggestions;
  const priceBreakdown = outfit.priceBreakdown;
  const compatibility = outfit.compatibility;

  const handleOutfitFeedback = async (action: 'like' | 'save') => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const outfitId = outfit.id || `outfit-${index}`;

      if (action === 'like') {
        await feedbackAPI.submitOutfitFeedback({
          outfitId,
          rating: liked ? 3 : 5,
          wouldWear: !liked,
        });
        setLiked(!liked);
      } else {
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
  const groupedItems: { [key: string]: V2OutfitItem[] } = {};
  (outfit.items || []).forEach((item) => {
    const slot = item.slot || 'other';
    if (!groupedItems[slot]) {
      groupedItems[slot] = [];
    }
    groupedItems[slot].push(item);
  });

  // Order of slots for display
  const slotOrder = [
    'swimwear', 'swimsuit', 'bikini', 'swim_trunks',
    'cover_up', 'coverup',
    'top', 'base_layer_top', 'base_layer', 'shirt', 'blouse',
    'bottom', 'pants', 'shorts', 'skirt', 'hiking_pants',
    'dress', 'jumpsuit',
    'footwear', 'shoes', 'sandals', 'boots', 'hiking_boots',
    'outerwear', 'jacket', 'mid_layer', 'shell_jacket', 'lightweight_layer',
    'accessory', 'accessories', 'hat', 'bag', 'sunglasses', 'jewelry',
    'other'
  ];
  const orderedSlots = Object.keys(groupedItems).sort((a, b) => {
    const aIndex = slotOrder.findIndex(s => a.toLowerCase().includes(s));
    const bIndex = slotOrder.findIndex(s => b.toLowerCase().includes(s));
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const getSlotLabel = (slot: string): string => {
    const labels: { [key: string]: string } = {
      // Swimwear
      swimwear: 'Swimwear',
      swimsuit: 'Swimsuit',
      bikini: 'Bikini',
      swim_trunks: 'Swim Trunks',
      cover_up: 'Cover-Up',
      coverup: 'Cover-Up',
      // Tops
      top: 'Top',
      shirt: 'Shirt',
      blouse: 'Blouse',
      base_layer_top: 'Base Layer',
      base_layer: 'Base Layer',
      // Bottoms
      bottom: 'Bottom',
      pants: 'Pants',
      shorts: 'Shorts',
      skirt: 'Skirt',
      hiking_pants: 'Hiking Pants',
      // Dresses
      dress: 'Dress',
      jumpsuit: 'Jumpsuit',
      // Footwear
      footwear: 'Footwear',
      shoes: 'Shoes',
      sandals: 'Sandals',
      boots: 'Boots',
      hiking_boots: 'Hiking Boots',
      // Outerwear
      outerwear: 'Outerwear',
      jacket: 'Jacket',
      mid_layer: 'Mid Layer',
      shell_jacket: 'Shell Jacket',
      lightweight_layer: 'Light Layer',
      // Accessories
      accessory: 'Accessories',
      accessories: 'Accessories',
      hat: 'Hat',
      bag: 'Bag',
      sunglasses: 'Sunglasses',
      jewelry: 'Jewelry',
      jewelry_accessories: 'Jewelry',
      // Other
      other: 'Other',
    };
    return labels[slot.toLowerCase()] || slot.charAt(0).toUpperCase() + slot.slice(1).replace(/_/g, ' ');
  };

  const handleItemClick = (item: V2OutfitItem) => {
    const url = item.product?.productUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Calculate total price
  const totalPrice = outfit.totalPrice ||
    outfit.items.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + (typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0);
    }, 0);

  // Get overall score - backend returns 0-10 scale, convert to 0-100 for display
  const rawScore = outfit.scores?.overall;
  const overallScore = rawScore !== undefined ? Math.round(rawScore * 10) : undefined;
  const hasScores = outfit.scores && rawScore !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 text-white">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{outfit.name || `Outfit ${index + 1}`}</h3>
            {outfit.description && (
              <p className="text-purple-100 text-sm mt-0.5 line-clamp-1">{outfit.description}</p>
            )}
          </div>
          {hasScores && (
            <div
              className="bg-white/20 rounded-full px-3 py-1 cursor-pointer hover:bg-white/30 transition-colors"
              onClick={() => setShowScores(!showScores)}
              title="Click to see score breakdown"
            >
              <span className="text-sm font-semibold">{Math.round(overallScore || 0)}/100</span>
            </div>
          )}
        </div>

        {/* Activity/Plan Info */}
        {outfit.plan && (
          <div className="mt-2 flex flex-wrap gap-1">
            {outfit.plan.activityType && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {outfit.plan.activityType}
              </span>
            )}
            {outfit.plan.functionalityLevel && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {outfit.plan.functionalityLevel} functionality
              </span>
            )}
          </div>
        )}
      </div>

      {/* Score Breakdown (Expandable) */}
      {showScores && outfit.scores && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <h4 className="text-sm font-semibold text-purple-800 mb-2">Score Breakdown</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Functionality', value: outfit.scores.functionality },
              { label: 'Style', value: outfit.scores.style },
              { label: 'Budget', value: outfit.scores.budget },
              { label: 'Personalization', value: outfit.scores.personalization },
              { label: 'Availability', value: outfit.scores.availability },
            ].map((score) => (
              score.value !== undefined && (
                <div key={score.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-24">{score.label}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${score.value}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-purple-700 w-8">{Math.round(score.value)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Warning */}
      {compatibility && compatibility.hasIssues && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-yellow-800">Style Notes</p>
              <ul className="mt-1 space-y-0.5">
                {compatibility.issues.slice(0, 2).map((issue, idx) => (
                  <li key={idx} className="text-xs text-yellow-700">{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Styling Analysis Section */}
      {stylingAnalysis && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowStyling(!showStyling)}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">🎨 Styling Analysis</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                stylingAnalysis.overallScore >= 80 ? 'bg-green-100 text-green-700' :
                stylingAnalysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {stylingAnalysis.overallScore}/100
              </span>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showStyling ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showStyling && (
            <div className="px-4 pb-3 space-y-3">
              {/* Color Harmony */}
              {stylingAnalysis.colorHarmony && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-800">Color Harmony</span>
                    <span className="text-xs text-blue-600">{stylingAnalysis.colorHarmony.scheme}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${stylingAnalysis.colorHarmony.harmony}%` }}
                      />
                    </div>
                    <span className="text-xs text-blue-700">{stylingAnalysis.colorHarmony.harmony}%</span>
                  </div>
                  {stylingAnalysis.colorHarmony.accentColors && stylingAnalysis.colorHarmony.accentColors.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {stylingAnalysis.colorHarmony.accentColors.map((color, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white text-xs text-blue-700 rounded">{color}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Silhouette Balance */}
              {stylingAnalysis.silhouette && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-800">Silhouette</span>
                    <span className={`text-xs ${stylingAnalysis.silhouette.isBalanced ? 'text-green-600' : 'text-yellow-600'}`}>
                      {stylingAnalysis.silhouette.isBalanced ? '✓ Balanced' : '⚠ Unbalanced'}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-purple-700">
                    <span>Top: {stylingAnalysis.silhouette.topSilhouette}</span>
                    <span>•</span>
                    <span>Bottom: {stylingAnalysis.silhouette.bottomSilhouette}</span>
                  </div>
                </div>
              )}

              {/* Pattern Mix */}
              {stylingAnalysis.patternMix && (
                <div className="bg-pink-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-pink-800">Pattern Mix</span>
                    <span className={`text-xs ${stylingAnalysis.patternMix.isSafe ? 'text-green-600' : 'text-orange-600'}`}>
                      {stylingAnalysis.patternMix.isSafe ? '✓ Safe' : '⚠ Bold'}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {stylingAnalysis.patternMix.patterns?.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white text-xs text-pink-700 rounded">
                        {p.type} ({p.scale})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Styling Tips */}
              {stylingAnalysis.stylingTips && stylingAnalysis.stylingTips.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">💡 Pro Tips:</p>
                  <ul className="space-y-1">
                    {stylingAnalysis.stylingTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-purple-500">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Accessory Suggestions Section */}
      {accessorySuggestions && accessorySuggestions.suggestions.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowAccessories(!showAccessories)}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">👜 Accessory Suggestions</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {accessorySuggestions.suggestions.length} ideas
              </span>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAccessories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAccessories && (
            <div className="px-4 pb-3 space-y-2">
              {accessorySuggestions.suggestions.map((suggestion, idx) => (
                <div key={idx} className={`p-2 rounded-lg border ${
                  suggestion.priority === 'high' ? 'bg-purple-50 border-purple-200' :
                  suggestion.priority === 'medium' ? 'bg-blue-50 border-blue-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-800">{suggestion.category}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.priority === 'high' ? 'bg-purple-200 text-purple-700' :
                      suggestion.priority === 'medium' ? 'bg-blue-200 text-blue-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{suggestion.reason}</p>
                  {suggestion.colorRecommendation && (
                    <p className="text-xs text-purple-600 mt-1">Color: {suggestion.colorRecommendation}</p>
                  )}
                </div>
              ))}

              {/* Styling Tip */}
              {accessorySuggestions.stylingTip && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">💡 {accessorySuggestions.stylingTip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Price Breakdown Section */}
      {priceBreakdown && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">💰 Price Breakdown</span>
              {priceBreakdown.savings > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Save ${priceBreakdown.savings.toFixed(0)}
                </span>
              )}
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPriceBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPriceBreakdown && (
            <div className="px-4 pb-3 space-y-2">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-green-600">From Wardrobe</p>
                  <p className="text-sm font-bold text-green-700">{priceBreakdown.itemCount.fromWardrobe} items</p>
                  <p className="text-xs text-green-600">${priceBreakdown.wardrobeValue.toFixed(0)} value</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-purple-600">To Shop</p>
                  <p className="text-sm font-bold text-purple-700">{priceBreakdown.itemCount.toShop} items</p>
                  <p className="text-xs text-purple-600">${priceBreakdown.shoppingCost.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-600">Total Value</p>
                  <p className="text-sm font-bold text-gray-700">${priceBreakdown.totalOutfitValue.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">avg ${priceBreakdown.averageItemPrice.toFixed(0)}/item</p>
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-1">
                {priceBreakdown.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.source === 'wardrobe' ? 'bg-green-400' : 'bg-purple-400'}`} />
                      <span className="text-xs text-gray-700 truncate max-w-[150px]" title={item.title}>
                        {item.slot}: {item.title}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-700">{item.priceDisplay}</span>
                      {item.savingsDisplay && (
                        <span className="text-xs text-green-600 ml-1">{item.savingsDisplay}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Savings */}
              {(priceBreakdown.totalSaleSavings > 0 || priceBreakdown.savings > 0) && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700">Total Savings</span>
                    <span className="text-sm font-bold text-green-700">
                      ${(priceBreakdown.totalSaleSavings + priceBreakdown.savings).toFixed(0)}
                    </span>
                  </div>
                  {priceBreakdown.totalSaleSavings > 0 && (
                    <p className="text-xs text-green-600 mt-1">Includes ${priceBreakdown.totalSaleSavings.toFixed(0)} from sales</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  key={item.product?.id || itemIndex}
                  onClick={() => handleItemClick(item)}
                  className="bg-gray-50 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-colors group"
                >
                  {/* Item Image */}
                  <div className="aspect-square bg-gray-200 rounded-md mb-2 overflow-hidden">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.displayName || item.product?.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
                  <p className="text-xs text-gray-700 font-medium truncate" title={item.displayName || item.product?.title}>
                    {item.displayName || item.product?.title || 'Unknown Item'}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-purple-600 font-semibold">
                      {item.product?.price ? `$${item.product.price.toFixed(2)}` : '-'}
                    </span>
                    {/* Show "Your Wardrobe" for wardrobe items, retailer for products */}
                    <span className={`text-xs truncate ml-1 ${
                      item.product?.source === 'wardrobe' ? 'text-green-600 font-medium' : 'text-gray-400'
                    }`} title={item.product?.source === 'wardrobe' ? 'From your wardrobe' : item.product?.retailer}>
                      {item.product?.source === 'wardrobe' ? 'Your Wardrobe' : (item.product?.retailer || 'Online Store')}
                    </span>
                  </div>
                  {/* Selection Reason (on hover) */}
                  {item.selectionReason && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.selectionReason}
                    </p>
                  )}
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
              ${totalPrice.toFixed(2)}
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
            <div className="space-y-2 text-xs text-gray-600">
              {outfit.reasoning.summary && (
                <p className="text-sm text-gray-700">{outfit.reasoning.summary}</p>
              )}
              {outfit.reasoning.occasionFit && (
                <p><span className="font-medium">Occasion:</span> {outfit.reasoning.occasionFit}</p>
              )}
              {outfit.reasoning.colorTheory && (
                <p><span className="font-medium">Colors:</span> {outfit.reasoning.colorTheory}</p>
              )}
              {outfit.reasoning.styleCohesion && (
                <p><span className="font-medium">Style:</span> {outfit.reasoning.styleCohesion}</p>
              )}
              {outfit.reasoning.practicalConsiderations && (
                <p><span className="font-medium">Practical:</span> {outfit.reasoning.practicalConsiderations}</p>
              )}
              {outfit.reasoning.stylingTips && outfit.reasoning.stylingTips.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">Tips:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {outfit.reasoning.stylingTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
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

        {/* Color Palette */}
        {outfit.plan?.colorPalette && outfit.plan.colorPalette.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Colors:</span>
            <div className="flex gap-1">
              {outfit.plan.colorPalette.map((color, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitCard;
