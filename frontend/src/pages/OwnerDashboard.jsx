import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Plus, Edit2, Trash2, ShieldAlert, Check, X, MapPin, IndianRupee, Eye, Users, Wallet, CreditCard } from 'lucide-react';

const OwnerDashboard = () => {
  const [turfs, setTurfs] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('turfs'); // 'turfs' or 'wallet'
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [turfRes, earnRes] = await Promise.all([
        axiosInstance.get('/turfs/owner/mine'),
        axiosInstance.get('/bookings/owner/earnings')
      ]);
      
      if (turfRes.data.success) {
        setTurfs(turfRes.data.data);
      }
      
      if (earnRes.data.success) {
        setEarnings(earnRes.data.data);
        setWalletBalance(earnRes.data.stats.totalEarnings || 0);
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
        setTurfs(
          turfs.map((t) => (t._id === id ? { ...t, isActive: !currentStatus } : t))
        );
        setSuccess(`Status updated to ${!currentStatus ? 'Active' : 'Inactive'}.`);
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Failed to update status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-[80vh]">
      <div className="bg-mesh"></div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Owner Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your grounds and view your earnings.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/owner-turfs/new"
            className="flex items-center space-x-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-600/25 transition-all duration-200"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add New Turf</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 glass-panel p-1 rounded-xl w-fit mb-8 relative z-10">
        <button
          onClick={() => setActiveTab('turfs')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'turfs' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          My Turfs
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'wallet' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
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
      ) : activeTab === 'wallet' ? (
        <div className="animate-fadeIn relative z-10">
          {/* Main Owner Balance Card */}
          <div className="mb-8 glass-panel p-8 rounded-3xl border border-brand-900/30 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden bg-gradient-to-br from-brand-950/40 to-gray-900 gap-6">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wallet className="h-48 w-48 text-brand-500" />
            </div>
            <div className="z-10 flex items-center space-x-6">
              <div className="p-5 bg-brand-500/20 rounded-2xl">
                <IndianRupee className="h-10 w-10 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Available Balance (95%)</p>
                <div className="flex items-center text-5xl font-black text-white">
                  <IndianRupee className="h-8 w-8 mr-1 text-gray-300" />
                  {walletBalance}
                </div>
                <p className="text-sm text-brand-400 mt-2">
                  Your 95% share of all successful bookings.
                </p>
              </div>
            </div>
            <button className="z-10 w-full md:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Withdraw Funds
            </button>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-brand-900/20">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Earnings History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-950/40 border-b border-brand-900/30">
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Turf Booked</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Booked By</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Your Earnings (95%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  {earnings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500">
                        No earnings history found.
                      </td>
                    </tr>
                  ) : (
                    earnings.map((earning) => (
                      <tr key={earning._id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="py-4 px-6 text-gray-300">
                          {new Date(earning.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">
                            {earning.booking?.turf?.name || 'Unknown Turf'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">
                            {earning.booking?.user?.name || 'Unknown User'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {earning.originalAmount}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-brand-400 font-bold">
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {earning.amountOwedToOwner}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : turfs.length === 0 ? (
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
                  return (
                    <tr key={_id} className="hover:bg-gray-850/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white tracking-wide">{name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center">
                          <MapPin className="h-3 w-3 text-brand-500 mr-1" />
                          {location}, {city}
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
    </div>
  );
};

export default OwnerDashboard;
