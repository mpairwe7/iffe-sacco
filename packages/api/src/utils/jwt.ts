import * as jose from "jose";
import { env } from "../config/env";

const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export async function signAccessToken(payload: { sub: string; role: string }) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);
}

export async function signRefreshToken(payload: { sub: string }) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jose.jwtVerify(token, accessSecret);
  return payload as { sub: string; role: string };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jose.jwtVerify(token, refreshSecret);
  return payload as { sub: string };
}
