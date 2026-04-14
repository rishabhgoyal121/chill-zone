import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const ZONES = [
  { key: 'movies', label: 'Movies', emoji: '🎬' },
  { key: 'series', label: 'TV Series', emoji: '📺' },
  { key: 'games', label: 'Games', emoji: '🎮' }
];

function fallbackPoster(title, zone) {
  const colors =
    zone === 'movies'
      ? ['#7c3aed', '#f43f5e']
      : zone === 'series'
        ? ['#0ea5e9', '#22c55e']
        : ['#f59e0b', '#ef4444'];

  const safe = (title || 'Chill Zone').slice(0, 24).replace(/[<&>]/g, '');
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 960'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${colors[0]}'/><stop offset='100%' stop-color='${colors[1]}'/></linearGradient></defs>
    <rect width='720' height='960' fill='url(#g)'/>
    <rect x='32' y='740' width='656' height='180' rx='22' fill='rgba(15,23,42,0.3)'/>
    <text x='52' y='840' fill='white' font-family='Arial, sans-serif' font-size='54' font-weight='700'>${safe}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PosterImage({ title, zone, posterUrl, className = 'poster' }) {
  const fallback = fallbackPoster(title, zone);
  const [src, setSrc] = useState(posterUrl || fallback);

  useEffect(() => {
    setSrc(posterUrl || fallback);
  }, [posterUrl, fallback]);

  return (
    <img
      src={src}
      alt={title}
      className={className}
      loading="lazy"
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}

function formatZone(zone) {
  return ZONES.find((z) => z.key === zone)?.label || zone;
}

function parseRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'detail' && parts.length >= 3) {
    return {
      page: 'detail',
      zone: parts[1],
      id: decodeURIComponent(parts.slice(2).join('/'))
    };
  }
  return { page: 'home' };
}

function itemLength(item) {
  if (item?.length) return item.length;
  const t = (item?.title || '').toLowerCase();
  let hash = 0;
  for (let i = 0; i < t.length; i += 1) hash = (hash * 31 + t.charCodeAt(i)) % 997;

  if (item?.zone === 'movies') return `${95 + (hash % 50)} min`;
  if (item?.zone === 'series') return `${6 + (hash % 8)} episodes`;
  return `${30 + (hash % 90)} min play session`;
}

function titleHash(title = '') {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash * 31 + title.charCodeAt(i)) % 997;
  return hash;
}

function truncateText(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function cleanSynopsis(raw) {
  if (!raw) return '';
  let text = String(raw).replace(/\s+/g, ' ').trim();
  text = text.replace(/on justwatch[^.?!]*[.?!]?/gi, '');
  text = text.replace(/stream(ing)? now[^.?!]*[.?!]?/gi, '');
  text = text.replace(/watch now[^.?!]*[.?!]?/gi, '');
  text = text.replace(/available on[^.?!]*[.?!]?/gi, '');
  text = text.replace(/\s{2,}/g, ' ').trim();
  return text;
}

function shortBlurb(item) {
  const cleaned = cleanSynopsis(item?.synopsis);
  if (cleaned.length >= 40) return truncateText(cleaned, 130);

  const title = item?.title || 'This title';
  const h = titleHash(title);

  const movieBlurbs = [
    `${title} is perfect for a relaxed movie night with friends and snacks.`,
    `${title} brings a strong mood and an easy watch flow for group chill time.`,
    `${title} is a crowd-friendly pick when you want something fun without overthinking.`
  ];

  const seriesBlurbs = [
    `${title} is binge-friendly with enough hooks to keep everyone locked in.`,
    `${title} works great for long chill sessions where one episode is never enough.`,
    `${title} is a smooth series pick when your group wants a shared watch rhythm.`
  ];

  const gameBlurbs = [
    `${title} is a quick-hit game pick that keeps the room energy high.`,
    `${title} is great for casual rounds while hanging out and chatting.`,
    `${title} is easy to jump into and fun to rotate with friends.`
  ];

  if (item?.zone === 'movies') {
    return movieBlurbs[h % movieBlurbs.length];
  }
  if (item?.zone === 'series') {
    return seriesBlurbs[h % seriesBlurbs.length];
  }
  return gameBlurbs[h % gameBlurbs.length];
}

function longDescription(item) {
  const cleaned = cleanSynopsis(item?.synopsis);
  if (cleaned.length >= 40) return truncateText(cleaned, 360);
  return shortBlurb(item);
}

function DetailPage({ item, onBack }) {
  const detailRef = useRef(null);
  const [fsError, setFsError] = useState('');

  async function openFullscreen() {
    try {
      setFsError('');
      if (detailRef.current?.requestFullscreen) await detailRef.current.requestFullscreen();
    } catch {
      setFsError('Fullscreen is blocked by the browser on this page.');
    }
  }

  return (
    <section className="detail-page" ref={detailRef}>
      <div className="detail-top-actions">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button onClick={openFullscreen}>View Full Screen</Button>
      </div>

      <Card className="detail-card">
        <CardContent className="detail-grid">
          <div className="detail-poster-wrap">
            <PosterImage title={item.title} zone={item.zone} posterUrl={item.posterUrl} className="detail-poster" />
          </div>

          <div className="detail-copy">
            <Badge variant="soft">{formatZone(item.zone)}</Badge>
            <h1>{item.title}</h1>
            <p>{longDescription(item)}</p>
            <div className="detail-meta">
              <div><strong>Length:</strong> {itemLength(item)}</div>
              <div><strong>Region Coverage:</strong> IN, US</div>
              <div><strong>Last Updated:</strong> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}</div>
            </div>

            {item.imdbUrl ? (
              <a href={item.imdbUrl} target="_blank" rel="noreferrer" className="primary-link">
                Open IMDb
              </a>
            ) : null}

            <Separator className="my-3" />

            <h3>Watch / Play Links</h3>
            <div className="detail-links">
              {item.links?.map((l) => (
                <a key={`${l.url}-${l.region}-${l.label}`} href={l.url} target="_blank" rel="noreferrer">
                  {l.label} ({l.region}, {l.linkType})
                </a>
              ))}
            </div>

            {fsError ? <p className="notice">{fsError}</p> : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function HeroCarousel({ slides, activeIndex, onPrev, onNext, onGoTo, onOpen }) {
  if (!slides.length) {
    return (
      <div className="hero-carousel-card modern-card">
        <p>No featured titles yet. Run a refresh to fill the hero carousel.</p>
      </div>
    );
  }

  const active = slides[activeIndex] || slides[0];

  return (
    <div className="hero-carousel">
      <button className="hero-arrow left" onClick={onPrev} aria-label="Previous Slide">‹</button>
      <div className="hero-carousel-card modern-card">
        <div className="hero-carousel-media">
          <PosterImage title={active.title} zone={active.zone} posterUrl={active.posterUrl} className="hero-poster" />
        </div>
        <div className="hero-carousel-copy">
          <Badge variant="soft">{formatZone(active.zone)}</Badge>
          <h3>{active.title}</h3>
          <p>{shortBlurb(active)}</p>
          <div className="hero-carousel-actions">
            <Button onClick={() => onOpen(active)}>Open Details</Button>
            <Button variant="secondary" onClick={onNext}>Next Slide</Button>
          </div>
        </div>
      </div>
      <button className="hero-arrow right" onClick={onNext} aria-label="Next Slide">›</button>

      <div className="hero-dots">
        {slides.map((s, i) => (
          <button
            key={`${s.externalId}-${i}`}
            className={`hero-dot ${i === activeIndex ? 'active' : ''}`}
            onClick={() => onGoTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function App() {
  const { user, token, login, logout } = useAuth();
  const [email, setEmail] = useState('admin@chillzone.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [zoneData, setZoneData] = useState({ movies: [], series: [], games: [] });
  const [favourites, setFavourites] = useState([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [sources, setSources] = useState([]);
  const [scrapeJobs, setScrapeJobs] = useState([]);
  const [dataMode, setDataMode] = useState('live');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'moderator' });
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  const isAdmin = useMemo(() => ['super_admin', 'content_admin', 'moderator'].includes(user?.role), [user]);

  const allItems = useMemo(
    () => [...zoneData.movies, ...zoneData.series, ...zoneData.games],
    [zoneData]
  );

  const detailItem = useMemo(() => {
    if (route.page !== 'detail') return null;
    return allItems.find((x) => x.zone === route.zone && x.externalId === route.id) || null;
  }, [route, allItems]);

  const heroSlides = useMemo(() => allItems.slice(0, 8), [allItems]);

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!heroSlides.length || route.page === 'detail' || heroPaused) return undefined;
    const id = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [heroSlides, route.page, heroPaused]);

  useEffect(() => {
    if (!heroSlides.length) {
      setHeroIndex(0);
      return;
    }
    setHeroIndex((prev) => (prev >= heroSlides.length ? 0 : prev));
  }, [heroSlides.length]);

  function navigateHome() {
    window.history.pushState({}, '', '/');
    setRoute({ page: 'home' });
  }

  function navigateDetail(item) {
    const path = `/detail/${item.zone}/${encodeURIComponent(item.externalId)}`;
    window.history.pushState({}, '', path);
    setRoute({ page: 'detail', zone: item.zone, id: item.externalId });
  }

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadZones() {
    try {
      const [movies, series, games] = await Promise.all([
        api('/api/content/movies'),
        api('/api/content/series'),
        api('/api/content/games')
      ]);
      setZoneData({ movies, series, games });
      setDataMode('live');
    } catch {
      const fallbackRes = await fetch('/fallback-content.json');
      if (!fallbackRes.ok) throw new Error('Both live API and fallback content are unavailable');
      const fallback = await fallbackRes.json();
      setZoneData({
        movies: fallback.movies || [],
        series: fallback.series || [],
        games: fallback.games || []
      });
      setDataMode('fallback');
      setMessage('Live API unavailable. Showing fallback snapshot data.');
    }
  }

  async function loadFavourites() {
    if (!token) return;
    const data = await api('/api/favourites');
    setFavourites(data);
  }

  async function loadAdmin() {
    if (!token || !isAdmin) return;
    const [src, userList, jobs] = await Promise.all([
      api('/api/admin/sources'),
      user?.role === 'super_admin' || user?.role === 'content_admin' ? api('/api/admin/users') : Promise.resolve([]),
      api('/api/admin/scrape-jobs?limit=25')
    ]);
    setSources(src);
    setUsers(userList);
    setScrapeJobs(jobs);
  }

  useEffect(() => {
    loadZones().catch((err) => setMessage(err.message));
  }, []);

  useEffect(() => {
    loadFavourites().catch((err) => setMessage(err.message));
    loadAdmin().catch((err) => setMessage(err.message));
  }, [token, isAdmin]);

  async function onLogin(e) {
    e.preventDefault();
    try {
      await login(email, password);
      setMessage('Login successful');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function toggleFavourite(titleExternalId) {
    if (!token) {
      setMessage('Login required for favourites');
      return;
    }
    const already = favourites.find((f) => f.titleExternalId === titleExternalId);
    if (already) await api(`/api/favourites/${titleExternalId}`, { method: 'DELETE' });
    else await api('/api/favourites', { method: 'POST', body: JSON.stringify({ titleExternalId }) });
    await loadFavourites();
  }

  async function triggerRefresh(jobType) {
    await api('/api/admin/refresh', { method: 'POST', body: JSON.stringify({ jobType }) });
    await loadZones();
    setMessage(`Admin refresh triggered: ${jobType}`);
  }

  async function createUser() {
    await api('/api/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
    setNewUser({ email: '', password: '', role: 'moderator' });
    await loadAdmin();
    setMessage('User created by admin');
  }

  async function toggleSource(sourceId, enabled) {
    await api(`/api/admin/sources/${sourceId}`, { method: 'PATCH', body: JSON.stringify({ enabled }) });
    await loadAdmin();
  }

  return (
    <main className="app-shell modern-shell">
      <header className="topbar modern-topbar">
        <div className="brand">CHILL ZONE</div>
        <nav className="top-actions">
          <Badge variant={dataMode === 'live' ? 'success' : 'warning'}>
            {dataMode === 'live' ? 'Live' : 'Fallback'}
          </Badge>
          <Button variant="secondary" onClick={navigateHome}>Home</Button>
          <Button variant="secondary" onClick={() => jumpTo('zones-root')}>Browse</Button>
        </nav>
      </header>

      <section className="content-area">
        {route.page === 'detail' && detailItem ? (
          <DetailPage item={detailItem} onBack={navigateHome} />
        ) : (
          <>
            <section
              id="hero-root"
              className="hero modern-hero hero-large"
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
            >
              <div className="hero-layout">
                <div className="hero-copy">
                  <p className="hero-kicker">Fresh Picks</p>
                  <h1>Big Hero Carousel For Your Chill Session</h1>
                  <p>Browse rotating highlights across movies, TV, and games. Click any slide to open full details.</p>
                  <div className="hero-main-actions">
                    <Button onClick={() => jumpTo('zones-root')}>Explore All Zones</Button>
                    <Button variant="secondary" onClick={() => heroSlides[heroIndex] && navigateDetail(heroSlides[heroIndex])}>
                      Open Current Slide
                    </Button>
                  </div>
                </div>

                <HeroCarousel
                  slides={heroSlides}
                  activeIndex={heroIndex}
                  onPrev={() => setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                  onNext={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                  onGoTo={setHeroIndex}
                  onOpen={navigateDetail}
                />
              </div>
            </section>

            <section className="panel auth-panel modern-card">
              {!token ? (
                <form onSubmit={onLogin} className="login-grid">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
                  <Button type="submit">Login</Button>
                </form>
              ) : (
                <div className="auth-row">
                  <span>
                    Logged in as <strong>{user?.email || 'user'}</strong> ({user?.role})
                  </span>
                  <Button variant="secondary" onClick={logout}>Logout</Button>
                </div>
              )}
            </section>

            {message ? <p className="notice">{message}</p> : null}

            <section id="zones-root" className="zones">
              {ZONES.map((zone) => (
                <div key={zone.key} id={`zone-${zone.key}`} className="zone-wrap">
                  <h2 className="zone-title"><span>{zone.emoji}</span> {zone.label}</h2>
                  <div className="grid">
                    {zoneData[zone.key].map((item) => {
                      const fav = favourites.some((f) => f.titleExternalId === item.externalId);
                      return (
                        <Card
                          key={item.externalId}
                          className="card-rich modern-card clickable-card"
                          onClick={() => navigateDetail(item)}
                        >
                          <CardContent className="card-content">
                            <div className="media-wrap">
                              <PosterImage title={item.title} zone={item.zone} posterUrl={item.posterUrl} className="poster" />
                              <button
                                className={`heart-btn ${fav ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavourite(item.externalId);
                                }}
                                aria-label={fav ? 'Remove favourite' : 'Add favourite'}
                                title={fav ? 'Remove favourite' : 'Add favourite'}
                              >
                                {fav ? '♥' : '♡'}
                              </button>
                              <div className="hover-blurb">
                                {shortBlurb(item)}
                              </div>
                            </div>
                            <CardTitle>{item.title}</CardTitle>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            {isAdmin && token ? (
              <section id="admin-root" className="admin modern-card">
                <h2>Admin Panel</h2>
                <div className="admin-grid">
                  <Card className="modern-card">
                    <CardHeader><CardTitle>Refresh</CardTitle></CardHeader>
                    <CardContent>
                      <div className="button-row">
                        <Button onClick={() => triggerRefresh('incremental')}>Run Incremental</Button>
                        <Button variant="secondary" onClick={() => triggerRefresh('full')}>Run Full Refresh</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="modern-card">
                    <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
                    <CardContent>
                      {sources.map((s) => (
                        <label key={s.id} className="switch-row">
                          <span>{s.name} ({s.type})</span>
                          <input type="checkbox" checked={s.enabled} onChange={(e) => toggleSource(s.id, e.target.checked)} />
                        </label>
                      ))}
                    </CardContent>
                  </Card>

                  {(user?.role === 'super_admin' || user?.role === 'content_admin') && (
                    <Card className="modern-card">
                      <CardHeader><CardTitle>Create User</CardTitle></CardHeader>
                      <CardContent>
                        <input value={newUser.email} placeholder="Email" onChange={(e) => setNewUser((x) => ({ ...x, email: e.target.value }))} />
                        <input value={newUser.password} placeholder="Password" type="password" onChange={(e) => setNewUser((x) => ({ ...x, password: e.target.value }))} />
                        <select value={newUser.role} onChange={(e) => setNewUser((x) => ({ ...x, role: e.target.value }))}>
                          <option value="moderator">moderator</option>
                          <option value="content_admin">content_admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                        <Button onClick={createUser}>Create Account</Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            ) : null}
          </>
        )}
      </section>

      <nav className="bottombar modern-card">
        <Button variant="ghost" className="dock-btn" onClick={navigateHome}>Home</Button>
        <Button variant="ghost" className="dock-btn" onClick={() => jumpTo('zone-movies')}>Movies</Button>
        <Button variant="ghost" className="dock-btn" onClick={() => jumpTo('zone-series')}>Series</Button>
        <Button variant="ghost" className="dock-btn" onClick={() => jumpTo('zone-games')}>Games</Button>
      </nav>
    </main>
  );
}
