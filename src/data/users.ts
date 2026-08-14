/**
 * Test data lives outside the page objects so the same flow can be replayed
 * with different personas. In a real project this file would read from a
 * secrets manager / CI variables — never hardcoded credentials.
 */
const password = process.env.TEST_PASSWORD ?? 'secret_sauce';

export interface TestUser {
  readonly username: string;
  readonly password: string;
  readonly label: string;
}

export const users = {
  standard: { username: 'standard_user', password, label: 'standard user' },
  lockedOut: { username: 'locked_out_user', password, label: 'locked out user' },
  problem: { username: 'problem_user', password, label: 'problem user' },
  glitch: { username: 'performance_glitch_user', password, label: 'slow user' },
} as const satisfies Record<string, TestUser>;

/** Negative-path credentials for data-driven validation tests. */
export const invalidLogins: ReadonlyArray<{
  username: string;
  password: string;
  scenario: string;
  expectedError: string;
}> = [
  {
    scenario: 'unknown username',
    username: 'not_a_real_user',
    password,
    expectedError: 'Username and password do not match any user in this service',
  },
  {
    scenario: 'wrong password',
    username: users.standard.username,
    password: 'wrong_password',
    expectedError: 'Username and password do not match any user in this service',
  },
  {
    scenario: 'missing password',
    username: users.standard.username,
    password: '',
    expectedError: 'Password is required',
  },
  {
    scenario: 'missing username',
    username: '',
    password,
    expectedError: 'Username is required',
  },
];
