// Supabase Edge Function: send-email  (Auth "Send Email" hook)
// -----------------------------------------------------------------------------
// Replaces Supabase's default auth emails with emails designed for Habit Tracker.
//   recovery  -> "Reset your password" email with a verification CODE   (forgot password)
//   signup    -> "Confirm your email" email with a button
//   invite    -> "You're invited" email with a button
//   magiclink -> "Sign in" email with a button
// Any other type (email_change, reauthentication) is rejected on purpose: the app does not use
// them, and Supabase would otherwise silently stop sending them.
//
// Secrets needed (supabase secrets set ...):
//   SEND_EMAIL_HOOK_SECRET  the "v1,whsec_..." secret shown when you create the hook
//   RESEND_API_KEY          API key from resend.com
//   MAIL_FROM               e.g.  Habit Tracker <no-reply@yourdomain.com>   (domain verified in Resend)
// SUPABASE_URL is provided automatically.
//
// Deploy:  supabase functions deploy send-email --no-verify-jwt
// -----------------------------------------------------------------------------
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const HOOK_SECRET = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace('v1,whsec_', '')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'Habit Tracker <onboarding@resend.dev>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''

// Must match "Email OTP Expiration" in Supabase Auth settings (600 seconds = 10 minutes).
const EXPIRY_MIN = 10
const BRAND = 'Habit Tracker'

// Colors copied from css/app.css so the email looks like the app.
const C = { bg: '#0a0808', card: '#131010', card2: '#1b1616', border: '#2b2222', text: '#f2eeec', muted: '#8d8280', accent: '#e5252a' }

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Shared frame: dark page, centered card, logo, footer. Table layout + inline styles for email clients. */
function layout(opts: { preheader: string; title: string; intro: string; body: string; note: string }) {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
<title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg};">
<tr><td align="center" style="padding:36px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
    <tr><td style="padding:0 4px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="38" height="38" align="center" bgcolor="${C.accent}" style="width:38px;height:38px;border-radius:11px;background:${C.accent};color:#ffffff;font:700 20px/38px -apple-system,'Segoe UI',Arial,sans-serif;">&#10003;</td>
        <td style="padding-left:12px;font:600 12px/1 -apple-system,'Segoe UI',Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${C.muted};">${BRAND}</td>
      </tr></table>
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.border};border-radius:22px;padding:34px 30px 30px;">
      <div style="height:3px;width:44px;background:${C.accent};border-radius:3px;margin-bottom:22px;"></div>
      <h1 style="margin:0 0 10px;font:600 28px/1.2 Georgia,'Times New Roman',serif;color:${C.text};">${opts.title}</h1>
      <p style="margin:0 0 24px;font:15px/1.6 -apple-system,'Segoe UI',Arial,sans-serif;color:${C.muted};">${opts.intro}</p>
      ${opts.body}
      <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid ${C.border};font:13px/1.6 -apple-system,'Segoe UI',Arial,sans-serif;color:${C.muted};">${opts.note}</p>
    </td></tr>
    <tr><td align="center" style="padding:20px 8px 0;font:12px/1.6 -apple-system,'Segoe UI',Arial,sans-serif;color:${C.muted};">
      &#128274; Private by design. Every account has its own tracker.<br>You received this because someone used this address on ${BRAND}.
    </td></tr>
  </table>
</td></tr></table></body></html>`
}

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" bgcolor="${C.accent}" style="border-radius:12px;background:${C.accent};">
  <a href="${esc(href)}" style="display:block;padding:15px 20px;font:600 15px/1 -apple-system,'Segoe UI',Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:12px;">${esc(label)}</a>
  </td></tr></table>`

type Mail = { subject: string; html: string; text: string }

function buildMail(type: string, d: { token: string; token_hash: string; redirect_to: string }, name: string): Mail | null {
  const hi = name ? `Hi ${esc(name)}, ` : ''
  const verifyUrl = `${SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(d.token_hash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(d.redirect_to)}`

  if (type === 'recovery') {
    const code = esc(d.token)
    const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="center" bgcolor="${C.card2}" style="background:${C.card2};border:1px solid ${C.border};border-radius:16px;padding:22px 10px;">
        <div style="font:600 11px/1 -apple-system,'Segoe UI',Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:${C.muted};margin-bottom:12px;">Verification code</div>
        <div style="font:700 40px/1 'SFMono-Regular',Menlo,Consolas,'Courier New',monospace;letter-spacing:.32em;padding-left:.32em;color:${C.text};">${code}</div>
        <div style="margin-top:14px;font:13px/1 -apple-system,'Segoe UI',Arial,sans-serif;color:${C.accent};">Expires in ${EXPIRY_MIN} minutes</div>
      </td></tr></table>`
    return {
      subject: `${d.token} is your ${BRAND} code`,
      html: layout({
        preheader: `Your ${BRAND} verification code is ${d.token}. It expires in ${EXPIRY_MIN} minutes.`,
        title: 'Reset your password',
        intro: `${hi}enter this code in the app to choose a new password.`,
        body,
        note: `Never share this code with anyone. If you didn't ask to reset your password, ignore this email: your password stays the same.`,
      }),
      text: `${BRAND}\n\nYour verification code: ${d.token}\nIt expires in ${EXPIRY_MIN} minutes.\n\nEnter it in the app to choose a new password. Never share this code. If you didn't request it, ignore this email.`,
    }
  }

  const link: Record<string, { subject: string; title: string; intro: string; btn: string; note: string }> = {
    signup: { subject: `Confirm your ${BRAND} account`, title: 'Confirm your email', intro: `${hi}one tap to confirm your email and request access to your private tracker.`, btn: 'Confirm email', note: `If you didn't create an account, you can safely ignore this email.` },
    invite: { subject: `You're invited to ${BRAND}`, title: `You're invited`, intro: `${hi}you now have a private tracker waiting for you. Set your password to get started.`, btn: 'Set my password', note: `If you weren't expecting this invitation, you can safely ignore this email.` },
    magiclink: { subject: `Your ${BRAND} sign-in link`, title: 'Sign in', intro: `${hi}tap the button to sign in. The link works once.`, btn: 'Sign in', note: `If you didn't request this, you can safely ignore this email.` },
  }
  const t = link[type]
  if (!t) return null
  return {
    subject: t.subject,
    html: layout({ preheader: t.intro.replace(/<[^>]+>/g, ''), title: t.title, intro: t.intro, body: button(verifyUrl, t.btn), note: t.note }),
    text: `${t.title}\n\n${t.btn}: ${verifyUrl}\n\n${t.note}`,
  }
}

const reply = (status: number, error?: string) =>
  new Response(JSON.stringify(error ? { error: { http_code: status, message: error } } : {}), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'Method not allowed')
  const payload = await req.text()

  let event: any
  try {
    event = new Webhook(HOOK_SECRET).verify(payload, Object.fromEntries(req.headers))
  } catch {
    return reply(401, 'Invalid signature')
  }

  const { user, email_data } = event
  const name = String(user?.user_metadata?.name ?? '').slice(0, 60)
  const mail = buildMail(email_data.email_action_type, email_data, name)
  if (!mail) return reply(400, `Email type "${email_data.email_action_type}" is not supported`)

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [user.email], subject: mail.subject, html: mail.html, text: mail.text }),
  })
  if (!r.ok) {
    console.error('Resend error', r.status, await r.text())
    return reply(502, 'Could not send the email')
  }
  return reply(200)
})
