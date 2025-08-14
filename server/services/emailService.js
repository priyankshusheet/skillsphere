const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async sendEmail(options) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to SkillSphere!';
    const html = this.getWelcomeEmailTemplate(user);
    const text = this.getWelcomeEmailText(user);

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your SkillSphere Password';
    const html = this.getPasswordResetEmailTemplate(user, resetUrl);
    const text = this.getPasswordResetEmailText(user, resetUrl);

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  async sendSkillsAssessmentEmail(user, assessmentResults) {
    const subject = 'Your Skills Assessment Results';
    const html = this.getSkillsAssessmentEmailTemplate(user, assessmentResults);
    const text = this.getSkillsAssessmentEmailText(user, assessmentResults);

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  async sendLearningRecommendationsEmail(user, recommendations) {
    const subject = 'Your Personalized Learning Recommendations';
    const html = this.getLearningRecommendationsEmailTemplate(user, recommendations);
    const text = this.getLearningRecommendationsEmailText(user, recommendations);

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  // Email Templates
  getWelcomeEmailTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to SkillSphere</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SkillSphere!</h1>
              <p>Your AI-powered skills development journey starts here</p>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName}!</h2>
              <p>Welcome to SkillSphere, the platform that will transform how you and your organization approach skills development and career growth.</p>
              
              <h3>What's next?</h3>
              <ul>
                <li>Complete your skills assessment to get personalized insights</li>
                <li>Explore learning paths tailored to your goals</li>
                <li>Track your progress with advanced analytics</li>
                <li>Connect with your team and mentors</li>
              </ul>
              
              <a href="${process.env.CLIENT_URL}/dashboard" class="button">Get Started</a>
              
              <p>If you have any questions, our support team is here to help!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 SkillSphere. All rights reserved.</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getWelcomeEmailText(user) {
    return `
Welcome to SkillSphere!

Hello ${user.firstName}!

Welcome to SkillSphere, the platform that will transform how you and your organization approach skills development and career growth.

What's next?
- Complete your skills assessment to get personalized insights
- Explore learning paths tailored to your goals
- Track your progress with advanced analytics
- Connect with your team and mentors

Get started: ${process.env.CLIENT_URL}/dashboard

If you have any questions, our support team is here to help!

Best regards,
The SkillSphere Team

© 2024 SkillSphere. All rights reserved.
    `;
  }

  getPasswordResetEmailTemplate(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
              <p>Secure your SkillSphere account</p>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName}!</h2>
              <p>We received a request to reset your password for your SkillSphere account.</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <div class="warning">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
              <p>${resetUrl}</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 SkillSphere. All rights reserved.</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getPasswordResetEmailText(user, resetUrl) {
    return `
Reset Your Password

Hello ${user.firstName}!

We received a request to reset your password for your SkillSphere account.

Reset your password: ${resetUrl}

Important: This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

If you're having trouble clicking the link, copy and paste this URL into your browser:
${resetUrl}

Best regards,
The SkillSphere Team

© 2024 SkillSphere. All rights reserved.
    `;
  }

  getSkillsAssessmentEmailTemplate(user, assessmentResults) {
    const topSkills = assessmentResults.topSkills?.slice(0, 5) || [];
    const skillGaps = assessmentResults.skillGaps?.slice(0, 3) || [];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Skills Assessment Results</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .skill-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #16a34a; }
            .gap-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #d97706; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Skills Assessment Results</h1>
              <p>Discover your strengths and opportunities</p>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName}!</h2>
              <p>Your skills assessment is complete! Here's what we discovered about your professional capabilities.</p>
              
              <h3>Your Top Skills</h3>
              ${topSkills.map(skill => `
                <div class="skill-item">
                  <strong>${skill.name}</strong> - Level: ${skill.level}/5
                  <br>Experience: ${skill.experience} years
                </div>
              `).join('')}
              
              <h3>Development Opportunities</h3>
              ${skillGaps.map(gap => `
                <div class="gap-item">
                  <strong>${gap.name}</strong> - Priority: ${gap.priority}
                  <br>Estimated time to develop: ${gap.estimatedTime}
                </div>
              `).join('')}
              
              <a href="${process.env.CLIENT_URL}/skills" class="button">View Full Results</a>
              
              <p>Ready to start your learning journey? We've created personalized recommendations just for you!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 SkillSphere. All rights reserved.</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getSkillsAssessmentEmailText(user, assessmentResults) {
    const topSkills = assessmentResults.topSkills?.slice(0, 5) || [];
    const skillGaps = assessmentResults.skillGaps?.slice(0, 3) || [];

    return `
Your Skills Assessment Results

Hello ${user.firstName}!

Your skills assessment is complete! Here's what we discovered about your professional capabilities.

Your Top Skills:
${topSkills.map(skill => `- ${skill.name} (Level: ${skill.level}/5, Experience: ${skill.experience} years)`).join('\n')}

Development Opportunities:
${skillGaps.map(gap => `- ${gap.name} (Priority: ${gap.priority}, Time: ${gap.estimatedTime})`).join('\n')}

View full results: ${process.env.CLIENT_URL}/skills

Ready to start your learning journey? We've created personalized recommendations just for you!

Best regards,
The SkillSphere Team

© 2024 SkillSphere. All rights reserved.
    `;
  }

  getLearningRecommendationsEmailTemplate(user, recommendations) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Learning Recommendations</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .recommendation { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #0284c7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Learning Recommendations</h1>
              <p>Personalized paths for your growth</p>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName}!</h2>
              <p>Based on your skills assessment and career goals, we've curated these learning recommendations just for you.</p>
              
              <h3>Recommended Learning Paths</h3>
              ${recommendations.map(rec => `
                <div class="recommendation">
                  <strong>${rec.skillName}</strong>
                  <br>Priority: ${rec.priority}
                  <br>Estimated time: ${rec.estimatedTime}
                  <br>Resources: ${rec.learningResources?.length || 0} courses available
                </div>
              `).join('')}
              
              <a href="${process.env.CLIENT_URL}/learning" class="button">Start Learning</a>
              
              <p>These recommendations are based on your current skills, market demand, and career aspirations. Start with the high-priority items for maximum impact!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 SkillSphere. All rights reserved.</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getLearningRecommendationsEmailText(user, recommendations) {
    return `
Your Learning Recommendations

Hello ${user.firstName}!

Based on your skills assessment and career goals, we've curated these learning recommendations just for you.

Recommended Learning Paths:
${recommendations.map(rec => `- ${rec.skillName} (Priority: ${rec.priority}, Time: ${rec.estimatedTime}, Resources: ${rec.learningResources?.length || 0} courses)`).join('\n')}

Start learning: ${process.env.CLIENT_URL}/learning

These recommendations are based on your current skills, market demand, and career aspirations. Start with the high-priority items for maximum impact!

Best regards,
The SkillSphere Team

© 2024 SkillSphere. All rights reserved.
    `;
  }
}

module.exports = new EmailService();
