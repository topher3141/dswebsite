"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function InterestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/job-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setMessage("Thanks! We received your information and will be in touch if there is a good fit.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400";
  const labelClass = "text-sm font-black text-slate-800";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Name
          <input name="name" type="text" required autoComplete="name" className={fieldClass} />
        </label>
        <label className={labelClass}>
          Phone
          <input name="phone" type="tel" required autoComplete="tel" className={fieldClass} />
        </label>
      </div>

      <label className={labelClass}>
        Email
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          Role you&apos;re interested in
          <select name="role" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select a role</option>
            <option value="Retail Team Member">Retail Team Member</option>
            <option value="E-Commerce Team Member">E-Commerce Team Member</option>
            <option value="Either">Either / Open to both</option>
          </select>
        </label>

        <label className={labelClass}>
          Employment preference
          <select name="employmentPreference" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select one</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Either">Either</option>
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Availability
        <textarea
          name="availability"
          required
          rows={3}
          placeholder="Tell us the days and times you are generally available."
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        Tell us a little about yourself
        <textarea
          name="experience"
          rows={4}
          placeholder="Relevant experience, what interests you about the role, or anything else you'd like us to know."
          className={fieldClass}
        />
      </label>

      <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-600">
        <input name="consent" value="yes" type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300" />
        <span>I&apos;m okay with Deals &amp; Steals contacting me about employment opportunities.</span>
      </label>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center rounded-full bg-pink-600 px-6 py-3.5 font-black text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Send My Information"}
      </button>

      {message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-bold ${
            status === "success" ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
