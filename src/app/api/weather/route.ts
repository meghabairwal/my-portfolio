export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  if (!city) return Response.json({ error: "missing city" }, { status: 400 });

  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      headers: { "User-Agent": "curl/7.68.0", Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`wttr.in ${res.status}`);
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
