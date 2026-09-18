import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AdminMembership = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get('/membership/admin/plans');
      setPlans(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-turf-accent">Loading Admin...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-6">Admin: Membership Management</h1>
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-xs uppercase bg-gray-800 text-gray-400">
            <tr>
              <th className="px-4 py-3">Plan Name</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Booking Discount</th>
              <th className="px-4 py-3">Points Multiplier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan._id} className="border-b border-gray-800">
                <td className="px-4 py-4 font-bold text-white">{plan.name}</td>
                <td className="px-4 py-4">₹{plan.price}</td>
                <td className="px-4 py-4">{plan.durationDays} days</td>
                <td className="px-4 py-4">{plan.bookingDiscountPercent}%</td>
                <td className="px-4 py-4">{plan.pointsMultiplier}x</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${plan.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {plan.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button className="text-blue-400 hover:text-blue-300 text-xs font-bold px-3 py-1 bg-blue-900/20 rounded border border-blue-900/50">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMembership;
