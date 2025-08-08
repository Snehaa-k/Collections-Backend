# Production Deployment Guide

## AWS Deployment

### Prerequisites
- AWS CLI configured
- Docker installed
- Domain name configured

### 1. Database Setup (RDS)
```bash
# Create PostgreSQL RDS instance
aws rds create-db-instance \
  --db-instance-identifier collections-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

### 2. Redis Setup (ElastiCache)
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id collections-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### 3. Application Deployment (ECS)
```bash
# Build and push Docker image
docker build -t collections-api .
docker tag collections-api:latest YOUR_ECR_URI:latest
docker push YOUR_ECR_URI:latest

# Deploy with ECS
aws ecs create-service \
  --cluster collections-cluster \
  --service-name collections-api \
  --task-definition collections-task \
  --desired-count 2
```

## DigitalOcean Deployment

### 1. Droplet Setup
```bash
# Create Ubuntu droplet
doctl compute droplet create collections-api \
  --size s-2vcpu-2gb \
  --image ubuntu-20-04-x64 \
  --region nyc1
```

### 2. Server Configuration
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Application Deployment
```bash
# Clone repository
git clone YOUR_REPO_URL
cd collections-backend

# Set environment variables
cp .env.example .env.production
# Edit .env.production with production values

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Production Environment Variables
```env
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint
DB_NAME=collections_prod
DB_USER=postgres
DB_PASSWORD=your-secure-password
REDIS_HOST=your-redis-endpoint
JWT_SECRET=your-super-secure-jwt-secret
RATE_LIMIT_MAX_REQUESTS=1000
```

## Performance Tuning

### 1. Database Optimization
```sql
-- Create additional indexes
CREATE INDEX CONCURRENTLY idx_accounts_status_created ON accounts(status, created_at);
CREATE INDEX CONCURRENTLY idx_payments_account_date ON payments(account_id, created_at);

-- Analyze tables
ANALYZE accounts;
ANALYZE payments;
ANALYZE activities;
```

### 2. Application Optimization
```javascript
// PM2 configuration
module.exports = {
  apps: [{
    name: 'collections-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 3. Load Balancer Setup
```nginx
upstream collections_api {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://collections_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring & Logging

### 1. Application Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# Setup log rotation
pm2 install pm2-logrotate
```

### 2. Database Monitoring
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Database connections encrypted
- [ ] Environment variables secured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates scheduled

## Backup Strategy

### Database Backups
```bash
# Daily automated backups
0 2 * * * pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > /backups/collections_$(date +%Y%m%d).sql.gz
```

### Application Backups
```bash
# Code and configuration backup
0 3 * * * tar -czf /backups/app_$(date +%Y%m%d).tar.gz /app
```