# WatchOnRepeat 🔄

WatchOnRepeat is a premium, modern video-looping Single Page Application (SPA) designed to let users loop videos from YouTube, Vimeo, and Dailymotion infinitely. It features custom loop counts tracking (personal loops starting after the 2nd play, plus global stats tracking), user accounts session management (favorites and history synced via LocalStorage), and a draggable browser bookmark shortcut for quick looping.

This project is configured as a standalone static web application, making it 100% compatible with free web hosting platforms like **GitHub Pages**, **Vercel**, or **Netlify**.

---

## 🚀 How to Set Up & Host on GitHub Pages (with Custom Domain)

Since this is a client-side Single Page Application, you can host it for free on **GitHub Pages** under your custom domain (e.g., `watchonrepeat.com`). Here are the steps to deploy it:

### Step 1: Create a New GitHub Repository
1. Go to your GitHub account and click **New Repository**.
2. Name it `watch-on-repeat`.
3. Keep it Public or Private (GitHub Pages supports both; private requires GitHub Pro).
4. Do **not** initialize it with a README, gitignore, or license (these are already present in this folder).
5. Click **Create repository**.

### Step 2: Push the Code from Your Computer
Open Git Bash, Command Prompt, or PowerShell in this folder (`C:\Users\devil\Documents\watch-on-repeat`) and run:

```bash
# Add files to staging
git add .

# Commit changes
git commit -m "Initial commit of WatchOnRepeat static application"

# Link your local repository to GitHub (replace yidaw123 with your username)
git remote add origin https://github.com/yidaw123/watch-on-repeat.git

# Rename main branch to main
git branch -M main

# Push the code
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository settings on GitHub.
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder, then click **Save**.
5. After a minute, GitHub will give you a live URL (e.g. `https://yidaw123.github.io/watch-on-repeat/`).

### Step 4: Map Your Custom Domain (e.g., `watchonrepeat.com`)
1. Purchase your domain from a registrar (e.g., Namecheap, GoDaddy, Google Domains).
2. Go to your registrar's DNS Management console and add the following records:
   - **A Records** pointing to GitHub Pages IP addresses:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **CNAME Record**:
     - Host: `www`
     - Value: `yidaw123.github.io`
3. Back in your GitHub Repository **Pages** settings:
   - Enter your domain in the **Custom domain** field (e.g., `watchonrepeat.com`) and click **Save**.
   - This will automatically create a `CNAME` file in your repository containing your domain name.
   - Check the **Enforce HTTPS** box once DNS propagates (usually takes a few minutes to an hour).

---

## 🔄 Setting Up the "repeatyoutube.com" Redirection

To support the URL trick where typing `repeatyoutube.com/watch?v=VIDEO_ID` automatically redirects to your site, you have two options depending on which domain names you buy:

### Option A: You own both `watchonrepeat.com` and `repeatyoutube.com`
If you buy `repeatyoutube.com`, you can configure a **301 URL Redirect** (Forwarding) in your domain registrar's DNS management settings:
* Redirect source: `https://www.repeatyoutube.com/watch`
* Redirect target: `https://www.watchonrepeat.com/?url=https://www.youtube.com/watch`
* Forward Query String: **Enabled** (this ensures the `?v=VIDEO_ID` parameter is forwarded).

When a user visits `repeatyoutube.com/watch?v=VIDEO_ID`, they are immediately sent to `watchonrepeat.com/?url=...`, and our router in `app.js` will parse it and start looping!

### Option B: Local Testing (Hosts File)
For local testing of the `repeatyoutube` routing:
1. Open Notepad as Administrator.
2. Open `C:\Windows\System32\drivers\etc\hosts`.
3. Add this line:
   `127.0.0.1 repeatyoutube.com`
4. If you run a local web server (e.g., on port 8000), opening `http://repeatyoutube.com:8000/watch?v=VIDEO_ID` will load the application and loop the video automatically!

---

## 🛠️ Technology & Structure

* **index.html**: Semantically structured SPA container, includes mock login modals and Left/Right ad skyscrapers.
* **style.css**: Dark glassmorphic stylesheet featuring glowing borders and smooth responsive animations.
* **app.js**: Manages YouTube, Vimeo, and Dailymotion API lifecycles, parses URLs, runs the personal and global stats tracking, and holds simulated social/email sign-in states.
* **.gitignore**: Automatically ignores local cache and OS files.
