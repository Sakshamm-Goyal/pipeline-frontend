import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold text-purple-600">
          ✨ Elara
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/chat" className="text-gray-700 hover:text-purple-600">Chat</Link>
          <Link to="/wardrobe" className="text-gray-700 hover:text-purple-600">Wardrobe</Link>
          <div className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
