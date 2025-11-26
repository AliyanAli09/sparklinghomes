import stripe from '../config/stripe.js';
import Mover from '../models/Mover.js';
import Subscription from '../models/Subscription.js';

class SubscriptionSyncService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
  }

  // Start the subscription sync service
  start() {
    if (this.isRunning) {
      console.log('🔄 Subscription sync service is already running');
      return;
    }

    console.log('🚀 Starting subscription sync service (checking every 2 minutes)...');
    this.isRunning = true;

    // Run initial check immediately
    this.syncAllSubscriptions();

    // Set up interval for periodic checks
    this.interval = setInterval(() => {
      this.syncAllSubscriptions();
    }, this.checkInterval);
  }

  // Stop the subscription sync service
  stop() {
    if (!this.isRunning) {
      console.log('🛑 Subscription sync service is not running');
      return;
    }

    console.log('🛑 Stopping subscription sync service...');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // Sync all subscription statuses from Stripe
  async syncAllSubscriptions() {
    try {
      console.log('🔄 Syncing subscription statuses from Stripe...');
      
      // Get all movers (both with and without Stripe customer IDs)
      const allMovers = await Mover.find({});
      console.log(`📊 Found ${allMovers.length} total movers`);

      let updatedCount = 0;
      let errorCount = 0;
      let customerIdFoundCount = 0;
      let emailSearchCount = 0;

      for (const mover of allMovers) {
        try {
          const updated = await this.syncMoverSubscription(mover);
          if (updated) updatedCount++;
        } catch (error) {
          console.error(`❌ Error syncing subscription for mover ${mover._id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Subscription sync completed: ${updatedCount} updated, ${errorCount} errors`);
      console.log(`📊 Customer ID lookup: ${customerIdFoundCount} by ID, ${emailSearchCount} by email`);
    } catch (error) {
      console.error('❌ Error in subscription sync service:', error);
    }
  }

  // Sync subscription status for a specific mover
  async syncMoverSubscription(mover) {
    try {
      let stripeCustomerId = mover.stripeCustomerId;
      let customerIdSource = 'existing';

      // If no Stripe customer ID, try to find by email
      if (!stripeCustomerId) {
        try {
          console.log(`🔍 Searching for Stripe customer by email: ${mover.email}`);
          
          // Search for customer by email in Stripe
          const customers = await stripe.customers.list({
            email: mover.email,
            limit: 1
          });

          if (customers.data.length > 0) {
            stripeCustomerId = customers.data[0].id;
            customerIdSource = 'email_search';
            
            // Update mover with found Stripe customer ID
            await Mover.findByIdAndUpdate(mover._id, {
              stripeCustomerId: stripeCustomerId
            });
            
            console.log(`✅ Found Stripe customer ID ${stripeCustomerId} for mover ${mover._id} via email search`);
          } else {
            console.log(`⚠️ No Stripe customer found for mover ${mover._id} with email ${mover.email}`);
            return false;
          }
        } catch (searchError) {
          console.error(`❌ Error searching for Stripe customer by email for mover ${mover._id}:`, searchError.message);
          return false;
        }
      }

      // Get customer's subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 10
      });

      if (subscriptions.data.length === 0) {
        // No subscriptions found, mark as inactive
        if (mover.subscriptionStatus !== 'inactive') {
          await Mover.findByIdAndUpdate(mover._id, {
            subscriptionStatus: 'inactive',
            subscriptionExpiresAt: null
          });
          console.log(`📉 Mover ${mover._id} subscription marked as inactive (no subscriptions found)`);
          return true;
        }
        return false;
      }

      // Get the most recent active subscription
      const activeSubscription = subscriptions.data.find(sub => 
        ['active', 'trialing', 'past_due'].includes(sub.status)
      );

      if (activeSubscription) {
        const newStatus = this.mapStripeStatusToLocal(activeSubscription.status);
        const expiresAt = new Date(activeSubscription.current_period_end * 1000);

        // Check if status needs updating
        if (mover.subscriptionStatus !== newStatus || 
            !mover.subscriptionExpiresAt || 
            mover.subscriptionExpiresAt.getTime() !== expiresAt.getTime()) {
          
          await Mover.findByIdAndUpdate(mover._id, {
            subscriptionStatus: newStatus,
            subscriptionExpiresAt: expiresAt
          });

          console.log(`🔄 Mover ${mover._id} subscription updated: ${mover.subscriptionStatus} → ${newStatus} (${customerIdSource})`);
          return true;
        }
      } else {
        // No active subscriptions, mark as inactive
        if (mover.subscriptionStatus !== 'inactive') {
          await Mover.findByIdAndUpdate(mover._id, {
            subscriptionStatus: 'inactive',
            subscriptionExpiresAt: null
          });
          console.log(`📉 Mover ${mover._id} subscription marked as inactive (no active subscriptions)`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`❌ Error syncing mover ${mover._id} subscription:`, error);
      throw error;
    }
  }

  // Map Stripe subscription status to local status
  mapStripeStatusToLocal(stripeStatus) {
    const statusMap = {
      'active': 'active',
      'trialing': 'active',
      'past_due': 'active',
      'canceled': 'inactive',
      'unpaid': 'inactive',
      'incomplete': 'inactive',
      'incomplete_expired': 'inactive'
    };

    return statusMap[stripeStatus] || 'inactive';
  }

  // Manual sync for a specific mover (can be called from API)
  async syncMoverById(moverId) {
    try {
      const mover = await Mover.findById(moverId);
      if (!mover) {
        throw new Error('Mover not found');
      }

      const updated = await this.syncMoverSubscription(mover);
      return { success: true, updated, mover: mover._id };
    } catch (error) {
      console.error(`❌ Error manually syncing mover ${moverId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Manual sync for a specific mover by email (useful for first-time activation)
  async syncMoverByEmail(email) {
    try {
      const mover = await Mover.findOne({ email });
      if (!mover) {
        throw new Error('Mover not found with this email');
      }

      const updated = await this.syncMoverSubscription(mover);
      return { success: true, updated, mover: mover._id, email };
    } catch (error) {
      console.error(`❌ Error manually syncing mover by email ${email}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: this.lastCheckTime
    };
  }
}

// Create singleton instance
const subscriptionSyncService = new SubscriptionSyncService();

export default subscriptionSyncService;
