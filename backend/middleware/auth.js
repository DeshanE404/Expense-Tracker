import User from '../models/userModels.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';

export default async function authMiddleware(req, res, next) {
    //grab the token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // to verify the token

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id).select("-_password");
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
}