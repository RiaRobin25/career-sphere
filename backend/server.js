require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fsSync = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Import Mongoose Models
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const SavedJob = require('./models/SavedJob');
const Message = require('./models/Message');
const Interview = require('./models/Interview');
const Review = require('./models/Review');
const Offer = require('./models/Offer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'job_portal_super_secret_key_12345';

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully.');
    seedDemoUsers(); // Seed users on startup if database is empty
  })
  .catch(err => console.error('MongoDB Atlas connection error:', err));

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Admin validation middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// Seed Demo Users if empty
async function seedDemoUsers() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('Seeding demo accounts to MongoDB Atlas...');
      // Seeker
      const seekerPassword = await bcrypt.hash('demo123', 10);
      await User.create({
        name: 'Demo Seeker',
        email: 'demo_user',
        password: seekerPassword,
        role: 'seeker',
        status: 'active'
      });
      // Employer
      const employerPassword = await bcrypt.hash('demo123', 10);
      await User.create({
        name: 'Acme Corp (Demo)',
        email: 'demo_employer',
        password: employerPassword,
        role: 'employer',
        status: 'active',
        verified: true
      });
      // Admin
      const adminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Platform Admin',
        email: 'admin',
        password: adminPassword,
        role: 'admin',
        status: 'active'
      });
      console.log('Demo accounts seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to seed demo accounts:', err);
  }
}

// --- EMAIL NOTIFICATIONS (NODEMAILER) ---
let transporter;
async function getMailTransporter() {
  if (transporter) return transporter;
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Nodemailer Ethereal SMTP server active. Login user: ${testAccount.user}`);
  } catch (err) {
    // Console fallback
    transporter = {
      sendMail: async (options) => {
        console.log("\n--- [EMAIL LOGGED TO CONSOLE] ---");
        console.log(`TO:      ${options.to}`);
        console.log(`SUBJECT: ${options.subject}`);
        console.log(`BODY:    ${options.text}`);
        console.log("---------------------------------\n");
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
    console.log("Nodemailer failed to connect. Falling back to Console Logger SMTP.");
  }
  return transporter;
}

async function sendEmailNotification(to, subject, text) {
  try {
    const client = await getMailTransporter();
    await client.sendMail({
      from: '"CareerSphere Notifications" <notifications@careersphere.com>',
      to,
      subject,
      text
    });
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
}

// --- MULTER RESUME UPLOADS ---
const uploadsDir = path.join(__dirname, 'uploads', 'resumes');
if (!fsSync.existsSync(uploadsDir)) {
  fsSync.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
    cb(null, true);
  } else {
    cb(new Error('Format rejected. Only PDF and DOC/DOCX files are supported.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// --- MULTER IMAGE UPLOADS ---
const imagesDir = path.join(__dirname, 'uploads', 'images');
if (!fsSync.existsSync(imagesDir)) {
  fsSync.mkdirSync(imagesDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const imageFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Format rejected. Only images (JPG, JPEG, PNG, GIF, SVG, WEBP) are supported.'), false);
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB Limit
});

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- AUTHENTICATION ENDPOINTS ---

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (role !== 'seeker' && role !== 'employer') {
    return res.status(400).json({ error: 'Role must be either seeker or employer.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user object in Mongo
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status: 'active',
      verified: false
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        resumePath: newUser.resumePath,
        resumeName: newUser.resumeName,
        verified: newUser.verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Find user (support login with email OR id/username)
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { _id: mongoose.isValidObjectId(email) ? email : null }
      ]
    });

    // Fallback for simple demo usernames
    if (!user) {
      user = await User.findOne({ email: email });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Check Account Suspension
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact the administrator.' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        resumePath: user.resumePath,
        resumeName: user.resumeName,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// --- JOBS ENDPOINTS ---

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    
    // Enforce verified status mappings dynamically
    const enrichedJobs = [];
    for (const job of jobs) {
      const companyUser = await User.findById(job.employerId);
      const reviews = await Review.find({ companyId: job.employerId });
      const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
      
      enrichedJobs.push({
        ...job.toObject(),
        id: job._id, // map Mongo _id to id for frontend compatibility
        companyVerified: companyUser ? companyUser.verified === true : false,
        companyRating: avgRating,
        companyReviewsCount: reviews.length
      });
    }
    res.json(enrichedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

// Get a single job by ID
app.get('/api/jobs/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    
    const companyUser = await User.findById(job.employerId);
    const reviews = await Review.find({ companyId: job.employerId });
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;

    res.json({
      ...job.toObject(),
      id: job._id,
      companyVerified: companyUser ? companyUser.verified === true : false,
      companyRating: avgRating,
      companyReviewsCount: reviews.length
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ error: 'Failed to fetch job details.' });
  }
});

// Post a new job (Employer only)
app.post('/api/jobs', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Only employers can post jobs.' });
  }

  const { title, company, location, salary, skills, duration, workplaceType, description, experienceLevel, education, jobType } = req.body;

  if (!title || !company || !location || !salary || !skills || !duration || !workplaceType || !description) {
    return res.status(400).json({ error: 'All job fields are required.' });
  }

  try {
    const newJob = await Job.create({
      title,
      company,
      location,
      salary: Number(salary),
      skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
      duration,
      workplaceType,
      description,
      employerId: req.user.id,
      experienceLevel: experienceLevel || 'mid',
      education: education || "Bachelor's",
      jobType: jobType || duration || 'full-time'
    });

    // Dynamic Email Alert & Notification to Seekers
    const seekers = await User.find({ role: 'seeker' });
    for (const seeker of seekers) {
      // Create Database Notification
      await Notification.create({
        userId: seeker._id,
        message: `New Job Opportunity: "${newJob.title}" posted by "${newJob.company}".`,
        type: 'new_job'
      });

      sendEmailNotification(
        seeker.email,
        `New Job Match: ${newJob.title}`,
        `Hello ${seeker.name},\n\nA new job position "${newJob.title}" has been posted by "${newJob.company}" in ${newJob.location}.\nSalary: $${newJob.salary.toLocaleString()}/yr\n\nApply now on CareerSphere!\n\nBest regards,\nCareerSphere Team`
      );
    }

    res.status(201).json({
      ...newJob.toObject(),
      id: newJob._id
    });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ error: 'Failed to post job.' });
  }
});

// Delete a job (Employer only)
app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Only employers can delete jobs.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    if (job.employerId !== req.user.id && req.user.id !== 'user-employer-1') {
      return res.status(403).json({ error: 'Access denied. You can only delete your own job postings.' });
    }

    await Job.findByIdAndDelete(req.params.id);
    
    // Also remove any applications associated with this job
    await Application.deleteMany({ jobId: req.params.id });
    
    res.json({ message: 'Job deleted successfully.' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job.' });
  }
});

// Apply for a job (Seeker only)
app.post('/api/jobs/:id/apply', authenticateToken, async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Access denied. Only job seekers can apply for jobs.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    // Check if already applied
    const alreadyApplied = await Application.findOne({
      jobId: req.params.id,
      applicantId: req.user.id
    });

    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    const seeker = await User.findById(req.user.id);
    const appliedAtTime = new Date();
    
    const newApplication = await Application.create({
      jobId: req.params.id,
      applicantId: req.user.id,
      employerId: job.employerId,
      applicantName: req.user.name,
      email: req.user.email,
      phone: req.body.phone || '',
      resumePath: seeker ? seeker.resumePath : null,
      resumeName: seeker ? seeker.resumeName : null,
      atsStatus: 'Applied',
      appliedDate: appliedAtTime,
      statusHistory: [
        {
          status: 'Applied',
          changedAt: appliedAtTime,
          note: 'Initial application submitted.'
        }
      ]
    });

    // Notify Seeker
    await Notification.create({
      userId: req.user.id,
      message: `You successfully applied for "${job.title}" at "${job.company}".`,
      type: 'application_submitted'
    });

    // Notify Employer
    await Notification.create({
      userId: job.employerId,
      message: `New applicant "${req.user.name}" submitted an application for "${job.title}".`,
      type: 'new_application'
    });

    // Send Application Confirmation Email
    sendEmailNotification(
      req.user.email,
      `Application Received: ${job.title}`,
      `Hello ${req.user.name},\n\nYour application for the position of "${job.title}" at "${job.company}" was submitted successfully.\nYou can track your application status under your Dashboard.\n\nBest regards,\nCareerSphere Team`
    );

    res.status(201).json({
      message: 'Application submitted successfully!',
      application: {
        ...newApplication.toObject(),
        id: newApplication._id
      }
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: 'Failed to apply for job.' });
  }
});


// --- APPLICATION TRACKING SYSTEM & OTHER ENDPOINTS ---

// Fetch seeker's applications
app.get('/api/applications', authenticateToken, async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Only job seekers can fetch their applications.' });
  }

  try {
    const myApps = await Application.find({ applicantId: req.user.id }).sort({ appliedDate: -1 });
    
    const detailedApps = [];
    for (const appItem of myApps) {
      const job = await Job.findById(appItem.jobId);
      detailedApps.push({
        ...appItem.toObject(),
        id: appItem._id,
        status: appItem.atsStatus, // map for frontend expectation
        jobTitle: job ? job.title : 'Deleted Position',
        company: job ? job.company : 'Unknown Company',
        location: job ? job.location : '',
        salary: job ? job.salary : 0
      });
    }

    res.json(detailedApps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch application history.' });
  }
});

// Fetch employer's job applications
app.get('/api/applications/employer', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Employers only.' });
  }

  try {
    const myApps = await Application.find({ employerId: req.user.id }).sort({ appliedDate: -1 });
    
    const enrichedApps = [];
    for (const appItem of myApps) {
      const job = await Job.findById(appItem.jobId);
      const applicantUser = await User.findById(appItem.applicantId);
      enrichedApps.push({
        ...appItem.toObject(),
        id: appItem._id,
        status: appItem.atsStatus, // align key
        jobTitle: job ? job.title : 'Deleted Position',
        company: job ? job.company : 'Unknown Company',
        resumePath: applicantUser ? applicantUser.resumePath : null,
        resumeName: applicantUser ? applicantUser.resumeName : null,
        skills: applicantUser ? applicantUser.skills : [],
        education: applicantUser ? applicantUser.education : '',
        experience: applicantUser ? applicantUser.experience : ''
      });
    }

    res.json(enrichedApps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// Update Application Status (ATS)
app.put('/api/applications/:id/status', authenticateToken, async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Accepted', 'Rejected', 'Selected', 'Interview'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid application status.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Associated job not found.' });
    }

    // Verify ownership
    if (job.employerId !== req.user.id && req.user.id !== 'user-employer-1') {
      return res.status(403).json({ error: 'Access denied. You do not own this job posting.' });
    }

    const oldStatus = application.atsStatus || 'Applied';
    application.atsStatus = status;

    application.statusHistory.push({
      status,
      changedAt: new Date(),
      note: note || `Status updated from ${oldStatus} to ${status}.`
    });

    await application.save();

    // Custom notification text based on status
    let messageText = `Your application status for "${job.title}" at "${job.company}" has been updated to "${status}".`;
    if (status === 'Accepted' || status === 'Selected') {
      messageText = `Congratulations! Your application for "${job.title}" at "${job.company}" has been selected.`;
    } else if (status === 'Rejected') {
      messageText = `Your application for "${job.title}" at "${job.company}" was not selected.`;
    }

    // Notify Seeker
    await Notification.create({
      userId: application.applicantId,
      message: messageText,
      type: 'status_update'
    });

    // Send Application Status Update Email Notification
    sendEmailNotification(
      application.email,
      `Status Update: ${job.title}`,
      `Hello ${application.applicantName},\n\nYour application status for "${job.title}" at "${job.company}" has been updated to: "${status}".\n\nEmployer Remarks: ${note || 'No comments provided.'}\n\nBest regards,\nCareerSphere Team`
    );

    res.json({ 
      message: 'Status updated successfully.', 
      application: {
        ...application.toObject(),
        id: application._id,
        status: application.atsStatus
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

// Seeker Upload Profile Resume
app.post('/api/profile/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Access denied. Seekers only.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please select a PDF or Word document resume file.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const relativePath = `/uploads/resumes/${req.file.filename}`;
    user.resumePath = relativePath;
    user.resumeName = req.file.originalname;

    await user.save();

    res.json({
      message: 'Resume profile updated successfully.',
      resumePath: relativePath,
      resumeName: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update resume path.' });
  }
});

// --- NEW PROFILE, RATING & OFFER LETTER ENDPOINTS ---

// Get logged-in user profile details
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userItem = await User.findById(req.user.id);
    if (!userItem) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const u = userItem.toObject();
    delete u.password;
    res.json(u);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile details.' });
  }
});

// Update logged-in user profile details
app.put('/api/profile', authenticateToken, async (req, res) => {
  const updates = req.body;
  
  // Prevent role/password changes through this route
  delete updates.role;
  delete updates.password;
  delete updates.email; // keep email immutable or handle separately

  try {
    const userItem = await User.findById(req.user.id);
    if (!userItem) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Process skills array if string
    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    Object.assign(userItem, updates);
    await userItem.save();

    const u = userItem.toObject();
    delete u.password;
    res.json({ message: 'Profile updated successfully.', user: u });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile details.' });
  }
});

// Upload profile picture or company logo
app.post('/api/profile/image', authenticateToken, uploadImage.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select an image file to upload.' });
  }

  try {
    const userItem = await User.findById(req.user.id);
    if (!userItem) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const relativePath = `/uploads/images/${req.file.filename}`;
    if (userItem.role === 'seeker') {
      userItem.profilePicture = relativePath;
    } else if (userItem.role === 'employer') {
      userItem.companyLogo = relativePath;
    }

    await userItem.save();
    res.json({
      message: 'Profile image updated successfully.',
      imagePath: relativePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload profile image.' });
  }
});

// Request company verification
app.put('/api/profile/request-verification', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Employers only.' });
  }

  try {
    const userItem = await User.findById(req.user.id);
    if (!userItem) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    userItem.verificationRequested = true;
    await userItem.save();

    res.json({ message: 'Company verification requested successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request verification.' });
  }
});

// Submit a review for a company
app.post('/api/companies/:id/reviews', authenticateToken, async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Access denied. Only job seekers can review companies.' });
  }

  const { rating, reviewText } = req.body;
  if (!rating || !reviewText) {
    return res.status(400).json({ error: 'Rating and review text are required.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const companyUser = await User.findOne({ _id: req.params.id, role: 'employer' });
    if (!companyUser) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const review = await Review.create({
      seekerId: req.user.id,
      seekerName: req.user.name,
      companyId: req.params.id,
      rating: Number(rating),
      reviewText,
      status: 'approved'
    });

    res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// Get reviews for a company
app.get('/api/companies/:id/reviews', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const reviews = await Review.find({ companyId: req.params.id, status: 'approved' }).sort({ createdAt: -1 });
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;

    res.json({
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Admin get all reviews
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const list = await Review.find({}).sort({ createdAt: -1 });
    
    // Enrich with company name
    const enriched = [];
    for (const r of list) {
      const companyUser = await User.findById(r.companyId);
      enriched.push({
        ...r.toObject(),
        id: r._id,
        companyName: companyUser ? companyUser.companyName || companyUser.name : 'Unknown Company'
      });
    }
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews for admin.' });
  }
});

// Admin delete/moderate review
app.delete('/api/admin/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const removed = await Review.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    res.json({ message: 'Review deleted by administrator.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// Create and generate offer letter
app.post('/api/offers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Employers only.' });
  }

  const { applicationId, jobId, jobTitle, company, seekerId, salary, startDate, expiryDate, additionalTerms } = req.body;

  if (!applicationId || !jobId || !jobTitle || !company || !seekerId || !salary || !startDate || !expiryDate) {
    return res.status(400).json({ error: 'All offer fields are required.' });
  }

  try {
    // Check if application exists
    const appRecord = await Application.findById(applicationId);
    if (!appRecord) {
      return res.status(404).json({ error: 'Associated application not found.' });
    }

    // Create uploads/offers directory if not exists
    const offersDir = path.join(__dirname, 'uploads', 'offers');
    if (!fsSync.existsSync(offersDir)) {
      fsSync.mkdirSync(offersDir, { recursive: true });
    }

    const filename = `offer-${applicationId}-${Date.now()}.pdf`;
    const relativePath = `/uploads/offers/${filename}`;
    const fullPath = path.join(offersDir, filename);

    // Create Offer in database first
    const offer = await Offer.create({
      applicationId,
      jobId,
      jobTitle,
      company,
      seekerId,
      employerId: req.user.id,
      salary: Number(salary),
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      additionalTerms: additionalTerms || '',
      status: 'Sent',
      pdfPath: relativePath
    });

    // Generate PDF offer letter
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fsSync.createWriteStream(fullPath);
    doc.pipe(writeStream);

    // Write contents to PDF
    doc.fontSize(26).text('JOB OFFER LETTER', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Expiration Date: ${new Date(expiryDate).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text(`${company}`, { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Dear ${appRecord.applicantName},`, { align: 'left' });
    doc.moveDown();
    doc.text(`We are pleased to offer you the position of "${jobTitle}" at "${company}". We were very impressed by your qualifications and experience during our evaluation process.`);
    doc.moveDown();
    doc.text(`Here are the details of our formal employment offer:`);
    doc.moveDown();

    doc.text(`• Position Title: ${jobTitle}`);
    doc.text(`• Organization: ${company}`);
    doc.text(`• Annual Salary: $${Number(salary).toLocaleString()}/yr`);
    doc.text(`• Expected Start Date: ${new Date(startDate).toLocaleDateString()}`);
    doc.moveDown();

    if (additionalTerms) {
      doc.text(`Additional Terms & Conditions:`);
      doc.text(additionalTerms, { oblique: true });
      doc.moveDown();
    }

    doc.text(`To accept this offer, please sign and submit your decision through your CareerSphere dashboard by the expiration date.`);
    doc.moveDown(2);

    doc.text(`Sincerely,`, { align: 'left' });
    doc.moveDown();
    doc.text(`${company} Hiring Team`, { bold: true });

    doc.end();

    writeStream.on('finish', async () => {
      // Create notification for seeker
      await Notification.create({
        userId: seekerId,
        message: `You have received an employment offer letter for "${jobTitle}" from "${company}".`,
        type: 'offer_received'
      });

      res.status(201).json({
        message: 'Offer letter created and generated successfully.',
        offer: {
          ...offer.toObject(),
          id: offer._id
        }
      });
    });

    writeStream.on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Failed to write PDF file.' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate offer letter.' });
  }
});

// Get offer details
app.get('/api/offers/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    // Verify access (seeker or employer involved)
    if (offer.seekerId !== req.user.id && offer.employerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Mark as viewed if seeker opens it
    if (offer.seekerId === req.user.id && offer.status === 'Sent') {
      offer.status = 'Viewed';
      await offer.save();
    }

    res.json({
      ...offer.toObject(),
      id: offer._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch offer details.' });
  }
});

// Get offer by application ID
app.get('/api/offers/application/:appId', authenticateToken, async (req, res) => {
  try {
    const offer = await Offer.findOne({ applicationId: req.params.appId });
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found for this application.' });
    }

    // Verify access
    if (offer.seekerId !== req.user.id && offer.employerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Mark as viewed if seeker opens it
    if (offer.seekerId === req.user.id && offer.status === 'Sent') {
      offer.status = 'Viewed';
      await offer.save();
    }

    res.json({
      ...offer.toObject(),
      id: offer._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch offer.' });
  }
});

// Update offer decision (Accept/Decline)
app.put('/api/offers/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;

  if (status !== 'Accepted' && status !== 'Declined') {
    return res.status(400).json({ error: 'Status must be Accepted or Declined.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    if (offer.seekerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Seeker only.' });
    }

    offer.status = status;
    await offer.save();

    // Create Notification for employer
    await Notification.create({
      userId: offer.employerId,
      message: `Candidate has ${status.toLowerCase()} your employment offer for "${offer.jobTitle}".`,
      type: 'offer_response'
    });

    // Update Application Status accordingly if Accepted
    const appRecord = await Application.findById(offer.applicationId);
    if (appRecord) {
      const displayStatus = status === 'Accepted' ? 'Selected' : 'Rejected';
      appRecord.atsStatus = displayStatus;
      appRecord.statusHistory.push({
        status: displayStatus,
        changedAt: new Date(),
        note: `Candidate ${status.toLowerCase()} the formal offer letter.`
      });
      await appRecord.save();
    }

    res.json({
      message: `Offer ${status.toLowerCase()} successfully.`,
      offer: {
        ...offer.toObject(),
        id: offer._id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update offer status.' });
  }
});

// Download offer letter PDF file
app.get('/api/offers/download/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    // Verify access
    if (offer.seekerId !== req.user.id && offer.employerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const offersDir = path.join(__dirname, 'uploads', 'offers');
    const filename = path.basename(offer.pdfPath);
    const fullPath = path.join(offersDir, filename);

    if (!fsSync.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Offer letter PDF file does not exist on disk.' });
    }

    res.download(fullPath, `${offer.company.replace(/\s+/g, '_')}_Offer_Letter.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download file.' });
  }
});


// --- INTERVIEW SCHEDULING ENDPOINTS ---

// Schedule an interview
app.post('/api/interviews', authenticateToken, async (req, res) => {
  if (req.user.role !== 'employer') {
    return res.status(403).json({ error: 'Access denied. Only employers can schedule interviews.' });
  }

  const { applicationId, dateTime, note } = req.body;
  if (!applicationId || !dateTime) {
    return res.status(400).json({ error: 'Application ID and Date-Time are required.' });
  }

  try {
    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    if (job.employerId !== req.user.id && req.user.id !== 'user-employer-1') {
      return res.status(403).json({ error: 'Access denied. You do not own this job listing.' });
    }

    const newInterview = await Interview.create({
      applicationId,
      jobId: job._id,
      jobTitle: job.title,
      company: job.company,
      seekerId: application.applicantId,
      seekerName: application.applicantName,
      employerId: req.user.id,
      dateTime: new Date(dateTime),
      note: note || ''
    });

    // Automatically move status to "Interview"
    application.atsStatus = 'Interview';
    application.statusHistory.push({
      status: 'Interview',
      changedAt: new Date(),
      note: `Interview scheduled for ${new Date(dateTime).toLocaleString()}. Instructions: ${note || 'none'}`
    });
    await application.save();

    // Create Notification
    await Notification.create({
      userId: application.applicantId,
      message: `Interview scheduled for "${job.title}" with "${job.company}" on ${new Date(dateTime).toLocaleString()}.`,
      type: 'interview_scheduled'
    });

    // Send Interview Invitation Email
    sendEmailNotification(
      application.email,
      `Interview Scheduled: ${job.title}`,
      `Hello ${application.applicantName},\n\nAn interview has been scheduled for your application as "${job.title}" at "${job.company}".\n\nDate & Time: ${new Date(dateTime).toLocaleString()}\nEmployer Instructions:\n${note || 'Please connect on time.'}\n\nBest regards,\nCareerSphere Team`
    );

    // Simulated Reminder notification
    setTimeout(() => {
      console.log(`[Email Reminder Alert - Simulator] To: ${application.email}. Reminder: Upcoming interview for ${job.title} with ${job.company} at ${new Date(dateTime).toLocaleString()}`);
    }, 5000);

    res.status(201).json({ 
      message: 'Interview scheduled and notification email sent.', 
      interview: {
        ...newInterview.toObject(),
        id: newInterview._id
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule interview.' });
  }
});

// Fetch user interviews
app.get('/api/interviews', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'seeker') {
      query = { seekerId: req.user.id };
    } else if (req.user.role === 'employer') {
      query = { employerId: req.user.id };
    } else if (req.user.role === 'admin') {
      query = {};
    }

    const list = await Interview.find(query).sort({ dateTime: 1 });
    res.json(list.map(i => ({
      ...i.toObject(),
      id: i._id
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interview schedule.' });
  }
});


// --- REAL-TIME CHAT DATABASE ENDPOINTS ---

// Fetch conversation summaries
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  try {
    const sent = await Message.distinct('receiverId', { senderId: currentUserId });
    const received = await Message.distinct('senderId', { receiverId: currentUserId });

    const partners = new Set([...sent, ...received]);
    const list = [];
    for (const pid of partners) {
      const partner = await User.findById(pid);
      if (!partner) continue;

      const lastMsg = await Message.findOne({
        $or: [
          { senderId: currentUserId, receiverId: pid },
          { senderId: pid, receiverId: currentUserId }
        ]
      }).sort({ timestamp: -1 });

      list.push({
        id: partner._id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
        lastMessage: lastMsg ? lastMsg.content : '',
        lastTimestamp: lastMsg ? lastMsg.timestamp : '',
        online: onlineUsers.has(String(partner._id))
      });
    }

    list.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats.' });
  }
});

// Fetch detailed messages with specific user
app.get('/api/chat/messages/:otherUserId', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    const history = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ timestamp: 1 });

    res.json(history.map(m => ({
      ...m.toObject(),
      id: m._id
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});


// --- SAVED JOBS ENDPOINTS ---

// Save a Job (Seeker only)
app.post('/api/jobs/:id/save', authenticateToken, async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Only job seekers can save job postings.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Invalid Job ID.' });
    }

    await SavedJob.create({
      userId: req.user.id,
      jobId: req.params.id
    });

    res.json({ message: 'Job saved successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already saved this job.' });
    }
    res.status(500).json({ error: 'Failed to save job.' });
  }
});

// Unsave a Job (Seeker only)
app.delete('/api/jobs/:id/unsave', authenticateToken, async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Only job seekers can unsave job postings.' });
  }

  try {
    await SavedJob.findOneAndDelete({
      userId: req.user.id,
      jobId: req.params.id
    });
    res.json({ message: 'Job unsaved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unsave job.' });
  }
});

// Fetch all saved jobs for seeker
app.get('/api/jobs/saved', authenticateToken, async (req, res) => {
  if (req.user.role !== 'seeker') {
    return res.status(403).json({ error: 'Only job seekers can fetch saved jobs.' });
  }

  try {
    const savedList = await SavedJob.find({ userId: req.user.id });
    const jobIds = savedList.map(rel => rel.jobId);
    
    const jobs = await Job.find({ _id: { $in: jobIds } });
    const enrichedJobs = [];
    for (const job of jobs) {
      const companyUser = await User.findById(job.employerId);
      enrichedJobs.push({
        ...job.toObject(),
        id: job._id,
        companyVerified: companyUser ? companyUser.verified === true : false
      });
    }

    res.json(enrichedJobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch saved jobs.' });
  }
});


// --- NOTIFICATIONS ENDPOINTS ---

// Fetch user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(list.map(n => ({
      ...n.toObject(),
      id: n._id
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true }
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Fetch user details by ID (authenticated users only)
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const userItem = await User.findById(req.params.id);
    if (!userItem) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      id: userItem._id,
      name: userItem.name,
      email: userItem.email,
      role: userItem.role,
      verified: userItem.verified,
      companyName: userItem.companyName,
      companyLogo: userItem.companyLogo,
      industry: userItem.industry,
      companyDescription: userItem.companyDescription,
      companyWebsite: userItem.companyWebsite,
      companyLocation: userItem.companyLocation,
      phone: userItem.phone,
      location: userItem.location
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user details.' });
  }
});


// --- ADMINISTRATOR MANAGEMENT PORTAL ---

// Statistics Counter
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSeekers = await User.countDocuments({ role: 'seeker' });
    const totalEmployers = await User.countDocuments({ role: 'employer' });
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalVerifiedCompanies = await User.countDocuments({ role: 'employer', verified: true });

    res.json({
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalJobs,
      totalApplications,
      totalVerifiedCompanies
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve platform stats.' });
  }
});

// Fetch all users list
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const list = await User.find({});
    const sanitized = list.map(userItem => {
      const u = userItem.toObject();
      delete u.password;
      return {
        ...u,
        id: u._id
      };
    });
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Modify user active/suspended state
app.put('/api/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (status !== 'active' && status !== 'suspended') {
    return res.status(400).json({ error: 'Suspension status must be active or suspended.' });
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User does not exist.' });
    }

    // Notify user if suspending
    if (status === 'suspended') {
      await Notification.create({
        userId: updated._id,
        message: 'Your account has been suspended by an administrator.',
        type: 'account_security'
      });
    }

    res.json({ 
      message: `User status changed to: ${status}`, 
      user: {
        ...updated.toObject(),
        id: updated._id
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to alter user status.' });
  }
});

// Delete user account
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const removedUser = await User.findByIdAndDelete(req.params.id);
    if (!removedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Cleanup dependencies in Mongo
    if (removedUser.role === 'employer') {
      const employerJobIds = await Job.find({ employerId: req.params.id }).select('_id');
      const jobIdsArr = employerJobIds.map(j => String(j._id));
      await Job.deleteMany({ employerId: req.params.id });
      await Application.deleteMany({ jobId: { $in: jobIdsArr } });
    } else if (removedUser.role === 'seeker') {
      await Application.deleteMany({ applicantId: req.params.id });
      await SavedJob.deleteMany({ userId: req.params.id });
      await Notification.deleteMany({ userId: req.params.id });
    }

    res.json({ message: 'Account and associated records deleted by Administrator.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Modify company verification badge state
app.put('/api/admin/companies/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  const { verified } = req.body;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Employer account not found.' });
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'employer' },
      { verified: !!verified },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Employer account not found.' });
    }

    // Send notification
    await Notification.create({
      userId: updated._id,
      message: `Your company account has been ${!!verified ? 'verified' : 'unverified'} by an administrator.`,
      type: 'account_status'
    });

    res.json({ 
      message: `Verification badge set to: ${!!verified}`, 
      user: {
        ...updated.toObject(),
        id: updated._id
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update verification state.' });
  }
});

// Fetch all jobs for administrative deletion list
app.get('/api/admin/jobs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const list = await Job.find({});
    res.json(list.map(job => ({
      ...job.toObject(),
      id: job._id
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs.' });
  }
});

// Delete job listing as Admin
app.delete('/api/admin/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    await Job.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ jobId: req.params.id });
    await SavedJob.deleteMany({ jobId: req.params.id });
    
    res.json({ message: 'Job posting deleted by Administrator.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job listing.' });
  }
});


// --- SOCKET.IO REAL-TIME ROUTING & ACTIVE USERS ---
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Socket user connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      onlineUsers.set(String(userId), socket.id);
      console.log(`User registered online: ${userId}`);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    }
  });

  socket.on('send-message', async (data) => {
    const { senderId, receiverId, content } = data;
    if (!senderId || !receiverId || !content) return;

    try {
      const newMsg = await Message.create({
        senderId,
        receiverId,
        content
      });

      // Emit to receiver if online
      const receiverSocket = onlineUsers.get(String(receiverId));
      if (receiverSocket) {
        io.to(receiverSocket).emit('receive-message', {
          ...newMsg.toObject(),
          id: newMsg._id
        });
      }

      // Emit back to sender
      socket.emit('receive-message', {
        ...newMsg.toObject(),
        id: newMsg._id
      });
    } catch (err) {
      console.error('Socket message save failed:', err);
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        console.log(`User went offline: ${uid}`);
        break;
      }
    }
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });
});


// Start backend server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
