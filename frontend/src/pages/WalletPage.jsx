import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ShieldCheck,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const WalletPage = () => {
  const { user, walletBalance, fetchWallet } = useAuth();

  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchWalletData = async () => {
    try {
      const res = await axiosInstance.get('/wallet');
      if (res.data.success) {
        setWalletData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError('Failed to load wallet details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleSelectPreset = (amount) => {
    setTopupAmount(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    setTopupAmount(Number(val));
    setError('');
  };

  const handleTopup = async () => {
    setError('');
    setSuccess('');

    const amount = Number(customAmount || topupAmount);
    if (!amount || amount < 10) {
      setError('Minimum top-up amount is ₹10.');
      return;
    }

    if (amount > 50000) {
      setError('Maximum single top-up amount is ₹50,000.');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Topup Order
      const orderRes = await axiosInstance.post('/wallet/topup/create-order', { amount });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Failed to create topup order');
      }

      const { orderId, amount: amountInPaise, currency } = orderRes.data.data;

      if (!window.Razorpay) {
        setError('Payment gateway failed to load. Please check your internet or disable ad-blockers.');
        setIsProcessing(false);
        return;
      }

      // Step 2: Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SsI2LJqhZvVWVM',
        amount: amountInPaise.toString(),
        currency: currency || 'INR',
        name: 'TurfWars Wallet',
        description: `Top-up ₹${amount} into TurfWars Wallet`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Step 3: Verify Signature & Credit Balance
            const verifyRes = await axiosInstance.post('/wallet/topup/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
            });

            if (verifyRes.data.success) {
              setSuccess(`₹${amount} added successfully to your TurfWars Wallet!`);
              setCustomAmount('');
              // Refresh global balance & local wallet details
              fetchWallet();
              fetchWalletData();
            }
          } catch (verifyErr) {
            console.error('Wallet verification error:', verifyErr);
            setError(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || 'Player',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#10b981', // emerald green theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed:', resp.error);
        setError(resp.error?.description || 'Top-up payment cancelled or failed.');
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Topup initiate error:', err);
      setError(err.response?.data?.message || err.message || 'Error initiating top-up.');
      setIsProcessing(false);
    }
  };

  const transactions = walletData?.transactions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div className="bg-mesh"></div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
          <Wallet className="h-8 w-8 text-brand-400 mr-3" />
          TurfWars Wallet
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Store credits for instant 1-click turf bookings and memberships with zero gateway lag.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl flex items-start space-x-3 text-red-400 text-sm animate-fadeIn">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-950/40 border border-green-900/60 rounded-2xl flex items-start space-x-3 text-green-400 text-sm animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid: Balance Card + Top-Up Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left Column: Balance Display Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-brand-900/30 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-brand-950/60 via-gray-900 to-gray-950 shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Wallet className="h-44 w-44 text-brand-400" />
          </div>

          <div>
            <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="h-4 w-4" />
              <span>Available Balance</span>
            </div>
            <div className="flex items-center text-5xl font-black text-white tracking-tight my-4">
              <IndianRupee className="h-9 w-9 mr-1 text-brand-400" />
              <span>{walletData ? walletData.balance : walletBalance}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use your wallet balance to instantly pay for slots and ground passes.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800/80 space-y-2 text-xs text-gray-300">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" />
              <span>100% Protected by Razorpay Escrow</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-brand-400" />
              <span>Instant slot confirmations</span>
            </div>
          </div>
        </div>

        {/* Right Column (2 cols): Add Money / Top-Up */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Plus className="h-5 w-5 text-brand-400 mr-2" />
              Add Money to Wallet
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select a quick preset or type a custom amount to load your wallet via UPI, Cards, or NetBanking.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-3">
            {[200, 500, 1000, 2000].map((amt) => {
              const isSelected = !customAmount && topupAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-3 px-2 rounded-xl text-sm font-bold border transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/30'
                      : 'bg-gray-900/60 hover:bg-gray-850 text-gray-300 border-gray-750 hover:text-white'
                  }`}
                >
                  <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                  {amt}
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Or Enter Custom Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="number"
                min="10"
                max="50000"
                placeholder="e.g. 750"
                value={customAmount}
                onChange={handleCustomChange}
                className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-base font-semibold border-gray-800 focus:border-brand-500"
              />
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Minimum top-up: ₹10 • Maximum: ₹50,000
            </span>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleTopup}
            disabled={isProcessing}
            className="w-full py-3.5 px-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Opening Payment Gateway...</span>
              </div>
            ) : (
              <>
                <IndianRupee className="h-5 w-5" />
                <span>
                  Add ₹{customAmount || topupAmount} via Razorpay
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800 shadow-xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Wallet Transaction History</h3>
            <p className="text-xs text-gray-400 mt-0.5">All credits, top-ups, and payment deductions.</p>
          </div>
          <span className="text-xs text-gray-500 font-semibold">
            {transactions.length} record{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent mx-auto mb-3"></div>
            Loading ledger...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            <Clock className="h-10 w-10 text-gray-600 mx-auto mb-2" />
            No transactions yet. Top up your wallet to make instant bookings!
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <div
                  key={tx._id}
                  className="p-5 flex items-center justify-between hover:bg-gray-850/20 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-2xl ${
                        isCredit
                          ? 'bg-green-950/60 border border-green-900/60 text-green-400'
                          : 'bg-red-950/60 border border-red-900/60 text-red-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-wide">
                        {tx.description || (isCredit ? 'Wallet Top-up' : 'Payment')}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-gray-900 text-gray-400 border border-gray-800">
                          {tx.referenceType || (isCredit ? 'TOPUP' : 'PAYMENT')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-base font-extrabold flex items-center ${
                      isCredit ? 'text-green-400' : 'text-gray-200'
                    }`}
                  >
                    <span>{isCredit ? '+' : '-'}</span>
                    <IndianRupee className="h-4 w-4 ml-0.5" />
                    <span>{tx.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
