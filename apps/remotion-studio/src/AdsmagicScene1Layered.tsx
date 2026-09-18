import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame
} from "remotion";

const GREEN = "#20E4A5";
const WHITE = "#FFFFFF";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const soft = Easing.bezier(0.42, 0, 0.2, 1);

const progress = (frame: number, from: number, to: number, easing = ease) =>
  interpolate(frame, [from, to], [0, 1], {...clamp, easing});

const enterStyle = (
  p: number,
  {
    x = 0,
    y = 28,
    scale = 0.97,
    rotate = 0
  }: {x?: number; y?: number; scale?: number; rotate?: number} = {}
): React.CSSProperties => ({
  opacity: p,
  transform: `translate3d(${interpolate(p, [0, 1], [x, 0], clamp)}px, ${interpolate(
    p,
    [0, 1],
    [y, 0],
    clamp
  )}px, 0) scale(${interpolate(p, [0, 1], [scale, 1], clamp)}) rotate(${interpolate(
    p,
    [0, 1],
    [rotate, 0],
    clamp
  )}deg)`
});

const Scene1Signal: React.FC<{frame: number}> = ({frame}) => {
  const p = progress(frame, 9, 52, soft);
  const dash = interpolate(p, [0, 1], [1, 0], clamp);
  const glow = interpolate(p, [0, 0.25, 1], [0, 0.7, 0.44], clamp);

  const dotX = interpolate(
    p,
    [0, 0.28, 0.56, 0.78, 1],
    [325, 590, 850, 1115, 1555],
    clamp
  );
  const dotY = interpolate(
    p,
    [0, 0.28, 0.56, 0.78, 1],
    [610, 557, 602, 555, 365],
    clamp
  );

  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{position: "absolute", inset: 0, overflow: "visible"}}
      >
        <defs>
          <filter id="scene1-signal-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="scene1-signal-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#31D7FF" />
            <stop offset="32%" stopColor="#22E7C0" />
            <stop offset="68%" stopColor="#1FE5A0" />
            <stop offset="100%" stopColor="#4CFFD3" />
          </linearGradient>
        </defs>

        <path
          d="M325 610 C430 555 525 540 605 565 C690 592 742 640 825 608 C908 576 955 540 1032 560 C1115 582 1160 618 1230 578 C1340 515 1415 445 1555 365"
          fill="none"
          stroke="url(#scene1-signal-gradient)"
          strokeWidth="19"
          strokeLinecap="round"
          opacity={0.16 * glow}
          filter="url(#scene1-signal-glow)"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={dash}
        />
        <path
          d="M325 610 C430 555 525 540 605 565 C690 592 742 640 825 608 C908 576 955 540 1032 560 C1115 582 1160 618 1230 578 C1340 515 1415 445 1555 365"
          fill="none"
          stroke="url(#scene1-signal-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={dash}
          opacity={0.95}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: dotX - 7,
          top: dotY - 7,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#BFFFF0",
          boxShadow: "0 0 8px #BFFFF0, 0 0 24px rgba(32,228,165,.9)",
          opacity: p
        }}
      />
    </AbsoluteFill>
  );
};

const ClickPulse: React.FC<{frame: number}> = ({frame}) => {
  const p = progress(frame, 17, 28, soft);
  const fade = interpolate(p, [0, 0.45, 1], [0, 0.72, 0], clamp);
  const size = interpolate(p, [0, 1], [16, 58], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: 391 - size / 2,
        top: 643 - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,.86)",
        boxShadow: "0 0 18px rgba(55,205,255,.5)",
        opacity: fade,
        pointerEvents: "none"
      }}
    />
  );
};

export type AdsmagicScene1LayeredProps = {
  frameOverride?: number;
  staticReference?: boolean;
};

export const AdsmagicScene1Layered: React.FC<AdsmagicScene1LayeredProps> = ({
  frameOverride,
  staticReference = false
}) => {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const effectiveFrame = staticReference ? 59 : frame;

  const headline = progress(effectiveFrame, 0, 14);
  const ad = progress(effectiveFrame, 5, 22);
  const cursor = progress(effectiveFrame, 13, 28);
  const whatsapp = progress(effectiveFrame, 14, 34);
  const tracking = progress(effectiveFrame, 23, 43);

  const adFloat = interpolate(effectiveFrame, [22, 59], [0, -5], clamp);
  const whatsappFloat = interpolate(effectiveFrame, [34, 59], [0, -4], clamp);
  const trackingFloat = interpolate(effectiveFrame, [43, 59], [0, -3], clamp);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "#020817",
        fontFamily: "Inter, Arial, Helvetica, sans-serif"
      }}
    >
      <Img
        src={staticFile("adsmagic-do-clique-a-venda/scene1-layers/background.jpg")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />

      <Scene1Signal frame={effectiveFrame} />

      <div
        style={{
          position: "absolute",
          left: 112,
          top: 78,
          width: 590,
          ...enterStyle(headline, {x: -18, y: 12, scale: 0.99})
        }}
      >
        <div
          style={{
            color: WHITE,
            fontSize: 108,
            lineHeight: 0.9,
            fontWeight: 850,
            letterSpacing: -5.5
          }}
        >
          Do clique
        </div>
        <div
          style={{
            marginTop: 18,
            color: GREEN,
            fontSize: 108,
            lineHeight: 0.9,
            fontWeight: 850,
            letterSpacing: -5.5
          }}
        >
          à venda.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 118,
          top: 323 + adFloat,
          width: 372,
          ...enterStyle(ad, {x: -70, y: 36, scale: 0.92, rotate: -2})
        }}
      >
        <Img
          src={staticFile("adsmagic-do-clique-a-venda/scene1-layers/ad-card.webp")}
          style={{width: "100%", display: "block"}}
        />
      </div>

      <ClickPulse frame={effectiveFrame} />

      <div
        style={{
          position: "absolute",
          left: 397,
          top: 627,
          width: 62,
          transformOrigin: "20% 12%",
          ...enterStyle(cursor, {x: 26, y: 36, scale: 0.9, rotate: 4})
        }}
      >
        <Img
          src={staticFile("adsmagic-do-clique-a-venda/scene1-layers/cursor.webp")}
          style={{width: "100%", display: "block"}}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 594,
          top: 322 + whatsappFloat,
          width: 385,
          ...enterStyle(whatsapp, {x: -12, y: 54, scale: 0.91, rotate: 1.5})
        }}
      >
        <Img
          src={staticFile("adsmagic-do-clique-a-venda/scene1-layers/whatsapp-card.webp")}
          style={{width: "100%", display: "block"}}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 991,
          top: 378 + trackingFloat,
          width: 310,
          ...enterStyle(tracking, {x: 18, y: 48, scale: 0.93, rotate: 1.2})
        }}
      >
        <Img
          src={staticFile("adsmagic-do-clique-a-venda/scene1-layers/tracking-card.webp")}
          style={{width: "100%", display: "block"}}
        />
      </div>

      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 54% 57%, transparent 46%, rgba(0,4,18,.08) 100%)"
        }}
      />
    </AbsoluteFill>
  );
};
