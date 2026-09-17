import React from "react";
import {Composition} from "remotion";
import {InstalledMotion} from "./InstalledMotion";

export const Root: React.FC = () => (
  <>
    <Composition
      id="InstalledMotion"
      component={InstalledMotion}
      durationInFrames={120}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Motion Agent installed",
        subtitle: "Replace this composition with a project-specific @motion scene."
      }}
    />
  </>
);
