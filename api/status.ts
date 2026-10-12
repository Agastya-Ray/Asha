// GET /api/status -> which services are switched on (no secrets are shown). Handy for checking setup.
import { CORS } from "./_shared";

export function GET() {
  const on = (k: string) => Boolean(process.env[k]);
  return new Response(
    JSON.stringify({
      ok: true,
      chat: { xai: on("XAI_API_KEY"), gemini: on("GEMINI_API_KEY") },
      voice: { xai: on("XAI_API_KEY"), google: on("GOOGLE_TTS_API_KEY"), phone: true },
      appKeyRequired: on("ASHA_APP_KEY"),
    }),
    { headers: { "content-type": "application/json", ...CORS } },
  );
}
