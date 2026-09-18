import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame
} from "remotion";

const NAVY = "#010543";
const NAVY_2 = "#000E50";
const GREEN = "#3BB56D";
const CYAN = "#22D3EE";
const WHITE = "#FFFFFF";
const MUTED = "#B7C5E4";
const PANEL = "rgba(255,255,255,.075)";
const BORDER = "rgba(255,255,255,.14)";
const FPS = 30;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const soft = Easing.bezier(0.42, 0, 0.2, 1);

const p = (f: number, a: number, b: number, easing = ease) =>
  interpolate(f, [a, b], [0, 1], {...clamp, easing});

const sceneLocal = (frame: number, start: number) => frame - start;

const Layer: React.FC<React.PropsWithChildren<{
  progress: number;
  x?: number;
  y?: number;
  scaleFrom?: number;
  opacity?: number;
  blurFrom?: number;
  z?: number;
}>> = ({
  progress,
  x = 0,
  y = 24,
  scaleFrom = 0.985,
  opacity = 1,
  blurFrom = 0,
  z = 1,
  children
}) => {
  const tx = interpolate(progress, [0, 1], [x, 0], clamp);
  const ty = interpolate(progress, [0, 1], [y, 0], clamp);
  const scale = interpolate(progress, [0, 1], [scaleFrom, 1], clamp);
  const blur = interpolate(progress, [0, 1], [blurFrom, 0], clamp);
  return (
    <div
      style={{
        opacity: progress * opacity,
        transform: `translate3d(${tx}px,${ty}px,0) scale(${scale})`,
        filter: `blur(${blur}px)`,
        zIndex: z
      }}
    >
      {children}
    </div>
  );
};

const Surface: React.FC<React.PropsWithChildren<{
  width?: number;
  height?: number;
  padding?: number;
  radius?: number;
  style?: React.CSSProperties;
}>> = ({width, height, padding = 28, radius = 28, style, children}) => (
  <div
    style={{
      width,
      height,
      padding,
      borderRadius: radius,
      border: `1px solid ${BORDER}`,
      background: PANEL,
      boxShadow: "0 28px 80px rgba(0,0,0,.22)",
      backdropFilter: "blur(10px)",
      ...style
    }}
  >
    {children}
  </div>
);

const Kicker: React.FC<React.PropsWithChildren> = ({children}) => (
  <div style={{fontSize: 19, fontWeight: 800, letterSpacing: 2.2, color: GREEN, textTransform: "uppercase"}}>
    {children}
  </div>
);

const Headline: React.FC<React.PropsWithChildren<{size?: number; width?: number}>> = ({
  children,
  size = 82,
  width = 980
}) => (
  <div
    style={{
      marginTop: 18,
      width,
      color: WHITE,
      fontSize: size,
      lineHeight: 0.98,
      fontWeight: 800,
      letterSpacing: -3.4
    }}
  >
    {children}
  </div>
);

const Body: React.FC<React.PropsWithChildren<{width?: number}>> = ({children, width = 680}) => (
  <div style={{marginTop: 22, width, color: MUTED, fontSize: 27, lineHeight: 1.4}}>
    {children}
  </div>
);

const Badge: React.FC<React.PropsWithChildren<{green?: boolean}>> = ({children, green}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 13px",
      borderRadius: 999,
      border: `1px solid ${green ? "rgba(59,181,109,.44)" : BORDER}`,
      background: green ? "rgba(59,181,109,.12)" : "rgba(255,255,255,.06)",
      color: green ? "#BFF0D1" : WHITE,
      fontSize: 17,
      fontWeight: 700
    }}
  >
    {children}
  </span>
);

const Signal: React.FC<{progress: number; y?: number; from?: number; to?: number}> = ({
  progress,
  y = 820,
  from = 150,
  to = 1770
}) => {
  const width = (to - from) * progress;
  return (
    <div style={{position: "absolute", left: from, top: y, width: to - from, height: 24}}>
      <div style={{position: "absolute", left: 0, top: 10, width: "100%", height: 2, background: "rgba(255,255,255,.09)"}} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 9,
          width,
          height: 4,
          borderRadius: 99,
          background: `linear-gradient(90deg,${GREEN},${CYAN})`
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.max(0, width - 7),
          top: 5,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: GREEN,
          boxShadow: "0 0 18px rgba(59,181,109,.28)"
        }}
      />
    </div>
  );
};

const CinematicPlate: React.FC<{source: string; f: number; duration?: number; dim?: number; blur?: number}> = ({
  source,
  f,
  duration = 60,
  dim = 0.62,
  blur = 2.2
}) => {
  const drift = interpolate(f, [0, duration], [-0.7, 0.7], clamp);
  const zoom = interpolate(f, [0, duration], [1.035, 1.075], clamp);
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <Img
        src={staticFile(source)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `brightness(${dim}) saturate(.92) blur(${blur}px)`,
          transform: `translate3d(${drift}%,0,0) scale(${zoom})`,
          transformOrigin: "50% 50%"
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg,rgba(1,5,67,.72) 0%,rgba(1,5,67,.28) 42%,rgba(1,5,67,.18) 100%),linear-gradient(180deg,rgba(1,5,67,.10),rgba(1,5,67,.34))"
        }}
      />
    </AbsoluteFill>
  );
};

const GridBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 540], [0, 55], clamp);
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 82% 18%,rgba(34,211,238,.07),transparent 30%),radial-gradient(circle at 18% 82%,rgba(59,181,109,.08),transparent 28%),linear-gradient(145deg,#000E50 0%,#010543 58%,#020833 100%)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.10,
          transform: `translateX(${drift}px)`,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",
          backgroundSize: "72px 72px"
        }}
      />
    </AbsoluteFill>
  );
};

const CampaignPanel: React.FC<{f: number}> = ({f}) => {
  const title = p(f, 4, 18);
  const row1 = p(f, 10, 26);
  const row2 = p(f, 16, 32);
  const action = p(f, 22, 42);
  return (
    <Surface width={920} height={510}>
      <Layer progress={title} y={16}>
        <div style={{fontSize: 22, color: MUTED}}>Campanhas</div>
        <div style={{fontSize: 34, marginTop: 6, fontWeight: 800, color: WHITE}}>Google Ads e Meta Ads</div>
      </Layer>
      <div style={{marginTop: 34, display: "grid", gap: 16}}>
        <Layer progress={row1} x={-18} y={0}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, borderRadius: 18, background: "rgba(255,255,255,.055)", border: `1px solid ${BORDER}`}}>
            <div>
              <div style={{fontSize: 20, fontWeight: 800, color: WHITE}}>Google Ads</div>
              <div style={{marginTop: 6, fontSize: 16, color: MUTED}}>Origem rastreável</div>
            </div>
            <Badge green>Ativo</Badge>
          </div>
        </Layer>
        <Layer progress={row2} x={-18} y={0}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, borderRadius: 18, background: "rgba(255,255,255,.055)", border: `1px solid ${BORDER}`}}>
            <div>
              <div style={{fontSize: 20, fontWeight: 800, color: WHITE}}>Meta Ads</div>
              <div style={{marginTop: 6, fontSize: 16, color: MUTED}}>Origem rastreável</div>
            </div>
            <Badge green>Ativo</Badge>
          </div>
        </Layer>
      </div>
      <Layer progress={action} y={10}>
        <div style={{marginTop: 24, display: "flex", alignItems: "center", gap: 12, color: MUTED, fontSize: 17}}>
          <span style={{width: 10, height: 10, borderRadius: "50%", background: GREEN}} />
          origem conectada
        </div>
      </Layer>
    </Surface>
  );
};

const MessageBubble: React.FC<{side: "left" | "right"; progress: number; label: string}> = ({
  side,
  progress,
  label
}) => (
  <Layer progress={progress} x={side === "left" ? -22 : 22} y={8}>
    <div
      style={{
        width: 360,
        marginLeft: side === "right" ? 240 : 0,
        padding: "15px 18px",
        borderRadius: side === "left" ? "18px 18px 18px 5px" : "18px 18px 5px 18px",
        background: side === "right" ? "rgba(59,181,109,.18)" : "rgba(255,255,255,.075)",
        border: `1px solid ${side === "right" ? "rgba(59,181,109,.30)" : BORDER}`,
        color: WHITE,
        fontSize: 17
      }}
    >
      {label.trim() ? label : (
        <div style={{display: "grid", gap: 7}}>
          <span style={{display: "block", width: "82%", height: 8, borderRadius: 99, background: "rgba(255,255,255,.58)"}} />
          <span style={{display: "block", width: "56%", height: 8, borderRadius: 99, background: "rgba(255,255,255,.28)"}} />
        </div>
      )}
    </div>
  </Layer>
);

const MessagesPanel: React.FC<{f: number}> = ({f}) => (
  <Surface width={720} height={570}>
    <Layer progress={p(f, 0, 16)} y={14}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <div style={{fontSize: 31, fontWeight: 800, color: WHITE}}>Mensagens</div>
          <div style={{marginTop: 6, color: MUTED, fontSize: 16}}>Origem contatos iniciados rastreados</div>
        </div>
        <Badge green>WhatsApp</Badge>
      </div>
    </Layer>
    <div style={{marginTop: 36, display: "grid", gap: 17}}>
      <MessageBubble side="left" progress={p(f, 10, 26)} label=" " />
      <MessageBubble side="right" progress={p(f, 22, 38)} label=" " />
      <MessageBubble side="left" progress={p(f, 34, 52)} label=" " />
    </div>
  </Surface>
);

const ContactContextPanel: React.FC<{f: number}> = ({f}) => {
  const rows = [
    ["Origem", "Google Ads"],
    ["Canal", "WhatsApp"],
    ["Etapa", "Qualificado"],
    ["Campanha", "Origem rastreada"]
  ];
  return (
    <Surface width={780} height={510}>
      <Layer progress={p(f, 0, 16)} y={12}>
        <div style={{fontSize: 30, fontWeight: 800, color: WHITE}}>Contexto do contato</div>
      </Layer>
      <div style={{marginTop: 30, display: "grid", gap: 13}}>
        {rows.map(([label, value], i) => (
          <Layer key={label} progress={p(f, 10 + i * 8, 28 + i * 8)} x={18} y={0}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderRadius: 16, background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`}}>
              <span style={{color: MUTED, fontSize: 16}}>{label}</span>
              <span style={{color: WHITE, fontWeight: 800, fontSize: 17}}>{value}</span>
            </div>
          </Layer>
        ))}
      </div>
    </Surface>
  );
};

const SalePanel: React.FC<{f: number}> = ({f}) => {
  const ring = p(f, 14, 36);
  return (
    <Surface width={760} height={480} style={{display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center"}}>
      <Layer progress={ring} y={0} scaleFrom={0.72}>
        <div
          style={{
            width: 118,
            height: 118,
            borderRadius: "50%",
            background: "rgba(59,181,109,.14)",
            border: "1px solid rgba(59,181,109,.42)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto",
            color: GREEN,
            fontSize: 64,
            fontWeight: 900
          }}
        >
          ✓
        </div>
      </Layer>
      <Layer progress={p(f, 22, 42)} y={18}>
        <div style={{marginTop: 25, fontSize: 37, fontWeight: 800, color: WHITE}}>Vendas Realizadas</div>
      </Layer>
      <Layer progress={p(f, 30, 50)} y={16}>
        <div style={{marginTop: 12, color: MUTED, fontSize: 20}}>Conversão conectada ao contato e à origem</div>
      </Layer>
    </Surface>
  );
};

const MiniChart: React.FC<{progress: number}> = ({progress}) => {
  const draw = interpolate(progress, [0, 1], [100, 0], clamp);
  return (
    <svg width="420" height="170" viewBox="0 0 420 170">
      <path d="M20 130 C80 120 95 86 150 96 C205 106 235 52 292 63 C335 70 356 34 400 30" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="2" />
      <path
        d="M20 130 C80 120 95 86 150 96 C205 106 235 52 292 63 C335 70 356 34 400 30"
        fill="none"
        stroke={GREEN}
        strokeWidth="4"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset={draw}
      />
    </svg>
  );
};

const DashboardPanel: React.FC<{f: number}> = ({f}) => (
  <Surface width={1260} height={660} padding={24}>
    <Layer progress={p(f, 0, 14)} y={12}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{fontSize: 31, fontWeight: 800, color: WHITE}}>Dashboard</div>
        <Badge green>Visão consolidada</Badge>
      </div>
    </Layer>
    <div style={{marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18}}>
      <Layer progress={p(f, 9, 28)} x={-22} y={0}>
        <Surface height={235} padding={20} radius={20} style={{boxShadow: "none"}}>
          <div style={{fontSize: 20, fontWeight: 800, color: WHITE}}>Últimas Vendas</div>
          <div style={{marginTop: 15, display: "grid", gap: 10}}>
            {["Google Ads", "Meta Ads", "Organic"].map((x) => (
              <div key={x} style={{display: "flex", justifyContent: "space-between", padding: "11px 12px", borderRadius: 12, background: "rgba(255,255,255,.045)"}}>
                <span style={{color: MUTED}}>{x}</span><span style={{color: GREEN}}>•</span>
              </div>
            ))}
          </div>
        </Surface>
      </Layer>
      <Layer progress={p(f, 15, 34)} x={22} y={0}>
        <Surface height={235} padding={20} radius={20} style={{boxShadow: "none"}}>
          <div style={{fontSize: 20, fontWeight: 800, color: WHITE}}>Novos Contatos</div>
          <div style={{marginTop: 15, display: "grid", gap: 10}}>
            {["Qualificado", "Contato Iniciado", "Negociação"].map((x) => (
              <div key={x} style={{display: "flex", justifyContent: "space-between", padding: "11px 12px", borderRadius: 12, background: "rgba(255,255,255,.045)"}}>
                <span style={{color: MUTED}}>{x}</span><span style={{color: CYAN}}>•</span>
              </div>
            ))}
          </div>
        </Surface>
      </Layer>
    </div>
    <Layer progress={p(f, 24, 58)} y={20}>
      <Surface height={285} padding={20} radius={20} style={{marginTop: 18, boxShadow: "none", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <div style={{fontSize: 20, fontWeight: 800, color: WHITE}}>Desempenho por Origem</div>
          <div style={{marginTop: 6, fontSize: 15, color: MUTED}}>Análise por origem de tráfego</div>
          <div style={{marginTop: 22, display: "flex", gap: 10}}>
            <Badge>Origem</Badge><Badge>Contatos</Badge><Badge>Vendas</Badge>
          </div>
        </div>
        <MiniChart progress={p(f, 29, 66, soft)} />
      </Surface>
    </Layer>
  </Surface>
);

const Scene1: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/hook.webp" f={f} duration={60} dim={0.68} blur={1.5} />
    <div style={{position: "absolute", left: 128, top: 154}}>
      <Layer progress={p(f, -10, 10)} y={12}><Kicker>Signal Convergence</Kicker></Layer>
      <Layer progress={p(f, -6, 18)} y={22} scaleFrom={0.992}><Headline>Do clique <span style={{color: GREEN}}>à venda.</span></Headline></Layer>
      <Layer progress={p(f, 6, 28)} y={18}><Body>Uma única jornada conectando mídia, conversa, contexto e resultado.</Body></Layer>
    </div>
    <Signal progress={p(f, -6, 48, soft)} />
  </AbsoluteFill>
);

const Scene2: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/ad.webp" f={f} duration={60} dim={0.56} blur={2.4} />
    <div style={{position: "absolute", left: 112, top: 130}}>
      <Layer progress={p(f, 0, 16)}><Kicker>Origem</Kicker></Layer>
      <Layer progress={p(f, 5, 22)}><Headline size={48} width={530}>O sinal começa na campanha.</Headline></Layer>
    </div>
    <div style={{position: "absolute", right: 95, top: 218, perspective: 1400, transform: "rotateY(-4deg) rotateX(1deg)"}}>
      <Layer progress={p(f, 8, 30)} x={34} y={8}><CampaignPanel f={f} /></Layer>
    </div>
    <Signal progress={p(f, 0, 54, soft)} y={900} />
  </AbsoluteFill>
);

const Scene3: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/click.webp" f={f} duration={60} dim={0.58} blur={2.2} />
    <div style={{position: "absolute", left: 90, top: 190, transform: "scale(.78)", transformOrigin: "top left"}}>
      <Layer progress={p(f, 0, 16)} x={-20} y={0}><CampaignPanel f={40} /></Layer>
    </div>
    <div style={{position: "absolute", right: 115, top: 165, transform: "scale(.78)", transformOrigin: "top right"}}>
      <Layer progress={p(f, 18, 42)} x={42} y={0}><MessagesPanel f={Math.max(0, f - 14)} /></Layer>
    </div>
    <Signal progress={p(f, 2, 50, soft)} y={550} from={610} to={1340} />
  </AbsoluteFill>
);

const Scene4: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/conversation.webp" f={f} duration={75} dim={0.57} blur={2.3} />
    <div style={{position: "absolute", left: 128, top: 150}}>
      <Layer progress={p(f, 0, 16)}><Kicker>Conversa</Kicker></Layer>
      <Layer progress={p(f, 5, 22)}><Headline size={46} width={560}>A origem continua dentro do atendimento.</Headline></Layer>
    </div>
    <div style={{position: "absolute", right: 110, top: 220, perspective: 1400, transform: "rotateY(-3deg)"}}>
      <MessagesPanel f={f} />
    </div>
    <Signal progress={p(f, 5, 68, soft)} y={900} />
  </AbsoluteFill>
);

const Scene5: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/context.webp" f={f} duration={75} dim={0.57} blur={2.1} />
    <div style={{position: "absolute", left: 115, top: 140}}>
      <Layer progress={p(f, 0, 16)}><Kicker>Contexto + evento</Kicker></Layer>
      <Layer progress={p(f, 5, 24)}><Headline size={46} width={600}>A conversa vira contexto rastreável.</Headline></Layer>
    </div>
    <div style={{position: "absolute", right: 105, top: 235, perspective: 1400, transform: "rotateY(-3deg)"}}>
      <ContactContextPanel f={f} />
    </div>
    <Signal progress={p(f, 6, 70, soft)} y={895} />
  </AbsoluteFill>
);

const Scene6: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/order.webp" f={f} duration={75} dim={0.58} blur={2.0} />
    <div style={{position: "absolute", left: 120, top: 160}}>
      <Layer progress={p(f, 0, 16)}><Kicker>Conversão</Kicker></Layer>
      <Layer progress={p(f, 5, 24)}><Headline size={48} width={560}>O resultado fecha a trajetória.</Headline></Layer>
      <Layer progress={p(f, 14, 34)}><Body width={610}>A venda passa a pertencer ao mesmo percurso que começou no anúncio.</Body></Layer>
    </div>
    <div style={{position: "absolute", right: 110, top: 245, perspective: 1400, transform: "rotateY(-3deg)"}}>
      <SalePanel f={f} />
    </div>
    <Signal progress={p(f, 4, 68, soft)} y={900} />
  </AbsoluteFill>
);

const Scene7: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <CinematicPlate source="adsmagic-do-clique-a-venda/overview.webp" f={f} duration={90} dim={0.52} blur={2.7} />
    <div style={{position: "absolute", left: 120, top: 85}}>
      <Layer progress={p(f, 0, 14)}><Kicker>Inteligência consolidada</Kicker></Layer>
    </div>
    <div style={{position: "absolute", left: 330, top: 185, perspective: 1600, transform: "rotateX(1.5deg)"}}>
      <Layer progress={p(f, 5, 28)} y={24} scaleFrom={0.975}><DashboardPanel f={f} /></Layer>
    </div>
    <Signal progress={p(f, 6, 82, soft)} y={940} />
  </AbsoluteFill>
);

const Scene8: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
    <CinematicPlate source="adsmagic-do-clique-a-venda/hook.webp" f={f} duration={45} dim={0.48} blur={3.6} />
    <div>
      <Layer progress={p(f, 0, 18)} y={18}>
        <Img src={staticFile("adsmagic-do-clique-a-venda/logo-wordmark-white.svg")} style={{width: 300}} />
      </Layer>
      <Layer progress={p(f, 6, 26)} y={24}>
        <div style={{marginTop: 38, color: WHITE, fontSize: 78, fontWeight: 800, letterSpacing: -3.2}}>Do clique <span style={{color: GREEN}}>à venda.</span></div>
      </Layer>
      <Layer progress={p(f, 14, 34)} y={18}>
        <div style={{marginTop: 22, color: MUTED, fontSize: 27}}>Contexto para decidir melhor onde investir.</div>
      </Layer>
      <div style={{position: "relative", width: 620, height: 4, margin: "52px auto 0", background: "rgba(255,255,255,.10)", borderRadius: 99, overflow: "hidden"}}>
        <div style={{width: `${p(f, 4, 38, soft) * 100}%`, height: "100%", background: `linear-gradient(90deg,${GREEN},${CYAN})`}} />
      </div>
    </div>
  </AbsoluteFill>
);

export const AdsmagicClickToSale: React.FC = () => {
  const frame = useCurrentFrame();

  const scenes = [
    {start: 0, end: 60, render: (f: number) => <Scene1 f={f} />},
    {start: 60, end: 120, render: (f: number) => <Scene2 f={f} />},
    {start: 120, end: 180, render: (f: number) => <Scene3 f={f} />},
    {start: 180, end: 255, render: (f: number) => <Scene4 f={f} />},
    {start: 255, end: 330, render: (f: number) => <Scene5 f={f} />},
    {start: 330, end: 405, render: (f: number) => <Scene6 f={f} />},
    {start: 405, end: 495, render: (f: number) => <Scene7 f={f} />},
    {start: 495, end: 540, render: (f: number) => <Scene8 f={f} />}
  ];

  return (
    <AbsoluteFill style={{backgroundColor: NAVY, fontFamily: "Inter, Arial, sans-serif", overflow: "hidden"}}>
      <GridBackdrop />
      {scenes.map((scene, i) => {
        const fade = 6;
        const inOpacity = i === 0 ? 1 : p(frame, scene.start - fade, scene.start + fade, soft);
        const outOpacity = i === scenes.length - 1 ? 1 : interpolate(frame, [scene.end - fade, scene.end + fade], [1, 0], clamp);
        const opacity = Math.min(inOpacity, outOpacity);
        if (opacity <= 0) return null;
        return (
          <AbsoluteFill key={scene.start} style={{opacity}}>
            {scene.render(sceneLocal(frame, scene.start))}
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{pointerEvents: "none", background: "radial-gradient(circle at 50% 46%,transparent 54%,rgba(0,2,32,.20) 100%)"}} />
    </AbsoluteFill>
  );
};
