import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { uploadResume, uploadPhoto } from '../middleware/upload.js';
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

// @route   POST /api/users/photo
router.post('/photo', uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a photo (JPG, PNG, or WEBP)' });
    }

    const user = await User.findById(req.user._id);
    user.profilePhotoPath = req.file.path;
    user.profilePhotoOriginalName = req.file.originalname;
    await user.save();

    res.json({
      message: 'Profile photo updated',
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/users/change-password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
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
