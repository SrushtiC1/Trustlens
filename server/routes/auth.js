const express = require('express');
const router = express.Router();
const { register, login, getUsers, createUser, deleteUser } = require('../controllers/authController');
const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        req.user = decoded;
        next();
    } catch(err) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

router.post('/register', register);
router.post('/login', login);

router.get('/users', adminAuth, getUsers);
router.post('/users', adminAuth, createUser);
router.delete('/users/:id', adminAuth, deleteUser);

module.exports = router;
