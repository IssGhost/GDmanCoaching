import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function CustomQuoteStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const type = new URLSearchParams(location.search).get("type");

  const options = [
    "Septic System Installation",
    "Aerobic System Setup",
    "Repairs / Maintenance",
  ];

  return (
    <motion.div
      className="min-h-screen bg-black flex items-center justify-center text-white"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-lg w-full bg-gray-900 p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-8">Select Installation</h1>
        <div className="space-y-4">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() =>
                navigate(`/quote/step3?type=${type}&service=${encodeURIComponent(opt)}`)
              }
              className="block w-full bg-green-600 py-3 rounded hover:bg-green-700"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
