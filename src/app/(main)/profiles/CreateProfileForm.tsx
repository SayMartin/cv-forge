"use client";

import { useState } from "react";

export function CreateProfileForm() {
  const [profileName, setProfileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileName.trim()) return;

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileName: profileName.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create profile");
      setSubmitting(false);
      return;
    }

    // Redirect to Studio to fill in the profile content
    const studioBase = process.env.NEXT_PUBLIC_STUDIO_URL ?? "/studio";
    window.location.href = `${studioBase}/structure/profile;${data._id}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={profileName}
        onChange={(e) => setProfileName(e.target.value)}
        placeholder='e.g. "Frontend Developer" or "Senior Engineer"'
        className="flex-1 border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
        required
      />
      <button
        type="submit"
        disabled={submitting || !profileName.trim()}
        className="bg-(--cl-accent) text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors whitespace-nowrap"
      >
        {submitting ? "Creating…" : "New Profile"}
      </button>
      {error && <p className="text-sm text-red-600 self-center">{error}</p>}
    </form>
  );
}
