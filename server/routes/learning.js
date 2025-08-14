const express = require('express');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const User = require('../models/User');
const aiIntegrationService = require('../services/aiIntegrationService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/learning/recommendations:
 *   get:
 *     summary: Get personalized learning recommendations
 *     tags: [Learning]
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

    // Get user's current skills and gaps
    const currentSkills = user.skills || [];
    const skillGaps = currentSkills.filter(skill => skill.level < 3);
    const preferences = user.preferences || {};

    // Call AI service for personalized recommendations
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
 * /api/learning/paths:
 *   post:
 *     summary: Create personalized learning path
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               timeConstraint:
 *                 type: string
 *               learningStyle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Learning path created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/paths', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { targetSkills, timeConstraint, learningStyle } = req.body;
    const userId = req.user._id;

    if (!targetSkills || !Array.isArray(targetSkills)) {
      throw new ValidationError('Target skills array is required');
    }

    const user = await User.findById(userId);
    const currentSkills = user.skills || [];

    // Call AI service to optimize learning path
    const learningPath = await aiIntegrationService.optimizeLearningPath(
      user,
      currentSkills,
      targetSkills,
      {
        timeConstraint: timeConstraint || 'flexible',
        learningStyle: learningStyle || 'mixed',
        budget: user.preferences?.budget || 'free'
      }
    );

    // Save learning path to user profile
    await User.findByIdAndUpdate(userId, {
      $push: {
        'learningPaths': {
          pathId: learningPath.pathId,
          targetSkills,
          estimatedDuration: learningPath.estimatedDuration,
          courses: learningPath.courses,
          createdAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Learning path created successfully',
      data: learningPath
    });
  } catch (error) {
    logger.error('Create learning path error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/learning/courses:
 *   get:
 *     summary: Get available courses
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/courses', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { category, level, provider, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Mock course data - in production, this would come from a database
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Advanced JavaScript Development',
        description: 'Master modern JavaScript concepts and frameworks',
        category: 'Programming',
        level: 'Advanced',
        provider: 'Coursera',
        duration: '8 weeks',
        rating: 4.8,
        price: 49.99,
        skills: ['JavaScript', 'React', 'Node.js'],
        thumbnail: 'https://example.com/js-course.jpg'
      },
      {
        id: 'course-2',
        title: 'Data Science Fundamentals',
        description: 'Learn the basics of data science and machine learning',
        category: 'Data Science',
        level: 'Intermediate',
        provider: 'edX',
        duration: '12 weeks',
        rating: 4.6,
        price: 79.99,
        skills: ['Python', 'Statistics', 'Machine Learning'],
        thumbnail: 'https://example.com/ds-course.jpg'
      },
      {
        id: 'course-3',
        title: 'Leadership and Management',
        description: 'Develop essential leadership and management skills',
        category: 'Business',
        level: 'Beginner',
        provider: 'LinkedIn Learning',
        duration: '6 weeks',
        rating: 4.7,
        price: 29.99,
        skills: ['Leadership', 'Management', 'Communication'],
        thumbnail: 'https://example.com/leadership-course.jpg'
      }
    ];

    // Filter courses based on query parameters
    let filteredCourses = mockCourses;

    if (category) {
      filteredCourses = filteredCourses.filter(course => 
        course.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (level) {
      filteredCourses = filteredCourses.filter(course => 
        course.level.toLowerCase() === level.toLowerCase()
      );
    }

    if (provider) {
      filteredCourses = filteredCourses.filter(course => 
        course.provider.toLowerCase().includes(provider.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'Courses retrieved successfully',
      data: {
        courses: paginatedCourses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredCourses.length / limit),
          totalCourses: filteredCourses.length,
          hasNextPage: endIndex < filteredCourses.length,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get courses error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/learning/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully enrolled in course
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/enroll', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      throw new ValidationError('Course ID is required');
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    const existingEnrollment = user.learningProgress?.find(
      enrollment => enrollment.courseId === courseId
    );

    if (existingEnrollment) {
      throw new ValidationError('Already enrolled in this course');
    }

    // Add enrollment to user profile
    await User.findByIdAndUpdate(userId, {
      $push: {
        'learningProgress': {
          courseId,
          enrolledAt: new Date(),
          progress: 0,
          status: 'enrolled'
        }
      }
    });

    logger.info(`User ${userId} enrolled in course ${courseId}`);

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: { courseId, enrolledAt: new Date() }
    });
  } catch (error) {
    logger.error('Course enrollment error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/learning/progress:
 *   put:
 *     summary: Update course progress
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: string
 *               progress:
 *                 type: number
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/progress', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { courseId, progress, completed } = req.body;
    const userId = req.user._id;

    if (!courseId || progress === undefined) {
      throw new ValidationError('Course ID and progress are required');
    }

    if (progress < 0 || progress > 100) {
      throw new ValidationError('Progress must be between 0 and 100');
    }

    // Update user's learning progress
    const updateData = {
      $set: {
        'learningProgress.$.progress': progress,
        'learningProgress.$.lastUpdated': new Date()
      }
    };

    if (completed) {
      updateData.$set['learningProgress.$.completedAt'] = new Date();
      updateData.$set['learningProgress.$.status'] = 'completed';
    }

    const result = await User.updateOne(
      {
        _id: userId,
        'learningProgress.courseId': courseId
      },
      updateData
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError('Course enrollment not found');
    }

    logger.info(`Progress updated for user ${userId}, course ${courseId}: ${progress}%`);

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: { courseId, progress, completed }
    });
  } catch (error) {
    logger.error('Update progress error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/learning/certificates:
 *   get:
 *     summary: Get user certificates
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/certificates', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Get completed courses
    const completedCourses = user.learningProgress?.filter(
      enrollment => enrollment.status === 'completed'
    ) || [];

    // Mock certificate data
    const certificates = completedCourses.map(enrollment => ({
      id: `cert-${enrollment.courseId}`,
      courseId: enrollment.courseId,
      courseTitle: `Course ${enrollment.courseId}`, // In production, get from course database
      issuedAt: enrollment.completedAt,
      certificateUrl: `https://example.com/certificates/${enrollment.courseId}`,
      skills: ['Skill 1', 'Skill 2'], // In production, get from course data
      provider: 'SkillSphere'
    }));

    res.json({
      success: true,
      message: 'Certificates retrieved successfully',
      data: certificates
    });
  } catch (error) {
    logger.error('Get certificates error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/learning/analytics:
 *   get:
 *     summary: Get learning analytics
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const learningProgress = user.learningProgress || [];
    
    // Calculate analytics
    const totalEnrolled = learningProgress.length;
    const completedCourses = learningProgress.filter(course => course.status === 'completed').length;
    const inProgressCourses = learningProgress.filter(course => course.status === 'enrolled').length;
    const averageProgress = learningProgress.length > 0 
      ? learningProgress.reduce((sum, course) => sum + course.progress, 0) / learningProgress.length 
      : 0;

    // Time spent learning (mock data)
    const totalHours = learningProgress.reduce((sum, course) => sum + (course.progress * 0.1), 0);

    // Skills gained
    const skillsGained = learningProgress
      .filter(course => course.status === 'completed')
      .flatMap(course => course.skills || []);

    const analytics = {
      overview: {
        totalEnrolled,
        completedCourses,
        inProgressCourses,
        completionRate: totalEnrolled > 0 ? (completedCourses / totalEnrolled) * 100 : 0,
        averageProgress: Math.round(averageProgress * 100) / 100
      },
      timeTracking: {
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerWeek: Math.round((totalHours / 12) * 100) / 100, // Assuming 12 weeks
        longestStreak: 7 // Mock data
      },
      skills: {
        skillsGained: [...new Set(skillsGained)],
        totalSkillsGained: skillsGained.length
      },
      recentActivity: learningProgress
        .sort((a, b) => new Date(b.lastUpdated || b.enrolledAt) - new Date(a.lastUpdated || a.enrolledAt))
        .slice(0, 5)
    };

    res.json({
      success: true,
      message: 'Learning analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    logger.error('Get learning analytics error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/learning/paths/{pathId}:
 *   get:
 *     summary: Get learning path details
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pathId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Learning path details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Learning path not found
 */
router.get('/paths/:pathId', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { pathId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const learningPath = user.learningPaths?.find(path => path.pathId === pathId);

    if (!learningPath) {
      throw new NotFoundError('Learning path not found');
    }

    res.json({
      success: true,
      message: 'Learning path details retrieved successfully',
      data: learningPath
    });
  } catch (error) {
    logger.error('Get learning path error:', error);
    throw error;
  }
}));

module.exports = router; 