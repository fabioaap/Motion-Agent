import type {JobContext} from "./contracts.js";

export type OfficialRemotionTemplateId =
  | "blank"
  | "hello-world"
  | "next"
  | "vercel"
  | "next-no-tailwind"
  | "next-pages-dir"
  | "recorder"
  | "prompt-to-motion-graphics"
  | "javascript"
  | "render-server"
  | "electron"
  | "react-router"
  | "three"
  | "still"
  | "audiogram"
  | "music-visualization"
  | "prompt-to-video"
  | "skia"
  | "overlay"
  | "code-hike"
  | "stargazer"
  | "tiktok";

export type OfficialRemotionTemplate = {
  id: OfficialRemotionTemplateId;
  name: string;
  page: string;
  command: string;
  role: string;
};

export const OFFICIAL_REMOTION_TEMPLATES: OfficialRemotionTemplate[] = [
  {id:"blank",name:"Blank",page:"https://www.remotion.dev/templates/blank",command:"pnpm create video --blank",role:"general-product-motion"},
  {id:"hello-world",name:"Hello World",page:"https://www.remotion.dev/templates/hello-world",command:"pnpm create video --hello-world",role:"learning-baseline"},
  {id:"next",name:"Next.js",page:"https://www.remotion.dev/templates/next",command:"pnpm create video --next",role:"video-generation-app"},
  {id:"vercel",name:"Next.js (Vercel Sandbox)",page:"https://www.remotion.dev/templates/vercel",command:"pnpm create video --vercel",role:"vercel-sandbox-rendering"},
  {id:"next-no-tailwind",name:"Next.js (No Tailwind)",page:"https://www.remotion.dev/templates/next-no-tailwind",command:"pnpm create video --next-no-tailwind",role:"video-generation-app"},
  {id:"next-pages-dir",name:"Next.js (Pages dir)",page:"https://www.remotion.dev/templates/next-pages-dir",command:"pnpm create video --next-pages-dir",role:"legacy-next-video-app"},
  {id:"recorder",name:"Recorder",page:"https://www.remotion.dev/templates/recorder",command:"pnpm create video --recorder",role:"browser-recorder"},
  {id:"prompt-to-motion-graphics",name:"Prompt to Motion Graphics SaaS Starter Kit",page:"https://www.remotion.dev/templates/prompt-to-motion-graphics",command:"pnpm create video --prompt-to-motion-graphics",role:"ai-motion-generation-app"},
  {id:"javascript",name:"Hello World (JavaScript)",page:"https://www.remotion.dev/templates/javascript",command:"pnpm create video --javascript",role:"javascript-baseline"},
  {id:"render-server",name:"Render Server",page:"https://www.remotion.dev/templates/render-server",command:"pnpm create video --render-server",role:"express-render-service"},
  {id:"electron",name:"Electron",page:"https://www.remotion.dev/templates/electron",command:"pnpm create video --electron",role:"desktop-render-app"},
  {id:"react-router",name:"React Router",page:"https://www.remotion.dev/templates/react-router",command:"pnpm create video --react-router",role:"react-router-video-app"},
  {id:"three",name:"React Three Fiber",page:"https://www.remotion.dev/templates/three",command:"pnpm create video --three",role:"3d-spatial-motion"},
  {id:"still",name:"Still images",page:"https://www.remotion.dev/templates/still",command:"pnpm create video --still",role:"dynamic-stills"},
  {id:"audiogram",name:"Audiogram",page:"https://www.remotion.dev/templates/audiogram",command:"pnpm create video --audiogram",role:"podcast-social-video"},
  {id:"music-visualization",name:"Music Visualization",page:"https://www.remotion.dev/templates/music-visualization",command:"pnpm create video --music-visualization",role:"music-social-video"},
  {id:"prompt-to-video",name:"Prompt to Video",page:"https://www.remotion.dev/templates/prompt-to-video",command:"pnpm create video --prompt-to-video",role:"generative-story-video"},
  {id:"skia",name:"Skia",page:"https://www.remotion.dev/templates/skia",command:"pnpm create video --skia",role:"canvas-vector-effects"},
  {id:"overlay",name:"Overlay",page:"https://www.remotion.dev/templates/overlay",command:"pnpm create video --overlay",role:"transparent-video-overlay"},
  {id:"code-hike",name:"Code Hike",page:"https://www.remotion.dev/templates/code-hike",command:"pnpm create video --code-hike",role:"code-animation"},
  {id:"stargazer",name:"Stargazer",page:"https://www.remotion.dev/templates/stargazer",command:"pnpm create video --stargazer",role:"github-stars-video"},
  {id:"tiktok",name:"TikTok",page:"https://www.remotion.dev/templates/tiktok",command:"pnpm create video --tiktok",role:"word-captions"}
];

function corpus(context: JobContext): string {
  return [
    context.brief.objective,
    context.brief.message,
    context.brief.usage_context,
    context.brief.platform,
    context.brief.constraints.join(" "),
    context.brief.references.join(" "),
    context.motion_direction?.camera_strategy ?? "",
    context.motion_direction?.depth_strategy ?? ""
  ].join(" ").toLowerCase();
}

function chooseId(context: JobContext): OfficialRemotionTemplateId {
  const text = corpus(context);

  if (/(react three|three\.js|three js|react three fiber|\br3f\b|true 3d|3d geometry|3d camera|spatial mockup|spatial product)/i.test(text)) return "three";
  if (/(skia|canvas shader|canvas effect|react native skia)/i.test(text)) return "skia";
  if (/(word[- ]by[- ]word|whisper\.cpp|whisper cpp|tiktok caption|animated caption)/i.test(text)) return "tiktok";
  if (/(podcast|audiogram|speech waveform)/i.test(text)) return "audiogram";
  if (/(music visualization|music visuali|music waveform)/i.test(text)) return "music-visualization";
  if (/(code hike|code snippet|code animation|animated code|code diff)/i.test(text)) return "code-hike";
  if (/(transparent overlay|alpha overlay|lower third|overlay for editor)/i.test(text)) return "overlay";
  if (/(dynamic still|png generation|jpeg generation|still image generator)/i.test(text)) return "still";
  if (/(prompt to motion graphics|prompt-to-motion|generate remotion code|generated remotion code)/i.test(text)) return "prompt-to-motion-graphics";
  if (/(prompt to video|script.*images.*voiceover|images.*voiceover.*prompt)/i.test(text)) return "prompt-to-video";
  if (/(vercel sandbox)/i.test(text)) return "vercel";
  if (/(express render server|render server)/i.test(text)) return "render-server";
  if (/(electron.*render|desktop.*render)/i.test(text)) return "electron";
  if (/(recorder|screen recording|video recorder)/i.test(text)) return "recorder";
  if (/(next\.js|nextjs).*(video app|generate video|video generation)/i.test(text)) return "next";
  if (/(react router).*(video app|generate video|video generation)/i.test(text)) return "react-router";
  if (/(github stars|stargazer|repo stars)/i.test(text)) return "stargazer";
  if (/(plain javascript|javascript only|no typescript)/i.test(text)) return "javascript";

  return "blank";
}

export function resolveOfficialRemotionTemplate(context: JobContext) {
  const id = chooseId(context);
  const template = OFFICIAL_REMOTION_TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error(`Official Remotion template not found: ${id}`);

  const specialized = id !== "blank";
  return {
    template_id: template.id,
    name: template.name,
    official_page: template.page,
    create_command: template.command,
    role: template.role,
    selection_mode: specialized ? "SPECIALIZED_REFERENCE" : "BASELINE",
    reason: specialized
      ? `Selected official Remotion template because the brief indicates ${template.role}`
      : "Blank selected as the smallest baseline for custom motion in an existing product repository",
    adaptation_plan: specialized
      ? "Borrow only the technical pattern needed by the scene while preserving source assets, Layer Map, approved art direction and host project architecture"
      : "Implement the approved scene directly in the isolated Motion Agent Remotion workspace",
    scaffold_required: false,
    preserves_host_project: true,
    layerability_gate_unchanged: true,
    catalog_source: "https://www.remotion.dev/templates"
  };
}
