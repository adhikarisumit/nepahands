"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const KEY = (url: string) => `scroll:${url}`;

/**
 * Returns shoppers to where they were when they press Back (e.g. from a product to the
 * shop grid). Saves the scroll position per URL and restores it on back/forward
 * navigation, waiting until the page is tall enough (products rendered) to scroll to it.
 */
export default function ScrollRestorer() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const url = search ? `${pathname}?${search}` : pathname;

  // Updated during render, so scroll events fired while the next page mounts are
  // never saved against the previous URL.
  const urlRef = useRef(url);
  urlRef.current = url;
  const popped = useRef(false);

  // Save the position continuously (throttled to one write per frame).
  useEffect(() => {
    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(KEY(urlRef.current), String(Math.round(window.scrollY)));
        } catch {
          /* storage unavailable (private mode) */
        }
      });
    };
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("popstate", onPop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // After a Back/Forward navigation, restore the saved position for this URL.
  useEffect(() => {
    if (!popped.current) return;
    popped.current = false;

    let target = 0;
    try {
      target = Number(sessionStorage.getItem(KEY(url)) ?? 0);
    } catch {
      return;
    }
    if (!target) return;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= target - 2 || tries >= 40) {
        window.scrollTo({ top: Math.min(target, maxScroll), behavior: "instant" as ScrollBehavior });
        return;
      }
      tries++; // content still loading — try again shortly (up to ~2s)
      timer = setTimeout(attempt, 50);
    };
    attempt();
    return () => clearTimeout(timer);
  }, [url]);

  return null;
}
