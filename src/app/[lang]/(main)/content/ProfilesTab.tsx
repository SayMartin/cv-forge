"use client";

import { useState } from "react";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useApiError } from "@/i18n/useApiError";
import type { Profile } from "./ContentTabs";
import { ActionChip } from "@/components/ActionChip";

interface Props {
  initialItems: Profile[];
}

const EMPTY_FORM = {
  profileName: "",
  name: "",
  headline: "",
  bio: "",
  email: "",
  phone: "",
  location: "",
  nationality: "",
  dateOfBirth: "",
  drivingLicense: "",
  linkedin: "",
  github: "",
  website: "",
  portfolio: "",
};

type FormState = typeof EMPTY_FORM;

function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  submitLabel: string;
  onSubmit: (data: FormState) => Promise<void>;
  onCancel: () => void;
}) {
  const { form: t, profiles: d } = useDictionary().content;
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={d.fields.profileName.label} value={form.profileName} onChange={(v) => set("profileName", v)} placeholder={d.fields.profileName.placeholder} required />
        <Field label={d.fields.name.label} value={form.name} onChange={(v) => set("name", v)} placeholder={d.fields.name.placeholder} required />
        <Field label={d.fields.headline.label} value={form.headline} onChange={(v) => set("headline", v)} placeholder={d.fields.headline.placeholder} />
        <Field label={d.fields.email.label} value={form.email} onChange={(v) => set("email", v)} type="email" placeholder={d.fields.email.placeholder} />
        <Field label={d.fields.phone.label} value={form.phone} onChange={(v) => set("phone", v)} placeholder={d.fields.phone.placeholder} />
        <Field label={d.fields.location.label} value={form.location} onChange={(v) => set("location", v)} placeholder={d.fields.location.placeholder} />
      </div>
      <Field label={d.fields.bio.label} value={form.bio} onChange={(v) => set("bio", v)} multiline placeholder={d.fields.bio.placeholder} />
      <p className="text-sm font-medium text-(--cl-muted) uppercase tracking-wider pt-1">{d.europass}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label={d.fields.nationality.label} value={form.nationality} onChange={(v) => set("nationality", v)} placeholder={d.fields.nationality.placeholder} />
        <Field label={d.fields.dateOfBirth.label} value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} type="date" />
        <Field label={d.fields.drivingLicense.label} value={form.drivingLicense} onChange={(v) => set("drivingLicense", v)} placeholder={d.fields.drivingLicense.placeholder} />
      </div>
      <p className="text-sm font-medium text-(--cl-muted) uppercase tracking-wider pt-1">{d.social}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label={d.fields.linkedin.label} value={form.linkedin} onChange={(v) => set("linkedin", v)} placeholder={d.fields.linkedin.placeholder} />
        <Field label={d.fields.github.label} value={form.github} onChange={(v) => set("github", v)} placeholder={d.fields.github.placeholder} />
        <Field label={d.fields.website.label} value={form.website} onChange={(v) => set("website", v)} placeholder={d.fields.website.placeholder} />
        <Field label={d.fields.portfolio.label} value={form.portfolio} onChange={(v) => set("portfolio", v)} placeholder={d.fields.portfolio.placeholder} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-(--cl-accent) text-white rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors">
          {saving ? t.saving : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-(--cl-border) px-4 py-1.5 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors">
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

export function ProfilesTab({ initialItems }: Props) {
  const { form: t, profiles: d } = useDictionary().content;
  const apiError = useApiError();
  const [items, setItems] = useState<Profile[]>(initialItems);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(form: FormState) {
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileName: form.profileName,
        name: form.name,
        headline: form.headline,
        bio: form.bio,
        email: form.email,
        phone: form.phone,
        location: form.location,
        nationality: form.nationality,
        dateOfBirth: form.dateOfBirth,
        drivingLicense: form.drivingLicense,
        social: { linkedin: form.linkedin, github: form.github, website: form.website, portfolio: form.portfolio },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(apiError(data, t.createFailed));
    const newItem: Profile = {
      id: data.id,
      profileName: form.profileName,
      name: form.name,
      headline: form.headline || undefined,
      bio: form.bio || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      location: form.location || undefined,
      nationality: form.nationality || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      drivingLicense: form.drivingLicense || undefined,
      social: { linkedin: form.linkedin || undefined, github: form.github || undefined, website: form.website || undefined, portfolio: form.portfolio || undefined },
    };
    setItems((prev) => [...prev, newItem]);
    setCreating(false);
  }

  async function handleUpdate(id: string, form: FormState) {
    const res = await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileName: form.profileName,
        name: form.name,
        headline: form.headline,
        bio: form.bio,
        email: form.email,
        phone: form.phone,
        location: form.location,
        nationality: form.nationality,
        dateOfBirth: form.dateOfBirth,
        drivingLicense: form.drivingLicense,
        social: { linkedin: form.linkedin, github: form.github, website: form.website, portfolio: form.portfolio },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(apiError(data, t.updateFailed));
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, profileName: form.profileName, name: form.name, headline: form.headline || undefined, bio: form.bio || undefined, email: form.email || undefined, phone: form.phone || undefined, location: form.location || undefined, nationality: form.nationality || undefined, dateOfBirth: form.dateOfBirth || undefined, drivingLicense: form.drivingLicense || undefined, social: { linkedin: form.linkedin || undefined, github: form.github || undefined, website: form.website || undefined, portfolio: form.portfolio || undefined } }
          : item
      )
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(d.confirmDelete)) return;
    const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    if (!res.ok) { setError(t.deleteFailed); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function itemToForm(item: Profile): FormState {
    return {
      profileName: item.profileName ?? "",
      name: item.name ?? "",
      headline: item.headline ?? "",
      bio: item.bio ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      location: item.location ?? "",
      nationality: item.nationality ?? "",
      dateOfBirth: item.dateOfBirth ?? "",
      drivingLicense: item.drivingLicense ?? "",
      linkedin: item.social?.linkedin ?? "",
      github: item.social?.github ?? "",
      website: item.social?.website ?? "",
      portfolio: item.social?.portfolio ?? "",
    };
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-(--cl-border) px-4 py-2 text-sm text-(--cl-muted) hover:border-(--cl-accent) hover:text-(--cl-accent) transition-colors"
        >
          {d.add}
        </button>
      ) : (
        <div className="bg-white border border-(--cl-accent) rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-(--cl-text) mb-4">{d.new}</p>
          <ProfileForm initial={EMPTY_FORM} submitLabel={d.create} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !creating && (
        <p className="text-sm text-(--cl-muted)">{d.empty}</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="bg-white border border-(--cl-border) rounded-xl px-5 py-4 space-y-3">
          {editingId === item.id ? (
            <>
              <p className="text-sm font-medium text-(--cl-text)">{d.edit}</p>
              <ProfileForm
                initial={itemToForm(item)}
                submitLabel={t.save}
                onSubmit={(form) => handleUpdate(item.id, form)}
                onCancel={() => setEditingId(null)}
              />
            </>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-(--cl-text)">{item.profileName}</p>
                {item.name && <p className="text-sm text-(--cl-muted) mt-0.5">{item.name}{item.headline ? ` — ${item.headline}` : ""}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ActionChip onClick={() => setEditingId(item.id)}>{t.edit}</ActionChip>
                <ActionChip tone="danger" onClick={() => handleDelete(item.id)}>{t.delete}</ActionChip>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const cls = "w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-(--cl-text)">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={cls} />
      )}
    </div>
  );
}
