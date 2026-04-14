import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';

const ZONES = [
  { key: 'movies', label: 'Movie Zone', emoji: '🎬' },
  { key: 'series', label: 'TV Series Zone', emoji: '📺' },
  { key: 'games', label: 'Game Zone', emoji: '🎮' }
];

function colorSetByZone(zone) {
  if (zone === 'movies') {
    return { a: '#ff006e', b: '#fb5607', c: '#ffd166' };
  }
  if (zone === 'series') {
    return { a: '#3a86ff', b: '#8338ec', c: '#5eead4' };
  }
  return { a: '#06d6a0', b: '#118ab2', c: '#f7b801' };
}

function makeTitleArt(title, zone) {
  const colors = colorSetByZone(zone);
  const safeTitle = (title || 'Chill Zone').slice(0, 30).replace(/[<&>]/g, '');
  const short = safeTitle.slice(0, 2).toUpperCase();

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 560'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${colors.a}' />
        <stop offset='55%' stop-color='${colors.b}' />
        <stop offset='100%' stop-color='${colors.c}' />
      </linearGradient>
      <filter id='blur'>
        <feGaussianBlur stdDeviation='20' />
      </filter>
    </defs>
    <rect width='420' height='560' fill='url(#g)' />
    <circle cx='60' cy='65' r='85' fill='rgba(255,255,255,0.18)' filter='url(#blur)' />
    <circle cx='340' cy='490' r='90' fill='rgba(0,0,0,0.2)' filter='url(#blur)' />
    <rect x='20' y='390' width='380' height='150' rx='22' fill='rgba(0,0,0,0.24)' />
    <text x='36' y='468' fill='white' font-family='Trebuchet MS, Arial' font-size='38' font-weight='700'>${safeTitle}</text>
    <text x='30' y='120' fill='rgba(255,255,255,0.95)' font-family='Trebuchet MS, Arial' font-size='96' font-weight='900'>${short}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function PosterImage({ title, zone }) {
  const fallback = makeTitleArt(title, zone);
  const [src, setSrc] = useState(`https://picsum.photos/seed/${encodeURIComponent(`${zone}-${title}`)}/420/560`);

  return (
    <img
      src={src}
      alt={title}
      className="poster"
      loading="lazy"
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
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

  const isAdmin = useMemo(() => ['super_admin', 'content_admin', 'moderator'].includes(user?.role), [user]);

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
      if (!fallbackRes.ok) {
        throw new Error('Both live API and fallback content are unavailable');
      }
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
    if (already) {
      await api(`/api/favourites/${titleExternalId}`, { method: 'DELETE' });
    } else {
      await api('/api/favourites', {
        method: 'POST',
        body: JSON.stringify({ titleExternalId })
      });
    }
    await loadFavourites();
  }

  async function triggerRefresh(jobType) {
    await api('/api/admin/refresh', {
      method: 'POST',
      body: JSON.stringify({ jobType })
    });
    await loadZones();
    setMessage(`Admin refresh triggered: ${jobType}`);
  }

  async function createUser() {
    await api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });
    setNewUser({ email: '', password: '', role: 'moderator' });
    await loadAdmin();
    setMessage('User created by admin');
  }

  async function toggleSource(sourceId, enabled) {
    await api(`/api/admin/sources/${sourceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled })
    });
    await loadAdmin();
  }

  return (
    <main className="page page-rich">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <header className="hero hero-rich fade-in">
        <h1>Chill Zone</h1>
        <p>Pick a vibe, discover something new, and keep the group entertained.</p>
        <div className={`mode-pill ${dataMode === 'live' ? 'mode-live' : 'mode-fallback'}`}>
          {dataMode === 'live' ? 'Live Data' : 'Fallback Snapshot'}
        </div>
      </header>

      <section className="panel auth-panel glass slide-up">
        {!token ? (
          <form onSubmit={onLogin} className="login-grid">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
            <Button type="submit">Login</Button>
          </form>
        ) : (
          <div className="auth-row">
            <span>
              Logged in as <strong>{user?.email || 'user'}</strong> ({user?.role})
            </span>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        )}
      </section>

      {message ? <p className="notice">{message}</p> : null}

      <section className="zones">
        {ZONES.map((zone, zoneIdx) => (
          <div key={zone.key} className="zone-wrap">
            <h2 className={`zone-title zone-${zone.key}`}>
              <span>{zone.emoji}</span> {zone.label}
            </h2>
            <div className="grid">
              {zoneData[zone.key].map((item, index) => {
                const fav = favourites.some((f) => f.titleExternalId === item.externalId);

                return (
                  <Card key={item.externalId} className="card card-rich" style={{ animationDelay: `${(index + zoneIdx) * 45}ms` }}>
                    <div className="media-wrap">
                      <PosterImage title={item.title} zone={item.zone} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.synopsis}</p>
                    {item.imdbUrl ? (
                      <a href={item.imdbUrl} target="_blank" rel="noreferrer">
                        IMDb
                      </a>
                    ) : null}
                    <div className="link-list">
                      {item.links
                        .filter((l) => l.region === 'IN' || l.region === 'US')
                        .map((l) => (
                          <a key={`${l.url}-${l.region}`} href={l.url} target="_blank" rel="noreferrer">
                            {l.label} ({l.region}, {l.linkType})
                          </a>
                        ))}
                    </div>
                    <Button onClick={() => toggleFavourite(item.externalId)}>{fav ? 'Unfavourite' : 'Favourite'}</Button>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {isAdmin && token ? (
        <section className="admin glass">
          <h2>Admin Panel</h2>
          <div className="admin-grid">
            <Card className="card-rich">
              <h3>Refresh Control</h3>
              <div className="button-row">
                <Button onClick={() => triggerRefresh('incremental')}>Run Incremental</Button>
                <Button variant="ghost" onClick={() => triggerRefresh('full')}>
                  Run Full Refresh
                </Button>
              </div>
            </Card>

            <Card className="card-rich">
              <h3>Source Switches</h3>
              {sources.map((s) => (
                <label key={s.id} className="switch-row">
                  <span>
                    {s.name} ({s.type})
                  </span>
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => toggleSource(s.id, e.target.checked)}
                  />
                </label>
              ))}
            </Card>

            {(user?.role === 'super_admin' || user?.role === 'content_admin') && (
              <Card className="card-rich">
                <h3>Create User</h3>
                <input
                  value={newUser.email}
                  placeholder="Email"
                  onChange={(e) => setNewUser((x) => ({ ...x, email: e.target.value }))}
                />
                <input
                  value={newUser.password}
                  placeholder="Password"
                  type="password"
                  onChange={(e) => setNewUser((x) => ({ ...x, password: e.target.value }))}
                />
                <select value={newUser.role} onChange={(e) => setNewUser((x) => ({ ...x, role: e.target.value }))}>
                  <option value="moderator">moderator</option>
                  <option value="content_admin">content_admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
                <Button onClick={createUser}>Create Account</Button>
              </Card>
            )}
          </div>

          <Card className="card-rich">
            <h3>Users</h3>
            <ul className="users-list">
              {users.map((u) => (
                <li key={u.id}>
                  {u.email} - {u.role}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="card-rich">
            <h3>Recent Scrape Jobs</h3>
            <div className="table-wrap">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Titles</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {scrapeJobs.map((job) => (
                    <tr key={job.id}>
                      <td>{new Date(job.createdAt).toLocaleString()}</td>
                      <td>{job.source}</td>
                      <td>{job.type}</td>
                      <td>{job.titleCount}</td>
                      <td>{job.linkCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : null}
    </main>
  );
}
