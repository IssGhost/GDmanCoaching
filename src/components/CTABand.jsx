export default function CTABand() {
  return (
    <section className="bg-emerald-600 py-6">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
        <h3 className="text-center text-lg font-semibold text-white sm:text-left">Ready for online pickleball feedback?</h3>
        <div className="flex gap-3">
          <a href="/coaches" className="rounded-md bg-white px-4 py-2 font-medium text-emerald-700">Browse Coaches</a>
          <a href="/coach-signup" className="rounded-md border border-white/70 px-4 py-2 text-white">Become a Coach</a>
        </div>
      </div>
    </section>
  );
}
