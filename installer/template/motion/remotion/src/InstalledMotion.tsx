import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

type InstalledMotionProps = {
  title: string;
  subtitle: string;
};

export const InstalledMotion: React.FC<InstalledMotionProps> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({frame, fps, config: {damping: 18, stiffness: 110, mass: 0.9}});
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [36, 0]);
  const scale = interpolate(progress, [0, 1], [0.97, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "#0b1020",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
      }}
    >
      <div
        style={{
          textAlign: "center",
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          maxWidth: 1200,
          padding: 80
        }}
      >
        <div style={{fontSize: 92, fontWeight: 800, letterSpacing: -4}}>{title}</div>
        <div style={{fontSize: 34, opacity: 0.62, marginTop: 24, lineHeight: 1.35}}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};
