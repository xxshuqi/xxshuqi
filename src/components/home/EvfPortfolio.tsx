"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
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
  mm: string | null;
  ap: string | null;
  sh: string | null;
  isoValue: string | null;
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
const FRAME_EDGE_INSET = 18;
const EDGE_SCENE_BLEND = 0.42;
const LIGHTBOX_TITLES: Record<string, string> = {
  "random-001": "The Traveller",
  "random-002": "The Wandering Couple",
  "random-003": "Malaysian Vendors",
  "random-004": "Woman Behind Glass",
  "random-005": "Straw Hats, Grey Sea",
  "random-006": "Pentax on Rust",
  "random-007": "Light on Black Water",
  "random-008": "The Couple",
  "random-009": "Field Through the Window",
  "random-010": "Alley No. 5 Butler 2",
  "random-011": "Alley No. 5 Butler",
  "thailand-001": "Behind the Buddha",
  "thailand-002": "Thai Buddha",
  "thailand-003": "Resting in the Green",
};

function compactLens(lens?: string | null) {
  if (!lens) return null;
  const prime = lens.match(/(\d+(?:\.\d+)?)\s*mm/i);
  return prime ? `${Number(prime[1])}mm` : lens;
}

function compactShutter(shutter?: string | null) {
  if (!shutter) return null;
  return shutter.replace(/s$/i, "");
}

function compactIso(iso?: string | null) {
  if (!iso) return null;
  return iso.replace(/iso/i, "").trim();
}

function compactFilmSim(filmSim?: string | null) {
  if (!filmSim) return null;
  if (/classic\s+negative/i.test(filmSim)) return "CLASSIC NEG.";
  return filmSim.toUpperCase();
}

function toEvfPhotos(photos: PhotoAsset[]): EvfPhoto[] {
  return photos.map((photo, index) => ({
    ...photo,
    i: index,
    num: String(index + 1).padStart(3, "0"),
    orientation: photo.width > photo.height ? "landscape" : "portrait",
    mm: compactLens(photo.lens),
    ap: photo.aperture || null,
    sh: compactShutter(photo.shutter),
    isoValue: compactIso(photo.iso),
  }));
}

function exposureParts(photo?: EvfPhoto | null) {
  if (!photo) return [];
  return [
    photo.mm,
    photo.ap,
    photo.sh,
    photo.isoValue ? `ISO ${photo.isoValue}` : null,
  ].filter(Boolean);
}

function exifLine(photo?: EvfPhoto | null) {
  const parts = exposureParts(photo);
  return parts.length ? `${parts.join("  ")}  AWB` : "";
}

function shortExifLine(photo?: EvfPhoto | null) {
  if (!photo) return "";
  return [photo.mm, photo.ap, photo.sh].filter(Boolean).join(" ");
}

function lightboxTitle(photo: EvfPhoto) {
  return photo.title?.trim() || LIGHTBOX_TITLES[photo.id] || "Quiet Frame";
}

function lightboxHeading(photo: EvfPhoto) {
  return `FRM ${photo.num} · ${lightboxTitle(photo)}`;
}

function lightboxExposureLine(photo: EvfPhoto) {
  const parts = exposureParts(photo);
  const filmSim = compactFilmSim(photo.filmSim);
  return [parts.join(" "), filmSim].filter(Boolean).join(" · ");
}

function equipmentLine(photo?: EvfPhoto | null) {
  if (!photo) return null;
  return [photo.camera, photo.lensModel].filter(Boolean).join(" · ") || null;
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
  const reduceMotion = useReducedMotion();
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
  const hasFrames = frames.length > 0;
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
        if (!hasFrames) {
          exifRef.current.textContent = "";
          return;
        }

        const activePhoto = isMobileRef.current
          ? frames[safeIndex] ?? frames[0]
          : exifPhoto ?? hoveredRef.current ?? frames[safeIndex] ?? frames[0];
        exifRef.current.textContent = isMobileRef.current && activePhoto
          ? shortExifLine(activePhoto)
          : exifLine(activePhoto);
      }
    },
    [frames, hasFrames, total]
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

  const getFrameScrollLeft = useCallback(
    (index: number) => {
      const roll = rollRef.current;
      if (!roll) return 0;

      const maxScroll = Math.max(roll.scrollWidth - roll.clientWidth, 0);
      const nodes = getPhotoNodes();
      const safeIndex = Math.min(nodes.length - 1, Math.max(0, index));
      const node = nodes[safeIndex];

      if (!node) {
        const ratio = total <= 1 ? 0 : safeIndex / (total - 1);
        return ratio * maxScroll;
      }

      let nextLeft = node.offsetLeft + node.offsetWidth / 2 - roll.clientWidth / 2;

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];

      if (safeIndex === 0 && firstNode) {
        const edgeLeft = firstNode.offsetLeft - FRAME_EDGE_INSET;
        if (nextLeft > edgeLeft) {
          nextLeft = edgeLeft + (nextLeft - edgeLeft) * EDGE_SCENE_BLEND;
        }
      }

      if (safeIndex >= nodes.length - 2 && lastNode) {
        const edgeLeft =
          lastNode.offsetLeft + lastNode.offsetWidth + FRAME_EDGE_INSET - roll.clientWidth;
        if (nextLeft < edgeLeft) {
          nextLeft = edgeLeft - (edgeLeft - nextLeft) * EDGE_SCENE_BLEND;
        }
      }

      return Math.max(0, Math.min(maxScroll, nextLeft));
    },
    [getPhotoNodes, total]
  );

  const getOpeningSnapThreshold = useCallback(() => {
    const roll = rollRef.current;
    if (!roll || total <= 1) return 0;

    const nodes = getPhotoNodes();
    const secondNode = nodes[1];
    if (!secondNode) return 0;

    const secondFrameCenter =
      secondNode.offsetLeft + secondNode.offsetWidth / 2 - roll.clientWidth / 2;
    return Math.max(96, secondFrameCenter * 0.52);
  }, [getPhotoNodes, total]);

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
        let bestDistance = Infinity;

        const distances = nodes.map((node, index) => {
          const center = node.offsetLeft + node.offsetWidth / 2;
          const distance = Math.abs(center - viewportCenter);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = index;
          }
          return halfViewport > 0 ? distance / halfViewport : 0;
        });

        if (FOCUS_PULL) {
          nodes.forEach((node, index) => {
            const t = Math.max(0, distances[index] - 0.32);
            node.style.filter = "none";
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
          const openingThreshold = getOpeningSnapThreshold();
          targetRef.current =
            bestIndex <= 1 &&
            roll.scrollLeft <= openingThreshold &&
            targetRef.current <= openingThreshold
              ? 0
              : getFrameScrollLeft(bestIndex);
          snappedRef.current = true;
        }

        const nextProg = maxScroll > 0 ? roll.scrollLeft / maxScroll : 0;
        updateHud(bestIndex, nextProg);
      }

      rafRef.current = window.requestAnimationFrame(runMotionFrame);
    },
    [
      contact,
      getFrameScrollLeft,
      getOpeningSnapThreshold,
      getPhotoNodes,
      light,
      updateHud,
      view,
    ]
  );

  const scrollToFrame = useCallback(
    (index: number, behavior: ScrollBehavior = "auto") => {
      const roll = rollRef.current;
      if (!roll) return;
      const maxScroll = Math.max(roll.scrollWidth - roll.clientWidth, 0);
      const nextLeft = getFrameScrollLeft(index);
      const ratio = maxScroll > 0 ? nextLeft / maxScroll : 0;
      targetRef.current = nextLeft;
      roll.scrollTo({ left: nextLeft, behavior });
      lastWrittenRef.current = nextLeft;
      snappedRef.current = false;
      lastWheelRef.current = 0;
      updateHud(index, ratio);
    },
    [getFrameScrollLeft, updateHud]
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
        const pos = getFrameScrollLeft(photo.i);
        roll.scrollLeft = pos;
        targetRef.current = pos;
        lastWrittenRef.current = pos;
        snappedRef.current = false;
        lastWheelRef.current = 0;
        updateHud(photo.i, maxScroll > 0 ? pos / maxScroll : 0);
      });
    },
    [getFrameScrollLeft, toggleContact, updateHud]
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
      const openingThreshold = getOpeningSnapThreshold();
      if (dominant < 0 && targetRef.current <= openingThreshold) {
        targetRef.current = 0;
      }
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
  }, [contact, getOpeningSnapThreshold, light, view]);

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

  const frameDigits = String(hasFrames ? cur : 0).padStart(3, "0").split("");
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
                      <motion.span
                        className="evf-frame-inner"
                        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
                        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        viewport={{ amount: 0.48, once: false }}
                        transition={{
                          duration: 0.52,
                          ease: [0.22, 0.9, 0.32, 1],
                        }}
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
                      </motion.span>
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
          {frames[0] ? exifLine(frames[0]) : ""}
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
            <span className="evf-frame-counter-total">/{String(frames.length).padStart(3, "0")}</span>
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
                <span className="evf-lightbox-meta-primary">
                  {lightboxHeading(light)}
                </span>
                {(lightboxExposureLine(light) || equipmentLine(light)) && (
                  <span className="evf-lightbox-meta-cycle">
                    {lightboxExposureLine(light) && (
                      <span className="evf-lightbox-meta-exposure">
                        {lightboxExposureLine(light)}
                      </span>
                    )}
                    {equipmentLine(light) && (
                      <span className="evf-lightbox-meta-equipment">
                        {equipmentLine(light)}
                      </span>
                    )}
                  </span>
                )}
              </figcaption>
            </figure>
          </div>
      )}

      {shutter && <div className="evf-shutter" />}
    </div>
  );
}
