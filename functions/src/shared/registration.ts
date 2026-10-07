export interface RegistrationMarkers {
  onboardingComplete?: unknown;
  createdAt?: unknown;
  consent?: { acceptedAt?: unknown };
}

export function hasCompletedRegistration(profile: RegistrationMarkers | undefined): boolean {
  return profile?.onboardingComplete === true && Boolean(profile.createdAt) && Boolean(profile.consent?.acceptedAt);
}
