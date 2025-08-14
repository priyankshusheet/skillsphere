const express = require('express');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/dashboard', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const companyId = req.user.company;

    // Get basic statistics
    const totalUsers = await User.countDocuments({ company: companyId });
    
    // Mock data for now - in production, this would come from actual skills and learning data
    const dashboardStats = {
      totalUsers,
      totalSkills: Math.floor(Math.random() * 500) + 100,
      averageSkillLevel: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
      skillsGap: Math.floor(Math.random() * 30) + 10, // 10% to 40%
      learningProgress: Math.floor(Math.random() * 40) + 30, // 30% to 70%
      recentActivity: [
        {
          id: '1',
          type: 'skill_assessment',
          description: 'completed skills assessment for',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: 'John Doe'
        },
        {
          id: '2',
          type: 'course_completion',
          description: 'completed course "Advanced JavaScript"',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: 'Jane Smith'
        },
        {
          id: '3',
          type: 'skill_gap_identified',
          description: 'identified skills gap in Machine Learning',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: 'Mike Johnson'
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/analytics/skills:
 *   get:
 *     summary: Get skills analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/skills', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // Mock skills analytics data
    const skillsAnalytics = {
      topSkills: [
        { name: 'JavaScript', count: 45, level: 3.8 },
        { name: 'Python', count: 38, level: 3.5 },
        { name: 'React', count: 32, level: 3.2 },
        { name: 'Node.js', count: 28, level: 3.0 },
        { name: 'SQL', count: 25, level: 3.6 }
      ],
      skillsGap: [
        { name: 'Machine Learning', gap: 0.8, priority: 'high' },
        { name: 'DevOps', gap: 0.6, priority: 'medium' },
        { name: 'Cloud Computing', gap: 0.5, priority: 'medium' },
        { name: 'Cybersecurity', gap: 0.4, priority: 'low' }
      ],
      skillTrends: [
        { month: 'Jan', averageLevel: 2.8 },
        { month: 'Feb', averageLevel: 3.0 },
        { month: 'Mar', averageLevel: 3.2 },
        { month: 'Apr', averageLevel: 3.4 },
        { month: 'May', averageLevel: 3.6 },
        { month: 'Jun', averageLevel: 3.8 }
      ]
    };

    res.json({
      success: true,
      data: skillsAnalytics
    });
  } catch (error) {
    logger.error('Error fetching skills analytics:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/analytics/learning:
 *   get:
 *     summary: Get learning analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/learning', authMiddleware, asyncHandler(async (req, res) => {
  try {
    // Mock learning analytics data
    const learningAnalytics = {
      courseCompletions: [
        { course: 'JavaScript Fundamentals', completions: 25, avgScore: 85 },
        { course: 'React Development', completions: 18, avgScore: 82 },
        { course: 'Python for Data Science', completions: 15, avgScore: 88 },
        { course: 'DevOps Basics', completions: 12, avgScore: 79 }
      ],
      learningProgress: {
        totalCourses: 50,
        completedCourses: 32,
        inProgressCourses: 8,
        notStartedCourses: 10
      },
      popularTopics: [
        { topic: 'Web Development', enrollments: 45 },
        { topic: 'Data Science', enrollments: 38 },
        { topic: 'DevOps', enrollments: 25 },
        { topic: 'Mobile Development', enrollments: 20 }
      ]
    };

    res.json({
      success: true,
      data: learningAnalytics
    });
  } catch (error) {
    logger.error('Error fetching learning analytics:', error);
    throw error;
  }
}));

module.exports = router; 