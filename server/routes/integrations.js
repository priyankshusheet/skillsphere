const express = require('express');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/integrations/available:
 *   get:
 *     summary: Get available integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available integrations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/available', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // Mock available integrations
    const availableIntegrations = [
      {
        id: 'linkedin-learning',
        name: 'LinkedIn Learning',
        description: 'Access to LinkedIn Learning courses and content',
        category: 'Learning',
        icon: 'linkedin',
        status: 'available',
        features: ['Course Access', 'Progress Sync', 'Certificates'],
        pricing: 'Included in subscription'
      },
      {
        id: 'workday',
        name: 'Workday',
        description: 'HRIS integration for employee data and performance',
        category: 'HRIS',
        icon: 'workday',
        status: 'available',
        features: ['Employee Data', 'Performance Reviews', 'Org Structure'],
        pricing: 'Enterprise only'
      },
      {
        id: 'bamboo-hr',
        name: 'BambooHR',
        description: 'HR software integration for employee management',
        category: 'HRIS',
        icon: 'bamboo',
        status: 'available',
        features: ['Employee Records', 'Time Tracking', 'Benefits'],
        pricing: 'Enterprise only'
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team communication and collaboration',
        category: 'Communication',
        icon: 'slack',
        status: 'available',
        features: ['Notifications', 'Team Channels', 'Bot Integration'],
        pricing: 'Free tier available'
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Microsoft Teams integration for collaboration',
        category: 'Communication',
        icon: 'teams',
        status: 'available',
        features: ['Chat Integration', 'Meeting Scheduling', 'File Sharing'],
        pricing: 'Enterprise only'
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'CRM integration for sales team management',
        category: 'CRM',
        icon: 'salesforce',
        status: 'available',
        features: ['Lead Management', 'Opportunity Tracking', 'Reports'],
        pricing: 'Enterprise only'
      }
    ];

    res.json({
      success: true,
      message: 'Available integrations retrieved successfully',
      data: availableIntegrations
    });
  } catch (error) {
    logger.error('Get available integrations error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/integrations/connected:
 *   get:
 *     summary: Get connected integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connected integrations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/connected', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('company');

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const connectedIntegrations = user.company.settings?.integrations || [];

    res.json({
      success: true,
      message: 'Connected integrations retrieved successfully',
      data: connectedIntegrations
    });
  } catch (error) {
    logger.error('Get connected integrations error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/integrations/connect:
 *   post:
 *     summary: Connect an integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               integrationId:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Integration connected successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/connect', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { integrationId, config } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    if (!integrationId) {
      throw new ValidationError('Integration ID is required');
    }

    // Validate integration configuration
    const validationResult = await validateIntegrationConfig(integrationId, config);
    if (!validationResult.valid) {
      throw new ValidationError(validationResult.error);
    }

    // Test connection
    const connectionTest = await testIntegrationConnection(integrationId, config);
    if (!connectionTest.success) {
      throw new ValidationError(`Connection failed: ${connectionTest.error}`);
    }

    // Add integration to company settings
    const integration = {
      id: integrationId,
      name: getIntegrationName(integrationId),
      connectedAt: new Date(),
      config: config,
      status: 'active',
      lastSync: new Date()
    };

    await Company.findByIdAndUpdate(user.company, {
      $push: { 'settings.integrations': integration }
    });

    logger.info(`Integration connected: ${integrationId} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Integration connected successfully',
      data: integration
    });
  } catch (error) {
    logger.error('Connect integration error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/integrations/{integrationId}/disconnect:
 *   post:
 *     summary: Disconnect an integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Integration not found
 */
router.post('/:integrationId/disconnect', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    // Remove integration from company settings
    const result = await Company.findByIdAndUpdate(user.company, {
      $pull: { 'settings.integrations': { id: integrationId } }
    });

    if (!result) {
      throw new NotFoundError('Integration not found');
    }

    logger.info(`Integration disconnected: ${integrationId} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Integration disconnected successfully'
    });
  } catch (error) {
    logger.error('Disconnect integration error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/integrations/{integrationId}/sync:
 *   post:
 *     summary: Sync integration data
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration data synced successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Integration not found
 */
router.post('/:integrationId/sync', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    // Get integration configuration
    const company = await Company.findById(user.company);
    const integration = company.settings?.integrations?.find(i => i.id === integrationId);

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    // Perform data sync
    const syncResult = await syncIntegrationData(integrationId, integration.config, user.company);

    // Update last sync time
    await Company.findByIdAndUpdate(user.company, {
      $set: { 'settings.integrations.$[integration].lastSync': new Date() }
    }, {
      arrayFilters: [{ 'integration.id': integrationId }]
    });

    logger.info(`Integration synced: ${integrationId} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Integration data synced successfully',
      data: syncResult
    });
  } catch (error) {
    logger.error('Sync integration error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/integrations/{integrationId}/status:
 *   get:
 *     summary: Get integration status
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Integration not found
 */
router.get('/:integrationId/status', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const company = await Company.findById(user.company);
    const integration = company.settings?.integrations?.find(i => i.id === integrationId);

    if (!integration) {
      throw new NotFoundError('Integration not found');
    }

    // Check integration health
    const healthStatus = await checkIntegrationHealth(integrationId, integration.config);

    const status = {
      id: integrationId,
      name: integration.name,
      status: integration.status,
      connectedAt: integration.connectedAt,
      lastSync: integration.lastSync,
      health: healthStatus,
      config: {
        ...integration.config,
        // Hide sensitive information
        apiKey: integration.config.apiKey ? '***' : undefined,
        secret: integration.config.secret ? '***' : undefined
      }
    };

    res.json({
      success: true,
      message: 'Integration status retrieved successfully',
      data: status
    });
  } catch (error) {
    logger.error('Get integration status error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/integrations/{integrationId}/config:
 *   put:
 *     summary: Update integration configuration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Integration configuration updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/:integrationId/config', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { config } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    if (!config) {
      throw new ValidationError('Configuration is required');
    }

    // Validate new configuration
    const validationResult = await validateIntegrationConfig(integrationId, config);
    if (!validationResult.valid) {
      throw new ValidationError(validationResult.error);
    }

    // Test new configuration
    const connectionTest = await testIntegrationConnection(integrationId, config);
    if (!connectionTest.success) {
      throw new ValidationError(`Connection failed: ${connectionTest.error}`);
    }

    // Update integration configuration
    await Company.findByIdAndUpdate(user.company, {
      $set: { 'settings.integrations.$[integration].config': config }
    }, {
      arrayFilters: [{ 'integration.id': integrationId }]
    });

    logger.info(`Integration config updated: ${integrationId} for company ${user.company}`);

    res.json({
      success: true,
      message: 'Integration configuration updated successfully'
    });
  } catch (error) {
    logger.error('Update integration config error:', error);
    throw error;
  }
}));

// Helper functions
async function validateIntegrationConfig(integrationId, config) {
  // Mock validation - in production, this would validate against integration-specific schemas
  const requiredFields = {
    'linkedin-learning': ['apiKey', 'apiSecret'],
    'workday': ['tenant', 'username', 'password'],
    'bamboo-hr': ['subdomain', 'apiKey'],
    'slack': ['botToken', 'signingSecret'],
    'microsoft-teams': ['clientId', 'clientSecret', 'tenantId'],
    'salesforce': ['clientId', 'clientSecret', 'username', 'password']
  };

  const fields = requiredFields[integrationId];
  if (!fields) {
    return { valid: false, error: 'Unknown integration' };
  }

  for (const field of fields) {
    if (!config[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  return { valid: true };
}

async function testIntegrationConnection(integrationId, config) {
  // Mock connection test - in production, this would actually test the connection
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success/failure based on integration ID
    const successRate = {
      'linkedin-learning': 0.9,
      'workday': 0.8,
      'bamboo-hr': 0.85,
      'slack': 0.95,
      'microsoft-teams': 0.9,
      'salesforce': 0.85
    };

    const success = Math.random() < (successRate[integrationId] || 0.5);
    
    return {
      success,
      error: success ? null : 'Connection timeout'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function syncIntegrationData(integrationId, config, companyId) {
  // Mock data sync - in production, this would sync actual data
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const syncResults = {
      'linkedin-learning': {
        coursesSynced: Math.floor(Math.random() * 100) + 50,
        progressUpdated: Math.floor(Math.random() * 200) + 100,
        certificatesSynced: Math.floor(Math.random() * 20) + 10
      },
      'workday': {
        employeesSynced: Math.floor(Math.random() * 500) + 200,
        performanceDataSynced: Math.floor(Math.random() * 1000) + 500,
        orgStructureUpdated: true
      },
      'bamboo-hr': {
        employeesSynced: Math.floor(Math.random() * 300) + 150,
        timeTrackingSynced: Math.floor(Math.random() * 1000) + 500,
        benefitsSynced: Math.floor(Math.random() * 50) + 25
      }
    };

    return syncResults[integrationId] || { message: 'Sync completed' };
  } catch (error) {
    throw new Error(`Sync failed: ${error.message}`);
  }
}

async function checkIntegrationHealth(integrationId, config) {
  // Mock health check - in production, this would check actual API endpoints
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const healthStatus = {
      status: 'healthy',
      responseTime: Math.floor(Math.random() * 1000) + 100,
      lastChecked: new Date(),
      errors: []
    };

    // Simulate occasional issues
    if (Math.random() < 0.1) {
      healthStatus.status = 'degraded';
      healthStatus.errors.push('High response time');
    }

    return healthStatus;
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: null,
      lastChecked: new Date(),
      errors: [error.message]
    };
  }
}

function getIntegrationName(integrationId) {
  const names = {
    'linkedin-learning': 'LinkedIn Learning',
    'workday': 'Workday',
    'bamboo-hr': 'BambooHR',
    'slack': 'Slack',
    'microsoft-teams': 'Microsoft Teams',
    'salesforce': 'Salesforce'
  };
  
  return names[integrationId] || integrationId;
}

module.exports = router; 