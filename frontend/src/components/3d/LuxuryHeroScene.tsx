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

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

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
    renderer.toneMappingExposure = 1.15;
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
      grad.addColorStop(0, "#FBF9F4");
      grad.addColorStop(0.3, "#E8D8B5");
      grad.addColorStop(0.6, "#C9A84C");
      grad.addColorStop(0.85, "#9B7E36");
      grad.addColorStop(1, "#FAF6EE");
      envCtx.fillStyle = grad;
      envCtx.fillRect(0, 0, 512, 256);

      // Add a bright specular highlight stripe
      const lightGrad = envCtx.createRadialGradient(
        180,
        70,
        10,
        180,
        70,
        160
      );
      lightGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      lightGrad.addColorStop(0.4, "rgba(255, 248, 230, 0.5)");
      lightGrad.addColorStop(1, "rgba(201, 168, 76, 0)");
      envCtx.fillStyle = lightGrad;
      envCtx.fillRect(0, 0, 512, 256);
    }

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();
    envTexture.dispose();

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ea, 1.0);
    scene.add(ambientLight);

    // Key Light (Crisp directional light from top-left)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Fill Light (Warm golden bounce from bottom-right)
    const fillLight = new THREE.DirectionalLight(0xe8c978, 1.6);
    fillLight.position.set(-4, -3, 2);
    scene.add(fillLight);

    // Rim / Backlight (Creating contour highlights)
    const rimLight = new THREE.PointLight(0xffdf9b, 2.0, 15);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // 4. Luxury Sculptural Ribbon Geometries
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // Primary Champagne-Gold Ribbon (Torus Knot with elegant proportions)
    // p=2, q=3 creates a classical trefoil knot loop that flows around 3D space
    const ribbonGeometry = new THREE.TorusKnotGeometry(2.0, 0.16, 220, 48, 2, 3);

    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#C9A84C"),
      emissive: new THREE.Color("#2E2208"),
      metalness: 0.92,
      roughness: 0.19,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      reflectivity: 0.92,
      sheen: 0.45,
      sheenColor: new THREE.Color("#FFE5A3"),
      envMapIntensity: 1.4,
    });

    const primaryRibbon = new THREE.Mesh(ribbonGeometry, goldMaterial);
    // Initial tilt to match editorial reference
    primaryRibbon.rotation.set(0.35, -0.4, 0.15);
    primaryRibbon.scale.set(1.15, 0.95, 1.15);
    sculptureGroup.add(primaryRibbon);

    // Secondary Delicate Halo Orbit (adds layered depth behind model)
    const haloGeometry = new THREE.TorusGeometry(2.65, 0.04, 32, 160);
    const haloMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#D8BD74"),
      metalness: 0.88,
      roughness: 0.25,
      clearcoat: 0.5,
      envMapIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    const secondaryHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    secondaryHalo.rotation.set(1.1, 0.3, -0.5);
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

      targetRot.y = mouse.x * 0.35;
      targetRot.x = -mouse.y * 0.25;
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
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Smooth lerping for pointer-driven tilt
        currentRot.x += (targetRot.x - currentRot.x) * 0.045;
        currentRot.y += (targetRot.y - currentRot.y) * 0.045;

        // Gentle organic rotation
        primaryRibbon.rotation.y += 0.003;
        primaryRibbon.rotation.x = 0.35 + Math.sin(elapsedTime * 0.5) * 0.06;
        primaryRibbon.position.y = Math.sin(elapsedTime * 0.8) * 0.08;

        // Secondary halo counter-orbits slowly
        secondaryHalo.rotation.z -= 0.002;
        secondaryHalo.rotation.x = 1.1 + Math.cos(elapsedTime * 0.4) * 0.08;

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
