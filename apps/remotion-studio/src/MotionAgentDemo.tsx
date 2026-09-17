import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import {demoMotionSpec} from "./demoSpec";

const stages = [
  {id: "asset_audit", label: "Asset Audit", detail: "Preserva o original"},
  {id: "scene_build", label: "Scene Build", detail: "Constrói só o necessário"},
  {id: "qa_loop", label: "QA Loop", detail: "Corrige antes de mostrar"},
  {id: "ready", label: "Ready", detail: "Preview validada"}
] as const;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const StageCard: React.FC<{
  index: number;
  label: string;
  detail: string;
  startFrame: number;
}> = ({index, label, detail, startFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {damping: 18, stiffness: 130, mass: 0.8}
  });
  const opacity = interpolate(progress, [0, 1], [0, 1], clamp);
  const translateY = interpolate(progress, [0, 1], [32, 0], clamp);
  const scale = interpolate(progress, [0, 1], [0.96, 1], clamp);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        padding: "28px 30px",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))",
        boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
        display: "flex",
        alignItems: "center",
        gap: 22,
        minHeight: 118
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          display: "grid",
          placeItems: "center",
          background: index === 3 ? "#D7FF64" : "rgba(215,255,100,0.12)",
          color: index === 3 ? "#08110D" : "#D7FF64",
          fontSize: 22,
          fontWeight: 800
        }}
      >
        {index + 1}
      </div>
      <div>
        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: -0.7}}>{label}</div>
        <div style={{fontSize: 18, color: "rgba(255,255,255,0.58)", marginTop: 7}}>{detail}</div>
      </div>
    </div>
  );
};

export const MotionAgentDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hero = spring({frame, fps, config: {damping: 20, stiffness: 90}});
  const titleY = interpolate(hero, [0, 1], [50, 0], clamp);
  const titleOpacity = interpolate(hero, [0, 1], [0, 1], clamp);
  const glow = interpolate(frame, [0, 90, 164], [0.25, 0.75, 0.35], clamp);

  return (
    <AbsoluteFill
      style={{
        background: "#070B14",
        color: "#F6F8FB",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 72% 34%, rgba(132, 94, 247, ${0.24 * glow}), transparent 34%), radial-gradient(circle at 22% 72%, rgba(63, 205, 161, ${0.18 * glow}), transparent 30%)`
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          padding: "104px 118px",
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          alignItems: "center",
          gap: 96
        }}
      >
        <div style={{opacity: titleOpacity, transform: `translateY(${titleY}px)`}}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              borderRadius: 999,
              background: "rgba(215,255,100,0.1)",
              border: "1px solid rgba(215,255,100,0.25)",
              color: "#D7FF64",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 0.8
            }}
          >
            @motion
          </div>
          <h1
            style={{
              fontSize: 88,
              lineHeight: 0.98,
              letterSpacing: -4.5,
              margin: "34px 0 30px",
              maxWidth: 720
            }}
          >
            Motion com grafo, QA e fidelidade.
          </h1>
          <p
            style={{
              fontSize: 26,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.62)",
              maxWidth: 650,
              margin: 0
            }}
          >
            O runtime decide a técnica, o Remotion executa e os críticos corrigem antes da aprovação humana.
          </p>
        </div>

        <div style={{display: "grid", gap: 18}}>
          {stages.map((stage, index) => {
            const action = demoMotionSpec.timeline.find((item) => item.element_id === stage.id);
            return (
              <StageCard
                key={stage.id}
                index={index}
                label={stage.label}
                detail={stage.detail}
                startFrame={action?.start_frame ?? index * 30}
              />
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 118,
          right: 118,
          bottom: 48,
          display: "flex",
          justifyContent: "space-between",
          color: "rgba(255,255,255,0.35)",
          fontSize: 16,
          letterSpacing: 0.5
        }}
      >
        <span>Motion Agent Studio</span>
        <span>{demoMotionSpec.fps} FPS · 1920 × 1080</span>
      </div>
    </AbsoluteFill>
  );
};
