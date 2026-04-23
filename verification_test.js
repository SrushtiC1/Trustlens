const http = require('http');

const API_BASE_HOST = 'localhost';
const API_BASE_PORT = 5000;

function apiRequest(path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_BASE_HOST,
            port: API_BASE_PORT,
            path: '/api' + path,
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${body}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testScoring() {
    try {
        console.log('--- TRUSTLENS SCORING VERIFICATION ---\n');

        const user = { email: 'tester' + Date.now() + '@test.com', password: 'password123' };
        console.log('Registering test user...');
        await apiRequest('/auth/register', user);
        
        console.log('Logging in...');
        const loginRes = await apiRequest('/auth/login', user);
        const token = loginRes.token;

        const testCases = [
            { entity: 'https://google.com', type: 'URL' },
            { entity: 'https://update-account.net', type: 'URL' },
            { entity: 'newlyscam.xyz', type: 'URL' },
            { entity: '+919876543210', type: 'Phone' }
        ];

        for (const tc of testCases) {
            console.log(`Analyzing [${tc.type}] ${tc.entity}...`);
            const res = await apiRequest('/analysis/analyze', {
                entity: tc.entity,
                type: tc.type
            }, token);

            if (res.success) {
                const { score, riskLevel, breakdown } = res.data;
                console.log(`Result: ${riskLevel} (Score: ${score}/100)`);
                console.log(`Factors: ${breakdown.map(b => b.factor).join(', ')}\n`);
            } else {
                console.log(`Error: ${res.message}\n`);
            }
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
        console.log('NOTE: Ensure the server is running (npm start) before running this test.');
    }
}

testScoring();
