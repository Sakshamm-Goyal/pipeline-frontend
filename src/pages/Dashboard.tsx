import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName}! 👋</h1>
        <p className="text-gray-600 mb-12">Your AI-powered fashion assistant is ready to help</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/chat"
            className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-lg shadow-lg hover:shadow-xl transition text-white"
          >
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2">Chat with Elara</h2>
            <p className="text-purple-100">
              Ask for outfit suggestions, product searches, or fashion advice. Our AI will help you look your best!
            </p>
          </Link>

          <Link
            to="/wardrobe"
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-lg shadow-lg hover:shadow-xl transition text-white"
          >
            <div className="text-4xl mb-4">👗</div>
            <h2 className="text-2xl font-bold mb-2">Manage Wardrobe</h2>
            <p className="text-blue-100">
              Add your clothing items, organize by category, and let AI suggest perfect combinations.
            </p>
          </Link>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-lg shadow-lg text-white">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Outfit Recommendations</h2>
            <p className="text-green-100">
              Get personalized outfit suggestions based on weather, occasion, and your style preferences.
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-8 rounded-lg shadow-lg text-white">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">Style Analytics</h2>
            <p className="text-pink-100">
              Track your fashion preferences and discover new styles that match your taste.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-purple-50 border-l-4 border-purple-600 p-6 rounded">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">✨ Quick Tips</h3>
          <ul className="text-purple-700 space-y-2">
            <li>• Try asking "Find me a casual outfit for a coffee date"</li>
            <li>• Add items to your wardrobe to get better recommendations</li>
            <li>• Mention your location for weather-aware outfit suggestions</li>
            <li>• Ask about outfit scoring and compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
