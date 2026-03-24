export async function GET() {
  try {
    const url =
      "https://data.cityofnewyork.us/resource/erm2-nwe9.json" +
      "?$limit=10000&$where=latitude%20IS%20NOT%20NULL&$order=created_date%20DESC" +
      "&$select=latitude,longitude,complaint_type,created_date,borough,descriptor";

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) throw new Error(`NYC API ${res.status}`);
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
