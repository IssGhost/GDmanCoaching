export default function CTABand() {
  return (
    <section className="py-6 bg-emerald-600">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <h3 className="text-white text-lg font-semibold text-center sm:text-left">
          Need a pump-out or emergency repair today?
        </h3>
        <div className="flex gap-3">
          <a
            href="tel:2812520777"
            className="px-4 py-2 rounded-md bg-white text-emerald-700 font-medium"
          >
            Call 281-252-0777
          </a>
          <a
            href="/contact"
            className="px-4 py-2 rounded-md border border-white/70 text-white"
          >
            Request Service
          </a>
        </div>
      </div>
    </section>
  );
}
