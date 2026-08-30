import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Calendar, IndianRupee, Phone, Mail, Award, Info, ArrowLeft } from 'lucide-react';

const TurfDetails = () => {
  const { id } = useParams();
  const { isOwner } = useAuth();

  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const res = await axiosInstance.get(`/turfs/${id}`);
        if (res.data.success) {
          setTurf(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching turf details:', err);
        setError(err.response?.data?.message || 'Turf details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchTurf();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
        <span className="text-gray-400">Loading ground details...</span>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="glass-panel p-8 rounded-2xl border border-red-950/20">
          <p className="text-red-400 font-bold mb-4">{error || 'Turf not found'}</p>
          <Link to="/" className="inline-flex items-center space-x-1.5 text-brand-400 hover:text-brand-300">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Turf Listings</span>
          </Link>
        </div>
      </div>
    );
  }

  const { name, location, city, pricePerHour, sport, capacity, amenities, owner, isActive } = turf;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>
      
      {/* Back navigation */}
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to active listings</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Turf Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="px-3 py-1 text-xs font-extrabold uppercase tracking-wider rounded-lg bg-brand-950 border border-brand-900 text-brand-400">
                {sport}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">{name}</h1>
              <p className="text-gray-400 mt-2 flex items-start text-sm sm:text-base">
                <MapPin className="h-5 w-5 text-brand-500 mr-2 shrink-0 mt-0.5" />
                <span>{location}, {city}</span>
              </p>
            </div>

            {/* Key details grid */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-gray-900/50 border border-gray-800 text-center">
              <div>
                <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Capacity</span>
                <span className="text-white font-extrabold text-lg flex items-center justify-center mt-1">
                  <Users className="h-4 w-4 text-brand-400 mr-1.5" />
                  {capacity}
                </span>
              </div>
              <div className="border-x border-gray-800">
                <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Price</span>
                <span className="text-white font-extrabold text-lg flex items-center justify-center mt-1">
                  <IndianRupee className="h-4 w-4 text-brand-400" />
                  {pricePerHour}/hr
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Sport</span>
                <span className="text-white font-extrabold text-lg capitalize flex items-center justify-center mt-1">
                  <Award className="h-4 w-4 text-brand-400 mr-1.5" />
                  {sport}
                </span>
              </div>
            </div>

            {/* Amenities */}
            {amenities && amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Amenities Available</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-300 text-sm font-medium"
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Contact Information */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Turf Owner Contact</h3>
              <div className="glass-card rounded-2xl p-5 border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-white font-bold">{owner?.name || 'Owner'}</h4>
                  <p className="text-gray-400 text-xs mt-0.5">Contact directly for payment and confirmation queries.</p>
                </div>
                <div className="space-y-1.5 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-brand-400" />
                    <span>{owner?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-brand-400" />
                    <span>{owner?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Booking details & CTA */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-900/10 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Calendar className="mr-2 text-brand-500 h-5 w-5" />
              Book This Ground
            </h3>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800 text-center">
              <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Rate</span>
              <span className="text-brand-400 font-black text-3xl flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-brand-400" />
                {pricePerHour} <span className="text-sm font-semibold text-gray-400 ml-1">/ hour</span>
              </span>
            </div>

            {/* General Info */}
            <div className="space-y-3.5 text-sm text-gray-300">
              <div className="flex justify-between flex-wrap gap-2">
                <span>Availability</span>
                <span className="text-emerald-400 font-bold">Open Daily (06:00 - 00:00)</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity</span>
                <span className="text-white font-bold">{capacity} Players</span>
              </div>
              <div className="flex justify-between">
                <span>Sport Category</span>
                <span className="text-white capitalize font-bold">{sport}</span>
              </div>
            </div>

            {/* Action CTA Button */}
            {!isActive ? (
              <div className="text-center py-4 px-4 bg-red-950/20 border border-red-900/40 rounded-2xl text-red-400 text-sm">
                <span>This turf is currently inactive. Bookings are temporarily suspended.</span>
              </div>
            ) : isOwner ? (
              <div className="text-center py-4 px-4 bg-yellow-950/20 border border-yellow-900/40 rounded-2xl text-yellow-400 text-sm">
                <span>Logged in as <strong>Owner</strong>. Owners cannot book slots.</span>
              </div>
            ) : (
              <Link
                to={`/turfs/${id}/book`}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl text-sm font-extrabold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all duration-200 mt-4 text-center"
              >
                Book Your Slot Now
              </Link>
            )}

            <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-gray-300 mb-1">
                <Info className="h-4 w-4 text-brand-400" />
                <span>How booking works</span>
              </div>
              <p>
                Click above to view the live slot grid, select your preferred date and duration, and confirm your slots instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetails;
