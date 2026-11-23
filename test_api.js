const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 3100;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore'
});

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForServer() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
            await fetch(`${baseUrl}/books`);
            return;
        } catch {
            await delay(100);
        }
    }
    throw new Error('Test server did not start.');
}

async function call(path, options) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const contentType = response.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), `Expected JSON for ${path}`);
    return { status: response.status, data: await response.json() };
}

async function runTests() {
    await waitForServer();

    let result = await call('/books');
    assert.equal(result.status, 200);
    assert.ok(result.data.length >= 3, 'Expected at least three sample books');

    result = await call('/books/B101');
    assert.equal(result.status, 200);
    assert.equal(result.data.id, 'B101');

    result = await call('/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'TEST-1', title: 'Test Book', author: 'Test Author', price: 10.25 })
    });
    assert.equal(result.status, 201);
    assert.equal(result.data.book.id, 'TEST-1');

    result = await call('/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-1', title: 'Duplicate', author: 'Test', price: 5 })
    });
    assert.equal(result.status, 409);

    result = await call('/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'TEST-2', title: 'Invalid', author: 'Test', price: -1 })
    });
    assert.equal(result.status, 400);

    result = await call('/books/TEST-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Book', author: 'Updated Author', price: 12 })
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.book.title, 'Updated Book');

    result = await call('/books/TEST-1', { method: 'DELETE' });
    assert.equal(result.status, 200);
    assert.equal(result.data.book.id, 'TEST-1');

    result = await call('/books/TEST-1');
    assert.equal(result.status, 404);
    result = await call('/books/UNKNOWN-BOOK', { method: 'DELETE' });
    assert.equal(result.status, 404);
    result = await call('/books/UNKNOWN-BOOK', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Missing', author: 'Nobody', price: 1 })
    });
    assert.equal(result.status, 404);

    result = await call('/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"id":'
    });
    assert.equal(result.status, 400);
    assert.match(result.data.error, /invalid JSON/i);

    const pageResponse = await fetch(`${baseUrl}/`);
    assert.equal(pageResponse.status, 200);
    assert.match(await pageResponse.text(), /Book Management System/);

    console.log('All API and frontend smoke tests passed.');
}

runTests()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => {
        server.kill();
    });
