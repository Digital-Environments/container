import React, { useEffect, useRef } from "react"
import * as THREE from "three"

/**
 * PointerDispersionThreeOnly.jsx
 * High‑fidelity pointer‑reactive particle dispersion using **only Three.js**.
 * No react-three-fiber, no card/status UI — purely the effect.
 * Background color: #0C0404.
 */

const clamp = (n: any, min: any, max: any) => Math.min(max, Math.max(min, n))

export default function PointerDispersionThreeOnly({
  density = 300, // increase for more points; 320–360 for very dense fields
  nearColor = "#FFFFFF",
  farColor = "#66CCFF",
  height = 230, // default height; width stretches to 100%
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x0c0404, 1) // #0C0404
    el.appendChild(renderer.domElement)

    // --- Scene & Camera (orthographic for clip‑space style layout) ---
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10)
    camera.position.set(0, 0, 1)

    // --- Geometry ---
    const countX = density
    const countY = Math.round(density * 0.6)
    const total = countX * countY

    const positions = new Float32Array(total * 3)
    const seeds = new Float32Array(total)

    let i = 0
    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        const u = x / (countX - 1)
        const v = y / (countY - 1)
        const px = -1 + u * 2
        const py = -0.9 + v * 1.8
        positions[i * 3 + 0] = px
        positions[i * 3 + 1] = py
        positions[i * 3 + 2] = 0
        seeds[i] = Math.random()
        i++
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))

    // --- Material (custom shaders) ---
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uDispersion: { value: 0 },
      uColorNear: { value: new THREE.Color(nearColor) },
      uColorFar: { value: new THREE.Color(farColor) },
    }

    const vertexShader = `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uDispersion;
      attribute float aSeed;
      varying float vDist;

      void main(){
        vec3 p = position;

        // subtle organic drift (circular wobble)
        float t = uTime * 0.6 + aSeed * 10.0;
        p.xy += vec2(cos(t), sin(t)) * 0.0025;

        // pointer-driven dispersion (repel)
        vec2 dir = p.xy - uPointer;
        float d = length(dir);
        vDist = d;
        float fall = smoothstep(0.35, 0.0, d);
        vec2 nDir = normalize(dir + 1e-6);
        p.xy += nDir * fall * (0.18 + 0.05*sin(t*2.0)) * uDispersion;

        gl_Position = vec4(p, 1.0);

        float baseSize = 1.4 + (1.0 - clamp(d, 0.0, 1.0)) * 2.4;
        gl_PointSize = baseSize * 2.0; // scaled by device pixel ratio by the renderer
      }
    `

    const fragmentShader = `
      precision highp float;
      varying float vDist;
      uniform vec3 uColorNear;
      uniform vec3 uColorFar;

      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        float alpha = smoothstep(0.5, 0.0, r);
        vec3 col = mix(uColorFar, uColorNear, smoothstep(1.0, 0.0, vDist));
        gl_FragColor = vec4(col, alpha);
      }
    `

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // --- Pointer handling (NDC in [-1,1]) ---
    const pointer = new THREE.Vector2(0, 0)
    const smoothed = new THREE.Vector2(0, 0)
    let rafId = 0

    function toNDC(clientX: any, clientY: any) {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1)
      pointer.set(clamp(x, -1, 1), clamp(y, -1, 1))
    }

    function onMouseMove(e) { toNDC(e.clientX, e.clientY) }
    function onMouseLeave() { pointer.set(0, 0) }
    function onTouchMove(e) {
      if (!e.touches?.[0]) return
      toNDC(e.touches[0].clientX, e.touches[0].clientY)
    }
    function onTouchEnd() { pointer.set(0, 0) }

    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mouseleave", onMouseLeave)
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd)

    // --- Resize ---
    function resize() {
      if (!el) return
      const { clientWidth, clientHeight } = el
      renderer.setSize(clientWidth, clientHeight, false)

    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // --- Animate ---
    const clock = new THREE.Clock()
    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = clock.getDelta()

      // Smooth pointer & dispersion
      smoothed.lerp(pointer, 0.12)
      uniforms.uPointer.value.copy(smoothed)
      const targetDispersion = pointer.length() > 0 ? 1 : 0
      uniforms.uDispersion.value = THREE.MathUtils.lerp(uniforms.uDispersion.value, targetDispersion, 0.08)
      uniforms.uTime.value += dt

      renderer.render(scene, camera)
    }
    animate()

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      el.removeEventListener("mousemove", onMouseMove)
      el.removeEventListener("mouseleave", onMouseLeave)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      scene.remove(points)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement && renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [density, nearColor, farColor])

  return (
    <div
      ref={containerRef}
      style={{ width: "100dvw", height: "100dvh", background: "#0C0404", overflow: "hidden" }}
    />
  )
}