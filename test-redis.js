const Redis = require('ioredis');

async function testRedis() {
  console.log('🔍 Testing Redis connection...');
  
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });
  
  console.log('📋 Connection details:');
  console.log('Host:', process.env.REDIS_HOST || 'localhost');
  console.log('Port:', process.env.REDIS_PORT || 6379);
  console.log('Password:', process.env.REDIS_PASSWORD ? '***hidden***' : 'none');

  try {
    // Test connection
    const pong = await redis.ping();
    console.log('✅ Redis connected:', pong);

    // Test set/get
    await redis.set('test', 'Hello Redis!');
    const value = await redis.get('test');
    console.log('✅ Redis test value:', value);

    // Test expiration
    await redis.setex('temp', 5, 'This expires in 5 seconds');
    console.log('✅ Redis expiration test set');

    console.log('🎉 Redis is working perfectly!');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Start Redis server: redis-server');
    console.log('2. Or use Docker: docker-compose -f docker-compose.redis.yml up -d');
    console.log('3. Check if Redis is running on port 6379');
  } finally {
    redis.disconnect();
  }
}

// Load environment variables
require('dotenv').config();

testRedis();