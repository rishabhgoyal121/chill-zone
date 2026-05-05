import { useEffect, useMemo, useState } from 'react';

const LOADING_STAGES = [
  { label: 'Connecting services', helper: 'We are syncing movies, series, and games.' },
  { label: 'Curating picks', helper: 'Ranking titles so your first glance feels useful.' },
  { label: 'Warming visuals', helper: 'Preparing posters and hero highlights.' },
  { label: 'Final polish', helper: 'Almost there. Your lounge is opening now.' }
];

const LOADING_TIPS = [
  'Mini challenge: breathe in for 4, hold for 4, out for 4.',
  'Tap "Boost mood" to speed up the perceived wait.',
  'Pro move: hover cards later for quick blurbs before opening details.',
  'Pick your first zone now: Movies, Series, or Games?',
  'If you are with friends, first vote wins the opening title.'
];

function randomIndex(total) {
  if (total <= 1) return 0;
  return Math.floor(Math.random() * total);
}

export function AppLoader({ subtitle = 'Preparing your lounge...' }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [boosts, setBoosts] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => randomIndex(LOADING_TIPS.length));
  const activeStage = LOADING_STAGES[Math.min(stageIndex, LOADING_STAGES.length - 1)];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      setProgress((prev) => {
        const next = prev + 14;
        return next > 94 ? 94 : next;
      });
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 1300);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (boosts <= 0) return;
    setProgress((prev) => Math.min(96, prev + 2));
  }, [boosts]);

  const progressLabel = useMemo(() => `${progress}% ready`, [progress]);

  return (
    <section className="app-loader" role="status" aria-live="polite">
      <div className="app-loader-card">
        <p className="app-loader-kicker">CHILL ZONE</p>
        <h1>Setting Up Your Chill Session</h1>
        <p className="app-loader-subtitle">{activeStage.helper}</p>

        <div className="app-loader-progress-wrap" aria-label={progressLabel}>
          <div className="app-loader-progress-track">
            <div className="app-loader-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="app-loader-progress-meta">
            <span>{activeStage.label}</span>
            <span>{progressLabel}</span>
          </div>
        </div>

        <ol className="app-loader-stage-list" aria-hidden="true">
          {LOADING_STAGES.map((stage, idx) => (
            <li
              key={stage.label}
              className={`app-loader-stage-item ${idx < stageIndex ? 'is-complete' : ''} ${idx === stageIndex ? 'is-active' : ''}`}
            >
              {stage.label}
            </li>
          ))}
        </ol>

        <div className="app-loader-tip-card">
          <p>{LOADING_TIPS[tipIndex]}</p>
          <button
            type="button"
            className="app-loader-boost-btn"
            onClick={() => setBoosts((prev) => prev + 1)}
          >
            Boost mood {boosts ? `(${boosts})` : ''}
          </button>
        </div>

        <p className="app-loader-footnote">{subtitle}</p>
      </div>
    </section>
  );
}

export function LoadingJourneyTicker() {
  const [tipIndex, setTipIndex] = useState(() => randomIndex(LOADING_TIPS.length));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2200);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="loading-journey-ticker" role="status" aria-live="polite">
      <span className="loading-journey-dot" aria-hidden="true" />
      <p>{LOADING_TIPS[tipIndex]}</p>
    </div>
  );
}
