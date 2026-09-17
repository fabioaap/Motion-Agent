import React from "react";
import {Composition, type CalculateMetadataFunction} from "remotion";
import type {MotionSceneJob} from "@motion-agent/runtime";
import {demoMotionSpec} from "./demoSpec";
import {MotionAgentDemo} from "./MotionAgentDemo";
import {
  MotionJobPreview,
  type MotionJobPreviewProps
} from "./MotionJobPreview";
import {MotionScene} from "./MotionScene";

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

const defaultSceneProps: MotionSceneJob = {
  jobId: "motion_scene_demo",
  sceneId: "scene_01",
  title: "Dashboard com motion preservando o asset original",
  objective: "Demonstrar o caminho real do @motion com um SVG original.",
  fps: 30,
  width: 1920,
  height: 1080,
  durationFrames: 150,
  background: "#070B14",
  presentation: "FULL_FRAME",
  showTitle: false,
  layers: [
    {
      elementId: "dashboard",
      assetId: "dashboard_asset",
      name: "dashboard.svg",
      type: "SVG",
      source: "demo/dashboard.svg",
      strategy: "REUSE_SVG",
      fidelityRequirement: "STRICT",
      startFrame: 0,
      endFrame: 149,
      motionFamily: "PanZoom",
      fit: "contain",
      x: 0.5,
      y: 0.5,
      width: 0.94,
      height: 0.92,
      zIndex: 1,
      originalAsset: true
    }
  ]
};

const calculateJobMetadata: CalculateMetadataFunction<MotionJobPreviewProps> = ({props}) => ({
  durationInFrames: props.durationFrames,
  fps: props.fps,
  width: props.width,
  height: props.height
});

const calculateSceneMetadata: CalculateMetadataFunction<MotionSceneJob> = ({props}) => ({
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
      <Composition
        id="MotionScene"
        component={MotionScene}
        durationInFrames={defaultSceneProps.durationFrames}
        fps={defaultSceneProps.fps}
        width={defaultSceneProps.width}
        height={defaultSceneProps.height}
        defaultProps={defaultSceneProps}
        calculateMetadata={calculateSceneMetadata}
      />
    </>
  );
};
