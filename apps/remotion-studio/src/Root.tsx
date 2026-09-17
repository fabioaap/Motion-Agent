import React from "react";
import {Composition, type CalculateMetadataFunction} from "remotion";
import {demoMotionSpec} from "./demoSpec";
import {MotionAgentDemo} from "./MotionAgentDemo";
import {
  MotionJobPreview,
  type MotionJobPreviewProps
} from "./MotionJobPreview";

const defaultJobProps: MotionJobPreviewProps = {
  jobId: "motion_default",
  title: "Motion Agent Job Preview",
  objective: "Preview parametrizada gerada a partir de um job do @motion.",
  command: "@motion",
  fps: 30,
  width: 1920,
  height: 1080,
  durationFrames: 165,
  stages: [
    {
      id: "asset_audit",
      label: "Asset Audit",
      detail: "Originais localizados e preservados",
      startFrame: 8,
      status: "approved"
    },
    {
      id: "motion_direction",
      label: "Motion Direction",
      detail: "Direção visual e temporal definida",
      startFrame: 38,
      status: "approved"
    },
    {
      id: "qa_loop",
      label: "QA Loop",
      detail: "Fidelidade, motion e técnica revisados",
      startFrame: 72,
      status: "approved"
    },
    {
      id: "ready",
      label: "Ready for Human",
      detail: "Preview pronta para aprovação criativa",
      startFrame: 116,
      status: "approved"
    }
  ]
};

const calculateJobMetadata: CalculateMetadataFunction<MotionJobPreviewProps> = ({props}) => ({
  durationInFrames: props.durationFrames,
  fps: props.fps,
  width: props.width,
  height: props.height
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MotionAgentDemo"
        component={MotionAgentDemo}
        durationInFrames={demoMotionSpec.duration_frames}
        fps={demoMotionSpec.fps}
        width={1920}
        height={1080}
      />
      <Composition
        id="MotionJobPreview"
        component={MotionJobPreview}
        durationInFrames={defaultJobProps.durationFrames}
        fps={defaultJobProps.fps}
        width={defaultJobProps.width}
        height={defaultJobProps.height}
        defaultProps={defaultJobProps}
        calculateMetadata={calculateJobMetadata}
      />
    </>
  );
};
