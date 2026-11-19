import { Link } from "react-router-dom";
export default function NotFound() { return <div className="error-state"><img src="/lotus-logo.png" alt="Lotus" /><h1>Page not found</h1><p>The page you are looking for does not exist.</p><Link to="/login">Go to sign in</Link></div>; }
