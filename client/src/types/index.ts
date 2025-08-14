// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  location?: {
    city: string;
    state: string;
    country: string;
    timezone: string;
  };
  title?: string;
  department?: string;
  employeeId?: string;
  hireDate?: Date;
  manager?: string;
  directReports?: string[];
  company: string;
  role: 'admin' | 'manager' | 'employee';
  permissions: string[];
  skills: Skill[];
  learningProgress: LearningProgress[];
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Company Types
export interface Company {
  _id: string;
  name: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  logo?: string;
  description?: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  subscription: {
    plan: 'free' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'trial';
    startDate: Date;
    endDate: Date;
    features: string[];
  };
  settings: {
    integrations: Integration[];
    features: {
      aiServices: boolean;
      advancedAnalytics: boolean;
      customBranding: boolean;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Skill Types
export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experience: number; // years
  lastAssessed: Date;
  confidence: number; // 0-100
  category?: string;
  tags?: string[];
}

// Learning Types
export interface LearningProgress {
  courseId: string;
  progress: number; // 0-100
  completedAt?: Date;
  startedAt: Date;
  lastAccessed: Date;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  modules: Module[];
  prerequisites: string[];
  tags: string[];
  rating: number;
  enrolledCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  duration: number; // minutes
  content: string;
  resources: Resource[];
  quiz?: Quiz;
}

export interface Resource {
  type: 'video' | 'document' | 'link' | 'file';
  title: string;
  url: string;
  description?: string;
}

export interface Quiz {
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // minutes
}

export interface Question {
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

// Analytics Types
export interface AnalyticsData {
  skillsDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  learningProgress: {
    date: string;
    completed: number;
    inProgress: number;
  }[];
  skillGaps: {
    skill: string;
    currentLevel: string;
    requiredLevel: string;
    gap: number;
  }[];
  teamPerformance: {
    userId: string;
    name: string;
    skillsCount: number;
    averageLevel: number;
    learningProgress: number;
  }[];
}

// Integration Types
export interface Integration {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  lastSync?: Date;
  status: 'connected' | 'disconnected' | 'error';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  industry: string;
  companySize: string;
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  title?: string;
  department?: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

// UI Types
export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Notification Types
export interface Notification {
  _id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// File Upload Types
export interface FileUpload {
  _id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: Date;
}

// Subscription Types
export interface Subscription {
  _id: string;
  companyId: string;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  startDate: Date;
  endDate: Date;
  features: string[];
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook Types
export interface Webhook {
  _id: string;
  companyId: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// AI Service Types
export interface SkillsAnalysis {
  userId: string;
  skills: Skill[];
  recommendations: {
    skill: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    suggestedCourses: string[];
  }[];
  marketTrends: {
    skill: string;
    demand: number;
    growth: number;
    salary: number;
  }[];
  createdAt: Date;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Route Types
export interface Route {
  path: string;
  element: React.ComponentType;
  children?: Route[];
  requireAuth?: boolean;
  roles?: string[];
}
