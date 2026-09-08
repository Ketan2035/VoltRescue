import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.warn('Razorpay credentials not found or invalid. Payment service will not work in production.');
}

/**
 * Creates an order in Razorpay
 * @param {Number} amount Amount in INR
 * @param {String} receipt Receipt ID (usually Booking ID)
 */
export const createOrder = async (amount, receipt) => {
  if (!razorpayInstance) {
    // For development without keys, return a mock order
    return {
      id: `order_mock_${Date.now()}`,
      amount: amount * 100, // Razorpay works in paise
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true
    };
  }

  const options = {
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    receipt: receipt,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verifies the Razorpay payment signature
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return true; // Mock verification if keys are not set
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};
