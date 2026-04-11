/** Mirrors server defaultProfile — social list trimmed to platforms with usable developer/public APIs. */
export function emptyProfile() {
  return {
    displayName: '',
    email: '',
    bio: '',
    heightCm: '',
    weightKg: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    city: '',
    country: '',
    timezone: '',
    website: '',
    instagram: '',
    linkedin: '',
    github: '',
    youtube: '',
  };
}
