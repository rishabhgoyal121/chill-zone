import axios from 'axios';

export async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml'
    }
  });
  return response.data;
}
