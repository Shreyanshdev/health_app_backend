// Razorpay order creation & verification
const razorpay = require('../config/razorpay');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { amount, appointmentId, patientEmail, patientName } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save transaction
    const transaction = await Transaction.create({
      appointmentId,
      razorpayOrderId: order.id,
      amount,
      patientEmail,
      patientName,
      status: 'pending',
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: transaction._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Public
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update transaction
      const transaction = await Transaction.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'success',
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        transaction,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};

