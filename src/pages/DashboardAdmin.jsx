import { Link } from "react-router-dom";

const adminCards = [
  { title: "Coaching Marketplace", text: "Approve coaches, monitor video submissions, and audit coaching records.", to: "/admin/coaching", cta: "Manage Coaching" },
  { title: "Support Requests", text: "Review contact forms and platform support requests.", to: "/admin/requests", cta: "Open Requests" },
  { title: "Quotes", text: "Approve quotes, reject requests, and save estimates.", to: "/admin/quotes", cta: "Manage Quotes" },
  { title: "Orders", text: "Track order/payment status for customer parts and invoices.", to: "/admin/orders", cta: "Manage Orders" },
  { title: "Blog Posts", text: "Publish home page service tips and field notes.", to: "/admin/blog", cta: "Manage Blog" },
  { title: "Testimonials", text: "Add reviews that appear on the home page.", to: "/admin/testimonials", cta: "Manage Reviews" },
  { title: "Users", text: "Promote staff accounts and manage customer access.", to: "/admin/users", cta: "Manage Users" },
  { title: "Database Viewer", text: "See recent MongoDB records from every saved Railway collection.", to: "/admin/database", cta: "View Database" },
];

export default function DashboardAdmin() {
  return (
    <div className="min-h-screen bg-black px-6 pt-32 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Admin command center</p>
            <h1 className="mt-2 text-4xl font-extrabold">GOOD Coaching Operations</h1>
            <p className="mt-3 max-w-3xl text-gray-300">
              Manage coaches, video submissions, users, support requests, home page content, and testimonials from one polished control area.
            </p>
          </div>
          <div className="rounded-2xl border border-[#00a896]/20 bg-[#d9f7fb] p-5 text-[#12372a]">
            <h2 className="font-black">Production operations</h2>
            <p className="mt-2 text-sm leading-6 text-[#40584f]">Review new coaches, support requests, payments, and customer activity regularly. Use individual administrator accounts and never share passwords.</p>
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


      </div>
    </div>
  );
}
