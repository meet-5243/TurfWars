import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { IndianRupee, Wallet, Clock, CheckCircle2, RefreshCw, ShieldCheck, Layers, AlertCircle } from 'lucide-react';

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [stats, setStats] = useState({
    adminTotalBalance: 0,
    heldMembershipFunds: 0,
    settledMembershipFunds: 0,
    totalBookingsVolume: 0,
    totalMembershipsVolume: 0,
    pendingPayoutCount: 0,
  });
  const [filter, setFilter] = useState('all'); // 'all' | 'BOOKING' | 'MEMBERSHIP'
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const res = await axiosInstance.get('/admin/settlements');
      if (res.data.success) {
        setSettlements(res.data.data);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPayouts = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await axiosInstance.post('/admin/settlements/trigger-payouts');
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        await fetchSettlements();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to trigger payouts' });
    } finally {
      setTriggering(false);
    }
  };

  const filteredSettlements = settlements.filter((s) => {
    if (filter === 'all') return true;
    return s.type === filter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
        <span className="text-gray-400">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Admin Revenue & Escrow Dashboard</h1>
          <p className="text-gray-400 mt-1">
            5% Booking Commissions & 100% Monthly Turf Membership Settlements.
          </p>
        </div>
        <button
          onClick={handleTriggerPayouts}
          disabled={triggering}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center self-start md:self-auto space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${triggering ? 'animate-spin' : ''}`} />
          <span>{triggering ? 'Processing Payouts...' : 'Run Monthly Payouts (Cron)'}</span>
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center space-x-2 border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Admin 5% Earnings Card */}
        <div className="glass-panel p-6 rounded-3xl border border-brand-900/30 relative overflow-hidden bg-gradient-to-br from-brand-950/40 to-gray-900">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-500/20 rounded-2xl">
              <IndianRupee className="h-8 w-8 text-brand-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Admin 5% Commissions
              </p>
              <div className="flex items-center text-3xl font-black text-white mt-1">
                <IndianRupee className="h-6 w-6 mr-0.5 text-gray-300" />
                {stats.adminTotalBalance?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>
          <p className="text-xs text-brand-400 mt-4">
            Permanent platform fee retained from all completed slot bookings.
          </p>
        </div>

        {/* 100% Held Membership Escrow Card */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-900/30 relative overflow-hidden bg-gradient-to-br from-amber-950/30 to-gray-900">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/20 rounded-2xl">
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Held Membership Escrow (100%)
              </p>
              <div className="flex items-center text-3xl font-black text-amber-300 mt-1">
                <IndianRupee className="h-6 w-6 mr-0.5 text-amber-400" />
                {stats.heldMembershipFunds?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              {stats.pendingPayoutCount || 0} passes awaiting 30-day payout
            </p>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              30-Day Cron Window
            </span>
          </div>
        </div>

        {/* Total Settled Membership Payouts */}
        <div className="glass-panel p-6 rounded-3xl border border-emerald-900/30 relative overflow-hidden bg-gradient-to-br from-emerald-950/30 to-gray-900">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Settled to Owners
              </p>
              <div className="flex items-center text-3xl font-black text-emerald-300 mt-1">
                <IndianRupee className="h-6 w-6 mr-0.5 text-emerald-400" />
                {stats.settledMembershipFunds?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-400 mt-4">
            100% of membership funds delivered to respective turf owners.
          </p>
        </div>
      </div>

      {/* Filter Tabs & History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-brand-900/20">
        <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Settlements & Escrow Ledger</h2>
          <div className="flex items-center space-x-2 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({settlements.length})
            </button>
            <button
              onClick={() => setFilter('BOOKING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'BOOKING' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              5% Bookings
            </button>
            <button
              onClick={() => setFilter('MEMBERSHIP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'MEMBERSHIP' ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              100% Memberships
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-950/40 border-b border-brand-900/30">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Purchaser</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Turf & Owner</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Cut</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Owner Due</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Status / Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    No transactions found under this filter.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((settlement) => {
                  const isMembership = settlement.type === 'MEMBERSHIP';
                  const user = isMembership
                    ? settlement.membership?.user
                    : settlement.booking?.user;
                  const turfName = isMembership
                    ? settlement.turf?.name || settlement.plan?.name || 'Turf Plan'
                    : settlement.booking?.turf?.name || 'Turf';
                  const ownerName = settlement.owner?.name || 'Unknown Owner';

                  return (
                    <tr key={settlement._id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-4 px-6 text-xs text-gray-300">
                        {new Date(settlement.createdAt).toLocaleDateString()}
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
                        <div className="text-sm font-bold text-white">{user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{user?.email || ''}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-white">{turfName}</div>
                        <div className="text-xs text-gray-500">Owner: {ownerName}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300 font-semibold">
                        ₹{settlement.originalAmount}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold">
                        {isMembership ? (
                          <span className="text-gray-500">₹0 (100% Owner)</span>
                        ) : (
                          <span className="text-brand-400">₹{settlement.platformCommission} (5%)</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-white">
                        ₹{settlement.amountOwedToOwner}
                      </td>
                      <td className="py-4 px-6">
                        {settlement.status === 'settled' ? (
                          <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Settled
                          </span>
                        ) : settlement.status === 'pending_monthly_payout' ? (
                          <div>
                            <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> Escrow Held
                            </span>
                            {settlement.matureAt && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                Payout on: {new Date(settlement.matureAt).toLocaleDateString()}
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
  );
};

export default AdminSettlements;
