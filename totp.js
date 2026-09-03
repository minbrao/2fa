const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeSecret(value) {
  const input = value.trim();
  if (!input) return "";

  if (input.toLowerCase().startsWith("otpauth://")) {
    try {
      const parsed = new URL(input);
      const algorithm = (parsed.searchParams.get("algorithm") || "SHA1").replace(/-/g, "").toUpperCase();
      const digits = parsed.searchParams.get("digits") || "6";
      const period = parsed.searchParams.get("period") || "30";

      if (algorithm !== "SHA1" || digits !== "6" || period !== "30") {
        throw new Error("Liên kết dùng cấu hình TOTP chưa được hỗ trợ (cần SHA-1, 6 số, 30 giây).");
      }

      const secret = parsed.searchParams.get("secret");
      if (!secret) throw new Error("Liên kết otpauth không có secret.");
      return secret.replace(/[\s-]/g, "").toUpperCase();
    } catch {
      throw new Error("Liên kết otpauth không hợp lệ hoặc không được hỗ trợ.");
    }
  }

  return input.replace(/[\s-]/g, "").replace(/=+$/g, "").toUpperCase();
}

export function decodeBase32(value) {
  const normalized = normalizeSecret(value);
  if (!normalized) throw new Error("Hãy nhập khóa 2FA.");
  if (!/^[A-Z2-7]+$/.test(normalized)) {
    throw new Error("Khóa chỉ được chứa chữ A–Z và số 2–7.");
  }

  let bits = 0;
  let buffer = 0;
  const output = [];

  for (const character of normalized) {
    buffer = (buffer << 5) | BASE32_ALPHABET.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >>> bits) & 0xff);
    }
  }

  if (!output.length) throw new Error("Khóa 2FA quá ngắn.");
  return new Uint8Array(output);
}

export async function generateTotp(secret, timestamp = Date.now(), digits = 6, period = 30) {
  const keyBytes = decodeBase32(secret);
  const counter = Math.floor(timestamp / 1000 / period);
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  return String(binary % 10 ** digits).padStart(digits, "0");
}
