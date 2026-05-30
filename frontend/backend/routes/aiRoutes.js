import express from 'express';
import { protect } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';
import {
  analyzeResume,
  parseResumeText,
  calculateSkillMatch,
} from '../services/aiService.js';
import User from '../models/User.js';

const router = express.Router();

router.use(protect);

// @route   POST /api/ai/resume-analyzer
router.post('/resume-analyzer', uploadResume.single('resume'), async (req, res) => {
  try {
    let resumeText = '';

    if (req.file) {
      resumeText = await parseResumeText(req.file.path);
    } else if (req.user.resumePath) {
      resumeText = await parseResumeText(req.user.resumePath);
    } else {
      return res.status(400).json({ message: 'Please upload a resume or add one to your profile' });
    }

    const user = await User.findById(req.user._id);
    const analysis = analyzeResume(resumeText, user.skills || []);

    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/ai/skill-match
router.post('/skill-match', async (req, res) => {
  try {
    const { jobDescription, jobTitle } = req.body;
    const user = await User.findById(req.user._id);

    const match = calculateSkillMatch(
      user.skills || [],
      jobDescription || '',
      jobTitle || ''
    );

    res.json({ match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/ai/recommended
router.get('/recommended', async (_req, res) => {
  res.json({ jobs: [] });
});

export default router;
