async function runTest() {
  const username = 'ps_testoffice404';
  const password = 'up@1234';

  console.log(`Sending login request for the newly generated user: ${username}...`);
  try {
    const res = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    console.log('Login Response Status:', res.status);
    console.log('Login Response Body:', data);
  } catch (err) {
    console.error('Login test execution failed:', err);
  }
}

runTest();
