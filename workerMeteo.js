export default {
  async fetch(request) {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    if (!lat || !lng) {
      return new Response('missing lat/lng', { status: 400 });
    }

    const upstream = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,weather_code,windspeed_10m&temperature_unit=celsius&timezone=auto`;

    const res = await fetch(upstream, {
      headers: { 'User-Agent': 'AthanLab-Weather-Proxy' },
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=300'
      }
    });
  }
};
