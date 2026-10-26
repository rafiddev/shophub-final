export default function Avatar({ user, className = "size-[30px] text-sm", alt = "" }) {
  if (user.photoURL) {
    return <img className={`rounded-full object-cover ${className}`} src={user.photoURL} alt={alt} referrerPolicy="no-referrer" />;
  }
  const letter = (user.displayName || user.email || "U").charAt(0).toUpperCase();
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-brand font-semibold text-white ${className}`}>
      {letter}
    </span>
  );
}
