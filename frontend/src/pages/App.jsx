import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AppLoader } from '../components/AppLoader.jsx';

const ZONES = [
  { key: 'movies', label: 'Movies', emoji: '🎬' },
  { key: 'series', label: 'TV Series', emoji: '📺' },
  { key: 'games', label: 'Games', emoji: '🎮' }
];
const ZONE_SKELETON_COUNT = 4;
const EMERGENCY_POSTER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 960'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231f2937'/%3E%3Cstop offset='100%25' stop-color='%23374151'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='720' height='960' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f8fafc' font-family='Arial,sans-serif' font-size='46' font-weight='700'%3EChill Zone%3C/text%3E%3C/svg%3E";

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
      decoding="async"
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
          return;
        }
        if (src !== EMERGENCY_POSTER) {
          setSrc(EMERGENCY_POSTER);
        }
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
  text = text.replace(/trending title discovered from justwatch path[^.?!]*[.?!]?/gi, '');
  text = text.replace(/on justwatch[^.?!]*[.?!]?/gi, '');
  text = text.replace(/stream(ing)? now[^.?!]*[.?!]?/gi, '');
  text = text.replace(/watch now[^.?!]*[.?!]?/gi, '');
  text = text.replace(/available on[^.?!]*[.?!]?/gi, '');
  text = text.replace(/\s{2,}/g, ' ').trim();
  return text;
}

function mediaFallback(item) {
  const safeTitle = (item?.title || 'Chill Zone').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const zoneHint = item?.zone === 'games' ? 'gameplay' : item?.zone === 'series' ? 'tv series' : 'movie';
  const basePoster = item?.posterUrl ? item.posterUrl.replace(/\/s\d+\//i, '/s1920/') : '';

  const youtubeEmbeds = [
    `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${safeTitle} ${zoneHint} official trailer`)}`,
    `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${safeTitle} ${zoneHint} clips`)}`
  ];

  const backdropImages = [
    basePoster,
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(`${safeTitle} ${zoneHint}`)}&sig=1`,
    `https://source.unsplash.com/1600x900/?${encodeURIComponent(`${safeTitle} cinematic wallpaper`)}&sig=2`,
    `https://picsum.photos/seed/${encodeURIComponent(`${item?.zone || 'zone'}-${safeTitle}-bg`)}/1600/900`
  ].filter(Boolean);

  return {
    youtubeEmbeds: [...new Set(youtubeEmbeds)],
    backdropImages: [...new Set(backdropImages)]
  };
}

function mediaForItem(item) {
  if (item?.media?.youtubeEmbeds?.length && item?.media?.backdropImages?.length) {
    return item.media;
  }
  return mediaFallback(item);
}

function isRelevantPhotoUrl(url, item) {
  if (!url) return false;
  const lower = String(url).toLowerCase();
  const titleSlug = String(item?.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const posterLike = lower.includes('/poster/') || lower.includes('/backdrop/') || lower.includes('tmdb');
  const knownDomain =
    lower.includes('images.justwatch.com') ||
    lower.includes('image.tmdb.org') ||
    lower.includes('imgs.crazygames.com');
  const titleMatch = titleSlug && lower.includes(titleSlug);
  return (knownDomain && (posterLike || titleMatch)) || titleMatch;
}

function toYoutubeWatchUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed')) {
      const videoId = u.pathname.split('/').filter(Boolean)[1];
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
      const list = u.searchParams.get('list');
      if (list) return `https://www.youtube.com/results?search_query=${encodeURIComponent(list)}`;
    }
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') return u.toString();
    return u.toString();
  } catch {
    return '';
  }
}

function trailerLinksForItem(item, media) {
  const links = (media?.youtubeEmbeds || []).map((url, idx) => ({
    label: idx === 0 ? 'Watch Trailer on YouTube' : 'Watch Clips on YouTube',
    url: toYoutubeWatchUrl(url)
  })).filter((x) => x.url);

  if (links.length) return links;

  const safeTitle = (item?.title || 'Chill Zone').replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const zoneHint = item?.zone === 'games' ? 'gameplay' : item?.zone === 'series' ? 'tv series' : 'movie';
  return [
    {
      label: 'Watch Trailer on YouTube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${safeTitle} ${zoneHint} official trailer`)}`
    },
    {
      label: 'Watch Clips on YouTube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${safeTitle} ${zoneHint} clips`)}`
    }
  ];
}

function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve('');
    img.src = url;
  });
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

const NSFW_HINTS = [
  'kamasutra',
  'erotic',
  'explicit',
  'porn',
  'pornhub',
  'xvideos',
  'sex',
  'nsfw',
  'nude',
  'nudity',
  'adult only',
  'softcore',
  'hardcore',
  'fetish'
];

function inferNsfw(item) {
  if (item?.isNsfw === true) return true;
  const links = (item?.links || []).map((l) => `${l?.label || ''} ${l?.url || ''}`).join(' ');
  const haystack = `${item?.title || ''} ${item?.synopsis || ''} ${links}`.toLowerCase();
  if (!haystack.trim()) return false;
  if (/\b18\+\b/.test(haystack)) return true;
  return NSFW_HINTS.some((hint) => haystack.includes(hint));
}

function DetailPage({ item, onBack }) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState('');
  const media = useMemo(() => mediaForItem(item), [item]);
  const trailerLinks = useMemo(() => trailerLinksForItem(item, media), [item, media]);
  const photoWallCandidates = useMemo(() => {
    const candidates = [item?.posterUrl, ...(media.backdropImages || [])].filter(Boolean);
    const unique = [...new Set(candidates)];
    return unique.filter((url) => isRelevantPhotoUrl(url, item)).slice(0, 6);
  }, [item?.posterUrl, item?.title, media.backdropImages]);
  const [readyPhotos, setReadyPhotos] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all(photoWallCandidates.map(preloadImage)).then((urls) => {
      if (!active) return;
      const ok = urls.filter(Boolean).slice(0, 4);
      setReadyPhotos(ok);
    });
    return () => {
      active = false;
    };
  }, [photoWallCandidates]);

  const bgCandidates = useMemo(() => {
    const generated = fallbackPoster(item?.title, item?.zone);
    const candidates = [item?.posterUrl, ...(media.backdropImages || []), generated].filter(Boolean);
    return [...new Set(candidates)];
  }, [item?.posterUrl, item?.title, item?.zone, media.backdropImages]);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    setBgIndex(0);
  }, [item?.externalId, bgCandidates.length]);

  const bgPhoto = bgCandidates[bgIndex] || '';

  return (
    <section className="detail-page cinematic-detail">
      {bgPhoto ? (
        <div className="detail-bg-wrap" aria-hidden="true">
          <img
            src={bgPhoto}
            alt=""
            className="detail-bg-image"
            loading="lazy"
            onError={() => {
              setBgIndex((prev) => (prev < bgCandidates.length - 1 ? prev + 1 : prev));
            }}
          />
          <div className="detail-bg-overlay" />
        </div>
      ) : null}

      <div className="detail-top-actions">
        <Button variant="secondary" onClick={onBack}>Back</Button>
      </div>

      <Card className="detail-card">
        <CardContent className="detail-grid">
          <div className="detail-poster-wrap">
            <PosterImage title={item.title} zone={item.zone} posterUrl={item.posterUrl} className="detail-poster" />
          </div>

          <div className="detail-copy">
            <div className="detail-badge-row">
              <Badge variant="soft">{formatZone(item.zone)}</Badge>
            </div>
            <h1>{item.title}</h1>
            <p className="detail-description">{longDescription(item)}</p>
            <div className="detail-meta">
              <div className="detail-meta-item"><strong>Length:</strong> {itemLength(item)}</div>
              <div className="detail-meta-item"><strong>Region Coverage:</strong> IN, US</div>
              <div className="detail-meta-item"><strong>Last Updated:</strong> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}</div>
            </div>

            {item.imdbUrl ? (
              <a href={item.imdbUrl} target="_blank" rel="noreferrer" className="primary-link">
                Open IMDb
              </a>
            ) : null}

            <Separator className="my-3" />

            <h3 className="detail-section-title">Watch / Play Links</h3>
            <div className="detail-links">
              {item.links?.map((l) => (
                <a key={`${l.url}-${l.region}-${l.label}`} href={l.url} target="_blank" rel="noreferrer">
                  {l.label} ({l.region}, {l.linkType})
                </a>
              ))}
            </div>

            <Separator className="my-3" />

            {trailerLinks.length ? (
              <>
                <h3 className="detail-section-title">Trailer / Clips</h3>
                <div className="trailer-links-grid">
                  {trailerLinks.map((link) => (
                    <a
                      key={link.url}
                      className="trailer-link-card"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </>
            ) : null}

            {readyPhotos.length ? (
              <>
                <h3 className="detail-section-title">Photo Wall</h3>
                <div className="photo-grid">
                  {readyPhotos.map((url) => (
                    <button
                      type="button"
                      key={url}
                      className="photo-tile"
                      onClick={() => {
                        setActivePhoto(url);
                        setPhotoOpen(true);
                      }}
                      aria-label="Open photo full screen"
                    >
                      <img src={url} alt={`${item.title} visual`} loading="lazy" />
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {photoOpen ? (
        <div className="photo-modal" role="dialog" aria-modal="true">
          <button type="button" className="photo-modal-close" onClick={() => setPhotoOpen(false)} aria-label="Close photo">
            ✕
          </button>
          <img src={activePhoto} alt={`${item.title} full screen`} className="photo-modal-image" />
        </div>
      ) : null}
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
      <Button variant="outline" size="icon" className="hero-arrow left" onClick={onPrev} aria-label="Previous Slide">
        ‹
      </Button>
      <div className="hero-carousel-card modern-card">
        <div className="hero-carousel-media">
          <PosterImage title={active.title} zone={active.zone} posterUrl={active.posterUrl} className="hero-poster" />
        </div>
        <div className="hero-carousel-copy">
          <div className="hero-badge-row">
            <Badge variant="soft">{formatZone(active.zone)}</Badge>
          </div>
          <h3>{active.title}</h3>
          <p>{shortBlurb(active)}</p>
          <div className="hero-carousel-actions">
            <Button onClick={() => onOpen(active)}>Open Details</Button>
            <Button variant="secondary" onClick={onNext}>Next Slide</Button>
          </div>
        </div>
      </div>
      <Button variant="outline" size="icon" className="hero-arrow right" onClick={onNext} aria-label="Next Slide">
        ›
      </Button>

      <div className="hero-dots">
        {slides.map((s, i) => (
          <Button
            key={`${s.externalId}-${i}`}
            variant="ghost"
            size="icon"
            className={`hero-dot ${i === activeIndex ? 'active' : ''}`}
            onClick={() => onGoTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ZoneSkeletonGrid({ zoneLabel }) {
  return (
    <div className="grid skeleton-grid" aria-label={`${zoneLabel} loading`}>
      {Array.from({ length: ZONE_SKELETON_COUNT }, (_, idx) => (
        <Card key={`${zoneLabel}-${idx}`} className="card-rich modern-card skeleton-card" aria-hidden="true">
          <CardContent className="card-content">
            <div className="media-wrap skeleton-block skeleton-poster" />
            <div className="skeleton-block skeleton-title" />
            <div className="skeleton-block skeleton-subtitle" />
          </CardContent>
        </Card>
      ))}
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
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'moderator' });
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [allowNsfw, setAllowNsfw] = useState(() => window.localStorage.getItem('allowNsfw') === 'true');
  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [initialLoadPending, setInitialLoadPending] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(false);
  const lastScrollYRef = useRef(0);
  const userMenuRef = useRef(null);

  const isAdmin = useMemo(() => ['super_admin', 'content_admin', 'moderator'].includes(user?.role), [user]);

  useEffect(() => {
    window.localStorage.setItem('allowNsfw', String(allowNsfw));
  }, [allowNsfw]);

  const filteredZoneData = useMemo(() => {
    const filterItems = (items = []) => (allowNsfw ? items : items.filter((item) => !inferNsfw(item)));
    return {
      movies: filterItems(zoneData.movies),
      series: filterItems(zoneData.series),
      games: filterItems(zoneData.games)
    };
  }, [zoneData, allowNsfw]);

  const allItems = useMemo(
    () => [...filteredZoneData.movies, ...filteredZoneData.series, ...filteredZoneData.games],
    [filteredZoneData]
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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)');
    lastScrollYRef.current = window.scrollY;

    function handleScroll() {
      if (!mq.matches) {
        setMobileHeaderHidden(false);
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;

      if (y <= 24 || delta <= -8) {
        setMobileHeaderHidden(false);
      } else if (delta >= 10 && y >= 88) {
        setMobileHeaderHidden(true);
      }

      lastScrollYRef.current = y;
    }

    function handleViewportChange() {
      if (!mq.matches) setMobileHeaderHidden(false);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleViewportChange);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setLoginModalOpen(false);
  }, [route.page, route.zone, route.id]);

  useEffect(() => {
    if (route.page === 'detail' && route.zone) {
      setActiveNav(route.zone);
      return;
    }
    if (route.page === 'home') {
      setActiveNav('home');
    }
  }, [route.page, route.zone]);

  function navigateHome() {
    setSidebarOpen(false);
    setActiveNav('home');
    window.history.pushState({}, '', '/');
    setRoute({ page: 'home' });
  }

  function navigateDetail(item) {
    setActiveNav(item.zone || 'home');
    const path = `/detail/${item.zone}/${encodeURIComponent(item.externalId)}`;
    window.history.pushState({}, '', path);
    setRoute({ page: 'detail', zone: item.zone, id: item.externalId });
  }

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openZoneFromNav(zoneKey) {
    setSidebarOpen(false);
    setActiveNav(zoneKey);
    if (route.page !== 'home') {
      navigateHome();
      window.setTimeout(() => jumpTo(`zone-${zoneKey}`), 70);
      return;
    }
    jumpTo(`zone-${zoneKey}`);
  }

  function openAdminFromNav() {
    setSidebarOpen(false);
    setActiveNav('admin');
    if (route.page !== 'home') {
      navigateHome();
      window.setTimeout(() => jumpTo('admin-root'), 70);
      return;
    }
    jumpTo('admin-root');
  }

  async function loadZones({ silent = false } = {}) {
    if (!silent) setZonesLoading(true);
    try {
      const [movies, series, games] = await Promise.all([
        api('/api/content/movies'),
        api('/api/content/series'),
        api('/api/content/games')
      ]);
      setZoneData({ movies, series, games });
    } catch {
      const fallbackRes = await fetch('/fallback-content.json');
      if (!fallbackRes.ok) throw new Error('Both live API and fallback content are unavailable');
      const fallback = await fallbackRes.json();
      setZoneData({
        movies: fallback.movies || [],
        series: fallback.series || [],
        games: fallback.games || []
      });
    } finally {
      if (!silent) setZonesLoading(false);
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
    let active = true;
    const startedAt = Date.now();

    async function boot() {
      try {
        await loadZones({ silent: true });
      } catch (err) {
        if (active) setMessage(err.message);
      } finally {
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, 1100 - elapsed);
        window.setTimeout(() => {
          if (!active) return;
          setInitialLoadPending(false);
        }, wait);
      }
    }

    boot();
    return () => {
      active = false;
    };
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
      setLoginModalOpen(false);
      setUserMenuOpen(false);
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

  if (initialLoadPending) {
    return <AppLoader subtitle="Fetching movies, series and games..." />;
  }

  return (
    <main className="app-shell modern-shell">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className="app-layout">
        <aside className={`app-sidebar modern-card ${sidebarOpen ? 'open' : ''}`}>
          {zonesLoading ? <Badge variant="warning" className="sidebar-sync-badge">Syncing</Badge> : null}
          <nav className="sidebar-nav">
            <p className="sidebar-group-title">Browse</p>
            <Button variant="ghost" className={`sidebar-link ${activeNav === 'home' ? 'is-active' : ''}`} onClick={navigateHome}>
              <span className="sidebar-link-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Home
            </Button>
            <Button variant="ghost" className={`sidebar-link ${activeNav === 'movies' ? 'is-active' : ''}`} onClick={() => openZoneFromNav('movies')}>
              <span className="sidebar-link-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M4 9h16M9 4v5m6-5v5M8 13l2-1.2L12 13l2-1.2L16 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Movies
            </Button>
            <Button variant="ghost" className={`sidebar-link ${activeNav === 'series' ? 'is-active' : ''}`} onClick={() => openZoneFromNav('series')}>
              <span className="sidebar-link-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3.5" y="5" width="17" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 20h6M12 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              Series
            </Button>
            <Button variant="ghost" className={`sidebar-link ${activeNav === 'games' ? 'is-active' : ''}`} onClick={() => openZoneFromNav('games')}>
              <span className="sidebar-link-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6.6 9h10.8a3.6 3.6 0 0 1 3.5 4.5l-1.1 4a3 3 0 0 1-4.8 1.6l-1.7-1.4a2 2 0 0 0-2.6 0L9 19.1a3 3 0 0 1-4.8-1.6l-1.1-4A3.6 3.6 0 0 1 6.6 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.4 13.2v-2.4m-1.2 1.2h2.4M16.5 12h.01M18.2 13.6h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              Games
            </Button>
            {isAdmin && token ? (
              <>
                <Separator />
                <p className="sidebar-group-title">Admin</p>
                <Button variant="ghost" className={`sidebar-link ${activeNav === 'admin' ? 'is-active' : ''}`} onClick={openAdminFromNav}>
                  <span className="sidebar-link-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="m12 8.2.9-2.1 2.2.3.8 2.1 2 1.1 1.9-1.1 1.5 1.7-1.1 1.9.7 2.2 2.1.9-.3 2.2-2.1.8-1.1 2 1.1 1.9-1.7 1.5-1.9-1.1-2.2.7-.9 2.1-2.2-.3-.8-2.1-2-1.1-1.9 1.1-1.5-1.7 1.1-1.9-.7-2.2-2.1-.9.3-2.2 2.1-.8 1.1-2-1.1-1.9 1.7-1.5 1.9 1.1 2.2-.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </span>
                  Admin
                </Button>
              </>
            ) : null}
          </nav>
        </aside>

        <div className="app-main">
          <header className={`topbar modern-topbar ${mobileHeaderHidden ? 'is-hidden-mobile' : ''}`}>
            <div className="topbar-left">
              <Button
                variant="ghost"
                size="icon"
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen((x) => !x)}
                aria-label="Toggle sidebar"
              >
                ☰
              </Button>
              <div
                className="brand brand-clickable"
                role="button"
                tabIndex={0}
                onClick={navigateHome}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateHome();
                  }
                }}
                aria-label="Go to home page"
              >
                <span className="brand-mark" aria-hidden="true">
                  <svg viewBox="0 0 64 64" role="img">
                    <defs>
                      <linearGradient id="czg-topbar" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#d61f2c" />
                        <stop offset="100%" stopColor="#f7c843" />
                      </linearGradient>
                    </defs>
                    <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#czg-topbar)" />
                    <path d="M16 33c2-8 7-13 15-13 4 0 8 1 11 4l-4 5c-2-1-4-2-7-2-5 0-8 3-9 8-1 5 1 9 7 9 3 0 6-1 8-3l3 5c-3 2-7 4-12 4-9 0-15-6-12-17z" fill="#fff8ed" />
                  </svg>
                </span>
                <span className="brand-text">CHILL ZONE</span>
              </div>
            </div>

            <nav className="top-actions">
              <div className="user-menu-wrap" ref={userMenuRef}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen((x) => !x)}
                  aria-label="Open user menu"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4 0-7.2 2.2-8 5.3-.1.4.2.7.6.7h14.8c.4 0 .7-.3.6-.7C19.2 16.2 16 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
                {userMenuOpen ? (
                  <div className="user-menu-dropdown">
                    {token ? (
                      <>
                        <div className="user-menu-email">{user?.email || 'user'}</div>
                        <div className="user-menu-role">{user?.role || 'member'}</div>
                        <div className="user-menu-toggle-row" title="Show or hide 18+ titles">
                          <span>Allow 18+</span>
                          <Switch
                            checked={allowNsfw}
                            onCheckedChange={setAllowNsfw}
                            aria-label="Allow 18 plus and NSFW titles"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          className="user-menu-item"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="user-menu-email">Not logged in</div>
                        <div className="user-menu-toggle-row" title="Show or hide 18+ titles">
                          <span>Allow 18+</span>
                          <Switch
                            checked={allowNsfw}
                            onCheckedChange={setAllowNsfw}
                            aria-label="Allow 18 plus and NSFW titles"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          className="user-menu-item"
                          onClick={() => {
                            setLoginModalOpen(true);
                            setUserMenuOpen(false);
                          }}
                        >
                          Login
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
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

            {message ? <p className="notice">{message}</p> : null}

            <section id="zones-root" className="zones">
              {ZONES.map((zone) => (
                <div key={zone.key} id={`zone-${zone.key}`} className="zone-wrap">
                  <h2 className="zone-title"><span>{zone.emoji}</span> {zone.label}</h2>
                  {filteredZoneData[zone.key].length ? (
                    <div className="grid">
                      {filteredZoneData[zone.key].map((item) => {
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
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className={`heart-btn ${fav ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavourite(item.externalId);
                                  }}
                                  aria-label={fav ? 'Remove favourite' : 'Add favourite'}
                                  title={fav ? 'Remove favourite' : 'Add favourite'}
                                >
                                  {fav ? '♥' : '♡'}
                                </Button>
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
                  ) : (
                    <p className="zone-empty">No titles in this zone for the current content safety setting.</p>
                  )}
                  {zonesLoading ? <ZoneSkeletonGrid zoneLabel={zone.label} /> : null}
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
        </div>
      </div>

      {loginModalOpen ? (
        <div className="login-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setLoginModalOpen(false)}>
          <Card className="login-modal-card modern-card" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="login-modal-header">
              <CardTitle>Sign In</CardTitle>
              <p className="login-modal-subtitle">Continue to manage favourites and admin controls.</p>
            </CardHeader>
            <CardContent className="login-modal-content">
              <form onSubmit={onLogin} className="login-grid">
                <div className="login-field-group">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="login-field-group">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                  <p className="login-helper-text">Use the credentials provided by your admin.</p>
                </div>
                {message ? <p className="login-error-text">{message}</p> : null}
                <div className="login-modal-actions">
                  <Button className="login-modal-btn" variant="secondary" type="button" onClick={() => setLoginModalOpen(false)}>Cancel</Button>
                  <Button className="login-modal-btn" type="submit">Login</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
