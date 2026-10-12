const crypto = require('crypto');
const Razorpay = require('razorpay');
const Wallet = require('../models/Wallet');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SsI2LJqhZvVWVM',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP',
});

// Helper: find or create wallet for a user
const findOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
  }
  return wallet;
};

// @desc    Get wallet (with latest 50 transactions)
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    let wallet = await findOrCreateWallet(req.user._id);

    // Sort transactions by createdAt descending and return latest 50
    const sortedTransactions = wallet.transactions
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.status(200).json({
      success: true,
      data: {
        _id: wallet._id,
        user: wallet.user,
        balance: wallet.balance,
        transactions: sortedTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay order for wallet top-up
// @route   POST /api/wallet/topup/create-order
// @access  Private
const createTopupOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum top-up amount is ₹10' });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `wallet_topup_${req.user._id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay wallet top-up payment and credit wallet
// @route   POST /api/wallet/topup/verify
// @access  Private
const verifyTopup = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'IQhLNh0Zi3dwQ0wmQoNOmtdP';

    // Verify HMAC signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Find or create wallet
    const wallet = await findOrCreateWallet(req.user._id);

    // Credit the wallet
    wallet.balance += Number(amount);
    wallet.transactions.push({
      type: 'CREDIT',
      amount: Number(amount),
      description: 'Wallet Top-up via Razorpay',
      referenceType: 'RAZORPAY_TOPUP',
    });

    await wallet.save();

    res.status(200).json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pay from wallet
// @route   POST /api/wallet/pay
// @access  Private
const payFromWallet = async (req, res) => {
  try {
    const { amount, description, referenceType, referenceId } = req.body;

    const wallet = await findOrCreateWallet(req.user._id);

    if (wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    wallet.balance -= Number(amount);
    wallet.transactions.push({
      type: 'DEBIT',
      amount: Number(amount),
      description,
      referenceType,
      referenceId,
    });

    await wallet.save();

    res.status(200).json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWallet,
  createTopupOrder,
  verifyTopup,
  payFromWallet,
};
