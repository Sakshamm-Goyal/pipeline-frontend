import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import WardrobeItemCard from '../components/WardrobeItemCard';
import WardrobeUploadZone from '../components/WardrobeUploadZone';
import EditWardrobeItemModal from '../components/EditWardrobeItemModal';
import { wardrobeAPI } from '../services/api';
import { WardrobeItem, WardrobeStats } from '../types/wardrobe';
import { toast } from 'react-hot-toast';

// Filter categories
const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Items', categories: [] },
  {
    id: 'tops',
    label: 'Tops',
    categories: ['tshirt', 'shirt', 'blouse', 'tank_top', 'crop_top', 'sweater', 'hoodie', 'sweatshirt', 'cardigan'],
  },
  {
    id: 'bottoms',
    label: 'Bottoms',
    categories: ['jeans', 'pants', 'shorts', 'skirt', 'leggings', 'joggers'],
  },
  {
    id: 'dresses',
    label: 'Dresses & Jumpsuits',
    categories: ['dress', 'jumpsuit', 'romper'],
  },
  {
    id: 'outerwear',
    label: 'Outerwear',
    categories: ['jacket', 'coat', 'blazer', 'vest', 'parka'],
  },
  {
    id: 'footwear',
    label: 'Footwear',
    categories: ['sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    categories: ['bag', 'backpack', 'belt', 'hat', 'scarf', 'sunglasses', 'jewelry', 'watch'],
  },
  {
    id: 'favorites',
    label: 'Favorites',
    categories: [],
  },
];

const Wardrobe: React.FC = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [stats, setStats] = useState<WardrobeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'worn' | 'name'>('recent');
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    setLoading(true);
    try {
      const [itemsResponse, statsResponse] = await Promise.all([
        wardrobeAPI.getItems(),
        wardrobeAPI.getStats().catch(() => null),
      ]);

      setItems(itemsResponse.data.items || itemsResponse.data || []);
      if (statsResponse?.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error('Failed to load wardrobe:', err);
      toast.error('Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = () => {
    loadWardrobe();
  };

  const handleItemDelete = () => {
    loadWardrobe();
  };

  const handleEditItem = (item: WardrobeItem) => {
    setEditingItem(item);
  };

  const handleEditSave = () => {
    setEditingItem(null);
    loadWardrobe();
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.name?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.userTags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
        item.aiAnalysis?.style?.some((style) => style.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'favorites') return item.isFavorite;

    const filterConfig = FILTER_CATEGORIES.find(f => f.id === activeFilter);
    if (filterConfig && filterConfig.categories.length > 0) {
      return filterConfig.categories.includes(item.category);
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'worn':
        return (b.timesWorn || 0) - (a.timesWorn || 0);
      case 'name':
        return (a.name || a.category).localeCompare(b.name || b.category);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Calculate category counts
  const getCategoryCount = (filterId: string): number => {
    if (filterId === 'all') return items.length;
    if (filterId === 'favorites') return items.filter(i => i.isFavorite).length;

    const filterConfig = FILTER_CATEGORIES.find(f => f.id === filterId);
    if (filterConfig && filterConfig.categories.length > 0) {
      return items.filter(i => filterConfig.categories.includes(i.category)).length;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
          <p className="text-gray-600 mt-1">
            {items.length} items in your collection
            {stats?.totalValue && (
              <span className="ml-2 text-purple-600">
                (${stats.totalValue.toFixed(0)} total value)
              </span>
            )}
          </p>
        </div>

        {/* Upload Zone - Always visible at top */}
        <div className="mb-8">
          <WardrobeUploadZone onUploadComplete={loadWardrobe} />
        </div>

        {/* Stats Overview (if available) */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Favorites</p>
              <p className="text-2xl font-bold text-red-500">{stats.favoriteItems}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Avg Times Worn</p>
              <p className="text-2xl font-bold text-purple-600">{stats.averageTimesWorn?.toFixed(1) || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(stats.categoryCounts || {}).length}
              </p>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, brand, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'worn' | 'name')}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="recent">Recently Added</option>
            <option value="worn">Most Worn</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_CATEGORIES.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
              }`}
            >
              {filter.id === 'favorites' && (
                <span className="mr-1">❤️</span>
              )}
              {filter.label}
              <span className="ml-1 text-xs opacity-75">
                ({getCategoryCount(filter.id)})
              </span>
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery
                ? 'No items match your search'
                : activeFilter === 'favorites'
                ? 'No favorite items yet'
                : activeFilter === 'all'
                ? 'Your wardrobe is empty'
                : 'No items in this category'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? 'Try a different search term or clear your search'
                : activeFilter === 'favorites'
                ? 'Mark items as favorites by clicking the heart icon'
                : 'Drop images above to add items - AI will automatically categorize them!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedItems.map((item) => (
              <WardrobeItemCard
                key={item._id}
                item={item}
                onUpdate={handleItemUpdate}
                onDelete={handleItemDelete}
                onEdit={() => handleEditItem(item)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && sortedItems.length > 0 && (
          <p className="text-center text-gray-500 mt-8">
            Showing {sortedItems.length} of {items.length} items
          </p>
        )}
      </div>

      {/* Edit Item Modal */}
      <EditWardrobeItemModal
        item={editingItem}
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleEditSave}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Wardrobe;
