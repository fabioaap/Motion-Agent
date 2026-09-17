import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

export type MotionJobStage = {
  id: string;
  label: string;
  detail: string;
  startFrame: number;
  status?: "pending" | "active" | "approved";
};

export type MotionJobPreviewProps = {
  jobId: string;
  title: string;
  objective: string;
  command?: string;
  fps: number;
  width: number;
  height: number;
  durationFrames: number;
  stages: MotionJobStage[];
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const Stage: React.FC<{stage: MotionJobStage; index: number}> = ({stage, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    frame: frame - stage.startFrame,
    fps,
    config: {damping: 18, stiffness: 125, mass: 0.8}
  });
  const opacity = interpolate(progress, [0, 1], [0, 1], clamp);
  const translateY = interpolate(progress, [0, 1], [28, 0], clamp);
  const isApproved = stage.status === "approved";

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "grid",
        gridTemplateColumns: "56px 1fr",
        gap: 20,
        alignItems: "center",
        padding: "24px 26px",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.055)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.24)"
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          display: "grid",
          placeItems: "center",
          background: isApproved ? "#D7FF64" : "rgba(215,255,100,0.1)",
          color: isApproved ? "#071009" : "#D7FF64",
          fontSize: 20,
          fontWeight: 800
        }}
      >
        {index + 1}
      </div>
      <div>
        <div style={{fontSize: 27, fontWeight: 750, letterSpacing: -0.6}}>{stage.label}</div>
        <div style={{fontSize: 17, color: "rgba(255,255,255,0.56)", marginTop: 6}}>{stage.detail}</div>
      </div>
    </div>
  );
};

export const MotionJobPreview: React.FC<MotionJobPreviewProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = spring({frame, fps, config: {damping: 20, stiffness: 90}});
  const titleY = interpolate(intro, [0, 1], [44, 0], clamp);
  const titleOpacity = interpolate(intro, [0, 1], [0, 1], clamp);
  const glow = interpolate(frame, [0, props.durationFrames * 0.55, props.durationFrames - 1], [0.3, 0.82, 0.38], clamp);

  return (
    <AbsoluteFill
      style={{
        background: "#070B14",
        color: "#F7F9FB",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 70% 30%, rgba(132,94,247,${0.22 * glow}), transparent 34%), radial-gradient(circle at 18% 78%, rgba(63,205,161,${0.16 * glow}), transparent 28%)`
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          padding: "96px 112px",
          display: "grid",
          gridTemplateColumns: "0.92fr 1.08fr",
          gap: 88,
          alignItems: "center"
        }}
      >
        <div style={{opacity: titleOpacity, transform: `translateY(${titleY}px)`}}>
          <div
            style={{
              display: "inline-flex",
              borderRadius: 999,
              padding: "10px 16px",
              border: "1px solid rgba(215,255,100,0.25)",
              background: "rgba(215,255,100,0.09)",
              color: "#D7FF64",
              fontSize: 18,
              fontWeight: 750
            }}
          >
            {props.command ?? "@motion"}
          </div>
          <h1
            style={{
              fontSize: 78,
              lineHeight: 1,
              letterSpacing: -4,
              margin: "32px 0 26px",
              maxWidth: 760
            }}
          >
            {props.title}
          </h1>
          <p
            style={{
              fontSize: 25,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.62)",
              maxWidth: 680,
              margin: 0
            }}
          >
            {props.objective}
          </p>
          <div style={{marginTop: 34, fontSize: 15, color: "rgba(255,255,255,0.34)"}}>
            Job {props.jobId}
          </div>
        </div>

        <div style={{display: "grid", gap: 16}}>
          {props.stages.map((stage, index) => (
            <Stage key={stage.id} stage={stage} index={index} />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 112,
          right: 112,
          bottom: 42,
          display: "flex",
          justifyContent: "space-between",
          color: "rgba(255,255,255,0.32)",
          fontSize: 15
        }}
      >
        <span>Motion Agent Job Preview</span>
        <span>{props.fps} FPS · {props.width} × {props.height}</span>
      </div>
    </AbsoluteFill>
  );
};
