/** Job fields / categories for pan-India live search */
export const JOB_CATEGORIES = [
  { id: 'all', label: 'All Fields', keywords: [] },
  { id: 'data-entry', label: 'Data Entry', keywords: ['data entry', 'data-entry', 'typist', 'typing', 'data operator'] },
  { id: 'back-office', label: 'Back Office', keywords: ['back office', 'back-office', 'backoffice', 'office assistant', 'office executive'] },
  { id: 'admin', label: 'Admin / Clerical', keywords: ['admin', 'administrative', 'clerk', 'clerical', 'office admin', 'receptionist'] },
  { id: 'accounting', label: 'Accounting / Finance', keywords: ['accountant', 'accounting', 'finance', 'bookkeeping', 'tally', 'gst'] },
  { id: 'hr', label: 'HR / Recruitment', keywords: ['human resources', ' hr ', 'recruiter', 'recruitment', 'talent acquisition'] },
  { id: 'sales', label: 'Sales / Business', keywords: ['sales', 'business development', 'bdm', 'field sales', 'telesales'] },
  { id: 'customer-support', label: 'Customer Support / BPO', keywords: ['customer support', 'call center', 'bpo', 'customer service', 'telecaller', 'voice process'] },
  { id: 'operations', label: 'Operations / Logistics', keywords: ['operations', 'logistics', 'supply chain', 'warehouse', 'inventory'] },
  { id: 'it', label: 'IT / Software', keywords: ['software', 'developer', 'programmer', 'it support', 'web developer', 'full stack'] },
  { id: 'marketing', label: 'Marketing / Content', keywords: ['marketing', 'digital marketing', 'content writer', 'seo', 'social media'] },
  { id: 'healthcare', label: 'Healthcare / Nursing', keywords: ['nurse', 'nursing', 'medical', 'pharma', 'healthcare', 'hospital'] },
  { id: 'education', label: 'Education / Teaching', keywords: ['teacher', 'teaching', 'tutor', 'education', 'faculty', 'professor'] },
  { id: 'engineering', label: 'Engineering / Technical', keywords: ['engineer', 'mechanical', 'electrical', 'civil engineer', 'technician'] },
  { id: 'retail', label: 'Retail / Store', keywords: ['retail', 'store manager', 'cashier', 'shop assistant', 'merchandiser'] },
];

/** Categories used when fetching live jobs for All India (no user filter) */
export const PAN_INDIA_FETCH_CATEGORIES = JOB_CATEGORIES.filter((c) => c.id !== 'all');

export const detectJobCategory = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  for (const cat of PAN_INDIA_FETCH_CATEGORIES) {
    if (cat.keywords.some((kw) => text.includes(kw.trim()))) {
      return cat.label;
    }
  }
  return 'General';
};

export const getCategoryById = (id) =>
  JOB_CATEGORIES.find((c) => c.id === id) || JOB_CATEGORIES[0];
