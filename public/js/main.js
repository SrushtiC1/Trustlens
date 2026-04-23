// TrustLens Main JS
// Handling Auth, Dashboard, and Analysis

const API_URL = '/api';
const token = localStorage.getItem('trustlens_token');

// Global Chart Instance
let trustChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on an auth-protected page
    if (document.body.classList.contains('dashboard-page')) {
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const userRole = localStorage.getItem('trustlens_user_role');

        // Admin page protection
        if (document.body.classList.contains('admin-page') && userRole !== 'admin') {
            window.location.href = 'dashboard.html';
            return;
        }

        // Dashboard page redirect for admin (optional: allow admins on dashboard too)
        // if (document.body.classList.contains('user-dashboard') && userRole === 'admin') {
        //     window.location.href = 'admin.html';
        //     return;
        // }

        initDashboard();
    }

    // Auth Forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// --- Authentication Handler ---

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('trustlens_token', data.token);
            localStorage.setItem('trustlens_user_email', data.user.email);
            localStorage.setItem('trustlens_user_role', data.user.role);
            showToast('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1500);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role') ? document.getElementById('role').value : 'user';

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Registration successful! Please login to continue.', 'success');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Server connection failed', 'error');
    }
}

// --- Dashboard Logic ---

function initDashboard() {
    const userEmail = localStorage.getItem('trustlens_user_email');
    document.getElementById('userEmail').textContent = userEmail;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('trustlens_token');
            localStorage.removeItem('trustlens_user_email');
            localStorage.removeItem('trustlens_user_role');
            window.location.href = 'index.html';
        });
    }

    // Forms
    const analysisForm = document.getElementById('analysisForm');
    analysisForm.addEventListener('submit', handleAnalysis);

    const complaintForm = document.getElementById('complaintForm');
    complaintForm.addEventListener('submit', handleComplaint);

    // Initial Data
    if (document.body.classList.contains('admin-page')) {
        fetchAdminStats();
        fetchUsers();
        
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) addUserForm.addEventListener('submit', handleAddUser);
    } else {
        fetchHistory();
        initChart(0); // Blank chart
    }
}

async function fetchAdminStats() {
    // For now, using history to calculate simple stats for demo
    try {
        const res = await fetch(`${API_URL}/analysis/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('totalAnalyses').textContent = data.history.length;
            // Mocking active complaints for now
            document.getElementById('activeComplaints').textContent = Math.floor(data.history.length / 3);
        }
    } catch (err) {
        console.error('Admin stats fetch failed');
    }
}

async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/auth/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const tbody = document.getElementById('usersBody');
            tbody.innerHTML = '';
            if (data.users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: var(--text-dim);">No users found.</td></tr>`;
            } else {
                data.users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.email}</td>
                        <td><span class="badge badge-low" style="padding: 4px 10px; font-size: 0.75rem;">${user.role}</span></td>
                        <td><button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">Delete</button></td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }
    } catch (err) {
        console.error('Fetch users failed', err);
    }
}

async function handleAddUser(e) {
    e.preventDefault();
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/users`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, password, role: 'user' })
        });
        const data = await res.json();
        if (data.success) {
            showToast('User added successfully', 'success');
            document.getElementById('addUserForm').reset();
            fetchUsers();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Failed to add user', 'error');
    }
}

window.deleteUser = async function(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        const res = await fetch(`${API_URL}/auth/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast('User deleted', 'success');
            fetchUsers();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Failed to delete user', 'error');
    }
}

async function handleAnalysis(e) {
    e.preventDefault();
    const type = document.getElementById('entityType').value;
    const entity = document.getElementById('entityInput').value;

    const analyzeBtn = document.getElementById('analyzeBtn');
    const spinner = analyzeBtn.querySelector('.spinner');
    const btnText = analyzeBtn.querySelector('.btn-text');

    // Loading State
    analyzeBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.style.display = 'none';

    try {
        // Show scanning state in UI
        const entityDisplay = document.getElementById('entityDisplay');
        const riskBadge = document.getElementById('riskBadge');
        const scoreValue = document.getElementById('scoreValue');
        
        entityDisplay.textContent = entity;
        entityDisplay.classList.add('scanning-text');
        riskBadge.textContent = 'Analyzing...';
        riskBadge.className = 'badge';
        scoreValue.textContent = '??';

        const res = await fetch(`${API_URL}/analysis/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, entity })
        });
        const data = await res.json();

        if (data.success) {
            // Simulated "Real-Time" steps for better UX
            const steps = [
                'Checking Global Blacklists...',
                'Analyzing Behavioral Patterns...',
                'Calculating AI Confidence...',
                'Finalizing Risk Score...'
            ];

            for (const step of steps) {
                riskBadge.textContent = step;
                await new Promise(r => setTimeout(r, 600));
            }

            entityDisplay.classList.remove('scanning-text');
            updateResultUI(data.data);
            fetchHistory();
            showToast('Analysis complete!', 'success');
        } else {
            showToast(data.message, 'error');
            entityDisplay.classList.remove('scanning-text');
        }
    } catch (err) {
        showToast('Analysis failed', 'error');
        document.getElementById('entityDisplay').classList.remove('scanning-text');
    } finally {
        analyzeBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.style.display = 'inline-block';
    }
}

async function handleComplaint(e) {
    e.preventDefault();
    const entity = document.getElementById('complaintEntity').value;
    const reason = document.getElementById('complaintReason').value;

    try {
        const res = await fetch(`${API_URL}/complaints/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ entity, reason })
        });
        const data = await res.json();

        if (data.success) {
            showToast('Report submitted!', 'success');
            document.getElementById('complaintForm').reset();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Submission failed', 'error');
    }
}

async function fetchHistory() {
    try {
        const res = await fetch(`${API_URL}/analysis/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            const tbody = document.getElementById('historyBody');
            tbody.innerHTML = '';

            if (data.history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-dim);">No analysis history yet. Run an analysis to see results here!</td></tr>`;
                return;
            }

            data.history.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'history-row';
                const riskClass = item.riskLevel.toLowerCase().replace(' ', '-');
                const date = new Date(item.timestamp).toLocaleDateString();

                row.innerHTML = `
                    <td><span class="entity-cell" title="${item.entity}">${item.entity}</span></td>
                    <td>${item.type}</td>
                    <td style="font-weight: 700;">
                        <span class="status-indicator status-${riskClass.split('-')[0]}"></span>${item.score}
                    </td>
                    <td><span class="badge badge-${riskClass.split('-')[0]}" style="font-size: 0.7rem; padding: 4px 12px; margin: 0;">${item.riskLevel}</span></td>
                    <td>${date}</td>
                `;

                // Details Row
                const detailsRow = document.createElement('tr');
                detailsRow.className = 'details-row';
                
                let breakdownHtml = '';
                if (item.breakdown && item.breakdown.length > 0) {
                    breakdownHtml = item.breakdown.map(b => `
                        <div class="detail-item ${b.impact < 0 ? 'negative' : ''}">
                            <div style="font-weight: 700; color: ${b.impact < 0 ? 'var(--danger)' : 'var(--primary)'}; margin-bottom: 4px;">
                                ${b.factor} (${b.impact > 0 ? '+' : ''}${b.impact})
                            </div>
                            <div style="font-size: 0.8rem; opacity: 0.8;">${b.description}</div>
                        </div>
                    `).join('');
                } else {
                    breakdownHtml = '<div class="detail-item">No detailed breakdown available for this record.</div>';
                }

                detailsRow.innerHTML = `
                    <td colspan="5" style="padding: 0; background: transparent;">
                        <div class="details-container">
                            <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Analysis Breakdown</h4>
                            <div class="details-grid">
                                ${breakdownHtml}
                            </div>
                        </div>
                    </td>
                `;

                row.addEventListener('click', () => {
                    const isActive = detailsRow.classList.contains('active');
                    
                    // Close all other detail rows first
                    document.querySelectorAll('.details-row').forEach(r => r.classList.remove('active'));
                    
                    if (!isActive) {
                        detailsRow.classList.add('active');
                    }
                });

                tbody.appendChild(row);
                tbody.appendChild(detailsRow);
            });
        }
    } catch (err) {
        console.error('History fetch failed');
    }
}

async function handleGetAiInsight(result) {
    const askAiBtn = document.getElementById('askAiBtn');
    const spinner = askAiBtn.querySelector('.spinner');
    const btnText = askAiBtn.querySelector('.btn-text');
    
    askAiBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.style.display = 'none';

    try {
        // We'll create a new endpoint for this, but for now we'll just mock the response
        // if the user wants to save on API credits by only running it on demand.
        const res = await fetch(`${API_URL}/analysis/ai-insight`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                entity: result.entity,
                type: result.type,
                score: result.score,
                breakdown: result.breakdown
            })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('askAiSection').style.display = 'none';
            const aiCard = document.getElementById('aiInsightCard');
            const aiText = document.getElementById('aiInsightText');
            aiCard.style.display = 'block';
            typeText(aiText, data.aiInsight);
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('AI request failed', 'error');
    } finally {
        askAiBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.style.display = 'inline-block';
    }
}

function updateResultUI(result) {
    document.getElementById('entityDisplay').textContent = result.entity;
    const scoreEl = document.getElementById('scoreValue');
    scoreEl.textContent = result.score;
    
    const riskClass = result.riskLevel.toLowerCase().split(' ')[0]; // low, medium, high
    
    // Set score color based on risk
    if (riskClass === 'low') scoreEl.style.color = '#00ff94';
    else if (riskClass === 'medium') scoreEl.style.color = '#ffb800';
    else scoreEl.style.color = '#ff4d4d';

    const badge = document.getElementById('riskBadge');
    badge.textContent = result.riskLevel;
    badge.className = `badge badge-${riskClass}`;

    // Handle AI Insight
    const aiCard = document.getElementById('aiInsightCard');
    const aiText = document.getElementById('aiInsightText');
    const askAiSection = document.getElementById('askAiSection');
    
    if (result.aiInsight) {
        aiCard.style.display = 'block';
        askAiSection.style.display = 'none';
        typeText(aiText, result.aiInsight);
    } else {
        aiCard.style.display = 'none';
        askAiSection.style.display = 'block';
        
        // Setup the one-time click listener for this result
        const askAiBtn = document.getElementById('askAiBtn');
        // Remove old listeners by cloning
        const newBtn = askAiBtn.cloneNode(true);
        askAiBtn.parentNode.replaceChild(newBtn, askAiBtn);
        
        newBtn.addEventListener('click', () => handleGetAiInsight(result));
    }

    const breakdownList = document.getElementById('breakdownList');
    breakdownList.innerHTML = '';
    result.breakdown.forEach(item => {
        const li = document.createElement('li');
        const sign = item.impact >= 0 ? '+' : '';
        li.textContent = `${item.factor}: ${sign}${item.impact} - ${item.description}`;
        breakdownList.appendChild(li);
    });

    updateChart(result.score, result.riskLevel);
}

/**
 * Utility to simulate typing text.
 */
function typeText(element, text) {
    element.textContent = '';
    let i = 0;
    const speed = 25; // ms per character
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// --- Chart.js Visualization ---

function initChart(score) {
    const ctx = document.getElementById('trustChart').getContext('2d');

    trustChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: ['#00ff94', 'rgba(255, 255, 255, 0.05)'],
                borderWidth: 0,
                cutout: '85%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            elements: {
                arc: {
                    borderRadius: 10
                }
            },
            events: []
        }
    });
}

function updateChart(score, riskLevel) {
    let color = '#ef4444'; // High Risk
    if (score >= 80) color = '#10b981'; // Low Risk
    else if (score >= 50) color = '#f59e0b'; // Medium Risk

    trustChart.data.datasets[0].data = [score, 100 - score];
    trustChart.data.datasets[0].backgroundColor = [color, 'rgba(255, 255, 255, 0.05)'];
    trustChart.update();
}

// --- Utilities ---

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';

    // Reset colors
    toast.style.borderLeftColor = 'var(--primary)';
    if (type === 'error') toast.style.borderLeftColor = 'var(--danger)';
    if (type === 'success') toast.style.borderLeftColor = 'var(--success)';

    setTimeout(() => {
        toast.className = 'toast';
    }, 4000);
}
