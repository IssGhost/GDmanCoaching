import PrimaryButton from "../components/PrimaryButton";

export default function Landing() {
  return (
    <div className="relative h-screen">
      <video
        src="/images/drone video.mp4"
        poster="/images/hero.jpg"
        autoPlay
        muted
        loop
        playsInline
        className="absolute h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-6 text-center text-white">
        <h1 className="text-5xl font-bold md:text-6xl">Big Papa Joe Septic</h1>
        <p className="mt-6 max-w-xl text-xl">Professional aerobic and septic service with 25+ years of field experience.</p>
        <div className="mt-8">
          <PrimaryButton href="/">Enter Website</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
