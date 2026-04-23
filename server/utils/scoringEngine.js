/**
 * Trust Scoring Engine
 * 
 * Scoring rules:
 * +20 if HTTPS present
 * +20 if domain age > 1 year
 * +25 if not blacklisted
 * +15 if no complaints
 * -20 if suspicious keywords found
 * -25 if newly created domain (age < 1 month / simulated)
 * 
 * Score range: 0–100
 */

const calculateTrustScore = (entityData) => {
    let score = 20; // Start with a Neutral base score
    const breakdown = [{ factor: 'Neutrality Base', impact: 20, description: 'Standard baseline trust for unknown entities.' }];

    // HTTPS (only for URLs)
    if (entityData.type === 'URL') {
        if (entityData.isHttps) {
            score += 20;
            breakdown.push({ factor: 'HTTPS Support', impact: 20, description: 'Secure connection detected.' });
        } else {
            breakdown.push({ factor: 'HTTPS Support', impact: 0, description: 'Insecure connection.' });
        }
    }
    // Whitelist Heuristics (Quick trust for major domains)
    const trustedDomains = ['google.com', 'apple.com', 'microsoft.com', 'amazon.com', 'github.com', 'facebook.com'];
    if (entityData.type === 'URL' || entityData.type === 'Website') {
        const hostname = entityData.entity.toLowerCase();
        if (trustedDomains.some(d => hostname.includes(d))) {
            score += 30;
            breakdown.push({ factor: 'Domain Reputation', impact: 30, description: 'Known highly-trusted domain detected.' });
        }
    }

    // Entity Age (Enhanced for Variability)
    if (entityData.domainAgeYears >= 1) {
        const bonus = Math.min(25, 10 + Math.floor(entityData.domainAgeYears * 2));
        score += bonus;
        breakdown.push({ factor: 'Entity Age', impact: bonus, description: `Established entity (~${entityData.domainAgeYears.toFixed(1)} years).` });
    } else if (entityData.domainAgeYears < 0.2) {
        score -= 20;
        breakdown.push({ factor: 'Entity Age', impact: -20, description: 'Very recently created/activated (high risk).' });
    } else {
        const midBonus = Math.floor(entityData.domainAgeYears * 15);
        score += midBonus;
        breakdown.push({ factor: 'Entity Age', impact: midBonus, description: 'Moderately established entity.' });
    }

    // Blacklist Status
    if (!entityData.isBlacklisted) {
        score += 25;
        breakdown.push({ factor: 'Blacklist Status', impact: 25, description: 'Not found in any blacklists.' });
    } else {
        score -= 25; // Implicit penalty if blacklisted? Requirements say +25 if NOT blacklisted.
        breakdown.push({ factor: 'Blacklist Status', impact: -25, description: 'Entity is blacklisted.' });
    }

    // Complaints
    if (entityData.complaintsCount === 0) {
        score += 15;
        breakdown.push({ factor: 'Complaints', impact: 15, description: 'No reports or complaints found.' });
    } else {
        const penalty = Math.min(entityData.complaintsCount * 8, 40);
        score -= penalty;
        breakdown.push({ factor: 'Complaints', impact: -penalty, description: `${entityData.complaintsCount} complaints reported.` });
    }

    // Suspicious Keywords
    if (entityData.suspiciousKeywordsFound) {
        score -= 20;
        breakdown.push({ factor: 'Keywords', impact: -20, description: 'Suspicious keywords detected.' });
    } else {
        breakdown.push({ factor: 'Keywords', impact: 0, description: 'No suspicious keywords found.' });
    }

    // Machine Learning Random Forest Integration
    if (entityData.mlPrediction !== undefined && entityData.mlPrediction !== null) {
        let mlImpact = 0;
        let desc = '';
        const prediction = String(entityData.mlPrediction).toLowerCase();

        if (entityData.type.toLowerCase() === 'url') {
            if (prediction === 'benign') {
                mlImpact = 30;
                desc = 'ML Model identified URL pattern as benign.';
            } else {
                mlImpact = -30;
                desc = `ML Model identified URL pattern as a threat: ${prediction}.`;
            }
        } else if (entityData.type.toLowerCase() === 'website') {
            if (prediction === '0') {
                mlImpact = 30;
                desc = 'ML Model identified website source as benign.';
            } else if (prediction === '1') {
                mlImpact = -30;
                desc = 'ML Model identified website source as malicious.';
            }
        } else if (entityData.type.toLowerCase() === 'phone') {
            const priceUsd = parseFloat(prediction);
            if (!isNaN(priceUsd)) {
                if (priceUsd > 100) {
                    mlImpact = +10;
                    desc = `ML predicts Premium Phone Number (Valued $${priceUsd.toFixed(2)}).`;
                } else {
                    mlImpact = -5;
                    desc = `ML predicts Standard Phone Number (Valued $${priceUsd.toFixed(2)}).`;
                }
            }
        }

        if (mlImpact !== 0 || desc !== '') {
            score += mlImpact;
            breakdown.push({ factor: 'AI Analysis', impact: mlImpact, description: desc });
        }
    }

    // Phone-specific Heuristics (Pattern Analysis)
    if (entityData.type.toLowerCase() === 'phone') {
        const digits = entityData.entity.replace(/\D/g, '');
        const repeats = /(\d)\1{2,}/.test(digits); // 3+ repeating digits
        const generic = /^(123456|987654|000000|111111)/.test(digits);

        if (repeats && !generic) {
            score += 15;
            breakdown.push({ factor: 'Pattern Analysis', impact: 15, description: 'Premium repeating digit pattern detected.' });
        } else if (generic) {
            score -= 20;
            breakdown.push({ factor: 'Pattern Analysis', impact: -20, description: 'Common dummy/generic number pattern.' });
        }
    }

    // Ensure score is within 0-100
    score = Math.max(0, Math.min(100, score));

    let riskLevel = 'High Risk';
    if (score >= 80) riskLevel = 'Low Risk';
    else if (score >= 50) riskLevel = 'Medium Risk';

    return { score, riskLevel, breakdown };
};

module.exports = { calculateTrustScore };
