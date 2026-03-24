export async function GET() {
  try {
    const res = await fetch(
      "https://data.cityofnewyork.us/api/geospatial/7t3b-ywvw?method=export&type=GeoJSON",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`NYC Geo API ${res.status}`);
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
