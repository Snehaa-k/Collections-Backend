const User = require('../src/models/User');

async function createAdmin() {
  try {
    // Check if admin exists
    const existing = await User.findByEmail('admin@test.com');
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created:', admin);
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();