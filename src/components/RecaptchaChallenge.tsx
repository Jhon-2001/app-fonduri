"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";

type CategoryId =
  | "cars"
  | "bicycles"
  | "buses"
  | "traffic_lights"
  | "crosswalks"
  | "motorcycles"
  | "bridges";

type CaptchaImage = {
  id: string;
  url: string;
  category: CategoryId;
};

type Mode = "images" | "text";

/** Fotografii reale locale din /public/captcha (sursă Openverse / CC0) */
const IMAGE_BANK: CaptchaImage[] = [
  { id: "c1", category: "cars", url: "/captcha/cars/1.jpg" },
  { id: "c2", category: "cars", url: "/captcha/cars/2.jpg" },
  { id: "c3", category: "cars", url: "/captcha/cars/3.jpg" },
  { id: "c4", category: "cars", url: "/captcha/cars/4.jpg" },
  { id: "c5", category: "cars", url: "/captcha/cars/5.jpg" },
  { id: "c6", category: "cars", url: "/captcha/cars/6.jpg" },
  { id: "b1", category: "bicycles", url: "/captcha/bicycles/1.jpg" },
  { id: "b2", category: "bicycles", url: "/captcha/bicycles/2.jpg" },
  { id: "b3", category: "bicycles", url: "/captcha/bicycles/3.jpg" },
  { id: "b4", category: "bicycles", url: "/captcha/bicycles/4.jpg" },
  { id: "u1", category: "buses", url: "/captcha/buses/1.jpg" },
  { id: "u2", category: "buses", url: "/captcha/buses/2.jpg" },
  { id: "u3", category: "buses", url: "/captcha/buses/3.jpg" },
  { id: "t1", category: "traffic_lights", url: "/captcha/traffic_lights/1.jpg" },
  { id: "t2", category: "traffic_lights", url: "/captcha/traffic_lights/2.jpg" },
  { id: "t3", category: "traffic_lights", url: "/captcha/traffic_lights/3.jpg" },
  { id: "t4", category: "traffic_lights", url: "/captcha/traffic_lights/4.jpg" },
  { id: "x1", category: "crosswalks", url: "/captcha/crosswalks/1.jpg" },
  { id: "x2", category: "crosswalks", url: "/captcha/crosswalks/2.jpg" },
  { id: "x3", category: "crosswalks", url: "/captcha/crosswalks/3.jpg" },
  { id: "m1", category: "motorcycles", url: "/captcha/motorcycles/1.jpg" },
  { id: "m2", category: "motorcycles", url: "/captcha/motorcycles/2.jpg" },
  { id: "m3", category: "motorcycles", url: "/captcha/motorcycles/3.jpg" },
  { id: "g1", category: "bridges", url: "/captcha/bridges/1.jpg" },
  { id: "g2", category: "bridges", url: "/captcha/bridges/2.jpg" },
  { id: "g3", category: "bridges", url: "/captcha/bridges/3.jpg" },
];

const CATEGORY_LABELS: Record<CategoryId, string> = {
  cars: "mașini",
  bicycles: "biciclete",
  buses: "autobuze",
  traffic_lights: "semafoare",
  crosswalks: "treceri de pietoni",
  motorcycles: "motociclete",
  bridges: "poduri",
};

const HARD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickChallenge() {
  const targets: CategoryId[] = [
    "cars",
    "bicycles",
    "buses",
    "traffic_lights",
    "crosswalks",
    "motorcycles",
  ];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const positives = shuffle(IMAGE_BANK.filter((i) => i.category === target));
  const negatives = shuffle(IMAGE_BANK.filter((i) => i.category !== target));
  const posCount = 3 + Math.floor(Math.random() * 2);
  const selected = shuffle([
    ...positives.slice(0, posCount),
    ...negatives.slice(0, 9 - posCount),
  ]).slice(0, 9);
  return { target, images: selected };
}

function randomHardCode(len = 7): string {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += HARD_CHARS[Math.floor(Math.random() * HARD_CHARS.length)];
  }
  if (!/[a-z]/.test(out) || !/[A-Z]/.test(out)) {
    return randomHardCode(len);
  }
  return out;
}

function drawHardText(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, `hsl(${Math.random() * 40 + 200} 18% 88%)`);
  grad.addColorStop(1, `hsl(${Math.random() * 40 + 20} 22% 82%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 420; i += 1) {
    ctx.fillStyle = `rgba(${30 + Math.random() * 100},${30 + Math.random() * 100},${30 + Math.random() * 100},${0.2 + Math.random() * 0.45})`;
    ctx.fillRect(
      Math.random() * w,
      Math.random() * h,
      1 + Math.random() * 2.5,
      1 + Math.random() * 2.5
    );
  }

  for (let i = 0; i < 12; i += 1) {
    ctx.strokeStyle = `rgba(${20 + Math.random() * 80},${20 + Math.random() * 80},${20 + Math.random() * 80},${0.3 + Math.random() * 0.45})`;
    ctx.lineWidth = 0.8 + Math.random() * 2.4;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h
    );
    ctx.stroke();
  }

  const fonts = [
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
    "Verdana, sans-serif",
    "Arial Black, Arial, sans-serif",
  ];

  const slot = w / (text.length + 0.6);
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const isLower = /[a-z]/.test(ch);
    ctx.save();
    const x = slot * (i + 0.8) + (Math.random() * 8 - 4);
    const y = h / 2 + Math.sin(i * 1.1) * 10 + (Math.random() * 16 - 8);
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 1.15);
    ctx.transform(
      1,
      (Math.random() - 0.5) * 0.45,
      (Math.random() - 0.5) * 0.55,
      1,
      0,
      0
    );
    const size = (isLower ? 28 : 34) + Math.random() * 12;
    const style =
      Math.random() > 0.45
        ? "bold italic"
        : Math.random() > 0.5
          ? "bold"
          : "italic";
    ctx.font = `${style} ${size}px ${fonts[Math.floor(Math.random() * fonts.length)]}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = `rgba(0,0,0,${0.18 + Math.random() * 0.2})`;
    ctx.fillText(ch, 2, 2);

    ctx.fillStyle = `hsl(${Math.random() * 360} ${40 + Math.random() * 35}% ${16 + Math.random() * 22}%)`;
    ctx.fillText(ch, 0, 0);

    for (let s = 0; s < 2; s += 1) {
      ctx.strokeStyle = `rgba(${10 + Math.random() * 60},${10 + Math.random() * 60},${10 + Math.random() * 60},0.7)`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(-14 + Math.random() * 4, -8 + Math.random() * 16);
      ctx.lineTo(10 + Math.random() * 6, -6 + Math.random() * 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(40,40,40,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < w; x += 4) {
    const yy = h / 2 + Math.sin(x * 0.08) * 18;
    if (x === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function preloadImages(urls: string[]) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
}

function CaptchaTile({
  src,
  selected,
  disabled,
  onToggle,
}: {
  src: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative aspect-square overflow-hidden bg-zinc-200 ${
        selected ? "ring-4 ring-inset ring-[#1a73e8]" : ""
      }`}
    >
      {!loaded && !failed && (
        <span className="absolute inset-0 animate-pulse bg-zinc-300 dark:bg-zinc-700" />
      )}
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center bg-zinc-300 text-[10px] text-zinc-600">
          Imagine indisponibilă
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={`h-full w-full object-cover transition-opacity ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          loading="eager"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      )}
      {selected && (
        <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a73e8] text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

type Props = {
  verified: boolean;
  onChange: (ok: boolean) => void;
};

export function RecaptchaChallenge({ verified, onChange }: Props) {
  const [phase, setPhase] = useState<"idle" | "checking" | "challenge" | "verifying">(
    "idle"
  );
  const [mode, setMode] = useState<Mode>("images");
  const [challenge, setChallenge] = useState(() => pickChallenge());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [textCode, setTextCode] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const open = phase === "challenge" || phase === "verifying";
  const widgetBusy = phase === "checking" || phase === "challenge" || phase === "verifying";

  const prompt = useMemo(
    () => `Selectați toate imaginile cu ${CATEGORY_LABELS[challenge.target]}`,
    [challenge.target]
  );

  const refreshImages = useCallback(() => {
    const next = pickChallenge();
    setChallenge(next);
    setSelected(new Set());
    setError("");
    void preloadImages(next.images.map((img) => img.url));
  }, []);

  const refreshText = useCallback(() => {
    const code = randomHardCode(7);
    setTextCode(code);
    setTextAnswer("");
    setError("");
    requestAnimationFrame(() => {
      if (canvasRef.current) drawHardText(canvasRef.current, code);
    });
  }, []);

  useEffect(() => {
    if (open && mode === "text") {
      requestAnimationFrame(() => {
        if (canvasRef.current && textCode) drawHardText(canvasRef.current, textCode);
      });
    }
  }, [open, mode, textCode]);

  async function startChallenge() {
    if (verified) {
      onChange(false);
      setPhase("idle");
      return;
    }
    if (phase !== "idle") return;

    // Simulare delay real reCAPTCHA înainte de provocare
    setPhase("checking");
    await delay(1200 + Math.random() * 1400);

    const nextMode: Mode = Math.random() < 0.5 ? "images" : "text";
    setMode(nextMode);
    setError("");
    setSelected(new Set());

    if (nextMode === "images") {
      const next = pickChallenge();
      setChallenge(next);
      setSelected(new Set());
      await preloadImages(next.images.map((img) => img.url));
    } else {
      refreshText();
    }

    setPhase("challenge");
  }

  function toggleTile(id: string) {
    if (phase === "verifying") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError("");
  }

  async function verifyImages() {
    if (phase === "verifying") return;
    setPhase("verifying");
    await delay(600 + Math.random() * 500);

    const correctIds = new Set(
      challenge.images
        .filter((img) => img.category === challenge.target)
        .map((img) => img.id)
    );
    const ok =
      selected.size === correctIds.size &&
      [...selected].every((id) => correctIds.has(id));

    if (!ok) {
      setError("Vă rugăm să încercați din nou.");
      refreshImages();
      setPhase("challenge");
      return;
    }

    await delay(500 + Math.random() * 700);
    setPhase("idle");
    onChange(true);
  }

  async function verifyText() {
    if (phase === "verifying") return;
    setPhase("verifying");
    await delay(600 + Math.random() * 500);

    if (textAnswer.trim() !== textCode) {
      setError("Textul nu corespunde (respectă majusculele/minusculele).");
      refreshText();
      setPhase("challenge");
      return;
    }

    await delay(500 + Math.random() * 700);
    setPhase("idle");
    onChange(true);
  }

  function closeModal() {
    if (phase === "verifying") return;
    setPhase("idle");
    setError("");
  }

  return (
    <>
      <div className="inline-flex w-full max-w-[304px] items-center justify-between rounded-[3px] border border-[#d3d3d3] bg-[#f9f9f9] px-3 py-3 shadow-[0_0_4px_rgba(0,0,0,.1)] dark:border-zinc-600 dark:bg-zinc-800">
        <button
          type="button"
          onClick={startChallenge}
          className="flex items-center gap-3 text-left"
          aria-pressed={verified}
          aria-label="Nu sunt un robot"
          disabled={phase === "checking" || phase === "verifying"}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border-2 bg-white dark:bg-zinc-900 ${
              verified
                ? "border-[#4caf50]"
                : "border-[#c1c1c1] dark:border-zinc-500"
            }`}
          >
            {widgetBusy && !verified ? (
              <Loader2 size={18} className="animate-spin text-[#555]" />
            ) : verified ? (
              <Check size={20} strokeWidth={3} className="text-[#4caf50]" />
            ) : null}
          </span>
          <span className="text-[14px] text-[#000] dark:text-zinc-100">
            Nu sunt un robot
          </span>
        </button>
        <div className="flex flex-col items-center pl-2 text-center select-none">
          <svg width={28} height={28} viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="28" fill="#1a73e8" opacity="0.15" />
            <path fill="#4285f4" d="M32 8a24 24 0 1 0 24 24h-10a14 14 0 1 1-14-14z" />
            <path fill="#34a853" d="M32 56a24 24 0 0 0 20.8-12L42 36a14 14 0 0 1-10 12z" />
            <path fill="#fbbc05" d="M12 36a24 24 0 0 0 7.2 12L28 38a14 14 0 0 1-6-10z" />
            <path fill="#ea4335" d="M56 32H32V18a14 14 0 0 1 14 14z" />
          </svg>
          <span className="text-[10px] text-[#555] dark:text-zinc-400">
            reCAPTCHA
          </span>
          <span className="text-[8px] text-[#555] dark:text-zinc-500">
            Privacy · Terms
          </span>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 p-3 pt-[8vh] sm:pt-[10vh]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Provocare reCAPTCHA"
            className="relative w-full max-w-[400px] overflow-hidden rounded-sm border border-[#d3d3d3] bg-white shadow-2xl dark:border-zinc-600 dark:bg-zinc-900"
          >
            {phase === "verifying" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-zinc-900/80">
                <Loader2 size={28} className="animate-spin text-[#1a73e8]" />
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Se verifică...
                </p>
              </div>
            )}

            <div className="flex items-start justify-between gap-2 bg-[#1a73e8] px-4 py-3 text-white">
              <div>
                {mode === "images" ? (
                  <>
                    <p className="text-xs opacity-90">
                      Selectați toate imaginile care conțin
                    </p>
                    <p className="text-xl font-medium leading-tight">
                      {CATEGORY_LABELS[challenge.target]}
                    </p>
                    <p className="mt-1 text-[11px] opacity-80">
                      Dacă nu există niciuna, apăsați pe Verificare.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs opacity-90">Introduceți</p>
                    <p className="text-xl font-medium leading-tight">
                      textul din imagine
                    </p>
                    <p className="mt-1 text-[11px] opacity-80">
                      Respectă majusculele și minusculele. Literele sunt
                      distorsionate.
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1 hover:bg-white/15"
                aria-label="Închide"
                disabled={phase === "verifying"}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-1">
              {mode === "images" ? (
                <div className="grid grid-cols-3 gap-1">
                  {challenge.images.map((img) => (
                    <CaptchaTile
                      key={img.id}
                      src={img.url}
                      selected={selected.has(img.id)}
                      disabled={phase === "verifying"}
                      onToggle={() => toggleTile(img.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 p-3">
                  <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={110}
                      className="block h-[110px] w-full select-none"
                    />
                  </div>
                  <input
                    className="fx-input tracking-[0.18em]"
                    value={textAnswer}
                    disabled={phase === "verifying"}
                    onChange={(e) =>
                      setTextAnswer(
                        e.target.value.replace(/[^A-Za-z0-9]/g, "")
                      )
                    }
                    placeholder="Litere mari și mici"
                    maxLength={8}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="px-3 pb-1 text-xs text-red-600">{error}</p>
            )}

            <div className="flex items-center justify-between border-t border-zinc-200 px-2 py-2 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  if (mode === "images") refreshImages();
                  else refreshText();
                }}
                disabled={phase === "verifying"}
                className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Reîncarcă"
                title="Reîncarcă"
              >
                <RefreshCw size={18} />
              </button>
              <button
                type="button"
                onClick={mode === "images" ? verifyImages : verifyText}
                disabled={phase === "verifying"}
                className="rounded bg-[#1a73e8] px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-[#1765cc] disabled:opacity-70"
              >
                Verificare
              </button>
            </div>

            <p className="sr-only">{prompt}</p>
          </div>
        </div>
      )}
    </>
  );
}
