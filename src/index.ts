import { EmailMessage } from 'cloudflare:email';

type SendEmailBinding = {
  send(message: EmailMessage): Promise<void>;
};

export interface Env {
  SENDMAIL_API_KEY: string;
  FROM_ADDRESS: string;
  TO_ADDRESS: string;
  EMAIL: SendEmailBinding;
}

type SendMailPayload = {
  subject: string;
  body: string;
};

const jsonResponse = (status: number, data: Record<string, unknown>): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const sanitizeHeader = (value: string): string =>
  value.replace(/[\r\n]+/g, ' ').trim();

const buildRawEmail = (from: string, to: string, { subject, body }: SendMailPayload): string => {
  const safeSubject = sanitizeHeader(subject);
  const safeFrom = sanitizeHeader(from);
  const safeTo = sanitizeHeader(to);

  return [
    `From: ${safeFrom}`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ].join('\r\n');
};

const isAuthorized = (request: Request, env: Env): boolean => {
  const authHeader = request.headers.get('Authorization');
  const expected = `Bearer ${env.SENDMAIL_API_KEY}`;
  return authHeader === expected;
};

const parsePayload = async (request: Request): Promise<SendMailPayload | null> => {
  try {
    const data = (await request.json()) as Partial<SendMailPayload>;
    if (typeof data.subject !== 'string' || typeof data.body !== 'string') {
      return null;
    }
    const subject = data.subject.trim();
    const body = data.body.trim();

    if (!subject || !body) {
      return null;
    }

    return { subject, body };
  }
  catch {
    return null;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method Not Allowed' });
    }

    if (!isAuthorized(request, env)) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const payload = await parsePayload(request);
    if (!payload) {
      return jsonResponse(400, { error: 'Invalid subject or body' });
    }

    const raw = buildRawEmail(env.FROM_ADDRESS, env.TO_ADDRESS, payload);
    const message = new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw);

    try {
      await env.EMAIL.send(message);
      return jsonResponse(200, { ok: true });
    }
    catch (error) {
      console.error('Failed to send email', error);
      return jsonResponse(502, { error: 'Failed to send email' });
    }
  },
};
