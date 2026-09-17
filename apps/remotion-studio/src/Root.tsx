import React from "react";
import {Composition} from "remotion";
import {demoMotionSpec} from "./demoSpec.js";
import {MotionAgentDemo} from "./MotionAgentDemo.js";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MotionAgentDemo"
      component={MotionAgentDemo}
      durationInFrames={demoMotionSpec.duration_frames}
      fps={demoMotionSpec.fps}
      width={1920}
      height={1080}
    />
  );
};
