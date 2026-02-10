// import crypto from "crypto";

// export function verifySignature(body: any, signature: string) {
//   const secret = process.env.API_SHARED_SECRET!;
//   const expected = crypto
//     .createHmac("sha256", secret)
//     .update(JSON.stringify(body))
//     .digest("hex");

//   return crypto.timingSafeEqual(
//     Buffer.from(signature),
//     Buffer.from(expected)
//   );
// }


import crypto from "crypto";

export function verifySignature(body: any, signature: string) {
  if (!signature || signature.length !== 64) {
    return false;
  }

  const secret = process.env.API_SHARED_SECRET!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );
}
