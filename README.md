# JoShem Foods - Deployment Guide

## 1. Debian Server Setup

Log into your Debian LXC instance and install the required tools (Node.js, Nginx, PM2).

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (Version 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Process Manager (to keep server running)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

## 2. Deploying the Application

Since the app now has a Backend (API), you cannot just copy the `dist` folder. You must copy the server code as well.

1. **Prepare files locally:**
   Make sure you have run `npm run build` locally.

2. **Upload files to server:**
   Copy your entire project folder (excluding node_modules) or pull from git.
   ```bash
   # Example using SCP
   # Make sure to copy package.json, server folder, and dist folder
   scp -r package.json server dist data user@your-server-ip:/var/www/joshem-foods
   ```

3. **Install Dependencies on Server:**
   ```bash
   cd /var/www/joshem-foods
   npm install --production
   ```

4. **Start the Server:**
   Use PM2 to start the Node.js backend.
   ```bash
   # Start the app
   sudo pm2 start server/index.js --name "joshem-backend"
   
   # Make sure it restarts on reboot
   sudo pm2 startup
   sudo pm2 save
   ```
   *Your app is now running on port 3000 inside the server.*

## 3. Configure Nginx (Reverse Proxy)

Configure Nginx to send public traffic (Port 80) to your Node app (Port 3000).

1. Edit the config file:
   ```bash
   sudo nano /etc/nginx/sites-available/joshem
   ```

2. Paste this configuration:
   ```nginx
   server {
       listen 80;
       server_name _;  # Or your domain name

       # Proxy everything to the Node.js application
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

3. Enable and Restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/joshem /etc/nginx/sites-enabled/
   # Remove default if it exists
   sudo rm /etc/nginx/sites-enabled/default
   
   sudo nginx -t
   sudo systemctl restart nginx
   ```

Now your app handles both the React frontend and the API backend correctly, and data will persist on the server in the `data/db.json` file.