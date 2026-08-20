import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, Shield, Edit3, Save, X, Check, ShieldAlert } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { name, email, phone, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = { name, email, phone };
      if (password) {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        payload.password = password;
      }

      await updateProfile(payload);
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error(err);
      setError(err || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
    });
    setError('');
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      <div className="bg-mesh"></div>

      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-gray-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-800 gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-950 border border-brand-900 text-brand-400 rounded-2xl">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Profile</h1>
              <p className="text-gray-400 text-xs mt-0.5">View and update your personal credentials.</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/25 transition-all duration-200"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-900/60 rounded-xl p-4 flex items-start space-x-2 text-red-400 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-950/40 border border-green-905/60 rounded-xl p-4 flex items-start space-x-2 text-green-400 text-sm">
            <div className="p-0.5 bg-green-950 rounded-full border border-green-800 text-green-400">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={handleChange}
                  className={`glass-input block w-full pl-10 pr-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm transition-all duration-200 ${
                    !isEditing ? 'opacity-65 bg-gray-900/20 cursor-not-allowed border-transparent' : 'border-gray-800'
                  }`}
                  placeholder="e.g. Meet Patel"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  disabled={!isEditing}
                  value={email}
                  onChange={handleChange}
                  className={`glass-input block w-full pl-10 pr-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm transition-all duration-200 ${
                    !isEditing ? 'opacity-65 bg-gray-900/20 cursor-not-allowed border-transparent' : 'border-gray-800'
                  }`}
                  placeholder="e.g. meet@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={handleChange}
                  className={`glass-input block w-full pl-10 pr-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm transition-all duration-200 ${
                    !isEditing ? 'opacity-65 bg-gray-900/20 cursor-not-allowed border-transparent' : 'border-gray-800'
                  }`}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            {/* Role (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Account Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  disabled
                  value={user?.role === 'owner' ? 'Turf Owner' : 'Player'}
                  className="glass-input block w-full pl-10 pr-3 py-3 rounded-xl text-gray-400 bg-gray-900/20 cursor-not-allowed border-transparent text-sm capitalize"
                />
              </div>
            </div>
          </div>

          {/* Password (only shown if editing) */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-800/80">
              <div className="max-w-md">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  New Password <span className="text-xs text-gray-500">(Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    className="glass-input block w-full pl-10 pr-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                    placeholder="Enter at least 6 characters"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          {isEditing && (
            <div className="flex items-center space-x-3 pt-6 border-t border-gray-800">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 py-2.5 px-5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/25 transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center space-x-1.5 py-2.5 px-5 bg-gray-800 hover:bg-gray-750 text-gray-300 text-sm font-bold rounded-xl transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
