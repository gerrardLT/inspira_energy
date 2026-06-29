"use client";

import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import dynamic from "next/dynamic";

/* ── Helpers ──────────────────────────────────────────── */
function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* ── Textured Earth Sphere ────────────────────────────── */
function EarthSphere() {
  const nightMap = useLoader(
    THREE.TextureLoader,
    "https://unpkg.com/three-globe/example/img/earth-night.jpg"
  );
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial map={nightMap} />
    </mesh>
  );
}

/* Fallback while texture loads */
function EarthFallback() {
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial color="#07111e" />
    </mesh>
  );
}

/* ── Holographic Grid Overlay ─────────────────────────── */
function LatitudeLines() {
  const SEG = 128;
  const R = 2.015;
  const lines = useMemo(() => {
    const out: { pts: THREE.Vector3[]; isEq: boolean; isTropic: boolean; lat: number }[] = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = ((90 - lat) * Math.PI) / 180;
      const y = R * Math.cos(phi);
      const r = R * Math.sin(phi);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        const θ = (i / SEG) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(θ), y, r * Math.sin(θ)));
      }
      out.push({ pts, isEq: lat === 0, isTropic: Math.abs(lat) === 30, lat });
    }
    return out;
  }, []);

  return (
    <>
      {lines.map(({ pts, isEq, isTropic, lat }) => (
        <Line
          key={`lat${lat}`}
          points={pts}
          color={isEq ? "#40e8d8" : isTropic ? "#22b8b0" : "#0e7070"}
          lineWidth={isEq ? 1.8 : isTropic ? 0.8 : 0.5}
          transparent
          opacity={isEq ? 0.9 : isTropic ? 0.6 : 0.32}
        />
      ))}
    </>
  );
}

function LongitudeLines() {
  const SEG = 128;
  const R = 2.015;
  const lines = useMemo(() => {
    const out: { pts: THREE.Vector3[]; isPrimary: boolean; lng: number }[] = [];
    for (let lng = 0; lng < 360; lng += 15) {
      const θ = ((lng + 180) * Math.PI) / 180;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        const lat = -90 + (i / SEG) * 180;
        const phi = ((90 - lat) * Math.PI) / 180;
        pts.push(
          new THREE.Vector3(
            -(R * Math.sin(phi) * Math.cos(θ)),
            R * Math.cos(phi),
            R * Math.sin(phi) * Math.sin(θ)
          )
        );
      }
      out.push({ pts, isPrimary: lng % 90 === 0, lng });
    }
    return out;
  }, []);

  return (
    <>
      {lines.map(({ pts, isPrimary, lng }) => (
        <Line
          key={`lng${lng}`}
          points={pts}
          color={isPrimary ? "#22b8b0" : "#0e7070"}
          lineWidth={isPrimary ? 0.8 : 0.5}
          transparent
          opacity={isPrimary ? 0.55 : 0.28}
        />
      ))}
    </>
  );
}

/* ── Atmosphere Glow ──────────────────────────────────── */
function Atmosphere() {
  return (
    <>
      {/* Inner teal corona */}
      <mesh>
        <sphereGeometry args={[2.08, 48, 48]} />
        <meshBasicMaterial color="#0d6060" transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[2.30, 48, 48]} />
        <meshBasicMaterial color="#051e1e" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

/* ── Market Marker ────────────────────────────────────── */
function MarketMarker({ lat, lng, delay = 0 }: { lat: number; lng: number; delay?: number }) {
  const r1Ref = useRef<THREE.Mesh>(null);
  const r2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t1 = ((clock.getElapsedTime() + delay) % 2.4) / 2.4;
    const t2 = ((clock.getElapsedTime() + delay + 1.2) % 2.4) / 2.4;
    if (r1Ref.current) {
      r1Ref.current.scale.setScalar(1 + t1 * 3.5);
      (r1Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t1);
    }
    if (r2Ref.current) {
      r2Ref.current.scale.setScalar(1 + t2 * 3.5);
      (r2Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t2);
    }
  });

  const pos = useMemo((): [number, number, number] => {
    const v = latLngToVec3(lat, lng, 2.075);
    return [v.x, v.y, v.z];
  }, [lat, lng]);

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#ffe060" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.095, 16, 16]} />
        <meshBasicMaterial color="#c49030" transparent opacity={0.28} />
      </mesh>
      <mesh ref={r1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.056, 0.075, 32]} />
        <meshBasicMaterial color="#ffe060" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={r2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.056, 0.075, 32]} />
        <meshBasicMaterial color="#ffe060" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ── Arc + Traveling Dot ──────────────────────────────── */
function ConnectionArc({
  startLat, startLng, endLat, endLng, color = "#C4963A", opacity = 0.65,
}: {
  startLat: number; startLng: number; endLat: number; endLng: number;
  color?: string; opacity?: number;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  // 惰性初始化：在帧循环（非渲染阶段）首次生成随机相位偏移，
  // 避免在 render 期间调用 Math.random() 这一不纯函数
  const tRef = useRef<number | null>(null);

  const { points, curve } = useMemo(() => {
    const s = latLngToVec3(startLat, startLng, 2.06);
    const e = latLngToVec3(endLat, endLng, 2.06);
    const mid = s.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(3.2);
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    return { points: curve.getPoints(80), curve };
  }, [startLat, startLng, endLat, endLng]);

  useFrame((_, delta) => {
    if (tRef.current === null) tRef.current = Math.random();
    tRef.current = (tRef.current + delta * 0.2) % 1;
    const p = curve.getPoint(tRef.current);
    if (dotRef.current) dotRef.current.position.copy(p);
  });

  return (
    <>
      <Line points={points} color={color} lineWidth={1.2} transparent opacity={opacity} />
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.034, 8, 8]} />
        <meshBasicMaterial color="#ffe060" />
      </mesh>
    </>
  );
}

/* ── Rotating Globe Assembly ──────────────────────────── */
function RotatingGlobe({ isPaused }: { isPaused: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const markets = [
    { lat: 10,  lng: 106 },
    { lat: -25, lng: 134 },
    { lat: 35,  lng: 105 },
    { lat: 48,  lng: 10  },
  ];
  const arcs = [
    { sl: 10,  slng: 106, el: -25, elng: 134, color: "#C4963A" },
    { sl: 10,  slng: 106, el: 35,  elng: 105, color: "#C4963A" },
    { sl: 35,  slng: 105, el: 48,  elng: 10,  color: "#2ABAA8" },
    { sl: -25, slng: 134, el: 48,  elng: 10,  color: "#2ABAA8" },
  ];

  return (
    <group ref={groupRef}>
      {/* Earth texture — Suspense fallback while loading */}
      <Suspense fallback={<EarthFallback />}>
        <EarthSphere />
      </Suspense>

      <LatitudeLines />
      <LongitudeLines />
      <Atmosphere />

      {markets.map((m, i) => (
        <MarketMarker key={i} lat={m.lat} lng={m.lng} delay={i * 0.7} />
      ))}
      {arcs.map((a, i) => (
        <ConnectionArc
          key={i}
          startLat={a.sl} startLng={a.slng}
          endLat={a.el}   endLng={a.elng}
          color={a.color}
          opacity={0.65}
        />
      ))}
    </group>
  );
}

/* ── Main Exported Component ──────────────────────────── */
function Globe3DInner() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className="h-[400px] w-full lg:h-[440px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1} />
        <RotatingGlobe isPaused={isPaused} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={(Math.PI * 2.5) / 3.5}
          rotateSpeed={0.45}
        />
      </Canvas>
    </div>
  );
}

const Globe3DInnerDynamic = dynamic(() => Promise.resolve(Globe3DInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center lg:h-[440px]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal/20 border-t-teal/70" />
    </div>
  ),
});

export function Globe3D() {
  return <Globe3DInnerDynamic />;
}
