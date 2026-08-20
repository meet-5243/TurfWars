import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, Calendar, LayoutDashboard, User, Trophy } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
    }`;

  const mobileLinkClass = (path) =>
    `block px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
    }`;

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-brand-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white to-brand-400 bg-clip-text text-transparent">
                TURFWARS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={linkClass('/')}>
              Home
            </Link>

            {isAuthenticated && (
              <>
                {!isOwner ? (
                  /* Player Links */
                  <Link to="/my-bookings" className={linkClass('/my-bookings')}>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>My Bookings</span>
                    </span>
                  </Link>
                ) : (
                  /* Owner Links */
                  <>
                    <Link to="/owner-dashboard" className={linkClass('/owner-dashboard')}>
                      <span className="flex items-center space-x-1">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>My Turfs</span>
                      </span>
                    </Link>
                    <Link to="/owner-bookings" className={linkClass('/owner-bookings')}>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Manage Bookings</span>
                      </span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Side Buttons (Profile / Auth Actions) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-750/80 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors cursor-pointer">
                  <User className="h-4 w-4 text-brand-400" />
                  <span className="text-sm font-semibold text-gray-200">
                    {user?.name}
                    <span className="ml-1.5 text-xs text-brand-400 capitalize px-1.5 py-0.5 rounded bg-brand-950 border border-brand-900">
                      {user?.role}
                    </span>
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 px-3 py-2 rounded-lg border border-red-900/40 transition-colors duration-200 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-brand-600/25 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={mobileLinkClass('/')}
            >
              Home
            </Link>

            {isAuthenticated && (
              <>
                {!isOwner ? (
                  <Link
                    to="/my-bookings"
                    onClick={() => setIsOpen(false)}
                    className={mobileLinkClass('/my-bookings')}
                  >
                    My Bookings
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/owner-dashboard"
                      onClick={() => setIsOpen(false)}
                      className={mobileLinkClass('/owner-dashboard')}
                    >
                      My Turfs
                    </Link>
                    <Link
                      to="/owner-bookings"
                      onClick={() => setIsOpen(false)}
                      className={mobileLinkClass('/owner-bookings')}
                    >
                      Manage Bookings
                    </Link>
                  </>
                )}
                
                {/* User Details display in mobile menu */}
                <div className="border-t border-gray-800 my-2 pt-2 px-4">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 py-1 hover:text-white transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4 text-brand-400" />
                    <span className="text-sm font-semibold text-gray-200">
                      {user?.name}
                    </span>
                    <span className="text-xs text-brand-400 capitalize px-1 py-0.5 rounded bg-brand-950 border border-brand-900">
                      {user?.role}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="w-full mt-2 flex items-center justify-center space-x-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg border border-red-900/40 text-sm font-medium transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 p-2 border-t border-gray-800 mt-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center text-gray-300 hover:text-white px-3 py-2 text-sm font-medium border border-gray-700 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="text-center bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
