// Five stars filled according to the rating (e.g. 4.3 -> 4 filled stars).
export default function Stars({ rating = 0, className = "" }) {
  const value = Number(rating) || 0;
  const full = Math.round(value);
  return (
    <span className={`text-sm tracking-[1px] text-[#d1d5db] ${className}`} aria-label={`${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i < full ? "text-[#f59e0b]" : ""}>★</span>
      ))}
      <small className="ml-1.5 text-xs tracking-normal text-muted">{value.toFixed(1)}</small>
    </span>
  );
}
