// ZhipuAI requires a JWT signed with the API Secret for authentication.
// Usually this is done on the backend, but we do it here to make the demo standalone.

export const generateToken = async (apiKey: string): Promise<string> => {
  try {
    const [id, secret] = apiKey.split(".");
    if (!id || !secret) throw new Error("Invalid API Key format");

    const now = Date.now();
    const exp = now + 3600 * 1000; // 1 hour expiration

    const header = {
      alg: "HS256",
      sign_type: "SIGN",
    };

    const payload = {
      api_key: id,
      timestamp: now,
      exp: exp,
    };

    // Helper to base64url encode
    const base64UrlEncode = (str: string) => {
      return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const tokenPart = `${encodedHeader}.${encodedPayload}`;

    // Sign using Web Crypto API
    const textEncoder = new TextEncoder();
    const keyData = textEncoder.encode(secret);
    const dataToSign = textEncoder.encode(tokenPart);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign("HMAC", key, dataToSign);
    
    // Convert signature to base64url
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return `${tokenPart}.${signatureBase64}`;
  } catch (e) {
    console.error("Token generation failed", e);
    throw new Error("Failed to generate authentication token");
  }
};
