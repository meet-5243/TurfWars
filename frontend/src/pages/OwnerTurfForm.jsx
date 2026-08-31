import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, AlertCircle, Info, Sparkles } from 'lucide-react';

const OwnerTurfForm = () => {
  const { id } = useParams(); // if ID is present, we are in edit mode
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    pricePerHour: '',
    sport: 'cricket',
    capacity: '10',
    amenities: '', // will be converted from comma-separated string to array
    images: '',    // will be converted from comma-separated string to array
    maintenanceDates: '', // comma-separated YYYY-MM-DD strings
    isActive: true,
    bookingMode: 'simple',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const { name, location, city, pricePerHour, sport, capacity, amenities, images, maintenanceDates, isActive, bookingMode } = formData;

  useEffect(() => {
    if (isEditMode) {
      const fetchTurfDetails = async () => {
        setFetching(true);
        try {
          const res = await axiosInstance.get(`/turfs/${id}`);
          if (res.data.success) {
            const turf = res.data.data;
            
            // Check if current user owns this turf
            if (turf.owner._id.toString() !== user._id.toString()) {
              navigate('/owner-dashboard');
              return;
            }

            setFormData({
              name: turf.name || '',
              location: turf.location || '',
              city: turf.city || '',
              pricePerHour: turf.pricePerHour || '',
              sport: turf.sport || 'cricket',
              capacity: turf.capacity || '10',
              amenities: turf.amenities ? turf.amenities.join(', ') : '',
              images: turf.images ? turf.images.join(', ') : '',
              maintenanceDates: turf.maintenanceDates ? turf.maintenanceDates.join(', ') : '',
              isActive: turf.isActive !== undefined ? turf.isActive : true,
              bookingMode: turf.bookingMode || 'simple',
            });
          }
        } catch (err) {
          console.error('Error fetching turf details:', err);
          setError('Failed to load turf details for editing.');
        } finally {
          setFetching(false);
        }
      };

      fetchTurfDetails();
    }
  }, [id, isEditMode, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name || !location || !city || !pricePerHour || !sport || !capacity) {
      setError('Please fill in all required fields.');
      return;
    }

    const price = Number(pricePerHour);
    const cap = Number(capacity);

    if (isNaN(price) || price < 0) {
      setError('Price per hour must be a positive number.');
      return;
    }

    if (isNaN(cap) || cap < 1) {
      setError('Capacity must be a positive integer.');
      return;
    }

    // Convert comma-separated string to trimmed arrays
    const amenitiesArray = amenities
      ? amenities.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const imagesArray = images
      ? images.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

    let maintenanceDatesArray = [];
    if (maintenanceDates) {
      const tokens = maintenanceDates.split(',').map((t) => t.trim()).filter(Boolean);
      const allDates = new Set();

      for (const token of tokens) {
        // Match range: YYYY-MM-DD to YYYY-MM-DD or YYYY-MM-DD - YYYY-MM-DD
        const rangeMatch = token.match(/^(\d{4}-\d{2}-\d{2})\s*(?:to|[-–—])\s*(\d{4}-\d{2}-\d{2})$/i);
        if (rangeMatch) {
          const startStr = rangeMatch[1];
          const endStr = rangeMatch[2];
          const start = new Date(startStr);
          const end = new Date(endStr);

          if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            setError(`Invalid date range: "${token}". Make sure start date is before end date.`);
            return;
          }

          let current = new Date(start);
          while (current <= end) {
            allDates.add(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        } else {
          // Match single date: YYYY-MM-DD
          const singleMatch = token.match(/^(\d{4}-\d{2}-\d{2})$/);
          if (singleMatch) {
            allDates.add(singleMatch[1]);
          } else {
            setError(`Invalid date format: "${token}". Use YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD.`);
            return;
          }
        }
      }
      maintenanceDatesArray = Array.from(allDates);
    }

    const payload = {
      name,
      location,
      city,
      pricePerHour: price,
      sport,
      capacity: cap,
      amenities: amenitiesArray,
      images: imagesArray,
      maintenanceDates: maintenanceDatesArray,
      isActive,
      bookingMode,
    };

    setLoading(true);
    try {
      if (isEditMode) {
        await axiosInstance.put(`/turfs/${id}`, payload);
      } else {
        await axiosInstance.post('/turfs', payload);
      }
      navigate('/owner-dashboard');
    } catch (err) {
      console.error('Error saving turf:', err);
      setError(err.response?.data?.message || 'Failed to save turf details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
        <span className="text-gray-400">Loading ground specifications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>

      {/* Back to dashboard */}
      <div className="mb-6">
        <Link
          to="/owner-dashboard"
          className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to dashboard</span>
        </Link>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-gray-800 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-800">
          <div className="p-2.5 bg-brand-950 border border-brand-900 text-brand-400 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isEditMode ? 'Edit Turf Specifications' : 'Register New Turf'}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Fill in the parameters below to configure your ground listings.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-900/60 rounded-xl p-4 flex items-start space-x-2 text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Turf Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={name}
                onChange={handleChange}
                className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                placeholder="e.g. Arena Green Football Ground"
              />
            </div>

            {/* Sport Select */}
            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-gray-300 mb-1.5">
                Sport Category <span className="text-red-500">*</span>
              </label>
              <select
                id="sport"
                name="sport"
                required
                value={sport}
                onChange={handleChange}
                className="glass-input block w-full px-3 py-3 rounded-xl text-white text-sm cursor-pointer"
              >
                <option value="cricket">Cricket</option>
                <option value="pickle ball">Pickle Ball</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1.5">
                Location Details <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={location}
                onChange={handleChange}
                className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                placeholder="e.g. 24th Cross Road, HSR Layout"
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={city}
                onChange={handleChange}
                className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                placeholder="e.g. Bengaluru"
              />
            </div>

            {/* Price Per Hour */}
            <div>
              <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-300 mb-1.5">
                Price per Hour (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="pricePerHour"
                name="pricePerHour"
                required
                min="0"
                value={pricePerHour}
                onChange={handleChange}
                className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                placeholder="e.g. 1200"
              />
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-1.5">
                Max Capacity (Players) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                required
                min="1"
                value={capacity}
                onChange={handleChange}
                className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                placeholder="e.g. 10"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label htmlFor="amenities" className="block text-sm font-medium text-gray-300 mb-1.5">
              Amenities
            </label>
            <input
              type="text"
              id="amenities"
              name="amenities"
              value={amenities}
              onChange={handleChange}
              className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
              placeholder="e.g. Floodlights, Washroom, Drinking Water, Parking (comma separated)"
            />
            <p className="text-xs text-gray-400 mt-1">Provide a comma-separated list of amenities.</p>
          </div>

          {/* Image URLs */}
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-300 mb-1.5">
              Image URLs
            </label>
            <textarea
              id="images"
              name="images"
              value={images}
              onChange={handleChange}
              rows="2"
              className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
              placeholder="e.g. https://images.unsplash.com/photo-1508098682722-e99c43a406b2 (comma separated)"
            />
            <p className="text-xs text-gray-400 mt-1">Provide a comma-separated list of public image link URLs.</p>
          </div>

          {/* Maintenance Dates */}
          <div>
            <label htmlFor="maintenanceDates" className="block text-sm font-medium text-gray-300 mb-1.5">
              Maintenance / Closure Dates (YYYY-MM-DD or Ranges)
            </label>
            <input
              type="text"
              id="maintenanceDates"
              name="maintenanceDates"
              value={maintenanceDates}
              onChange={handleChange}
              className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
              placeholder="e.g. 2026-08-20, 2026-08-22 to 2026-08-25"
            />
            <p className="text-xs text-gray-400 mt-1">Provide individual dates or ranges (e.g. 2026-08-22 to 2026-08-25), separated by commas.</p>
          </div>

          {/* Booking Mode Radio Group */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-900/40 border border-gray-800 p-5 rounded-2xl gap-4">
            <div className="max-w-md">
              <label className="block text-sm font-bold text-white mb-0.5">
                Booking Mode Configuration
              </label>
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-brand-400">Simple:</span> Regular first-come bookings. <br />
                <span className="font-semibold text-brand-400">Auction:</span> Enables Forward Bids (Fri-Sun) & Reverse Bids (Mon-Thu) where you select the winning player's price.
              </p>
            </div>
            <div className="flex space-x-3 w-full sm:w-auto shrink-0 justify-end">
              <label className={`flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${bookingMode === 'simple' ? 'bg-brand-950/80 border-brand-500 text-brand-400' : 'bg-gray-950/40 border-gray-850 text-gray-500 hover:border-gray-800'}`}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="simple"
                  checked={bookingMode === 'simple'}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-xs font-bold uppercase tracking-wider">Simple</span>
              </label>
              <label className={`flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${bookingMode === 'auction' ? 'bg-brand-950/80 border-brand-500 text-brand-400' : 'bg-gray-950/40 border-gray-850 text-gray-500 hover:border-gray-800'}`}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="auction"
                  checked={bookingMode === 'auction'}
                  onChange={handleChange}
                  className="hidden"
                />
                <span className="text-xs font-bold uppercase tracking-wider">Auction</span>
              </label>
            </div>
          </div>

          {/* Status Visibility Checkbox */}
          <div className="flex items-center space-x-3 bg-gray-900/40 border border-gray-800 p-4 rounded-2xl">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={isActive}
              onChange={handleChange}
              className="w-4 h-4 text-brand-600 border-gray-700 bg-gray-900 rounded focus:ring-brand-500 cursor-pointer"
            />
            <div>
              <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer select-none">
                Active Ground Listing
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                If inactive, players will not be able to find or book this ground.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 py-3 px-6 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 shadow-lg shadow-brand-600/30 transition-all duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{isEditMode ? 'Update Turf' : 'Create Turf'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerTurfForm;
