import assert from "node:assert/strict";
import { decodeBase32, generateTotp, normalizeSecret } from "./totp.js";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const vectors = [
  [59_000, "94287082"],
  [1_111_111_109_000, "07081804"],
  [1_111_111_111_000, "14050471"],
  [1_234_567_890_000, "89005924"],
  [2_000_000_000_000, "69279037"],
  [20_000_000_000_000, "65353130"],
];

assert.equal(normalizeSecret("jbsw y3dp-ehpk3pxp"), "JBSWY3DPEHPK3PXP");
assert.equal(normalizeSecret("otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP"), "JBSWY3DPEHPK3PXP");
assert.equal(new TextDecoder().decode(decodeBase32(secret)), "12345678901234567890");

for (const [timestamp, expected] of vectors) {
  assert.equal(await generateTotp(secret, timestamp, 8), expected);
}

console.log("Tất cả kiểm thử RFC 6238 đều đạt.");
