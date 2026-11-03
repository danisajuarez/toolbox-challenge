/**
 * Decodes a JWT (JSON Web Signature compact serialization) into its parts.
 *
 * This function ONLY decodes. It does not verify the signature, the
 * expiration, the issuer, or any other claim. Use it to inspect a token,
 * never to decide whether to trust it.
 */

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** Raw third segment, still base64url-encoded. Not verified. */
  signature: string;
}

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/;

export function decodeJwt(token: string): DecodedJwt {
  const segments = token.split(".");

  if (segments.length !== 3) {
    throw new Error(
      `Invalid JWT: expected 3 dot-separated segments, got ${segments.length}`,
    );
  }

  const [header, payload, signature] = segments;

  return {
    header: decodeJsonSegment(header, "header"),
    payload: decodeJsonSegment(payload, "payload"),
    signature,
  };
}

function decodeJsonSegment(
  segment: string,
  name: "header" | "payload",
): Record<string, unknown> {
  if (!BASE64URL_PATTERN.test(segment)) {
    throw new Error(`Invalid JWT: ${name} is not base64url-encoded`);
  }

  // JWT uses base64url (RFC 4648 §5): '-' and '_' instead of '+' and '/',
  // and no '=' padding. Node's Buffer handles that alphabet natively.
  const json = Buffer.from(segment, "base64url").toString("utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Invalid JWT: ${name} is not valid JSON`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid JWT: ${name} must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}
