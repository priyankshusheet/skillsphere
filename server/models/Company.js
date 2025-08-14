const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
  },
  legalName: {
    type: String,
    trim: true,
    maxlength: [200, 'Legal name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL'],
  },
  logo: {
    type: String,
    default: null,
  },

  // Contact Information
  contact: {
    email: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },

  // Company Details
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
      'technology',
      'healthcare',
      'finance',
      'education',
      'manufacturing',
      'retail',
      'consulting',
      'media',
      'real_estate',
      'transportation',
      'energy',
      'government',
      'non_profit',
      'other'
    ],
  },
  subIndustry: {
    type: String,
    trim: true,
    maxlength: [100, 'Sub-industry cannot exceed 100 characters'],
  },
  companySize: {
    type: String,
    required: [true, 'Company size is required'],
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'],
  },
  foundedYear: {
    type: Number,
    min: [1800, 'Founded year must be after 1800'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future'],
  },
  revenue: {
    type: String,
    enum: ['under_1m', '1m_10m', '10m_50m', '50m_100m', '100m_500m', '500m_1b', '1b_10b', '10b+'],
  },

  // Business Information
  businessModel: {
    type: String,
    enum: ['b2b', 'b2c', 'b2b2c', 'marketplace', 'saas', 'consulting', 'agency', 'other'],
  },
  targetMarkets: [{
    type: String,
    trim: true,
    maxlength: [100, 'Target market cannot exceed 100 characters'],
  }],
  competitors: [{
    name: String,
    website: String,
    description: String,
  }],

  // Subscription and Billing
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise', 'custom'],
      default: 'starter',
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled', 'suspended'],
      default: 'trial',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    trialEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually'],
      default: 'monthly',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },

  // Features and Modules
  enabledFeatures: [{
    type: String,
    enum: [
      'basic_skills_mapping',
      'advanced_analytics',
      'ai_recommendations',
      'lms_integration',
      'hris_integration',
      'linkedin_integration',
      'workday_integration',
      'custom_reporting',
      'api_access',
      'white_label',
      'dedicated_support',
      'custom_training'
    ],
  }],
  customModules: [{
    name: String,
    description: String,
    isActive: Boolean,
    config: mongoose.Schema.Types.Mixed,
  }],

  // Settings and Configuration
  settings: {
    branding: {
      primaryColor: {
        type: String,
        default: '#3B82F6',
      },
      secondaryColor: {
        type: String,
        default: '#1F2937',
      },
      logoUrl: String,
      faviconUrl: String,
    },
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        frequency: {
          type: String,
          enum: ['immediate', 'daily', 'weekly'],
          default: 'daily',
        },
      },
      slack: {
        enabled: {
          type: Boolean,
          default: false,
        },
        webhookUrl: String,
        channel: String,
      },
    },
    security: {
      passwordPolicy: {
        minLength: {
          type: Number,
          default: 8,
        },
        requireUppercase: {
          type: Boolean,
          default: true,
        },
        requireLowercase: {
          type: Boolean,
          default: true,
        },
        requireNumbers: {
          type: Boolean,
          default: true,
        },
        requireSpecialChars: {
          type: Boolean,
          default: true,
        },
      },
      sessionTimeout: {
        type: Number,
        default: 480, // 8 hours in minutes
      },
      mfaRequired: {
        type: Boolean,
        default: false,
      },
      ipWhitelist: [String],
    },
    integrations: {
      sso: {
        enabled: {
          type: Boolean,
          default: false,
        },
        provider: String,
        config: mongoose.Schema.Types.Mixed,
      },
      ldap: {
        enabled: {
          type: Boolean,
          default: false,
        },
        server: String,
        baseDN: String,
        config: mongoose.Schema.Types.Mixed,
      },
    },
  },

  // Analytics and Metrics
  metrics: {
    totalUsers: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    totalSkills: {
      type: Number,
      default: 0,
    },
    completedCourses: {
      type: Number,
      default: 0,
    },
    averageSkillScore: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },

  // Status and Flags
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending',
  },

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

// Virtual for company age
companySchema.virtual('age').get(function() {
  if (!this.foundedYear) return null;
  return new Date().getFullYear() - this.foundedYear;
});

// Virtual for subscription status
companySchema.virtual('isTrialExpired').get(function() {
  if (!this.subscription.trialEndDate) return false;
  return new Date() > this.subscription.trialEndDate;
});

// Virtual for subscription days remaining
companySchema.virtual('trialDaysRemaining').get(function() {
  if (!this.subscription.trialEndDate) return null;
  const now = new Date();
  const trialEnd = new Date(this.subscription.trialEndDate);
  const diffTime = trialEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ companySize: 1 });
companySchema.index({ 'subscription.status': 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ 'subscription.plan': 1 });

// Pre-save middleware to update audit fields
companySchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdBy = this._id;
  }
  this.updatedBy = this._id;
  next();
});

// Static method to find active companies
companySchema.statics.findActive = function() {
  return this.find({ isActive: true, status: 'active' });
};

// Static method to find companies by plan
companySchema.statics.findByPlan = function(plan) {
  return this.find({ 'subscription.plan': plan, isActive: true });
};

// Static method to find companies by industry
companySchema.statics.findByIndustry = function(industry) {
  return this.find({ industry, isActive: true });
};

// Instance method to check if feature is enabled
companySchema.methods.isFeatureEnabled = function(feature) {
  return this.enabledFeatures.includes(feature);
};

// Instance method to check subscription status
companySchema.methods.isSubscriptionActive = function() {
  return this.subscription.status === 'active' || 
         (this.subscription.status === 'trial' && !this.isTrialExpired);
};

module.exports = mongoose.model('Company', companySchema); 