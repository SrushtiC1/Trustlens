const http = require('http');

const registerData = JSON.stringify({
    email: 'debug' + Date.now() + '@example.com',
    password: 'password123'
});

const loginData = JSON.stringify({
    email: 'test' + Date.now() + '@example.com', // This will fail login but we want to see the error type
    password: 'password123'
});

function makeRequest(path, data, callback) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`PATH: ${path} | STATUS: ${res.statusCode}`);
            console.log('BODY:', body);
            if (callback) callback();
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request to ${path}: ${e.message}`);
        if (callback) callback();
    });

    req.write(data);
    req.end();
}

console.log('Testing Registration...');
makeRequest('/api/auth/register', registerData, () => {
    console.log('\nTesting Login...');
    makeRequest('/api/auth/login', registerData, () => { // Test login with the same data we just registered
        console.log('\nDone.');
    });
});
