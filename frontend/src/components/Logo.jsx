import Icon from './Icon';
import { BRAND_SHORT } from '../config/brand';

export default function Logo({ size = 'md', light = false }) {
  const sizes = {
    sm: { box: 'w-9 h-9', icon: 22, text: 'text-base' },
    md: { box: 'w-10 h-10', icon: 24, text: 'text-lg' },
    lg: { box: 'w-12 h-12', icon: 28, text: 'text-xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${s.box} rounded-xl bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40`}
      >
        <Icon name="work" size={s.icon} className="text-white" filled />
      </div>
      <span
        className={`font-extrabold tracking-tight ${s.text} ${
          light ? 'text-white' : 'text-slate-900'
        } logo-brand-full`}
      >
        {BRAND_SHORT}
      </span>
      <span
        className={`font-extrabold tracking-tight ${s.text} logo-brand-short ${
          light ? 'text-white' : 'text-slate-900'
        }`}
      >
        Elite Hub
      </span>
    </div>
  );
}
