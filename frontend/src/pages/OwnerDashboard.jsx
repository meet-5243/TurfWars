import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  Check,
  X,
  MapPin,
  IndianRupee,
  Eye,
  Users,
  Wallet,
  CreditCard,
  Trophy,
  Tag,
  Clock,
  Sparkles,
  CheckCircle2,
  Flame,
} from 'lucide-react';

const OwnerDashboard = () => {
  const [turfs, setTurfs] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [earningStats, setEarningStats] = useState({
    totalEarnings: 0,
    bookingEarnings: 0,
    pendingMembershipPayouts: 0,
    settledMembershipPayouts: 0,
  });
  const [plans, setPlans] = useState([]);
  const [selectedTurfFilter, setSelectedTurfFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('turfs'); // 'turfs', 'memberships', 'wallet', 'auctions'

  // Modal State for Membership Plan
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    turfId: '',
    name: '',
    description: '',
    price: '',
    durationDays: 30,
    bookingDiscountPercent: 10,
    pointsMultiplier: 1,
    monthlyCouponLimit: 0,
    earlySlotAccess: false,
    freeBookingLimit: 0,
  });
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Modal State for Launching Live Arena Auction
  const [ownerAuctions, setOwnerAuctions] = useState([]);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [auctionForm, setAuctionForm] = useState({
    turfId: '',
    date: '',
    startTime: '19:00',
    endTime: '20:00',
    basePrice: '',
    durationMinutes: 30,
  });
  const [submittingAuction, setSubmittingAuction] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [turfRes, earnRes, plansRes, aucRes] = await Promise.all([
        axiosInstance.get('/turfs/owner/mine'),
        axiosInstance.get('/bookings/owner/earnings'),
        axiosInstance.get('/membership/owner/plans'),
        axiosInstance.get('/auctions/live').catch(() => ({ data: { success: false } })),
      ]);

      if (turfRes.data.success) {
        setTurfs(turfRes.data.data);
        if (turfRes.data.data.length > 0 && !planForm.turfId) {
          setPlanForm((prev) => ({ ...prev, turfId: turfRes.data.data[0]._id }));
        }
      }

      if (earnRes.data.success) {
        setEarnings(earnRes.data.data);
        setWalletBalance(earnRes.data.stats?.totalEarnings || 0);
        if (earnRes.data.stats) {
          setEarningStats(earnRes.data.stats);
        }
      }

      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
      }

      if (aucRes.data?.success && Array.isArray(aucRes.data.data)) {
        setOwnerAuctions(aucRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await axiosInstance.delete(`/turfs/${id}`);
      if (res.data.success) {
        setSuccess(`"${name}" was deleted successfully.`);
        setTurfs(turfs.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error('Error deleting turf:', err);
      setError(err.response?.data?.message || 'Failed to delete turf.');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await axiosInstance.patch(`/turfs/${id}/status`, {
        isActive: !currentStatus,
      });
      if (res.data.success) {
        setTurfs(turfs.map((t) => (t._id === id ? { ...t, isActive: !currentStatus } : t)));
        setSuccess(`Status updated to ${!currentStatus ? 'Active' : 'Inactive'}.`);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Failed to update status.');
    }
  };

  // --- MEMBERSHIP PLAN HANDLERS ---
  const openCreatePlanModal = (preselectedTurfId = '') => {
    setEditingPlan(null);
    setPlanForm({
      turfId: preselectedTurfId || (turfs[0]?._id || ''),
      name: '',
      description: '',
      price: '',
      durationDays: 30,
      bookingDiscountPercent: 10,
      pointsMultiplier: 1,
      monthlyCouponLimit: 0,
      earlySlotAccess: false,
      freeBookingLimit: 0,
    });
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      turfId: plan.turf?._id || plan.turf,
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      durationDays: plan.durationDays,
      bookingDiscountPercent: plan.bookingDiscountPercent,
      pointsMultiplier: plan.pointsMultiplier,
      monthlyCouponLimit: plan.monthlyCouponLimit || 0,
      earlySlotAccess: plan.earlySlotAccess || false,
      freeBookingLimit: plan.freeBookingLimit || 0,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmittingPlan(true);

    try {
      if (editingPlan) {
        const res = await axiosInstance.put(`/membership/owner/plans/${editingPlan._id}`, planForm);
        if (res.data.success) {
          setSuccess('Membership plan updated successfully!');
          setPlans(plans.map((p) => (p._id === editingPlan._id ? res.data.data : p)));
          setShowPlanModal(false);
        }
      } else {
        const res = await axiosInstance.post('/membership/owner/plans', planForm);
        if (res.data.success) {
          setSuccess('Membership plan created successfully!');
          // Re-fetch all to get populated turf
          const updatedPlans = await axiosInstance.get('/membership/owner/plans');
          setPlans(updatedPlans.data.data);
          setShowPlanModal(false);
        }
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err.response?.data?.message || 'Failed to save membership plan.');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const togglePlanStatus = async (planId) => {
    try {
      const res = await axiosInstance.patch(`/membership/owner/plans/${planId}/status`);
      if (res.data.success) {
        setPlans(plans.map((p) => (p._id === planId ? { ...p, status: res.data.data.status } : p)));
        setSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle plan status');
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to remove the plan "${planName}"?`)) return;

    try {
      const res = await axiosInstance.delete(`/membership/owner/plans/${planId}`);
      if (res.data.success) {
        setSuccess(res.data.message);
        // Refresh plans list
        const updatedPlans = await axiosInstance.get('/membership/owner/plans');
        setPlans(updatedPlans.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const openCreateAuctionModal = () => {
    setError('');
    setSuccess('');
    const today = new Date().toISOString().split('T')[0];
    const defaultTurf = turfs[0];
    setAuctionForm({
      turfId: defaultTurf?._id || '',
      date: today,
      startTime: '19:00',
      endTime: '20:00',
      basePrice: defaultTurf?.pricePerHour || 1000,
      durationMinutes: 30,
    });
    setShowAuctionModal(true);
  };

  const handleLaunchAuction = async (e) => {
    e.preventDefault();
    setSubmittingAuction(true);
    setError('');
    setSuccess('');

    try {
      const res = await axiosInstance.post('/auctions/create', auctionForm);
      if (res.data.success) {
        setSuccess('Slot successfully launched into the Live Arena!');
        setShowAuctionModal(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error launching auction:', err);
      setError(err.response?.data?.message || 'Failed to launch auction');
    } finally {
      setSubmittingAuction(false);
    }
  };

  const filteredPlans =
    selectedTurfFilter === 'ALL'
      ? plans
      : plans.filter((p) => (p.turf?._id || p.turf) === selectedTurfFilter);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-[80vh]">
      <div className="bg-mesh"></div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Owner Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage grounds, turf memberships, and earnings.</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'auctions' ? (
            <button
              onClick={() => openCreateAuctionModal()}
              disabled={turfs.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-600/25 transition-all duration-200"
            >
              <Flame className="h-4.5 w-4.5" />
              <span>Launch Arena Slot 🔥</span>
            </button>
          ) : activeTab === 'memberships' ? (
            <button
              onClick={() => openCreatePlanModal()}
              disabled={turfs.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/25 transition-all duration-200"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Turf Membership</span>
            </button>
          ) : (
            <Link
              to="/owner-turfs/new"
              className="flex items-center space-x-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/25 transition-all duration-200"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add New Turf</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 glass-panel p-1 rounded-xl w-fit mb-8 relative z-10 flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('turfs')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'turfs'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          My Turfs
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'memberships'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy className="h-4 w-4 mr-2" />
          Turf Memberships
          {plans.length > 0 && (
            <span className="ml-2 bg-brand-950 border border-brand-800 text-brand-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {plans.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'auctions'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="h-4 w-4 mr-2 text-amber-400" />
          Arena Auctions
          {ownerAuctions.length > 0 && (
            <span className="ml-2 bg-amber-950 border border-amber-800 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {ownerAuctions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'wallet'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Wallet & Earnings
        </button>
      </div>

      {/* Notification boxes */}
      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-905/60 rounded-xl p-4 flex items-start space-x-2 text-red-400 text-sm">
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
          <span className="text-gray-400">Loading Dashboard...</span>
        </div>
      ) : activeTab === 'memberships' ? (
        /* --- MEMBERSHIPS TAB --- */
        <div className="animate-fadeIn relative z-10 space-y-6">
          {/* Turf Filter Header */}
          <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center">
                <Sparkles className="h-5 w-5 text-brand-400 mr-2" />
                Turf-Specific Membership Plans
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Each turf has its own customized plans. Players subscribing to a turf get direct booking discounts on that specific ground.
              </p>
            </div>
            {turfs.length > 0 && (
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <span className="text-xs font-semibold text-gray-400">Filter by Turf:</span>
                <select
                  value={selectedTurfFilter}
                  onChange={(e) => setSelectedTurfFilter(e.target.value)}
                  className="glass-input text-sm px-3 py-1.5 rounded-xl text-white bg-gray-900 border border-gray-700"
                >
                  <option value="ALL">All My Turfs ({plans.length} plans)</option>
                  {turfs.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filteredPlans.length === 0 ? (
            <div className="glass-panel text-center p-12 rounded-2xl border border-gray-800 max-w-lg mx-auto flex flex-col items-center">
              <Trophy className="h-12 w-12 text-brand-400/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Membership Plans Yet</h3>
              <p className="text-gray-400 text-sm mb-6">
                Boost your recurring revenue! Create membership tiers (e.g. Monthly VIP, Weekend Pass) for your grounds.
              </p>
              <button
                onClick={() => openCreatePlanModal()}
                disabled={turfs.length === 0}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all"
              >
                Create First Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <div
                  key={plan._id}
                  className={`glass-panel rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                    plan.status === 'active'
                      ? 'border-brand-900/40 hover:border-brand-500/50 bg-gradient-to-b from-gray-900/80 to-gray-950/80'
                      : 'border-red-950/40 bg-gray-950/40 opacity-70'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs uppercase font-extrabold px-2.5 py-1 rounded bg-brand-950 border border-brand-900 text-brand-400">
                          {plan.turf?.name || 'Turf Plan'}
                        </span>
                        <h3 className="text-xl font-extrabold text-white mt-2 tracking-wide">{plan.name}</h3>
                      </div>
                      <button
                        onClick={() => togglePlanStatus(plan._id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          plan.status === 'active'
                            ? 'bg-green-950/60 text-green-400 border-green-900'
                            : 'bg-red-950/60 text-red-400 border-red-900'
                        }`}
                      >
                        {plan.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 min-h-[32px] line-clamp-2 mb-4">
                      {plan.description || 'Exclusive discounts and perks on slot bookings.'}
                    </p>

                    {/* Price and duration */}
                    <div className="flex items-baseline mb-4 pb-4 border-b border-gray-800">
                      <span className="text-3xl font-black text-white flex items-center">
                        <IndianRupee className="h-6 w-6 text-brand-400 mr-0.5" />
                        {plan.price}
                      </span>
                      <span className="text-xs text-gray-400 ml-2 font-medium">/ {plan.durationDays} days</span>
                    </div>

                    {/* Benefits List */}
                    <ul className="space-y-2 text-xs text-gray-300 mb-6">
                      <li className="flex items-center text-brand-300 font-semibold">
                        <Tag className="h-3.5 w-3.5 text-brand-400 mr-2 shrink-0" />
                        <span>{plan.bookingDiscountPercent}% Booking Discount on this turf</span>
                      </li>
                      <li className="flex items-center">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-400 mr-2 shrink-0" />
                        <span>{plan.pointsMultiplier}x TurfPoints Loyalty Multiplier</span>
                      </li>
                      {plan.earlySlotAccess && (
                        <li className="flex items-center">
                          <Clock className="h-3.5 w-3.5 text-blue-400 mr-2 shrink-0" />
                          <span>Priority Early Slot Access</span>
                        </li>
                      )}
                      {plan.freeBookingLimit > 0 && (
                        <li className="flex items-center">
                          <Check className="h-3.5 w-3.5 text-green-400 mr-2 shrink-0" />
                          <span>{plan.freeBookingLimit} Free Bookings included</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800/80">
                    <span className="text-[11px] text-gray-500">
                      Location: {plan.turf?.city || 'Local ground'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditPlanModal(plan)}
                        className="p-1.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                        title="Edit Plan"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan._id, plan.name)}
                        className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-900 text-red-400 hover:text-red-200 rounded-lg transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'auctions' ? (
        /* --- ARENA AUCTIONS TAB --- */
        <div className="animate-fadeIn relative z-10">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <span>Live Arena Auction Slots</span>
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Slots launched into the live bidding arena. 95% of winning bid belongs to you.
              </p>
            </div>
            <button
              onClick={() => openCreateAuctionModal()}
              disabled={turfs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all self-start sm:self-auto"
            >
              <Flame className="h-4 w-4" />
              <span>Launch New Slot</span>
            </button>
          </div>

          {ownerAuctions.length === 0 ? (
            <div className="glass-panel text-center p-12 rounded-2xl border border-gray-800">
              <Clock className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Active Arena Auctions</h3>
              <p className="text-gray-400 text-xs mb-4">
                You haven't launched any slots into the Live Arena yet. Launch a slot to allow players to place live bids!
              </p>
              <button
                onClick={() => openCreateAuctionModal()}
                disabled={turfs.length === 0}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow"
              >
                Launch Slot to Arena 🔥
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerAuctions.map((auction) => {
                const isForward = auction.auctionType === 'FORWARD';
                return (
                  <div
                    key={auction._id}
                    className="glass-panel rounded-2xl p-6 border border-gray-800 hover:border-amber-500/40 transition-all flex flex-col justify-between bg-gray-900/40 relative overflow-hidden group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            isForward
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {auction.auctionType} AUCTION
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {auction.status}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-white">{auction.turf?.name || 'Turf Arena'}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        {auction.date} • {auction.startTime} – {auction.endTime} ({auction.durationHours || 1} hr)
                      </p>

                      <div className="mt-4 p-3 bg-gray-950/60 rounded-xl border border-gray-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase block">Current Bid</span>
                          <span className="text-base font-black text-amber-400">
                            ₹{auction.currentLeadingBidRate || auction.basePrice}/hr
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 uppercase block">Total Escrow</span>
                          <span className="text-sm font-bold text-white">
                            ₹{auction.currentLeadingBid || auction.basePrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {auction.bids?.length || 0} Bid{(auction.bids?.length || 0) !== 1 ? 's' : ''} Placed
                      </span>
                      <Link
                        to={`/arena/${auction._id}`}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <Flame className="h-3.5 w-3.5" />
                        <span>View in Arena</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'wallet' ? (
        /* --- WALLET TAB --- */
        <div className="animate-fadeIn relative z-10">
          {/* Main Owner Balance & Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Booking Balance Card */}
            <div className="glass-panel p-6 rounded-3xl border border-brand-900/30 relative overflow-hidden bg-gradient-to-br from-brand-950/40 to-gray-900">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-brand-500/20 rounded-2xl">
                  <IndianRupee className="h-8 w-8 text-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Booking Earnings (95%)
                  </p>
                  <div className="flex items-center text-3xl font-black text-white mt-1">
                    <IndianRupee className="h-6 w-6 mr-0.5 text-gray-300" />
                    {earningStats.bookingEarnings?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              </div>
              <p className="text-xs text-brand-400 mt-4">
                Your 95% share of all completed slot bookings.
              </p>
            </div>

            {/* Upcoming Membership Escrow Card */}
            <div className="glass-panel p-6 rounded-3xl border border-amber-900/30 relative overflow-hidden bg-gradient-to-br from-amber-950/30 to-gray-900">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-500/20 rounded-2xl">
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Upcoming Passes (100%)
                  </p>
                  <div className="flex items-center text-3xl font-black text-amber-300 mt-1">
                    <IndianRupee className="h-6 w-6 mr-0.5 text-amber-400" />
                    {earningStats.pendingMembershipPayouts?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                100% of pass revenues held by admin, released after 30-day cron cycle.
              </p>
            </div>

            {/* Settled Membership Revenue Card */}
            <div className="glass-panel p-6 rounded-3xl border border-emerald-900/30 relative overflow-hidden bg-gradient-to-br from-emerald-950/30 to-gray-900">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Settled Passes (100%)
                  </p>
                  <div className="flex items-center text-3xl font-black text-emerald-300 mt-1">
                    <IndianRupee className="h-6 w-6 mr-0.5 text-emerald-400" />
                    {earningStats.settledMembershipPayouts?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              </div>
              <p className="text-xs text-emerald-400 mt-4">
                Completed 100% monthly membership payouts deposited to your wallet.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-brand-900/20">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Earnings & Settlements Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-950/40 border-b border-brand-900/30">
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Turf / Plan</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Gross</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Your Share</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  {earnings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-500">
                        No earnings history found.
                      </td>
                    </tr>
                  ) : (
                    earnings.map((earning) => {
                      const isMembership = earning.type === 'MEMBERSHIP';
                      const customer = isMembership
                        ? earning.membership?.user
                        : earning.booking?.user;
                      const turfName = isMembership
                        ? earning.turf?.name || earning.plan?.name || 'Turf Plan'
                        : earning.booking?.turf?.name || 'Turf';

                      return (
                        <tr key={earning._id} className="hover:bg-gray-900/40 transition-colors">
                          <td className="py-4 px-6 text-gray-300 text-xs">
                            {new Date(earning.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            {isMembership ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Membership Pass
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Slot Booking
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-white text-sm">{turfName}</div>
                            {isMembership && earning.plan && (
                              <div className="text-xs text-brand-400">{earning.plan.name}</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-white text-sm">
                              {customer?.name || 'Player'}
                            </div>
                            <div className="text-xs text-gray-500">{customer?.email || ''}</div>
                          </td>
                          <td className="py-4 px-6 text-gray-300 font-semibold">
                            ₹{earning.originalAmount}
                          </td>
                          <td className="py-4 px-6 font-bold text-white">
                            {isMembership ? (
                              <span className="text-purple-300">₹{earning.amountOwedToOwner} (100%)</span>
                            ) : (
                              <span className="text-brand-400">₹{earning.amountOwedToOwner} (95%)</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {earning.status === 'settled' ? (
                              <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                              </span>
                            ) : earning.status === 'pending_monthly_payout' ? (
                              <div>
                                <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center">
                                  <Clock className="h-3 w-3 mr-1" /> Escrow Held
                                </span>
                                {earning.matureAt && (
                                  <div className="text-[10px] text-gray-400 mt-1">
                                    Payout: {new Date(earning.matureAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : turfs.length === 0 ? (
        /* --- NO TURFS REGISTERED --- */
        <div className="animate-fadeIn glass-panel text-center p-16 rounded-2xl border border-gray-800 max-w-lg mx-auto flex flex-col items-center relative z-10">
          <ShieldAlert className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Turfs Registered</h3>
          <p className="text-gray-400 text-sm mb-6">
            You haven't added any grounds to your profile yet. Add a new turf to start receiving player slot bookings!
          </p>
          <Link
            to="/owner-turfs/new"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all"
          >
            Register My First Turf
          </Link>
        </div>
      ) : (
        /* --- TURFS TABLE --- */
        <div className="animate-fadeIn glass-panel rounded-2xl overflow-hidden border border-gray-800 relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-850 text-left">
              <thead className="bg-gray-900/60 text-xs font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Ground Details</th>
                  <th className="px-6 py-4">Sport</th>
                  <th className="px-6 py-4">Price per Hour</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850 bg-transparent text-sm text-gray-300">
                {turfs.map((turf) => {
                  const { _id, name, location, city, pricePerHour, sport, capacity, isActive } = turf;
                  const turfPlanCount = plans.filter((p) => (p.turf?._id || p.turf) === _id).length;

                  return (
                    <tr key={_id} className="hover:bg-gray-850/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white tracking-wide">{name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center">
                          <MapPin className="h-3 w-3 text-brand-500 mr-1" />
                          {location}, {city}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-[11px] text-brand-400 font-semibold">
                            {turfPlanCount} Membership Plan{turfPlanCount !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedTurfFilter(_id);
                              setActiveTab('memberships');
                            }}
                            className="text-[11px] text-gray-400 hover:text-white underline cursor-pointer"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded bg-brand-950/60 border border-brand-900 text-brand-400">
                          {sport}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-white font-bold">
                          <IndianRupee className="h-3.5 w-3.5 text-brand-400" />
                          <span>{pricePerHour}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{capacity} Players</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(_id, isActive)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                            isActive
                              ? 'bg-green-950/60 text-green-400 border-green-900/60 hover:bg-green-900/40'
                              : 'bg-red-950/60 text-red-400 border-red-900/60 hover:bg-red-900/40'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <Link
                            to={`/turfs/${_id}`}
                            className="p-1.5 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                            title="View Public Page"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/owner-turfs/edit/${_id}`}
                            className="p-1.5 bg-brand-950/65 hover:bg-brand-900/65 border border-brand-900/60 rounded-lg text-brand-400 hover:text-brand-200 transition-colors"
                            title="Edit Turf details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(_id, name)}
                            className="p-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-900/50 rounded-lg text-red-400 hover:text-red-200 transition-colors"
                            title="Delete Turf"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT MEMBERSHIP PLAN MODAL --- */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-gray-800 p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800/50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-800">
              <div className="p-2.5 bg-brand-950 border border-brand-900 rounded-xl text-brand-400">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  {editingPlan ? 'Edit Membership Plan' : 'Create Turf Membership Plan'}
                </h3>
                <p className="text-xs text-gray-400">Define benefits and pricing for this ground.</p>
              </div>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Select Turf */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Select Ground / Turf *
                </label>
                <select
                  required
                  disabled={Boolean(editingPlan)}
                  value={planForm.turfId}
                  onChange={(e) => setPlanForm({ ...planForm, turfId: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                >
                  {turfs.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plan Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Plan Name * (e.g. Monthly Pass, Gold Pass)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold Tier, Weekend Champion"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                />
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="499"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="30"
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
              </div>

              {/* Discount and Points Multiplier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Slot Discount (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="10"
                    value={planForm.bookingDiscountPercent}
                    onChange={(e) => setPlanForm({ ...planForm, bookingDiscountPercent: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    TurfPoints Multiplier (x)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={planForm.pointsMultiplier}
                    onChange={(e) => setPlanForm({ ...planForm, pointsMultiplier: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Plan Description & Perks
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. 15% discount on all morning and evening slots, plus priority booking."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                />
              </div>

              {/* Early access toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="earlySlotAccess"
                  checked={planForm.earlySlotAccess}
                  onChange={(e) => setPlanForm({ ...planForm, earlySlotAccess: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="earlySlotAccess" className="text-xs text-gray-300">
                  Allow Priority / Early Slot Booking Access
                </label>
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50"
                >
                  {submittingPlan ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAUNCH ARENA AUCTION MODAL */}
      {showAuctionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-amber-500/40 relative shadow-2xl bg-gray-900">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Flame className="h-5 w-5 text-amber-400" />
                <span>Launch Slot into Live Arena</span>
              </h3>
              <button
                onClick={() => setShowAuctionModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchAuction} className="space-y-4 mt-4">
              {/* Select Turf */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Select Ground *
                </label>
                <select
                  required
                  value={auctionForm.turfId}
                  onChange={(e) => {
                    const selTurf = turfs.find((t) => t._id === e.target.value);
                    setAuctionForm({
                      ...auctionForm,
                      turfId: e.target.value,
                      basePrice: selTurf?.pricePerHour || auctionForm.basePrice,
                    });
                  }}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                >
                  {turfs.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} (₹{t.pricePerHour}/hr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Slot Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={auctionForm.date}
                  onChange={(e) => setAuctionForm({ ...auctionForm, date: e.target.value })}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                />
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={auctionForm.startTime}
                    onChange={(e) => setAuctionForm({ ...auctionForm, startTime: e.target.value })}
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
                    value={auctionForm.endTime}
                    onChange={(e) => setAuctionForm({ ...auctionForm, endTime: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
              </div>

              {/* Base Price & Auction Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Starting Base Rate (₹/hr) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={auctionForm.basePrice}
                    onChange={(e) => setAuctionForm({ ...auctionForm, basePrice: e.target.value })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Arena Duration (Minutes) *
                  </label>
                  <select
                    value={auctionForm.durationMinutes}
                    onChange={(e) => setAuctionForm({ ...auctionForm, durationMinutes: Number(e.target.value) })}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-white bg-gray-900 border border-gray-700 text-sm"
                  >
                    <option value={15}>15 Minutes Quick Battle</option>
                    <option value={30}>30 Minutes Standard Battle</option>
                    <option value={60}>1 Hour Long Battle</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-300 text-xs">
                ℹ️ Friday–Sunday dates auto-configure as <strong>Forward Auction</strong> (highest bid wins). Monday–Thursday dates auto-configure as <strong>Reverse Auction</strong>.
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAuctionModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAuction}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/25 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Flame className="h-4 w-4" />
                  <span>{submittingAuction ? 'Launching...' : 'Launch Live Arena'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
