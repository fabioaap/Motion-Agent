import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type {MotionSceneJob, MotionSceneLayer} from "@motion-agent/runtime";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

function resolveSource(source: string): string {
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  const normalized = source.replace(/^\/+/, "").replace(/^public\//, "");
  return staticFile(normalized);
}

function isVideo(type: string): boolean {
  return ["MP4", "WEBM", "MOV", "M4V"].includes(type.toUpperCase());
}

function animationStyle(layer: MotionSceneLayer, frame: number, fps: number): React.CSSProperties {
  if (layer.motionFamily === "Static") return {opacity: 1};

  const localFrame = frame - layer.startFrame;
  const progress = spring({
    frame: localFrame,
    fps,
    config: {damping: 18, stiffness: 120, mass: 0.85}
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], clamp);
  const family = layer.motionFamily.toLowerCase();

  if (family.includes("scale")) {
    const scale = interpolate(progress, [0, 1], [0.88, 1], clamp);
    return {opacity, transform: `scale(${scale})`};
  }

  if (family.includes("mask")) {
    const reveal = interpolate(progress, [0, 1], [100, 0], clamp);
    return {opacity, clipPath: `inset(0 ${reveal}% 0 0 round 18px)`};
  }

  if (family.includes("pan") || family.includes("zoom")) {
    const span = Math.max(1, layer.endFrame - layer.startFrame);
    const t = interpolate(frame, [layer.startFrame, layer.startFrame + span], [0, 1], clamp);
    const scale = interpolate(t, [0, 1], [1, 1.055], clamp);
    const translateX = interpolate(t, [0, 1], [0, -1.6], clamp);
    return {opacity, transform: `translateX(${translateX}%) scale(${scale})`};
  }

  if (family.includes("focus")) {
    const scale = interpolate(progress, [0, 1], [0.96, 1], clamp);
    const shadow = interpolate(progress, [0, 1], [0, 1], clamp);
    return {
      opacity,
      transform: `scale(${scale})`,
      filter: `drop-shadow(0 24px ${42 + 18 * shadow}px rgba(0,0,0,${0.22 + 0.18 * shadow}))`
    };
  }

  const translateY = interpolate(progress, [0, 1], [34, 0], clamp);
  const scale = family.includes("premium")
    ? interpolate(progress, [0, 1], [0.955, 1], clamp)
    : 1;

  return {
    opacity,
    transform: `translateY(${translateY}px) scale(${scale})`
  };
}

const AssetLayer: React.FC<{layer: MotionSceneLayer; job: MotionSceneJob}> = ({layer, job}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const src = resolveSource(layer.source);
  const animated = job.qaStatic ? {opacity: 1} : animationStyle(layer, frame, fps);

  const common: React.CSSProperties = {
    position: "absolute",
    left: `${layer.x * 100}%`,
    top: `${layer.y * 100}%`,
    width: `${layer.width * 100}%`,
    height: `${layer.height * 100}%`,
    transformOrigin: "center center",
    translate: "-50% -50%",
    zIndex: layer.zIndex,
    overflow: "hidden",
    borderRadius: job.presentation === "FULL_FRAME" ? 0 : 24,
    ...animated
  };

  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: layer.fit,
    display: "block"
  };

  return (
    <div style={common} data-element-id={layer.elementId} data-strategy={layer.strategy}>
      {isVideo(layer.type) ? (
        <OffthreadVideo src={src} style={mediaStyle} />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
    </div>
  );
};

export const MotionScene: React.FC<MotionSceneJob> = (job) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleProgress = spring({frame, fps, config: {damping: 20, stiffness: 95}});
  const titleOpacity = job.qaStatic ? 1 : interpolate(titleProgress, [0, 1], [0, 1], clamp);
  const titleY = job.qaStatic ? 0 : interpolate(titleProgress, [0, 1], [24, 0], clamp);

  return (
    <AbsoluteFill style={{background: job.background, overflow: "hidden"}}>
      {job.presentation === "CANVAS" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 72% 28%, rgba(132,94,247,0.18), transparent 34%), radial-gradient(circle at 20% 78%, rgba(63,205,161,0.14), transparent 30%)"
          }}
        />
      ) : null}

      {job.layers.map((layer) => (
        <AssetLayer key={layer.elementId} layer={layer} job={job} />
      ))}

      {job.showTitle ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: "8%",
            color: "white",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            textAlign: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`
          }}
        >
          <div>
            <div style={{fontSize: Math.max(46, job.width * 0.045), fontWeight: 800, letterSpacing: -2}}>
              {job.title}
            </div>
            <div style={{fontSize: Math.max(20, job.width * 0.014), opacity: 0.62, marginTop: 20}}>
              {job.objective}
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
