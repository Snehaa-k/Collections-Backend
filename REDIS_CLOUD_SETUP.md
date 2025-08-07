# ☁️ **Free Cloud Redis Setup**

## **1. Redis Cloud (Recommended)**
1. Visit: https://redis.com/try-free/
2. Sign up for free account
3. Create new database
4. Get connection details:

```bash
# Example credentials you'll get:
REDIS_HOST=redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-generated-password-here
```

## **2. Upstash (Alternative)**
1. Visit: https://upstash.com/
2. Sign up with GitHub
3. Create Redis database
4. Copy connection details

## **3. Railway (Alternative)**
1. Visit: https://railway.app/
2. Deploy Redis service
3. Get connection string

## **4. Update Your .env**
```bash
# Replace with your cloud credentials:
REDIS_HOST=your-cloud-host.com
REDIS_PORT=your-port
REDIS_PASSWORD=your-password
```

## **✅ Test Connection**
```bash
node test-redis.js
```