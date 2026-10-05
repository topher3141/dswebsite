import { NextResponse } from "next/server";

const MAX_LENGTHS = {
  name: 120,
  phone: 60,
  email: 200,
  role: 100,
  employmentPreference: 60,
  availability: 1200,
  experience: 3000,
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = clean(body.name, MAX_LENGTHS.name);
    const phone = clean(body.phone, MAX_LENGTHS.phone);
    const email = clean(body.email, MAX_LENGTHS.email);
    const role = clean(body.role, MAX_LENGTHS.role);
    const employmentPreference = clean(body.employmentPreference, MAX_LENGTHS.employmentPreference);
    const availability = clean(body.availability, MAX_LENGTHS.availability);
    const experience = clean(body.experience, MAX_LENGTHS.experience);
    const consent = body.consent === "yes";

    if (!name || !phone || !email || !role || !employmentPreference || !availability || !consent) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.JOBS_NOTIFICATION_EMAIL;
    const from = process.env.JOBS_FROM_EMAIL;

    if (!apiKey || !to || !from) {
      console.error("Job interest form email environment variables are not configured.");
      return NextResponse.json(
        { error: "The form is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const html = `
      <h2>New Deals &amp; Steals Job Interest</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Role:</strong> ${escapeHtml(role)}</p>
      <p><strong>Employment preference:</strong> ${escapeHtml(employmentPreference)}</p>
      <p><strong>Availability:</strong><br>${escapeHtml(availability).replaceAll("\n", "<br>")}</p>
      <p><strong>About / Experience:</strong><br>${escapeHtml(experience || "Not provided").replaceAll("\n", "<br>")}</p>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Job Interest: ${role} — ${name}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend job interest email failed:", errorText);
      return NextResponse.json(
        { error: "We could not send your information. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Job interest form error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
