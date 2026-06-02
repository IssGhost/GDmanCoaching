import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function CustomQuoteStep3() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const type = params.get("type");
  const service = params.get("service");

  const [form, setForm] = useState({
    size: "",
    usage: "",
    name: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Quote submitted!\n${JSON.stringify({ type, service, ...form }, null, 2)}`);
  };

  return (
    <motion.div
      className="min-h-screen bg-black flex items-center justify-center text-white"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-xl w-full bg-gray-900 p-10 rounded-xl shadow-lg"
      >
        <h1 className="text-3xl font-bold mb-6">Enter Your Details</h1>
        <p className="mb-6">Type: {type} | Service: {service}</p>

        <input
          type="text"
          name="size"
          placeholder="System Size (e.g. 500 gallons)"
          value={form.size}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded bg-gray-800"
        />
        <input
          type="text"
          name="usage"
          placeholder="Usage (household/business)"
          value={form.usage}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded bg-gray-800"
        />
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded bg-gray-800"
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded bg-gray-800"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full mb-6 p-3 rounded bg-gray-800"
        />

        <button type="submit" className="w-full bg-green-600 py-3 rounded hover:bg-green-700">
          Submit Quote
        </button>
      </form>
    </motion.div>
  );
}
