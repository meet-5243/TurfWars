import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Calendar, Clock, IndianRupee, Phone, Mail, Award, CheckCircle, Info, ArrowLeft } from 'lucide-react';

const TurfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isOwner, user } = useAuth();

  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Time slots for selection
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    '22:00', '23:00'
  ];

  // Calculate today's date string for input min attribute
  const todayStr = new Date().toISOString().split('T')[0];

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

  // Calculate pricing
  const getCalculatedPrice = () => {
    if (!startTime || !endTime || !turf) return 0;
    const startMins = convertToMins(startTime);
    const endMins = convertToMins(endTime);
    if (startMins >= endMins) return 0;

    const hours = (endMins - startMins) / 60;
    return turf.pricePerHour * hours;
  };

  const convertToMins = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!turf?.isActive) {
      setBookingError('This turf is currently inactive.');
      return;
    }

    const isMaintenanceDay = date && turf?.maintenanceDates?.includes(date);
    if (isMaintenanceDay) {
      setBookingError('This turf is under maintenance on the selected date.');
      return;
    }

    if (!date || !startTime || !endTime) {
      setBookingError('Please select a date, start time, and end time.');
      return;
    }

    const startMins = convertToMins(startTime);
    const endMins = convertToMins(endTime);

    if (startMins >= endMins) {
      setBookingError('End time must be after start time.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await axiosInstance.post('/bookings', {
        turf: id,
        date,
        startTime,
        endTime,
      });

      if (res.data.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          navigate('/my-bookings');
        }, 3000);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.response?.data?.message || 'Booking overlapping or request failed.');
    } finally {
      setBookingLoading(false);
    }
  };

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
  const totalAmount = getCalculatedPrice();

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

        {/* Right Column: Booking panel */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-900/10 shadow-2xl relative">
            
            {bookingSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="inline-flex p-3 bg-brand-950/60 rounded-full border border-brand-800 text-brand-400 animate-pulse">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-white">Booking Requested!</h3>
                <p className="text-gray-300 text-sm">
                  Your slot request has been sent. Please make payment offline. Redirecting you to booking dashboard...
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-5 flex items-center">
                  <Calendar className="mr-2 text-brand-500 h-5 w-5" />
                  Book Your Slot
                </h3>

                {bookingError && (
                  <div className="mb-4 bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {date && turf?.maintenanceDates?.includes(date) && (
                  <div className="mb-4 bg-red-950/40 border border-red-900/60 rounded-xl p-3 flex items-start space-x-2 text-red-400 text-xs font-semibold">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>This turf is under maintenance on this date. Bookings are disabled.</span>
                  </div>
                )}

                {/* Verification/Auth Guards */}
                {!isActive ? (
                  <div className="text-center py-6 px-4 bg-red-950/20 border border-red-900/40 rounded-2xl text-red-400 text-sm">
                    <Info className="h-6 w-6 mx-auto mb-2" />
                    <span>This turf is currently inactive. Bookings are temporarily suspended.</span>
                  </div>
                ) : isOwner ? (
                  <div className="text-center py-6 px-4 bg-yellow-950/20 border border-yellow-900/40 rounded-2xl text-yellow-400 text-sm">
                    <Info className="h-6 w-6 mx-auto mb-2" />
                    <span>You are logged in as a <strong>Turf Owner</strong>. Owners cannot book slots on turfs.</span>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    {/* Date */}
                    <div>
                      <label htmlFor="date" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Select Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        required
                        min={todayStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="glass-input block w-full px-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm"
                      />
                    </div>

                    {/* Start & End Times */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="startTime" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Start Time
                        </label>
                        <select
                          id="startTime"
                          required
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="glass-input block w-full px-3 py-3 rounded-xl text-white text-sm cursor-pointer"
                        >
                          <option value="">Start</option>
                          {timeSlots.slice(0, -1).map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="endTime" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          End Time
                        </label>
                        <select
                          id="endTime"
                          required
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="glass-input block w-full px-3 py-3 rounded-xl text-white text-sm cursor-pointer"
                        >
                          <option value="">End</option>
                          {timeSlots.map((time) => (
                            // Only allow times that are greater than start time if start time is selected
                            (!startTime || convertToMins(time) > convertToMins(startTime)) && (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            )
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Estimate Box */}
                    {totalAmount > 0 && (
                      <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-900/30 flex justify-between items-center mt-6">
                        <span className="text-sm font-semibold text-gray-300">Total Estimation</span>
                        <div className="flex items-center text-xl font-black text-brand-400">
                          <IndianRupee className="h-4.5 w-4.5" />
                          <span>{totalAmount}</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Instruction Notice */}
                    <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 leading-relaxed mt-4 space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-gray-300 mb-1">
                        <Info className="h-4 w-4 text-brand-400" />
                        <span>Payment Verification Info</span>
                      </div>
                      <p>
                        Pay the owner directly using Cash or UPI (use owner contact info below). 
                        Your booking request remains <strong className="text-yellow-400">Pending</strong> until the owner verifies payment.
                      </p>
                    </div>

                    {/* Action Button */}
                    {isAuthenticated ? (
                      <button
                        type="submit"
                        disabled={bookingLoading || !date || !startTime || !endTime || turf?.maintenanceDates?.includes(date)}
                        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/30 transition-all duration-200 mt-6"
                      >
                        {bookingLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <span>Book Slot Now</span>
                        )}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-700 hover:border-gray-500 rounded-xl text-sm font-bold text-gray-300 hover:text-white transition-colors duration-200 mt-6 text-center"
                      >
                        Login as Player to Book
                      </Link>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetails;
