/**
 * Passkey (WebAuthn) service.
 *
 * Uses @simplewebauthn/server for the crypto-heavy parts (challenge
 * generation, attestation verification, signature verification). This
 * module stores credentials, manages one-shot challenges, and handles
 * the lookup-by-credential-id dance for usernameless login.
 *
 * Flow:
 *   - Registration: generateRegistrationOptions() → challenge stored
 *     with user id → client calls navigator.credentials.create() →
 *     server verifyRegistration() → Passkey row created.
 *   - Authentication: generateAuthenticationOptions() with an empty
 *     allowCredentials for usernameless flow → client selects a
 *     resident key → server looks up by credentialId → verifySig →
 *     issues a Session just like password login would.
 */
// @ts-nocheck
import { prisma } from "../config/db";
import { env } from "../config/env";
import { HTTPException } from "hono/http-exception";
import { signSessionToken } from "../utils/jwt";
import { getSessionExpiryDate } from "../utils/session";
import { logger } from "../utils/logger";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function rpConfig() {
  // Relying Party — must be a public suffix list registered domain in prod.
  // Use the CORS-configured origin as the RP ID (eTLD+1 in production).
  const origin = env.APP_BASE_URL;
  const hostname = new URL(origin).hostname;
  return {
    rpName: "IFFE SACCO",
    rpID: hostname,
    origin,
  };
}

async function loadSimpleWebAuthn() {
  try {
    const mod = await import("@simplewebauthn/server");
    return mod;
  } catch (err) {
    throw new Error("@simplewebauthn/server is not installed — run `bun install` to enable passkeys");
  }
}

async function storeChallenge(params: { challenge: string; userId?: string; kind: string }) {
  await prisma.webAuthnChallenge.create({
    data: {
      challenge: params.challenge,
      userId: params.userId,
      kind: params.kind,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });
}

async function consumeChallenge(challenge: string, kind: string) {
  const row = await prisma.webAuthnChallenge.findUnique({ where: { challenge } });
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt < new Date()) {
    throw new HTTPException(400, { message: "Challenge expired or invalid" });
  }
  await prisma.webAuthnChallenge.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row;
}

export class PasskeyService {
  async generateRegistrationOptions(userId: string) {
    const lib = await loadSimpleWebAuthn();
    const { rpName, rpID } = rpConfig();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, passkeys: true },
    });
    if (!user) throw new HTTPException(404, { message: "User not found" });

    const options = await lib.generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials:
        (user as any).passkeys?.map((p: any) => ({
          id: p.credentialId,
          transports: p.transports,
        })) ?? [],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    await storeChallenge({ challenge: options.challenge, userId, kind: "registration" });
    return options;
  }

  async verifyRegistration(userId: string, response: any, nickname?: string) {
    const lib = await loadSimpleWebAuthn();
    const { rpID, origin } = rpConfig();

    const expectedChallenge = response.response?.clientDataJSON
      ? JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8")).challenge
      : null;
    if (!expectedChallenge) throw new HTTPException(400, { message: "Malformed response" });

    await consumeChallenge(expectedChallenge, "registration");

    const verification = await lib.verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new HTTPException(400, { message: "Passkey verification failed" });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response?.transports ?? [],
        nickname: nickname ?? null,
      },
    });

    logger.info({ event: "passkey.registered", userId, nickname }, "passkey registered");
    return { verified: true };
  }

  async generateAuthenticationOptions(email?: string) {
    const lib = await loadSimpleWebAuthn();
    const { rpID } = rpConfig();

    let userId: string | undefined;
    let allowCredentials: Array<{ id: string; transports?: any[] }> = [];

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { passkeys: { select: { credentialId: true, transports: true } } },
      });
      if (user) {
        userId = user.id;
        allowCredentials = user.passkeys.map((p) => ({ id: p.credentialId, transports: p.transports }));
      }
    }

    const options = await lib.generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    await storeChallenge({ challenge: options.challenge, userId, kind: "authentication" });
    return options;
  }

  async verifyAuthentication(response: any) {
    const lib = await loadSimpleWebAuthn();
    const { rpID, origin } = rpConfig();

    const credentialId = response.id;
    if (!credentialId) throw new HTTPException(400, { message: "Missing credential id" });

    const passkey = await prisma.passkey.findUnique({
      where: { credentialId },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });
    if (!passkey || !passkey.user.isActive) {
      throw new HTTPException(401, { message: "Unknown passkey" });
    }

    const expectedChallenge = response.response?.clientDataJSON
      ? JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8")).challenge
      : null;
    if (!expectedChallenge) throw new HTTPException(400, { message: "Malformed response" });

    await consumeChallenge(expectedChallenge, "authentication");

    const verification = await lib.verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as any,
      },
    });

    if (!verification.verified) {
      throw new HTTPException(401, { message: "Passkey verification failed" });
    }

    // Update counter + last used
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    // Issue a session the same way a password login would.
    const expiresAt = getSessionExpiryDate(false);
    const session = await prisma.session.create({
      data: {
        userId: passkey.user.id,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
    const sessionToken = await signSessionToken(
      { sub: passkey.user.id, role: passkey.user.role, sid: session.id },
      expiresAt,
    );

    logger.info({ event: "passkey.login", userId: passkey.user.id }, "passkey login successful");
    return { sessionToken, expiresAt, sessionId: session.id, userId: passkey.user.id };
  }

  async list(userId: string) {
    return prisma.passkey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nickname: true,
        deviceType: true,
        backedUp: true,
        transports: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  async remove(userId: string, passkeyId: string) {
    const { count } = await prisma.passkey.deleteMany({ where: { id: passkeyId, userId } });
    if (count === 0) throw new HTTPException(404, { message: "Passkey not found" });
  }
}

export const passkeyService = new PasskeyService();
