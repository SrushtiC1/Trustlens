const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const registerData = JSON.stringify({
    email: 'eval' + Date.now() + '@example.com',
    password: 'password123'
});

function makeRequest(path, data, headers, callback) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'POST',
        headers: headers
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            callback(JSON.parse(body));
        });
    });

    req.on('error', (e) => {
        console.error(`Request to ${path} failed: ${e.message}`);
        process.exit(1);
    });

    req.write(data);
    req.end();
}

rl.question("Enter Entity Type (URL/Email/Phone): ", (type) => {
    rl.question("Enter the Entity (e.g., example.com): ", (entity) => {
        console.log("\nCreating test user and logging in...");

        // 1. Register
        makeRequest('/api/auth/register', registerData, { 'Content-Type': 'application/json', 'Content-Length': registerData.length }, (regRes) => {
            
            // 2. Login
            makeRequest('/api/auth/login', registerData, { 'Content-Type': 'application/json', 'Content-Length': registerData.length }, (logRes) => {
                if (!logRes.token) {
                    console.error("Failed to login", logRes);
                    rl.close();
                    return;
                }

                const token = logRes.token;
                console.log("Login successful. Requesting Machine Learning Analysis...");

                // 3. Analyze Entity
                const analysisData = JSON.stringify({
                    type: type || 'URL',
                    entity: entity || 'http://malicious-phishing-test-domain.com/login'
                });

                makeRequest('/api/analysis/analyze', analysisData, {
                    'Content-Type': 'application/json',
                    'Content-Length': analysisData.length,
                    'Authorization': 'Bearer ' + token
                }, (analyzeRes) => {
                    console.log("\n=== ML INTEGRATION RESULT ===");
                    console.log(`Entity Analyzed: ${analyzeRes.data?.entity}`);
                    console.log(`Trust Score: ${analyzeRes.data?.score}`);
                    console.log(`Risk Level: ${analyzeRes.data?.riskLevel}`);
                    console.log("Breakdown:", analyzeRes.data?.breakdown);
                    console.log("===============================\n");
                    rl.close();
                    process.exit(0);
                });
            });
        });
    });
});
