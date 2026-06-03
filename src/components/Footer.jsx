import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-0 border-t border-[#12372a]/10 bg-[#fff8e7] text-[#5f746c]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <Link to="/" aria-label="GOOD Coaching home"><img src="/good-coaching-logo.svg" alt="GOOD Coaching" className="mb-4 h-14 w-auto rounded-2xl shadow-lg shadow-lime-200/40" /></Link>
          <p className="max-w-xs text-sm leading-relaxed">
            Online pickleball coaching with private video submissions, timestamped feedback, coach profiles, DUPR details, and player dashboards.
          </p>
        </div>
        <div>
          <h3 className="mb-4 font-black text-[#12372a]">Platform</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li><Link to="/" className="hover:text-[#00a896]">Home</Link></li>
            <li><Link to="/coaches" className="hover:text-[#00a896]">Coaches</Link></li>
            <li><Link to="/services" className="hover:text-[#00a896]">Training Options</Link></li>

          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-black text-[#12372a]">Accounts</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li><Link to="/signup" className="hover:text-[#00a896]">Player Signup</Link></li>
            <li><Link to="/coach-signup" className="hover:text-[#00a896]">Coach Signup</Link></li>
            <li><Link to="/dashboard/submissions" className="hover:text-[#00a896]">Player Dashboard</Link></li>
            <li><Link to="/coach/dashboard" className="hover:text-[#00a896]">Coach Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-black text-[#12372a]">Social</h3>
          <p className="text-sm">Add your coaching brand links here before launch.</p>
          <div className="mt-5 flex gap-3">
            <a href="#" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-[#12372a]/10 bg-white/60 text-[#12372a] hover:text-[#00a896]"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-[#12372a]/10 bg-white/60 text-[#12372a] hover:text-[#00a896]"><FaInstagram /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-[#12372a]/10 px-6 py-5 text-center text-sm text-[#5f746c]">
        Copyright {new Date().getFullYear()} GOOD Coaching. All rights reserved.
      </div>
    </footer>
  );
}