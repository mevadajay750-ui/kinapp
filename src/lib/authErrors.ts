const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'That email already has an account. Try signing in instead.',
  'auth/invalid-email': "That email doesn't look right. Mind checking it?",
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/user-not-found': "We couldn't find an account with that email.",
  'auth/wrong-password':
    "That password doesn't match. Try again, or reset it below.",
  'auth/invalid-credential':
    "That email and password don't match. Try again, or reset your password below.",
  'auth/too-many-requests': 'Too many attempts. Take a short break and try again.',
  'auth/network-request-failed':
    "Couldn't reach the network. Check your connection.",
  'auth/user-disabled': 'This account has been disabled.',
  'auth/missing-password': 'Add a password to continue.',
  'auth/operation-not-allowed':
    'Email sign-in is not enabled for this app yet.',
  'auth/not-configured': 'The app is not connected yet. Check your setup.',
  'auth/requires-recent-login':
    'For your security, sign in again before deleting your account.',
};

export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as {code: unknown}).code)
      : '';
  return MESSAGES[code] ?? 'Something went wrong. Try again in a moment.';
}
