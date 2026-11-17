const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, name => dependencies[name]);
  return exports;
}

test('staff API shares auth, sends commands unchanged, adapts reads and rejects server errors without fallback', async () => {
  const auth = load('src/features/auth/api.ts');
  const api = load('src/store/workspace-api.ts', { '../features/auth/api': auth });
  const original = global.fetch;
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example/api/v1';
  const data = { settings: { bufferMinutes: 15, noShowMinutes: 30 } };
  for (const key of ['areas', 'tables', 'reservations', 'notifications', 'assignments', 'employees', 'tableSessions', 'menuCategories', 'menuItems', 'orders', 'orderItems', 'drafts', 'bills', 'waiterNotifications', 'requests', 'outbox']) data[key] = [];
  data.reservations = [{ id: 'reservation-uuid', notes: null }];
  data.notifications = [{ id: 'notification-uuid', targetId: 'reservation-uuid', readBy: ['staff-uuid'] }];
  const calls = [];
  let status = 200;
  global.fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url.endsWith('/login')) return Response.json({ accessToken: 'token', refreshToken: 'refresh', expiresIn: 900 });
    if (url.endsWith('/me')) return Response.json({ id: 'staff-uuid', email: 'staff@example.com', fullName: 'Staff', role: 'WAITER' });
    if (status !== 200) return Response.json({ message: 'Ownership conflict' }, { status });
    return Response.json(url.endsWith('/commands') ? { data, state: data, summary: 'Command completed', reservationId: 'reservation-uuid' } : data);
  };
  try {
    await assert.rejects(api.loadWorkspace(), /đăng nhập/);
    await auth.signIn('staff@example.com', 'secret');
    const snapshot = api.mapSnapshot(await api.loadWorkspace(), 'staff-uuid');
    assert.equal(snapshot.notifications[0].read, true);
    assert.equal(snapshot.notifications[0].reservationId, 'reservation-uuid');
    assert.equal(snapshot.reservations[0].notes, '');
    assert.deepEqual(snapshot.tables, []);
    const command = { type: 'accept', sessionId: 'session-uuid' };
    const result = await api.sendCommand(command);
    assert.equal(result.reservationId, 'reservation-uuid');
    assert.equal(calls.at(-1).url, 'https://api.example/api/v1/workspaces/staff/commands');
    assert.equal(calls.at(-1).method, 'POST');
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer token');
    assert.deepEqual(JSON.parse(calls.at(-1).body), command);
    status = 409;
    await assert.rejects(api.sendCommand(command), /Ownership conflict/);
    global.fetch = async () => { throw new TypeError('offline'); };
    await assert.rejects(api.loadWorkspace(), /offline/);
    assert.throws(() => api.mapSnapshot({}, 'staff-uuid'), /không hợp lệ/);
    global.fetch = async () => Response.json({ data, summary: 'Created' });
    await assert.rejects(api.sendCommand({ type: 'create', input: {} }), /không hợp lệ/);
    let refreshes = 0;
    global.fetch = async (url, options) => {
      if (url.endsWith('/refresh')) {
        refreshes++;
        return Response.json({ accessToken: 'renewed', refreshToken: 'renewed-refresh', expiresIn: 900 });
      }
      return options.headers.Authorization === 'Bearer renewed'
        ? Response.json(data) : Response.json({}, { status: 401 });
    };
    await Promise.all([api.loadWorkspace(), api.loadWorkspace()]);
    assert.equal(refreshes, 1, 'concurrent requests share one refresh');
    let release;
    global.fetch = (url) => url.endsWith('/logout')
      ? Promise.resolve(new Response(null, { status: 204 }))
      : new Promise(resolve => { release = resolve; });
    const pending = api.loadWorkspace();
    await auth.signOut();
    release(Response.json({}, { status: 401 }));
    await assert.rejects(pending, /đã thay đổi/);
  } finally {
    global.fetch = original;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});
