import { decodeJwt } from "./decode-jwt.ts";

const token = process.argv[2];

if (!token) {
  console.error("Usage: node src/cli.ts <jwt>");
  process.exit(1);
}

try {
  console.log(JSON.stringify(decodeJwt(token), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
