const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const { asyncHandler, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { authMiddleware, authorize, authorizeSelfOrAdmin, authorizeCompany } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only image files are allowed'), false);
    }
  },
});

// Validation schemas
const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  title: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional(),
  employeeId: Joi.string().optional(),
  role: Joi.string().valid('employee', 'manager', 'admin').default('employee'),
  manager: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  title: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  location: Joi.object({
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    timezone: Joi.string().optional(),
  }).optional(),
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    weeklyReports: Joi.boolean().optional(),
    skillAssessments: Joi.boolean().optional(),
    learningRecommendations: Joi.boolean().optional(),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'zh', 'ja').optional(),
    timezone: Joi.string().optional(),
  }).optional(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  title: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  location: Joi.object({
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    timezone: Joi.string().optional(),
  }).optional(),
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    weeklyReports: Joi.boolean().optional(),
    skillAssessments: Joi.boolean().optional(),
    learningRecommendations: Joi.boolean().optional(),
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'zh', 'ja').optional(),
    timezone: Joi.string().optional(),
  }).optional(),
});

const bulkUpdateSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required(),
  updates: Joi.object({
    role: Joi.string().valid('employee', 'manager', 'admin').optional(),
    department: Joi.string().max(100).optional(),
    manager: Joi.string().optional(),
    permissions: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional(),
  }).required(),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', authMiddleware, authorize('admin', 'manager'), authorizeCompany, asyncHandler(async (req, res) => {
  const { user } = req;
  const {
    page = 1,
    limit = 20,
    search,
    department,
    role,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build query
  const query = { company: user.company };
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ];
  }

  if (department) query.department = department;
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('manager', 'firstName lastName email')
      .populate('company', 'name industry')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:id', authMiddleware, authorizeSelfOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  // Determine which user to fetch
  const userId = id === 'me' ? user._id : id;

  const foundUser = await User.findById(userId)
    .select('-password')
    .populate('manager', 'firstName lastName email title')
    .populate('company', 'name industry companySize')
    .populate('skills.skill', 'name category level')
    .populate('learningPath', 'name description')
    .populate('completedCourses.course', 'name description duration')
    .populate('currentCourses.course', 'name description duration');

  if (!foundUser) {
    throw new NotFoundError('User not found');
  }

  // Check company access
  if (foundUser.company.toString() !== user.company.toString() && user.role !== 'super_admin') {
    throw new AuthorizationError('Access denied to this user');
  }

  res.json({
    success: true,
    data: { user: foundUser },
  });
}));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', authMiddleware, authorize('admin'), authorizeCompany, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = createUserSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { user } = req;

  // Check if user already exists
  const existingUser = await User.findByEmail(value.email);
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Create new user
  const newUser = new User({
    ...value,
    company: user.company,
    createdBy: user._id,
    updatedBy: user._id,
  });

  await newUser.save();

  // Update company metrics
  await Company.findByIdAndUpdate(user.company, {
    $inc: { 'metrics.totalUsers': 1, 'metrics.activeUsers': 1 },
  });

  logger.info(`New user created: ${newUser.email} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        title: newUser.title,
      },
    },
  });
}));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put('/:id', authMiddleware, authorizeSelfOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error, value } = updateUserSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { user } = req;
  const userId = id === 'me' ? user._id : id;

  // Check if user exists and belongs to same company
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (existingUser.company.toString() !== user.company.toString() && user.role !== 'super_admin') {
    throw new AuthorizationError('Access denied to this user');
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      ...value,
      updatedBy: user._id,
    },
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`User updated: ${updatedUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser },
  });
}));

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.put('/profile/me', authMiddleware, asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { user } = req;

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      ...value,
      updatedBy: user._id,
    },
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`Profile updated: ${user.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser },
  });
}));

/**
 * @swagger
 * /api/users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.post('/:id/avatar', authMiddleware, authorizeSelfOrAdmin, upload.single('avatar'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const userId = id === 'me' ? user._id : id;

  if (!req.file) {
    throw new ValidationError('Avatar file is required');
  }

  // Check if user exists and belongs to same company
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (existingUser.company.toString() !== user.company.toString() && user.role !== 'super_admin') {
    throw new AuthorizationError('Access denied to this user');
  }

  // Update user avatar
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      avatar: avatarUrl,
      updatedBy: user._id,
    },
    { new: true }
  ).select('-password');

  logger.info(`Avatar uploaded for user: ${updatedUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      user: {
        id: updatedUser._id,
        avatar: updatedUser.avatar,
      },
    },
  });
}));

/**
 * @swagger
 * /api/users/bulk-update:
 *   put:
 *     summary: Bulk update users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - updates
 *     responses:
 *       200:
 *         description: Users updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.put('/bulk-update', authMiddleware, authorize('admin'), authorizeCompany, asyncHandler(async (req, res) => {
  const { error, value } = bulkUpdateSchema.validate(req.body);
  
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { userIds, updates } = value;
  const { user } = req;

  // Verify all users belong to the same company
  const users = await User.find({
    _id: { $in: userIds },
    company: user.company,
  });

  if (users.length !== userIds.length) {
    throw new ValidationError('Some users not found or do not belong to your company');
  }

  // Update users
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    {
      ...updates,
      updatedBy: user._id,
    }
  );

  logger.info(`Bulk update completed for ${result.modifiedCount} users by ${user.email}`);

  res.json({
    success: true,
    message: `Successfully updated ${result.modifiedCount} users`,
    data: {
      updatedCount: result.modifiedCount,
      totalCount: userIds.length,
    },
  });
}));

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.patch('/:id/deactivate', authMiddleware, authorize('admin'), authorizeCompany, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  // Check if user exists and belongs to same company
  const existingUser = await User.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (existingUser.company.toString() !== user.company.toString()) {
    throw new AuthorizationError('Access denied to this user');
  }

  // Prevent deactivating self
  if (existingUser._id.toString() === user._id.toString()) {
    throw new ValidationError('Cannot deactivate your own account');
  }

  // Deactivate user
  existingUser.isActive = false;
  existingUser.updatedBy = user._id;
  await existingUser.save();

  // Update company metrics
  await Company.findByIdAndUpdate(user.company, {
    $inc: { 'metrics.activeUsers': -1 },
  });

  logger.info(`User deactivated: ${existingUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User deactivated successfully',
    data: {
      user: {
        id: existingUser._id,
        email: existingUser.email,
        isActive: existingUser.isActive,
      },
    },
  });
}));

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Activate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.patch('/:id/activate', authMiddleware, authorize('admin'), authorizeCompany, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  // Check if user exists and belongs to same company
  const existingUser = await User.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (existingUser.company.toString() !== user.company.toString()) {
    throw new AuthorizationError('Access denied to this user');
  }

  // Activate user
  existingUser.isActive = true;
  existingUser.updatedBy = user._id;
  await existingUser.save();

  // Update company metrics
  await Company.findByIdAndUpdate(user.company, {
    $inc: { 'metrics.activeUsers': 1 },
  });

  logger.info(`User activated: ${existingUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User activated successfully',
    data: {
      user: {
        id: existingUser._id,
        email: existingUser.email,
        isActive: existingUser.isActive,
      },
    },
  });
}));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.delete('/:id', authMiddleware, authorize('admin'), authorizeCompany, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  // Check if user exists and belongs to same company
  const existingUser = await User.findById(id);
  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (existingUser.company.toString() !== user.company.toString()) {
    throw new AuthorizationError('Access denied to this user');
  }

  // Prevent deleting self
  if (existingUser._id.toString() === user._id.toString()) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Soft delete user
  existingUser.isActive = false;
  existingUser.deletedAt = new Date();
  existingUser.updatedBy = user._id;
  await existingUser.save();

  // Update company metrics
  await Company.findByIdAndUpdate(user.company, {
    $inc: { 'metrics.activeUsers': -1 },
  });

  logger.info(`User deleted: ${existingUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
}));

/**
 * @swagger
 * /api/users/stats/company:
 *   get:
 *     summary: Get company user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get('/stats/company', authMiddleware, authorize('admin', 'manager'), authorizeCompany, asyncHandler(async (req, res) => {
  const { user } = req;

  // Get user statistics
  const stats = await User.aggregate([
    { $match: { company: user.company } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
        byRole: {
          $push: {
            role: '$role',
            count: 1,
          },
        },
        byDepartment: {
          $push: {
            department: '$department',
            count: 1,
          },
        },
      },
    },
  ]);

  // Get recent activity
  const recentActivity = await User.find({ company: user.company })
    .select('firstName lastName email lastLogin isActive')
    .sort({ lastLogin: -1 })
    .limit(10);

  // Get department breakdown
  const departmentStats = await User.aggregate([
    { $match: { company: user.company, department: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        activeCount: { $sum: { $cond: ['$isActive', 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        byRole: [],
        byDepartment: [],
      },
      recentActivity,
      departmentStats,
    },
  });
}));

module.exports = router; 