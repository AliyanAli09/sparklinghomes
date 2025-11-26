import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createDepositPaymentIntent,
  createGuestDepositPaymentIntent,
  createSubscription,
  createCheckoutSession,
  confirmPayment,
  confirmGuestPayment,
  getPaymentHistory,
  getPaymentStatus,
  getSubscriptionDetails,
  cancelSubscription,
  syncMoverSubscription,
  syncMoverByEmail,
  getSyncServiceStatus,
  handleWebhook
} from '../controllers/payment.js';

const router = express.Router();

// Webhook endpoint (no auth required)
//router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Guest payment endpoints (no auth required)
router.post('/guest-booking-deposit', createGuestDepositPaymentIntent);
router.post('/guest-confirm', confirmGuestPayment);

// Test endpoint to verify authentication
router.get('/test-auth', protect, (req, res) => {
  res.json({
    status: 'success',
    message: 'Authentication working',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    userType: req.userType
  });
});

// Protected routes
router.use(protect);

// Booking deposit routes
router.post('/deposit', createDepositPaymentIntent);
router.post('/booking-deposit', createDepositPaymentIntent); // Keep both for compatibility
router.post('/confirm', confirmPayment);

// Payment history and status
router.get('/history', getPaymentHistory);
router.get('/status/:paymentIntentId', getPaymentStatus);

// Mover subscription routes
router.post('/subscription', createSubscription);
router.post('/create-checkout-session', createCheckoutSession);
router.get('/subscription', getSubscriptionDetails);
router.post('/subscription/cancel', cancelSubscription);

// Subscription sync routes
router.post('/subscription/sync', syncMoverSubscription);
router.post('/subscription/sync/:moverId', syncMoverSubscription);
router.post('/subscription/sync/email', syncMoverByEmail);
router.get('/subscription/sync/status', getSyncServiceStatus);

export { handleWebhook };

export default router;
