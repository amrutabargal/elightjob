import express from 'express';
import Application from '../models/Application.js';
import { protect, requireVerified } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';
import { calculateSkillMatch, analyzeResume, parseResumeText } from '../services/aiService.js';

const router = express.Router();

router.use(protect);

// @route   POST /api/applications
router.post('/', requireVerified, uploadResume.single('resume'), async (req, res) => {
  try {
    const {
      jobId,
      jobTitle,
      company,
      location,
      salary,
      description,
      applyUrl,
      coverLetter,
    } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({ message: 'Job title and company are required' });
    }

    const applicationJobId = jobId || `manual-${Date.now()}`;

    const existing = await Application.findOne({
      user: req.user._id,
      jobId: applicationJobId,
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this role' });
    }

    const job = {
      id: applicationJobId,
      title: jobTitle,
      company,
      location: location || '',
      salary: salary || '',
      description: description || '',
      applyUrl: applyUrl || '',
      logo: null,
      source: 'portal',
    };

    const resumePath = req.file?.path || req.user.resumePath;
    const resumeOriginalName = req.file?.originalname || req.user.resumeOriginalName;

    if (!resumePath) {
      return res.status(400).json({ message: 'Please upload a resume' });
    }

    let resumeText = '';
    if (resumePath) {
      resumeText = await parseResumeText(resumePath);
    }

    const skillMatch = calculateSkillMatch(
      req.user.skills || [],
      job.description,
      job.title
    );
    const resumeAnalysis = analyzeResume(resumeText, req.user.skills || []);

    const application = await Application.create({
      user: req.user._id,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      companyLogo: job.logo,
      location: job.location,
      salary: job.salary,
      jobSource: job.source,
      applyUrl: job.applyUrl,
      resumePath,
      resumeOriginalName,
      coverLetter: coverLetter || '',
      skillMatchScore: skillMatch.score,
      atsScore: resumeAnalysis.atsScore,
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      application,
      skillMatch,
      resumeAnalysis,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/applications
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
