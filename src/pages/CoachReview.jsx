import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaClipboardList,
  FaCloudUploadAlt,
  FaExternalLinkAlt,
  FaFileAlt,
  FaPlus,
  FaSave,
  FaVideo,
} from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { documentFileToDataUrl, readFileAsDataUrl } from "../lib/uploads";
import { normalizePhase } from "../lib/workflow";

const blankReview = {
  summary: "",
  strengths: "",
  improvements: "",
  drills: "",
  finalNotes: "",
  responseVideoUrl: "",
  voiceRecordingUrl: "",
  transcriptPdfUrl: "",
  drillPlanPdfUrl: "",
  audioTranscript: "",
  transcript: "",
  coachTranscriptNotes: "",
  attachments: [],
};

function formatTime(seconds = 0) {
  const s = Math.max(0, Number(seconds || 0));
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

async function genericAttachmentToDataUrl(file) {
  if (!file) return null;

  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Files must be 3 MB or smaller.");
  }

  const url = await readFileAsDataUrl(file);

  return {
    name: file.name,
    url,
    type: file.type || "application/octet-stream",
    size: file.size,
    label: file.name,
  };
}

export default function CoachReview() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedPhase = useMemo(() => new URLSearchParams(location.search).get("phase") || "", [location.search]);

  const { token } = useAuth();
  const { push } = useToast();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reviewForm, setReviewForm] = useState(blankReview);
  const [comment, setComment] = useState({
    timestampSeconds: 0,
    category: "General",
    comment: "",
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");

    try {
      const result = await api.get(`/videos/submissions/${id}`, token);
      const phase = normalizePhase(requestedPhase || result?.submission?.phase || result?.submission?.status);
      const review = result?.review || null;

      setData({
        submission: {
          ...(result?.submission || {}),
          phase,
          status: result?.submission?.status || phase,
        },
        review,
      });

      setReviewForm({
        ...blankReview,
        ...(review || {}),
        attachments: Array.isArray(review?.attachments) ? review.attachments : [],
        audioTranscript:
          review?.audioTranscript ||
          review?.transcript ||
          review?.coachTranscriptNotes ||
          "",
      });
    } catch (err) {
      setError(err.message || "Review workspace could not be loaded.");
      setData(null);
    }
  };

  useEffect(() => {
    load();
  }, [id, token, requestedPhase]);

  const addComment = async (e) => {
    e.preventDefault();

    if (!comment.comment.trim()) return push("Write a comment first.", "error");

    setBusy(true);

    try {
      const saved = await api.post(`/reviews/${id}/comments`, comment, token);

      setData((d) => ({
        ...d,
        review: saved,
        submission: {
          ...d.submission,
          status: "in_review",
          phase: "ready_for_review",
        },
      }));

      push("Timestamp comment added.", "success");
    } catch (err) {
      push(err.message || "Comment could not be saved.", "error");
    } finally {
      setComment({ timestampSeconds: 0, category: "General", comment: "" });
      setBusy(false);
    }
  };

  const buildPayload = () => ({
    ...reviewForm,
    transcript: reviewForm.audioTranscript || reviewForm.transcript || "",
    coachTranscriptNotes: reviewForm.audioTranscript || reviewForm.coachTranscriptNotes || "",
    attachments: Array.isArray(reviewForm.attachments) ? reviewForm.attachments : [],
  });

  const saveDraft = async () => {
    setBusy(true);

    try {
      const saved = await api.put(`/reviews/${id}/draft`, buildPayload(), token);

      setData((d) => ({ ...d, review: saved }));

      setReviewForm((f) => ({
        ...f,
        ...(saved || {}),
        attachments: Array.isArray(saved?.attachments) ? saved.attachments : f.attachments,
        audioTranscript: saved?.audioTranscript || saved?.transcript || f.audioTranscript || "",
      }));

      push("Review draft saved.", "success");
    } catch (err) {
      push(err.message || "Draft could not be saved.", "error");
    } finally {
      setBusy(false);
    }
  };

  const completeReview = async () => {
    setBusy(true);

    try {
      await api.post(`/reviews/${id}/complete`, buildPayload(), token);

      push("Review completed and sent to player dashboard.", "success");

      navigate("/coach/dashboard#review-queue", {
        replace: true,
      });
    } catch (err) {
      push(err.message || "Review could not be completed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const addAttachment = async (file) => {
    try {
      const attachment = await genericAttachmentToDataUrl(file);
      if (!attachment) return;

      setReviewForm((f) => ({
        ...f,
        attachments: [...(Array.isArray(f.attachments) ? f.attachments : []), attachment],
      }));

      push("Attachment added. Save the draft or complete the review to store it.", "success");
    } catch (err) {
      push(err.message || "Attachment could not be added.", "error");
    }
  };

  const removeAttachment = (index) => {
    setReviewForm((f) => ({
      ...f,
      attachments: (Array.isArray(f.attachments) ? f.attachments : []).filter((_, i) => i !== index),
    }));
  };

  if (!data) {
    return <div className="pp-app-shell px-6 pt-32 text-[#5f746c]">{error || "Loading review workspace..."}</div>;
  }

  const { submission, review } = data;
  const phase = normalizePhase(requestedPhase || submission.phase || submission.status);
  const videoSrc = submission.videoUrl || (submission.playbackId ? `https://iframe.videodelivery.net/${submission.playbackId}` : "");

  return (
    <div className="pp-app-shell px-6 pt-32 pb-16">
      <div className="mx-auto max-w-7xl space-y-6">
        {error && (
          <div className="rounded-2xl border border-[#ffd166]/50 bg-[#fff1c7]/75 p-4 text-sm font-bold text-[#5f746c]">
            {error}
          </div>
        )}

        <WorkflowHeader phase={phase} submission={submission} />

        {phase === "awaiting_upload" && <CoachAwaitingUpload submission={submission} />}

        {phase === "ready_for_review" && (
          <CoachReadyReview
            submission={submission}
            review={review}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            comment={comment}
            setComment={setComment}
            addComment={addComment}
            saveDraft={saveDraft}
            completeReview={completeReview}
            addAttachment={addAttachment}
            removeAttachment={removeAttachment}
            busy={busy}
            videoSrc={videoSrc}
          />
        )}

        {phase === "reviewed" && <CoachCompletedReview submission={submission} review={review} videoSrc={videoSrc} />}
      </div>
    </div>
  );
}

function WorkflowHeader({ phase, submission }) {
  const title =
    phase === "awaiting_upload"
      ? "Awaiting Player Upload"
      : phase === "ready_for_review"
      ? "Ready For Coach Review"
      : "Completed Review";

  const icon =
    phase === "awaiting_upload" ? <FaCloudUploadAlt /> : phase === "ready_for_review" ? <FaClipboardList /> : <FaCheckCircle />;

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <Link to="/coach/dashboard#review-queue" className="text-sm font-black text-[#087f73] hover:underline">
          ← Coach dashboard
        </Link>

        <p className="mt-4 font-black uppercase tracking-[0.2em] text-[#087f73]">Coach review</p>

        <h1 className="mt-2 flex items-center gap-3 text-4xl font-black text-[#12372a]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]">
            {icon}
          </span>
          {title}
        </h1>

        <p className="mt-2 text-[#5f746c]">
          {submission.title} • {submission.playerId?.fullName || submission.playerId?.email || "Player"}
        </p>
      </div>

      <Link to={`/dashboard/submissions/${submission._id}?phase=${phase}`} className="pp-btn-secondary px-5 py-3 text-center">
        View Player Page
      </Link>
    </div>
  );
}

function CoachAwaitingUpload({ submission }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-6 shadow-sm">
        <FaCloudUploadAlt className="text-5xl text-[#00a896]" />

        <h2 className="mt-5 text-2xl font-black text-[#12372a]">No video has been submitted yet</h2>

        <p className="mt-3 leading-7 text-[#5f746c]">
          This is the coach-side waiting room. The booking is paid, but the coach should not complete a review until the player uploads footage or submits a private video URL.
        </p>

        <div className="mt-5 rounded-2xl bg-[#fff1c7]/75 p-4 text-sm leading-6 text-[#5f746c]">
          <b className="text-[#12372a]">Player goal:</b> {submission.goals}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-6 shadow-sm">
        <h2 className="text-2xl font-black text-[#12372a]">Coach can do next</h2>

        <div className="mt-5 grid gap-3">
          {[
            "Message the player to upload footage.",
            "Confirm what angle or camera view is needed.",
            "Schedule the online portion of the online coaching option.",
            "Wait until status becomes Ready For Review.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-[#fff8e7] p-4 text-sm leading-6 text-[#5f746c]">
              <FaCheckCircle className="mt-1 shrink-0 text-[#00a896]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CoachReadyReview({
  review,
  reviewForm,
  setReviewForm,
  comment,
  setComment,
  addComment,
  saveDraft,
  completeReview,
  addAttachment,
  removeAttachment,
  busy,
  videoSrc,
}) {
  const attachments = Array.isArray(reviewForm.attachments) ? reviewForm.attachments : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-xl shadow-[#12372a]/8 backdrop-blur">
        <h2 className="mb-4 text-xl font-black text-[#12372a]">Submitted video or session context</h2>

        {videoSrc ? (
          <VideoViewer videoSrc={videoSrc} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[#00a896]/30 bg-[#d9f7fb]/45 p-8 text-center text-[#5f746c]">
            <FaVideo className="mx-auto mb-4 text-4xl text-[#00a896]" />
            This booking is ready for coach notes, but the uploaded video is not available. Please ask the player to upload it again.
          </div>
        )}

        <form onSubmit={addComment} className="mt-5 rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
          <h3 className="font-black text-[#12372a]">Add timestamped note or review note</h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-[120px_180px_1fr_auto]">
            <input
              type="number"
              min="0"
              value={comment.timestampSeconds}
              onChange={(e) => setComment((c) => ({ ...c, timestampSeconds: e.target.value }))}
              className="pp-input px-4 py-3"
              placeholder="Seconds"
            />

            <select
              value={comment.category}
              onChange={(e) => setComment((c) => ({ ...c, category: e.target.value }))}
              className="pp-input px-4 py-3"
            >
              <option>General</option>
              <option>Serve</option>
              <option>Return</option>
              <option>Footwork</option>
              <option>Kitchen</option>
              <option>Doubles rotation</option>
              <option>Shot selection</option>
              <option>Online coaching request</option>
            </select>

            <input
              value={comment.comment}
              onChange={(e) => setComment((c) => ({ ...c, comment: e.target.value }))}
              className="pp-input px-4 py-3"
              placeholder="Write coach feedback for this moment or review segment"
            />

            <button disabled={busy} className="pp-btn-secondary px-4 py-3">
              <FaPlus />
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {(review?.comments || []).map((row) => (
            <div key={row._id || `${row.timestampSeconds}-${row.comment}`} className="rounded-2xl border border-[#12372a]/10 bg-white/78 p-4">
              <div className="font-black text-[#087f73]">
                {formatTime(row.timestampSeconds)} • {row.category}
              </div>

              <p className="mt-1 text-sm leading-6 text-[#5f746c]">{row.comment}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-xl shadow-[#12372a]/8 backdrop-blur">
        <h2 className="text-xl font-black text-[#12372a]">Written review / review recap</h2>

        <div className="mt-4 grid gap-3">
          <Field label="Summary" value={reviewForm.summary} onChange={(value) => setReviewForm((f) => ({ ...f, summary: value }))} />

          <Field label="Strengths" value={reviewForm.strengths} onChange={(value) => setReviewForm((f) => ({ ...f, strengths: value }))} />

          <Field label="Needs work" value={reviewForm.improvements} onChange={(value) => setReviewForm((f) => ({ ...f, improvements: value }))} />

          <Field label="Recommended drills" value={reviewForm.drills} onChange={(value) => setReviewForm((f) => ({ ...f, drills: value }))} />

          <Field label="Final notes" value={reviewForm.finalNotes} onChange={(value) => setReviewForm((f) => ({ ...f, finalNotes: value }))} />

          <Field
            label="Audio transcript / voice analysis transcript"
            value={reviewForm.audioTranscript}
            rows={5}
            placeholder="Paste or type the audio transcript here. This will now save with the review and display to the customer."
            onChange={(value) =>
              setReviewForm((f) => ({
                ...f,
                audioTranscript: value,
                transcript: value,
                coachTranscriptNotes: value,
              }))
            }
          />

          <div className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
            <h3 className="font-black text-[#12372a]">Upload coach deliverables</h3>

            <p className="mt-1 text-sm text-[#5f746c]">
              Add voice analysis, transcript PDF, drill plan PDF, or another customer-facing attachment. Files must be 3 MB or smaller.
            </p>

            <div className="mt-3 grid gap-3">
              {[
                ["voiceRecordingUrl", "audio", "Voice analysis recording", "audio/*"],
                ["transcriptPdfUrl", "pdf", "Transcript PDF", "application/pdf"],
                ["drillPlanPdfUrl", "pdf", "Drill plan PDF", "application/pdf"],
              ].map(([key, kind, label, accept]) => (
                <label key={key} className="block text-sm font-black text-[#12372a]">
                  {label}

                  <input
                    type="file"
                    accept={accept}
                    onChange={async (e) => {
                      try {
                        const url = await documentFileToDataUrl(e.target.files?.[0], kind);
                        setReviewForm((f) => ({ ...f, [key]: url }));
                      } catch (err) {
                        alert(err.message || "File could not be added.");
                      }
                    }}
                    className="pp-input mt-1 px-4 py-3"
                  />

                  {reviewForm[key] && <span className="mt-1 block text-xs text-[#087f73]">Ready to save</span>}
                </label>
              ))}

              <label className="block text-sm font-black text-[#12372a]">
                Additional customer attachment

                <input
                  type="file"
                  accept="application/pdf,image/*,text/plain"
                  onChange={(e) => addAttachment(e.target.files?.[0])}
                  className="pp-input mt-1 px-4 py-3"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 rounded-2xl bg-white/75 p-3">
                <h4 className="font-black text-[#12372a]">Attachments ready to save</h4>

                <div className="mt-2 space-y-2">
                  {attachments.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#eaf9f7] px-3 py-2 text-sm font-bold text-[#40584f]">
                      <span>
                        <FaFileAlt className="mr-2 inline text-[#087f73]" />
                        {item.name || `Attachment ${index + 1}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#b94024]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={saveDraft} disabled={busy} className="pp-btn-secondary px-4 py-3 disabled:opacity-60" type="button">
              <FaSave className="mr-2" /> Save Draft
            </button>

            <button onClick={completeReview} disabled={busy} className="pp-btn-primary px-4 py-3 disabled:opacity-60" type="button">
              <FaCheckCircle className="mr-2" /> Complete Review
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CoachCompletedReview({ review, videoSrc }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-black text-[#12372a]">Completed footage / context</h2>

        {videoSrc ? <VideoViewer videoSrc={videoSrc} /> : <p className="text-[#5f746c]">No video attached.</p>}

        <div className="mt-5 rounded-2xl bg-[#c6ff4a]/35 p-4 text-sm font-bold text-[#12372a]">
          This review is already complete and is now player-facing.
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm">
        <h2 className="text-xl font-black text-[#12372a]">Completed coach feedback</h2>

        <div className="mt-4 space-y-4">
          <Info title="Summary" value={review?.summary} />
          <Info title="Strengths" value={review?.strengths} />
          <Info title="Needs work" value={review?.improvements} />
          <Info title="Drills" value={review?.drills} />
          <Info title="Final notes" value={review?.finalNotes} />
          <Info title="Audio transcript" value={review?.audioTranscript || review?.transcript || review?.coachTranscriptNotes} />
          <Deliverables review={review} />
        </div>
      </section>
    </div>
  );
}

function VideoViewer({ videoSrc }) {
  return (
    <div className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-5 text-center">
      {videoSrc.includes("iframe.videodelivery.net") ? (
        <iframe
          title="submitted video"
          src={videoSrc}
          className="aspect-video w-full rounded-xl"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : videoSrc.endsWith(".mp4") ? (
        <video className="aspect-video w-full rounded-xl bg-black" src={videoSrc} controls />
      ) : (
        <a href={videoSrc} target="_blank" rel="noreferrer" className="pp-btn-primary px-4 py-3">
          Open submitted video <FaExternalLinkAlt className="ml-2" />
        </a>
      )}
    </div>
  );
}

function Field({ label, value, onChange, rows = 3, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#12372a]">{label}</span>

      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="pp-input mt-1 px-4 py-3"
        placeholder={placeholder}
      />
    </label>
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

function Deliverables({ review }) {
  const standardFiles = [
    [review?.voiceRecordingUrl, "Download voice analysis", "coach-analysis.webm"],
    [review?.transcriptPdfUrl, "Download transcript PDF", "coach-transcript.pdf"],
    [review?.drillPlanPdfUrl, "Download drill plan PDF", "drill-plan.pdf"],
  ].filter(([url]) => url);

  const attachments = Array.isArray(review?.attachments) ? review.attachments.filter((item) => item?.url) : [];

  if (!standardFiles.length && !attachments.length) return null;

  return (
    <div className="rounded-2xl border border-[#00a896]/25 bg-[#d9f7fb] p-4">
      <h3 className="font-black text-[#12372a]">Downloadable deliverables</h3>

      <div className="mt-2 flex flex-wrap gap-2">
        {standardFiles.map(([url, label, name]) => (
          <a key={label} href={url} download={name} className="pp-btn-secondary px-3 py-2 text-sm">
            {label}
          </a>
        ))}

        {attachments.map((item, index) => (
          <a
            key={`${item.name}-${index}`}
            href={item.url}
            download={item.name || `coach-attachment-${index + 1}`}
            className="pp-btn-secondary px-3 py-2 text-sm"
          >
            Download {item.label || item.name || `attachment ${index + 1}`}
          </a>
        ))}
      </div>
    </div>
  );
}