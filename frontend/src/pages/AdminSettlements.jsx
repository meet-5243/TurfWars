import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { IndianRupee, Wallet } from 'lucide-react';

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [stats, setStats] = useState({
    adminTotalBalance: 0
  });
  const [loading, setLoading] = useState(true);
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
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Admin Revenue Dashboard</h1>
        <p className="text-gray-400 mt-2">Platform Overview and 5% Commission Earnings.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mb-8">
        {/* Main Admin Balance Card */}
        <div className="glass-panel p-8 rounded-3xl border border-brand-900/30 flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-brand-950/40 to-gray-900">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Wallet className="h-48 w-48 text-brand-500" />
          </div>
          <div className="z-10 flex items-center space-x-6">
            <div className="p-5 bg-brand-500/20 rounded-2xl">
              <IndianRupee className="h-10 w-10 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Admin Earnings (5%)</p>
              <div className="flex items-center text-5xl font-black text-white">
                <IndianRupee className="h-8 w-8 mr-1 text-gray-300" />
                {stats.adminTotalBalance}
              </div>
              <p className="text-sm text-brand-400 mt-2">
                This is your permanent 5% platform fee cut from all bookings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-brand-900/20">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Recent Earnings History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-950/40 border-b border-brand-900/30">
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Booked By</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Turf & Owner</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Booking Amount</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Commission (5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    No earnings found.
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement._id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-300">
                      {new Date(settlement.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-white">
                        {settlement.booking?.user?.name || 'Unknown User'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-white">
                        {settlement.booking?.turf?.name || 'Unknown Turf'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Owner: {settlement.owner?.name || 'Unknown Owner'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-300">
                      <div className="flex items-center">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        {settlement.originalAmount}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-brand-400 font-bold">
                      <div className="flex items-center">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        {settlement.platformCommission}
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
  );
};

export default AdminSettlements;
