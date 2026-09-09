const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🧪 Starting Auth Flow Verification...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  async function assert(desc, fn) {
    testsTotal++;
    try {
      await fn();
      console.log(`✅ [PASS] ${desc}`);
      testsPassed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${desc}:`, err.message);
    }
  }

  const testEmailCust = `cust_test_${Date.now()}@example.com`;
  const testPhoneCust = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  let custToken = '';

  const testEmailOp = `op_test_${Date.now()}@example.com`;
  const testPhoneOp = `+9188${Math.floor(10000000 + Math.random() * 90000000)}`;
  let opToken = '';

  // 1. Customer registration with valid data
  await assert('Customer Registration - valid payload', async () => {
    const res = await fetch(`${API_BASE}/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: testEmailCust,
        phone: testPhoneCust,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.token) {
      throw new Error(`Expected token, got: ${JSON.stringify(data)}`);
    }
    custToken = data.data.token;
  });

  // 2. Customer registration validation error on missing password
  await assert('Customer Registration - missing password yields 400', async () => {
    const res = await fetch(`${API_BASE}/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad User',
        email: 'bad@user.com',
        phone: '+919999999999',
      }),
    });
    const data = await res.json();
    if (res.status !== 400) {
      throw new Error(`Expected 400 error, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 3. Customer login
  await assert('Customer Login - valid credentials', async () => {
    const res = await fetch(`${API_BASE}/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmailCust,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.token) {
      throw new Error(`Expected token, got: ${JSON.stringify(data)}`);
    }
    custToken = data.data.token;
  });

  // 4. Customer login - invalid credentials
  await assert('Customer Login - wrong password yields 401', async () => {
    const res = await fetch(`${API_BASE}/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmailCust,
        password: 'WrongPassword!',
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got status ${res.status}`);
    }
  });

  // 5. Customer Profile Me
  await assert('Customer Profile - /customer/me returns profile', async () => {
    const res = await fetch(`${API_BASE}/auth/customer/me`, {
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const data = await res.json();
    if (!res.ok || data.data?.customer?.email !== testEmailCust.toLowerCase()) {
      throw new Error(`Expected email ${testEmailCust}, got: ${JSON.stringify(data)}`);
    }
  });

  // 6. Operator registration with valid data
  await assert('Operator Registration - valid payload', async () => {
    const res = await fetch(`${API_BASE}/auth/operator/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Marcus Vance',
        email: testEmailOp,
        phone: testPhoneOp,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.token) {
      throw new Error(`Expected token, got: ${JSON.stringify(data)}`);
    }
    opToken = data.data.token;
  });

  // 7. Operator login with demo credentials
  await assert('Operator Login - demo credentials (driver@voltrescue.com)', async () => {
    const res = await fetch(`${API_BASE}/auth/operator/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'driver@voltrescue.com',
        password: 'pass1234',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.token) {
      throw new Error(`Expected token, got: ${JSON.stringify(data)}`);
    }
  });

  // 8. Operator Profile Me
  await assert('Operator Profile - /operator/me returns operator details', async () => {
    const res = await fetch(`${API_BASE}/auth/operator/me`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    const data = await res.json();
    if (!res.ok || data.data?.operator?.email !== testEmailOp.toLowerCase()) {
      throw new Error(`Expected operator email ${testEmailOp}, got: ${JSON.stringify(data)}`);
    }
  });

  // 9. Guest session creation
  await assert('Guest Session - /guest returns valid session', async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: `device_${Date.now()}` }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.session?.deviceId) {
      throw new Error(`Expected guest session, got: ${JSON.stringify(data)}`);
    }
  });

  // 10. Duplicate customer registration rejection
  await assert('Duplicate Customer Registration - rejected with 400', async () => {
    const res = await fetch(`${API_BASE}/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        email: testEmailCust,
        phone: '+919900000000',
        password: 'Password123!',
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400, got status ${res.status}`);
    }
  });

  console.log(`\n========================================`);
  console.log(`Results: ${testsPassed}/${testsTotal} passed`);
  console.log(`========================================\n`);

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runTests();
