# SkillSphere - AI-Powered Skills Management Platform

A comprehensive SaaS platform for skills assessment, learning management, and career development powered by AI.

## 🚀 Features

- **AI-Powered Skills Analysis** - Intelligent skills assessment and gap identification
- **Personalized Learning Paths** - Customized recommendations based on career goals
- **Real-time Analytics** - Comprehensive reporting and insights
- **Team Management** - Multi-tenant organization support
- **Third-party Integrations** - Slack, Teams, Google Workspace, and more
- **Advanced Security** - JWT authentication, role-based access control
- **Scalable Architecture** - Microservices with caching and optimization

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + MongoDB
- **AI Services**: Python + FastAPI + scikit-learn
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **Deployment**: Vercel/Netlify

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB
- Redis

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/skillsphere.git
cd skillsphere

# Install dependencies
npm run install:all

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/skillsphere

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@skillsphere.com

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=skillsphere-uploads

# Payments (Stripe)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Client URL
CLIENT_URL=http://localhost:3000

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

## 🛠️ Development

```bash
# Start all services
npm run dev

# Start only backend
npm run server:dev

# Start only frontend
npm run client:dev

# Run tests
npm test

# Build for production
npm run build:all
```

## 📚 API Documentation

- **Development**: http://localhost:5001/api-docs
- **Health Check**: http://localhost:5001/health

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test
```

## 🚀 Deployment

### Vercel Deployment
```bash
npm run deploy:vercel
```

### Netlify Deployment
```bash
npm run deploy:netlify
```

### Docker Deployment
```bash
docker-compose up -d
```

## 📁 Project Structure

```
skillsphere/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── ai-services/           # Python AI services
├── shared/                # Shared utilities and types
├── docs/                  # Documentation
├── config/                # Configuration files
└── scripts/               # Build and deployment scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/skillsphere/issues)
- **Email**: support@skillsphere.com

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added AI-powered skills analysis
- **v1.2.0** - Enhanced analytics and reporting
- **v1.3.0** - Added integrations and webhooks

---

Built with ❤️ by the SkillSphere Team 