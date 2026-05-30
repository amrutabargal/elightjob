import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';
import { analyzeResume, parseResumeText } from '../services/aiService.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/users/profile
router.get('/profile', (req, res) => {
  res.json({ user: req.user.toJSON() });
});

// @route   PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const { name, dateOfBirth, gender, mobile, email, address, skills, experience, location } =
      req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (!Number.isNaN(dob.getTime())) user.dateOfBirth = dob;
    }
    if (gender && ['Male', 'Female', 'Other'].includes(gender)) user.gender = gender;
    if (mobile) {
      const phone = String(mobile).replace(/\D/g, '');
      if (/^[6-9]\d{9}$/.test(phone)) {
        const taken = await User.findOne({ mobile: phone, _id: { $ne: user._id } });
        if (taken) return res.status(400).json({ message: 'Mobile number already in use' });
        user.mobile = phone;
      }
    }
    if (email) {
      const emailLower = email.toLowerCase().trim();
      const taken = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ message: 'Email already in use' });
      user.email = emailLower;
    }
    if (address !== undefined) user.address = String(address).trim();
    if (experience !== undefined) user.experience = experience;
    if (location !== undefined) user.location = location;
    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    await user.save();
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/users/resume
router.post('/resume', uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file' });
    }

    const user = await User.findById(req.user._id);
    user.resumePath = req.file.path;
    user.resumeOriginalName = req.file.originalname;
    await user.save();

    const resumeText = await parseResumeText(req.file.path);
    const analysis = analyzeResume(resumeText, user.skills || []);

    res.json({
      message: 'Resume uploaded successfully',
      resumeOriginalName: user.resumeOriginalName,
      analysis,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/users/saved-jobs/:jobId
router.post('/saved-jobs/:jobId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { jobId } = req.params;

    if (!user.savedJobs.includes(jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }

    res.json({ savedJobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/users/saved-jobs/:jobId
router.delete('/saved-jobs/:jobId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedJobs = user.savedJobs.filter((id) => id !== req.params.jobId);
    await user.save();
    res.json({ savedJobs: user.savedJobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
