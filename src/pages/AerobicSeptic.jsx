import { Link } from "react-router-dom";

export default function AerobicSeptic() {
  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="pp-kicker">Online coaching</p>
        <h1 className="mt-3 text-4xl font-black text-[#12372a] md:text-6xl">Video reviews and personalized pickleball guidance.</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-[#5f746c]">Browse coaches who can review your footage, explain priorities, and build a focused improvement plan.</p>
        <Link to="/coaches" className="pp-btn-primary mt-8 inline-flex px-6 py-3">Browse Coaches</Link>
      </section>
    </div>
  );
}
