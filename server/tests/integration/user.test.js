const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../index');
const User = require('../../models/User');
const Company = require('../../models/Company');

let mongoServer;
let testUser;
let testCompany;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Company.deleteMany({});

  // Create test company
  testCompany = await Company.create({
    name: 'Test Company',
    industry: 'Technology',
    size: 'small',
    contact: { email: 'test@company.com', phone: '1234567890' },
    location: { address: '123 Test St', city: 'Test City', state: 'Test State', country: 'Test Country' }
  });

  // Create test user
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  testUser = await User.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: hashedPassword,
    company: testCompany._id,
    role: 'admin',
    permissions: ['read:users', 'write:users', 'delete:users']
  });

  // Generate auth token
  authToken = jwt.sign(
    { userId: testUser._id, companyId: testCompany._id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

describe('User Management Integration Tests', () => {
  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.firstName).toBe(testUser.firstName);
      expect(response.body.data.lastName).toBe(testUser.lastName);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    it('should return error for invalid phone number', async () => {
      const updateData = {
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create additional test users
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await User.create([
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: hashedPassword,
          company: testCompany._id,
          role: 'manager'
        },
        {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          password: hashedPassword,
          company: testCompany._id,
          role: 'employee'
        }
      ]);
    });

    it('should get all users for company', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(3); // Including the original test user
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/users?role=manager')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].role).toBe('manager');
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/users?search=Jane')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].firstName).toBe('Jane');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with valid data', async () => {
      const newUserData = {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'employee',
        title: 'Software Developer',
        department: 'Engineering'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.firstName).toBe(newUserData.firstName);
      expect(response.body.data.role).toBe(newUserData.role);
    });

    it('should return error for duplicate email', async () => {
      const newUserData = {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'john@example.com', // Duplicate email
        password: 'Password123!',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const newUser = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        company: testCompany._id,
        role: 'employee'
      });
      testUserId = newUser._id;
    });

    it('should update user with valid data', async () => {
      const updateData = {
        firstName: 'Jane Updated',
        lastName: 'Smith Updated',
        role: 'manager',
        title: 'Senior Developer'
      };

      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.role).toBe(updateData.role);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const newUser = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        company: testCompany._id,
        role: 'employee'
      });
      testUserId = newUser._id;
    });

    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      // Verify user is deleted
      const deletedUser = await User.findById(testUserId);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/skills', () => {
    it('should update user skills', async () => {
      const skillsData = {
        skills: [
          {
            name: 'JavaScript',
            level: 'advanced',
            experience: 5,
            confidence: 90,
            category: 'Programming'
          },
          {
            name: 'React',
            level: 'intermediate',
            experience: 3,
            confidence: 75,
            category: 'Frontend'
          }
        ]
      };

      const response = await request(app)
        .put('/api/users/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.skills).toBeDefined();
      expect(response.body.data.skills.length).toBe(2);
      expect(response.body.data.skills[0].name).toBe('JavaScript');
      expect(response.body.data.skills[1].name).toBe('React');
    });
  });
});
