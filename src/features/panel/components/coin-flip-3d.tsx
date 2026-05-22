"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Face = "cara" | "coroa";

const FLIP_DURATION_MS = 1900; // duração total do flip (em ms)
const TOTAL_SPINS = 6; // voltas durante o flip
const ARC_PEAK_Y = 1.6; // altura máxima do arco vertical
const RESTING_Y = 0; // altura final (na "mesa")

/**
 * Mesa "decorativa" — só visual, sem colisão (não tem física).
 */
function Table() {
  return (
    <mesh position={[0, -0.05, 0]}>
      <boxGeometry args={[10, 0.1, 10]} />
      <meshBasicMaterial color="#ededed" />
    </mesh>
  );
}

/**
 * Easing cubic (ease-out) — começa rápido e desacelera.
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Moeda animada manualmente — sem física, sempre o mesmo movimento.
 * Sobe num arco, gira N voltas, pousa centralizada com squash sutil.
 */
function Coin({
  face,
  trigger,
}: {
  face: Face | null;
  trigger: number;
}) {
  const COIN_RADIUS = 1.07;
  const COIN_THICKNESS = 0.13;

  const [caraTex, coroaTex, caraMetal, coroaMetal] = useLoader(
    THREE.TextureLoader,
    [
      "/cara-ou-coroa/cara.png",
      "/cara-ou-coroa/coroa.png",
      "/cara-ou-coroa/cara_metalness.png",
      "/cara-ou-coroa/coroa_metalness.png",
    ],
  );

  const materials = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({
      color: "#ff5e1c",
      metalness: 0.75,
      roughness: 0.25,
    });
    // Emissive "lift" — adiciona luz própria que clareia os pretos sem
    // afetar tanto os brilhantes. Faz a textura "respirar" cinza nas sombras.
    const emissiveColor = "#4a2a18";
    const top = new THREE.MeshStandardMaterial({
      map: caraTex,
      metalnessMap: caraMetal,
      color: "#ffb380",
      metalness: 0.75,
      roughness: 0.45,
      emissive: emissiveColor,
      emissiveMap: caraTex,
      emissiveIntensity: 0.35,
    });
    const bottom = new THREE.MeshStandardMaterial({
      map: coroaTex,
      metalnessMap: coroaMetal,
      color: "#ffb380",
      metalness: 0.75,
      roughness: 0.45,
      emissive: emissiveColor,
      emissiveMap: coroaTex,
      emissiveIntensity: 0.35,
    });
    top.map!.center.set(0.5, 0.5);
    bottom.map!.center.set(0.5, 0.5);
    // PI/2 = 90° counterclockwise (pra esquerda), deixa o desenho em pé.
    top.map!.rotation = Math.PI / 2;
    // Bottom já era Math.PI (flip backside) — soma PI/2 = 3*PI/2 final.
    bottom.map!.rotation = (3 * Math.PI) / 2;
    // Sincroniza o metalnessMap com a mesma rotação da textura base
    caraMetal.center.set(0.5, 0.5);
    coroaMetal.center.set(0.5, 0.5);
    caraMetal.rotation = Math.PI / 2;
    coroaMetal.rotation = (3 * Math.PI) / 2;
    return [edge, top, bottom];
  }, [caraTex, coroaTex, caraMetal, coroaMetal]);

  const meshRef = useRef<THREE.Mesh>(null);
  const animStart = useRef<number | null>(null);
  const lastTrigger = useRef(0);

  // Quando trigger muda, marca o início da nova animação.
  useEffect(() => {
    if (trigger !== lastTrigger.current && trigger > 0) {
      animStart.current = performance.now();
      lastTrigger.current = trigger;
    }
  }, [trigger]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const start = animStart.current;
    if (start === null || !face) {
      // Idle: cara virada pra cima, parado no centro
      mesh.position.set(0, RESTING_Y, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
      return;
    }

    const elapsed = performance.now() - start;
    const t = Math.min(elapsed / FLIP_DURATION_MS, 1);
    const eased = easeOutCubic(t);

    // Arco vertical: sobe e desce.
    // Função parabólica: y = 4 * arcPeak * t * (1 - t)
    const arcT = t;
    const y = RESTING_Y + 4 * ARC_PEAK_Y * arcT * (1 - arcT);

    // Rotação no eixo X: 0 → 360*spins + 180 se for coroa
    const finalAngle =
      TOTAL_SPINS * Math.PI * 2 + (face === "coroa" ? Math.PI : 0);
    const rotX = eased * finalAngle;

    // Squash sutil no impacto (entre 90% e 100% do tempo)
    let scaleY = 1;
    if (t > 0.9 && t < 0.97) {
      const impactT = (t - 0.9) / 0.07;
      scaleY = 1 - 0.12 * Math.sin(impactT * Math.PI);
    }

    mesh.position.set(0, y, 0);
    mesh.rotation.set(rotX, 0, 0);
    mesh.scale.set(1, scaleY, 1);
  });

  return (
    <mesh ref={meshRef} material={materials}>
      {/* 128 segmentos radiais = borda quase perfeitamente circular */}
      <cylinderGeometry
        args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 128]}
      />
    </mesh>
  );
}

export type CoinFlip3DProps = {
  /** Lado predeterminado que a moeda deve cair. Null = idle. */
  face: Face | null;
  /** Incrementa pra disparar nova animação. */
  trigger: number;
};

export function CoinFlip3D({ face, trigger }: CoinFlip3DProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-[#ededed]">
      <Canvas
        camera={{ position: [0, 6, 0.001], fov: 42 }}
        dpr={[1, 2]}
        gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        onCreated={({ gl }) => {
          gl.setClearColor("#ededed");
          // Garante que o canvas pegue o tamanho final no primeiro frame
          window.requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"));
          });
        }}
      >
        {/* Ambient mais forte = nenhum lado da moeda fica muito escuro */}
        <ambientLight intensity={1.0} />
        {/* Hemisphere light: simula céu (cima) + chão (baixo), suaviza
            transições. Cor laranja embaixo combina com a moeda. */}
        <hemisphereLight
          args={["#ffffff", "#ffb380", 0.6]}
          position={[0, 1, 0]}
        />
        {/* Key light vindo de cima, intensidade reduzida (era 1.1) */}
        <directionalLight position={[1.5, 4, 2]} intensity={0.7} />
        {/* Fill light vindo de baixo — ilumina a face que está virada
            pra baixo durante o flip */}
        <directionalLight position={[-1, -2, -1]} intensity={0.4} />
        <Table />
        <Coin face={face} trigger={trigger} />
      </Canvas>
    </div>
  );
}
