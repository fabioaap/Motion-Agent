import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";

const FPS = 30;
const FADE = 7;

type Scene = {
  id: string;
  source: string;
  start: number;
  end: number;
  startScale: number;
  endScale: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
};

const scenes: Scene[] = [
  {
    id: "hook",
    source: "adsmagic-do-clique-a-venda/hook.jpg",
    start: 0,
    end: 60,
    startScale: 1.015,
    endScale: 1.065,
    startX: 0,
    endX: -0.8,
    startY: 0,
    endY: -0.35
  },
  {
    id: "anuncio",
    source: "adsmagic-do-clique-a-venda/ad.jpg",
    start: 60,
    end: 120,
    startScale: 1.08,
    endScale: 1.025,
    startX: 1.1,
    endX: 0,
    startY: 0.3,
    endY: 0
  },
  {
    id: "clique-whatsapp",
    source: "adsmagic-do-clique-a-venda/click.jpg",
    start: 120,
    end: 180,
    startScale: 1.02,
    endScale: 1.07,
    startX: -1,
    endX: 0.8,
    startY: 0,
    endY: -0.3
  },
  {
    id: "conversa",
    source: "adsmagic-do-clique-a-venda/conversation.jpg",
    start: 180,
    end: 255,
    startScale: 1.09,
    endScale: 1.035,
    startX: 0.8,
    endX: -0.35,
    startY: -0.2,
    endY: 0.2
  },
  {
    id: "contexto-evento",
    source: "adsmagic-do-clique-a-venda/context.jpg",
    start: 255,
    end: 330,
    startScale: 1.025,
    endScale: 1.075,
    startX: -0.9,
    endX: 0.35,
    startY: 0.2,
    endY: -0.3
  },
  {
    id: "pedido-confirmado",
    source: "adsmagic-do-clique-a-venda/order.jpg",
    start: 330,
    end: 405,
    startScale: 1.07,
    endScale: 1.025,
    startX: 0.75,
    endX: -0.2,
    startY: -0.25,
    endY: 0.15
  },
  {
    id: "visao-consolidada",
    source: "adsmagic-do-clique-a-venda/overview.jpg",
    start: 405,
    end: 495,
    startScale: 1.025,
    endScale: 1.075,
    startX: -0.45,
    endX: 0.65,
    startY: 0.2,
    endY: -0.2
  },
  {
    id: "encerramento",
    source: "adsmagic-do-clique-a-venda/hook.jpg",
    start: 495,
    end: 540,
    startScale: 1.08,
    endScale: 1.02,
    startX: 0.7,
    endX: 0,
    startY: 0.2,
    endY: 0
  }
];

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

function opacityForScene(scene: Scene, frame: number, index: number): number {
  const isFirst = index === 0;
  const isLast = index === scenes.length - 1;

  const fadeInStart = isFirst ? scene.start : scene.start - FADE;
  const fadeInEnd = isFirst ? scene.start : scene.start + FADE;
  const fadeOutStart = isLast ? scene.end : scene.end - FADE;
  const fadeOutEnd = isLast ? scene.end : scene.end + FADE;

  if (frame < fadeInStart || frame > fadeOutEnd) return 0;

  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], clamp);
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], clamp);

  return Math.min(fadeIn, fadeOut);
}

const SceneImage: React.FC<{scene: Scene; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const opacity = opacityForScene(scene, frame, index);
  if (opacity <= 0) return null;

  const localFrame = Math.max(scene.start, Math.min(frame, scene.end));
  const scale = interpolate(
    localFrame,
    [scene.start, scene.end],
    [scene.startScale, scene.endScale],
    clamp
  );
  const x = interpolate(
    localFrame,
    [scene.start, scene.end],
    [scene.startX, scene.endX],
    clamp
  );
  const y = interpolate(
    localFrame,
    [scene.start, scene.end],
    [scene.startY, scene.endY],
    clamp
  );

  return (
    <AbsoluteFill style={{opacity, overflow: "hidden"}}>
      <Img
        src={staticFile(scene.source)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${x}%, ${y}%) scale(${scale})`,
          transformOrigin: "50% 50%"
        }}
      />
    </AbsoluteFill>
  );
};

export const AdsmagicClickToSale: React.FC = () => {
  const frame = useCurrentFrame();

  const vignette = interpolate(
    Math.sin((frame / FPS) * Math.PI * 0.7),
    [-1, 1],
    [0.16, 0.23],
    clamp
  );

  return (
    <AbsoluteFill style={{backgroundColor: "#010543", overflow: "hidden"}}>
      {scenes.map((scene, index) => (
        <SceneImage key={scene.id} scene={scene} index={index} />
      ))}

      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            `radial-gradient(circle at 50% 44%, transparent 52%, rgba(0, 2, 32, ${vignette}) 100%)`
        }}
      />
    </AbsoluteFill>
  );
};
