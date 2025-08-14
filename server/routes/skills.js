const express = require('express');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const User = require('../models/User');
const aiIntegrationService = require('../services/aiIntegrationService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/skills/assessment:
 *   post:
 *     summary: Start skills assessment
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     level:
 *                       type: string
 *                     experience:
 *                       type: number
 *     responses:
 *       200:
 *         description: Skills assessment completed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/assessment', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { skills } = req.body;
    const userId = req.user._id;

    if (!skills || !Array.isArray(skills)) {
      throw new ValidationError('Skills data is required and must be an array');
    }

    // Get user data for AI assessment
    const user = await User.findById(userId).populate('company');
    
    // Call AI service for skills assessment
    const assessmentResults = await aiIntegrationService.assessSkills(user, skills);

    // Update user's skills in database
    await User.findByIdAndUpdate(userId, {
      $set: { skills: assessmentResults.assessedSkills },
      $push: { 
        'skillsHistory': {
          assessmentDate: new Date(),
          skills: assessmentResults.assessedSkills,
          confidence: assessmentResults.confidence
        }
      }
    });

    logger.info(`Skills assessment completed for user: ${userId}`);

    res.json({
      success: true,
      message: 'Skills assessment completed successfully',
      data: {
        assessmentResults,
        recommendations: assessmentResults.recommendations,
        skillGaps: assessmentResults.skillGaps,
        nextSteps: assessmentResults.nextSteps
      }
    });
  } catch (error) {
    logger.error('Skills assessment error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/gap-analysis:
 *   post:
 *     summary: Analyze skill gaps
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetRole:
 *                 type: string
 *               targetSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Skill gap analysis completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/gap-analysis', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { targetRole, targetSkills } = req.body;
    const userId = req.user._id;

    if (!targetRole || !targetSkills) {
      throw new ValidationError('Target role and skills are required');
    }

    const user = await User.findById(userId);
    const userSkills = user.skills || [];

    // Call AI service for gap analysis
    const gapAnalysis = await aiIntegrationService.analyzeSkillGaps(
      userSkills,
      targetSkills,
      { role: targetRole, industry: user.company?.industry }
    );

    logger.info(`Skill gap analysis completed for user: ${userId}`);

    res.json({
      success: true,
      message: 'Skill gap analysis completed',
      data: {
        currentSkills: userSkills,
        targetSkills,
        gaps: gapAnalysis.gaps,
        recommendations: gapAnalysis.recommendations,
        estimatedTime: gapAnalysis.estimatedTime,
        priority: gapAnalysis.priority
      }
    });
  } catch (error) {
    logger.error('Skill gap analysis error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/recommendations:
 *   get:
 *     summary: Get learning recommendations
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Get user's skill gaps and preferences
    const skillGaps = user.skills?.filter(skill => skill.level < 3) || [];
    const preferences = user.preferences || {};

    // Call AI service for recommendations
    const recommendations = await aiIntegrationService.getLearningRecommendations(
      user,
      skillGaps,
      preferences
    );

    res.json({
      success: true,
      message: 'Learning recommendations retrieved successfully',
      data: recommendations
    });
  } catch (error) {
    logger.error('Learning recommendations error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/market-demand:
 *   post:
 *     summary: Analyze market demand for skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Market demand analysis completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/market-demand', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { skills, location } = req.body;
    const userId = req.user._id;

    if (!skills || !Array.isArray(skills)) {
      throw new ValidationError('Skills array is required');
    }

    const user = await User.findById(userId).populate('company');

    // Call AI service for market demand analysis
    const marketAnalysis = await aiIntegrationService.analyzeMarketDemand(
      skills,
      location || user.location?.city,
      user.company?.industry
    );

    res.json({
      success: true,
      message: 'Market demand analysis completed',
      data: marketAnalysis
    });
  } catch (error) {
    logger.error('Market demand analysis error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/validate:
 *   post:
 *     summary: Validate skills data
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Skills validation completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/validate', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills)) {
      throw new ValidationError('Skills data is required');
    }

    // Call AI service for skills validation
    const validationResults = await aiIntegrationService.validateSkills(skills);

    res.json({
      success: true,
      message: 'Skills validation completed',
      data: validationResults
    });
  } catch (error) {
    logger.error('Skills validation error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/trends:
 *   get:
 *     summary: Get skills trends
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated list of skills
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *         description: Time range for analysis (e.g., 1y, 6m)
 *     responses:
 *       200:
 *         description: Skills trends retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/trends', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { skills, timeRange = '1y' } = req.query;
    const userId = req.user._id;

    if (!skills) {
      throw new ValidationError('Skills parameter is required');
    }

    const skillsArray = skills.split(',').map(s => s.trim());
    const user = await User.findById(userId).populate('company');

    // Call AI service for trends analysis
    const trends = await aiIntegrationService.analyzeSkillsTrends(
      skillsArray,
      timeRange,
      user.location?.city || 'global'
    );

    res.json({
      success: true,
      message: 'Skills trends retrieved successfully',
      data: trends
    });
  } catch (error) {
    logger.error('Skills trends error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/salary-prediction:
 *   post:
 *     summary: Predict salary based on skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Salary prediction completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/salary-prediction', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { skills, experience, location } = req.body;
    const userId = req.user._id;

    if (!skills || !Array.isArray(skills)) {
      throw new ValidationError('Skills array is required');
    }

    const user = await User.findById(userId).populate('company');

    // Call AI service for salary prediction
    const salaryPrediction = await aiIntegrationService.predictSalary(
      skills,
      experience || user.experience || 0,
      location || user.location?.city,
      user.company?.industry
    );

    res.json({
      success: true,
      message: 'Salary prediction completed',
      data: salaryPrediction
    });
  } catch (error) {
    logger.error('Salary prediction error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/team-analysis:
 *   post:
 *     summary: Analyze team skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamMembers:
 *                 type: array
 *                 items:
 *                   type: object
 *               projectRequirements:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Team skills analysis completed
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/team-analysis', authMiddleware, authorize(['admin', 'manager']), asyncHandler(async (req, res) => {
  try {
    const { teamMembers, projectRequirements } = req.body;
    const userId = req.user._id;

    if (!teamMembers || !projectRequirements) {
      throw new ValidationError('Team members and project requirements are required');
    }

    // Call AI service for team analysis
    const teamAnalysis = await aiIntegrationService.analyzeTeamSkills(
      teamMembers,
      projectRequirements
    );

    res.json({
      success: true,
      message: 'Team skills analysis completed',
      data: teamAnalysis
    });
  } catch (error) {
    logger.error('Team skills analysis error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/user/{userId}:
 *   get:
 *     summary: Get user skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User skills retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Check if user can access this data
    if (requestingUser._id.toString() !== userId && 
        requestingUser.role !== 'admin' && 
        requestingUser.role !== 'manager') {
      throw new AuthenticationError('Access denied');
    }

    const user = await User.findById(userId).select('skills skillsHistory');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      message: 'User skills retrieved successfully',
      data: {
        skills: user.skills || [],
        skillsHistory: user.skillsHistory || [],
        lastAssessment: user.skillsHistory?.[user.skillsHistory.length - 1]?.assessmentDate
      }
    });
  } catch (error) {
    logger.error('Get user skills error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/skills/update:
 *   put:
 *     summary: Update user skills
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Skills updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/update', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { skills } = req.body;
    const userId = req.user._id;

    if (!skills || !Array.isArray(skills)) {
      throw new ValidationError('Skills array is required');
    }

    // Update user skills
    await User.findByIdAndUpdate(userId, {
      $set: { skills },
      $push: {
        'skillsHistory': {
          assessmentDate: new Date(),
          skills,
          source: 'manual_update'
        }
      }
    });

    logger.info(`Skills updated for user: ${userId}`);

    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: { skills }
    });
  } catch (error) {
    logger.error('Update skills error:', error);
    throw error;
  }
}));

module.exports = router; 