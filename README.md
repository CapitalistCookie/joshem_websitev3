# JoShem Foods - Deployment Guide

This guide explains how to deploy the JoShem Foods application on a Debian LXC container using Git.

## 1. Initial Server Setup

Log into your Debian LXC instance and run these commands to install Node.js 20 and dependencies.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg

# Add NodeSource GPG key and Repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Install Node.js
sudo apt-get update
sudo apt-get install nodejs -y

# Install PM2, Nginx, and Git
sudo npm install -g pm2
sudo apt install nginx git -y
```

## 2. Deploying via Git

### Step A: Prepare Directory
```bash
sudo mkdir -p /var/www/joshem-foods
sudo chown -R $USER:$USER /var/www/joshem-foods
cd /var/www/joshem-foods
```

### Step B: Clone and Build
```bash
# Replace with your actual repository URL
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Install dependencies and build
npm install
npm run build
```

### Step C: Start Process
```bash
pm2 start server/index.js --name "joshem-foods"
pm2 save
pm2 startup
```

## 3. Nginx Configuration

1. Create config: `sudo nano /etc/nginx/sites-available/joshem`
2. Paste this content:
```nginx
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;

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
3. Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/joshem /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default || true
sudo systemctl restart nginx
```

## 4. Updates
Whenever you push changes to Git, update the server with:
```bash
cd /var/www/joshem-foods
git pull origin main
npm install
npm run build
pm2 restart joshem-foods
```

*Note: Your data is persisted in `data/db.json` inside the project folder.*