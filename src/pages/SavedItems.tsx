import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { feedbackAPI } from '../services/api';
import { adaptProductToV2 } from '../types/v2';
import toast from 'react-hot-toast';

interface SavedItem {
  _id: string;
  productId: string;
  product?: any;
  createdAt: string;
}

const SavedItems: React.FC = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'liked'>('saved');

  useEffect(() => {
    loadSavedItems();
  }, [activeTab]);

  const loadSavedItems = async () => {
    setLoading(true);
    try {
      const response = await feedbackAPI.getSavedItems();
      const items = response.data?.items || response.data || [];
      setSavedItems(Array.isArray(items) ? items : []);
    } catch (error: any) {
      console.error('Failed to load saved items:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load saved items');
      }
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      // Send dislike to remove from saved
      await feedbackAPI.submitProductFeedback({
        productId,
        type: 'dislike',
        reason: 'Removed from saved',
      });
      setSavedItems((prev) => prev.filter((item) => item.productId !== productId));
      toast.success('Item removed from saved');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
          <p className="text-gray-600 mt-2">
            Products and outfits you've saved for later
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'saved'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Saved Products
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'liked'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Liked Items
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-3 border-gray-300 border-t-purple-500 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading saved items...</p>
            </div>
          </div>
        ) : savedItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved items yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              When you find products or outfits you love, save them here for easy access later.
            </p>
            <a
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedItems.map((item) => {
              const product = item.product ? adaptProductToV2(item.product) : null;
              if (!product) return null;

              return (
                <div key={item._id} className="relative group">
                  <ProductCard product={product} />
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from saved"
                  >
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {savedItems.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                {savedItems.length} item{savedItems.length !== 1 ? 's' : ''} saved
              </span>
              <button
                onClick={loadSavedItems}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItems;
