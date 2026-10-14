import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

/**
 * POC-001 storyboard animatic, not a marketing deliverable.
 * Canonical AdsMagic brand direction as approved on 2026-10-10:
 * navy #010543, green #3BB56D, campaign background #000E50, white #FFFFFF.
 *
 * Intentionally NO logo: the approved source logo is embedded in a Drive
 * brand document and its original binary asset must be audited first.
 * No invented charts, conversions or ROI.
 */
const navy = "#010543";
const bg = "#000E50";
const green = "#3BB56D";
const white = "#FFFFFF";
const clamp = {extrapolateLeft:"clamp" as const, extrapolateRight:"clamp" as const};
const easeIn = (frame:number, fps:number, at:number, distance=28) =>
  spring({frame:frame-at, fps, config:{stiffness:100, damping:18, mass:0.85, overshootClamping:true}})
  * (frame >= at ? 1 : 0);

const layers = [
  {key:"01", title:"Anúncio", detail:"A origem do contato", at:38, y:715},
  {key:"02", title:"Conversa", detail:"O caminho do atendimento", at:122, y:1030},
  {key:"03", title:"Resultado", detail:"O que de fato aconteceu", at:206, y:1345}
] as const;
export const MotionOsStoryboard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps,durationInFrames} = useVideoConfig();
  const backgroundFloat = Math.sin(f/42)*18;
  const lineDraw = interpolate(f,[36,250],[0,1],clamp);
  const wordReveal = easeIn(f,fps,5);
  const conclusion = easeIn(f,fps,300);
  return (
    <AbsoluteFill style={{backgroundColor:bg,color:white,fontFamily:"Arial, Helvetica, sans-serif",overflow:"hidden"}}>
      <div style={{position:"absolute",left:-270,top:430,width:720,height:720,borderRadius:"50%",
          background:"radial-gradient(circle, rgba(59,181,109,0.14), transparent 67%)",
          transform:`translateY(${backgroundFloat}px)`}} />
      <div style={{position:"absolute",right:-370,top:980,width:870,height:870,borderRadius:"50%",
          background:"radial-gradient(circle, rgba(59,181,109,0.11), transparent 68%)",
          transform:`translateY(${-backgroundFloat}px)`}} />
      <div style={{position:"absolute",top:124,left:98,fontSize:21,letterSpacing:5,
          color:green,fontWeight:800,opacity:wordReveal}}>
        INTELIGÊNCIA DE CRESCIMENTO
      </div>
      <div style={{position:"absolute",top:215,left:95,right:95,fontSize:82,lineHeight:1.07,
          letterSpacing:-3.8,fontWeight:800,opacity:wordReveal,transform:`translateY(${(1-wordReveal)*32}px)`}}>
        O clique não conta <span style={{color:green}}>toda a história.</span>
      </div>
      <div style={{position:"absolute",top:480,left:100,width:840,fontSize:29,lineHeight:1.45,
          opacity:0.73*wordReveal}}>
        Entenda o que acontece depois que alguém chega pelo anúncio.
      </div>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920"
        style={{position:"absolute",inset:0,overflow:"visible"}}>
        <path d="M224 722 C292 820, 150 921, 224 1035 S292 1231, 224 1351"
          fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={4}/>
        <path d="M224 722 C292 820, 150 921, 224 1035 S292 1231, 224 1351"
          fill="none" stroke={green} strokeWidth={6} strokeLinecap="round"
          pathLength={1} strokeDasharray="1" strokeDashoffset={1-lineDraw}
          style={{filter:"drop-shadow(0 0 13px rgba(59,181,109,0.55))"}}/>
      </svg>
      {layers.map((item,index)=>{
        const intro=easeIn(f,fps,item.at);
        const active=interpolate(f,[item.at,item.at+55,item.at+170],[0,1,0.55],clamp);
        const pulse=1+active*0.12+Math.sin(f/13+index)*0.018;
        return <React.Fragment key={item.key}>
          <div style={{position:"absolute",left:172,top:item.y-52,width:106,height:106,
              borderRadius:"50%",border:`3px solid ${green}`,backgroundColor:navy,
              transform:`scale(${intro*pulse})`,display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 0 ${20+active*35}px rgba(59,181,109,${0.15+0.2*active})`}}>
            <span style={{fontSize:34,fontWeight:750,color:green}}>{item.key}</span>
          </div>
          <div style={{position:"absolute",left:340,top:item.y-54,width:645,opacity:intro,
              transform:`translateX(${(1-intro)*45}px)`}}>
            <div style={{fontSize:53,fontWeight:780,letterSpacing:-1.2}}>{item.title}</div>
            <div style={{fontSize:25,opacity:0.66,marginTop:12}}>{item.detail}</div>
          </div>
        </React.Fragment>;
      })}
      <div style={{position:"absolute",top:1550,left:100,right:100,opacity:conclusion,
          transform:`translateY(${(1-conclusion)*35}px)`}}>
        <div style={{height:5,width:90,backgroundColor:green,marginBottom:25,borderRadius:8}}/>
        <div style={{fontSize:50,letterSpacing:-1.4,lineHeight:1.18,fontWeight:750}}>
          Não basta medir o clique.<br/><span style={{color:green}}>É preciso entender o caminho.</span>
        </div>
      </div>
      <div style={{position:"absolute",bottom:90,left:100,right:100,
          display:"flex",justifyContent:"space-between",fontSize:17,
          letterSpacing:2.2,color:"rgba(255,255,255,0.43)"}}>
        <span>POC-001 / ANIMATIC TÉCNICO</span>
        <span>NÃO PUBLICAR</span>
      </div>
    </AbsoluteFill>
  );
};
