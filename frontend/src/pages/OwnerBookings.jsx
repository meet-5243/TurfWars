import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Calendar, Clock, IndianRupee, Phone, Mail, User, Check, X, ShieldAlert, AlertCircle, Info, RefreshCw } from 'lucide-react';

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedDate, setExpandedDate] = useState(null);

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
        fetchBookings();
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
        fetchBookings();
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

  // Group filtered bookings by date
  const groupedBookings = filteredBookings.reduce((acc, b) => {
    const dateKey = b.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(b);
    return acc;
  }, {});

  // Sort dates: newest dates first
  const sortedDates = Object.keys(groupedBookings).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const formattedDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

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
      ) : sortedDates.length === 0 ? (
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
          {sortedDates.map((dateStr) => {
            const dateBookings = groupedBookings[dateStr];
            const isDateExpanded = expandedDate === dateStr;
            
            // Summarize bids/bookings for this date
            const totalCount = dateBookings.length;
            const bidCount = dateBookings.filter(b => b.isBid).length;
            const simpleCount = totalCount - bidCount;

            return (
              <div 
                key={dateStr}
                className="glass-panel rounded-2xl border border-gray-850 hover:border-gray-750 transition-all duration-200 overflow-hidden shadow-lg bg-gray-950/20"
              >
                {/* Date Summary Card Header */}
                <div 
                  onClick={() => setExpandedDate(isDateExpanded ? null : dateStr)}
                  className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none hover:bg-gray-900/20 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-white tracking-wide">
                      {formattedDate(dateStr)}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-brand-500"></span>
                      <span>{totalCount} Request{totalCount > 1 ? 's' : ''} Active</span>
                      {bidCount > 0 && <span className="text-cyan-400">({bidCount} Bid{bidCount > 1 ? 's' : ''})</span>}
                      {simpleCount > 0 && <span className="text-brand-400">({simpleCount} Simple Booking{simpleCount > 1 ? 's' : ''})</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand-400 uppercase bg-brand-950 border border-brand-900 px-3.5 py-1.5 rounded-xl transition-all hover:bg-brand-900 hover:text-white">
                      {isDateExpanded ? 'Hide Requests' : 'View Requests'}
                    </span>
                    <div className="text-gray-500 pl-1">
                      {isDateExpanded ? (
                        <svg xmlns="http://www.w3.org/2005/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2005/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-list of individual Bookings for this Date */}
                {isDateExpanded && (
                  <div className="border-t border-gray-900 bg-gray-950/40 p-6 space-y-6">
                    {dateBookings.map((booking) => {
                      const { _id, turf, user: player, date: bDate, startTime, endTime, amount, bookingStatus, paymentStatus, isBid, bidAmount, isAutoSelected } = booking;
                      const bookingDate = new Date(bDate);
                      const dayOfWeek = bookingDate.getDay();
                      const isForward = [0, 5, 6].includes(dayOfWeek);

                      return (
                        <div 
                          key={_id}
                          className="bg-gray-900/20 rounded-2xl p-5 border border-gray-850 hover:border-gray-800 transition-colors flex flex-col lg:flex-row justify-between gap-6"
                        >
                          {/* 1. Ground Info */}
                          <div className="space-y-4 lg:max-w-md w-full">
                            <div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-brand-950 border border-brand-900 text-brand-400">
                                  {turf?.name || 'Deleted Turf'}
                                </span>
                                {isBid && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${isForward ? 'bg-cyan-950 border border-cyan-800 text-cyan-400' : 'bg-pink-950 border border-pink-900 text-pink-400'}`}>
                                    {isForward ? 'Forward Bid' : 'Reverse Bid'} (₹{bidAmount}/hr)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5 text-gray-300 font-semibold text-sm mt-2">
                                <Clock className="h-4 w-4 text-brand-500" />
                                <span>{startTime} - {endTime}</span>
                              </div>
                            </div>

                            {/* Player contact */}
                            <div className="space-y-1.5 text-xs text-gray-300 bg-gray-950/50 p-3 rounded-xl border border-gray-850">
                              <div className="flex items-center space-x-2">
                                <User className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                                <span className="font-semibold text-white">Player: {player?.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                                <span>Phone: {player?.phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                                <span className="truncate">Email: {player?.email || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Amount and Badges */}
                          <div className="flex flex-col justify-center space-y-3 lg:border-x lg:border-gray-850 lg:px-8 shrink-0">
                            <div>
                              <span className="block text-[10px] font-bold text-gray-505 uppercase tracking-wider">
                                {isBid ? 'Bid Total' : 'Total Price'}
                              </span>
                              <div className="flex items-center text-lg font-black text-white">
                                <IndianRupee className="h-4 w-4 text-brand-400" />
                                <span>{amount}</span>
                              </div>
                            </div>

                             <div className="flex flex-wrap gap-2">
                               {bookingStatus === 'confirmed' ? (
                                 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-950/60 text-green-400 border border-green-900/60 uppercase">
                                   Confirmed
                                 </span>
                               ) : bookingStatus === 'cancelled' ? (
                                 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-950/60 text-red-400 border border-red-900/60 uppercase">
                                   Cancelled
                                 </span>
                               ) : bookingStatus === 'rejected' ? (
                                 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-950/20 text-red-500/80 border border-red-950/40 uppercase">
                                   Rejected
                                 </span>
                               ) : (
                                 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-yellow-950/60 text-yellow-400 border border-yellow-900/60 uppercase">
                                   Pending
                                 </span>
                               )}

                               {bookingStatus === 'confirmed' && isAutoSelected && (
                                 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-cyan-950 border border-cyan-800 text-cyan-400 uppercase animate-pulse">
                                   Automatic Selected
                                 </span>
                               )}

                              {paymentStatus === 'paid' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 uppercase">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-950/60 text-amber-400 border border-amber-900/60 uppercase">
                                  Unpaid
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 3. Action Buttons */}
                          <div className="flex flex-col justify-center items-start lg:items-end gap-2 min-w-[200px]">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</span>
                            <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
                              {paymentStatus === 'unpaid' && bookingStatus !== 'rejected' && bookingStatus !== 'cancelled' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyPayment(_id, player?.name);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Mark Paid</span>
                                </button>
                              )}

                              {bookingStatus === 'pending' && isBid && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(_id, 'confirmed', player?.name);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept Bid</span>
                                </button>
                              )}

                              {bookingStatus === 'pending' && !isBid && paymentStatus === 'paid' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(_id, 'confirmed', player?.name);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Confirm</span>
                                </button>
                              )}

                              {(bookingStatus === 'pending' || bookingStatus === 'confirmed') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(_id, 'cancelled', player?.name);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-950/50 hover:bg-red-900/40 border border-red-900/50 text-red-400 text-xs font-bold rounded-lg transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </button>
                              )}

                              {bookingStatus === 'pending' && isBid && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(_id, 'rejected', player?.name);
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-950/55 hover:bg-red-900/45 border border-red-900/60 text-red-400 text-xs font-bold rounded-lg transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
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
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;
