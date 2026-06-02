import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CustomQuoteStep1() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="min-h-screen bg-black flex items-center justify-center text-white"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-lg w-full bg-gray-900 p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-8">Get a Quote</h1>
        <p className="mb-6">Are you a business or a consumer?</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/quote/step2?type=business")}
            className="bg-green-600 px-6 py-3 rounded hover:bg-green-700"
          >
            Business
          </button>
          <button
            onClick={() => navigate("/quote/step2?type=consumer")}
            className="bg-green-600 px-6 py-3 rounded hover:bg-green-700"
          >
            Consumer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
