import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Calendar, Clock, IndianRupee, Phone, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [expandedDate, setExpandedDate] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await axiosInstance.get('/bookings/mine');
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      setError('Could not retrieve your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getBookingStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-950/60 text-green-400 border border-green-900/60">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-900/60">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Cancelled
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/20 text-red-500/80 border border-red-950/40">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rejected / Outbid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-950/60 text-yellow-400 border border-yellow-900/60">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Pending Approval
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
            Paid & Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-900/60">
            Unpaid (Verify Offline)
          </span>
        );
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const activeBookings = bookings.filter(b => 
    (b.bookingStatus === 'pending' || b.bookingStatus === 'confirmed') && b.date >= todayStr
  );

  const historyBookings = bookings.filter(b => 
    b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected' || b.date < todayStr
  );

  const displayBookings = activeTab === 'active' ? activeBookings : historyBookings;

  // Group bookings by date
  const groupedBookings = displayBookings.reduce((acc, b) => {
    const dateKey = b.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(b);
    return acc;
  }, {});

  // Sort dates: newest first
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Bookings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and track status of slots you have booked.</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchBookings();
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 text-sm font-semibold rounded-xl transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 p-1 bg-gray-950/40 border border-gray-900 rounded-2xl max-w-md mb-8">
        <button
          onClick={() => {
            setActiveTab('active');
            setExpandedDate(null);
          }}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Active Bookings ({activeBookings.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            setExpandedDate(null);
          }}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-brand-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Booking History ({historyBookings.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
          <span className="text-gray-400">Syncing details...</span>
        </div>
      ) : error ? (
        <div className="glass-panel text-center p-12 rounded-2xl border border-red-950/20 max-w-lg mx-auto">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="glass-panel text-center p-16 rounded-2xl border border-gray-800 max-w-lg mx-auto">
          <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {activeTab === 'active' ? 'No Active Bookings' : 'No Booking History'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {activeTab === 'active'
              ? "You don't have any upcoming reservations. Browse turfs to reserve a slot!"
              : "No past or cancelled bookings found in your history."}
          </p>
          {activeTab === 'active' && (
            <a
              href="/"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all inline-block"
            >
              Browse Turf Grounds
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateBookings = groupedBookings[dateStr];
            const isDateExpanded = expandedDate === dateStr;
            const totalCount = dateBookings.length;

            return (
              <div 
                key={dateStr}
                className="glass-panel rounded-2xl border border-gray-850 hover:border-gray-750 transition-all duration-205 overflow-hidden shadow-lg bg-gray-950/20"
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
                      <span>{totalCount} Slot{totalCount > 1 ? 's' : ''} Booked / Requested</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand-400 uppercase bg-brand-950 border border-brand-900 px-3.5 py-1.5 rounded-xl transition-all hover:bg-brand-900 hover:text-white">
                      {isDateExpanded ? 'Hide Slots' : 'View Slots'}
                    </span>
                    <div className="text-gray-505 pl-1">
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

                {/* Sub-list of user reservations */}
                {isDateExpanded && (
                  <div className="border-t border-gray-900 bg-gray-950/40 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dateBookings.map((booking) => {
                        const { _id, turf, startTime, endTime, amount, bookingStatus, paymentStatus, owner, isBid, bidAmount, isAutoSelected } = booking;
                        return (
                          <div key={_id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-gray-850 bg-gray-900/10">
                            {/* Header */}
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="text-lg font-bold text-white tracking-wide">
                                    {turf?.name || 'Deleted Turf'}
                                  </h3>
                                  {isBid && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-950 border border-cyan-800 text-cyan-400 animate-pulse">
                                      Auction Bid (₹{bidAmount}/hr)
                                    </span>
                                  )}
                                </div>
                                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-brand-950 border border-brand-900 text-brand-400">
                                  {turf?.sport || 'sport'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 flex items-center mt-2.5">
                                📍 {turf?.location}, {turf?.city}
                              </p>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-800/80 text-sm">
                              <div className="space-y-1.5">
                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Schedule</span>
                                <div className="flex items-center space-x-1.5 text-gray-300">
                                  <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                                  <span>{startTime} - {endTime}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  {isBid ? 'Bid Cost' : 'Cost'}
                                </span>
                                <div className="flex items-center text-lg font-extrabold text-white">
                                  <IndianRupee className="h-4.5 w-4.5 text-brand-400" />
                                  <span>{amount}</span>
                                </div>
                              </div>
                            </div>

                            {/* Badges and Verification help */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex flex-wrap gap-2">
                                {getBookingStatusBadge(bookingStatus)}
                                {getPaymentStatusBadge(paymentStatus)}
                                {bookingStatus === 'confirmed' && isAutoSelected && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-900/60 animate-pulse">
                                    Automatic Selected
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Info block to pay owner */}
                            {paymentStatus === 'unpaid' && bookingStatus !== 'cancelled' && bookingStatus !== 'rejected' && (
                              <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 space-y-1.5">
                                <span className="font-semibold text-gray-300 block">Offline Payment Instructions:</span>
                                <p>Contact the owner directly to pay cash or UPI in person/online:</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-brand-400 font-medium">
                                  <span className="flex items-center">
                                    👤 {owner?.name || 'Owner'}
                                  </span>
                                  {owner?.phone && (
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" /> {owner.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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

export default MyBookings;
