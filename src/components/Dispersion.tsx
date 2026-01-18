import { useEffect, useRef } from "react"
import * as THREE from "three"


type Props = {
  density?: number
  nearColor?: string
  farColor?: string
  onBack?: () => void
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))

export default function PointerDispersionThreeOnly({
  density = 460,
  nearColor = "#FFFFFF",
  farColor = "#66CCFF",
  onBack,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x0c0404, 1) // #0C0404
    el.appendChild(renderer.domElement)

    // Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10)
    camera.position.set(0, 0, 1)

    const rect0 = el.getBoundingClientRect()
    const aspect = rect0.height / rect0.width // H/W

    const countX = density
    const countY = Math.max(2, Math.round(countX * 0.9 * aspect))
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


    const TRAIL_MAX = 64 
    const trailArray = new Array(TRAIL_MAX).fill(0).map(() => new THREE.Vector2(0, 0))

    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uColorNear: { value: new THREE.Color(nearColor) },
      uColorFar: { value: new THREE.Color(farColor) },
      uTrail: { value: trailArray },
      uTrailCount: { value: 0 },
      uTrailRadius: { value: 0.26 }, 
      uStrength: { value: 0.16 },
      uSpeed: { value: 0 },
      uSoftness: { value: 1.4 },
      uWaveFreq: { value: 22.0 },
      uWaveSpeed: { value: 2.2 },
      uBaseAlpha: { value: 0.10 },
      uBandContrast: { value: 0.65 },
    }

    const vertexShader = `
      precision highp float;
      #define TRAIL_MAX ${TRAIL_MAX}
      uniform float uTime;
      uniform vec2 uTrail[TRAIL_MAX];
      uniform int uTrailCount;
      uniform float uTrailRadius;
      uniform float uStrength;
      uniform float uSpeed;
      uniform float uSoftness;
      uniform float uWaveFreq;
      uniform float uWaveSpeed;
      uniform float uBaseAlpha;
      uniform float uBandContrast;
      attribute float aSeed;
      varying float vAlpha; // final alpha factor (envelope * bands)
      varying float vMix;   // color mix based on band energy

      // closest point on segment with param t
      vec2 closestPointOnSegment(vec2 p, vec2 a, vec2 b, out float t){
        vec2 ab = b - a;
        float ab2 = dot(ab, ab) + 1e-6;
        t = clamp(dot(p - a, ab) / ab2, 0.0, 1.0);
        return a + ab * t;
      }

      void main(){
        vec3 p = position;

        // micro drift
        float t0 = uTime * 0.45 + aSeed * 10.0;
        p.xy += vec2(cos(t0), sin(t0)) * 0.0010;

        float minD = 1e9;        // perpendicular distance to ribbon center
        vec2 nearest = vec2(0.0);
        vec2 tangent = vec2(1.0, 0.0);

        if (uTrailCount > 1) {
          for (int i = 0; i < TRAIL_MAX - 1; i++) {
            if (i + 1 >= uTrailCount) break;
            float segt;
            vec2 a = uTrail[i];
            vec2 b = uTrail[i+1];
            vec2 q = closestPointOnSegment(p.xy, a, b, segt);
            float d = length(p.xy - q);
            if (d < minD) {
              minD = d;
              nearest = q;
              tangent = normalize(b - a + 1e-6);
            }
          }
        } else if (uTrailCount == 1) {
          nearest = uTrail[0];
          minD = length(p.xy - nearest);
          tangent = vec2(1.0, 0.0);
        }

        // normal (perpendicular) distance envelope: gaussian (no ringy edges)
        float radius = uTrailRadius * (1.0 + 0.6 * clamp(uSpeed, 0.0, 1.0));
        float sigma = radius * uSoftness;
        float envelope = exp(- (minD*minD) / (2.0 * sigma * sigma)); // 0..1

        // longitudinal phase along trail (sound‑wave bands)
        float along = dot(p.xy - nearest, tangent); // signed distance along ribbon
        float phase = along * uWaveFreq - uTime * uWaveSpeed;
        float bands = 0.5 + 0.5 * cos(phase);
        bands = mix(1.0, bands, uBandContrast); // keep a base visibility between bands

        // final vis
        float vis = max(uBaseAlpha, envelope * bands);
        vAlpha = vis; // pass to fragment
        vMix = vis;   // use vis to bias color

        // wake: mostly lateral separation, slight drift along tangent
        if (envelope > 0.001) {
          vec2 n = normalize(p.xy - nearest + 1e-6);
          float push = envelope * (uStrength + 0.03 * sin(t0*2.3));
          p.xy += n * push * 0.9;
          p.xy += tangent * push * 0.25;
        }

        gl_Position = vec4(p, 1.0);

        // tiny points; scale very gently inside corridor
        float baseSize = 0.75 + envelope * 1.2; // finer overall
        gl_PointSize = baseSize * 2.0;          // DPR scaling
      }
    `

    const fragmentShader = `
      precision highp float;
      varying float vAlpha;
      varying float vMix;
      uniform vec3 uColorNear;
      uniform vec3 uColorFar;

      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        float soft = smoothstep(0.5, 0.0, r);
        float alpha = soft * vAlpha;
        if (alpha <= 0.001) discard;
        vec3 col = mix(uColorFar, uColorNear, clamp(vMix, 0.0, 1.0));
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


    let trailCount = 0
    let head = 0
    let recentSpeed = 0
    const minSeg = 0.005
    const last = new THREE.Vector2(999, 999)

    function toNDC(clientX: number, clientY: number): [number, number] {
      if (!el) return [0, 0]
      const rect = el.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1)
      return [clamp(x, -1, 1), clamp(y, -1, 1)]
    }

    function pushTrail(nx: number, ny: number) {
      const curr = new THREE.Vector2(nx, ny)
      if (last.x === 999) {
        trailArray[0].set(nx, ny)
        head = 1 % TRAIL_MAX
        trailCount = 1
        ;(uniforms.uTrailCount.value as number) = trailCount
        last.copy(curr)
        return
      }

      const dist = curr.distanceTo(last)
      const s = Math.min(1, dist / (minSeg * 6))
      recentSpeed = THREE.MathUtils.lerp(recentSpeed, s, 0.4)
      uniforms.uSpeed.value = recentSpeed

      if (dist > minSeg) {
        trailArray[head].set(nx, ny)
        head = (head + 1) % TRAIL_MAX
        trailCount = Math.min(trailCount + 1, TRAIL_MAX)
        ;(uniforms.uTrailCount.value as number) = trailCount
        last.copy(curr)
      } else {
        const idx = (head - 1 + TRAIL_MAX) % TRAIL_MAX
        trailArray[idx].set(nx, ny)
      }
    }

    function clearTrail() {
      trailCount = 0
      head = 0
      recentSpeed = 0
      ;(uniforms.uTrailCount.value as number) = 0
      uniforms.uSpeed.value = 0
      last.set(999, 999)
    }

    const onMouseMove = (e: MouseEvent) => {
      const [nx, ny] = toNDC(e.clientX, e.clientY)
      pushTrail(nx, ny)
    }
    const onMouseLeave = () => clearTrail()
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches?.[0]) return
      const [nx, ny] = toNDC(e.touches[0].clientX, e.touches[0].clientY)
      pushTrail(nx, ny)
    }
    const onTouchEnd = () => clearTrail()

    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mouseleave", onMouseLeave)
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd)


    function resize() {
      if (!el) return
      const { clientWidth, clientHeight } = el
      renderer.setSize(clientWidth, clientHeight, false)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()


    const clock = new THREE.Clock()
    let rafId = 0 as number
    function animate() {
      rafId = requestAnimationFrame(animate)
      uniforms.uTime.value = (uniforms.uTime.value as number) + clock.getDelta()
      renderer.render(scene, camera)
    }
    animate()


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
    <div style={{ position: "relative", width: "100dvw", height: "100dvh" }}>
      <div
        ref={containerRef}
        style={{display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", background: "#0C0404", overflow: "hidden" }}
      />
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "1.5rem",
            left: "1.5rem",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
        >
          ← Back
        </button>
      )}
    </div>
  )
}
