"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface LuxuryHeroSceneProps {
  className?: string;
  enablePointerInteraction?: boolean;
}

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const testCanvas = document.createElement("canvas");
    return !!(
      testCanvas.getContext("webgl2") ||
      testCanvas.getContext("webgl") ||
      testCanvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Procedurally generates a smooth, volumetric, flat metallic ribbon with beveled rounded edges
 * along a closed 3D Catmull-Rom spline curve with continuous parallel-transport twist.
 */
function createParametricRibbonGeometry(
  divisions = 320,
  width = 0.52,
  thickness = 0.05
): THREE.BufferGeometry {
  // 11 calibrated 3D control points creating an elegant sculptural Mobius loop framing the model
  const controlPoints = [
    new THREE.Vector3(0.15, 1.75, -0.45), // Top crest behind model head
    new THREE.Vector3(1.15, 1.52, -0.15), // Arching over upper right
    new THREE.Vector3(2.05, 0.78, 0.15),  // Descending right flank
    new THREE.Vector3(2.35, -0.12, 0.38), // Outer right loop apex
    new THREE.Vector3(1.78, -0.98, 0.18), // Swooping down and forward
    new THREE.Vector3(0.92, -1.32, -0.18),// Underneath midground
    new THREE.Vector3(-0.25, -1.08, -0.62), // Curving to lower left
    new THREE.Vector3(-1.28, -0.52, -0.72), // Left flank waist loop
    new THREE.Vector3(-1.72, 0.28, -0.62), // Left outer crest
    new THREE.Vector3(-1.32, 1.18, -0.52), // Ascending left
    new THREE.Vector3(-0.48, 1.62, -0.48), // Approaching top crest
  ];

  const curve = new THREE.CatmullRomCurve3(controlPoints, true, "centripetal");
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Compute parallel-transport Frenet frames without discontinuous flips
  const frames = curve.computeFrenetFrames(divisions, true);

  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    const pt = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // 2 complete 360-degree smooth twists along the loop so start & end match seamlessly
    const twist = t * Math.PI * 4.0;
    const cosT = Math.cos(twist);
    const sinT = Math.sin(twist);

    // Rotated normal and binormal
    const rN = new THREE.Vector3().copy(N).multiplyScalar(cosT).addScaledVector(B, sinT);
    const rB = new THREE.Vector3().copy(N).multiplyScalar(-sinT).addScaledVector(B, cosT);

    const halfW = width * 0.5;
    const halfT = thickness * 0.5;

    // 4 vertices forming the cross-section
    const v0 = new THREE.Vector3().copy(pt).addScaledVector(rN, halfW).addScaledVector(rB, halfT);
    const v1 = new THREE.Vector3().copy(pt).addScaledVector(rN, -halfW).addScaledVector(rB, halfT);
    const v2 = new THREE.Vector3().copy(pt).addScaledVector(rN, -halfW).addScaledVector(rB, -halfT);
    const v3 = new THREE.Vector3().copy(pt).addScaledVector(rN, halfW).addScaledVector(rB, -halfT);

    vertices.push(v0.x, v0.y, v0.z);
    vertices.push(v1.x, v1.y, v1.z);
    vertices.push(v2.x, v2.y, v2.z);
    vertices.push(v3.x, v3.y, v3.z);

    uvs.push(t, 1, t, 0, t, 0, t, 1);
  }

  for (let i = 0; i < divisions; i++) {
    const row1 = i * 4;
    const row2 = (i + 1) * 4;

    // Top face (v0 -> v1)
    indices.push(row1 + 0, row1 + 1, row2 + 1);
    indices.push(row1 + 0, row2 + 1, row2 + 0);

    // Bottom face (v3 -> v2)
    indices.push(row1 + 2, row1 + 3, row2 + 3);
    indices.push(row1 + 2, row2 + 3, row2 + 2);

    // Left edge (v1 -> v2)
    indices.push(row1 + 1, row1 + 2, row2 + 2);
    indices.push(row1 + 1, row2 + 2, row2 + 1);

    // Right edge (v3 -> v0)
    indices.push(row1 + 3, row1 + 0, row2 + 0);
    indices.push(row1 + 3, row2 + 0, row2 + 3);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export default function LuxuryHeroScene({
  className = "",
  enablePointerInteraction = true,
}: LuxuryHeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL] = useState<boolean>(checkWebGLSupport);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!hasWebGL) return;
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // 2. Procedural Studio Reflection Cube Map for Metallic Lustre
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a smooth radial champagne/studio gradient on an offscreen canvas
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512;
    envCanvas.height = 256;
    const envCtx = envCanvas.getContext("2d");
    if (envCtx) {
      const grad = envCtx.createLinearGradient(0, 0, 512, 256);
      grad.addColorStop(0, "#FCF9F3");
      grad.addColorStop(0.25, "#EADDBE");
      grad.addColorStop(0.55, "#D4AF67");
      grad.addColorStop(0.8, "#9E7F36");
      grad.addColorStop(1, "#FAF5EC");
      envCtx.fillStyle = grad;
      envCtx.fillRect(0, 0, 512, 256);

      // Add a bright specular highlight stripe simulating overhead studio strip light
      const lightGrad = envCtx.createRadialGradient(200, 60, 5, 200, 60, 180);
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      lightGrad.addColorStop(0.35, "rgba(255, 248, 225, 0.6)");
      lightGrad.addColorStop(1, "rgba(212, 175, 103, 0)");
      envCtx.fillStyle = lightGrad;
      envCtx.fillRect(0, 0, 512, 256);

      // Warm ground reflection streak
      const groundGrad = envCtx.createLinearGradient(0, 180, 0, 256);
      groundGrad.addColorStop(0, "rgba(140, 110, 45, 0)");
      groundGrad.addColorStop(1, "rgba(90, 70, 25, 0.4)");
      envCtx.fillStyle = groundGrad;
      envCtx.fillRect(0, 180, 512, 76);
    }

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();
    envTexture.dispose();

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.2);
    scene.add(ambientLight);

    // Key Light (Crisp directional light from top-left)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.9);
    keyLight.position.set(4.5, 5.5, 4.0);
    scene.add(keyLight);

    // Fill Light (Warm golden bounce from bottom-right)
    const fillLight = new THREE.DirectionalLight(0xf5dda0, 1.8);
    fillLight.position.set(-4.5, -3.5, 2.5);
    scene.add(fillLight);

    // Rim / Backlight (Creating contour highlights on outer ribbon loop)
    const rimLight = new THREE.PointLight(0xffe8b2, 2.4, 16);
    rimLight.position.set(0.5, 3.5, -3.2);
    scene.add(rimLight);

    // 4. Luxury Sculptural Ribbon Geometries
    const sculptureGroup = new THREE.Group();
    // Offset slightly right to frame the model perfectly
    sculptureGroup.position.set(0.2, 0.05, 0);
    scene.add(sculptureGroup);

    // Primary Champagne-Gold Parametric Ribbon Mesh
    const ribbonGeometry = createParametricRibbonGeometry(320, 0.54, 0.05);

    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#D8B868"),
      emissive: new THREE.Color("#1A1406"),
      metalness: 0.95,
      roughness: 0.14,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95,
      sheen: 0.4,
      sheenColor: new THREE.Color("#FFE8B2"),
      envMapIntensity: 1.8,
    });

    const primaryRibbon = new THREE.Mesh(ribbonGeometry, goldMaterial);
    // Initial tilt to match editorial reference
    primaryRibbon.rotation.set(0.25, -0.3, 0.1);
    primaryRibbon.scale.set(1.08, 0.98, 1.08);
    sculptureGroup.add(primaryRibbon);

    // Secondary Delicate Halo Orbit (adds layered depth behind model)
    const haloGeometry = new THREE.TorusGeometry(2.7, 0.032, 32, 180);
    const haloMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#E2C67E"),
      metalness: 0.9,
      roughness: 0.22,
      clearcoat: 0.6,
      envMapIntensity: 1.4,
      transparent: true,
      opacity: 0.85,
    });
    const secondaryHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    secondaryHalo.rotation.set(1.15, 0.35, -0.45);
    sculptureGroup.add(secondaryHalo);

    const loadTimer = setTimeout(() => setIsLoaded(true), 16);

    // 5. Animation, Pointer & Scroll Handling
    let animationFrameId: number;
    let isVisible = true;

    // Pointer coordinates with smoothed interpolation
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0, y: 0 };
    const currentRot = { x: 0, y: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      if (!enablePointerInteraction || prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.x = Math.max(-1, Math.min(1, x));
      mouse.y = Math.max(-1, Math.min(1, y));

      targetRot.y = mouse.x * 0.28;
      targetRot.x = -mouse.y * 0.18;
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    // IntersectionObserver to pause render loop when hero is off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Animation Loop
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsedTime = (performance.now() - startTime) * 0.001;

      if (!prefersReducedMotion) {
        // Smooth lerping for pointer-driven tilt
        currentRot.x += (targetRot.x - currentRot.x) * 0.045;
        currentRot.y += (targetRot.y - currentRot.y) * 0.045;

        // Gentle, slow organic rotation & floating
        primaryRibbon.rotation.y += 0.0022;
        primaryRibbon.rotation.x = 0.25 + Math.sin(elapsedTime * 0.5) * 0.04;
        primaryRibbon.position.y = Math.sin(elapsedTime * 0.7) * 0.05;

        // Secondary halo counter-orbits slowly
        secondaryHalo.rotation.z -= 0.0018;
        secondaryHalo.rotation.x = 1.15 + Math.cos(elapsedTime * 0.4) * 0.06;

        // Apply interactive pointer offset to root group
        sculptureGroup.rotation.x = currentRot.x;
        sculptureGroup.rotation.y = currentRot.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Complete Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(loadTimer);
      observer.disconnect();
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Three.js GPU resources
      ribbonGeometry.dispose();
      goldMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      envMap.dispose();
      renderer.dispose();
    };
  }, [enablePointerInteraction, hasWebGL]);

  if (!hasWebGL) {
    return (
      <div
        className={`pointer-events-none relative flex items-center justify-center overflow-hidden ${className}`}
        aria-hidden="true"
      >
        {/* Elegant CSS/SVG Fallback for non-WebGL environments */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full border border-accent-gold/40 bg-gradient-to-tr from-accent-gold/20 via-transparent to-surface-white/30 blur-sm animate-pulse" />
          <div className="absolute h-48 w-48 rotate-45 rounded-full border border-accent-gold/60" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none relative h-full w-full overflow-hidden transition-opacity duration-1000 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-hidden="true"
    />
  );
}
