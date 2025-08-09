export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch('http://localhost:8000/create-crypto-payment/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
