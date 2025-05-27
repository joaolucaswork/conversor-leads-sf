#!/bin/bash

# Heroku Deployment Script for Leads Processing System
# This script automates the deployment process to Heroku

set -e  # Exit on any error

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

# Check if Heroku CLI is installed
check_heroku_cli() {
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it from https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    print_success "Heroku CLI is installed"
}

# Check if user is logged in to Heroku
check_heroku_auth() {
    if ! heroku auth:whoami &> /dev/null; then
        print_warning "Not logged in to Heroku. Please run 'heroku login' first."
        exit 1
    fi
    print_success "Logged in to Heroku as $(heroku auth:whoami)"
}

# Get app name from user
get_app_name() {
    if [ -z "$1" ]; then
        read -p "Enter your Heroku app name: " APP_NAME
    else
        APP_NAME="$1"
    fi
    
    if [ -z "$APP_NAME" ]; then
        print_error "App name is required"
        exit 1
    fi
    
    print_status "Using app name: $APP_NAME"
}

# Create Heroku app if it doesn't exist
create_or_verify_app() {
    if heroku apps:info "$APP_NAME" &> /dev/null; then
        print_success "App '$APP_NAME' already exists"
    else
        print_status "Creating new Heroku app: $APP_NAME"
        heroku create "$APP_NAME"
        print_success "Created app: $APP_NAME"
    fi
}

# Set up buildpacks
setup_buildpacks() {
    print_status "Setting up buildpacks..."
    
    # Clear existing buildpacks
    heroku buildpacks:clear --app "$APP_NAME" || true
    
    # Add buildpacks in correct order
    heroku buildpacks:add heroku/nodejs --app "$APP_NAME"
    heroku buildpacks:add heroku/python --app "$APP_NAME"
    
    print_success "Buildpacks configured"
}

# Set environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Get OpenAI API key from user
    if [ -z "$OPENAI_API_KEY" ]; then
        read -p "Enter your OpenAI API key: " OPENAI_API_KEY
    fi
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_error "OpenAI API key is required"
        exit 1
    fi
    
    # Set environment variables
    heroku config:set \
        NODE_ENV=production \
        PYTHON_ENV=production \
        OPENAI_API_KEY="$OPENAI_API_KEY" \
        SALESFORCE_CLIENT_ID="3MVG9Xl3BC6VHB.ajXGO2p2AGuOr2p1I_mxjPmJw8uFTvwEI8rIePoU83kIrsyhrnpZT1K0YroRcMde21OIiy" \
        SALESFORCE_CLIENT_SECRET="4EBCE02C0690F74155B64AED84DA821DA02966E0C041D6360C7ED8A29045A00E" \
        SALESFORCE_LOGIN_URL="https://reino-capital.my.salesforce.com" \
        WEB_CONCURRENCY=1 \
        DEBUG=False \
        --app "$APP_NAME"
    
    print_success "Environment variables configured"
}

# Deploy to Heroku
deploy_app() {
    print_status "Deploying to Heroku..."
    
    # Add Heroku remote if it doesn't exist
    if ! git remote get-url heroku &> /dev/null; then
        heroku git:remote --app "$APP_NAME"
        print_status "Added Heroku git remote"
    fi
    
    # Deploy
    git push heroku main
    
    print_success "Deployment completed"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait a moment for the app to start
    sleep 10
    
    # Check if app is running
    if heroku ps --app "$APP_NAME" | grep -q "up"; then
        print_success "App is running"
        
        # Get app URL
        APP_URL=$(heroku info --app "$APP_NAME" | grep "Web URL" | awk '{print $3}')
        print_success "App is available at: $APP_URL"
        
        # Test health endpoint
        if curl -s "$APP_URL/api/v1/health" > /dev/null; then
            print_success "API health check passed"
        else
            print_warning "API health check failed - app may still be starting"
        fi
    else
        print_warning "App may not be running properly. Check logs with: heroku logs --tail --app $APP_NAME"
    fi
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  Heroku Deployment Script"
    echo "  Leads Processing System"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_heroku_cli
    check_heroku_auth
    
    # Get app name
    get_app_name "$1"
    
    # Deployment steps
    create_or_verify_app
    setup_buildpacks
    setup_environment
    deploy_app
    verify_deployment
    
    echo
    echo "=========================================="
    print_success "Deployment completed successfully!"
    echo "=========================================="
    echo
    print_status "Next steps:"
    echo "1. Visit your app: https://$APP_NAME.herokuapp.com"
    echo "2. Test the API: https://$APP_NAME.herokuapp.com/api/v1/health"
    echo "3. Monitor logs: heroku logs --tail --app $APP_NAME"
    echo "4. Scale if needed: heroku ps:scale web=1:standard-1x --app $APP_NAME"
    echo
}

# Run main function with all arguments
main "$@"
