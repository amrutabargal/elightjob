export const SUPPORT_NAME = 'Ashok Kumar';
export const SUPPORT_PHONE = '7498115939';
export const SUPPORT_EMAIL = 'Eliteplacementhubhiring@gmail.com';

export function formatPhoneDisplay() {
  return `+91 ${SUPPORT_PHONE.slice(0, 5)} ${SUPPORT_PHONE.slice(5)}`;
}

export const CONTACT_LINKS = {
  name: SUPPORT_NAME,
  phone: SUPPORT_PHONE,
  phoneDisplay: formatPhoneDisplay(),
  phoneTel: `tel:+91${SUPPORT_PHONE}`,
  email: SUPPORT_EMAIL,
  mailto: `mailto:${SUPPORT_EMAIL}`,
};
