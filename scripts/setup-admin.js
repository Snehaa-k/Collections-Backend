const User = require('../src/models/User');

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    // Check if admin exists
    const existing = await User.findByEmail('admin@collections.com');
    if (existing) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@collections.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@collections.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    process.exit(0);
  }
}

setupAdmin();