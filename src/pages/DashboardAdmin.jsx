import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

const adminCards = [
  { title: "Coaching Marketplace", text: "Approve coaches, monitor video submissions, and audit payout splits.", to: "/admin/coaching", cta: "Manage Coaching" },
  { title: "Support Requests", text: "Review contact forms and platform support requests.", to: "/admin/requests", cta: "Open Requests" },
  { title: "Quotes", text: "Approve quotes, reject requests, and save estimates.", to: "/admin/quotes", cta: "Manage Quotes" },
  { title: "Orders", text: "Track order/payment status for customer parts and invoices.", to: "/admin/orders", cta: "Manage Orders" },
  { title: "Blog Posts", text: "Publish home page service tips and field notes.", to: "/admin/blog", cta: "Manage Blog" },
  { title: "Testimonials", text: "Add reviews that appear on the home page.", to: "/admin/testimonials", cta: "Manage Reviews" },
  { title: "Users", text: "Promote staff accounts and manage customer access.", to: "/admin/users", cta: "Manage Users" },
  { title: "Database Viewer", text: "See recent MongoDB records from every saved Railway collection.", to: "/admin/database", cta: "View Database" },
];

export default function DashboardAdmin() {
  const { push } = useToast();
  const [seeding, setSeeding] = useState(false);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const result = await api.post("/demo/seed", {});
      push(`Demo customer ready: ${result.customer.email} / ${result.customer.password}`, "success");
    } catch (e) {
      push(e.message || "Failed to seed demo data", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 pt-32 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Admin command center</p>
            <h1 className="mt-2 text-4xl font-extrabold">PicklePro Coach Operations</h1>
            <p className="mt-3 max-w-3xl text-gray-300">
              Manage coaches, video submissions, payment splits, users, support requests, home page content, and testimonials from one polished control area.
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-5">
            <h2 className="font-bold text-amber-100">Demo test kit</h2>
            <p className="mt-2 text-sm text-amber-50/80">
              Creates demo data for live testing. The coaching workflow can also be tested by creating a coach profile and booking a package in demo checkout mode.
            </p>
            <button
              onClick={seedDemo}
              disabled={seeding}
              className="mt-4 rounded-md bg-amber-300 px-4 py-2 font-bold text-black hover:bg-amber-200 disabled:opacity-60"
            >
              {seeding ? "Creating..." : "Seed Demo Data"}
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => (
            <div key={card.to} className="rounded-lg border border-white/10 bg-zinc-950 p-6">
              <h2 className="text-xl font-bold">{card.title}</h2>
              <p className="mt-2 min-h-12 text-gray-400">{card.text}</p>
              <Link to={card.to} className="mt-5 inline-block rounded-md bg-emerald-500 px-5 py-2 font-bold text-black hover:bg-emerald-400">
                {card.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-xl font-bold">Temporary logins</h2>
          <div className="mt-4 grid gap-4 text-sm text-gray-300 md:grid-cols-2">
            <div className="rounded-md bg-white/[0.03] p-4">
              <div className="font-semibold text-white">Admin</div>
              <div>Username: admin</div>
              <div>Password: admin</div>
            </div>
            <div className="rounded-md bg-white/[0.03] p-4">
              <div className="font-semibold text-white">Demo customer</div>
              <div>Username: customer</div>
              <div>Password: customer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
