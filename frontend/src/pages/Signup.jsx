import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, AlertCircle, UserPlus, ShieldAlert } from 'lucide-react';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user', // default: player
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, phone, password, role } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !password || !role) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(name, email, password, phone, role);
      if (data.data.role === 'owner') {
        navigate('/owner-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="bg-mesh"></div>
      
      <div className="max-w-md w-full space-y-6 glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Log in instead
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 flex items-start space-x-2 text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Beautiful Role Toggle Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Who are you?
            </label>
            <div className="grid grid-cols-2 gap-3 bg-gray-905/60 p-1 rounded-2xl border border-gray-800">
              <button
                type="button"
                onClick={() => handleRoleChange('user')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-350 flex items-center justify-center space-x-2 ${
                  role === 'user'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Player</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('owner')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-350 flex items-center justify-center space-x-2 ${
                  role === 'owner'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Turf Owner</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={handleChange}
                  className="glass-input pl-10 block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleChange}
                  className="glass-input pl-10 block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handleChange}
                  className="glass-input pl-10 block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handleChange}
                  className="glass-input pl-10 block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/30 transition-all duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Register</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
