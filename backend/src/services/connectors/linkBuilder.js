function encodeQ(value) {
  return encodeURIComponent(value);
}

export function buildMovieOrSeriesLinks({ titleExternalId, zone, title }) {
  const q = encodeQ(title);
  return [
    {
      titleExternalId,
      zone,
      label: 'Netflix Search',
      url: `https://www.netflix.com/search?q=${q}`,
      region: 'IN',
      linkType: 'official'
    },
    {
      titleExternalId,
      zone,
      label: 'Prime Video Search',
      url: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`,
      region: 'US',
      linkType: 'official'
    },
    {
      titleExternalId,
      zone,
      label: 'JustWatch Search (IN)',
      url: `https://www.justwatch.com/in/search?q=${q}`,
      region: 'IN',
      linkType: 'external'
    },
    {
      titleExternalId,
      zone,
      label: 'JustWatch Search (US)',
      url: `https://www.justwatch.com/us/search?q=${q}`,
      region: 'US',
      linkType: 'external'
    }
  ];
}

export function buildGameLinks({ titleExternalId, zone, title, gameUrl }) {
  const q = encodeQ(title);
  return [
    {
      titleExternalId,
      zone,
      label: 'Official Game Page',
      url: gameUrl,
      region: 'IN',
      linkType: 'official'
    },
    {
      titleExternalId,
      zone,
      label: 'Official Game Page',
      url: gameUrl,
      region: 'US',
      linkType: 'official'
    },
    {
      titleExternalId,
      zone,
      label: 'Scripted Search (IN)',
      url: `https://duckduckgo.com/?q=${q}+play+online+india`,
      region: 'IN',
      linkType: 'external'
    },
    {
      titleExternalId,
      zone,
      label: 'Scripted Search (US)',
      url: `https://duckduckgo.com/?q=${q}+play+online+usa`,
      region: 'US',
      linkType: 'external'
    }
  ];
}
