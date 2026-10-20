import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Clock,
  Trophy,
  IndianRupee,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  MapPin,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Check,
  X,
  Sliders,
} from 'lucide-react';

const AuctionArena = () => {
  const { id: routeAuctionId } = useParams();
  const { user, isAuthenticated, isOwner, walletBalance, fetchWallet } = useAuth();
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'FORWARD', 'REVERSE'
  const [customBidRate, setCustomBidRate] = useState('');
  const [bannerMessage, setBannerMessage] = useState(null);
  const [remainingSecs, setRemainingSecs] = useState({});

  // Owner Launch Arena Modal & Turfs State
  const [ownerTurfs, setOwnerTurfs] = useState([]);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchForm, setLaunchForm] = useState({
    turfId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '20:00',
    basePrice: '',
    durationMinutes: 30,
  });
  const [customResetMins, setCustomResetMins] = useState('30');

  // Polling ref
  const pollTimerRef = useRef(null);

  // Fetch owner turfs if owner
  useEffect(() => {
    if (isOwner && isAuthenticated) {
      axiosInstance
        .get('/turfs/owner/mine')
        .then((res) => {
          if (res.data.success && res.data.data.length > 0) {
            setOwnerTurfs(res.data.data);
            setLaunchForm((prev) => ({
              ...prev,
              turfId: res.data.data[0]._id,
              basePrice: res.data.data[0].pricePerHour || 1000,
            }));
          }
        })
        .catch((e) => console.error('Error fetching owner turfs:', e));
    }
  }, [isOwner, isAuthenticated]);

  // Fetch all live auctions
  const fetchLiveAuctions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axiosInstance.get('/auctions/live');
      if (res.data.success) {
        setAuctions(res.data.data);

        // Update remaining seconds map
        const secMap = {};
        res.data.data.forEach((a) => {
          secMap[a._id] = a.remainingSeconds || 0;
        });
        setRemainingSecs(secMap);

        // Determine accessible list
        const accessible = res.data.data.filter((a) => {
          if (isOwner && user) {
            const ownerId = a.owner?._id || a.owner;
            return ownerId?.toString() === user._id?.toString();
          }
          return true;
        });

        // Auto-select first or matching route auction
        if (accessible.length > 0) {
          if (routeAuctionId) {
            const found = accessible.find((a) => a._id === routeAuctionId);
            setSelectedAuction(found || accessible[0]);
          } else if (!selectedAuction) {
            setSelectedAuction(accessible[0]);
          } else {
            // Keep current selected up to date
            const updatedSelected = accessible.find((a) => a._id === selectedAuction._id);
            if (updatedSelected) setSelectedAuction(updatedSelected);
            else setSelectedAuction(accessible[0]);
          }
        } else {
          setSelectedAuction(null);
        }
      }
    } catch (err) {
      console.error('Error fetching live auctions:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAuctions();
    if (isAuthenticated) fetchWallet();

    // Poll live feed every 5 seconds for real-time bid updates
    pollTimerRef.current = setInterval(() => {
      fetchLiveAuctions(true);
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [routeAuctionId, isOwner, user?._id]);

  // Local second-by-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSecs((prev) => {
        const next = { ...prev };
        let anyZero = false;

        Object.keys(next).forEach((key) => {
          if (next[key] > 0) {
            next[key] = next[key] - 1;
            if (next[key] === 0) anyZero = true;
          }
        });

        // If an auction just reached 0, trigger settlement
        if (anyZero && selectedAuction && next[selectedAuction._id] === 0) {
          handleAutoSettle(selectedAuction._id);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAuction]);

  // Trigger settlement when countdown hits 0
  const handleAutoSettle = async (auctionId) => {
    try {
      const res = await axiosInstance.post(`/auctions/${auctionId}/settle`);
      if (res.data.success) {
        fetchLiveAuctions(true);
      }
    } catch (err) {
      console.error('Error settling auction:', err);
    }
  };

  const formatCountdown = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Place a bid (Player Action)
  const handlePlaceBid = async (rateToBid) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedAuction) return;

    setSubmitting(true);
    setBannerMessage(null);

    try {
      const res = await axiosInstance.post(`/auctions/${selectedAuction._id}/bid`, {
        bidRate: rateToBid,
      });

      if (res.data.success) {
        setBannerMessage({
          type: 'success',
          text: res.data.message || 'Bid placed successfully!',
        });
        setSelectedAuction(res.data.data);
        setCustomBidRate('');
        fetchWallet(); // Refresh balance
        fetchLiveAuctions(true);
      }
    } catch (err) {
      console.error('Error placing bid:', err);
      setBannerMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to place bid',
        shortfall: err.response?.data?.walletShortfall,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- OWNER ACTION HANDLERS ---
  const handleAddTime = async (minutes) => {
    if (!selectedAuction) return;
    setActionLoading(true);
    setBannerMessage(null);
    try {
      const res = await axiosInstance.patch(`/auctions/${selectedAuction._id}/time`, {
        addMinutes: minutes,
      });
      if (res.data.success) {
        setBannerMessage({ type: 'success', text: `Added +${minutes} minutes to countdown timer!` });
        setSelectedAuction(res.data.data);
        fetchLiveAuctions(true);
      }
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add time' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTime = async (minutes) => {
    if (!selectedAuction) return;
    setActionLoading(true);
    setBannerMessage(null);
    try {
      const res = await axiosInstance.patch(`/auctions/${selectedAuction._id}/time`, {
        resetMinutes: minutes,
      });
      if (res.data.success) {
        setBannerMessage({ type: 'success', text: `Timer reset to ${minutes} minutes!` });
        setSelectedAuction(res.data.data);
        fetchLiveAuctions(true);
      }
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reset time' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConcludeEarly = async () => {
    if (!selectedAuction) return;
    if (
      !window.confirm(
        'Are you sure you want to conclude this auction battle now? The current leading bidder will be declared the winner immediately.'
      )
    )
      return;

    setActionLoading(true);
    setBannerMessage(null);
    try {
      const res = await axiosInstance.post(`/auctions/${selectedAuction._id}/settle`);
      if (res.data.success) {
        setBannerMessage({
          type: 'success',
          text: 'Auction concluded successfully! Confirmed booking has been generated.',
        });
        fetchLiveAuctions(true);
      }
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.response?.data?.message || 'Failed to conclude auction' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteArena = async () => {
    if (!selectedAuction) return;
    const confirmText = selectedAuction.currentLeadingBidder
      ? `Are you sure you want to cancel and delete this arena battle? The leading bidder's locked funds (₹${selectedAuction.currentLeadingBid}) will be instantly refunded to their wallet.`
      : 'Are you sure you want to delete this arena battle?';

    if (!window.confirm(confirmText)) return;

    setActionLoading(true);
    setBannerMessage(null);
    try {
      const res = await axiosInstance.delete(`/auctions/${selectedAuction._id}`);
      if (res.data.success) {
        setBannerMessage({ type: 'success', text: res.data.message });
        setSelectedAuction(null);
        fetchLiveAuctions(true);
      }
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete auction' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLaunchNewArena = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setBannerMessage(null);

    try {
      const res = await axiosInstance.post('/auctions/create', launchForm);
      if (res.data.success) {
        setBannerMessage({ type: 'success', text: 'New arena slot successfully launched!' });
        setShowLaunchModal(false);
        fetchLiveAuctions(true);
      }
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.response?.data?.message || 'Failed to launch arena' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter accessible auctions (Owner sees only theirs, Player sees all)
  const userAccessibleAuctions = auctions.filter((a) => {
    if (isOwner && user) {
      const ownerId = a.owner?._id || a.owner;
      return ownerId?.toString() === user._id?.toString();
    }
    return true;
  });

  const filteredAuctions = userAccessibleAuctions.filter((a) => {
    if (filter === 'ALL') return true;
    return a.auctionType === filter;
  });

  const activeSeconds = selectedAuction ? remainingSecs[selectedAuction._id] || 0 : 0;
  const isUrgent = activeSeconds > 0 && activeSeconds < 120; // under 2 mins
  const isSnipingActive = activeSeconds > 0 && activeSeconds < 60; // under 60 secs

  const isForward = selectedAuction?.auctionType === 'FORWARD';
  const minInc = selectedAuction?.minBidIncrement || 50;
  const currentRate = selectedAuction?.currentLeadingBidRate || selectedAuction?.basePrice || 1000;

  // Suggested quick bid options
  const quickBidOptions = isForward
    ? [currentRate + minInc, currentRate + minInc * 2, currentRate + minInc * 4]
    : [
        Math.max(100, currentRate - minInc),
        Math.max(100, currentRate - minInc * 2),
        Math.max(100, currentRate - minInc * 4),
      ];

  const isUserLeading =
    selectedAuction &&
    user &&
    selectedAuction.currentLeadingBidder &&
    (selectedAuction.currentLeadingBidder._id === user._id ||
      selectedAuction.currentLeadingBidder === user._id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>

      {/* Arena Banner Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-gray-900 to-brand-950/40 relative overflow-hidden">
        <div className="z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-500/30 mb-3 animate-pulse">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>{isOwner ? 'Turf Owner Command Arena' : 'TurfWars Live Arena'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {isOwner ? 'Manage Your Ground Auctions' : 'Live Slot Bidding Wars'}
          </h1>
          <p className="text-gray-300 text-sm mt-2 max-w-xl">
            {isOwner
              ? 'Real-time control center for your turf auctions. Set or reset timers, launch new arena slots, and conclude battles anytime.'
              : 'Compete in real-time for premium turf slots. Wallet funds are held safely in escrow and instantly refunded if you are outbid!'}
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {isOwner ? (
            <button
              onClick={() => {
                if (ownerTurfs.length === 0) {
                  alert('Please add a turf to your profile first.');
                  return;
                }
                setShowLaunchModal(true);
              }}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-amber-600/30 transition-all flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Launch Arena Slot 🔥</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-center space-x-4 shadow-xl">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Your Wallet</p>
                <div className="text-xl font-black text-white flex items-center">
                  <IndianRupee className="h-4 w-4 mr-0.5 text-emerald-400" />
                  {walletBalance || 0}
                </div>
              </div>
              <Link
                to="/wallet"
                className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
              >
                Top Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Rules Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-2xl border border-cyan-900/40 flex items-start space-x-3 bg-cyan-950/15">
          <TrendingUp className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black uppercase text-cyan-300 tracking-wider">
              Forward Auction (Fri – Sun Prime Time)
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Weekend competitive slots. Bids must be $\ge$ base price. The highest bidder at zero seconds
              wins the ground!
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-purple-900/40 flex items-start space-x-3 bg-purple-950/15">
          <TrendingDown className="h-6 w-6 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
              Reverse Auction (Mon – Thu Value Slots)
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Weekday discount slots. Bids must be $\le$ base price. Players compete for lower rates while
              owners fill open grounds.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between border ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          {bannerMessage.shortfall > 0 && !isOwner && (
            <Link
              to="/wallet"
              className="ml-4 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex-shrink-0"
            >
              Add ₹{bannerMessage.shortfall}
            </Link>
          )}
        </div>
      )}

      {/* Main Arena View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <span className="text-gray-400">Connecting to Live Arena...</span>
        </div>
      ) : userAccessibleAuctions.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center border border-gray-800 max-w-xl mx-auto">
          <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {isOwner ? 'No Active Auctions for Your Turfs' : 'No Live Auctions Active'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {isOwner
              ? "You haven't launched any slots into the Live Arena yet. Launch an arena slot now so players can place live bids!"
              : 'There are currently no active slot bidding battles happening. Check back shortly or explore available grounds!'}
          </p>
          {isOwner ? (
            <button
              onClick={() => setShowLaunchModal(true)}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all"
            >
              Launch First Arena Slot 🔥
            </button>
          ) : (
            <Link
              to="/"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-all"
            >
              Explore Turfs
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Featured Active Auction Room */}
          {selectedAuction && (
            <div className="lg:col-span-2 space-y-6">
              {/* Main Arena Card */}
              <div
                className={`glass-panel p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 ${
                  isSnipingActive
                    ? 'border-red-500/80 shadow-2xl shadow-red-950/50 bg-red-950/10'
                    : isUrgent
                    ? 'border-amber-500/70 shadow-xl shadow-amber-950/30'
                    : 'border-brand-900/30'
                }`}
              >
                {/* Anti-Sniping Alert Banner */}
                {isSnipingActive && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold flex items-center justify-between animate-pulse">
                    <span className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-red-400" />
                      <span>⚡ Anti-Sniping Active: Last-minute bids extend the clock by 45s!</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider bg-red-500/30 px-2 py-0.5 rounded">
                      Ext: {selectedAuction.antiSnipingExtensions || 0}
                    </span>
                  </div>
                )}

                {/* Ground Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                          isForward
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}
                      >
                        {selectedAuction.auctionType} AUCTION
                      </span>
                      <span className="text-xs text-gray-400 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-brand-500" />
                        {selectedAuction.turf?.location}, {selectedAuction.turf?.city}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {selectedAuction.turf?.name || 'Turf Arena Slot'}
                    </h2>
                  </div>

                  {/* Slot Date & Timing Pill */}
                  <div className="bg-gray-900/90 px-4 py-2 rounded-2xl border border-gray-800 flex items-center space-x-3 self-start sm:self-auto">
                    <Calendar className="h-4 w-4 text-brand-400" />
                    <div>
                      <div className="text-xs font-bold text-white">{selectedAuction.date}</div>
                      <div className="text-[11px] text-gray-400 font-semibold">
                        {selectedAuction.startTime} – {selectedAuction.endTime} ({selectedAuction.durationHours || 1} hr)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Central Countdown & Leading Bid Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
                  {/* Digital Clock */}
                  <div className="p-6 rounded-3xl bg-gray-950/60 border border-gray-800 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
                      <span>Time Remaining</span>
                    </div>
                    <div
                      className={`text-4xl sm:text-5xl font-mono font-black tracking-wider ${
                        isSnipingActive
                          ? 'text-red-400 animate-pulse'
                          : isUrgent
                          ? 'text-amber-400'
                          : 'text-white'
                      }`}
                    >
                      {formatCountdown(activeSeconds)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Base Ground Rate: ₹{selectedAuction.basePrice}/hr
                    </p>
                  </div>

                  {/* Leading Bid Status */}
                  <div
                    className={`p-6 rounded-3xl border flex flex-col justify-center ${
                      isUserLeading
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-gray-950/60 border-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {isForward ? 'Current Highest Bid' : 'Current Value Bid'}
                      </span>
                      {isUserLeading && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          YOU ARE LEADING
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-3xl sm:text-4xl font-black text-white flex items-center">
                        <IndianRupee className="h-6 w-6 text-brand-400 mr-0.5" />
                        {selectedAuction.currentLeadingBidRate || selectedAuction.basePrice}
                        <span className="text-sm font-semibold text-gray-400 ml-1">/hr</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Total Slot Escrow: ₹{selectedAuction.currentLeadingBid || selectedAuction.basePrice}
                      <span className="ml-2 text-gray-500">
                        • Bidder: {selectedAuction.currentLeadingBidder?.name || 'Opening Bid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CONTROLS AREA: OWNER CONTROLS vs PLAYER BIDDING */}
                {isOwner ? (
                  /* --- OWNER CONTROL CONSOLE --- */
                  <div className="pt-6 border-t border-gray-800 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sliders className="h-4 w-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Ground Owner Arena Controls
                        </h3>
                      </div>
                      <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
                        Owner Management Mode
                      </span>
                    </div>

                    {/* Timer Adjustment Controls */}
                    <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Adjust Countdown Timer
                      </label>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button
                          onClick={() => handleAddTime(5)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-colors border border-gray-700"
                        >
                          +5 Mins
                        </button>
                        <button
                          onClick={() => handleAddTime(15)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-colors border border-gray-700"
                        >
                          +15 Mins
                        </button>
                        <button
                          onClick={() => handleAddTime(30)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg transition-colors border border-gray-700"
                        >
                          +30 Mins
                        </button>
                      </div>

                      {/* Reset to custom minutes */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={customResetMins}
                          onChange={(e) => setCustomResetMins(e.target.value)}
                          className="w-24 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs"
                          placeholder="Mins"
                        />
                        <button
                          onClick={() => handleResetTime(Number(customResetMins))}
                          disabled={actionLoading || !customResetMins}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset Timer</span>
                        </button>
                      </div>
                    </div>

                    {/* Conclude Early or Cancel/Delete Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        onClick={handleConcludeEarly}
                        disabled={actionLoading || selectedAuction.status !== 'active'}
                        className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
                      >
                        <Trophy className="h-4 w-4" />
                        <span>Conclude & Declare Winner Now</span>
                      </button>

                      <button
                        onClick={handleDeleteArena}
                        disabled={actionLoading}
                        className="w-full sm:w-auto py-3 px-4 bg-red-950/80 hover:bg-red-900 border border-red-900 text-red-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Cancel & Delete Battle</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500">
                      ℹ️ Concluding early converts the highest bidder into a confirmed booking. Deleting
                      the battle refunds all locked funds to bidders.
                    </p>
                  </div>
                ) : (
                  /* --- PLAYER BIDDING CONTROLS --- */
                  <div className="pt-6 border-t border-gray-800">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                      Place Your Bid ({isForward ? 'Must be higher' : 'Must be lower'})
                    </h3>

                    {/* 1-Click Quick Bids */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {quickBidOptions.map((rateOption, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePlaceBid(rateOption)}
                          disabled={submitting || activeSeconds <= 0}
                          className="py-3 px-2 rounded-2xl bg-gray-900/80 hover:bg-brand-600/30 border border-gray-700 hover:border-brand-500 text-white font-black text-sm transition-all flex flex-col items-center justify-center group disabled:opacity-50"
                        >
                          <span className="text-[11px] font-bold text-gray-400 group-hover:text-brand-300">
                            Quick {isForward ? '+' : '-'}₹{minInc * (idx === 0 ? 1 : idx === 1 ? 2 : 4)}
                          </span>
                          <span className="text-base font-extrabold text-brand-400 group-hover:text-white flex items-center mt-0.5">
                            ₹{rateOption}/hr
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Custom Rate Input & Submit */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                          <IndianRupee className="h-4 w-4" />
                        </div>
                        <input
                          type="number"
                          placeholder={`Custom rate per hour (min ₹${
                            isForward ? currentRate + minInc : 100
                          })`}
                          value={customBidRate}
                          onChange={(e) => setCustomBidRate(e.target.value)}
                          disabled={submitting || activeSeconds <= 0}
                          className="w-full pl-10 pr-4 py-3 bg-gray-900/90 border border-gray-800 focus:border-brand-500 rounded-xl text-white text-sm focus:outline-none transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => handlePlaceBid(Number(customBidRate))}
                        disabled={submitting || !customBidRate || activeSeconds <= 0}
                        className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2"
                      >
                        {submitting ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Flame className="h-4 w-4" />
                        )}
                        <span>Lock Bid in Escrow</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-3 flex items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mr-1.5 flex-shrink-0" />
                      Funds are automatically held in your TurfWars Wallet. If outbid, 100% is credited
                      back immediately.
                    </p>
                  </div>
                )}
              </div>

              {/* Real-time Bid Activity Stream */}
              <div className="glass-panel p-6 rounded-3xl border border-gray-800">
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span>Live Bid Activity Stream</span>
                  </h3>
                  <span className="text-xs text-gray-500">
                    {selectedAuction.bids?.length || 0} Total Bids
                  </span>
                </div>

                <div className="divide-y divide-gray-800/50 max-h-64 overflow-y-auto mt-2">
                  {!selectedAuction.bids || selectedAuction.bids.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs">
                      No player bids yet. Place the first bid to lead the arena!
                    </div>
                  ) : (
                    [...selectedAuction.bids].reverse().map((bid, i) => (
                      <div key={i} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px]">
                            {bid.bidder?.name ? bid.bidder.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {bid.bidder?.name || 'Player'}
                              {user && (bid.bidder?._id === user._id || bid.bidder === user._id) && (
                                <span className="ml-1 text-[10px] text-brand-400 font-semibold">(You)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {new Date(bid.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-brand-400 text-sm">
                            ₹{bid.bidRate}/hr
                          </div>
                          <div className="text-[10px] text-gray-500">Total: ₹{bid.totalAmount}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT 1 COLUMN: All Live Arenas Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="text-base font-bold text-white">
                {isOwner ? 'My Turf Arenas' : 'Active Arena Rooms'}
              </h3>
              {/* Type Filter Buttons */}
              <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    filter === 'ALL' ? 'bg-brand-600 text-white' : 'text-gray-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('FORWARD')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    filter === 'FORWARD' ? 'bg-cyan-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Fri-Sun
                </button>
                <button
                  onClick={() => setFilter('REVERSE')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                    filter === 'REVERSE' ? 'bg-purple-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Mon-Thu
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredAuctions.map((auction) => {
                const isSelected = selectedAuction?._id === auction._id;
                const secs = remainingSecs[auction._id] || 0;

                return (
                  <div
                    key={auction._id}
                    onClick={() => {
                      setSelectedAuction(auction);
                      setBannerMessage(null);
                    }}
                    className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-950/20 shadow-lg'
                        : 'border-gray-800 hover:border-gray-700 bg-gray-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          auction.auctionType === 'FORWARD'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        {auction.auctionType}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-amber-500" />
                        {formatCountdown(secs)}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                      {auction.turf?.name || 'Turf Arena'}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {auction.date} • {auction.startTime} – {auction.endTime}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                          Current Bid
                        </span>
                        <span className="font-extrabold text-white text-sm">
                          ₹{auction.currentLeadingBidRate || auction.basePrice}/hr
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 ${
                          isSelected ? 'text-amber-400 translate-x-1' : 'text-gray-600'
                        } transition-transform`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OWNER LAUNCH NEW ARENA MODAL */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-amber-500/40 relative shadow-2xl bg-gray-900">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <span>Launch New Arena Slot</span>
              </h3>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchNewArena} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Select Ground *
                </label>
                <select
                  required
                  value={launchForm.turfId}
                  onChange={(e) => {
                    const selTurf = ownerTurfs.find((t) => t._id === e.target.value);
                    setLaunchForm({
                      ...launchForm,
                      turfId: e.target.value,
                      basePrice: selTurf?.pricePerHour || launchForm.basePrice,
                    });
                  }}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                >
                  {ownerTurfs.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} (₹{t.pricePerHour}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Slot Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={launchForm.date}
                  onChange={(e) => setLaunchForm({ ...launchForm, date: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={launchForm.startTime}
                    onChange={(e) => setLaunchForm({ ...launchForm, startTime: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={launchForm.endTime}
                    onChange={(e) => setLaunchForm({ ...launchForm, endTime: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Base Price (₹/hr) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={launchForm.basePrice}
                    onChange={(e) => setLaunchForm({ ...launchForm, basePrice: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <select
                    value={launchForm.durationMinutes}
                    onChange={(e) =>
                      setLaunchForm({ ...launchForm, durationMinutes: Number(e.target.value) })
                    }
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  >
                    <option value={15}>15 Minutes Quick Battle</option>
                    <option value={30}>30 Minutes Standard Battle</option>
                    <option value={60}>1 Hour Full Battle</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/25 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Flame className="h-4 w-4" />
                  <span>{actionLoading ? 'Launching...' : 'Launch Live Arena'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionArena;
