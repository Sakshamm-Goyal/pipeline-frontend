import React, { useState } from 'react';
import { WardrobeItem } from '../types/wardrobe';
import { wardrobeAPI } from '../services/api';
import { toast } from 'react-hot-toast';

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onUpdate: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

export default function WardrobeItemCard({ item, onUpdate, onDelete, onEdit }: WardrobeItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleFavorite = async () => {
    setIsFavoriting(true);
    try {
      await wardrobeAPI.toggleFavorite(item._id);
      toast.success(item.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update favorite status');
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleIncrementWorn = async () => {
    try {
      await wardrobeAPI.incrementTimesWorn(item._id);
      toast.success('Updated wear count');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update wear count');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setIsDeleting(true);
    try {
      await wardrobeAPI.deleteItem(item._id);
      toast.success('Item deleted');
      onDelete();
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get the best available image URL
  const getImageUrl = () => {
    return item.processedImageUrl || item.imageUrl || item.thumbnailUrl;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-100">
        {getImageUrl() ? (
          <img
            src={getImageUrl()}
            alt={item.name || getCategoryLabel(item.category)}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Try fallback images
              if (item.thumbnailUrl && target.src !== item.thumbnailUrl) {
                target.src = item.thumbnailUrl;
              } else if (item.imageUrl && target.src !== item.imageUrl) {
                target.src = item.imageUrl;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          disabled={isFavoriting}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
        >
          <svg
            className={`w-5 h-5 ${item.isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            fill={item.isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Color Palette */}
        {item.aiAnalysis?.colorPalette && item.aiAnalysis.colorPalette.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {item.aiAnalysis.colorPalette.slice(0, 3).map((color: string, idx: number) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Processing Status */}
        {item.imageProcessing?.status && item.imageProcessing.status !== 'completed' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
            {item.imageProcessing.status === 'processing' ? 'Processing...' : item.imageProcessing.status}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 truncate">
              {item.name || getCategoryLabel(item.category)}
            </h3>
            {item.brand && (
              <p className="text-sm text-purple-600">{item.brand}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap ml-2">
            {getCategoryLabel(item.category)}
          </span>
        </div>

        {/* AI Analysis Tags */}
        {item.aiAnalysis && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.aiAnalysis.style?.slice(0, 2).map((style: string, idx: number) => (
              <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                {style}
              </span>
            ))}
            {item.aiAnalysis.pattern && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {item.aiAnalysis.pattern}
              </span>
            )}
            {item.aiAnalysis.material && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {item.aiAnalysis.material}
              </span>
            )}
          </div>
        )}

        {/* User Tags */}
        {item.userTags && item.userTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.userTags.slice(0, 3).map((tag: string, idx: number) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
            {item.userTags.length > 3 && (
              <span className="text-xs text-gray-400">+{item.userTags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <button
            onClick={handleIncrementWorn}
            className="flex items-center gap-1 hover:text-purple-600 transition-colors"
            title="Click to mark as worn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Worn {item.timesWorn || 0}x
          </button>
          {item.lastWornAt && (
            <span className="text-xs">
              Last: {formatDate(item.lastWornAt)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 text-sm bg-gray-100 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm bg-purple-50 text-purple-600 py-2 px-3 rounded hover:bg-purple-100 transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm bg-red-50 text-red-600 py-2 px-3 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '...' : 'Delete'}
          </button>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t text-sm space-y-2">
            {item.description && (
              <p className="text-gray-600">{item.description}</p>
            )}
            {item.price && (
              <p className="text-gray-600">
                <span className="font-medium">Price:</span> {item.currency || 'USD'} {item.price}
              </p>
            )}
            {item.purchaseDate && (
              <p className="text-gray-600">
                <span className="font-medium">Purchased:</span> {formatDate(item.purchaseDate)}
              </p>
            )}
            {item.aiAnalysis?.occasion && item.aiAnalysis.occasion.length > 0 && (
              <p className="text-gray-600">
                <span className="font-medium">Occasions:</span> {item.aiAnalysis.occasion.join(', ')}
              </p>
            )}
            {item.aiAnalysis?.season && item.aiAnalysis.season.length > 0 && (
              <p className="text-gray-600">
                <span className="font-medium">Seasons:</span> {item.aiAnalysis.season.join(', ')}
              </p>
            )}
            {item.notes && (
              <p className="text-gray-500 italic">"{item.notes}"</p>
            )}
            <p className="text-gray-400 text-xs">
              Added: {formatDate(item.createdAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
