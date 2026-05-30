/** Major Indian cities for pan-India job search */
export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Kochi',
  'Indore',
  'Bhopal',
  'Nagpur',
  'Surat',
  'Visakhapatnam',
  'Patna',
  'Bhubaneswar',
  'Coimbatore',
  'Noida',
  'Gurgaon',
  'Thiruvananthapuram',
  'Vadodara',
  'Ludhiana',
  'Guwahati',
  'Mysore',
  'Mangalore',
  'Raipur',
  'Ranchi',
  'Dehradun',
  'Agra',
  'Varanasi',
  'Kanpur',
  'Nashik',
  'Goa',
];

export const isAllIndia = (location) => {
  if (!location || !String(location).trim()) return true;
  const q = String(location).trim().toLowerCase();
  return (
    q === 'all' ||
    q === 'all india' ||
    q === 'india' ||
    q === 'pan india' ||
    q === 'anywhere'
  );
};
