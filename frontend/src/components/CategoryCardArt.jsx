export function SavingsArt() {
  return (
    <svg viewBox="0 0 160 100" className="ep-card-art" aria-hidden>
      <ellipse cx="118" cy="78" rx="22" ry="6" fill="#b45309" opacity="0.25" />
      <ellipse cx="118" cy="70" rx="20" ry="5.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
      <text x="118" y="73" textAnchor="middle" fill="#92400e" fontSize="11" fontWeight="700">
        $
      </text>
      <ellipse cx="132" cy="62" rx="16" ry="4.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
      <ellipse cx="104" cy="58" rx="14" ry="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
      <rect x="38" y="28" width="48" height="58" rx="6" fill="#22c55e" opacity="0.85" />
      <rect x="44" y="34" width="36" height="44" rx="3" fill="#dcfce7" />
      <path d="M48 42h28M48 50h22M48 58h26" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CreditArt() {
  return (
    <svg viewBox="0 0 160 100" className="ep-card-art" aria-hidden>
      <path
        d="M72 88 C58 88 46 76 42 62 C40 52 44 44 52 40 L58 38 C64 34 70 36 74 42 L78 50 L82 42 C88 34 98 34 104 42 L108 52 C112 70 100 88 82 90 Z"
        fill="#f5c4a0"
        stroke="#e8a87c"
        strokeWidth="1"
      />
      <rect x="32" y="18" width="70" height="44" rx="5" fill="#22c55e" transform="rotate(-14 67 40)" />
      <rect x="48" y="14" width="70" height="44" rx="5" fill="#eab308" transform="rotate(-2 83 36)" />
      <rect x="64" y="16" width="70" height="44" rx="5" fill="#3b82f6" transform="rotate(10 99 38)" />
    </svg>
  );
}

export function DematArt() {
  return (
    <svg viewBox="0 0 160 100" className="ep-card-art" aria-hidden>
      <rect x="44" y="58" width="16" height="28" rx="2" fill="#ef4444" />
      <rect x="64" y="48" width="16" height="38" rx="2" fill="#3b82f6" />
      <rect x="84" y="38" width="16" height="48" rx="2" fill="#eab308" />
      <rect x="104" y="28" width="16" height="58" rx="2" fill="#22c55e" />
      <path
        d="M40 72 L64 56 L88 48 L112 32 L128 22"
        fill="none"
        stroke="#16a34a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polygon points="128,22 122,30 134,26" fill="#16a34a" />
    </svg>
  );
}
