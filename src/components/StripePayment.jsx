import { useState } from "react";
import confetti from "canvas-confetti";

export default function StripePayment({ invoiceNumber = "", amount = "", customerName = "" }) {
  const [status, setStatus] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardLast4, setCardLast4] = useState("");

  const launchConfetti = () => {
    const end = Date.now() + 1200;
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("Processing secure payment...");
    setTimeout(() => {
      setStatus("Payment successful. Confirmation recorded for this invoice.");
      launchConfetti();
    }, 900);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <div className="rounded-md border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
        <div className="flex justify-between gap-4">
          <span>Paying</span>
          <span className="text-right font-semibold text-white">{customerName || "Customer"}</span>
        </div>
        <div className="mt-2 flex justify-between gap-4">
          <span>Invoice</span>
          <span className="text-right font-semibold text-white">{invoiceNumber || "Account balance"}</span>
        </div>
        {amount && (
          <div className="mt-2 flex justify-between gap-4">
            <span>Amount</span>
            <span className="text-right font-semibold text-emerald-300">${Number(amount).toFixed(2)}</span>
          </div>
        )}
      </div>

      <input
        value={cardName}
        onChange={(e) => setCardName(e.target.value)}
        className="w-full rounded-md border border-white/10 bg-zinc-900 p-3"
        placeholder="Name on card"
        required
      />
      <input
        value={cardLast4}
        onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        className="w-full rounded-md border border-white/10 bg-zinc-900 p-3"
        placeholder="Last 4 digits for demo receipt"
        required
      />

      <button className="w-full rounded-md bg-emerald-500 px-6 py-3 font-bold text-black transition hover:bg-emerald-400">
        Pay Bill
      </button>
      <p className="text-xs text-gray-500">
        Demo checkout only. Connect a live Stripe publishable key and payment intent endpoint before accepting real payments.
      </p>
      {status && <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-300">{status}</p>}
    </form>
  );
}
