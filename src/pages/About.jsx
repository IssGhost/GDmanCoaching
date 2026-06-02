import { motion } from "framer-motion";
import { FaUsers, FaClock, FaHandshake, FaShieldAlt, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function About() {
  const features = [
    { icon: <FaUsers />, title: "Experienced Technicians", desc: "Decades of field work across septic and aerobic systems." },
    { icon: <FaClock />, title: "Responsive Service", desc: "Emergency calls and practical scheduling when the system cannot wait." },
    { icon: <FaHandshake />, title: "Straight Answers", desc: "Clear recommendations, no scare tactics, and work we can stand behind." },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <section className="px-6 pt-36 pb-12 text-center">
        <motion.h1
          className="text-4xl font-extrabold text-white md:text-5xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          About Big Papa Joe Septic
        </motion.h1>
        <motion.p
          className="mx-auto mt-4 max-w-3xl text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          For more than 25 years, Big Papa Joe Septic has helped Texas homeowners and businesses keep systems moving with reliable service, careful workmanship, and honest communication.
        </motion.p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {[
            { icon: <FaShieldAlt />, label: "Licensed & Insured" },
            { icon: <FaStar />, label: "Local Reputation" },
            { icon: <FaClock />, label: "Same-Day Options" },
          ].map((b) => (
            <span key={b.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-gray-200">
              <span className="text-emerald-400">{b.icon}</span>
              {b.label}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg border border-white/10 bg-zinc-950 p-6 text-center"
          >
            <div className="mb-3 flex justify-center text-3xl text-emerald-400">{f.icon}</div>
            <h3 className="text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-gray-400">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 md:grid-cols-2 md:items-center">
        <img src="/images/IMG_0795.JPG" alt="Big Papa Joe Septic job site" className="h-80 w-full rounded-lg object-cover" />
        <div className="rounded-lg border border-white/10 bg-zinc-950 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white">Our Story</h2>
          <p className="mt-3 leading-relaxed text-gray-300">
            The company grew through repeat calls and referrals: show up, explain the issue, fix it correctly, and leave the property respected. Today the team supports pump-outs, inspections, emergency repairs, aerobic maintenance, and full installs.
          </p>
          <Link to="/contact" className="mt-6 inline-block rounded-md bg-emerald-500 px-5 py-3 font-bold text-black hover:bg-emerald-400">
            Request Service
          </Link>
        </div>
      </section>
    </div>
  );
}
