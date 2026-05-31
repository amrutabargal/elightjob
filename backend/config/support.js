export const SUPPORT_NAME = process.env.SUPPORT_NAME || 'Ashok Kumar';
export const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '7498115939';
export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || 'eliteplacementhubhiring@gmail.com';

export function formatPhoneDisplay(phone = SUPPORT_PHONE) {
  const d = String(phone).replace(/\D/g, '');
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return phone;
}

export function emailFooterHtml() {
  return `
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px" />
    <p style="color:#64748b;font-size:13px;margin:0">
      Need help? Contact <strong>${SUPPORT_NAME}</strong><br/>
      📧 <a href="mailto:${SUPPORT_EMAIL}" style="color:#ea580c">${SUPPORT_EMAIL}</a><br/>
      📞 <a href="tel:+91${SUPPORT_PHONE}" style="color:#ea580c">${formatPhoneDisplay()}</a>
    </p>
  `;
}
