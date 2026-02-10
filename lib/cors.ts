import { NextResponse } from "next/server";

export function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*"); // or specific domain
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-api-signature"
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  return res;
}
