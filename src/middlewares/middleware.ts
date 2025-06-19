import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Define your JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extend Express Request type to include `user`
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}

interface MyJwtPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
}

// Authentication middleware
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];


    if (!authHeader || !authHeader.startsWith("Bearer ") || !token) {
        res.status(401).json({ message: "Missing or invalid token" });
        return;
    }


    try {
        const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;

        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification failed", err);
        res.status(401).json({ message: "Invalid token" });
    }
};

export enum Role {
    LENDER = "lender",
    BORROWER = "borrower",
}

// Base role-checking middleware

const requireRole = (role: Role) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (req?.user?.role !== role) {
            res.status(403).json({ message: `Only ${role}s can access this` });
            return;
        }

        next();
    };
};

// Specialized middlewares
export const requireLender = requireRole(Role.LENDER);
export const requireBorrower = requireRole(Role.BORROWER);
