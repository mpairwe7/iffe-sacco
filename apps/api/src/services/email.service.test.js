import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

let transportOptions;
let sent = [];
let failWith = null;
mock.module("nodemailer", () => ({
  default: {
    createTransport: (opts) => {
      transportOptions = opts;
      return {
        sendMail: async (msg) => {
          if (failWith) throw failWith;
          sent.push(msg);
          return { messageId: "test" };
        },
      };
    },
  },
}));

const { sendEmail } = await import("./email.service.ts");

const message = { to: "staff@example.org", subject: "Hi", text: "plain", html: "<p>html</p>" };
const ENV_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "RESEND_API_KEY"];
const savedEnv = {};
const realFetch = globalThis.fetch;

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  Object.assign(process.env, {
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_USER: "sender@gmail.com",
    SMTP_PASS: "app pass word",
  });
  delete process.env.RESEND_API_KEY;
  transportOptions = undefined;
  sent = [];
  failWith = null;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  globalThis.fetch = realFetch;
});

describe("sendEmail over SMTP", () => {
  it("sends from the SMTP account and requires STARTTLS on port 587", async () => {
    await sendEmail(message);

    expect(transportOptions).toMatchObject({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "sender@gmail.com", pass: "app pass word" },
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "staff@example.org", subject: "Hi", text: "plain", html: "<p>html</p>" });
    expect(sent[0].from).toContain("<sender@gmail.com>");
  });

  it("uses implicit TLS on port 465", async () => {
    process.env.SMTP_PORT = "465";
    await sendEmail(message);
    expect(transportOptions).toMatchObject({ port: 465, secure: true });
  });

  it("takes precedence over Resend when both are configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchSpy = mock(() => Promise.resolve(new Response("{}")));
    globalThis.fetch = fetchSpy;

    await sendEmail(message);

    expect(sent).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws when the SMTP server rejects the message, so callers can log and carry on", async () => {
    failWith = new Error("535 bad credentials");
    await expect(sendEmail(message)).rejects.toThrow(/535/);
  });
});
