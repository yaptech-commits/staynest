export type OnboardingRole = "guest" | "partner";

export type OnboardingIntent = {
  role: OnboardingRole;
  fullName: string;
  email: string;
  businessName?: string;
  createdAt: number;
};

export function isValidOnboardingEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function onboardingDestination(role: OnboardingRole) {
  return role === "partner" ? "/hotel-dashboard?onboarding=complete" : "/account?onboarding=complete";
}

export function onboardingNavigationTarget(destination: string, currentPath: string, currentSearch = "") {
  const target = new URL(destination, "https://staynest.local");
  const current = `${currentPath}${currentSearch}`;
  const next = `${target.pathname}${target.search}`;
  return current === next ? null : next;
}

export function verificationPromptEmail(status: string | null | undefined, email: string | null | undefined) {
  return status === "verified" || !email ? undefined : email;
}

export function parseOnboardingIntent(rawIntent: string | null): OnboardingIntent | null {
  if (!rawIntent) return null;
  try {
    const parsed = JSON.parse(rawIntent) as Partial<OnboardingIntent>;
    if ((parsed.role !== "guest" && parsed.role !== "partner") || typeof parsed.fullName !== "string" || typeof parsed.email !== "string") return null;
    return parsed as OnboardingIntent;
  } catch {
    return null;
  }
}

export async function completeOnboardingIntent(input: {
  rawIntent: string | null;
  save: (intent: Omit<OnboardingIntent, "createdAt">) => Promise<unknown>;
  clear: () => void;
  redirect: (destination: string) => void;
}) {
  const intent = parseOnboardingIntent(input.rawIntent);
  if (!intent) {
    if (input.rawIntent) input.clear();
    return false;
  }

  await input.save({
    role: intent.role,
    fullName: intent.fullName,
    email: intent.email,
    businessName: intent.businessName,
  });
  input.clear();
  input.redirect(onboardingDestination(intent.role));
  return true;
}

export function createOnboardingIntent(input: {
  role: OnboardingRole;
  fullName: string;
  email: string;
  businessName?: string;
  now?: number;
}): OnboardingIntent {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const businessName = input.businessName?.trim();

  if (fullName.length < 2) {
    throw new Error("Please enter your full name.");
  }

  if (!isValidOnboardingEmail(email)) {
    throw new Error("Please enter a valid email address.");
  }

  if (input.role === "partner" && (!businessName || businessName.length < 2)) {
    throw new Error("Please enter your hotel or business name.");
  }

  return {
    role: input.role,
    fullName,
    email,
    ...(businessName ? { businessName } : {}),
    createdAt: input.now ?? Date.now(),
  };
}
