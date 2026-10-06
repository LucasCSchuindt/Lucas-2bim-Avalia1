import { gerarDesenho } from "../../lib/desenho.js";

const json = (obj, status) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export async function onRequest({ request, env }) {
  // 1) Método (405)
  if (request.method !== "POST") {
    return new Response("Método não permitido", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  // 2) Corpo (400)
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return json({ erro: "Corpo ausente ou JSON inválido" }, 400);
  }
  const numero = corpo && corpo.numero;
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return json({ erro: "numero deve ser um inteiro entre 1 e 100" }, 400);
  }

  // 3) Token (401)
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return json({ erro: "Token ausente" }, 401);
  const token = m[1].trim();

  let info;
  try {
    const r = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" +
        encodeURIComponent(token)
    );
    if (r.status !== 200) return json({ erro: "Token inválido" }, 401);
    info = await r.json();
  } catch {
    return json({ erro: "Falha ao validar o token" }, 401);
  }

  if (!env.GOOGLE_CLIENT_ID || info.aud !== env.GOOGLE_CLIENT_ID) {
    return json({ erro: "Token emitido para outro cliente" }, 401);
  }
  if (String(info.email_verified) !== "true" || !info.email) {
    return json({ erro: "E-mail não verificado" }, 401);
  }

  // 4) Sucesso (200): assinado com o e-mail do token
  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, {
    status: 200,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}
