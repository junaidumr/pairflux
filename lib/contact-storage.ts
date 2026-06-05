export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: number;
}

const STORAGE_KEY = "peerbeam-contact-submissions";

export function saveContactSubmission(
  data: Omit<ContactSubmission, "id" | "createdAt">
): ContactSubmission {
  const entry: ContactSubmission = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  if (typeof window === "undefined") return entry;

  const existing = getContactSubmissions();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing].slice(0, 50)));
  return entry;
}

export function getContactSubmissions(): ContactSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContactSubmission[];
  } catch {
    return [];
  }
}

export function validateContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Partial<Record<keyof typeof data, string>> {
  const errors: Partial<Record<keyof typeof data, string>> = {};

  if (!data.name.trim()) errors.name = "Name is required";
  else if (data.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!data.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = "Enter a valid email address";

  if (!data.subject.trim()) errors.subject = "Subject is required";
  else if (data.subject.trim().length < 3)
    errors.subject = "Subject must be at least 3 characters";

  if (!data.message.trim()) errors.message = "Message is required";
  else if (data.message.trim().length < 10)
    errors.message = "Message must be at least 10 characters";

  return errors;
}
