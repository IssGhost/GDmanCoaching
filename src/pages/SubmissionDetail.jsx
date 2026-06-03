import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaClipboardList,
  FaCloudUploadAlt,
  FaExternalLinkAlt,
  FaPlay,
  FaSave,
  FaVideo,
} from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getDemoSubmission, normalizePhase } from "../lib/demoData";

function formatTime(seconds = 0) {
  const s = Math.max(0, Number(seconds || 0));
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function nextPhaseStatus(status) {
  const phase = normalizePhase(status);
  if (phase === "awaiting_upload") return "Awaiting Upload";
  if (phase === "ready_for_review") return "Ready For Coach Review";
  return "Reviewed";
}

export default function SubmissionDetail() {
  const { id } = useParams();
  const location = useLocation();
  const requestedPhase = useMemo(() => new URLSearchParams(location.search).get("phase") || "", [location.search]);
  const { token } = useAuth();
  const { push } = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try {
      const result = await api.get(`/videos/submissions/${id}`, token);

      /*
        If the live API returns something, respect it.
        If it returns incomplete data, the requested phase still protects the demo.
      */
      if (result?.submission) {
        const livePhase = normalizePhase(requestedPhase || result.submission.phase || result.submission.status);
        setData({
          ...result,
          submission: { ...result.submission, phase: livePhase, status: result.submission.status || livePhase },
        });
      } else {
        setData(getDemoSubmission(id, requestedPhase));
      }
    } catch (err) {
      setError(err.message || "Live submission could not load. Showing demo fallback.");
      setData(getDemoSubmission(id, requestedPhase));
    }
  };

  useEffect(() => {
    load();
  }, [id, token, requestedPhase]);

  const createUpload = async () => {
    setBusy(true);
    try {
      const result = await api.post(`/videos/submissions/${id}/upload-url`, {}, token);
      setData((d) => ({ ...d, submission: result.submission }));
      if (result.provider === "cloudflare") {
        push("Direct upload URL created. Open it to upload the video file.", "success");
        window.open(result.uploadUrl, "_blank", "noopener,noreferrer");
      } else {
        push("Demo upload mode active. Paste an external video URL below and save it.", "success");
      }
    } catch {
      setData((d) => ({ ...d, submission: { ...d.submission, status: "awaiting_upload", phase: "awaiting_upload" } }));
      push("Demo upload mode active. Paste a private video URL below and save it.", "success");
    } finally {
      setBusy(false);
    }
  };

  const saveVideo = async () => {
    if (!videoUrl.trim()) return push("Paste a video URL first.", "error");
    const duration = Number(durationMinutes || 0);
    if (duration > 15) return push("Videos must be 15 minutes or shorter. Please trim your clip and upload again.", "error");

    setBusy(true);
    try {
      const row = await api.put(`/videos/submissions/${id}/video`, { videoUrl, durationSeconds: duration ? duration * 60 : undefined, status: "ready_for_review" }, token);
      setData((d) => ({ ...d, submission: { ...row, phase: "ready_for_review" } }));
      setVideoUrl("");
      setDurationMinutes("");
      push("Video marked ready for coach review.", "success");
    } catch {
      setData((d) => ({
        ...d,
        submission: { ...d.submission, videoUrl, status: "ready_for_review", phase: "ready_for_review" },
        review: null,
      }));
      setVideoUrl("");
      setDurationMinutes("");
      push("Saved in demo mode. This is now the Ready For Review phase.", "success");
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="text-[#5f746c]">Loading training submission...</div>;

  const { submission, review } = data;
  const phase = normalizePhase(requestedPhase || submission.phase || submission.status);
  const videoSrc = submission.videoUrl || (submission.playbackId ? `https://iframe.videodelivery.net/${submission.playbackId}` : "");

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-[#ffd166]/50 bg-[#fff1c7]/75 p-4 text-sm font-bold text-[#5f746c]">{error}</div>}

      <WorkflowStepper phase={phase} />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Link to="/dashboard/submissions" className="text-sm font-black text-[#087f73] hover:underline">← Back to Training + Reviews</Link>
          <div className="mt-3 inline-flex rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-black text-[#5f746c]">
            Online video coaching
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#12372a]">{submission.title}</h1>
          <p className="mt-1 text-[#5f746c]">{submission.packageId?.title || "Coaching package"} with {submission.coachId?.displayName || "Coach"}</p>
        </div>
        <span className="rounded-full bg-[#c6ff4a] px-4 py-2 text-sm font-black text-[#12372a]">{nextPhaseStatus(phase)}</span>
      </div>

      {phase === "awaiting_upload" && (
        <AwaitingUploadPage
          submission={submission}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          busy={busy}
          createUpload={createUpload}
          saveVideo={saveVideo}
        />
      )}

      {phase === "ready_for_review" && (
        <ReadyForReviewPage submission={submission} videoSrc={videoSrc} />
      )}

      {phase === "reviewed" && (
        <ReviewedPage submission={submission} review={review} videoSrc={videoSrc} />
      )}
    </div>
  );
}

function WorkflowStepper({ phase }) {
  const steps = [
    { key: "awaiting_upload", label: "1. Awaiting Upload", icon: <FaCloudUploadAlt /> },
    { key: "ready_for_review", label: "2. Ready For Review", icon: <FaClipboardList /> },
    { key: "reviewed", label: "3. Reviewed", icon: <FaCheckCircle /> },
  ];

  const index = steps.findIndex((s) => s.key === phase);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step, i) => (
        <div
          key={step.key}
          className={`rounded-3xl border p-4 shadow-sm ${
            i === index
              ? "border-[#00a896]/25 bg-[#d9f7fb]/75"
              : i < index
                ? "border-[#c6ff4a]/40 bg-[#fff1c7]/65"
                : "border-[#12372a]/10 bg-white/65"
          }`}
        >
          <div className="mb-2 text-2xl text-[#00a896]">{step.icon}</div>
          <div className="font-black text-[#12372a]">{step.label}</div>
          <div className="mt-1 text-xs leading-5 text-[#5f746c]">
            {step.key === "awaiting_upload" && "Player uploads footage or follow-up video."}
            {step.key === "ready_for_review" && "Coach watches and writes feedback."}
            {step.key === "reviewed" && "Player views completed feedback and drills."}
          </div>
        </div>
      ))}
    </div>
  );
}

function AwaitingUploadPage({ submission, videoUrl, setVideoUrl, durationMinutes, setDurationMinutes, busy, createUpload, saveVideo }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#d9f7fb] text-3xl text-[#00a896]">
          <FaCloudUploadAlt />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#12372a]">Upload needed before coach review</h2>
        <p className="mt-3 leading-7 text-[#5f746c]">
          This is the first phase of the workflow. The player has paid for coaching, but the coach cannot complete the online review until the match footage or follow-up clip is submitted.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-[#00a896]/30 bg-[#d9f7fb]/45 p-5">
          <h3 className="font-black text-[#12372a]">Upload options for demo</h3>
          <p className="mt-1 text-sm leading-6 text-[#5f746c]">
            In production this creates an upload capped at 15 minutes. For the demo, paste a private URL and enter the clip length to move it into the Ready For Review phase.
          </p>
          <button onClick={createUpload} disabled={busy} className="pp-btn-primary mt-5 px-5 py-3 disabled:opacity-60">
            {busy ? "Preparing..." : "Create Upload Link"}
          </button>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="pp-input px-4 py-3"
              placeholder="Paste YouTube unlisted, Google Drive, Vimeo, MP4, Mux, or Cloudflare link"
            />
            <input
              type="number"
              min="0"
              max="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="pp-input px-4 py-3"
              placeholder="Minutes (max 15)"
            />
            <button onClick={saveVideo} disabled={busy} className="pp-btn-secondary px-4 py-3">
              <FaSave className="mr-2" /> Save URL
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#12372a]">What the player needs to submit</h2>
        <div className="mt-5 grid gap-3">
          {(submission.demoChecklist || [
            "Record 8–12 minutes of match footage.",
            "Make sure the camera shows the full court.",
            "Include the skill area you want reviewed.",
            "Upload or paste a private video URL.",
          ]).map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-[#fff8e7] p-4 text-sm leading-6 text-[#5f746c]">
              <FaCheckCircle className="mt-1 shrink-0 text-[#00a896]" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-[#fff1c7]/70 p-4 text-sm leading-6 text-[#5f746c]">
          <b className="text-[#12372a]">Coaching goal:</b> {submission.goals}
        </div>
      </section>
    </div>
  );
}

function ReadyForReviewPage({ submission, videoSrc }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-[#12372a]">
          <FaVideo className="text-[#00a896]" />
          Ready for coach review
        </h2>

        {videoSrc ? (
          <VideoViewer videoSrc={videoSrc} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[#00a896]/30 bg-[#d9f7fb]/45 p-8 text-center text-[#5f746c]">
            <FaVideo className="mx-auto mb-4 text-4xl text-[#00a896]" />
            This booking is ready for coach notes, but no playable video URL is attached in demo mode.
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-[#fff1c7]/70 p-4 text-sm leading-6 text-[#5f746c]">
          <b className="text-[#12372a]">Player goal:</b> {submission.goals}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#12372a]">Coach review checklist</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f746c]">
          This is not completed yet. The coach should open the coach review workspace, add notes, and complete the review.
        </p>

        <div className="mt-5 grid gap-3">
          {(submission.demoCoachTasks || [
            "Watch the video.",
            "Add timestamped comments.",
            "Write strengths and weaknesses.",
            "Add drills and final notes.",
          ]).map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-[#fff8e7] p-4 text-sm leading-6 text-[#5f746c]">
              <FaClipboardList className="mt-1 shrink-0 text-[#00a896]" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Link to={`/coach/submissions/${submission._id}/review?phase=ready_for_review`} className="pp-btn-primary mt-6 w-full px-5 py-3 text-center">
          Open Coach Review Workspace
        </Link>
      </section>
    </div>
  );
}

function ReviewedPage({ submission, review, videoSrc }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-[#12372a]">
            <FaVideo className="text-[#00a896]" />
            Completed review
          </h2>
          {videoSrc ? <VideoViewer videoSrc={videoSrc} /> : <p className="text-[#5f746c]">No video attached.</p>}
        </section>

        <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
          <h2 className="text-2xl font-black text-[#12372a]">Player goal</h2>
          <p className="mt-3 leading-7 text-[#5f746c]">{submission.goals}</p>
          <div className="mt-5 rounded-2xl bg-[#c6ff4a]/35 p-4 text-sm font-bold text-[#12372a]">
            Review complete. This is the player-facing result page.
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-2xl font-black text-[#12372a]">
          <FaCheckCircle className="text-[#00a896]" /> Coach feedback report
        </h2>

        {!review ? (
          <p className="mt-4 text-[#5f746c]">No completed review yet.</p>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Info title="Summary" value={review.summary} />
              <Info title="Strengths" value={review.strengths} />
              <Info title="Needs work" value={review.improvements} />
              <Info title="Drills" value={review.drills} />
              <Info title="Final notes" value={review.finalNotes} />
            </div>

            <div>
              <h3 className="mb-3 font-black text-[#12372a]">Timestamped comments</h3>
              <div className="space-y-3">
                {(review.comments || []).map((comment) => (
                  <div key={comment._id || `${comment.timestampSeconds}-${comment.comment}`} className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
                    <div className="text-sm font-black text-[#087f73]">{formatTime(comment.timestampSeconds)} • {comment.category}</div>
                    <p className="mt-1 text-sm leading-6 text-[#5f746c]">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function VideoViewer({ videoSrc }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#12372a]/10 bg-[#fff8e7]">
      {videoSrc.includes("iframe.videodelivery.net") ? (
        <iframe title="submitted video" src={videoSrc} className="aspect-video w-full" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      ) : videoSrc.endsWith(".mp4") ? (
        <video className="aspect-video w-full bg-black" src={videoSrc} controls />
      ) : (
        <div className="p-8 text-center">
          <FaPlay className="mx-auto mb-4 text-4xl text-[#00a896]" />
          <a href={videoSrc} target="_blank" rel="noreferrer" className="pp-btn-primary px-4 py-3">
            Open submitted video <FaExternalLinkAlt className="ml-2" />
          </a>
        </div>
      )}
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
      <h3 className="font-black text-[#12372a]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5f746c]">{value || "—"}</p>
    </div>
  );
}