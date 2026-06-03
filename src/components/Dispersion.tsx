import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type MotionMode = 'soft' | 'balanced' | 'intense'
type PrimaryColour = 'red' | 'green' | 'blue'

type MotionPreset = {
  trailRadius: number
  strength: number
  damping: number
  softness: number
  waveSpeed: number
}

type ColourOption = {
  label: string
  value: PrimaryColour
  color: string
}

type Props = {
  density?: number
  nearColor?: string
  farColor?: string
  onBack?: () => void
}

const COLOR_MAX = 8

const motionPresets: Record<MotionMode, MotionPreset> = {
  soft: {
    trailRadius: 0.22,
    strength: 0.08,
    damping: 0.65,
    softness: 1.8,
    waveSpeed: 1.4,
  },
  balanced: {
    trailRadius: 0.26,
    strength: 0.16,
    damping: 1,
    softness: 1.4,
    waveSpeed: 2.2,
  },
  intense: {
    trailRadius: 0.34,
    strength: 0.28,
    damping: 1.35,
    softness: 1.1,
    waveSpeed: 3.4,
  },
}

const primaryColourOptions: ColourOption[] = [
  {
    label: 'Red',
    value: 'red',
    color: '#FF0000',
  },
  {
    label: 'Green',
    value: 'green',
    color: '#00FF00',
  },
  {
    label: 'Blue',
    value: 'blue',
    color: '#0000FF',
  },
]

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))

export default function PointerDispersionThreeOnly({
  density = 460,
  nearColor = '#FFFFFF',
  farColor = '#66CCFF',
  onBack,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [motionMode, setMotionMode] = useState<MotionMode>('balanced')
  const motionModeRef = useRef<MotionMode>(motionMode)
  const [activeColours, setActiveColours] = useState<string[]>([nearColor, farColor])
  const activeColoursRef = useRef<string[]>(activeColours)

  const handleMotionModeChange = (mode: MotionMode): void => {
    setMotionMode(mode)
    motionModeRef.current = mode
  }

  const handleColourToggle = (color: string): void => {
    setActiveColours((currentColours: string[]) => {
      const nextColours = currentColours.includes(color)
        ? currentColours.filter((currentColor: string) => currentColor !== color)
        : [...currentColours, color]

      const safeColours = nextColours.length > 0 ? nextColours : ['#FFFFFF']

      activeColoursRef.current = safeColours

      return safeColours
    })
  }

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
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const TRAIL_MAX = 64
    const trailArray = new Array(TRAIL_MAX).fill(0).map(() => new THREE.Vector2(0, 0))
    const currentMotionPreset = motionPresets[motionModeRef.current]

    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uColors: {
        value: new Array(COLOR_MAX).fill(0).map((_: number, index: number) => {
          const color = activeColoursRef.current[index] ?? activeColoursRef.current[0] ?? '#FFFFFF'

          return new THREE.Color(color)
        }),
      },
      uColorCount: { value: Math.min(activeColoursRef.current.length, COLOR_MAX) },
      uTrail: { value: trailArray },
      uTrailCount: { value: 0 },
      uTrailRadius: { value: currentMotionPreset.trailRadius },
      uStrength: { value: currentMotionPreset.strength },
      uDamping: { value: currentMotionPreset.damping },
      uSpeed: { value: 0 },
      uSoftness: { value: currentMotionPreset.softness },
      uWaveFreq: { value: 22.0 },
      uWaveSpeed: { value: currentMotionPreset.waveSpeed },
      uBaseAlpha: { value: 0.10 },
      uBandContrast: { value: 0.65 },
    }

    function applyMotionPreset(): void {
      const preset = motionPresets[motionModeRef.current]
      uniforms.uTrailRadius.value = preset.trailRadius
      uniforms.uStrength.value = preset.strength
      uniforms.uDamping.value = preset.damping
      uniforms.uSoftness.value = preset.softness
      uniforms.uWaveSpeed.value = preset.waveSpeed
    }

    function applyActiveColours(): void {
      const colours = activeColoursRef.current.length > 0 ? activeColoursRef.current : ['#FFFFFF']
      const uniformColours = uniforms.uColors.value as THREE.Color[]

      for (let i = 0; i < COLOR_MAX; i++) {
        const color = colours[i % colours.length]
        uniformColours[i].set(color)
      }

      uniforms.uColorCount.value = Math.min(colours.length, COLOR_MAX)
    }

    const vertexShader = `
      precision highp float;
      #define TRAIL_MAX ${TRAIL_MAX}
      uniform float uTime;
      uniform vec2 uTrail[TRAIL_MAX];
      uniform int uTrailCount;
      uniform float uTrailRadius;
      uniform float uStrength;
      uniform float uDamping;
      uniform float uSpeed;
      uniform float uSoftness;
      uniform float uWaveFreq;
      uniform float uWaveSpeed;
      uniform float uBaseAlpha;
      uniform float uBandContrast;
      attribute float aSeed;
      varying float vAlpha;
      varying float vMix;

      vec2 closestPointOnSegment(vec2 p, vec2 a, vec2 b, out float t){
        vec2 ab = b - a;
        float ab2 = dot(ab, ab) + 1e-6;
        t = clamp(dot(p - a, ab) / ab2, 0.0, 1.0);
        return a + ab * t;
      }

      void main(){
        vec3 p = position;

        float t0 = uTime * 0.45 + aSeed * 10.0;
        p.xy += vec2(cos(t0), sin(t0)) * 0.0010;

        float minD = 1e9;
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

        float radius = uTrailRadius * (1.0 + 0.6 * clamp(uSpeed, 0.0, 1.0));
        float sigma = radius * uSoftness;
        float envelope = exp(- (minD*minD) / (2.0 * sigma * sigma));

        float along = dot(p.xy - nearest, tangent);
        float phase = along * uWaveFreq - uTime * uWaveSpeed;
        float bands = 0.5 + 0.5 * cos(phase);
        bands = mix(1.0, bands, uBandContrast);

        float vis = max(uBaseAlpha, envelope * bands);
        vAlpha = vis;
        vMix = vis;

        if (envelope > 0.001) {
          vec2 n = normalize(p.xy - nearest + 1e-6);
          float push = envelope * ((uStrength * uDamping) + 0.03 * sin(t0*2.3));
          p.xy += n * push * 0.9;
          p.xy += tangent * push * 0.25;
        }

        gl_Position = vec4(p, 1.0);

        float baseSize = 0.75 + envelope * 1.2;
        gl_PointSize = baseSize * 2.0;
      }
    `

    const fragmentShader = `
      precision highp float;
      varying float vAlpha;
      varying float vMix;

      #define COLOR_MAX ${COLOR_MAX}
      uniform vec3 uColors[COLOR_MAX];
      uniform int uColorCount;

      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        float soft = smoothstep(0.5, 0.0, r);
        float alpha = soft * vAlpha;
        if (alpha <= 0.001) discard;

        int colorIndex = int(floor(clamp(vMix, 0.0, 0.999) * float(uColorCount)));
        colorIndex = clamp(colorIndex, 0, COLOR_MAX - 1);

        vec3 col = uColors[colorIndex];

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

    function pushTrail(nx: number, ny: number): void {
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

    function clearTrail(): void {
      trailCount = 0
      head = 0
      recentSpeed = 0
      ;(uniforms.uTrailCount.value as number) = 0
      uniforms.uSpeed.value = 0
      last.set(999, 999)
    }

    const onMouseMove = (e: MouseEvent): void => {
      const [nx, ny] = toNDC(e.clientX, e.clientY)
      pushTrail(nx, ny)
    }

    const onMouseLeave = (): void => clearTrail()

    const onTouchMove = (e: TouchEvent): void => {
      if (!e.touches?.[0]) return
      const [nx, ny] = toNDC(e.touches[0].clientX, e.touches[0].clientY)
      pushTrail(nx, ny)
    }

    const onTouchEnd = (): void => clearTrail()

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    function resize(): void {
      if (!el) return
      const { clientWidth, clientHeight } = el
      renderer.setSize(clientWidth, clientHeight, false)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const clock = new THREE.Clock()
    let rafId = 0 as number

    function animate(): void {
      rafId = requestAnimationFrame(animate)
      applyMotionPreset()
      applyActiveColours()
      uniforms.uTime.value = (uniforms.uTime.value as number) + clock.getDelta()
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      scene.remove(points)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement && renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [density])

  return (
    <div style={{ position: 'relative', width: '100dvw', height: '100dvh' }}>
      <div
        ref={containerRef}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', background: '#0C0404', overflow: 'hidden' }}
      />

      <div
        style={{
          position: 'absolute',
          right: '1.5rem',
          bottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          color: 'rgba(255, 255, 255, 0.65)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <label htmlFor='motion-mode'>Motion</label>
          <select
            id='motion-mode'
            value={motionMode}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMotionModeChange(e.target.value as MotionMode)}
            style={{
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              padding: '0.5rem 0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            <option value='soft'>Soft</option>
            <option value='balanced'>Balanced</option>
            <option value='intense'>Intense</option>
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <span>Colours</span>

          {primaryColourOptions.map((option: ColourOption) => {
            const isActive = activeColours.includes(option.color)

            return (
              <button
                key={option.value}
                onClick={() => handleColourToggle(option.color)}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '999px',
                  border: isActive ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: option.color,
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.35,
                }}
                aria-label={option.label}
                type='button'
              />
            )
          })}
        </div>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '1.5rem',
            left: '1.5rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
        >
          ← Back
        </button>
      )}
    </div>
  )
}