import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decodeJwt } from "./decode-jwt.ts";

// Token given in the challenge statement.
const CHALLENGE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes the header and payload of the challenge token", () => {
    const decoded = decodeJwt(CHALLENGE_TOKEN);

    assert.deepEqual(decoded.header, { alg: "HS256", typ: "JWT" });
    assert.deepEqual(decoded.payload, {
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
    assert.equal(decoded.signature, "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
  });

  it("rejects a token that does not have exactly 3 segments", () => {
    assert.throws(
      () => decodeJwt("only.two"),
      /expected 3 dot-separated segments, got 2/,
    );
  });

  it("rejects a segment with characters outside the base64url alphabet", () => {
    const [header, , signature] = CHALLENGE_TOKEN.split(".");
    assert.throws(
      () => decodeJwt(`${header}.not+base64url/.${signature}`),
      /payload is not base64url-encoded/,
    );
  });

  it("rejects a segment that decodes to something other than a JSON object", () => {
    const [header, , signature] = CHALLENGE_TOKEN.split(".");
    const notAnObject = Buffer.from('"just a string"').toString("base64url");
    assert.throws(
      () => decodeJwt(`${header}.${notAnObject}.${signature}`),
      /payload must be a JSON object/,
    );
  });
});
