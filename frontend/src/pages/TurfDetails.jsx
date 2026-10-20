import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';

import {
  MapPin,
  Users,
  Calendar,
  IndianRupee,
  Phone,
  Mail,
  Award,
  Info,
  ArrowLeft,
  Trophy,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';

const TurfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isOwner, isAuthenticated, user, fetchWallet } = useAuth();

  const [turf, setTurf] = useState(null);
  const [plans, setPlans] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [activeTurfAuction, setActiveTurfAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const fetchActiveMembership = async () => {
    if (isAuthenticated && !isOwner) {
      try {
        const memRes = await axiosInstance.get(`/membership/current?turfId=${id}`);
        if (memRes.data.success) {
          setMyMembership(memRes.data.data);
        }
      } catch (memErr) {
        console.error('Error fetching user turf membership:', memErr);
      }
    }
  };

  const handleGetMembership = (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
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
        if (fetchWallet) fetchWallet();
        fetchActiveMembership();
        alert(`${selectedPlanForPayment.name} membership activated successfully via Wallet!`);
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
        description: `${selectedPlanForPayment.name} - ${turf?.name || 'Turf'}`,
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
              if (fetchWallet) fetchWallet();
              fetchActiveMembership();
              alert(`${selectedPlanForPayment.name} membership activated successfully!`);
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


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turfRes, plansRes, aucRes] = await Promise.all([
          axiosInstance.get(`/turfs/${id}`),
          axiosInstance.get(`/membership/turf/${id}`),
          axiosInstance.get('/auctions/live').catch(() => ({ data: { success: false } })),
        ]);

        if (turfRes.data.success) {
          setTurf(turfRes.data.data);
        }

        if (plansRes.data.success) {
          setPlans(plansRes.data.data);
        }

        if (aucRes.data?.success && Array.isArray(aucRes.data?.data)) {
          const match = aucRes.data.data.find(
            (a) => (a.turf?._id || a.turf) === id && a.status === 'active'
          );
          if (match) setActiveTurfAuction(match);
        }

        // If authenticated player, check active membership for this turf
        if (isAuthenticated && !isOwner) {
          try {
            const memRes = await axiosInstance.get(`/membership/current?turfId=${id}`);
            if (memRes.data.success && memRes.data.data) {
              setMyMembership(memRes.data.data);
            }
          } catch (memErr) {
            console.error('Error fetching user turf membership:', memErr);
          }
        }
      } catch (err) {
        console.error('Error fetching turf details:', err);
        setError(err.response?.data?.message || 'Turf details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, isOwner]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>

      {/* Back navigation */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors text-sm font-semibold"
        >
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
                <span>
                  {location}, {city}
                </span>
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

            {/* Live Arena Auction Callout */}
            {activeTurfAuction && (
              <div className="bg-gradient-to-r from-amber-950/50 via-amber-900/30 to-gray-900 border border-amber-500/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-amber-950/30">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                    <Flame className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-gray-950 tracking-wider">
                        Live Arena Battle
                      </span>
                      <span className="text-xs text-amber-300 font-bold">
                        {activeTurfAuction.auctionType} Auction
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">
                      Slot: {activeTurfAuction.date} ({activeTurfAuction.startTime} – {activeTurfAuction.endTime})
                    </h4>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Current Bid:{' '}
                      <strong className="text-amber-400 font-bold">
                        ₹{activeTurfAuction.currentLeadingBidRate || activeTurfAuction.basePrice}/hr
                      </strong>
                    </p>
                  </div>
                </div>
                <Link
                  to={`/arena/${activeTurfAuction._id}`}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 self-start sm:self-auto shrink-0"
                >
                  <Flame className="h-4 w-4" />
                  <span>Enter Arena ⚔️</span>
                </Link>
              </div>
            )}

            {/* Active User Membership Callout for this Turf */}
            {myMembership && (
              <div className="bg-gradient-to-r from-brand-950/60 via-brand-900/30 to-gray-900 border border-brand-500/40 rounded-2xl p-5 flex items-start space-x-4">
                <div className="p-3 bg-brand-500/20 rounded-xl text-brand-400 shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-brand-500 text-gray-950">
                      Active Member
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {myMembership.plan?.name} Pass
                    </h4>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    You get <strong className="text-brand-400">{myMembership.plan?.bookingDiscountPercent}% OFF</strong> automatically on all slots booked at {name}. Valid until {new Date(myMembership.endDate).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            )}

            {/* Turf Membership Plans Section */}
            {plans.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-brand-400" />
                    <h3 className="text-lg font-bold text-white">Ground Memberships</h3>
                  </div>
                  <span className="text-xs text-gray-400">Exclusive to {name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => {
                    const isMyPlan = myMembership?.plan?._id === plan._id;
                    return (
                      <div
                        key={plan._id}
                        className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                          isMyPlan
                            ? 'border-brand-500/60 bg-brand-950/20 shadow-lg shadow-brand-950/50'
                            : 'border-gray-800 hover:border-brand-900/50 bg-gray-900/40'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-extrabold text-white text-base">{plan.name}</h4>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-950 border border-brand-900 text-brand-400">
                              {plan.bookingDiscountPercent}% OFF
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-3 min-h-[28px] line-clamp-2">
                            {plan.description || `Special perks and discounted rates on ${name}.`}
                          </p>
                          <div className="flex items-baseline mb-3">
                            <span className="text-2xl font-black text-white flex items-center">
                              <IndianRupee className="h-5 w-5 text-brand-400 mr-0.5" />
                              {plan.price}
                            </span>
                            <span className="text-xs text-gray-500 ml-1.5 font-medium">/ {plan.durationDays} days</span>
                          </div>
                          <ul className="text-xs text-gray-300 space-y-1.5 mb-4">
                            <li className="flex items-center text-brand-300">
                              <Tag className="h-3.5 w-3.5 text-brand-400 mr-1.5 shrink-0" />
                              {plan.bookingDiscountPercent}% off every booking
                            </li>
                            <li className="flex items-center text-gray-400">
                              <Sparkles className="h-3.5 w-3.5 text-yellow-400 mr-1.5 shrink-0" />
                              {plan.pointsMultiplier}x loyalty reward points
                            </li>
                            {plan.earlySlotAccess && (
                              <li className="flex items-center text-blue-300">
                                <Clock className="h-3.5 w-3.5 text-blue-400 mr-1.5 shrink-0" />
                                Priority early slot access
                              </li>
                            )}
                          </ul>
                        </div>

                        {isMyPlan ? (
                          <div className="w-full text-center py-2 bg-brand-950/80 border border-brand-800 text-brand-400 text-xs font-bold rounded-xl">
                            ✓ Currently Active
                          </div>
                        ) : isOwner ? (
                          <div className="w-full text-center py-2 bg-gray-800/40 text-gray-500 text-xs rounded-xl">
                            Owner View
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGetMembership(plan)}
                            className="w-full text-center py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            Get Membership
                          </button>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

        {/* Right Column: Booking details & CTA */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-900/10 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Calendar className="mr-2 text-brand-500 h-5 w-5" />
              Book This Ground
            </h3>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800 text-center">
              <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Standard Rate</span>
              <span className="text-brand-400 font-black text-3xl flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-brand-400" />
                {pricePerHour} <span className="text-sm font-semibold text-gray-400 ml-1">/ hour</span>
              </span>
              {myMembership && (
                <span className="block text-xs text-green-400 font-bold mt-1">
                  Your discount: -{myMembership.plan?.bookingDiscountPercent}% applied at checkout!
                </span>
              )}
            </div>

            {/* General Info */}
            <div className="space-y-3.5 text-sm text-gray-300">
              <div className="flex justify-between flex-wrap gap-2">
                <span>Availability</span>
                <span className="text-emerald-400 font-bold">Open Daily (06:00 - 00:00)</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity</span>
                <span className="text-white font-bold">{capacity} Players</span>
              </div>
              <div className="flex justify-between">
                <span>Sport Category</span>
                <span className="text-white capitalize font-bold">{sport}</span>
              </div>
            </div>

            {/* Action CTA Button */}
            {!isActive ? (
              <div className="text-center py-4 px-4 bg-red-950/20 border border-red-900/40 rounded-2xl text-red-400 text-sm">
                <span>This turf is currently inactive. Bookings are temporarily suspended.</span>
              </div>
            ) : isOwner ? (
              <div className="text-center py-4 px-4 bg-yellow-950/20 border border-yellow-900/40 rounded-2xl text-yellow-400 text-sm">
                <span>Logged in as <strong>Owner</strong>. Owners cannot book slots.</span>
              </div>
            ) : (
              <Link
                to={`/turfs/${id}/book`}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl text-sm font-extrabold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all duration-200 mt-4 text-center"
              >
                Book Your Slot Now
              </Link>
            )}

            <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-gray-300 mb-1">
                <Info className="h-4 w-4 text-brand-400" />
                <span>How booking works</span>
              </div>
              <p>
                Click above to view the live slot grid, select your preferred date and duration, and confirm your slots instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Payment Modal for Turf Ground Membership */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPlanForPayment(null);
        }}
        title={`Purchase ${selectedPlanForPayment?.name || 'Membership'}`}
        subtitle={`Exclusive membership pass for ${turf?.name || 'this turf'} (${selectedPlanForPayment?.durationDays || 30} days)`}
        amount={selectedPlanForPayment?.price || 0}
        onPayViaWallet={handlePayViaWallet}
        onPayViaRazorpay={handlePayViaRazorpay}
        isProcessing={paymentProcessing}
        error={paymentError}
      />
    </div>
  );
};

export default TurfDetails;

