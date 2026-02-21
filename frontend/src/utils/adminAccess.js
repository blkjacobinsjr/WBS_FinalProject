const ADMIN_EMAIL = "jr.a.schmalz@gmail.com";

export function isAdminEmail(email) {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function hasConfiguredAdminEmails() {
  return true;
}
