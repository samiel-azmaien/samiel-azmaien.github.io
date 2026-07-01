# Free Hosting

This site is ready for GitHub Pages.

## First deploy

1. Create a public GitHub repository for the site.
2. Push this folder to that repository.
3. In the GitHub repository, open Settings > Pages.
4. Under Build and deployment, set Source to GitHub Actions.
5. Push to `main` or `master`, or run the `Deploy personal site to GitHub Pages` workflow manually.

From PowerShell, run the git commands from this project folder:

```powershell
cd "C:\Users\unite\OneDrive\Documents\jobtracker"
git add site .github DEPLOY.md
git commit -m "Deploy personal site to GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
git push -u origin main
```

GitHub will publish the site from the `site` folder. The URL will look like:

```text
https://YOUR_USERNAME.github.io/REPO_NAME/
```

For a cleaner personal URL, name the repository:

```text
YOUR_USERNAME.github.io
```

Then the site will publish at:

```text
https://YOUR_USERNAME.github.io/
```

## Updates

Edit files in `site/`, commit, and push. GitHub Pages will redeploy automatically.
