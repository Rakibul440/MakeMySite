import api from "@/configs/axios";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useRef, type KeyboardEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Stat {
  value: string;
  label: string;
}

const SUGGESTIONS: string[] = [
  "Build me a SaaS dashboard with dark theme and auth...",
  "Create a portfolio site with animated hero section...",
  "Make an e-commerce landing page with product cards...",
  "Design a blog platform with markdown support...",
  "Generate a startup landing page with waitlist form...",
];

const STATS: Stat[] = [
  { value: "10K+", label: "Sites Built" },
  { value: "4.9★", label: "Dev Rating" },
  { value: "< 30s", label: "Generation Time" },
  { value: "99%", label: "Uptime" },
];

const STACK_TAGS: string[] = [
  "React",
  "Next.js",
  "Tailwind",
  "TypeScript",
  "Vite",
  "Node.js",
  "Prisma",
  "Framer Motion",
];

export default function LandingPage(): JSX.Element {
  const [prompt, setPrompt] = useState<string>("");
  const [placeholder, setPlaceholder] = useState<string>("");
  const [suggIndex, setSuggIndex] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [glitch, setGlitch] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typewriter effect for placeholder
  useEffect(() => {
    if (focused) return;
    const current = SUGGESTIONS[suggIndex];
    const speed = isDeleting ? 30 : 55;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setPlaceholder(current.slice(0, charIndex + 1));
        if (charIndex + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), 1800);
        } else {
          setCharIndex((c) => c + 1);
        }
      } else {
        setPlaceholder(current.slice(0, charIndex - 1));
        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setSuggIndex((i) => (i + 1) % SUGGESTIONS.length);
          setCharIndex(0);
        } else {
          setCharIndex((c) => c - 1);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, suggIndex, focused]);

  // Periodic glitch on title
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 300);
    }, 4500);
    return () => clearInterval(interval);
  }, []);


  const { data: session } = authClient.useSession();
  const navigate = useNavigate()

  //  e: React.FormEvent<HTMLFormElement>
  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true)

    try {
      if (!session?.user) {
        toast.error('Please sign in to create a project') // toast from 'sonner'
        navigate("/auth/sign")
        return;
      }
      else if (!prompt.trim()) {
        return toast.error('Please enter your prompt')
      }

      // if all ok setloading true
      // setSubmitted(true)

      const { data } = await api.post("/api/user/project", {
        initial_prompt: prompt
      })

      setSubmitted(false);
      navigate(`/projects/${data.projectId}`)

    } catch (error: any) {
      setSubmitted(false)
      toast.error(error?.response?.data?.message || error.message);
      console.log(error)
    }

  }


  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">

        {/* Badge */}
        <div className="mb-10 flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/40 tracking-widest uppercase bg-white/[0.02] backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
          AI-Powered Site Generation
        </div>

        {/* Hero heading */}
        <div className="text-center mb-6 select-none relative">

          {/* Decorative top line */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
            <span className="text-[10px] text-white/25 tracking-[0.4em] uppercase font-mono">est. 2026</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* MakeMySite — big centerpiece */}
          <h1
            className={`relative leading-none transition-all duration-150 ${glitch ? "translate-x-[2px]" : ""
              }`}
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(4rem, 13vw, 11rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "#ffffff",
              textShadow: glitch
                ? "3px 0 #fff, -3px 0 rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.3)"
                : "0 0 80px rgba(255,255,255,0.15), 0 2px 0 rgba(255,255,255,0.05)",
            }}
          >
            Make
            <span
              style={{
                WebkitTextStroke: "2px white",
                color: "transparent",
                margin: "0 0.04em",
              }}
            >
              My
            </span>
            Site
          </h1>

          {/* Decorative bottom rule */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-px flex-1 max-w-[80px] bg-white/10" />
            <span className="text-white/15 text-xs tracking-widest">◆</span>
            <div className="h-px flex-1 max-w-[80px] bg-white/10" />
          </div>
        </div>

        {/* Subheading */}
        <p className="text-white/35 text-sm md:text-base text-center max-w-lg mb-3 leading-relaxed tracking-wide">
          Describe your vision. We generate production-ready React code,
          <br className="hidden md:block" />
          deployable in seconds. No drag-and-drop. Just code.
        </p>

        {/* Stack tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-14">
          {STACK_TAGS.map((tag) => (
            <span
              key={tag}
              className="text-[10px] tracking-widest uppercase text-white/20 border border-white/8 px-2.5 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Prompt area */}
        <div
          className={`w-full max-w-2xl relative rounded-xl border transition-all duration-300 ${focused
            ? "border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.07)]"
            : "border-white/10"
            } bg-white/[0.025] backdrop-blur-md`}
        >
          {/* Terminal dot row */}
          <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-0">
            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="ml-3 text-[10px] text-white/15 tracking-widest uppercase">prompt.tsx</span>
          </div>

          <div className="px-4 pt-3 pb-4">
            <div className="flex gap-2 text-white/15 text-xs mb-2 font-mono">
              <span className="text-white/30">›</span>
              <span>describe your site</span>
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={focused ? "" : placeholder}
              rows={4}
              className="w-full bg-transparent text-white/80 text-sm leading-relaxed resize-none outline-none placeholder-white/20 caret-white"
              style={{ fontFamily: "'Courier New', monospace" }}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 pb-4 pt-1 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/15 tracking-wide">
                {prompt.length > 0 ? `${prompt.length} chars` : "⌘ + Enter to submit"}
              </span>
              {prompt.length > 0 && (
                <button
                  onClick={() => setPrompt("")}
                  className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
                >
                  clear
                </button>
              )}
            </div>

            <form
              onSubmit={handleGenerate}
            >
              <button
                type="submit"
                disabled={!prompt.trim() || submitted}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all duration-200 ${prompt.trim()
                  ? "bg-white text-black border-white hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-transparent text-white/20 border-white/10 cursor-not-allowed"
                  }`}
              >
                {submitted ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>Generate →</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Success state */}
        {submitted && (
          <div className="mt-4 text-[11px] text-white/30 tracking-widest uppercase animate-pulse">
            ░ Compiling your site...
          </div>
        )}

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5 w-full max-w-2xl">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="bg-black px-6 py-5 flex flex-col items-center gap-1 hover:bg-white/[0.02] transition-colors"
            >
              <span
                className="text-2xl font-black tracking-tight"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                {value}
              </span>
              <span className="text-[10px] text-white/25 tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom subtle line */}
        <p className="mt-16 text-[10px] text-white/10 tracking-[0.3em] uppercase">
          // no templates. no limits. just your idea.
        </p>
      </main>
    </div>
  );
}