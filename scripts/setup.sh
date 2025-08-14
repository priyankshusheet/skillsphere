#!/bin/bash

# SkillSphere Development Setup Script
# This script sets up the development environment for SkillSphere

set -e

echo "🚀 Welcome to SkillSphere Development Setup!"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) ✓"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "npm $(npm --version) ✓"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 is not installed. AI services will not work."
    else
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1)
        if [ "$PYTHON_VERSION" -lt 3 ]; then
            print_warning "Python 3.8+ is recommended for AI services."
        else
            print_success "Python $(python3 --version) ✓"
        fi
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You'll need to run services manually."
    else
        print_success "Docker $(docker --version) ✓"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. You'll need to run services manually."
    else
        print_success "Docker Compose $(docker-compose --version) ✓"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads/avatars
    mkdir -p uploads/documents
    mkdir -p uploads/exports
    mkdir -p scripts
    
    print_success "Directories created ✓"
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Environment file created from template. Please edit .env with your actual values."
        else
            print_error "env.example not found. Please create a .env file manually."
            exit 1
        fi
    else
        print_success "Environment file already exists ✓"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install client dependencies
    if [ -d "client" ]; then
        print_status "Installing client dependencies..."
        cd client
        npm install
        cd ..
        print_success "Client dependencies installed ✓"
    fi
    
    # Install AI services dependencies
    if [ -d "ai-services" ] && command -v pip3 &> /dev/null; then
        print_status "Installing AI services dependencies..."
        cd ai-services
        pip3 install -r requirements.txt
        cd ..
        print_success "AI services dependencies installed ✓"
    fi
    
    print_success "All dependencies installed ✓"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Starting database services with Docker..."
        docker-compose up -d mongodb redis
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 10
        
        print_success "Database services started ✓"
    else
        print_warning "Docker not available. Please start MongoDB and Redis manually:"
        echo "  - MongoDB: mongod --dbpath /path/to/data"
        echo "  - Redis: redis-server"
    fi
}

# Create initial data
create_initial_data() {
    print_status "Setting up initial data..."
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    print_success "Initial data setup complete ✓"
}

# Setup development scripts
setup_scripts() {
    print_status "Setting up development scripts..."
    
    # Make scripts executable
    chmod +x scripts/*.sh 2>/dev/null || true
    
    print_success "Development scripts configured ✓"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup Complete! Here's what to do next:"
    echo "=========================================="
    echo ""
    echo "1. Configure your environment variables:"
    echo "   - Edit .env file with your actual values"
    echo "   - Set up API keys for integrations"
    echo ""
    echo "2. Start the development servers:"
    echo "   - Full stack: npm run dev"
    echo "   - Backend only: npm run server:dev"
    echo "   - Frontend only: npm run client:dev"
    echo ""
    echo "3. Access your application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000"
    echo "   - API Docs: http://localhost:5000/api-docs"
    echo "   - AI Services: http://localhost:8000"
    echo ""
    echo "4. Database access:"
    echo "   - MongoDB: mongodb://localhost:27017/skillsphere"
    echo "   - Redis: redis://localhost:6379"
    echo ""
    echo "5. Useful commands:"
    echo "   - View logs: tail -f logs/combined.log"
    echo "   - Run tests: npm test"
    echo "   - Build for production: npm run build"
    echo ""
    echo "📚 Documentation:"
    echo "   - README.md - Project overview"
    echo "   - PROJECT_STRUCTURE.md - Detailed architecture"
    echo "   - API docs available at /api-docs when running"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Check logs in the logs/ directory"
    echo "   - Verify environment variables in .env"
    echo "   - Ensure MongoDB and Redis are running"
    echo ""
    echo "Happy coding! 🚀"
}

# Main setup function
main() {
    echo "Starting SkillSphere development setup..."
    echo ""
    
    check_requirements
    create_directories
    setup_environment
    install_dependencies
    setup_database
    create_initial_data
    setup_scripts
    
    show_next_steps
}

# Run main function
main "$@" 