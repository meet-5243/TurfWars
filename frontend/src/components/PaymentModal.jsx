import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Wallet,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Zap,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const PaymentModal = ({
  isOpen,
  onClose,
  title = 'Select Payment Method',
  subtitle = 'Choose how you would like to complete your payment',
  amount = 0,
  onPayViaWallet,
  onPayViaRazorpay,
  isProcessing = false,
  error = '',
}) => {
  const { walletBalance } = useAuth();

  if (!isOpen) return null;

  const hasEnoughBalance = walletBalance >= amount;
  const shortfall = Math.max(0, amount - walletBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-gray-800 p-6 sm:p-7 relative shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-xl bg-gray-900 border border-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-400 bg-brand-950 px-2.5 py-1 rounded border border-brand-900">
            Secure Checkout
          </span>
          <h3 className="text-xl font-black text-white mt-2">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Amount Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 border border-gray-800 flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Payable
          </span>
          <span className="text-2xl font-black text-white flex items-center">
            <IndianRupee className="h-5 w-5 text-brand-400 mr-0.5" />
            {amount}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-400 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Options */}
        <div className="space-y-4">
          {/* OPTION 1: TurfWars Wallet */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              hasEnoughBalance
                ? 'border-emerald-800/60 bg-emerald-950/20 hover:border-emerald-500/80'
                : 'border-gray-800 bg-gray-900/30'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center">
                    TurfWars Wallet
                    <Zap className="h-3.5 w-3.5 text-yellow-400 ml-1 fill-yellow-400" />
                  </h4>
                  <p className="text-[11px] text-gray-400 flex items-center mt-0.5">
                    Available:
                    <IndianRupee className="h-3 w-3 text-emerald-400 ml-1" />
                    <span className="font-bold text-white">{walletBalance}</span>
                  </p>
                </div>
              </div>
              {hasEnoughBalance ? (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Instant
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">
                  Short by ₹{shortfall}
                </span>
              )}
            </div>

            {hasEnoughBalance ? (
              <button
                type="button"
                onClick={onPayViaWallet}
                disabled={isProcessing}
                className="w-full mt-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <span>Processing Wallet Payment...</span>
                ) : (
                  <>
                    <span>Pay ₹{amount} from Wallet</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </button>
            ) : (
              <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">Insufficient balance</span>
                <Link
                  to="/wallet"
                  onClick={onClose}
                  className="text-brand-400 hover:text-brand-300 font-bold flex items-center underline"
                >
                  Top Up Wallet (+₹{shortfall})
                </Link>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="px-3 text-[11px] uppercase font-bold text-gray-500">Or</span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          {/* OPTION 2: Razorpay Direct */}
          <div className="p-4 rounded-2xl border border-gray-800 hover:border-brand-500/60 bg-gray-900/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-brand-950 border border-brand-900 text-brand-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Direct Razorpay</h4>
                  <p className="text-[11px] text-gray-400">
                    UPI, Credit/Debit Card, NetBanking
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onPayViaRazorpay}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <span>Opening Gateway...</span>
              ) : (
                <>
                  <span>Pay ₹{amount} via Razorpay</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-center space-x-1.5 text-[11px] text-gray-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secured with 256-bit Razorpay Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
