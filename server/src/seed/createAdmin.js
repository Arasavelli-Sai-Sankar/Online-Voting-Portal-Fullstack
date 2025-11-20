require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const name = process.env.ADMIN_NAME || 'Admin';

    let admin = await User.findOne({ email, role: 'admin' });
    if (admin) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }

    admin = await User.create({ name, email, password, role: 'admin' });
    console.log('Admin created:', { email, password });
    process.exit(0);
  } catch (e) {
    console.error('Failed to create admin', e);
    process.exit(1);
  }
})();