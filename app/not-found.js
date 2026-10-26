import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap pt-7 pb-16">
      <div className="notice">
        <h1 className="page-title">Page not found</h1>
        <p>The page you are looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
