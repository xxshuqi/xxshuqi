"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PhotoAsset } from "@/lib/photoMedia";
import { buildPhotoSrcSet, getPhotoAlt, getThumbIntrinsicSize } from "@/lib/photoMedia";

type EvfView = "gallery" | "about";

type EvfPhoto = PhotoAsset & {
  i: number;
  num: string;
  orientation: "landscape" | "portrait";
  mm: string;
  ap: string;
  sh: string;
  isoValue: string;
};

type ContactState = false | "open" | "closing";

interface EvfPortfolioProps {
  photos: PhotoAsset[];
  initialView?: EvfView;
}

const AUTO_DRIFT = false;
const DRIFT_SPEED = 40;
const FRAME_SNAP = true;
const FOCUS_PULL = true;
const WHEEL_GAIN = 1.15;
const INERTIA_LERP = 0.11;
const SNAP_IDLE_MS = 200;
const TOUCH_SNAP_IDLE_MS = 260;
const SNAP_DIFF_PX = 8;
const TOUCH_ADOPT_TOLERANCE = 1.5;
const TOUCH_ACTIVE_MS = 80;
const METER_WIDTH = 130;

function compactLens(lens?: string | null) {
  if (!lens) return "35mm";
  const prime = lens.match(/(\d+(?:\.\d+)?)\s*mm/i);
  return prime ? `${Math.round(Number(prime[1]))}mm` : "35mm";
}

function compactShutter(shutter?: string | null) {
  if (!shutter) return "1/500";
  return shutter.replace(/s$/i, "");
}

function compactIso(iso?: string | null) {
  if (!iso) return "640";
  return iso.replace(/iso/i, "").trim();
}

function toEvfPhotos(photos: PhotoAsset[]): EvfPhoto[] {
  return photos.map((photo, index) => ({
    ...photo,
    i: index,
    num: String(index + 1).padStart(3, "0"),
    orientation: photo.width > photo.height ? "landscape" : "portrait",
    mm: compactLens(photo.lens),
    ap: photo.aperture || "f/2.8",
    sh: compactShutter(photo.shutter),
    isoValue: compactIso(photo.iso),
  }));
}

function exifLine(photo?: EvfPhoto | null) {
  if (!photo) return "35mm  f/2.8  1/500  ISO 640  AWB";
  return `${photo.mm}  ${photo.ap}  ${photo.sh}  ISO ${photo.isoValue}  AWB`;
}

function lightboxMeta(photo: EvfPhoto) {
  return `FRM ${photo.num} · ${photo.mm} ${photo.ap} ${photo.sh} ISO ${photo.isoValue} · CLASSIC NEG.`;
}

function BatteryIcon() {
  return (
    <span className="evf-battery" aria-label="Battery level">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function EvfPortfolio({
  photos,
  initialView = "gallery",
}: EvfPortfolioProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rollRef = useRef<HTMLDivElement | null>(null);
  const exifRef = useRef<HTMLDivElement | null>(null);
  const needleRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const contactTimerRef = useRef<number | null>(null);
  const targetRef = useRef(0);
  const snappedRef = useRef(true);
  const lastWheelRef = useRef(0);
  const lastNativeInputRef = useRef(0);
  const lastWrittenRef = useRef<number | null>(null);
  const photoNodesRef = useRef<HTMLElement[]>([]);
  const currentIndexRef = useRef(0);
  const hoveredRef = useRef<EvfPhoto | null>(null);
  const hoverPauseRef = useRef(false);
  const isMobileRef = useRef(false);
  const [view, setView] = useState<EvfView>(initialView);
  const [contact, setContact] = useState<ContactState>(false);
  const [light, setLight] = useState<EvfPhoto | null>(null);
  const [shutter, setShutter] = useState(false);
  const [cur, setCur] = useState(1);

  const frames = useMemo(() => toEvfPhotos(photos), [photos]);
  const total = frames.length || 1;
  const activePath = view === "about" || pathname === "/about" ? "about" : "gallery";

  const updateHud = useCallback(
    (index: number, progress?: number, exifPhoto?: EvfPhoto | null) => {
      const safeIndex = Math.min(total - 1, Math.max(0, index));
      const previousIndex = currentIndexRef.current;
      currentIndexRef.current = safeIndex;

      if (needleRef.current && progress != null) {
        needleRef.current.style.transform = `translate3d(${progress * METER_WIDTH}px, 0, 0) translateX(-50%)`;
      }

      if (safeIndex !== previousIndex) {
        setCur(safeIndex + 1);
      }

      if (exifRef.current) {
        const activePhoto = isMobileRef.current
          ? frames[safeIndex] ?? frames[0]
          : exifPhoto ?? hoveredRef.current ?? frames[safeIndex] ?? frames[0];
        exifRef.current.textContent = isMobileRef.current && activePhoto
          ? `${activePhoto.mm} ${activePhoto.ap} ${activePhoto.sh}`
          : exifLine(activePhoto);
      }
    },
    [frames, total]
  );

  const getPhotoNodes = useCallback(() => {
    const roll = rollRef.current;
    if (!roll) return [];
    if (photoNodesRef.current.length !== frames.length) {
      photoNodesRef.current = Array.from(
        roll.querySelectorAll<HTMLElement>("[data-ph]")
      );
    }
    return photoNodesRef.current;
  }, [frames.length]);

  const runMotionFrame = useCallback(
    (now: number) => {
      const roll = rollRef.current;

      if (roll && view === "gallery" && !contact && !light) {
        const maxScroll = Math.max(roll.scrollWidth - roll.clientWidth, 0);

        if (AUTO_DRIFT && !hoverPauseRef.current) {
          targetRef.current += DRIFT_SPEED / 60;
          snappedRef.current = true;
        }

        targetRef.current = Math.max(0, Math.min(maxScroll, targetRef.current));

        const diff = targetRef.current - roll.scrollLeft;
        const touchIsActive =
          isMobileRef.current &&
          now - lastNativeInputRef.current < TOUCH_ACTIVE_MS &&
          Math.abs(diff) < TOUCH_ADOPT_TOLERANCE;

        if (!touchIsActive && Math.abs(diff) > 0.3) {
          roll.scrollLeft += diff * INERTIA_LERP;
          lastWrittenRef.current = roll.scrollLeft;
        }

        const nodes = getPhotoNodes();
        const viewportCenter = roll.scrollLeft + roll.clientWidth / 2;
        const halfViewport = roll.clientWidth / 2;
        let bestIndex = 0;
        let bestCenter = 0;
        let bestDistance = Infinity;

        const distances = nodes.map((node, index) => {
          const center = node.offsetLeft + node.offsetWidth / 2;
          const distance = Math.abs(center - viewportCenter);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
            bestCenter = center;
          }
          return halfViewport > 0 ? distance / halfViewport : 0;
        });

        if (FOCUS_PULL) {
          nodes.forEach((node, index) => {
            const t = Math.max(0, distances[index] - 0.32);
            node.style.filter = t < 0.01
              ? "none"
              : `blur(${Math.min(2.4, t * 3).toFixed(2)}px)`;
            node.style.transform = `scale(${(1 - Math.min(0.045, t * 0.07)).toFixed(3)})`;
            node.style.opacity = (1 - Math.min(0.18, t * 0.25)).toFixed(2);
          });
        }

        if (
          FRAME_SNAP &&
          !AUTO_DRIFT &&
          !snappedRef.current &&
          now - lastWheelRef.current > (isMobileRef.current ? TOUCH_SNAP_IDLE_MS : SNAP_IDLE_MS) &&
          Math.abs(diff) < SNAP_DIFF_PX
        ) {
          targetRef.current = Math.max(0, Math.min(maxScroll, bestCenter - halfViewport));
          snappedRef.current = true;
        }

        const nextProg = maxScroll > 0 ? roll.scrollLeft / maxScroll : 0;
        updateHud(bestIndex, nextProg);
      }

      rafRef.current = window.requestAnimationFrame(runMotionFrame);
    },
    [contact, getPhotoNodes, light, updateHud, view]
  );

  const scrollToFrame = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const roll = rollRef.current;
      if (!roll) return;
      const maxScroll = Math.max(roll.scrollWidth - roll.clientWidth, 0);
      const ratio = total <= 1 ? 0 : index / (total - 1);
      const nextLeft = ratio * maxScroll;
      targetRef.current = nextLeft;
      roll.scrollTo({ left: nextLeft, behavior });
      lastWrittenRef.current = nextLeft;
      snappedRef.current = false;
      lastWheelRef.current = 0;
      updateHud(index, ratio);
    },
    [total, updateHud]
  );

  const triggerShutter = useCallback((action: () => void) => {
    setShutter(true);
    window.setTimeout(action, 170);
    window.setTimeout(() => setShutter(false), 540);
  }, []);

  const openLightbox = useCallback(
    (photo: EvfPhoto) => {
      triggerShutter(() => setLight(photo));
    },
    [triggerShutter]
  );

  const closeLightbox = useCallback(() => {
    if (!light) return;
    triggerShutter(() => setLight(null));
  }, [light, triggerShutter]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const syncMobile = () => {
      isMobileRef.current = query.matches;
      updateHud(currentIndexRef.current);
    };

    syncMobile();
    query.addEventListener("change", syncMobile);
    return () => query.removeEventListener("change", syncMobile);
  }, [updateHud]);

  const stepFrame = useCallback(
    (direction: -1 | 1) => {
      const next = Math.min(total - 1, Math.max(0, currentIndexRef.current + direction));
      scrollToFrame(next);
    },
    [scrollToFrame, total]
  );

  const toggleContact = useCallback(() => {
    if (light) return;

    if (contact === "open") {
      setContact("closing");
      if (contactTimerRef.current) window.clearTimeout(contactTimerRef.current);
      contactTimerRef.current = window.setTimeout(() => {
        setContact(false);
        contactTimerRef.current = null;
      }, 300);
    } else if (!contact) {
      setContact("open");
    }
  }, [contact, light]);

  const jumpFromContact = useCallback(
    (photo: EvfPhoto) => {
      toggleContact();
      setView("gallery");

      window.requestAnimationFrame(() => {
        const roll = rollRef.current;
        if (!roll) return;
        const maxScroll = Math.max(roll.scrollWidth - roll.clientWidth, 0);
        const pos = (photo.i / Math.max(1, total - 1)) * maxScroll;
        roll.scrollLeft = pos;
        targetRef.current = pos;
        lastWrittenRef.current = pos;
        snappedRef.current = false;
        lastWheelRef.current = 0;
        updateHud(photo.i, maxScroll > 0 ? pos / maxScroll : 0);
      });
    },
    [toggleContact, total, updateHud]
  );

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    const roll = rollRef.current;
    if (!roll) return;

    const handleWheel = (event: WheelEvent) => {
      if (contact || light || view !== "gallery") return;
      event.preventDefault();
      const dominant = Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
      targetRef.current += dominant * WHEEL_GAIN;
      lastWheelRef.current = performance.now();
      snappedRef.current = false;
    };

    const handleScroll = () => {
      if (Math.abs(roll.scrollLeft - (lastWrittenRef.current ?? roll.scrollLeft)) > TOUCH_ADOPT_TOLERANCE) {
        targetRef.current = roll.scrollLeft;
        const now = performance.now();
        lastNativeInputRef.current = now;
        lastWheelRef.current = now;
        snappedRef.current = false;
      }
    };

    roll.addEventListener("wheel", handleWheel, { passive: false });
    roll.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      roll.removeEventListener("wheel", handleWheel);
      roll.removeEventListener("scroll", handleScroll);
    };
  }, [contact, light, view]);

  useEffect(() => {
    updateHud(currentIndexRef.current, 0);
  }, [updateHud]);

  useEffect(() => {
    return () => {
      if (contactTimerRef.current) window.clearTimeout(contactTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(runMotionFrame);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [runMotionFrame]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape") {
        if (light) {
          closeLightbox();
        } else if (contact === "open") {
          toggleContact();
        } else if (contact) {
          setContact(false);
        } else if (view === "about") {
          setView("gallery");
          router.push("/gallery");
        }
      }
      if (key === "c" && view === "gallery" && !light) toggleContact();
      if (event.key === "ArrowLeft" && view === "gallery" && !light) stepFrame(-1);
      if (event.key === "ArrowRight" && view === "gallery" && !light) stepFrame(1);
      if (key === "f" && view === "gallery" && !light) {
        const activePhoto = hoveredRef.current ?? frames[currentIndexRef.current];
        if (activePhoto) openLightbox(activePhoto);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    closeLightbox,
    contact,
    frames,
    light,
    openLightbox,
    router,
    stepFrame,
    toggleContact,
    view,
  ]);

  const frameDigits = String(cur).padStart(3, "0").split("");
  const digitList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="evf-site" data-view={view} data-contact={contact || undefined}>
      <div className="evf-frame" aria-hidden="true" />
      <div className="evf-corner evf-corner-tl" aria-hidden="true" />
      <div className="evf-corner evf-corner-tr" aria-hidden="true" />
      <div className="evf-corner evf-corner-bl" aria-hidden="true" />
      <div className="evf-corner evf-corner-br" aria-hidden="true" />

      <header className="evf-top-hud">
        <div className="evf-nav-group">
          <Link className="evf-wordmark" href="/gallery" onClick={() => setView("gallery")}>
            THE WANDERING BUNNY
          </Link>
          <nav className="evf-nav" aria-label="Primary navigation">
            <Link
              href="/gallery"
              data-active={activePath === "gallery"}
              onClick={() => setView("gallery")}
            >
              Gallery
            </Link>
            <Link
              href="/about"
              data-active={activePath === "about"}
              onClick={() => setView("about")}
            >
              About
            </Link>
          </nav>
        </div>
        <div className="evf-camera-readout" aria-label="Camera status">
          <span className="evf-chip">Classic Neg.</span>
          <span>AF-S</span>
          <BatteryIcon />
        </div>
      </header>

      <main className="evf-main">
        {view === "about" ? (
            <section key="about" className="evf-about">
              <p>
                Photographs shot on Fujifilm.
              </p>
              <span className="evf-about-contact">
                @thewanderingbunny.com
              </span>
            </section>
          ) : (
            <section
              key="gallery"
              className="evf-gallery"
              aria-label="Horizontal photo filmstrip"
            >
              <div
                ref={rollRef}
                className="evf-roll"
                onMouseEnter={() => {
                  hoverPauseRef.current = true;
                }}
                onMouseLeave={() => {
                  hoverPauseRef.current = false;
                  hoveredRef.current = null;
                  updateHud(currentIndexRef.current);
                }}
              >
                {frames.map((photo) => {
                  const intrinsic = getThumbIntrinsicSize(photo);
                  return (
                    <button
                      key={photo.id}
                      data-ph="1"
                      type="button"
                      className="evf-frame-card"
                      data-orientation={photo.orientation}
                      onClick={() => openLightbox(photo)}
                onMouseEnter={() => {
                  if (isMobileRef.current) return;
                  hoverPauseRef.current = true;
                  hoveredRef.current = photo;
                  updateHud(currentIndexRef.current, undefined, photo);
                }}
                onFocus={() => {
                  if (isMobileRef.current) return;
                  hoverPauseRef.current = true;
                  hoveredRef.current = photo;
                  updateHud(currentIndexRef.current, undefined, photo);
                      }}
                      onBlur={() => {
                        hoverPauseRef.current = false;
                        hoveredRef.current = null;
                        updateHud(currentIndexRef.current);
                      }}
                      aria-label={`Open frame ${photo.num}`}
                    >
                      <span className="evf-frame-num">{photo.num}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumbUrl}
                        srcSet={buildPhotoSrcSet(photo)}
                        alt={getPhotoAlt(photo, "Photo")}
                        width={intrinsic.width}
                        height={intrinsic.height}
                        sizes="(max-width: 760px) 74vw, 60vw"
                        loading={photo.i < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          )}
      </main>

      <footer className="evf-bottom-hud">
        <div className="evf-meter" aria-label="Exposure meter">
          <div className="evf-meter-labels">
            <span>-3</span>
            <span>0</span>
            <span>+3</span>
          </div>
          <div className="evf-meter-track">
            <span ref={needleRef} className="evf-meter-needle" />
          </div>
        </div>
        <div ref={exifRef} className="evf-exif" aria-live="polite">
          {exifLine(frames[0])}
        </div>
        <div className="evf-counter">
          <button
            type="button"
            className="evf-contact-toggle"
            onClick={toggleContact}
            aria-label="Toggle contact sheet"
          >
            SHEET
          </button>
          <span className="evf-contact-hint">C — Contact Sheet</span>
          <strong className="evf-frame-counter">
            <span className="evf-frame-counter-label">FRM</span>
            {frameDigits.map((digit, index) => (
              <span className="evf-digit-window" key={index}>
                <span
                  className="evf-digit-column"
                  style={{
                    transform: `translateY(calc(${-Number.parseInt(digit, 10)} * var(--evf-digit-height)))`,
                  }}
                >
                  {digitList.map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </span>
              </span>
            ))}
            <span className="evf-frame-counter-total">/{String(total).padStart(3, "0")}</span>
          </strong>
        </div>
      </footer>

      {contact && view === "gallery" && (
          <div className="evf-contact-sheet" data-state={contact}>
            <div className="evf-contact-grid">
              {frames.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => jumpFromContact(photo)}
                  aria-label={`Go to frame ${photo.num}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl}
                    alt=""
                    width={getThumbIntrinsicSize(photo).width}
                    height={getThumbIntrinsicSize(photo).height}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{photo.num}</span>
                </button>
              ))}
            </div>
          </div>
      )}

      {light && (
          <div className="evf-lightbox" onClick={closeLightbox}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={light.originalUrl}
                alt={getPhotoAlt(light, "Photo")}
                width={light.width}
                height={light.height}
                decoding="async"
              />
              <figcaption>
                <span className="evf-lightbox-meta-full">{lightboxMeta(light)}</span>
                <span className="evf-lightbox-meta-short">
                  {`FRM ${light.num} · ${light.mm} ${light.ap} ${light.sh} ISO ${light.isoValue}`}
                </span>
              </figcaption>
            </figure>
          </div>
      )}

      {shutter && <div className="evf-shutter" />}
    </div>
  );
}
