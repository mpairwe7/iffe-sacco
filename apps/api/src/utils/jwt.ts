import * as jose from "jose";
import { env } from "../config/env";

const sessionSecret = new TextEncoder().encode(env.JWT_SECRET);

export type SessionTokenPayload = {
  sub: string;
  role: string;
  sid: string;
};

export async function signSessionToken(payload: SessionTokenPayload, expiresAt: Date) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(sessionSecret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jose.jwtVerify(token, sessionSecret);
  return payload as SessionTokenPayload & { exp: number };
}
