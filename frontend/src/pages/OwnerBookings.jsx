import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Calendar, Clock, IndianRupee, Phone, Mail, User, Check, X, ShieldAlert, AlertCircle, Info, RefreshCw } from 'lucide-react';

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [selectedTurf, setSelectedTurf] = useState('');
  const [turfOptions, setTurfOptions] = useState([]);

  const fetchBookings = async () => {
    try {
      const res = await axiosInstance.get('/bookings/owner');
      if (res.data.success) {
        setBookings(res.data.data);
        
        // Generate options for filtering
        const uniqueTurfs = [];
        const seen = new Set();
        res.data.data.forEach((booking) => {
          if (booking.turf && !seen.has(booking.turf._id)) {
            seen.add(booking.turf._id);
            uniqueTurfs.push({ id: booking.turf._id, name: booking.turf.name });
          }
        });
        setTurfOptions(uniqueTurfs);
      }
    } catch (err) {
      console.error('Error fetching owner bookings:', err);
      setError('Could not retrieve bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleVerifyPayment = async (bookingId, user_name) => {
    setError('');
    setSuccess('');
    try {
      const res = await axiosInstance.patch(`/bookings/${bookingId}/verify-payment`);
      if (res.data.success) {
        setSuccess(`Payment for ${user_name}'s booking was marked as PAID and booking confirmed.`);
        // Update local list state
        setBookings(
          bookings.map((b) =>
            b._id === bookingId ? { ...b, paymentStatus: 'paid', bookingStatus: 'confirmed' } : b
          )
        );
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.message || 'Failed to verify payment.');
    }
  };

  const handleStatusChange = async (bookingId, status, user_name) => {
    setError('');
    setSuccess('');
    try {
      const res = await axiosInstance.patch(`/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        setSuccess(`Booking status for ${user_name} updated to ${status.toUpperCase()}.`);
        setBookings(
          bookings.map((b) => (b._id === bookingId ? { ...b, bookingStatus: status } : b))
        );
      }
    } catch (err) {
      console.error('Error changing booking status:', err);
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Filtered bookings
  const filteredBookings = selectedTurf
    ? bookings.filter((b) => b.turf && b.turf._id === selectedTurf)
    : bookings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manage Bookings</h1>
          <p className="text-gray-400 text-sm mt-1">Verify manual payments and confirm user reservation slots.</p>
        </div>
        
        <button
          onClick={() => {
            setLoading(true);
            fetchBookings();
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 text-sm font-semibold rounded-xl transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sync Requests</span>
        </button>
      </div>

      {/* Filter panel */}
      {turfOptions.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <label className="text-sm font-bold text-gray-300">Filter bookings by ground:</label>
          <select
            value={selectedTurf}
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="glass-input block w-full sm:w-72 px-3 py-2 rounded-xl text-white text-sm cursor-pointer"
          >
            <option value="">All Grounds</option>
            {turfOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notifications */}
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
          <span className="text-gray-400">Fetching reservations...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="glass-panel text-center p-16 rounded-2xl border border-gray-800 max-w-lg mx-auto flex flex-col items-center">
          <Calendar className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Bookings Found</h3>
          <p className="text-gray-400 text-sm">
            {selectedTurf
              ? 'No bookings found for the selected turf ground.'
              : 'No player reservations have been requested yet for your grounds.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const { _id, turf, user: player, date, startTime, endTime, amount, bookingStatus, paymentStatus } = booking;
            return (
              <div key={_id} className="glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col lg:flex-row justify-between gap-6 hover:border-gray-700 transition-colors">
                
                {/* 1. Ground and Player Details */}
                <div className="space-y-4 lg:max-w-md w-full">
                  <div>
                    <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-brand-950 border border-brand-900 text-brand-400">
                      {turf?.name || 'Deleted Turf'}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-wide mt-2">
                      Reserved by: {player?.name || 'Unknown User'}
                    </h3>
                  </div>

                  {/* Player contact */}
                  <div className="space-y-1.5 text-sm text-gray-300 bg-gray-900/40 p-3 rounded-xl border border-gray-800/80">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-brand-400 shrink-0" />
                      <span className="truncate">Name: {player?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-brand-400 shrink-0" />
                      <span>Phone: {player?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-brand-400 shrink-0" />
                      <span className="truncate">Email: {player?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Timing and Amount */}
                <div className="flex flex-col justify-center space-y-3 lg:border-x lg:border-gray-850 lg:px-10 shrink-0">
                  <div className="space-y-1">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Schedule</span>
                    <div className="flex items-center space-x-1.5 text-gray-300 text-sm">
                      <Calendar className="h-4 w-4 text-brand-500" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-gray-300 text-sm">
                      <Clock className="h-4 w-4 text-brand-500" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</span>
                    <div className="flex items-center text-xl font-black text-white">
                      <IndianRupee className="h-4.5 w-4.5 text-brand-400" />
                      <span>{amount}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Badges and Actions */}
                <div className="flex flex-col justify-between items-start lg:items-end gap-4 min-w-[200px]">
                  
                  {/* Status badges */}
                  <div className="space-y-2 text-right w-full lg:w-auto">
                    <div className="flex lg:justify-end gap-2 flex-wrap">
                      {bookingStatus === 'confirmed' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-950/60 text-green-400 border border-green-900/60">
                          Confirmed
                        </span>
                      ) : bookingStatus === 'cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-900/60">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-950/60 text-yellow-400 border border-yellow-900/60">
                          Pending Approval
                        </span>
                      )}

                      {paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-900/60">
                          Unpaid
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Offline payment needs verification.</p>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
                    {paymentStatus === 'unpaid' && (
                      <button
                        onClick={() => handleVerifyPayment(_id, player?.name)}
                        className="flex items-center space-x-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Mark as Paid & Confirm</span>
                      </button>
                    )}

                    {bookingStatus === 'pending' && paymentStatus === 'paid' && (
                      <button
                        onClick={() => handleStatusChange(_id, 'confirmed', player?.name)}
                        className="flex items-center space-x-1 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Confirm Slot</span>
                      </button>
                    )}

                    {(bookingStatus === 'pending' || bookingStatus === 'confirmed') && (
                      <button
                        onClick={() => handleStatusChange(_id, 'cancelled', player?.name)}
                        className="flex items-center space-x-1 px-3.5 py-2 bg-red-950/50 hover:bg-red-900/40 border border-red-900/50 text-red-400 text-xs font-bold rounded-xl transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;
