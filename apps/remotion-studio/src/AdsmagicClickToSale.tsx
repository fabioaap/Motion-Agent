import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame
} from "remotion";

const FADE = 7;
const GREEN = "#3BB56D";
const NAVY = "#010543";

type SceneSpec = {
  id: string;
  source: string;
  start: number;
  end: number;
};

type Crop = [top: number, right: number, bottom: number, left: number];

const scenes: SceneSpec[] = [
  {id: "hook", source: "adsmagic-do-clique-a-venda/hook.webp", start: 0, end: 60},
  {id: "anuncio", source: "adsmagic-do-clique-a-venda/ad.webp", start: 60, end: 120},
  {id: "clique-whatsapp", source: "adsmagic-do-clique-a-venda/click.webp", start: 120, end: 180},
  {id: "conversa", source: "adsmagic-do-clique-a-venda/conversation.webp", start: 180, end: 255},
  {id: "contexto-evento", source: "adsmagic-do-clique-a-venda/context.webp", start: 255, end: 330},
  {id: "pedido-confirmado", source: "adsmagic-do-clique-a-venda/order.webp", start: 330, end: 405},
  {id: "visao-consolidada", source: "adsmagic-do-clique-a-venda/overview.webp", start: 405, end: 495},
  {id: "encerramento", source: "adsmagic-do-clique-a-venda/hook.webp", start: 495, end: 540}
];

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const cinematic = Easing.bezier(0.22, 1, 0.36, 1);
const soft = Easing.bezier(0.42, 0, 0.2, 1);

const local = (frame: number, scene: SceneSpec) => frame - scene.start;
const duration = (scene: SceneSpec) => scene.end - scene.start;

function progress(frame: number, start: number, end: number, easing = cinematic) {
  return interpolate(frame, [start, end], [0, 1], {...clamp, easing});
}

function sceneOpacity(scene: SceneSpec, frame: number, index: number) {
  const first = index === 0;
  const last = index === scenes.length - 1;
  const fadeIn = first ? 1 : interpolate(frame, [scene.start - FADE, scene.start + FADE], [0, 1], clamp);
  const fadeOut = last ? 1 : interpolate(frame, [scene.end - FADE, scene.end + FADE], [1, 0], clamp);
  return Math.min(fadeIn, fadeOut);
}

const cropPath = ([top, right, bottom, left]: Crop) =>
  `inset(${top}% ${right}% ${bottom}% ${left}%)`;

const BaseFrame: React.FC<{
  source: string;
  p: number;
  dim?: number;
  x?: number;
  y?: number;
  zoom?: number;
  blur?: number;
}> = ({source, p, dim = 0.82, x = 0, y = 0, zoom = 0.03, blur = 0}) => (
  <AbsoluteFill>
    <Img
      src={staticFile(source)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `brightness(${dim}) saturate(.94) blur(${blur}px)`,
        transform: `translate(${x * p}%, ${y * p}%) scale(${1 + zoom * p})`,
        transformOrigin: "50% 50%"
      }}
    />
  </AbsoluteFill>
);

const ComponentLayer: React.FC<{
  source: string;
  crop: Crop;
  p: number;
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  fromScale?: number;
  toScale?: number;
  opacity?: number;
  brightness?: number;
  z?: number;
}> = ({
  source,
  crop,
  p,
  fromX = 0,
  toX = 0,
  fromY = 0,
  toY = 0,
  fromScale = 1,
  toScale = 1,
  opacity = 0.72,
  brightness = 1,
  z = 2
}) => {
  const [top, right, bottom, left] = crop;
  const leftPx = 1920 * (left / 100);
  const topPx = 1080 * (top / 100);
  const widthPx = 1920 * ((100 - left - right) / 100);
  const heightPx = 1080 * ((100 - top - bottom) / 100);

  const x = interpolate(p, [0, 1], [fromX * 24, toX * 24], clamp);
  const y = interpolate(p, [0, 1], [fromY * 24, toY * 24], clamp);
  const scale = interpolate(p, [0, 1], [fromScale, toScale], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: leftPx,
        top: topPx,
        width: widthPx,
        height: heightPx,
        overflow: "hidden",
        zIndex: z,
        opacity: opacity * p,
        pointerEvents: "none",
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        transformOrigin: "50% 50%",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, #000 58%, rgba(0,0,0,.94) 72%, transparent 100%)",
        maskImage:
          "radial-gradient(ellipse at center, #000 58%, rgba(0,0,0,.94) 72%, transparent 100%)"
      }}
    >
      <Img
        src={staticFile(source)}
        style={{
          position: "absolute",
          left: -leftPx,
          top: -topPx,
          width: 1920,
          height: 1080,
          objectFit: "cover",
          filter: `brightness(${brightness}) saturate(1.01)`
        }}
      />
    </div>
  );
};

const SignalReveal: React.FC<{
  source: string;
  p: number;
  top?: number;
  bottom?: number;
  opacity?: number;
}> = ({source, p, top = 35, bottom = 20, opacity = 1}) => {
  const right = interpolate(p, [0, 1], [98, 0], clamp);
  const travel = interpolate(p, [0, 1], [-1.2, 0], clamp);

  return (
    <AbsoluteFill style={{zIndex: 4, pointerEvents: "none"}}>
      <Img
        src={staticFile(source)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          clipPath: `inset(${top}% ${right}% ${bottom}% 0%)`,
          opacity,
          filter: "brightness(1.08) saturate(1.03)",
          transform: `translateX(${travel}%)`
        }}
      />
    </AbsoluteFill>
  );
};

const FocusPulse: React.FC<{x: number; y: number; p: number; size?: number}> = ({
  x,
  y,
  p,
  size = 26
}) => {
  const scale = interpolate(p, [0, 0.72, 1], [0.55, 1, 0.88], clamp);
  const alpha = interpolate(p, [0, 0.25, 1], [0, 0.75, 0.1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        border: `2px solid rgba(59,181,109,${alpha})`,
        transform: `scale(${scale})`,
        boxShadow: `0 0 20px rgba(59,181,109,${alpha * 0.34})`,
        zIndex: 6
      }}
    />
  );
};

const SceneHook: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const enter = progress(lf, 0, 18);
  const objects = progress(lf, 8, 32);
  const signal = progress(lf, 10, 50, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.90} x={-0.45} zoom={0.028} />
      <ComponentLayer source={scene.source} crop={[0, 46, 55, 0]} p={enter} fromY={0.12} toY={0} brightness={1.08} opacity={0.58} z={5} />
      <ComponentLayer source={scene.source} crop={[44, 78, 2, 1]} p={objects} fromY={1.1} toY={0.1} fromScale={0.98} toScale={1.005} brightness={1.06} />
      <ComponentLayer source={scene.source} crop={[33, 57, 0, 31]} p={progress(lf, 13, 36)} fromY={1.6} toY={0} fromScale={0.975} toScale={1.01} />
      <ComponentLayer source={scene.source} crop={[42, 27, 0, 54]} p={progress(lf, 17, 40)} fromY={1.1} toY={-0.1} fromScale={0.98} toScale={1.012} />
      <ComponentLayer source={scene.source} crop={[10, 0, 0, 73]} p={progress(lf, 20, 45)} fromX={1.2} toX={0} fromScale={0.985} toScale={1.015} />
      <SignalReveal source={scene.source} p={signal} top={34} bottom={17} opacity={0.96} />
    </AbsoluteFill>
  );
};

const SceneAd: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const card = progress(lf, 0, 20);
  const phone = progress(lf, 15, 34);
  const signal = progress(lf, 8, 48, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.90} x={-0.25} zoom={0.022} />
      <ComponentLayer source={scene.source} crop={[16, 43, 12, 23]} p={card} fromX={-1.4} toX={0} fromScale={0.96} toScale={1.01} brightness={1.08} z={5} />
      <ComponentLayer source={scene.source} crop={[5, 0, 8, 68]} p={phone} fromX={1.2} toX={0} fromScale={0.98} toScale={1.012} brightness={1.04} />
      <SignalReveal source={scene.source} p={signal} top={37} bottom={25} opacity={0.94} />
      <FocusPulse x={973} y={559} p={progress(lf, 28, 50)} size={34} />
    </AbsoluteFill>
  );
};

const SceneClick: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const ad = progress(lf, 0, 17);
  const bridge = progress(lf, 8, 40, soft);
  const phone = progress(lf, 18, 43);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.90} x={0.32} zoom={0.025} />
      <ComponentLayer source={scene.source} crop={[10, 48, 13, 12]} p={ad} fromX={-0.8} toX={0.2} fromScale={0.985} toScale={1.015} brightness={1.05} />
      <SignalReveal source={scene.source} p={bridge} top={36} bottom={22} opacity={0.98} />
      <ComponentLayer source={scene.source} crop={[5, 2, 7, 67]} p={phone} fromX={1.4} toX={0} fromScale={0.96} toScale={1.015} brightness={1.06} z={5} />
      <FocusPulse x={1120} y={570} p={progress(lf, 16, 38)} size={38} />
    </AbsoluteFill>
  );
};

const SceneConversation: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const phone = progress(lf, 0, 23);
  const message1 = progress(lf, 16, 34);
  const message2 = progress(lf, 28, 48);
  const signal = progress(lf, 10, 58, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.89} x={-0.2} zoom={0.02} />
      <ComponentLayer source={scene.source} crop={[5, 26, 1, 31]} p={phone} fromY={1.15} toY={0} fromScale={0.975} toScale={1.012} brightness={1.05} z={5} />
      <ComponentLayer source={scene.source} crop={[34, 35, 47, 43]} p={message1} fromX={0.4} toX={0} fromY={0.8} toY={0} brightness={1.11} z={6} />
      <ComponentLayer source={scene.source} crop={[49, 34, 32, 41]} p={message2} fromX={0.5} toX={0} fromY={0.7} toY={0} brightness={1.12} z={6} />
      <SignalReveal source={scene.source} p={signal} top={38} bottom={20} opacity={0.92} />
    </AbsoluteFill>
  );
};

const SceneContext: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const phone = progress(lf, 0, 20);
  const eventPanel = progress(lf, 14, 39);
  const checks = progress(lf, 28, 55);
  const signal = progress(lf, 10, 63, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.89} x={0.25} zoom={0.02} />
      <ComponentLayer source={scene.source} crop={[6, 55, 2, 19]} p={phone} fromX={-0.8} toX={0} fromScale={0.98} toScale={1.01} brightness={1.04} z={4} />
      <ComponentLayer source={scene.source} crop={[13, 9, 11, 47]} p={eventPanel} fromX={1.0} toX={0} fromScale={0.97} toScale={1.012} brightness={1.07} z={5} />
      <ComponentLayer source={scene.source} crop={[31, 12, 24, 49]} p={checks} fromY={0.9} toY={0} brightness={1.11} z={6} />
      <SignalReveal source={scene.source} p={signal} top={39} bottom={17} opacity={0.96} />
    </AbsoluteFill>
  );
};

const SceneOrder: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const context = progress(lf, 0, 20);
  const order = progress(lf, 14, 38);
  const success = progress(lf, 27, 54);
  const signal = progress(lf, 8, 60, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.90} x={-0.18} zoom={0.021} />
      <ComponentLayer source={scene.source} crop={[12, 58, 6, 8]} p={context} fromX={-0.8} toX={0} brightness={1.02} />
      <ComponentLayer source={scene.source} crop={[17, 7, 9, 48]} p={order} fromX={0.9} toX={0} fromScale={0.975} toScale={1.01} brightness={1.07} z={5} />
      <ComponentLayer source={scene.source} crop={[9, 9, 54, 69]} p={success} fromScale={0.82} toScale={1.0} brightness={1.12} z={6} />
      <SignalReveal source={scene.source} p={signal} top={37} bottom={15} opacity={0.95} />
      <FocusPulse x={1510} y={423} p={success} size={62} />
    </AbsoluteFill>
  );
};

const SceneOverview: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const title = progress(lf, 0, 22);
  const journey = progress(lf, 10, 40);
  const dashboard = progress(lf, 24, 61);
  const signal = progress(lf, 8, 72, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.78} x={-0.12} zoom={0.018} blur={3.2} />
      <ComponentLayer source={scene.source} crop={[3, 52, 62, 0]} p={title} brightness={1.08} opacity={0.56} z={5} />
      <ComponentLayer source={scene.source} crop={[28, 28, 0, 15]} p={journey} fromY={0.9} toY={0} fromScale={0.985} toScale={1.01} brightness={1.03} z={4} />
      <ComponentLayer source={scene.source} crop={[12, 0, 24, 56]} p={dashboard} fromX={0.45} toX={0} fromScale={0.985} toScale={1.006} brightness={1.05} z={5} />
      <SignalReveal source={scene.source} p={signal} top={37} bottom={13} opacity={0.96} />
    </AbsoluteFill>
  );
};

const SceneEnd: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  const lf = local(frame, scene);
  const settle = progress(lf, 0, 26);
  const title = progress(lf, 5, 24);
  const signal = progress(lf, 0, 35, soft);

  return (
    <AbsoluteFill>
      <BaseFrame source={scene.source} p={progress(lf, 0, duration(scene), soft)} dim={0.92} x={0.22} zoom={-0.012} />
      <ComponentLayer source={scene.source} crop={[0, 46, 55, 0]} p={title} brightness={1.08} opacity={0.56} z={6} />
      <ComponentLayer source={scene.source} crop={[31, 0, 0, 0]} p={settle} fromY={0.55} toY={0} fromScale={1.012} toScale={1.0} brightness={1.02} z={4} />
      <SignalReveal source={scene.source} p={signal} top={34} bottom={17} opacity={0.96} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 46,
          width: interpolate(settle, [0, 1], [0, 420], clamp),
          height: 3,
          transform: "translateX(-50%)",
          borderRadius: 99,
          background: GREEN,
          opacity: 0.7,
          zIndex: 7
        }}
      />
    </AbsoluteFill>
  );
};

const SceneContent: React.FC<{scene: SceneSpec; frame: number}> = ({scene, frame}) => {
  switch (scene.id) {
    case "hook":
      return <SceneHook scene={scene} frame={frame} />;
    case "anuncio":
      return <SceneAd scene={scene} frame={frame} />;
    case "clique-whatsapp":
      return <SceneClick scene={scene} frame={frame} />;
    case "conversa":
      return <SceneConversation scene={scene} frame={frame} />;
    case "contexto-evento":
      return <SceneContext scene={scene} frame={frame} />;
    case "pedido-confirmado":
      return <SceneOrder scene={scene} frame={frame} />;
    case "visao-consolidada":
      return <SceneOverview scene={scene} frame={frame} />;
    default:
      return <SceneEnd scene={scene} frame={frame} />;
  }
};

export const AdsmagicClickToSale: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{backgroundColor: NAVY, overflow: "hidden"}}>
      {scenes.map((scene, index) => {
        const opacity = sceneOpacity(scene, frame, index);
        if (opacity <= 0) return null;
        return (
          <AbsoluteFill key={scene.id} style={{opacity}}>
            <SceneContent scene={scene} frame={frame} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 44%, transparent 52%, rgba(0,2,32,.19) 100%)"
        }}
      />
    </AbsoluteFill>
  );
};
