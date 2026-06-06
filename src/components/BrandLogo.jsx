import { Link } from "react-router-dom";

export default function BrandLogo({ className = "", imageClassName = "" }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="GOOD Coaching home">
      <img
        src="/brand/good_coaching_logo.png"
        alt="GOOD Coaching"
        className={`h-12 w-auto object-contain ${imageClassName}`}
      />
    </Link>
  );
}