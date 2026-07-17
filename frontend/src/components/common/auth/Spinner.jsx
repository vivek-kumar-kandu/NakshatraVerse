// Small inline spinner for in-button loading states. Reuses the project's
// existing global `spin` keyframe (see styles/global.css) via the
// `.auth-spinner` class defined in AuthLocalStyles — no new global CSS.
function Spinner({ size = 16 }) {
  return (
    <svg
      className="auth-spinner"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default Spinner;
