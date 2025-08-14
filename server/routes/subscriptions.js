const express = require('express');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/plans', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // Mock subscription plans - in production, this would come from Stripe
    const plans = [
      {
        id: 'plan-starter',
        name: 'Starter',
        description: 'Perfect for small teams getting started',
        price: 29,
        currency: 'usd',
        interval: 'month',
        features: [
          'Up to 50 users',
          'Basic skills assessment',
          'Learning recommendations',
          'Email support',
          'Standard analytics'
        ],
        limits: {
          users: 50,
          assessments: 100,
          storage: '10GB'
        }
      },
      {
        id: 'plan-professional',
        name: 'Professional',
        description: 'Ideal for growing organizations',
        price: 99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Up to 200 users',
          'Advanced AI assessment',
          'Custom learning paths',
          'Priority support',
          'Advanced analytics',
          'Team management',
          'Integration with 3rd party tools'
        ],
        limits: {
          users: 200,
          assessments: 500,
          storage: '50GB'
        }
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        description: 'For large organizations with complex needs',
        price: 299,
        currency: 'usd',
        interval: 'month',
        features: [
          'Unlimited users',
          'Custom AI models',
          'White-label solution',
          'Dedicated support',
          'Advanced reporting',
          'SSO integration',
          'Custom integrations',
          'On-premise deployment option'
        ],
        limits: {
          users: -1, // Unlimited
          assessments: -1, // Unlimited
          storage: '500GB'
        }
      }
    ];

    res.json({
      success: true,
      message: 'Subscription plans retrieved successfully',
      data: plans
    });
  } catch (error) {
    logger.error('Get subscription plans error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/current:
 *   get:
 *     summary: Get current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/current', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('company');

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const subscription = user.company.subscription;

    if (!subscription) {
      return res.json({
        success: true,
        message: 'No active subscription found',
        data: null
      });
    }

    // Get additional subscription details from Stripe if available
    let stripeSubscription = null;
    if (subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await paymentService.getSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        logger.warn('Failed to fetch Stripe subscription:', error);
      }
    }

    res.json({
      success: true,
      message: 'Current subscription retrieved successfully',
      data: {
        ...subscription,
        stripeDetails: stripeSubscription
      }
    });
  } catch (error) {
    logger.error('Get current subscription error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/create:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/create', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    if (!planId) {
      throw new ValidationError('Plan ID is required');
    }

    // Get plan details
    const plans = await paymentService.getAvailablePlans();
    const selectedPlan = plans.find(plan => plan.id === planId);

    if (!selectedPlan) {
      throw new ValidationError('Invalid plan ID');
    }

    // Create or get Stripe customer
    let customer;
    try {
      customer = await paymentService.getCustomer(user.company.stripeCustomerId);
    } catch (error) {
      customer = await paymentService.createCustomer(user);
      
      // Update company with Stripe customer ID
      await Company.findByIdAndUpdate(user.company, {
        stripeCustomerId: customer.id
      });
    }

    // Create subscription
    const subscription = await paymentService.createSubscription(
      customer.id,
      planId,
      {
        companyId: user.company.toString(),
        userId: userId.toString()
      }
    );

    // Update company subscription
    const subscriptionData = {
      plan: planId,
      status: subscription.status,
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
      features: selectedPlan.features || [],
      limits: selectedPlan.limits || {}
    };

    await Company.findByIdAndUpdate(user.company, {
      subscription: subscriptionData
    });

    logger.info(`Subscription created: ${subscription.id} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: subscriptionData,
        stripeSubscription: subscription
      }
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/update:
 *   put:
 *     summary: Update subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/update', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    if (!planId) {
      throw new ValidationError('Plan ID is required');
    }

    const company = await Company.findById(user.company);
    if (!company.subscription?.stripeSubscriptionId) {
      throw new ValidationError('No active subscription found');
    }

    // Update Stripe subscription
    const updatedSubscription = await paymentService.updateSubscription(
      company.subscription.stripeSubscriptionId,
      {
        items: [{ price: planId }]
      }
    );

    // Get plan details
    const plans = await paymentService.getAvailablePlans();
    const selectedPlan = plans.find(plan => plan.id === planId);

    // Update company subscription
    const subscriptionData = {
      ...company.subscription,
      plan: planId,
      features: selectedPlan?.features || company.subscription.features,
      limits: selectedPlan?.limits || company.subscription.limits
    };

    await Company.findByIdAndUpdate(user.company, {
      subscription: subscriptionData
    });

    logger.info(`Subscription updated: ${updatedSubscription.id} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscription: subscriptionData,
        stripeSubscription: updatedSubscription
      }
    });
  } catch (error) {
    logger.error('Update subscription error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelAtPeriodEnd:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/cancel', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const company = await Company.findById(user.company);
    if (!company.subscription?.stripeSubscriptionId) {
      throw new ValidationError('No active subscription found');
    }

    // Cancel Stripe subscription
    const cancelledSubscription = await paymentService.cancelSubscription(
      company.subscription.stripeSubscriptionId,
      cancelAtPeriodEnd
    );

    // Update company subscription status
    const subscriptionData = {
      ...company.subscription,
      status: cancelAtPeriodEnd ? 'cancelling' : 'cancelled',
      cancelledAt: new Date()
    };

    await Company.findByIdAndUpdate(user.company, {
      subscription: subscriptionData
    });

    logger.info(`Subscription cancelled: ${cancelledSubscription.id} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: subscriptionData,
        stripeSubscription: cancelledSubscription
      }
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/billing-portal:
 *   post:
 *     summary: Create billing portal session
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing portal session created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/billing-portal', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const company = await Company.findById(user.company);
    if (!company.stripeCustomerId) {
      throw new ValidationError('No Stripe customer found');
    }

    const returnUrl = `${process.env.CLIENT_URL}/company/settings`;
    const session = await paymentService.createBillingPortalSession(
      company.stripeCustomerId,
      returnUrl
    );

    res.json({
      success: true,
      message: 'Billing portal session created successfully',
      data: { url: session.url }
    });
  } catch (error) {
    logger.error('Create billing portal session error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/invoices:
 *   get:
 *     summary: Get subscription invoices
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/invoices', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const company = await Company.findById(user.company);
    if (!company.stripeCustomerId) {
      return res.json({
        success: true,
        message: 'No invoices found',
        data: { invoices: [], pagination: { currentPage: 1, totalPages: 0, totalInvoices: 0 } }
      });
    }

    // Mock invoice data - in production, this would come from Stripe
    const mockInvoices = [
      {
        id: 'inv_001',
        number: 'INV-2024-001',
        amount: 99.00,
        currency: 'usd',
        status: 'paid',
        dueDate: new Date('2024-01-15'),
        paidAt: new Date('2024-01-15'),
        items: [
          { description: 'Professional Plan - January 2024', amount: 99.00 }
        ]
      },
      {
        id: 'inv_002',
        number: 'INV-2024-002',
        amount: 99.00,
        currency: 'usd',
        status: 'paid',
        dueDate: new Date('2024-02-15'),
        paidAt: new Date('2024-02-15'),
        items: [
          { description: 'Professional Plan - February 2024', amount: 99.00 }
        ]
      }
    ];

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedInvoices = mockInvoices.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: {
        invoices: paginatedInvoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(mockInvoices.length / limit),
          totalInvoices: mockInvoices.length,
          hasNextPage: endIndex < mockInvoices.length,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/subscriptions/usage:
 *   get:
 *     summary: Get subscription usage
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/usage', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const company = await Company.findById(user.company);
    const subscription = company.subscription;

    if (!subscription) {
      return res.json({
        success: true,
        message: 'No subscription found',
        data: null
      });
    }

    // Get current usage
    const totalUsers = await User.countDocuments({ company: user.company });
    const activeUsers = await User.countDocuments({ 
      company: user.company, 
      isActive: true 
    });

    // Mock usage data
    const usage = {
      users: {
        current: totalUsers,
        limit: subscription.limits?.users || -1,
        percentage: subscription.limits?.users > 0 
          ? Math.round((totalUsers / subscription.limits.users) * 100) 
          : 0
      },
      assessments: {
        current: Math.floor(Math.random() * 200) + 50, // Mock data
        limit: subscription.limits?.assessments || -1,
        percentage: subscription.limits?.assessments > 0 
          ? Math.round(((Math.floor(Math.random() * 200) + 50) / subscription.limits.assessments) * 100) 
          : 0
      },
      storage: {
        current: Math.floor(Math.random() * 10) + 2, // Mock data in GB
        limit: subscription.limits?.storage || '10GB',
        percentage: Math.round(((Math.floor(Math.random() * 10) + 2) / 10) * 100)
      }
    };

    res.json({
      success: true,
      message: 'Usage data retrieved successfully',
      data: usage
    });
  } catch (error) {
    logger.error('Get usage error:', error);
    throw error;
  }
}));

module.exports = router; 