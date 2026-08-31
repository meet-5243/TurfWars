import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, IndianRupee, Info, CheckCircle, ArrowLeft, Users, Award, MapPin } from 'lucide-react';

const BookTurf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isOwner } = useAuth();

  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bidAmount, setBidAmount] = useState('');

  // Time slots for selection (hourly intervals)
  const hourlySlots = [
    { start: '06:00', end: '07:00' },
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
    { start: '20:00', end: '21:00' },
    { start: '21:00', end: '22:00' },
    { start: '22:00', end: '23:00' },
    { start: '23:00', end: '00:00' },
  ];

  // Helper to format date in YYYY-MM-DD locally
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();

  // Calendar states and helpers
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const now = new Date();
    if (prev.getFullYear() < now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() < now.getMonth())) {
      return;
    }
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  useEffect(() => {
    if (!date) return;
    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const res = await axiosInstance.get(`/bookings/turf/${id}?date=${date}`);
        if (res.data.success) {
          setExistingBookings(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
    setStartTime('');
    setEndTime('');
  }, [date, id]);

  const convertToMins = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getEndTimeMins = (timeStr) => {
    if (timeStr === '00:00') return 24 * 60;
    return convertToMins(timeStr);
  };

  const convertMinsToTime = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hours === 24) return '00:00';
    return `${pad(hours)}:${pad(minutes)}`;
  };

  // Get auction details based on the selected date
  const getAuctionDetails = () => {
    if (!date) return { isAuction: false };
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay(); // 0 = Sun, 1 = Mon, ...
    const isForward = [0, 5, 6].includes(dayOfWeek);
    return {
      isAuction: turf?.bookingMode === 'auction',
      type: isForward ? 'forward' : 'reverse',
      typeName: isForward ? 'Forward Auction (Fri-Sun)' : 'Reverse Auction (Mon-Thu)',
      typeDesc: isForward 
        ? 'Place a bid higher than or equal to the base hourly rate and greater than the current highest bid.' 
        : 'Place a bid lower than or equal to the base hourly rate.',
    };
  };

  // Find the highest pending bid for the currently selected slot time range
  const getSlotHighestBid = () => {
    if (!startTime || !endTime || !existingBookings || turf?.bookingMode !== 'auction') return 0;
    const startMins = convertToMins(startTime);
    const endMins = getEndTimeMins(endTime);

    const overlapping = existingBookings.filter(b => {
      if (b.bookingStatus !== 'pending') return false;
      const bStart = convertToMins(b.startTime);
      const bEnd = getEndTimeMins(b.endTime);
      return bStart < endMins && bEnd > startMins;
    });

    return overlapping.reduce((max, b) => Math.max(max, b.bidAmount || 0), 0);
  };

  // Calculate pricing
  const getCalculatedPrice = () => {
    if (!startTime || !endTime || !turf) return 0;
    const startMins = convertToMins(startTime);
    const endMins = getEndTimeMins(endTime);
    if (startMins >= endMins) return 0;

    const hours = (endMins - startMins) / 60;
    const rate = turf.bookingMode === 'auction' && bidAmount ? Number(bidAmount) : turf.pricePerHour;
    return rate * hours;
  };

  const getSlotStatus = (slotStart, slotEnd) => {
    if (date === todayStr) {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMin = currentTime.getMinutes();
      const [slotHour, slotMin] = slotStart.split(':').map(Number);
      if (slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMin)) {
        return 'booked';
      }
    }

    const startMins = convertToMins(slotStart);
    const endMins = getEndTimeMins(slotEnd);

    const match = existingBookings.find(b => {
      const bStart = convertToMins(b.startTime);
      const bEnd = getEndTimeMins(b.endTime);
      return bStart < endMins && bEnd > startMins;
    });

    if (match) {
      return match.bookingStatus === 'confirmed' ? 'booked' : 'busy';
    }

    return 'available';
  };

  const isSlotSelected = (slotStart, slotEnd) => {
    if (!startTime || !endTime) return false;
    const startMins = convertToMins(slotStart);
    const endMins = getEndTimeMins(slotEnd);
    const selStart = convertToMins(startTime);
    const selEnd = getEndTimeMins(endTime);
    return startMins >= selStart && endMins <= selEnd;
  };

  const isStartSlotSelectable = (slotStart) => {
    const startMins = convertToMins(slotStart);
    const endMins = startMins + duration * 60;

    if (endMins > 24 * 60) return false;

    const hasOverlap = existingBookings.some(b => {
      const bStart = convertToMins(b.startTime);
      const bEnd = getEndTimeMins(b.endTime);
      if (turf?.bookingMode === 'auction') {
        return b.bookingStatus === 'confirmed' && bStart < endMins && bEnd > startMins;
      }
      return bStart < endMins && bEnd > startMins;
    });

    if (hasOverlap) return false;

    if (date === todayStr) {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMin = currentTime.getMinutes();
      const [slotHour, slotMin] = slotStart.split(':').map(Number);
      if (slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMin)) {
        return false;
      }
    }

    return true;
  };

  const handleSlotClick = (slotStart) => {
    const startMins = convertToMins(slotStart);
    const endMins = startMins + duration * 60;

    if (endMins > 24 * 60) {
      setBookingError('Booking duration exceeds operating hours. Operational hours end at 00:00.');
      return;
    }

    const calculatedEndTime = convertMinsToTime(endMins);

    const hasOverlap = existingBookings.some(b => {
      const bStart = convertToMins(b.startTime);
      const bEnd = getEndTimeMins(b.endTime);
      if (turf?.bookingMode === 'auction') {
        return b.bookingStatus === 'confirmed' && bStart < endMins && bEnd > startMins;
      }
      return bStart < endMins && bEnd > startMins;
    });

    if (hasOverlap) {
      setBookingError(
        turf?.bookingMode === 'auction'
          ? 'Selected duration overlaps with a confirmed booking. Please choose another slot.'
          : 'Selected duration overlaps with an existing booking. Please choose another start slot or reduce duration.'
      );
      return;
    }

    setBookingError('');
    setStartTime(slotStart);
    setEndTime(calculatedEndTime);
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
      setBookingError('Please select a date and an available slot.');
      return;
    }

    const startMins = convertToMins(startTime);
    const endMins = getEndTimeMins(endTime);

    if (startMins >= endMins) {
      setBookingError('End time must be after start time.');
      return;
    }

    let payload = {
      turf: id,
      date,
      startTime,
      endTime,
    };

    if (turf?.bookingMode === 'auction') {
      if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
        setBookingError('Please enter a valid bid amount per hour.');
        return;
      }

      const bidRate = Number(bidAmount);
      const auctionDetails = getAuctionDetails();

      if (auctionDetails.type === 'forward') {
        if (bidRate < turf.pricePerHour) {
          setBookingError(`Your bid must be at least the base price of ₹${turf.pricePerHour}/hr.`);
          return;
        }
        const highestBid = getSlotHighestBid();
        if (highestBid > 0 && bidRate <= highestBid) {
          setBookingError(`Your bid must be higher than the current highest bid of ₹${highestBid}/hr.`);
          return;
        }
      } else {
        if (bidRate > turf.pricePerHour) {
          setBookingError(`Your bid must be less than or equal to the base price of ₹${turf.pricePerHour}/hr.`);
          return;
        }
      }

      payload.bidAmount = bidRate;
    }

    setBookingLoading(true);
    try {
      const res = await axiosInstance.post('/bookings', payload);

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
        <span className="text-gray-400">Loading ground and slot details...</span>
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

  const { name, location, city, pricePerHour, sport, capacity, owner, isActive } = turf;
  const totalAmount = getCalculatedPrice();

  const calendarYear = currentMonth.getFullYear();
  const calendarMonth = currentMonth.getMonth();
  const daysCount = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysCount; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>

      {/* Back button */}
      <div className="mb-6">
        <Link to={`/turfs/${id}`} className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ground Details</span>
        </Link>
      </div>

      {bookingSuccess ? (
        <div className="max-w-2xl mx-auto text-center py-16 px-6 glass-panel rounded-3xl border border-brand-900/20 space-y-6">
          <div className="inline-flex p-4 bg-brand-950/60 rounded-full border border-brand-800 text-brand-400 animate-bounce">
            <CheckCircle className="h-14 w-14" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Booking Requested Successfully!</h2>
          <p className="text-gray-300 text-base leading-relaxed">
            Your slot request has been registered. Please finalize offline payment with the owner. 
            Redirecting you to your bookings dashboard in a few seconds...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Booking Screen Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              
              {/* Header Title */}
              <div>
                <span className="px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-lg bg-brand-950 border border-brand-900 text-brand-400">
                  {sport}
                </span>
                <h1 className="text-3xl font-black text-white mt-3">{name}</h1>
                <p className="text-gray-400 text-sm mt-1">{location}, {city}</p>
              </div>
              {/* Top Controls: Date and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-gray-900/40 border border-gray-800">
                {/* 1. Date Selector (Calendar Picker) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                      1. Select Date
                    </label>
                    {date && (
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 border border-cyan-900 rounded-md">
                        Selected: {date}
                      </span>
                    )}
                  </div>
                  
                  {/* Custom Calendar Body */}
                  <div className="p-4 rounded-xl bg-gray-950/40 border border-gray-800/80">
                    <div className="flex justify-between items-center mb-4">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="px-2 py-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold"
                      >
                        &lt; Prev
                      </button>
                      <span className="text-sm font-bold text-white">
                        {monthNames[calendarMonth]} {calendarYear}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="px-2 py-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold"
                      >
                        Next &gt;
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {weekDays.map(d => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((d, index) => {
                        if (d === null) {
                          return <div key={`empty-${index}`} className="aspect-square"></div>;
                        }

                        const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSelected = date === dayStr;
                        const isPast = dayStr < todayStr;
                        const isMaintenance = turf?.maintenanceDates?.includes(dayStr);
                        const isDisabled = isPast || isMaintenance;

                        let cellClass = "aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all ";
                        if (isSelected) {
                          cellClass += "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20";
                        } else if (isMaintenance) {
                          cellClass += "bg-red-950/20 text-red-500/60 border border-red-950/40 cursor-not-allowed line-through";
                        } else if (isDisabled) {
                          cellClass += "text-gray-700 cursor-not-allowed";
                        } else {
                          cellClass += "text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer";
                        }

                        return (
                          <button
                            key={`day-${d}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setDate(dayStr)}
                            className={cellClass}
                            title={isMaintenance ? 'Under Maintenance' : ''}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Duration Selector */}
                <div className="flex flex-col justify-between space-y-4 md:space-y-0">
                  <div>
                    <label htmlFor="duration" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      2. Select Duration
                    </label>
                    <select
                      id="duration"
                      value={duration}
                      onChange={(e) => {
                        setDuration(Number(e.target.value));
                        setStartTime('');
                        setEndTime('');
                      }}
                      className="glass-input block w-full px-3 py-3 rounded-xl text-white text-sm cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6].map(h => (
                        <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-950/20 border border-gray-900/60 text-xs text-gray-400 leading-relaxed space-y-1.5">
                    <p className="font-bold text-gray-300">Ground Guidelines:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Choose any available date highlighted on the grid.</li>
                      <li>Red crossed-out days are blocked for maintenance.</li>
                      <li>Grey slots are reserved/unavailable.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Theater Screen style slot grid */}
              {date ? (
                <div className="space-y-6 pt-2">
                  
                  {/* Mode / Auction Details Alert */}
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 ${turf?.bookingMode === 'auction' ? 'bg-cyan-950/20 border-cyan-900/65 text-cyan-400' : 'bg-brand-950/20 border-brand-900/60 text-brand-400'}`}>
                    <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold uppercase tracking-wider text-xs mb-1">
                        {turf?.bookingMode === 'auction' ? getAuctionDetails().typeName : 'Simple Booking Mode'}
                      </div>
                      <p className="text-gray-300">
                        {turf?.bookingMode === 'auction' 
                          ? getAuctionDetails().typeDesc 
                          : 'Reserve this slot instantly at the standard flat rate. Subject to owner approval.'}
                      </p>
                    </div>
                  </div>

                  {/* Curved stage indicator */}
                  <div className="w-full max-w-md mx-auto text-center relative mt-4">
                    <div className="h-6 border-t-2 border-brand-500/50 rounded-t-[100px] shadow-[0_-15px_30px_-5px_rgba(16,185,129,0.3)]"></div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 bg-[#0c1222] px-4 py-1 border border-brand-900/60 rounded-full relative -top-3">
                      Goal Post / Net Area
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <span>3. Choose Time Slot</span>
                    {startTime && endTime && (
                      <span className="text-brand-400 normal-case font-bold">
                        Selected: {startTime} - {endTime} ({duration} hr{duration > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-4 gap-2 text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider text-center py-2.5 px-3 rounded-xl bg-gray-950/40 border border-gray-800/60">
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-gray-900/30">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mb-1"></span>
                      <span>Available</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-gray-900/30">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 mb-1"></span>
                      <span>Selected</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-gray-900/30">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 mb-1"></span>
                      <span>Busy</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-gray-900/30">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-600 mb-1"></span>
                      <span>Booked</span>
                    </div>
                  </div>

                  {loadingBookings ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                      <span className="text-gray-400 text-xs">Loading available slots...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-4 rounded-2xl bg-gray-950/20 border border-gray-900">
                      {hourlySlots.map((slot) => {
                        const status = getSlotStatus(slot.start, slot.end);
                        const isSelected = isSlotSelected(slot.start, slot.end);
                        const selectable = isStartSlotSelectable(slot.start);

                        let buttonClasses = "relative py-4 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 border flex flex-col items-center justify-center space-y-1 ";
                        
                        if (isSelected) {
                          buttonClasses += "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50 scale-[0.97]";
                        } else if (status === 'booked') {
                          buttonClasses += "bg-gray-950/40 border-gray-900 text-gray-600 cursor-not-allowed line-through";
                        } else if (status === 'busy') {
                          if (turf?.bookingMode === 'auction') {
                            buttonClasses += "bg-amber-950/15 border-amber-905/35 hover:border-amber-500 text-amber-400 hover:bg-amber-950/30 active:scale-[0.97] cursor-pointer";
                          } else {
                            buttonClasses += "bg-amber-950/20 border-amber-900/30 text-amber-500/80 cursor-not-allowed";
                          }
                        } else if (!selectable) {
                          buttonClasses += "bg-gray-900/10 border-gray-900/40 text-gray-500 opacity-40 cursor-not-allowed";
                        } else {
                          buttonClasses += "bg-emerald-950/10 border-emerald-900/20 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 active:scale-[0.97]";
                        }

                        return (
                          <button
                            key={slot.start}
                            type="button"
                            disabled={status === 'booked' || (status === 'busy' && turf?.bookingMode !== 'auction') || (!selectable && !isSelected)}
                            onClick={() => handleSlotClick(slot.start)}
                            className={buttonClasses}
                          >
                            <span>{slot.start}</span>
                            <span className="text-[10px] opacity-75 font-normal">{slot.end}</span>
                            
                            {isSelected && (
                              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-gray-950/20 border border-gray-900 rounded-2xl text-gray-400">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-brand-500/70" />
                  <p className="text-sm font-semibold">Please select a date from the dashboard above to view active slots grid.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-900/10 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white mb-5 flex items-center border-b border-gray-800 pb-3">
                <Clock className="mr-2 text-brand-500 h-5 w-5" />
                Booking Summary
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

              <div className="space-y-4 text-sm text-gray-300 py-2">
                <div className="flex justify-between">
                  <span>Base Price per Hour</span>
                  <span className="text-white font-bold flex items-center">
                    <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                    {pricePerHour}
                  </span>
                </div>

                {turf?.bookingMode === 'auction' && getAuctionDetails().type === 'forward' && startTime && endTime && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>Current Highest Bid</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                      {getSlotHighestBid() || 'No bids yet'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Selected Date</span>
                  <span className="text-white font-bold">{date || 'Not Selected'}</span>
                </div>

                <div className="flex justify-between">
                  <span>Selected Slot</span>
                  <span className="text-white font-bold">{startTime && endTime ? `${startTime} - ${endTime}` : 'None'}</span>
                </div>

                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="text-white font-bold">{startTime && endTime ? `${duration} hr${duration > 1 ? 's' : ''}` : 'None'}</span>
                </div>
              </div>

              {/* Dynamic Bid Input Field */}
              {turf?.bookingMode === 'auction' && startTime && endTime && (
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-800">
                  <label htmlFor="bidAmount" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Enter Your Bid per Hour (₹)
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <IndianRupee className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      id="bidAmount"
                      required
                      min="1"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="glass-input block w-full pl-9 pr-3 py-3 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder={getAuctionDetails().type === 'forward' 
                        ? `e.g. ${Math.max(pricePerHour, getSlotHighestBid() + 100)}` 
                        : `e.g. ${pricePerHour - 100}`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    {getAuctionDetails().type === 'forward' 
                      ? `Your bid must be >= ₹${pricePerHour}/hr ${getSlotHighestBid() > 0 ? `and strictly higher than ₹${getSlotHighestBid()}/hr` : ''}.`
                      : `Your bid must be <= ₹${pricePerHour}/hr.`}
                  </p>
                </div>
              )}

              {/* Estimate Box */}
              {totalAmount > 0 && (
                <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-900/30 flex justify-between items-center mt-6">
                  <span className="text-sm font-semibold text-gray-300">
                    {turf?.bookingMode === 'auction' ? 'Total Bid Amount' : 'Total Price'}
                  </span>
                  <div className="flex items-center text-2xl font-black text-brand-400">
                    <IndianRupee className="h-5 w-5" />
                    <span>{totalAmount}</span>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 leading-relaxed mt-6 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-gray-300 mb-1">
                  <Info className="h-4 w-4 text-brand-400" />
                  <span>Payment Information</span>
                </div>
                <p>
                  Pay the owner directly using Cash or UPI. 
                  Your reservation remains <strong className="text-yellow-400">Pending</strong> until payment validation.
                </p>
              </div>

              {/* Action Button */}
              {isOwner ? (
                <div className="text-center py-4 px-4 bg-yellow-950/20 border border-yellow-900/40 rounded-2xl text-yellow-400 text-xs mt-6">
                  <span>Logged in as <strong>Owner</strong>. Owners cannot reserve slots.</span>
                </div>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  disabled={bookingLoading || !date || !startTime || !endTime || turf?.maintenanceDates?.includes(date)}
                  onClick={handleBooking}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/30 transition-all duration-200 mt-6"
                >
                  {bookingLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>{turf?.bookingMode === 'auction' ? 'Place Bid' : 'Confirm Booking'}</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookTurf;
