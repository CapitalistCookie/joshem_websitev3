# JoShem Foods - Git Deployment Guide

This guide explains how to deploy and update the JoShem Foods application on a Debian LXC container using Git.

## 1. Initial Server Setup

Log into your Debian LXC instance and install the required environment.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (Version 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Process Manager (PM2), Nginx, and Git
sudo npm install -g pm2
sudo apt install nginx git -y
```

## 2. Deploying via Git (First Time)

If you have a previous version running, follow these steps to perform a "Clean Swap."

### Step A: Clean up the old version
```bash
# Stop the old process (check name with 'pm2 list')
pm2 delete joshem-backend || true

# Backup existing data if you have it
mkdir -p ~/backups
cp /var/www/joshem-foods/data/db.json ~/backups/db_backup.json || true

# Clear the directory for a fresh clone
sudo rm -rf /var/www/joshem-foods
sudo mkdir -p /var/www/joshem-foods
sudo chown -R $USER:$USER /var/www/joshem-foods
```

### Step B: Clone and Build
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git /var/www/joshem-foods
cd /var/www/joshem-foods

# Install all dependencies (including dev deps for the build)
npm install

# Build the frontend
npm run build

# Restore your data (if applicable)
mkdir -p data
cp ~/backups/db_backup.json ./data/db.json || true
```

### Step C: Start the Backend
```bash
# Start the app with PM2
pm2 start server/index.js --name "joshem-backend"

# Ensure it persists on reboots
pm2 save
pm2 startup
# (Follow the instruction printed by the startup command)
```

## 3. Configuring Nginx (Reverse Proxy)

Nginx routes public traffic from Port 80 to your Node app on Port 3000.

1. **Create/Edit the config**:
   ```bash
   sudo nano /etc/nginx/sites-available/joshem
   ```
2. **Paste the following**:
   ```nginx
   server {
       listen 80;
       server_name _; # Change to your domain if available

       # Set max upload size for menu images
       client_max_body_size 100M;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. **Activate and Restart**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/joshem /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default || true
   sudo nginx -t && sudo systemctl restart nginx
   ```

## 4. How to Update in the Future

When you push new code to your Git repository, follow these steps to update the live site:

```bash
cd /var/www/joshem-foods

# 1. Pull the latest code
git pull origin main

# 2. Re-install deps and Re-build
npm install
npm run build

# 3. Restart the backend
pm2 restart joshem-backend

# Note: Your data in data/db.json is safe because git pull does not overwrite 
# files that are listed in .gitignore (ensure data/ is ignored or handled carefully)
```

## Troubleshooting
- **Logs**: View live logs with `pm2 logs joshem-backend`.
- **Permissions**: If Nginx shows a 502 error, check if the Node process is running (`pm2 list`).
- **Memory**: If `npm run build` fails on a small LXC, you might need to increase the container's RAM temporarily to 1GB or 2GB.
