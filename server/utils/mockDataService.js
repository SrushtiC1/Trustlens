/**
 * Mock Data Service
 * Generates deterministic simulated metrics for entities not found in the sample database.
 */

/**
 * Generates mock feature data based on entity hash.
 * @param {string} entity - The analyzed entity.
 * @param {string} type - Entity type (URL, Phone, Email).
 * @returns {Object} Mock feature data.
 */
exports.generateMockFeatures = (entity, type) => {
    // Generate deterministic "random" values based on the entity string
    let hash = 0;
    for (let i = 0; i < entity.length; i++) {
        hash = ((hash << 5) - hash) + entity.charCodeAt(i);
        hash |= 0;
    }
    const absHash = Math.abs(hash);

    const entityLower = entity.toLowerCase();
    const isUrl = type.toLowerCase() === 'url' || type.toLowerCase() === 'website';
    
    // Heuristic 1: TLD-based age (for URLs) or Randomized age
    let ageGuess = (absHash % 80) / 10; // 0 to 7.9 years
    if (isUrl) {
        const safeTlds = ['.com', '.org', '.net', '.edu', '.gov'];
        const suspiciousTlds = ['.xyz', '.top', '.icu', '.party', '.bid', '.gdn'];
        if (safeTlds.some(t => entityLower.endsWith(t))) ageGuess += 2.5;
        if (suspiciousTlds.some(t => entityLower.endsWith(t))) ageGuess *= 0.1;
    } else if (type.toLowerCase() === 'phone') {
        ageGuess = (absHash % 50) / 10;
    }

    // Heuristic 2: Keywords
    const suspiciousWords = ['login', 'verify', 'update', 'banking', 'secure-verify', 'prize', 'gift'];
    const hasSuspiciousWords = suspiciousWords.some(word => entityLower.includes(word));

    return {
        entity,
        type,
        isHttps: entity.startsWith('https://'),
        domainAgeYears: ageGuess,
        isBlacklisted: (absHash % 100) < 8,
        complaintsCount: hasSuspiciousWords ? (3 + (absHash % 12)) : (absHash % 4),
        suspiciousKeywordsFound: hasSuspiciousWords
    };
};
