"use client";

// Shared entrance-animation wrapper for every section/block owner.
//
// Hydration & flash safety (by design):
//   - The server renders exactly the same markup as the client's first render
//     — a plain div carrying data-anim attributes. The "hidden" initial state
//     lives entirely in CSS (.veldic-anim rules in globals.css), so there is
//     no conditional rendering and no hydration mismatch.
//   - The visible class is added IMPERATIVELY after mount (classList.add),
//     post-hydration, so React never re-renders with different markup.
//   - Transitions animate only opacity/transform → zero layout shift.
//   - prefers-reduced-motion is honored purely in CSS: content renders in its
//     final visible state instantly, even before JS runs.
import { useEffect, useRef } from "react";
import type { AnimationType } from "@/lib/section-shared";

export default function Reveal({
  type = "NONE",
  scrollTrigger = true,
  className = "",
  children,
}: {
  type?: AnimationType;
  scrollTrigger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === "NONE") return;
    const el = ref.current;
    if (!el) return;

    // Load-triggered (or no IO support): reveal once on mount.
    if (!scrollTrigger || typeof IntersectionObserver === "undefined") {
      el.classList.add("veldic-anim-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("veldic-anim-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [type, scrollTrigger]);

  if (type === "NONE") {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      data-anim={type}
      data-anim-scroll={scrollTrigger ? "true" : "false"}
      className={"veldic-anim" + (className ? " " + className : "")}
    >
      {children}
    </div>
  );
}
