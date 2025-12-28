import React, { useState, useEffect } from 'react';
import { WardrobeItem, WardrobeCategory } from '../types/wardrobe';
import { wardrobeAPI } from '../services/api';
import { toast } from 'react-hot-toast';

interface EditWardrobeItemModalProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CATEGORY_GROUPS: Record<string, WardrobeCategory[]> = {
  'Tops': [
    WardrobeCategory.TSHIRT, WardrobeCategory.SHIRT, WardrobeCategory.BLOUSE,
    WardrobeCategory.TANK_TOP, WardrobeCategory.CROP_TOP, WardrobeCategory.SWEATER,
    WardrobeCategory.HOODIE, WardrobeCategory.SWEATSHIRT, WardrobeCategory.CARDIGAN,
  ],
  'Bottoms': [
    WardrobeCategory.JEANS, WardrobeCategory.PANTS, WardrobeCategory.SHORTS,
    WardrobeCategory.SKIRT, WardrobeCategory.LEGGINGS, WardrobeCategory.JOGGERS,
  ],
  'Dresses & Jumpsuits': [
    WardrobeCategory.DRESS, WardrobeCategory.JUMPSUIT, WardrobeCategory.ROMPER,
  ],
  'Outerwear': [
    WardrobeCategory.JACKET, WardrobeCategory.COAT, WardrobeCategory.BLAZER,
    WardrobeCategory.VEST, WardrobeCategory.PARKA,
  ],
  'Footwear': [
    WardrobeCategory.SNEAKERS, WardrobeCategory.BOOTS, WardrobeCategory.SANDALS,
    WardrobeCategory.HEELS, WardrobeCategory.FLATS, WardrobeCategory.LOAFERS,
  ],
  'Accessories': [
    WardrobeCategory.BAG, WardrobeCategory.BACKPACK, WardrobeCategory.BELT,
    WardrobeCategory.HAT, WardrobeCategory.SCARF, WardrobeCategory.SUNGLASSES,
    WardrobeCategory.JEWELRY, WardrobeCategory.WATCH,
  ],
  'Other': [
    WardrobeCategory.ACTIVEWEAR, WardrobeCategory.SWIMWEAR, WardrobeCategory.LOUNGEWEAR,
  ],
};

export default function EditWardrobeItemModal({ item, isOpen, onClose, onSave }: EditWardrobeItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    brand: '',
    notes: '',
    price: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        category: item.category || '',
        name: item.name || '',
        brand: item.brand || '',
        notes: item.notes || '',
        price: item.price?.toString() || '',
      });
    }
  }, [item]);

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsSubmitting(true);
    try {
      await wardrobeAPI.updateItem(item._id, {
        category: formData.category as WardrobeCategory,
        name: formData.name || undefined,
        brand: formData.brand || undefined,
        notes: formData.notes || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
      });
      toast.success('Item updated');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Image Preview */}
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={item.processedImageUrl || item.imageUrl || item.thumbnailUrl}
                alt={item.name || 'Wardrobe item'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* AI Detected Info */}
          {item.aiAnalysis && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-purple-900 mb-2">AI Detected</h3>
              <div className="flex flex-wrap gap-2">
                {item.aiAnalysis.dominantColor && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded">
                    <span
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: item.aiAnalysis.dominantColor }}
                    />
                    {item.aiAnalysis.dominantColor}
                  </span>
                )}
                {item.aiAnalysis.pattern && (
                  <span className="text-xs bg-white text-purple-700 px-2 py-1 rounded">
                    {item.aiAnalysis.pattern}
                  </span>
                )}
                {item.aiAnalysis.material && (
                  <span className="text-xs bg-white text-purple-700 px-2 py-1 rounded">
                    {item.aiAnalysis.material}
                  </span>
                )}
                {item.aiAnalysis.style?.map((s, i) => (
                  <span key={i} className="text-xs bg-white text-purple-700 px-2 py-1 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => (
                  <optgroup key={group} label={group}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Item name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Brand name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
