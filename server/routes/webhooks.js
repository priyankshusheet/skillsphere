const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/stripe', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    await paymentService.handleWebhookEvent(event);

    logger.info(`Stripe webhook processed: ${event.type}`);
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

/**
 * @swagger
 * /api/webhooks/linkedin:
 *   post:
 *     summary: Handle LinkedIn Learning webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/linkedin', asyncHandler(async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'course.completed':
        await handleLinkedInCourseCompleted(data);
        break;
      case 'learning.progress':
        await handleLinkedInLearningProgress(data);
        break;
      case 'certificate.issued':
        await handleLinkedInCertificateIssued(data);
        break;
      default:
        logger.info(`Unhandled LinkedIn webhook event: ${event}`);
    }

    logger.info(`LinkedIn webhook processed: ${event}`);
    res.json({ received: true });
  } catch (error) {
    logger.error('LinkedIn webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

/**
 * @swagger
 * /api/webhooks/workday:
 *   post:
 *     summary: Handle Workday webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/workday', asyncHandler(async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'employee.created':
        await handleWorkdayEmployeeCreated(data);
        break;
      case 'employee.updated':
        await handleWorkdayEmployeeUpdated(data);
        break;
      case 'employee.terminated':
        await handleWorkdayEmployeeTerminated(data);
        break;
      case 'performance.review':
        await handleWorkdayPerformanceReview(data);
        break;
      default:
        logger.info(`Unhandled Workday webhook event: ${event}`);
    }

    logger.info(`Workday webhook processed: ${event}`);
    res.json({ received: true });
  } catch (error) {
    logger.error('Workday webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

/**
 * @swagger
 * /api/webhooks/slack:
 *   post:
 *     summary: Handle Slack webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/slack', asyncHandler(async (req, res) => {
  try {
    const { type, challenge, event } = req.body;

    // Handle Slack URL verification
    if (type === 'url_verification') {
      return res.json({ challenge });
    }

    // Handle Slack events
    if (type === 'event_callback') {
      switch (event.type) {
        case 'message':
          await handleSlackMessage(event);
          break;
        case 'reaction_added':
          await handleSlackReaction(event);
          break;
        case 'user_change':
          await handleSlackUserChange(event);
          break;
        default:
          logger.info(`Unhandled Slack event: ${event.type}`);
      }
    }

    logger.info(`Slack webhook processed: ${event?.type || type}`);
    res.json({ received: true });
  } catch (error) {
    logger.error('Slack webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

/**
 * @swagger
 * /api/webhooks/email-events:
 *   post:
 *     summary: Handle email service webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/email-events', asyncHandler(async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'email.delivered':
        await handleEmailDelivered(data);
        break;
      case 'email.opened':
        await handleEmailOpened(data);
        break;
      case 'email.clicked':
        await handleEmailClicked(data);
        break;
      case 'email.bounced':
        await handleEmailBounced(data);
        break;
      case 'email.unsubscribed':
        await handleEmailUnsubscribed(data);
        break;
      default:
        logger.info(`Unhandled email webhook event: ${event}`);
    }

    logger.info(`Email webhook processed: ${event}`);
    res.json({ received: true });
  } catch (error) {
    logger.error('Email webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

/**
 * @swagger
 * /api/webhooks/ai-service:
 *   post:
 *     summary: Handle AI service webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/ai-service', asyncHandler(async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'assessment.completed':
        await handleAIAssessmentCompleted(data);
        break;
      case 'model.updated':
        await handleAIModelUpdated(data);
        break;
      case 'training.completed':
        await handleAITrainingCompleted(data);
        break;
      case 'error.occurred':
        await handleAIError(data);
        break;
      default:
        logger.info(`Unhandled AI service webhook event: ${event}`);
    }

    logger.info(`AI service webhook processed: ${event}`);
    res.json({ received: true });
  } catch (error) {
    logger.error('AI service webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

// Webhook event handlers
async function handleLinkedInCourseCompleted(data) {
  try {
    const { userId, courseId, courseTitle, completedAt, certificateUrl } = data;

    // Update user's learning progress
    const User = require('../models/User');
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          'learningProgress': {
            courseId,
            courseTitle,
            completedAt: new Date(completedAt),
            certificateUrl,
            source: 'linkedin-learning'
          }
        }
      }
    );

    // Send completion notification
    const user = await User.findById(userId);
    if (user) {
      await emailService.sendCourseCompletionEmail(user, {
        courseTitle,
        completedAt: new Date(completedAt),
        certificateUrl
      });
    }

    logger.info(`LinkedIn course completed: ${courseId} by user ${userId}`);
  } catch (error) {
    logger.error('Handle LinkedIn course completed error:', error);
  }
}

async function handleLinkedInLearningProgress(data) {
  try {
    const { userId, courseId, progress, lastActivity } = data;

    // Update user's learning progress
    const User = require('../models/User');
    await User.updateOne(
      {
        _id: userId,
        'learningProgress.courseId': courseId
      },
      {
        $set: {
          'learningProgress.$.progress': progress,
          'learningProgress.$.lastActivity': new Date(lastActivity)
        }
      }
    );

    logger.info(`LinkedIn learning progress updated: ${courseId} by user ${userId}`);
  } catch (error) {
    logger.error('Handle LinkedIn learning progress error:', error);
  }
}

async function handleLinkedInCertificateIssued(data) {
  try {
    const { userId, courseId, certificateUrl, issuedAt } = data;

    // Update user's certificates
    const User = require('../models/User');
    await User.updateOne(
      {
        _id: userId,
        'learningProgress.courseId': courseId
      },
      {
        $set: {
          'learningProgress.$.certificateUrl': certificateUrl,
          'learningProgress.$.certificateIssuedAt': new Date(issuedAt)
        }
      }
    );

    logger.info(`LinkedIn certificate issued: ${courseId} for user ${userId}`);
  } catch (error) {
    logger.error('Handle LinkedIn certificate issued error:', error);
  }
}

async function handleWorkdayEmployeeCreated(data) {
  try {
    const { employeeId, firstName, lastName, email, department, title, hireDate } = data;

    // Create new user account
    const User = require('../models/User');
    const Company = require('../models/Company');

    // Find company by Workday integration
    const company = await Company.findOne({
      'settings.integrations.id': 'workday'
    });

    if (company) {
      const newUser = new User({
        firstName,
        lastName,
        email,
        department,
        title,
        hireDate: new Date(hireDate),
        company: company._id,
        employeeId,
        source: 'workday'
      });

      await newUser.save();

      // Send welcome email
      await emailService.sendWelcomeEmail(newUser);

      logger.info(`Workday employee created: ${employeeId}`);
    }
  } catch (error) {
    logger.error('Handle Workday employee created error:', error);
  }
}

async function handleWorkdayEmployeeUpdated(data) {
  try {
    const { employeeId, firstName, lastName, email, department, title } = data;

    // Update user account
    const User = require('../models/User');
    await User.updateOne(
      { employeeId },
      {
        firstName,
        lastName,
        email,
        department,
        title,
        updatedAt: new Date()
      }
    );

    logger.info(`Workday employee updated: ${employeeId}`);
  } catch (error) {
    logger.error('Handle Workday employee updated error:', error);
  }
}

async function handleWorkdayEmployeeTerminated(data) {
  try {
    const { employeeId, terminationDate } = data;

    // Deactivate user account
    const User = require('../models/User');
    await User.updateOne(
      { employeeId },
      {
        isActive: false,
        terminatedAt: new Date(terminationDate),
        updatedAt: new Date()
      }
    );

    logger.info(`Workday employee terminated: ${employeeId}`);
  } catch (error) {
    logger.error('Handle Workday employee terminated error:', error);
  }
}

async function handleWorkdayPerformanceReview(data) {
  try {
    const { employeeId, reviewData, reviewDate } = data;

    // Store performance review data
    const User = require('../models/User');
    await User.updateOne(
      { employeeId },
      {
        $push: {
          'performanceReviews': {
            reviewData,
            reviewDate: new Date(reviewDate),
            source: 'workday'
          }
        }
      }
    );

    logger.info(`Workday performance review: ${employeeId}`);
  } catch (error) {
    logger.error('Handle Workday performance review error:', error);
  }
}

async function handleSlackMessage(event) {
  try {
    const { user, text, channel, ts } = event;

    // Process Slack message for skills mentions
    const skillsKeywords = ['skill', 'learning', 'training', 'course', 'certification'];
    const hasSkillsContent = skillsKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (hasSkillsContent) {
      // Log skills-related conversation
      logger.info(`Skills-related Slack message: ${user} in ${channel}`);
      
      // Could trigger skills assessment or learning recommendations
    }
  } catch (error) {
    logger.error('Handle Slack message error:', error);
  }
}

async function handleSlackReaction(event) {
  try {
    const { user, reaction, item } = event;

    // Handle reactions to skills-related messages
    if (reaction === 'white_check_mark' || reaction === 'heavy_check_mark') {
      logger.info(`Positive reaction to skills content: ${user}`);
    }
  } catch (error) {
    logger.error('Handle Slack reaction error:', error);
  }
}

async function handleSlackUserChange(event) {
  try {
    const { user } = event;

    // Update user profile from Slack
    const User = require('../models/User');
    await User.updateOne(
      { 'integrations.slack.userId': user.id },
      {
        $set: {
          'integrations.slack.profile': user.profile,
          updatedAt: new Date()
        }
      }
    );

    logger.info(`Slack user profile updated: ${user.id}`);
  } catch (error) {
    logger.error('Handle Slack user change error:', error);
  }
}

async function handleEmailDelivered(data) {
  try {
    const { messageId, recipient, deliveredAt } = data;
    logger.info(`Email delivered: ${messageId} to ${recipient}`);
  } catch (error) {
    logger.error('Handle email delivered error:', error);
  }
}

async function handleEmailOpened(data) {
  try {
    const { messageId, recipient, openedAt } = data;
    logger.info(`Email opened: ${messageId} by ${recipient}`);
  } catch (error) {
    logger.error('Handle email opened error:', error);
  }
}

async function handleEmailClicked(data) {
  try {
    const { messageId, recipient, clickedAt, url } = data;
    logger.info(`Email clicked: ${messageId} by ${recipient} - ${url}`);
  } catch (error) {
    logger.error('Handle email clicked error:', error);
  }
}

async function handleEmailBounced(data) {
  try {
    const { messageId, recipient, bounceType, bounceReason } = data;
    logger.warn(`Email bounced: ${messageId} to ${recipient} - ${bounceType}: ${bounceReason}`);
  } catch (error) {
    logger.error('Handle email bounced error:', error);
  }
}

async function handleEmailUnsubscribed(data) {
  try {
    const { messageId, recipient, unsubscribedAt } = data;
    
    // Update user preferences
    const User = require('../models/User');
    await User.updateOne(
      { email: recipient },
      {
        $set: {
          'preferences.emailNotifications': false,
          updatedAt: new Date()
        }
      }
    );

    logger.info(`Email unsubscribed: ${recipient}`);
  } catch (error) {
    logger.error('Handle email unsubscribed error:', error);
  }
}

async function handleAIAssessmentCompleted(data) {
  try {
    const { userId, assessmentId, results, completedAt } = data;

    // Update user's assessment results
    const User = require('../models/User');
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          'skillsHistory': {
            assessmentId,
            assessmentDate: new Date(completedAt),
            skills: results.skills,
            confidence: results.confidence,
            source: 'ai-assessment'
          }
        }
      }
    );

    // Send assessment results email
    const user = await User.findById(userId);
    if (user) {
      await emailService.sendSkillsAssessmentEmail(user, results);
    }

    logger.info(`AI assessment completed: ${assessmentId} for user ${userId}`);
  } catch (error) {
    logger.error('Handle AI assessment completed error:', error);
  }
}

async function handleAIModelUpdated(data) {
  try {
    const { modelId, version, updatedAt, performance } = data;
    logger.info(`AI model updated: ${modelId} v${version}`);
  } catch (error) {
    logger.error('Handle AI model updated error:', error);
  }
}

async function handleAITrainingCompleted(data) {
  try {
    const { modelId, trainingMetrics, completedAt } = data;
    logger.info(`AI training completed: ${modelId}`);
  } catch (error) {
    logger.error('Handle AI training completed error:', error);
  }
}

async function handleAIError(data) {
  try {
    const { error, context, timestamp } = data;
    logger.error(`AI service error: ${error}`, { context, timestamp });
  } catch (error) {
    logger.error('Handle AI error error:', error);
  }
}

module.exports = router; 