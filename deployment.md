# Deployment Instructions

## Deploy to Netlify Production

### Quick Deploy (Recommended)
```powershell
cd C:\Users\danielrosh\Desktop\bug1\idan\final1
npx netlify-cli deploy --prod --dir=. --site=joyful-smakager-d1d610
```

### Step by Step

1. **Navigate to project directory**
   ```powershell
   cd C:\Users\danielrosh\Desktop\bug1\idan\final1
   ```

2. **Commit changes to git (optional but recommended)**
   ```powershell
   git add .
   git commit -m "Your commit message here"
   ```

3. **Deploy to production**
   ```powershell
   npx netlify-cli deploy --prod --dir=. --site=joyful-smakager-d1d610
   ```

### Alternative: Manual Deployment

1. Go to https://app.netlify.com
2. Find site: **joyful-smakager-d1d610**
3. Go to **Deploys** tab
4. Drag and drop the entire `final1` folder

### Site Information

- **Site Name**: joyful-smakager-d1d610
- **Production URL**: https://joyful-smakager-d1d610.netlify.app
- **Project ID**: f30c9d9a-b058-488e-8953-f5b0c2e868e9
- **Owner**: smashlab

### First Time Setup (if needed)

If Netlify CLI is not authenticated:
```powershell
npx netlify-cli login
```
Then follow the browser authentication flow.

### Useful Commands

- **Check deploy status**: Visit https://app.netlify.com/projects/joyful-smakager-d1d610/deploys
- **View build logs**: Click on any deploy in the Netlify dashboard
- **Preview deploy before production**:
  ```powershell
  npx netlify-cli deploy --dir=.
  ```
  (This creates a preview URL you can test before pushing to production)

### Notes

- The deployment includes all files in the `final1` directory
- Build time is typically under 1 minute
- Changes are live immediately after deployment completes
- Config file: `netlify.toml` (in project root)
