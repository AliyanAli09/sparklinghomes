import { catchAsync } from '../utils/catchAsync.js';
import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Booking from '../models/Booking.js';
import Mover from '../models/Mover.js';
import User from '../models/User.js';
import jobDistributionService from '../services/jobDistributionService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendPaymentConfirmationEmail, sendBookingConfirmationEmail } from '../utils/email.js';

// @desc    Create payment intent for booking deposit
// @route   POST /api/payments/deposit
// @access  Private (Customer only)
export const createDepositPaymentIntent = catchAsync(async (req, res) => {
  const { amount, bookingId, description } = req.body;
  
  if (!amount || amount < 5000) { // Minimum $50.00
    return res.status(400).json({
      status: 'error',
      message: 'Deposit amount must be at least $50.00'
    });
  }
  
  // Create or get Stripe customer
  let customer;
  if (req.user.stripeCustomerId) {
    customer = req.user.stripeCustomerId;
  } else {
    const stripeCustomer = await stripe.customers.create({
      email: req.user.email,
      name: `${req.user.firstName} ${req.user.lastName}`,
      metadata: {
        userId: req.user._id.toString(),
        userType: 'customer'
      }
    });
    
    // Update user with Stripe customer ID
    await User.findByIdAndUpdate(req.user._id, {
      stripeCustomerId: stripeCustomer.id
    });
    
    customer = stripeCustomer.id;
  }
  
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer,
    description: description || 'Booking deposit',
    metadata: {
      userId: req.user._id.toString(),
      userType: 'customer',
      paymentType: 'booking-deposit',
      bookingId: bookingId || 'pending'
    },
    automatic_payment_methods: {
      enabled: true,
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    }
  });
});

// @desc    Create payment intent for booking deposit (Guest)
// @route   POST /api/payments/guest-booking-deposit
// @access  Public (Guest only)
export const createGuestDepositPaymentIntent = catchAsync(async (req, res) => {
  const { amount, bookingId, description, guestEmail } = req.body;
  
  if (!amount || amount < 5000) { // Minimum $50.00
    return res.status(400).json({
      status: 'error',
      message: 'Deposit amount must be at least $50.00'
    });
  }
  
  if (!guestEmail) {
    return res.status(400).json({
      status: 'error',
      message: 'Guest email is required'
    });
  }
  
  if (!bookingId) {
    return res.status(400).json({
      status: 'error',
      message: 'Booking ID is required'
    });
  }
  
  // Verify booking exists and is a guest booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  if (!booking.customerInfo || !booking.customerInfo.isGuest) {
    return res.status(400).json({
      status: 'error',
      message: 'This endpoint is only for guest bookings'
    });
  }
  
  if (booking.customerInfo.email !== guestEmail) {
    return res.status(400).json({
      status: 'error',
      message: 'Guest email does not match booking'
    });
  }
  
  // Create or get Stripe customer for guest
  let customer;
  try {
    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: guestEmail,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0].id;
    } else {
      // Create new Stripe customer for guest
      const stripeCustomer = await stripe.customers.create({
        email: guestEmail,
        name: `${booking.customerInfo.firstName} ${booking.customerInfo.lastName}`,
        metadata: {
          bookingId: bookingId,
          userType: 'guest',
          isGuest: 'true'
        }
      });
      customer = stripeCustomer.id;
    }
  } catch (error) {
    console.error('Error creating/finding Stripe customer:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process payment setup'
    });
  }
  
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer,
    description: description || 'Guest booking deposit',
    metadata: {
      guestEmail,
      userType: 'guest',
      paymentType: 'booking-deposit',
      bookingId: bookingId,
      isGuest: 'true'
    },
    automatic_payment_methods: {
      enabled: true,
    }
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    }
  });
});

// @desc    Create subscription for mover
// @route   POST /api/payments/subscription
// @access  Private (Mover only)
export const createSubscription = catchAsync(async (req, res) => {
  const { paymentMethodId } = req.body;
  
  if (!paymentMethodId) {
    return res.status(400).json({
      status: 'error',
      message: 'Payment method is required'
    });
  }
  
  // Create or get Stripe customer
  let customer;
  if (req.user.stripeCustomerId) {
    customer = req.user.stripeCustomerId;
  } else {
    const stripeCustomer = await stripe.customers.create({
      email: req.user.email,
      name: `${req.user.firstName} ${req.user.lastName}`,
      metadata: {
        userId: req.user._id.toString(),
        userType: 'mover'
      }
    });
    
    // Update mover with Stripe customer ID
    await Mover.findByIdAndUpdate(req.user._id, {
      stripeCustomerId: stripeCustomer.id
    });
    
    customer = stripeCustomer.id;
  }
  
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer
  });
  
  // Set as default payment method
  await stripe.customers.update(customer, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });
  
  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer,
    items: [{ price: process.env.STRIPE_MOVER_SUBSCRIPTION_PRICE_ID }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId: req.user._id.toString(),
      userType: 'mover'
    }
  });
  
  // Save subscription to database
  const dbSubscription = await Subscription.create({
    mover: req.user._id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customer,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    plan: {
      priceId: process.env.STRIPE_MOVER_SUBSCRIPTION_PRICE_ID,
      amount: 9700, // $97.00 in cents
      currency: 'usd',
      interval: 'month'
    }
  });
  
  // Update mover subscription status
  await Mover.findByIdAndUpdate(req.user._id, {
    subscriptionStatus: subscription.status === 'active' ? 'active' : 'pending',
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000)
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      subscription: dbSubscription,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    }
  });
});

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = catchAsync(async (req, res) => {
  const { paymentIntentId, paymentType, bookingId } = req.body;
  
  if (!paymentIntentId) {
    return res.status(400).json({
      status: 'error',
      message: 'Payment intent ID is required'
    });
  }
  
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId
    });
    
    if (existingPayment) {
      return res.status(200).json({
        status: 'success',
        data: {
          payment: existingPayment,
          message: 'Payment already confirmed'
        }
      });
    }
    
         // Create payment record
     const payment = await Payment.create({
       userId: req.user._id,
       userType: req.user.role === 'mover' ? 'mover' : 'customer',
       amount: paymentIntent.amount,
       currency: paymentIntent.currency,
       type: paymentType || paymentIntent.metadata.paymentType,
       status: 'succeeded',
       stripePaymentIntentId: paymentIntentId,
       stripeCustomerId: paymentIntent.customer,
       metadata: paymentIntent.metadata,
       customer: req.user.role === 'customer' ? req.user._id : undefined,
       mover: req.user.role === 'mover' ? req.user._id : undefined,
       booking: bookingId || paymentIntent.metadata.bookingId
     });
    
         // Handle different payment types
     if (payment.type === 'booking-deposit') {
       const bookingIdToUpdate = bookingId || paymentIntent.metadata.bookingId;
      
      if (bookingIdToUpdate && bookingIdToUpdate !== 'pending') {
        await Booking.findByIdAndUpdate(bookingIdToUpdate, {
          'deposit.paid': true,
          'deposit.paidAt': new Date(),
          'deposit.paymentIntentId': paymentIntentId,
          paymentStatus: 'deposit-paid'
        });
        
        // Trigger job distribution system
        console.log('🔄 Attempting to send job alerts for booking:', bookingIdToUpdate);
        try {
          const result = await jobDistributionService.sendJobAlerts(bookingIdToUpdate);
          console.log('✅ Job alerts sent successfully:', result);
        } catch (error) {
          console.error('❌ Failed to send job alerts:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            bookingId: bookingIdToUpdate
          });
          // Don't fail the payment confirmation if job distribution fails
        }

        // Send booking confirmation email after successful deposit payment
        try {
          const booking = await Booking.findById(bookingIdToUpdate).populate('customer', 'firstName lastName email phone');
          if (booking) {
            await sendBookingConfirmationEmail(booking);
            console.log('✅ Booking confirmation email sent successfully after deposit payment');
          }
        } catch (emailError) {
          console.error('❌ Failed to send booking confirmation email:', emailError);
          // Don't fail the payment confirmation if email fails
        }
      }
         } else if (payment.type === 'mover-subscription') {
       // Update mover subscription status
       await Mover.findByIdAndUpdate(req.user._id, {
         subscriptionStatus: 'active'
       });
     }
    
    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// @desc    Confirm guest payment
// @route   POST /api/payments/guest-confirm
// @access  Public (Guest only)
export const confirmGuestPayment = catchAsync(async (req, res) => {
  const { paymentIntentId, paymentType, bookingId, guestEmail } = req.body;
  
  if (!paymentIntentId) {
    return res.status(400).json({
      status: 'error',
      message: 'Payment intent ID is required'
    });
  }
  
  if (!guestEmail) {
    return res.status(400).json({
      status: 'error',
      message: 'Guest email is required'
    });
  }
  
  if (!bookingId) {
    return res.status(400).json({
      status: 'error',
      message: 'Booking ID is required'
    });
  }
  
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: `Payment not successful. Status: ${paymentIntent.status}`
      });
    }
    
    // Verify this is a guest payment
    if (paymentIntent.metadata.userType !== 'guest' || paymentIntent.metadata.guestEmail !== guestEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid guest payment verification'
      });
    }
    
    // Verify booking exists and matches
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    if (!booking.customerInfo || !booking.customerInfo.isGuest || booking.customerInfo.email !== guestEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking verification failed'
      });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId
    });
    
    if (existingPayment) {
      return res.status(200).json({
        status: 'success',
        data: {
          payment: existingPayment,
          message: 'Payment already confirmed'
        }
      });
    }
    
    // Create payment record for guest
    const payment = await Payment.create({
      userId: null, // No user ID for guest payments
      userType: 'guest',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      type: paymentType || paymentIntent.metadata.paymentType,
      status: 'succeeded',
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: paymentIntent.customer,
      metadata: {
        ...paymentIntent.metadata,
        guestEmail: guestEmail
      },
      booking: bookingId,
      guestEmail: guestEmail
    });
     const paymentCheck = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    // Handle booking deposit payment
    if (payment.type === 'booking-deposit') {
      await Booking.findByIdAndUpdate(bookingId, {
        'deposit.paid': true,
        'deposit.paidAt': new Date(),
        'deposit.paymentIntentId': paymentIntentId,
        paymentStatus: 'deposit-paid'
      });
      
      // Trigger job distribution system
      console.log('🔄 Guest payment: Attempting to send job alerts for booking:', bookingId);
      try {
        const result = await jobDistributionService.sendJobAlerts(bookingId);
        console.log('✅ Guest payment: Job alerts sent successfully:', result);
      } catch (error) {
        console.error('❌ Guest payment: Failed to send job alerts:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          bookingId: bookingId
        });
        // Don't fail the payment confirmation if job distribution fails
      }
     
      // Send booking confirmation email after successful deposit payment
      try {
        const bookingForEmail = await Booking.findById(bookingId);
        
        if (bookingForEmail) {
          if (paymentCheck && paymentCheck.emailSent) {
            // Email already sent, skip sending
          } else {
            // Send email
            await sendBookingConfirmationEmail(bookingForEmail);
            console.log('✅ Guest booking confirmation email sent successfully after deposit payment');
            // Mark as sent
            //await Payment.findByIdAndUpdate(payment._id, { emailSent: true, emailSentAt: new Date() });
          }
         
        }
      } catch (emailError) {
        console.error('❌ Failed to send guest booking confirmation email:', emailError);
        // Don't fail the payment confirmation if email fails
        }
      }

      // Send payment confirmation email
      if (payment.type === 'booking-deposit') {
        try {
          const paymentEmailData = {
            customerName: req.user.firstName + ' ' + req.user.lastName,
            customerEmail: req.user.email,
            paymentIntentId: paymentIntentId,
            amount: payment.amount,
            bookingId: bookingId || paymentIntent.metadata.bookingId
          };
          if (paymentCheck && paymentCheck.emailSent) {
            // Email already sent, skip sending
          } else {
            // Send email
            await sendPaymentConfirmationEmail(paymentEmailData);
            console.log('✅ Payment confirmation email sent successfully');
            // Mark as sent
            await Payment.findByIdAndUpdate(payment._id, { emailSent: true, emailSentAt: new Date() });
          }
          
        } catch (emailError) {
          console.error('❌ Failed to send payment confirmation email:', emailError);
          // Don't fail the payment confirmation if email fails
      }
    }

    // Send payment confirmation email for guest
    if (payment.type === 'booking-deposit') {
      try {
        const booking = await Booking.findById(bookingId);
        const paymentEmailData = {
          customerName: `${booking.customerInfo.firstName} ${booking.customerInfo.lastName}`,
          customerEmail: guestEmail,
          paymentIntentId: paymentIntentId,
          amount: payment.amount,
          bookingId: bookingId
        };
        if (paymentCheck && paymentCheck.emailSent) {
            // Email already sent, skip sending
        } else {
            // Send email
            await sendPaymentConfirmationEmail(paymentEmailData);
            console.log('✅ Payment confirmation email sent successfully');
            // Mark as sent
            await Payment.findByIdAndUpdate(payment._id, { emailSent: true, emailSentAt: new Date() });
        }
      } catch (emailError) {
        console.error('❌ Failed to send guest payment confirmation email:', emailError);
        // Don't fail the payment confirmation if email fails
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Guest payment confirmation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const query = { userId: req.user._id };
  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Payment.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: payments.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      payments
    }
  });
});

// @desc    Get payment status by payment intent ID
// @route   GET /api/payments/status/:paymentIntentId
// @access  Private
export const getPaymentStatus = catchAsync(async (req, res) => {
  const { paymentIntentId } = req.params;
  
  try {
    // Check local database first
    const localPayment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId
    });
    
    if (localPayment) {
      return res.status(200).json({
        status: 'success',
        data: {
          payment: localPayment,
          source: 'local'
        }
      });
    }
    
    // Check Stripe if not found locally
    const stripePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.status(200).json({
      status: 'success',
      data: {
        payment: {
          stripePaymentIntentId: stripePaymentIntent.id,
          amount: stripePaymentIntent.amount,
          currency: stripePaymentIntent.currency,
          status: stripePaymentIntent.status,
          metadata: stripePaymentIntent.metadata
        },
        source: 'stripe'
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      message: 'Payment not found'
    });
  }
});

// @desc    Get mover subscription details
// @route   GET /api/payments/subscription
// @access  Private (Mover only)
export const getSubscriptionDetails = catchAsync(async (req, res) => {
  const subscription = await Subscription.findOne({ mover: req.user._id })
    .sort({ createdAt: -1 });
  
  if (!subscription) {
    return res.status(404).json({
      status: 'error',
      message: 'No subscription found'
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});



// @desc    Handle Stripe webhooks
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful checkout completion
const handleCheckoutCompleted = async (session) => {
  const moverId = session.metadata.moverId;
  
  if (!moverId) {
    console.error('No mover ID in session metadata');
    return;
  }

  try {
    // Update mover subscription status
    await Mover.findByIdAndUpdate(moverId, {
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    console.log(`Mover ${moverId} subscription activated`);
  } catch (error) {
    console.error('Error updating mover subscription:', error);
  }
};

// Webhook event handlers
async function handlePaymentIntentSucceeded(paymentIntent) {
  const { paymentType, userId, userType, bookingId } = paymentIntent.metadata;
  
  // Create payment record if it doesn't exist
  const existingPayment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id
  });
  
     if (!existingPayment) {
     await Payment.create({
       userId,
       userType,
       amount: paymentIntent.amount,
       currency: paymentIntent.currency,
       type: paymentType,
       status: 'succeeded',
       stripePaymentIntentId: paymentIntent.id,
       stripeCustomerId: paymentIntent.customer
     });
   }
  
  // Handle booking deposit
  if (paymentType === 'booking-deposit' && bookingId && bookingId !== 'pending') {
    await Booking.findByIdAndUpdate(bookingId, {
      'deposit.paid': true,
      'deposit.paidAt': new Date(),
      'deposit.paymentIntentId': paymentIntent.id,
      paymentStatus: 'deposit-paid'
    });
    const paymentCheck = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    // Handle booking deposit payment
    if (paymentType === 'booking-deposit') {
      
     
      // Send booking confirmation email after successful deposit payment
      try {
        const bookingForEmail = await Booking.findById(bookingId);
        
        if (bookingForEmail) {
          if (paymentCheck && paymentCheck.emailSent) {
            // Email already sent, skip sending
          } else {
            // Send email
            await sendBookingConfirmationEmail(bookingForEmail);
            console.log('✅ Guest booking confirmation email sent successfully after deposit payment');
            // Mark as sent
            //await Payment.findByIdAndUpdate(payment._id, { emailSent: true, emailSentAt: new Date() });
          }
         
        }
      } catch (emailError) {
        console.error('❌ Failed to send guest booking confirmation email:', emailError);
        // Don't fail the payment confirmation if email fails
        }
      }

      // Send payment confirmation email
      if (paymentType === 'booking-deposit') {
        try {
          const paymentEmailData = {
            customerName: req.user.firstName + ' ' + req.user.lastName,
            customerEmail: req.user.email,
            paymentIntentId: paymentIntentId,
            amount: payment.amount,
            bookingId: bookingId || paymentIntent.metadata.bookingId
          };
          if (paymentCheck && paymentCheck.emailSent) {
            // Email already sent, skip sending
          } else {
            // Send email
            await sendPaymentConfirmationEmail(paymentEmailData);
            console.log('✅ Payment confirmation email sent successfully');
            // Mark as sent
            await Payment.findByIdAndUpdate(payment._id, { emailSent: true, emailSentAt: new Date() });
          }
          
        } catch (emailError) {
          console.error('❌ Failed to send payment confirmation email:', emailError);
          // Don't fail the payment confirmation if email fails
      }
    }

    // Send payment confirmation email for guest
    if (paymentType === 'booking-deposit') {
      try {
        const booking = await Booking.findById(bookingId);
        const paymentEmailData = {
          customerName: `${booking.customerInfo.firstName} ${booking.customerInfo.lastName}`,
          customerEmail: guestEmail,
          paymentIntentId: paymentIntentId,
          amount: payment.amount,
          bookingId: bookingId
        };
        if (paymentCheck && paymentCheck.emailSent) {
            // Email already sent, skip sending
        } else {
            // Send email
            await sendPaymentConfirmationEmail(paymentEmailData);
            console.log('✅ Payment confirmation email sent successfully');
            // Mark as sent
            await Payment.findByIdAndUpdate(payment._id, { emailSent: true, emailSentAt: new Date() });
        }
      } catch (emailError) {
        console.error('❌ Failed to send guest payment confirmation email:', emailError);
        // Don't fail the payment confirmation if email fails
      }
    }
    // Trigger job distribution
    console.log('🔄 Webhook: Attempting to send job alerts for booking:', bookingId);
    try {
      const result = await jobDistributionService.sendJobAlerts(bookingId);
      console.log('✅ Webhook: Job alerts sent successfully:', result);
    } catch (error) {
      console.error('❌ Webhook: Failed to send job alerts:', error);
      console.error('Webhook error details:', {
        message: error.message,
        stack: error.stack,
        bookingId: bookingId
      });
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  const { userId, userType, paymentType, bookingId, guestEmail } = paymentIntent.metadata;
  
  // Create failed payment record
  const existingPayment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id
  });
  
     if (!existingPayment) {
     await Payment.create({
       userId,
       userType,
       amount: paymentIntent.amount,
       currency: paymentIntent.currency,
       type: paymentType,
       status: 'succeeded',
       stripePaymentIntentId: paymentIntent.id,
       stripeCustomerId: paymentIntent.customer,
       ...(userType === 'guest' && guestEmail ? { guestEmail } : {})
     });
   }
  
  
  // Handle failed booking deposit
  if (paymentType === 'booking-deposit' && bookingId && bookingId !== 'pending') {
    await Booking.findByIdAndUpdate(bookingId, {
      'deposit.paid': false,
      paymentStatus: 'pending'
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription
  });
  
  if (subscription) {
    subscription.status = 'active';
    subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
    subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);
    await subscription.save();
    
    // Update mover subscription status
    await Mover.findByIdAndUpdate(subscription.mover, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(invoice.period_end * 1000)
    });
  }
}

async function handleInvoicePaymentFailed(invoice) {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription
  });
  
  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();
    
    // Update mover subscription status
    await Mover.findByIdAndUpdate(subscription.mover, {
      subscriptionStatus: 'past_due'
    });
  }
}

async function handleSubscriptionDeleted(subscription) {
  const dbSubscription = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  });
  
  if (dbSubscription) {
    dbSubscription.status = 'canceled';
    dbSubscription.canceledAt = new Date();
    await dbSubscription.save();
    
    // Update mover subscription status
    await Mover.findByIdAndUpdate(dbSubscription.mover, {
      subscriptionStatus: 'inactive'
    });
  }
}

// Create Stripe Checkout Session
export const createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { plan, amount, successUrl, cancelUrl } = req.body;

  if (!plan || !amount || !successUrl || !cancelUrl) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: plan, amount, successUrl, cancelUrl'
    });
  }

  try {
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BooknMove Mover Subscription',
              description: 'Monthly access to job calendar and real-time job alerts',
            },
            unit_amount: amount, // amount in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: req.user._id.toString(), // Store mover ID for webhook
      metadata: {
        moverId: req.user._id.toString(),
        plan: plan,
        userType: 'mover'
      },
      customer_email: req.user.email,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    });

    res.json({
      success: true,
      sessionUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
});





// Get subscription status
export const getSubscriptionStatus = asyncHandler(async (req, res, next) => {
  try {
    const mover = await Mover.findById(req.user._id);
    
    if (!mover) {
      return res.status(404).json({
        success: false,
        message: 'Mover not found'
      });
    }

    res.json({
      success: true,
      data: {
        subscriptionStatus: mover.subscriptionStatus,
        subscriptionExpiresAt: mover.subscriptionExpiresAt,
        stripeCustomerId: mover.stripeCustomerId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message
    });
  }
});

// Cancel subscription
export const cancelSubscription = asyncHandler(async (req, res, next) => {
  try {
    const mover = await Mover.findById(req.user._id);
    
    if (!mover || !mover.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel subscription in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: mover.stripeCustomerId,
      status: 'active'
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.cancel(subscriptions.data[0].id);
    }

    // Update local status
    await Mover.findByIdAndUpdate(mover._id, {
      subscriptionStatus: 'inactive'
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

// Manual subscription sync for a specific mover
export const syncMoverSubscription = asyncHandler(async (req, res, next) => {
  try {
    const moverId = req.params.moverId || req.user._id;
    
    // Import the service dynamically to avoid circular dependencies
    const subscriptionSyncService = (await import('../services/subscriptionSyncService.js')).default;
    
    const result = await subscriptionSyncService.syncMoverById(moverId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.updated ? 'Subscription status updated' : 'Subscription status already current',
        updated: result.updated,
        moverId: result.mover
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to sync subscription',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync subscription',
      error: error.message
    });
  }
});

// Manual subscription sync for a specific mover by email
export const syncMoverByEmail = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Import the service dynamically to avoid circular dependencies
    const subscriptionSyncService = (await import('../services/subscriptionSyncService.js')).default;
    
    const result = await subscriptionSyncService.syncMoverByEmail(email);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.updated ? 'Subscription status updated' : 'Subscription status already current',
        updated: result.updated,
        moverId: result.mover,
        email: result.email
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to sync subscription',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync subscription',
      error: error.message
    });
  }
});

// Get subscription sync service status
export const getSyncServiceStatus = asyncHandler(async (req, res, next) => {
  try {
    // Import the service dynamically to avoid circular dependencies
    const subscriptionSyncService = (await import('../services/subscriptionSyncService.js')).default;
    
    const status = subscriptionSyncService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync service status',
      error: error.message
    });
  }
});
