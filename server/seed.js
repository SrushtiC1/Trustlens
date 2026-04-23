const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SampleEntity = require('./models/SampleEntity');

dotenv.config();

const sampleData = [
    // URLs
    {
        entity: 'example.com',
        type: 'URL',
        isHttps: true,
        domainAgeYears: 5,
        isBlacklisted: false,
        complaintsCount: 0,
        suspiciousKeywordsFound: false
    },
    {
        entity: 'newlyscam.xyz',
        type: 'URL',
        isHttps: false,
        domainAgeYears: 0.01,
        isBlacklisted: true,
        complaintsCount: 52,
        suspiciousKeywordsFound: true
    },
    {
        entity: 'securebank.com',
        type: 'URL',
        isHttps: true,
        domainAgeYears: 12,
        isBlacklisted: false,
        complaintsCount: 0,
        suspiciousKeywordsFound: false
    },
    // Emails
    {
        entity: 'support@securebank.com',
        type: 'Email',
        domainAgeYears: 10,
        isBlacklisted: false,
        complaintsCount: 0,
        suspiciousKeywordsFound: false
    },
    {
        entity: 'urgentverify@gmail.com',
        type: 'Email',
        domainAgeYears: 0.1,
        isBlacklisted: false,
        complaintsCount: 5,
        suspiciousKeywordsFound: true
    },
    // Phones
    {
        entity: '+919876543210',
        type: 'Phone',
        domainAgeYears: 3,
        isBlacklisted: false,
        complaintsCount: 0,
        suspiciousKeywordsFound: false
    },
    {
        entity: '+15550192345',
        type: 'Phone',
        domainAgeYears: 0.5,
        isBlacklisted: false,
        complaintsCount: 2, // Medium risk
        suspiciousKeywordsFound: false
    },
    {
        entity: '+918888888888',
        type: 'Phone',
        domainAgeYears: 1,
        isBlacklisted: true,
        complaintsCount: 120,
        suspiciousKeywordsFound: true
    },
    // Websites
    {
        entity: 'google.com',
        type: 'Website',
        isHttps: true,
        domainAgeYears: 25,
        isBlacklisted: false,
        complaintsCount: 0,
        suspiciousKeywordsFound: false
    },
    {
        entity: 'suspicious-web.xyz',
        type: 'Website',
        isHttps: false,
        domainAgeYears: 0.1,
        isBlacklisted: false,
        complaintsCount: 1,
        suspiciousKeywordsFound: true
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        await SampleEntity.deleteMany();
        console.log('Old sample data removed.');

        await SampleEntity.insertMany(sampleData);
        console.log('Sample data seeded successfully.');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedDatabase();
