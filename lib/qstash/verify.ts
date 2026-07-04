import { Receiver } from "@upstash/qstash";

function hasQstashKeys() {
  return Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY);
}

function hasCronSecret(req: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && secret.length >= 32 && req.headers.get("authorization") === `Bearer ${secret}`);
}

export async function isTrustedInternalRequest(req: Request) {
  if (hasCronSecret(req)) return true;
  if (!hasQstashKeys()) return false;

  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;

  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
    });
    const body = await req.clone().text();
    await receiver.verify({ signature, body });
    return true;
  } catch {
    return false;
  }
}
