import { useEffect, useMemo, useRef, useState } from 'react';

const WORLD = {
  width: 100,
  height: 100,
  landY: 8,
  dt: 0.016,
};

const initialState = {
  time: 0,
  x: 20,
  y: 86,
  vx: 0,
  vy: 0,
  angleDeg: -90,
  fuel: 100,
  temp: 20,
  engineOn: false,
  crashed: false,
  landed: false,
};

const defaultParams = {
  windA: 0.02,
  windB: -0.1,
  gravity: 8,
  thrust: 14,
  mass: 1,
  heatK: 0.55,
  coolK: 0.45,
  safeSpeed: 4.2,
  safeAngleDeg: 15,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function worldToSvgY(y) {
  return WORLD.height - y;
}

function quadraticPreview(y0, vy0, g, t) {
  return y0 + vy0 * t - (g / 2) * t * t;
}

function App() {
  const [ship, setShip] = useState(initialState);
  const [params, setParams] = useState(defaultParams);
  const [running, setRunning] = useState(false);
  const [lessonMode, setLessonMode] = useState('trajetoria');
  const [inputAngle, setInputAngle] = useState(-90);
  const rafRef = useRef(null);

  const platform = useMemo(() => ({ xStart: 70, xEnd: 90, y: WORLD.landY }), []);

  const windNow = params.windA * ship.time + params.windB;
  const angleRad = (ship.angleDeg * Math.PI) / 180;
  const thrustRatio = ship.engineOn && ship.fuel > 0 ? 1 : 0;

  const axDisplay = (params.thrust / params.mass) * Math.cos(angleRad) * thrustRatio + windNow;
  const ayDisplay = (params.thrust / params.mass) * Math.sin(angleRad) * thrustRatio - params.gravity;

  useEffect(() => {
    if (!running) {
      return;
    }

    const loop = () => {
      setShip((prev) => {
        if (prev.crashed || prev.landed) {
          return prev;
        }

        const t = prev.time + WORLD.dt;
        const localWind = params.windA * t + params.windB;
        const localAngleRad = (prev.angleDeg * Math.PI) / 180;
        const localThrustRatio = prev.engineOn && prev.fuel > 0 ? 1 : 0;

        const ax = (params.thrust / params.mass) * Math.cos(localAngleRad) * localThrustRatio + localWind;
        const ay = (params.thrust / params.mass) * Math.sin(localAngleRad) * localThrustRatio - params.gravity;

        const vx = prev.vx + ax * WORLD.dt;
        const vy = prev.vy + ay * WORLD.dt;
        const x = clamp(prev.x + vx * WORLD.dt, 0, WORLD.width);
        const y = prev.y + vy * WORLD.dt;

        const fuel = prev.engineOn && prev.fuel > 0 ? Math.max(0, prev.fuel - 12 * WORLD.dt) : prev.fuel;
        const temp = prev.engineOn
          ? Math.min(500, prev.temp * Math.exp(params.heatK * WORLD.dt))
          : Math.max(20, prev.temp * Math.exp(-params.coolK * WORLD.dt));

        const touchGround = y <= WORLD.landY;
        const inPlatform = x >= platform.xStart && x <= platform.xEnd;
        const speed = Math.hypot(vx, vy);
        const angleError = Math.abs(prev.angleDeg + 90);

        if (touchGround && inPlatform) {
          if (speed <= params.safeSpeed && angleError <= params.safeAngleDeg) {
            return { ...prev, time: t, x, y: WORLD.landY, vx, vy, fuel, temp, landed: true };
          }
          return { ...prev, time: t, x, y: WORLD.landY, vx: 0, vy: 0, fuel, temp, crashed: true };
        }

        if (touchGround && !inPlatform) {
          return { ...prev, time: t, x, y: WORLD.landY, vx: 0, vy: 0, fuel, temp, crashed: true };
        }

        if (temp >= 440) {
          return { ...prev, time: t, x, y, vx: 0, vy: 0, fuel, temp, crashed: true };
        }

        return { ...prev, time: t, x, y, vx, vy, fuel, temp };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, params, platform.xEnd, platform.xStart]);

  function resetMission() {
    setShip(initialState);
    setInputAngle(-90);
    setRunning(false);
  }

  function updateParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: Number(value) }));
  }

  function setShipAngle(deg) {
    setInputAngle(deg);
    setShip((prev) => ({ ...prev, angleDeg: Number(deg) }));
  }

  function toggleEngine() {
    setShip((prev) => ({ ...prev, engineOn: !prev.engineOn }));
  }

  function applyEducationalPreset() {
    setParams({
      windA: 0.015,
      windB: -0.2,
      gravity: 7.8,
      thrust: 13,
      mass: 1,
      heatK: 0.52,
      coolK: 0.5,
      safeSpeed: 4,
      safeAngleDeg: 12,
    });
  }

  const telemetry = {
    speed: Math.hypot(ship.vx, ship.vy),
    angleError: Math.abs(ship.angleDeg + 90),
    predictedY2s: quadraticPreview(ship.y, ship.vy, params.gravity, 2),
  };

  return (
    <main className="layout">
      <section className="hero">
        <h1>The Precision Lander</h1>
        <p>
          Aprenda funções na prática: ajuste coeficientes e pilote uma nave onde <strong>matemática = controle</strong>.
        </p>
      </section>

      <section className="panel-grid">
        <article className="card sim-card">
          <header className="card-header">
            <h2>Simulação SVG</h2>
            <div className="actions">
              <button onClick={() => setRunning((s) => !s)}>{running ? 'Pausar' : 'Iniciar'}</button>
              <button onClick={toggleEngine} disabled={ship.crashed || ship.landed}>
                {ship.engineOn ? 'Desligar motor' : 'Ligar motor'}
              </button>
              <button onClick={resetMission}>Resetar</button>
            </div>
          </header>

          <svg viewBox="0 0 100 100" className="sim">
            <rect x="0" y="0" width="100" height="100" fill="#071126" />
            <rect x="0" y={worldToSvgY(WORLD.landY)} width="100" height="100" fill="#2b364f" />
            <rect
              x={platform.xStart}
              y={worldToSvgY(WORLD.landY + 2)}
              width={platform.xEnd - platform.xStart}
              height="2"
              fill="#8bf3a5"
            />

            <line
              x1={ship.x}
              y1={worldToSvgY(ship.y)}
              x2={ship.x + windNow * 8}
              y2={worldToSvgY(ship.y) - 3}
              stroke="#8ed0ff"
              strokeWidth="0.6"
            />

            <g transform={`translate(${ship.x} ${worldToSvgY(ship.y)}) rotate(${ship.angleDeg + 90})`}>
              <polygon points="0,-2 2,2 -2,2" fill={ship.crashed ? '#ff6363' : '#e2e8ff'} />
              {ship.engineOn && !ship.crashed && !ship.landed && ship.fuel > 0 && (
                <polygon points="-0.6,2 0.6,2 0,4.8" fill="#ffb347" />
              )}
            </g>
          </svg>

          <div className="status-row">
            {ship.landed && <p className="ok">✅ Pouso bem-sucedido! Você controlou funções com precisão.</p>}
            {ship.crashed && <p className="bad">❌ Falha! Ajuste ângulo, velocidade, vento e empuxo.</p>}
          </div>
        </article>

        <article className="card">
          <h2>Laboratório de Funções</h2>

          <label>
            Aula:
            <select value={lessonMode} onChange={(e) => setLessonMode(e.target.value)}>
              <option value="trajetoria">Trajetória (quadrática)</option>
              <option value="vetor">Vetor de empuxo (sen/cos)</option>
              <option value="temperatura">Aquecimento (exponencial)</option>
            </select>
          </label>

          <div className="formula-box">
            {lessonMode === 'trajetoria' && (
              <p>
                <strong>y(t) = y₀ + v₀·t - (g/2)·t²</strong>
                <br />
                Previsão para 2s: y(2) = {telemetry.predictedY2s.toFixed(2)}
              </p>
            )}
            {lessonMode === 'vetor' && (
              <p>
                <strong>aₓ = (T/m)·cos(θ) + vento(t)</strong>
                <br />
                <strong>aᵧ = (T/m)·sen(θ) - g</strong>
              </p>
            )}
            {lessonMode === 'temperatura' && (
              <p>
                <strong>T(t) = T₀·e^(k·t)</strong>
                <br />
                Quanto maior k, mais rápido o superaquecimento.
              </p>
            )}
          </div>

          <div className="grid-controls">
            <label>
              Vento a (ax+b)
              <input type="range" min="-0.08" max="0.08" step="0.005" value={params.windA} onChange={(e) => updateParam('windA', e.target.value)} />
              <span>{params.windA.toFixed(3)}</span>
            </label>

            <label>
              Vento b (ax+b)
              <input type="range" min="-2" max="2" step="0.1" value={params.windB} onChange={(e) => updateParam('windB', e.target.value)} />
              <span>{params.windB.toFixed(2)}</span>
            </label>

            <label>
              Gravidade g
              <input type="range" min="4" max="12" step="0.1" value={params.gravity} onChange={(e) => updateParam('gravity', e.target.value)} />
              <span>{params.gravity.toFixed(1)}</span>
            </label>

            <label>
              Empuxo T
              <input type="range" min="6" max="22" step="0.5" value={params.thrust} onChange={(e) => updateParam('thrust', e.target.value)} />
              <span>{params.thrust.toFixed(1)}</span>
            </label>

            <label>
              Aquecimento k
              <input type="range" min="0.2" max="1" step="0.02" value={params.heatK} onChange={(e) => updateParam('heatK', e.target.value)} />
              <span>{params.heatK.toFixed(2)}</span>
            </label>

            <label>
              Ângulo θ (graus)
              <input type="range" min="-170" max="-10" step="1" value={inputAngle} onChange={(e) => setShipAngle(e.target.value)} />
              <span>{inputAngle}°</span>
            </label>
          </div>

          <button onClick={applyEducationalPreset}>Aplicar preset pedagógico</button>
        </article>

        <article className="card telemetry">
          <h2>Telemetria (feedback matemático)</h2>
          <ul>
            <li>t = {ship.time.toFixed(2)} s</li>
            <li>x = {ship.x.toFixed(2)} | y = {ship.y.toFixed(2)}</li>
            <li>vₓ = {ship.vx.toFixed(2)} | vᵧ = {ship.vy.toFixed(2)}</li>
            <li>|v| = {telemetry.speed.toFixed(2)} (limite: {params.safeSpeed})</li>
            <li>Erro angular = {telemetry.angleError.toFixed(1)}° (limite: {params.safeAngleDeg}°)</li>
            <li>aₓ atual = {axDisplay.toFixed(2)}</li>
            <li>aᵧ atual = {ayDisplay.toFixed(2)}</li>
            <li>Combustível = {ship.fuel.toFixed(1)}%</li>
            <li>Temperatura = {ship.temp.toFixed(1)}°C</li>
          </ul>

          <p className="hint">
            Regra de pouso: toque a plataforma verde com <strong>|v|</strong> e <strong>erro angular</strong> abaixo dos limites.
          </p>
        </article>
      </section>
    </main>
  );
}

export default App;
