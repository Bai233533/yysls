import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function Card3D({ imageUrl }: { imageUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    card: THREE.Mesh;
    material: THREE.ShaderMaterial;
    targetRotation: THREE.Vector2;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 533;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const geometry = new THREE.PlaneGeometry(3, 4.2, 32, 32);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float u_time;
        uniform vec2 u_mouse;
        void main() {
          vec3 baseColor = vec3(0.05, 0.05, 0.06);
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          vec2 lightPos = u_mouse;
          float dist = distance(vUv, lightPos);
          float sheen = smoothstep(0.4, 0.0, dist) * 0.4;
          float sweep = sin(vUv.x * 2.0 + vUv.y * 2.0 + u_time * 2.0) * 0.5 + 0.5;
          sheen += pow(sweep, 10.0) * 0.15;
          float rim = 1.0 - max(dot(viewDir, normal), 0.0);
          rim = pow(rim, 3.0);
          vec3 finalColor = baseColor + vec3(sheen) + vec3(rim * 0.2);
          float border = smoothstep(0.48, 0.5, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
          finalColor += border * vec3(0.8, 0.7, 0.4) * 0.5;
          gl_FragColor = vec4(finalColor, 0.98);
        }
      `,
    });

    const card = new THREE.Mesh(geometry, material);
    scene.add(card);

    const targetRotation = new THREE.Vector2();
    sceneRef.current = { scene, camera, renderer, card, material, targetRotation };

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      targetRotation.y = mx * 0.25;
      targetRotation.x = -my * 0.25;
      material.uniforms.u_mouse.value.x = (mx + 1) / 2;
      material.uniforms.u_mouse.value.y = (my + 1) / 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    let animId: number;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      card.rotation.x += (targetRotation.x - card.rotation.x) * 0.1;
      card.rotation.y += (targetRotation.y - card.rotation.y) * 0.1;
      material.uniforms.u_time.value = time * 0.001;
      renderer.render(scene, camera);
    };
    animate(0);

    const handleResize = () => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 533;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
