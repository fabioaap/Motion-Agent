import React, {useMemo} from "react";
import {useLoader, useThree} from "@react-three/fiber";
import {ThreeCanvas} from "@remotion/three";
import {
  CatmullRomCurve3,
  SRGBColorSpace,
  TextureLoader,
  Vector3
} from "three";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile
} from "remotion";

const GREEN = "#3BB56D";
const NAVY = "#010543";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const
};

const CameraRig: React.FC<{f: number; duration: number}> = ({f, duration}) => {
  const {camera} = useThree();

  const x = interpolate(f, [0, duration], [-0.24, 0.22], clamp);
  const y = interpolate(f, [0, duration], [0.12, -0.10], clamp);
  const z = interpolate(f, [0, duration], [9.95, 9.18], clamp);

  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  return null;
};

const StyleframePlane: React.FC<{
  source: string;
  f: number;
  duration: number;
  dim: number;
}> = ({source, f, duration, dim}) => {
  const texture = useLoader(TextureLoader, staticFile(source));
  texture.colorSpace = SRGBColorSpace;

  const t = interpolate(f, [0, duration], [0, 1], clamp);
  const rotationY = interpolate(t, [0, 1], [-0.024, 0.022], clamp);
  const rotationX = interpolate(t, [0, 1], [0.010, -0.008], clamp);
  const x = interpolate(t, [0, 1], [-0.08, 0.08], clamp);
  const y = interpolate(t, [0, 1], [0.03, -0.05], clamp);

  return (
    <>
      <mesh position={[x - 0.20, y + 0.12, -0.34]} rotation={[rotationX, rotationY, 0]}>
        <planeGeometry args={[16.25, 9.14]} />
        <meshBasicMaterial color={NAVY} transparent opacity={0.36} />
      </mesh>
      <mesh position={[x - 0.10, y + 0.06, -0.17]} rotation={[rotationX, rotationY, 0]}>
        <planeGeometry args={[16.12, 9.07]} />
        <meshBasicMaterial color="#061256" transparent opacity={0.48} />
      </mesh>
      <mesh position={[x, y, 0]} rotation={[rotationX, rotationY, 0]}>
        <planeGeometry args={[16, 9]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={Math.max(0.74, dim)}
          toneMapped={false}
        />
      </mesh>
    </>
  );
};

const SignalDepth: React.FC<{f: number; duration: number}> = ({f, duration}) => {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-7.1, -0.85, 0.30),
        new Vector3(-4.0, -0.30, 0.38),
        new Vector3(-0.8, -0.62, 0.46),
        new Vector3(2.4, -0.12, 0.56),
        new Vector3(6.7, -0.42, 0.72)
      ]),
    []
  );

  const t = interpolate(f, [0, duration], [0, 1], clamp);
  const point = curve.getPointAt(t);

  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 96, 0.018, 8, false]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.18} />
      </mesh>
      <mesh position={[point.x, point.y, point.z]}>
        <sphereGeometry args={[0.065, 18, 18]} />
        <meshStandardMaterial
          color={GREEN}
          emissive={GREEN}
          emissiveIntensity={0.38}
          roughness={0.5}
        />
      </mesh>
    </>
  );
};

export const SpatialPlate: React.FC<{
  source: string;
  f: number;
  duration?: number;
  dim?: number;
  blur?: number;
  flat?: boolean;
}> = ({source, f, duration = 60, dim = 0.82, blur = 0, flat = false}) => {
  if (flat) {
    const drift = interpolate(f, [0, duration], [-0.7, 0.7], clamp);
    const zoom = interpolate(f, [0, duration], [1.035, 1.075], clamp);
    return (
      <AbsoluteFill style={{overflow: "hidden", backgroundColor: NAVY}}>
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
            pointerEvents: "none",
            background:
              "linear-gradient(90deg,rgba(1,5,67,.36) 0%,rgba(1,5,67,.10) 44%,rgba(1,5,67,.16) 100%),linear-gradient(180deg,rgba(1,5,67,.08),rgba(1,5,67,.28))"
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{overflow: "hidden", backgroundColor: NAVY}}>
      <ThreeCanvas
        width={1920}
        height={1080}
        camera={{fov: 50, position: [0, 0, 9.8]}}
        style={{position: "absolute", inset: 0}}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 5, 8]} intensity={0.8} />
        <CameraRig f={f} duration={duration} />
        <StyleframePlane source={source} f={f} duration={duration} dim={dim} />
        <SignalDepth f={f} duration={duration} />
      </ThreeCanvas>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(90deg,rgba(1,5,67,.36) 0%,rgba(1,5,67,.10) 44%,rgba(1,5,67,.16) 100%),linear-gradient(180deg,rgba(1,5,67,.08),rgba(1,5,67,.28))"
        }}
      />
    </AbsoluteFill>
  );
};
