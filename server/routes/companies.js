const express = require('express');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');
const fileUploadService = require('../services/fileUploadService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/companies/profile:
 *   get:
 *     summary: Get company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('company');

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    res.json({
      success: true,
      message: 'Company profile retrieved successfully',
      data: user.company
    });
  } catch (error) {
    logger.error('Get company profile error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/profile:
 *   put:
 *     summary: Update company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *               size:
 *                 type: string
 *               website:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company profile updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { name, industry, size, website, description, location } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (industry) updateData.industry = industry;
    if (size) updateData.size = size;
    if (website) updateData.website = website;
    if (description) updateData.description = description;
    if (location) updateData.location = location;

    const updatedCompany = await Company.findByIdAndUpdate(
      user.company,
      updateData,
      { new: true }
    );

    logger.info(`Company profile updated: ${updatedCompany._id}`);

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    logger.error('Update company profile error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/logo:
 *   post:
 *     summary: Upload company logo
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Company logo uploaded successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/logo', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    // Use file upload middleware
    fileUploadService.getSingleUploadMiddleware('logo')(req, res, async (err) => {
      if (err) {
        return fileUploadService.handleUploadError(err, req, res);
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Logo file is required'
        });
      }

      try {
        // Upload logo to S3
        const uploadResult = await fileUploadService.uploadCompanyLogo(req.file, user.company);

        // Update company with new logo URL
        await Company.findByIdAndUpdate(user.company, {
          logo: uploadResult.url
        });

        res.json({
          success: true,
          message: 'Company logo uploaded successfully',
          data: { logoUrl: uploadResult.url }
        });
      } catch (uploadError) {
        logger.error('Logo upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Failed to upload logo'
        });
      }
    });
  } catch (error) {
    logger.error('Upload company logo error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/settings:
 *   get:
 *     summary: Get company settings
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/settings', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('company');

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    res.json({
      success: true,
      message: 'Company settings retrieved successfully',
      data: user.company.settings
    });
  } catch (error) {
    logger.error('Get company settings error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/settings:
 *   put:
 *     summary: Update company settings
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               features:
 *                 type: object
 *               integrations:
 *                 type: array
 *     responses:
 *       200:
 *         description: Company settings updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/settings', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { features, integrations } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    const updateData = {};
    if (features) updateData['settings.features'] = features;
    if (integrations) updateData['settings.integrations'] = integrations;

    const updatedCompany = await Company.findByIdAndUpdate(
      user.company,
      { $set: updateData },
      { new: true }
    );

    logger.info(`Company settings updated: ${updatedCompany._id}`);

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: updatedCompany.settings
    });
  } catch (error) {
    logger.error('Update company settings error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/users:
 *   get:
 *     summary: Get company users
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
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
 *         description: Company users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/users', authMiddleware, authorize(['admin', 'manager']), asyncHandler(async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    // Build query
    const query = { company: user.company };
    if (role) query.role = role;
    if (department) query.department = department;

    // Get users with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .populate('company', 'name industry')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      message: 'Company users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: skip + users.length < totalUsers,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get company users error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/users/{userId}:
 *   put:
 *     summary: Update user role
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               role:
 *                 type: string
 *               permissions:
 *                 type: array
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.put('/users/:userId', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;
    const adminUser = req.user;

    // Check if target user belongs to the same company
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.company.toString() !== adminUser.company.toString()) {
      throw new NotFoundError('User not found');
    }

    // Prevent admin from changing their own role
    if (userId === adminUser._id.toString()) {
      throw new ValidationError('Cannot change your own role');
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    logger.info(`User role updated: ${userId} by ${adminUser._id}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/analytics:
 *   get:
 *     summary: Get company analytics
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', authMiddleware, authorize(['admin', 'manager']), asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.company) {
      throw new NotFoundError('Company not found');
    }

    // Get company statistics
    const totalUsers = await User.countDocuments({ company: user.company });
    const activeUsers = await User.countDocuments({ 
      company: user.company, 
      isActive: true 
    });

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { company: user.company } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get users by department
    const usersByDepartment = await User.aggregate([
      { $match: { company: user.company, department: { $exists: true } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    // Get average skills level
    const usersWithSkills = await User.find({ 
      company: user.company, 
      skills: { $exists: true, $ne: [] } 
    });

    const averageSkillLevel = usersWithSkills.length > 0
      ? usersWithSkills.reduce((sum, user) => {
          const userAvg = user.skills.reduce((skillSum, skill) => skillSum + skill.level, 0) / user.skills.length;
          return sum + userAvg;
        }, 0) / usersWithSkills.length
      : 0;

    const analytics = {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByDepartment: usersByDepartment.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      skills: {
        averageSkillLevel: Math.round(averageSkillLevel * 100) / 100,
        usersWithSkills: usersWithSkills.length,
        totalSkillsAssessed: usersWithSkills.reduce((sum, user) => sum + user.skills.length, 0)
      }
    };

    res.json({
      success: true,
      message: 'Company analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    logger.error('Get company analytics error:', error);
    throw error;
  }
}));

/**
 * @swagger
 * /api/companies/invitations:
 *   post:
 *     summary: Invite user to company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       200:
 *         description: User invited successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/invitations', authMiddleware, authorize(['admin']), asyncHandler(async (req, res) => {
  try {
    const { email, firstName, lastName, role, department } = req.body;
    const adminUser = req.user;

    if (!email || !firstName || !lastName) {
      throw new ValidationError('Email, first name, and last name are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create invitation token
    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation (in production, this would be in a separate collection)
    const invitation = {
      email,
      firstName,
      lastName,
      role: role || 'user',
      department,
      company: adminUser.company,
      invitedBy: adminUser._id,
      token: invitationToken,
      expiresAt: invitationExpiry,
      status: 'pending'
    };

    // In production, save to Invitation collection
    // await Invitation.create(invitation);

    // Send invitation email
    // await emailService.sendInvitationEmail(invitation);

    logger.info(`User invited to company: ${email} by ${adminUser._id}`);

    res.json({
      success: true,
      message: 'User invited successfully',
      data: {
        email,
        invitationToken,
        expiresAt: invitationExpiry
      }
    });
  } catch (error) {
    logger.error('Invite user error:', error);
    throw error;
  }
}));

module.exports = router; 