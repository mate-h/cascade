# Deployment Guide - Cascade Engine

This guide explains how to deploy the Cascade Engine project to Vercel using GitHub Actions.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your project should be pushed to a GitHub repository
3. **Node.js**: Ensure your project builds successfully locally

## Setup Steps

### 1. Link Your Project to Vercel

First, you need to link your project to Vercel and get the necessary IDs:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (run this in your project root)
vercel link
```

When prompted:
- Choose to link to an existing project or create a new one
- Select your team/account
- Choose the project name

This will create a `.vercel` folder with a `project.json` file containing your `projectId` and `orgId`.

### 2. Create Vercel Token

1. Go to [Vercel Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions Deploy")
4. Copy the token value (you'll need this for GitHub secrets)

### 3. Configure GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

   - **VERCEL_TOKEN**: The token you created in step 2
   - **VERCEL_ORG_ID**: The `orgId` from `.vercel/project.json`
   - **VERCEL_PROJECT_ID**: The `projectId` from `.vercel/project.json`

### 4. Disable Automatic Vercel Deployments

The `vercel.json` file in this project already disables automatic GitHub deployments to prevent conflicts with GitHub Actions.

## How It Works

### GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) will:

1. **Trigger on**:
   - Push to `main` branch → Production deployment
   - Pull requests to `main` → Preview deployment
   - Manual trigger via GitHub Actions UI

2. **Build Process**:
   - Install dependencies with `npm ci`
   - Install Vercel CLI
   - Pull environment configuration from Vercel
   - Build the project using Vercel's build system
   - Deploy the built artifacts

### Deployment Types

- **Preview Deployments**: Created for pull requests, allowing you to test changes before merging
- **Production Deployments**: Created when code is pushed to the main branch

## Testing the Setup

1. **Create a test branch**:
   ```bash
   git checkout -b test-deployment
   ```

2. **Make a small change** to any file

3. **Push and create a PR**:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin test-deployment
   ```

4. **Check GitHub Actions**: Go to the Actions tab in your repository to see the workflow running

5. **Check Vercel**: Go to your Vercel dashboard to see the preview deployment

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the GitHub Actions logs for build errors
2. **Missing Secrets**: Ensure all three Vercel secrets are properly configured
3. **Permission Issues**: Verify your Vercel token has the necessary permissions

### Useful Commands

```bash
# Test build locally
npm run build

# Test Vercel deployment locally
vercel --prod

# Check Vercel project status
vercel ls
```

## Environment Variables

If your project requires environment variables:

1. Add them in your Vercel project dashboard
2. They will be automatically available during build and runtime

## Custom Domains

To add a custom domain:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add your domain and follow the DNS configuration instructions

## Monitoring

- **Vercel Analytics**: Available in your Vercel dashboard
- **Function Logs**: View serverless function logs in the Vercel dashboard
- **Performance**: Monitor Core Web Vitals and performance metrics

## Security Notes

- Never commit your Vercel token to version control
- Use GitHub secrets for all sensitive information
- Regularly rotate your Vercel tokens
- Consider using Vercel's team tokens for organization-wide deployments

---

For more information, see:
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli) 