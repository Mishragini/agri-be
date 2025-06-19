import { Request, Response, Router } from "express";
import { createUserValidation } from "../validations/user";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/db";
import bcrypt from 'bcrypt';

export const user_router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 12; // Higher number = more secure but slower

user_router.post('/create-user', async (req: Request, res: Response) => {
    try {
        // 1. Validate incoming request body
        const validatedData = createUserValidation.parse(req.body);

        // 2. Check if user with email already exists
        const existing = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existing) {
            res.status(409).json({
                message: "User already exists with this email",
            });
            return;
        }

        // 3. Hash the password before storing
        const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

        // 4. Create new user in the DB with encrypted password
        const newUser = await prisma.user.create({
            data: {
                ...validatedData,
                password: hashedPassword, // Store encrypted password
            }
        });

        // 5. Generate JWT token
        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 6. Remove password from response data for security
        const { password, ...userWithoutPassword } = newUser;

        // 7. Send response with token (without password)
        res.status(201).json({
            message: "User created successfully",
            data: userWithoutPassword,
            token,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
            return;
        }

        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
});