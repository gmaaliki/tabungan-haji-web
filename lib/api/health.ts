import { HEALTH_URL, readJson } from "./client";

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) return false;
    const json = await readJson(res);
    return json?.status === "ok";
  } catch {
    return false;
  }
}
