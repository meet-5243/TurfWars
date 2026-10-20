import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import {
  Trophy,
  IndianRupee,
  CheckCircle,
  Clock,
  Sparkles,
  Tag,
  MapPin,
  ShieldAlert,
  Check,
} from 'lucide-react';

const MembershipDashboard = () => {
  const { user, fetchWallet } = useAuth();

  const [plans, setPlans] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, currentRes, pointsRes, couponsRes] = await Promise.all([
        axiosInstance.get('/membership/plans'),
        axiosInstance.get('/membership/current'),
        axiosInstance.get('/loyalty/points/balance'),
        axiosInstance.get('/loyalty/coupons'),
      ]);

      setPlans(plansRes.data.data || []);
      // Handle all memberships array or fallback single
      const allActive = currentRes.data.all || (currentRes.data.data ? [currentRes.data.data] : []);
      setMyMemberships(allActive);
      setPointsBalance(pointsRes.data.data?.balance || 0);
      setCoupons(couponsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching membership data:', err);
      setError('Failed to load membership data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (plan) => {
    setSelectedPlanForPayment(plan);
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handlePayViaWallet = async () => {
    if (!selectedPlanForPayment) return;
    setPaymentError('');
    setPaymentProcessing(true);

    try {
      const res = await axiosInstance.post('/membership/purchase', {
        planId: selectedPlanForPayment._id,
        payFromWallet: true,
      });

      if (res.data.success) {
        setShowPaymentModal(false);
        setSuccess(`Successfully activated ${selectedPlanForPayment.name} membership via Wallet!`);
        if (fetchWallet) fetchWallet();
        fetchData();
      }
    } catch (err) {
      console.error('Wallet purchase error:', err);
      setPaymentError(err.response?.data?.message || 'Wallet payment failed. Please check balance.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayViaRazorpay = async () => {
    if (!selectedPlanForPayment) return;
    setPaymentError('');
    setPaymentProcessing(true);

    try {
      const orderRes = await axiosInstance.post('/payments/create-membership-order', {
        planId: selectedPlanForPayment._id,
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create membership order');
      }

      const { orderId, amount, currency } = orderRes.data.data;

      if (!window.Razorpay) {
        setPaymentError('Payment gateway could not be loaded. Please disable adblockers or check your connection.');
        setPaymentProcessing(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SsI2LJqhZvVWVM',
        amount: amount.toString(),
        currency: currency || 'INR',
        name: 'TurfWars Membership',
        description: `${selectedPlanForPayment.name} - ${selectedPlanForPayment.turf?.name || 'Turf'}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await axiosInstance.post('/payments/verify-membership-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selectedPlanForPayment._id,
            });

            if (verifyRes.data.success) {
              setShowPaymentModal(false);
              setSuccess(`${selectedPlanForPayment.name} membership activated successfully!`);
              if (fetchWallet) fetchWallet();
              fetchData();
            }
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.name || 'Player',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#10b981',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error(response.error);
        setPaymentError('Payment failed or was cancelled.');
        setPaymentProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay order initiation error:', err);
      setPaymentError(err.response?.data?.message || err.message || 'Failed to initiate online payment.');
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
        <span className="text-gray-400">Loading Memberships & Loyalty...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div className="bg-mesh"></div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
          <Trophy className="h-8 w-8 text-brand-400 mr-3" />
          Turf Memberships & Loyalty Rewards
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Subscribe to your favorite grounds for direct booking discounts, priority access, and reward multipliers.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-950/40 border border-red-900/60 rounded-xl p-4 flex items-start space-x-2 text-red-400 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-950/40 border border-green-900/60 rounded-xl p-4 flex items-start space-x-2 text-green-400 text-sm">
          <Check className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Active Memberships + Points Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Active Memberships list (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 border border-gray-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-800">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <CheckCircle className="h-4 w-4 text-emerald-400 mr-2" />
              Your Active Turf Memberships ({myMemberships.length})
            </h2>
          </div>

          {myMemberships.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              You don't have any active turf memberships. Browse the available ground passes below to start saving!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myMemberships.map((mem) => (
                <div
                  key={mem._id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-brand-950/60 via-gray-900 to-gray-950 border border-brand-800/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-950 border border-brand-800 text-brand-400">
                        {mem.turf?.name || 'Ground Pass'}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                        Active
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">
                      {mem.plan?.name || 'Member Pass'}
                    </h3>
                    <p className="text-xs text-brand-300 font-semibold mt-1">
                      {mem.plan?.bookingDiscountPercent}% slot discount applied at checkout
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800/80 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Valid until:</span>
                    <span className="font-bold text-gray-200">
                      {new Date(mem.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TurfPoints Balance Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-brand-900/30 flex flex-col justify-between bg-gradient-to-br from-brand-950/40 to-gray-900 shadow-xl">
          <div>
            <div className="flex items-center space-x-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>TurfPoints Balance</span>
            </div>
            <div className="text-5xl font-black text-yellow-400 tracking-tight my-2">
              {pointsBalance}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Earn points on every booking! 1 TurfPoint = ₹0.50 discount on future bookings.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-800/80 text-[11px] text-gray-500">
            Multiplier depends on your active ground membership tiers.
          </div>
        </div>
      </div>

      {/* Available Turf Passes */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white">Available Ground Memberships</h2>
        <p className="text-gray-400 text-xs mt-1">
          Pick a ground pass to unlock exclusive member discounts and early slot bookings.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="glass-panel text-center p-12 rounded-2xl border border-gray-800 max-w-md mx-auto">
          <Trophy className="h-10 w-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No ground membership plans are currently active.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const hasThisMembership = myMemberships.some(
              (m) => (m.plan?._id || m.plan) === plan._id
            );

            return (
              <div
                key={plan._id}
                className={`glass-panel rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                  hasThisMembership
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                    : 'border-gray-800 hover:border-brand-900/60 bg-gray-900/50'
                }`}
              >
                <div>
                  {/* Turf Badge */}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold text-brand-400 bg-brand-950 px-2.5 py-0.5 rounded border border-brand-900 flex items-center">
                      <MapPin className="h-3 w-3 mr-1 shrink-0" />
                      {plan.turf?.name || 'Local Turf'}
                    </span>
                    <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded">
                      {plan.bookingDiscountPercent}% OFF
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white mt-2">{plan.name}</h3>
                  <p className="text-xs text-gray-400 min-h-[30px] line-clamp-2 mt-1 mb-3">
                    {plan.description || `Special perks and discount for ${plan.turf?.name || 'this turf'}.`}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline pb-3 mb-4 border-b border-gray-800">
                    <span className="text-2xl font-black text-white flex items-center">
                      <IndianRupee className="h-5 w-5 text-brand-400 mr-0.5" />
                      {plan.price}
                    </span>
                    <span className="text-xs text-gray-500 ml-1.5 font-medium">
                      / {plan.durationDays} days
                    </span>
                  </div>

                  {/* Benefits */}
                  <ul className="text-xs text-gray-300 space-y-2 mb-6">
                    <li className="flex items-center text-brand-300 font-semibold">
                      <Tag className="h-3.5 w-3.5 text-brand-400 mr-1.5 shrink-0" />
                      {plan.bookingDiscountPercent}% off {plan.turf?.name || 'ground'} bookings
                    </li>
                    <li className="flex items-center">
                      <Sparkles className="h-3.5 w-3.5 text-yellow-400 mr-1.5 shrink-0" />
                      {plan.pointsMultiplier}x loyalty reward points
                    </li>
                    {plan.earlySlotAccess && (
                      <li className="flex items-center text-blue-300">
                        <Clock className="h-3.5 w-3.5 text-blue-400 mr-1.5 shrink-0" />
                        Priority early slot booking access
                      </li>
                    )}
                  </ul>
                </div>

                {hasThisMembership ? (
                  <div className="w-full text-center py-2.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl">
                    ✓ Currently Active
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenPayment(plan)}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Purchase Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dual Payment Modal for Membership Purchase */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlanForPayment(null);
        }}
        title={`Purchase ${selectedPlanForPayment?.name || 'Membership'}`}
        subtitle={`Valid for ${selectedPlanForPayment?.durationDays || 30} days at ${selectedPlanForPayment?.turf?.name || 'selected turf'}`}
        amount={selectedPlanForPayment?.price || 0}
        onPayViaWallet={handlePayViaWallet}
        onPayViaRazorpay={handlePayViaRazorpay}
        isProcessing={paymentProcessing}
        error={paymentError}
      />
    </div>
  );
};

export default MembershipDashboard;
