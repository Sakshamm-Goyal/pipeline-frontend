import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { wardrobeAPI } from '../services/api';

interface WardrobeItem {
  _id: string;
  category: string;
  name?: string;
  userTags?: string[];
  color?: string;
  imageUrl?: string;
  brand?: string;
}

const CATEGORY_GROUPS = [
  {
    name: 'Tops',
    items: [
      { value: 'tshirt', label: 'T-Shirt', emoji: '👕' },
      { value: 'shirt', label: 'Shirt', emoji: '👔' },
      { value: 'blouse', label: 'Blouse', emoji: '👚' },
      { value: 'sweater', label: 'Sweater', emoji: '🧥' },
      { value: 'hoodie', label: 'Hoodie', emoji: '🧤' },
      { value: 'tank', label: 'Tank Top', emoji: '🎽' },
    ],
  },
  {
    name: 'Bottoms',
    items: [
      { value: 'jeans', label: 'Jeans', emoji: '👖' },
      { value: 'pants', label: 'Pants', emoji: '👖' },
      { value: 'shorts', label: 'Shorts', emoji: '🩳' },
      { value: 'skirt', label: 'Skirt', emoji: '🩱' },
      { value: 'leggings', label: 'Leggings', emoji: '🦵' },
    ],
  },
  {
    name: 'Dresses & Outerwear',
    items: [
      { value: 'dress', label: 'Dress', emoji: '👗' },
      { value: 'jacket', label: 'Jacket', emoji: '🧥' },
      { value: 'coat', label: 'Coat', emoji: '🧥' },
      { value: 'blazer', label: 'Blazer', emoji: '🤵' },
      { value: 'cardigan', label: 'Cardigan', emoji: '🧶' },
    ],
  },
  {
    name: 'Footwear',
    items: [
      { value: 'sneakers', label: 'Sneakers', emoji: '👟' },
      { value: 'boots', label: 'Boots', emoji: '🥾' },
      { value: 'heels', label: 'Heels', emoji: '👠' },
      { value: 'sandals', label: 'Sandals', emoji: '🩴' },
      { value: 'loafers', label: 'Loafers', emoji: '👞' },
    ],
  },
  {
    name: 'Accessories',
    items: [
      { value: 'bag', label: 'Bag', emoji: '👜' },
      { value: 'backpack', label: 'Backpack', emoji: '🎒' },
      { value: 'hat', label: 'Hat', emoji: '🧢' },
      { value: 'scarf', label: 'Scarf', emoji: '🧣' },
      { value: 'belt', label: 'Belt', emoji: '⌚' },
      { value: 'jewelry', label: 'Jewelry', emoji: '💎' },
    ],
  },
];

const COLORS = [
  { id: 'black', hex: '#000000', label: 'Black' },
  { id: 'white', hex: '#FFFFFF', label: 'White' },
  { id: 'navy', hex: '#1a237e', label: 'Navy' },
  { id: 'gray', hex: '#757575', label: 'Gray' },
  { id: 'beige', hex: '#d7ccc8', label: 'Beige' },
  { id: 'brown', hex: '#795548', label: 'Brown' },
  { id: 'red', hex: '#c62828', label: 'Red' },
  { id: 'pink', hex: '#ec407a', label: 'Pink' },
  { id: 'blue', hex: '#1e88e5', label: 'Blue' },
  { id: 'green', hex: '#43a047', label: 'Green' },
  { id: 'purple', hex: '#7b1fa2', label: 'Purple' },
  { id: 'yellow', hex: '#fdd835', label: 'Yellow' },
];

const STYLES = ['casual', 'formal', 'sporty', 'bohemian', 'minimalist', 'vintage', 'streetwear', 'elegant'];

const Wardrobe: React.FC = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'tshirt' as string,
    userTags: [] as string[],
    color: '',
    brand: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await wardrobeAPI.getItems();
      setItems(response.data.items || []);
    } catch (err) {
      console.error('Failed to load wardrobe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        name: formData.name || undefined,
        userTags: formData.userTags.length > 0 ? formData.userTags : undefined,
        color: formData.color || undefined,
        brand: formData.brand || undefined,
      };
      await wardrobeAPI.addItem(payload);
      setFormData({ name: '', category: 'tshirt', userTags: [], color: '', brand: '' });
      setShowForm(false);
      await loadItems();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    try {
      await wardrobeAPI.deleteItem(id);
      await loadItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const toggleStyle = (s: string) => {
    setFormData((prev) => ({
      ...prev,
      userTags: prev.userTags.includes(s) ? prev.userTags.filter((x) => x !== s) : [...prev.userTags, s],
    }));
  };

  const getCategoryInfo = (categoryValue: string) => {
    for (const group of CATEGORY_GROUPS) {
      const found = group.items.find((i) => i.value === categoryValue);
      if (found) return found;
    }
    return { value: categoryValue, label: categoryValue, emoji: '👕' };
  };

  const getColorInfo = (colorId: string) => {
    return COLORS.find((c) => c.id === colorId) || { id: colorId, hex: '#gray', label: colorId };
  };

  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter((item) => {
        const group = CATEGORY_GROUPS.find((g) => g.items.some((i) => i.value === item.category));
        return group?.name.toLowerCase().replace(/[^a-z]/g, '') === activeFilter;
      });

  const itemCounts = {
    all: items.length,
    tops: items.filter((i) => CATEGORY_GROUPS[0].items.some((c) => c.value === i.category)).length,
    bottoms: items.filter((i) => CATEGORY_GROUPS[1].items.some((c) => c.value === i.category)).length,
    dressesouterwear: items.filter((i) => CATEGORY_GROUPS[2].items.some((c) => c.value === i.category)).length,
    footwear: items.filter((i) => CATEGORY_GROUPS[3].items.some((c) => c.value === i.category)).length,
    accessories: items.filter((i) => CATEGORY_GROUPS[4].items.some((c) => c.value === i.category)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
            <p className="text-gray-600 mt-1">{items.length} items in your collection</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            <span className="text-xl">+</span>
            Add Item
          </button>
        </div>

        {/* Add Item Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden animate-slideDown">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Add New Item</h2>
              <p className="text-sm text-gray-500 mt-1">Add clothes from your closet to get better outfit recommendations</p>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Navy Blue Blazer"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand (optional)</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Zara, H&M"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Category *</label>
                <div className="space-y-4">
                  {CATEGORY_GROUPS.map((group) => (
                    <div key={group.name}>
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">{group.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.value })}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              formData.category === cat.value
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            <span className="mr-1">{cat.emoji}</span>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.id })}
                      className={`w-10 h-10 rounded-full border-3 transition-all ${
                        formData.color === color.id
                          ? 'border-purple-500 scale-110 shadow-lg'
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Style Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Style Tags</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                        formData.userTags.includes(style)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-purple-50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Wardrobe'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'tops', label: 'Tops' },
            { id: 'bottoms', label: 'Bottoms' },
            { id: 'dressesouterwear', label: 'Dresses & Outerwear' },
            { id: 'footwear', label: 'Footwear' },
            { id: 'accessories', label: 'Accessories' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
              }`}
            >
              {filter.label}
              <span className="ml-1 text-xs opacity-75">
                ({itemCounts[filter.id as keyof typeof itemCounts] || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-4xl">👗</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeFilter === 'all' ? 'Your wardrobe is empty' : 'No items in this category'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeFilter === 'all'
                  ? 'Add some items to get personalized outfit suggestions!'
                  : 'Try adding some items or check another category.'}
              </p>
              {activeFilter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Add Your First Item
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const catInfo = getCategoryInfo(item.category);
              const colorInfo = item.color ? getColorInfo(item.color) : null;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                >
                  {/* Image/Placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative flex items-center justify-center">
                    <span className="text-5xl opacity-50">{catInfo.emoji}</span>
                    {colorInfo && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: colorInfo.hex }}
                        title={colorInfo.label}
                      />
                    )}
                    {/* Delete button on hover */}
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="absolute top-2 left-2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {item.name || catInfo.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{catInfo.label}</p>
                    {item.brand && (
                      <p className="text-xs text-purple-600 mt-1">{item.brand}</p>
                    )}
                    {item.userTags && item.userTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.userTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.userTags.length > 2 && (
                          <span className="text-xs text-gray-400">+{item.userTags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Wardrobe;
