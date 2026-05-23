/**
 * Google Material Symbols Outlined
 * https://fonts.google.com/icons
 */
export default function Icon({ name, className = '', size = 22, filled = false }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
