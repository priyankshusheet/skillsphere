const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  // Create a customer
  async createCustomer(user) {
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
          companyId: user.company.toString(),
        },
      });

      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata,
      });

      logger.info(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updates
      );

      logger.info(`Subscription updated: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: cancelAtPeriodEnd,
        }
      );

      logger.info(`Subscription cancelled: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Create a payment intent
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  // Create a checkout session
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, metadata = {}) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });

      logger.info(`Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  // Create a billing portal session
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info(`Billing portal session created: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to create billing portal session:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve subscription:', error);
      throw error;
    }
  }

  // Get customer details
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      logger.error('Failed to retrieve customer:', error);
      throw error;
    }
  }

  // List customer subscriptions
  async listCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
      });
      return subscriptions;
    } catch (error) {
      logger.error('Failed to list customer subscriptions:', error);
      throw error;
    }
  }

  // Create an invoice
  async createInvoice(customerId, items, metadata = {}) {
    try {
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 30,
        line_items: items,
        metadata,
      });

      logger.info(`Invoice created: ${invoice.id}`);
      return invoice;
    } catch (error) {
      logger.error('Failed to create invoice:', error);
      throw error;
    }
  }

  // Send invoice
  async sendInvoice(invoiceId) {
    try {
      const invoice = await this.stripe.invoices.sendInvoice(invoiceId);
      logger.info(`Invoice sent: ${invoice.id}`);
      return invoice;
    } catch (error) {
      logger.error('Failed to send invoice:', error);
      throw error;
    }
  }

  // Create a refund
  async createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      logger.info(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Failed to create refund:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Failed to handle webhook event:', error);
      throw error;
    }
  }

  // Webhook event handlers
  async handleSubscriptionCreated(subscription) {
    logger.info(`Subscription created: ${subscription.id}`);
    // Update database with subscription details
    // Send welcome email
    // Update user permissions
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info(`Subscription updated: ${subscription.id}`);
    // Update database with new subscription details
    // Update user permissions
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info(`Subscription deleted: ${subscription.id}`);
    // Update database to mark subscription as cancelled
    // Downgrade user permissions
    // Send cancellation email
  }

  async handlePaymentSucceeded(invoice) {
    logger.info(`Payment succeeded for invoice: ${invoice.id}`);
    // Update database with payment details
    // Send payment confirmation email
  }

  async handlePaymentFailed(invoice) {
    logger.info(`Payment failed for invoice: ${invoice.id}`);
    // Update database with payment failure
    // Send payment failure notification
    // Attempt to retry payment
  }

  async handlePaymentIntentSucceeded(paymentIntent) {
    logger.info(`Payment intent succeeded: ${paymentIntent.id}`);
    // Update database with successful payment
  }

  async handlePaymentIntentFailed(paymentIntent) {
    logger.info(`Payment intent failed: ${paymentIntent.id}`);
    // Update database with failed payment
    // Send failure notification
  }

  // Utility methods
  formatAmount(amount, currency = 'usd') {
    const currencies = {
      usd: 100, // cents
      eur: 100,
      gbp: 100,
    };
    return Math.round(amount * currencies[currency] || 100);
  }

  formatAmountFromStripe(amount, currency = 'usd') {
    const currencies = {
      usd: 100, // cents
      eur: 100,
      gbp: 100,
    };
    return amount / (currencies[currency] || 100);
  }

  // Get available plans
  async getAvailablePlans() {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });

      return prices.data.map(price => ({
        id: price.id,
        product: price.product,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        metadata: price.metadata,
      }));
    } catch (error) {
      logger.error('Failed to get available plans:', error);
      throw error;
    }
  }

  // Create a usage record for metered billing
  async createUsageRecord(subscriptionItemId, quantity, timestamp = Math.floor(Date.now() / 1000)) {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp,
          action: 'increment',
        }
      );

      logger.info(`Usage record created: ${usageRecord.id}`);
      return usageRecord;
    } catch (error) {
      logger.error('Failed to create usage record:', error);
      throw error;
    }
  }

  // Get subscription usage
  async getSubscriptionUsage(subscriptionItemId) {
    try {
      const usageRecords = await this.stripe.invoiceItems.list({
        subscription_item: subscriptionItemId,
      });

      return usageRecords;
    } catch (error) {
      logger.error('Failed to get subscription usage:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
