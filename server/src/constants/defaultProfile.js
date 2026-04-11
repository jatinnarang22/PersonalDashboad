/** Shape for GET/PUT /api/profile — keep in sync with User profileSchema & client profileDefaults. */
export const defaultProfile = {
  displayName: '',
  email: '',
  bio: '',
  /** Centimeters */
  heightCm: null,
  /** Kilograms */
  weightKg: null,
  dateOfBirth: '',
  gender: '',
  phone: '',
  city: '',
  country: '',
  timezone: '',
  website: '',
  /** Social: only platforms with realistic free developer / public APIs for stats or automation */
  instagram: '',
  linkedin: '',
  github: '',
  youtube: '',
};
