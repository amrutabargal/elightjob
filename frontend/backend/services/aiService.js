const COMMON_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'react', 'node', 'nodejs',
  'express', 'mongodb', 'sql', 'mysql', 'postgresql', 'aws', 'docker',
  'kubernetes', 'git', 'html', 'css', 'tailwind', 'angular', 'vue', 'nextjs',
  'django', 'flask', 'spring', 'rest', 'api', 'graphql', 'redis', 'linux',
  'agile', 'scrum', 'machine learning', 'ai', 'data science', 'excel',
  'communication', 'leadership', 'problem solving', 'c++', 'c#', '.net',
  'php', 'laravel', 'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin',
  'figma', 'ui', 'ux', 'testing', 'jest', 'cypress', 'selenium',
];

const extractSkills = (text) => {
  const lower = (text || '').toLowerCase();
  const found = new Set();

  for (const skill of COMMON_SKILLS) {
    if (lower.includes(skill)) found.add(skill);
  }

  const words = lower.match(/\b[a-z+#.]{2,20}\b/g) || [];
  for (const w of words) {
    if (w.length >= 3 && !['the', 'and', 'for', 'with', 'you', 'our'].includes(w)) {
      if (COMMON_SKILLS.some((s) => s.includes(w) || w.includes(s))) {
        found.add(w);
      }
    }
  }

  return [...found];
};

export const analyzeResume = (resumeText, userSkills = []) => {
  const text = resumeText || '';
  const detectedSkills = extractSkills(text);
  const allSkills = [...new Set([...detectedSkills, ...userSkills.map((s) => s.toLowerCase())])];

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  const hasExperience = /experience|worked|employed|years/i.test(text);
  const hasEducation = /education|degree|university|bachelor|master/i.test(text);
  const hasSkillsSection = /skills|technologies|proficiencies/i.test(text);

  let atsScore = 40;
  if (wordCount >= 200) atsScore += 15;
  if (wordCount >= 400) atsScore += 10;
  if (hasEmail) atsScore += 10;
  if (hasPhone) atsScore += 5;
  if (hasExperience) atsScore += 10;
  if (hasEducation) atsScore += 5;
  if (hasSkillsSection) atsScore += 5;
  if (allSkills.length >= 5) atsScore += 10;
  atsScore = Math.min(100, atsScore);

  const suggestions = [];
  if (!hasEmail) suggestions.push('Add a professional email address');
  if (!hasPhone) suggestions.push('Add a contact phone number');
  if (wordCount < 200) suggestions.push('Expand resume content (aim for 200+ words)');
  if (!hasSkillsSection) suggestions.push('Add a dedicated Skills section');
  if (allSkills.length < 5) suggestions.push('List more relevant technical skills');
  if (!hasExperience) suggestions.push('Include work experience details');

  return {
    atsScore,
    detectedSkills: allSkills.slice(0, 30),
    wordCount,
    suggestions,
    strengths: [
      hasEmail && 'Contact email present',
      hasExperience && 'Experience section detected',
      hasEducation && 'Education mentioned',
      allSkills.length >= 8 && 'Good skill coverage',
    ].filter(Boolean),
  };
};

export const calculateSkillMatch = (userSkills, jobDescription, jobTitle = '') => {
  const jobSkills = extractSkills(`${jobTitle} ${jobDescription}`);
  const normalizedUser = userSkills.map((s) => s.toLowerCase().trim());
  const normalizedJob = jobSkills.map((s) => s.toLowerCase().trim());

  if (normalizedJob.length === 0) {
    return { score: 50, matchedSkills: [], missingSkills: [], jobSkills: [] };
  }

  const matched = normalizedJob.filter((js) =>
    normalizedUser.some((us) => us.includes(js) || js.includes(us))
  );
  const missing = normalizedJob.filter((js) => !matched.includes(js));
  const score = Math.round((matched.length / normalizedJob.length) * 100);

  return {
    score: Math.min(100, score),
    matchedSkills: matched,
    missingSkills: missing.slice(0, 15),
    jobSkills: normalizedJob.slice(0, 20),
  };
};

export const recommendJobs = (jobs, userSkills, limit = 10) => {
  return jobs
    .map((job) => {
      const match = calculateSkillMatch(
        userSkills,
        job.description || '',
        job.title || ''
      );
      return { ...job, matchScore: match.score, matchedSkills: match.matchedSkills };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

export const parseResumeText = async (filePath) => {
  try {
    const fs = await import('fs');
    const ext = filePath.toLowerCase();

    if (ext.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || '';
    }

    if (ext.endsWith('.txt')) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    return '';
  } catch {
    return '';
  }
};
