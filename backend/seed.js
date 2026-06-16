// Run once to populate demo data:  node seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Venues
    await pool.query(`
      INSERT INTO venues (name, address) VALUES
        ('City Hospital OPD', 'MG Road, Nagpur'),
        ('State Bank Branch', 'Civil Lines, Nagpur'),
        ('RTO Office', 'Ambazari, Nagpur')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Venues inserted');

    // Queues (2 per venue)
    const venueResult = await pool.query('SELECT id FROM venues ORDER BY id');
    for (const venue of venueResult.rows) {
      await pool.query(`
        INSERT INTO queues (venue_id, name, type) VALUES
          ($1, 'General', 'normal'),
          ($1, 'Priority', 'priority')
        ON CONFLICT DO NOTHING
      `, [venue.id]);
    }
    console.log('✅ Queues inserted');

    // Demo users
    const customerPass = await bcrypt.hash('password123', 10);
    const staffPass = await bcrypt.hash('password123', 10);

    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Demo Customer', 'customer@demo.com', $1, 'customer'),
        ('Staff Operator', 'staff@demo.com', $2, 'staff')
      ON CONFLICT (email) DO NOTHING
    `, [customerPass, staffPass]);
    console.log('✅ Demo users inserted');

    console.log('\n🎉 Seeding complete!');
    console.log('----------------------------');
    console.log('Customer login: customer@demo.com / password123');
    console.log('Staff login:    staff@demo.com / password123');
    console.log('----------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
