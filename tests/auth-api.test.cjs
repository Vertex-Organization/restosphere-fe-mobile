const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('API login uses email, loads real identity, rejects web roles and revokes logout', async () => {
  const code = ts.transpileModule(fs.readFileSync('src/features/auth/api.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const api = {};
  new Function('exports', code)(api);
  const original = global.fetch;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example/api/v1';
  const calls = [];
  let role = 'WAITER';
  global.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url.endsWith('/login')) return Response.json({ accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 });
    if (url.endsWith('/me')) return Response.json({ id: 'real-id', email: 'staff@example.com', fullName: 'Staff', role });
    return new Response(null, { status: 204 });
  };
  try {
    const staff = await api.signIn(' staff@example.com ', 'secret');
    assert.equal(staff.id, 'real-id');
    assert.deepEqual(JSON.parse(calls[0].body), { email: 'staff@example.com', password: 'secret' });
    assert.equal(calls[1].headers.Authorization, 'Bearer access');
    await api.signOut();
    assert.equal(calls.at(-1).url, 'https://api.example/api/v1/auth/logout');
    role = 'ADMIN';
    await assert.rejects(api.signIn('staff@example.com', 'secret'), /web/);
    assert.equal(calls.at(-1).url.endsWith('/logout'), true);
    global.fetch = async () => new Response(null, { status: 401 });
    await assert.rejects(api.signIn('staff@example.com', 'wrong'), /Email hoặc mật khẩu/);
    global.fetch = async () => { throw new TypeError('offline'); };
    await assert.rejects(api.signIn('staff@example.com', 'secret'), /kết nối/);
  } finally { global.fetch = original; }
});
