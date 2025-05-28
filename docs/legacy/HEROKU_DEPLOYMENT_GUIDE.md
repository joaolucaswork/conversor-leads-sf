# Heroku Deployment Guide - Leads Processing System

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure your project is in a Git repository
4. **API Keys**: Have your OpenAI API key ready

## Step 1: Prepare Your Repository

```bash
# Ensure you're in the project root
cd /path/to/your/leads-processing-app

# Add and commit all deployment files
git add .
git commit -m "Add Heroku deployment configuration"
```

## Step 2: Create Heroku Application

```bash
# Login to Heroku
heroku login

# Create a new Heroku app (replace 'your-app-name' with desired name)
heroku create your-leads-processing-app

# Add buildpacks in correct order
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python

# Verify buildpacks
heroku buildpacks
```

## Step 3: Configure Environment Variables

```bash
# Set required environment variables
heroku config:set NODE_ENV=production
heroku config:set PYTHON_ENV=production
heroku config:set OPENAI_API_KEY=your_actual_openai_api_key_here
heroku config:set SALESFORCE_CLIENT_ID=3MVG9Xl3BC6VHB.ajXGO2p2AGuOr2p1I_mxjPmJw8uFTvwEI8rIePoU83kIrsyhrnpZT1K0YroRcMde21OIiy
heroku config:set SALESFORCE_CLIENT_SECRET=4EBCE02C0690F74155B64AED84DA821DA02966E0C041D6360C7ED8A29045A00E
heroku config:set SALESFORCE_REDIRECT_URI=https://your-app-name.herokuapp.com/oauth/callback
heroku config:set SALESFORCE_LOGIN_URL=https://reino-capital.my.salesforce.com
heroku config:set HEROKU_APP_NAME=your-app-name
heroku config:set WEB_CONCURRENCY=1
heroku config:set DEBUG=False

# Verify configuration
heroku config
```

## Step 4: Deploy to Heroku

```bash
# Deploy the application
git push heroku main

# If you're on a different branch:
# git push heroku your-branch:main
```

## Step 5: Monitor Deployment

```bash
# Watch the build process
heroku logs --tail

# Check app status
heroku ps

# Open the deployed app
heroku open
```

## Step 6: Configure Salesforce Connected App

**IMPORTANT**: Before testing OAuth, ensure your Salesforce Connected App is configured with the correct callback URLs:

1. **Login to Salesforce**: Go to [reino-capital.my.salesforce.com](https://reino-capital.my.salesforce.com)
2. **Navigate to Setup**: Click the gear icon → Setup
3. **Find Connected Apps**: In Quick Find, search for "App Manager"
4. **Edit the Connected App**: Find "Leads Processing App" and click "Edit"
5. **Update Callback URLs**: In the "Callback URL" field, ensure both URLs are listed:

   ```text
   http://localhost:5173/oauth/callback
   https://your-app-name.herokuapp.com/oauth/callback
   ```

6. **Save Changes**: Click "Save"

**Note**: Replace `your-app-name` with your actual Heroku app name.

## Step 7: Post-Deployment Verification

1. **Check API Health**: Visit `https://your-app-name.herokuapp.com/api/v1/health`
2. **Test Frontend**: Visit `https://your-app-name.herokuapp.com`
3. **Verify Salesforce OAuth**: Test login functionality
4. **Test File Upload**: Upload a sample leads file

## Troubleshooting

### Build Failures

```bash
# Check build logs
heroku logs --tail

# If build fails with "vite: not found" error:
# This is fixed in the latest version, but if you encounter it:
# 1. Ensure vite is in devDependencies in package.json
# 2. The heroku-postbuild script should handle the build

# Restart the app
heroku restart

# Check dyno status
heroku ps

# Force rebuild if needed
git commit --allow-empty -m "Force rebuild"
git push heroku main
```

### Environment Issues

```bash
# List all config vars
heroku config

# Set missing variables
heroku config:set VARIABLE_NAME=value

# Remove incorrect variables
heroku config:unset VARIABLE_NAME
```

### Performance Issues

```bash
# Scale up dyno
heroku ps:scale web=1:standard-1x

# Check metrics
heroku logs --tail | grep "memory\|cpu"
```

## Updating the Application

```bash
# Make changes to your code
git add .
git commit -m "Update application"

# Deploy updates
git push heroku main

# Monitor deployment
heroku logs --tail
```

## Useful Heroku Commands

```bash
# Run one-off commands
heroku run python backend/start_production.py

# Access bash shell
heroku run bash

# View app information
heroku info

# View releases
heroku releases

# Rollback to previous release
heroku rollback v123
```

## Limitations and Considerations

### Heroku Platform Limitations

1. **File Storage**: Heroku has ephemeral filesystem
   - Uploaded files are lost on dyno restart
   - Consider using AWS S3 for persistent file storage
   - Current implementation stores files temporarily

2. **Memory Limits**:
   - Free tier: 512MB RAM
   - Basic tier: 1GB RAM
   - Large Excel files may cause memory issues

3. **Request Timeout**:
   - 30-second timeout for HTTP requests
   - Large file processing may timeout
   - Consider background job processing for large files

4. **Cold Starts**:
   - Free tier apps sleep after 30 minutes of inactivity
   - First request after sleep takes 10-30 seconds
   - Paid tiers don't have this limitation

### Application-Specific Considerations

1. **AI Processing Costs**:
   - OpenAI API calls cost money
   - Monitor usage in production
   - Consider implementing usage limits

2. **Salesforce Rate Limits**:
   - Salesforce has API call limits
   - Implement proper error handling
   - Consider bulk operations for large datasets

3. **Data Security**:
   - Sensitive lead data processed in cloud
   - Ensure compliance with data protection regulations
   - Consider data encryption at rest

4. **Concurrent Users**:
   - Single dyno handles limited concurrent requests
   - Scale horizontally for more users
   - Consider implementing request queuing

### Recommended Upgrades for Production

1. **Dyno Tier**: Upgrade to Standard or Performance dynos
2. **Add-ons**:
   - Heroku Postgres for persistent data storage
   - Heroku Redis for caching and session storage
   - Papertrail for log management
3. **Monitoring**:
   - New Relic or Datadog for application monitoring
   - Heroku Metrics for basic monitoring

### Cost Estimation

- **Free Tier**: $0/month (with limitations)
- **Basic Production**: ~$25-50/month
  - Standard-1X dyno: $25/month
  - Heroku Postgres Essential: $9/month
  - Add-ons: $10-15/month
- **Enterprise**: $100+/month for high availability and performance

### Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Heroku provides SSL certificates automatically
3. **Authentication**: Implement proper session management
4. **Input Validation**: Validate all file uploads and API inputs
5. **Rate Limiting**: Implement API rate limiting for production
