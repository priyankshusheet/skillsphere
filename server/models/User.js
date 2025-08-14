const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
  },

  // Profile Information
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  location: {
    city: String,
    state: String,
    country: String,
    timezone: String,
  },

  // Professional Information
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  department: {
    type: String,
    maxlength: [100, 'Department cannot exceed 100 characters'],
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  hireDate: {
    type: Date,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  directReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Company Information
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'admin', 'super_admin'],
    default: 'employee',
  },
  permissions: [{
    type: String,
    enum: [
      'read_users',
      'write_users',
      'read_skills',
      'write_skills',
      'read_analytics',
      'write_analytics',
      'read_integrations',
      'write_integrations',
      'manage_subscriptions',
      'manage_company_settings'
    ],
  }],

  // Skills and Learning
  skills: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50,
    },
    lastAssessed: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    endorsements: [{
      endorser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      date: {
        type: Date,
        default: Date.now,
      },
    }],
  }],

  // Learning Progress
  learningPath: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
  },
  completedCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    certificate: String,
  }],
  currentCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  }],

  // Career Goals
  careerGoals: [{
    title: {
      type: String,
      required: true,
      maxlength: [200, 'Goal title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Goal description cannot exceed 1000 characters'],
    },
    targetDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
      default: 'not_started',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    skillsRequired: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    }],
  }],

  // Integration Settings
  integrations: {
    linkedin: {
      connected: {
        type: Boolean,
        default: false,
      },
      accessToken: String,
      refreshToken: String,
      profileUrl: String,
      lastSync: Date,
    },
    workday: {
      connected: {
        type: Boolean,
        default: false,
      },
      employeeId: String,
      lastSync: Date,
    },
    lms: {
      connected: {
        type: Boolean,
        default: false,
      },
      provider: String,
      accessToken: String,
      lastSync: Date,
    },
  },

  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    weeklyReports: {
      type: Boolean,
      default: true,
    },
    skillAssessments: {
      type: Boolean,
      default: true,
    },
    learningRecommendations: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,

  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for skills count
userSchema.virtual('skillsCount').get(function() {
  return this.skills ? this.skills.length : 0;
});

// Virtual for completed courses count
userSchema.virtual('completedCoursesCount').get(function() {
  return this.completedCourses ? this.completedCourses.length : 0;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ company: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'skills.skill': 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update audit fields
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdBy = this._id;
  }
  this.updatedBy = this._id;
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role, company: this.company },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users by company
userSchema.statics.findActiveByCompany = function(companyId) {
  return this.find({ company: companyId, isActive: true });
};

module.exports = mongoose.model('User', userSchema); 