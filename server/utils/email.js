const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

// Email templates
const emailTemplates = {
  welcome: {
    subject: 'Welcome to SkillSphere!',
    template: 'welcome.html',
  },
  passwordReset: {
    subject: 'Password Reset Request - SkillSphere',
    template: 'password-reset.html',
  },
  passwordResetSuccess: {
    subject: 'Password Reset Successful - SkillSphere',
    template: 'password-reset-success.html',
  },
  passwordChanged: {
    subject: 'Password Changed - SkillSphere',
    template: 'password-changed.html',
  },
  emailVerification: {
    subject: 'Verify Your Email - SkillSphere',
    template: 'email-verification.html',
  },
  weeklyReport: {
    subject: 'Your Weekly Skills Report - SkillSphere',
    template: 'weekly-report.html',
  },
  skillAssessment: {
    subject: 'New Skill Assessment Available - SkillSphere',
    template: 'skill-assessment.html',
  },
  learningRecommendation: {
    subject: 'Personalized Learning Recommendations - SkillSphere',
    template: 'learning-recommendation.html',
  },
  courseCompletion: {
    subject: 'Congratulations! Course Completed - SkillSphere',
    template: 'course-completion.html',
  },
  companyInvitation: {
    subject: 'You\'ve Been Invited to Join SkillSphere',
    template: 'company-invitation.html',
  },
  subscriptionUpdate: {
    subject: 'Subscription Update - SkillSphere',
    template: 'subscription-update.html',
  },
  trialExpiring: {
    subject: 'Your SkillSphere Trial is Expiring Soon',
    template: 'trial-expiring.html',
  },
};

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'test') {
    // Use ethereal email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'test@ethereal.email',
        pass: 'testpass',
      },
    });
  }

  // Production/development transporter
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Load email template
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', templateName);
    const template = await fs.readFile(templatePath, 'utf8');
    return template;
  } catch (error) {
    logger.warn(`Email template not found: ${templateName}, using default`);
    return getDefaultTemplate(templateName);
  }
};

// Get default template if file not found
const getDefaultTemplate = (templateName) => {
  const defaultTemplates = {
    welcome: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to SkillSphere</title>
      </head>
      <body>
        <h1>Welcome to SkillSphere, {{firstName}}!</h1>
        <p>Thank you for joining SkillSphere. We're excited to help you and your team at {{companyName}} develop the skills needed for success.</p>
        <p><a href="{{loginUrl}}">Get Started</a></p>
      </body>
      </html>
    `,
    passwordReset: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body>
        <h1>Password Reset Request</h1>
        <p>Hi {{firstName}},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p><a href="{{resetUrl}}">Reset Password</a></p>
        <p>This link will expire in {{expiryHours}} hour(s).</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
      </html>
    `,
    passwordResetSuccess: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Successful</title>
      </head>
      <body>
        <h1>Password Reset Successful</h1>
        <p>Hi {{firstName}},</p>
        <p>Your password has been successfully reset. You can now <a href="{{loginUrl}}">login</a> with your new password.</p>
      </body>
      </html>
    `,
    passwordChanged: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Changed</title>
      </head>
      <body>
        <h1>Password Changed</h1>
        <p>Hi {{firstName}},</p>
        <p>Your password was changed at {{changeTime}}.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      </body>
      </html>
    `,
  };

  return defaultTemplates[templateName] || defaultTemplates.welcome;
};

// Replace template variables
const replaceVariables = (template, context) => {
  let result = template;
  Object.keys(context).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, context[key]);
  });
  return result;
};

// Send email
const sendEmail = async (options) => {
  try {
    const { to, subject, template, context, html, text, attachments } = options;

    // Validate required fields
    if (!to || (!subject && !template)) {
      throw new Error('Email requires "to" and either "subject" or "template"');
    }

    let emailSubject = subject;
    let emailHtml = html;
    let emailText = text;

    // Use template if provided
    if (template) {
      const templateConfig = emailTemplates[template];
      if (!templateConfig) {
        throw new Error(`Unknown email template: ${template}`);
      }

      emailSubject = templateConfig.subject;
      const templateContent = await loadTemplate(templateConfig.template);
      emailHtml = replaceVariables(templateContent, context || {});
      
      // Generate plain text version
      emailText = emailHtml
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'SkillSphere'}" <${process.env.FROM_EMAIL || 'noreply@skillsphere.com'}>`,
      to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    logger.email(`Email sent successfully to ${to}: ${emailSubject}`, {
      messageId: info.messageId,
      to,
      subject: emailSubject,
      template: template || 'custom',
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ ...result, to: email.to, success: true });
    } catch (error) {
      results.push({ 
        to: email.to, 
        success: false, 
        error: error.message 
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  logger.email(`Bulk email completed: ${successCount} successful, ${failureCount} failed`);

  return {
    results,
    summary: {
      total: emails.length,
      successful: successCount,
      failed: failureCount,
    },
  };
};

// Send welcome email
const sendWelcomeEmail = async (user, company) => {
  return sendEmail({
    to: user.email,
    template: 'welcome',
    context: {
      firstName: user.firstName,
      companyName: company.name,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    },
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  return sendEmail({
    to: user.email,
    template: 'passwordReset',
    context: {
      firstName: user.firstName,
      resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
      expiryHours: 1,
    },
  });
};

// Send password reset success email
const sendPasswordResetSuccessEmail = async (user) => {
  return sendEmail({
    to: user.email,
    template: 'passwordResetSuccess',
    context: {
      firstName: user.firstName,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    },
  });
};

// Send password changed email
const sendPasswordChangedEmail = async (user) => {
  return sendEmail({
    to: user.email,
    template: 'passwordChanged',
    context: {
      firstName: user.firstName,
      changeTime: new Date().toLocaleString(),
    },
  });
};

// Send weekly report email
const sendWeeklyReportEmail = async (user, reportData) => {
  return sendEmail({
    to: user.email,
    template: 'weeklyReport',
    context: {
      firstName: user.firstName,
      reportData,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard`,
    },
  });
};

// Send skill assessment email
const sendSkillAssessmentEmail = async (user, assessment) => {
  return sendEmail({
    to: user.email,
    template: 'skillAssessment',
    context: {
      firstName: user.firstName,
      assessmentName: assessment.name,
      assessmentUrl: `${process.env.CLIENT_URL}/assessments/${assessment.id}`,
    },
  });
};

// Send learning recommendation email
const sendLearningRecommendationEmail = async (user, recommendations) => {
  return sendEmail({
    to: user.email,
    template: 'learningRecommendation',
    context: {
      firstName: user.firstName,
      recommendations,
      learningUrl: `${process.env.CLIENT_URL}/learning`,
    },
  });
};

// Send course completion email
const sendCourseCompletionEmail = async (user, course) => {
  return sendEmail({
    to: user.email,
    template: 'courseCompletion',
    context: {
      firstName: user.firstName,
      courseName: course.name,
      certificateUrl: course.certificate,
      nextStepsUrl: `${process.env.CLIENT_URL}/learning/recommendations`,
    },
  });
};

// Send company invitation email
const sendCompanyInvitationEmail = async (email, inviter, company, invitationToken) => {
  return sendEmail({
    to: email,
    template: 'companyInvitation',
    context: {
      inviterName: inviter.fullName,
      companyName: company.name,
      invitationUrl: `${process.env.CLIENT_URL}/invite?token=${invitationToken}`,
    },
  });
};

// Send subscription update email
const sendSubscriptionUpdateEmail = async (user, subscription) => {
  return sendEmail({
    to: user.email,
    template: 'subscriptionUpdate',
    context: {
      firstName: user.firstName,
      planName: subscription.plan,
      amount: subscription.amount,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      billingUrl: `${process.env.CLIENT_URL}/billing`,
    },
  });
};

// Send trial expiring email
const sendTrialExpiringEmail = async (user, company) => {
  return sendEmail({
    to: user.email,
    template: 'trialExpiring',
    context: {
      firstName: user.firstName,
      companyName: company.name,
      daysRemaining: company.trialDaysRemaining,
      upgradeUrl: `${process.env.CLIENT_URL}/billing/upgrade`,
    },
  });
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendPasswordChangedEmail,
  sendWeeklyReportEmail,
  sendSkillAssessmentEmail,
  sendLearningRecommendationEmail,
  sendCourseCompletionEmail,
  sendCompanyInvitationEmail,
  sendSubscriptionUpdateEmail,
  sendTrialExpiringEmail,
  verifyEmailConfig,
  emailTemplates,
}; 