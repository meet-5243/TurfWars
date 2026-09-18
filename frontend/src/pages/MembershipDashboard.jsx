import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const MembershipDashboard = () => {
  const [plans, setPlans] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, currentRes, pointsRes, couponsRes] = await Promise.all([
        axiosInstance.get('/membership/plans'),
        axiosInstance.get('/membership/current'),
        axiosInstance.get('/loyalty/points/balance'),
        axiosInstance.get('/loyalty/coupons')
      ]);

      setPlans(plansRes.data.data);
      setCurrentMembership(currentRes.data.data);
      setPointsBalance(pointsRes.data.data.balance);
      setCoupons(couponsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId) => {
    try {
      setLoading(true);
      await axiosInstance.post('/membership/purchase', { planId });
      fetchData();
      alert('Membership purchased successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error purchasing membership');
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-turf-accent">Loading...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-6">TurfWars Membership & Loyalty</h1>

      {/* Current Status Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Current Status</h2>
          {currentMembership ? (
            <div>
              <p className="text-3xl font-black text-turf-accent mb-2">{currentMembership.plan.name} Member</p>
              <p className="text-gray-400 text-sm">Valid until: {new Date(currentMembership.endDate).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-300">Free User (No Active Membership)</p>
          )}
        </div>
        <div className="mt-4 md:mt-0 text-right bg-gray-950 px-6 py-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-xs uppercase mb-1">TurfPoints Balance</p>
          <p className="text-4xl font-bold text-yellow-500">{pointsBalance}</p>
        </div>
      </div>

      {/* Coupons Section */}
      {currentMembership && coupons.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Your Available Coupons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <div key={coupon._id} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-turf-accent text-gray-950 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                </div>
                <h3 className="text-xl font-black text-white tracking-widest mb-1">{coupon.couponCode}</h3>
                <p className="text-gray-400 text-xs mb-3">Min Booking: ₹{coupon.minimumBookingAmount}</p>
                <p className="text-gray-500 text-xs">Valid till: {new Date(coupon.validUntil).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <h2 className="text-2xl font-bold text-white mb-6 mt-8">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {plans.map(plan => {
          const isCurrent = currentMembership?.plan?._id === plan._id;
          return (
            <div key={plan._id} className={`bg-gray-900 border ${isCurrent ? 'border-turf-accent shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-gray-800'} rounded-xl p-6 flex flex-col`}>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-xs h-10">{plan.description}</p>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-800">
                <span className="text-2xl font-black text-white">₹{plan.price}</span>
                <span className="text-gray-500 text-xs ml-1">/ {plan.durationDays} days</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-2 flex-grow mb-6">
                <li className="flex items-start">
                  <span className="text-turf-accent mr-2">✓</span>
                  {plan.bookingDiscountPercent}% Booking Discount
                </li>
                <li className="flex items-start">
                  <span className="text-turf-accent mr-2">✓</span>
                  {plan.pointsMultiplier}x TurfPoints
                </li>
                {plan.monthlyCouponLimit > 0 && (
                  <li className="flex items-start">
                    <span className="text-turf-accent mr-2">✓</span>
                    {plan.monthlyCouponLimit} Coupons / month
                  </li>
                )}
                {plan.earlySlotAccess && (
                  <li className="flex items-start">
                    <span className="text-turf-accent mr-2">✓</span>
                    Early Slot Access
                  </li>
                )}
                {plan.freeBookingLimit > 0 && (
                  <li className="flex items-start">
                    <span className="text-turf-accent mr-2">✓</span>
                    {plan.freeBookingLimit} Free Booking / month
                  </li>
                )}
              </ul>
              
              <button
                onClick={() => handlePurchase(plan._id)}
                disabled={isCurrent}
                className={`w-full py-2 rounded font-bold transition-all ${
                  isCurrent
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-turf-accent text-gray-950 hover:bg-green-500'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Purchase'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipDashboard;
