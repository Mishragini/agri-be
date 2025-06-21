import { Request, Response, Router } from "express";
import { createUserValidation, sendOtpValidation, verifyOtpValidation } from "../validations/user";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/db";
import bcrypt from 'bcrypt';
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_SERVICE_SID) {
    throw new Error('Missing Twilio configuration in environment variables');
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);


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

const formatPhoneNumber = (phoneNumber: string): string => {
    return '+91' + phoneNumber;
};

user_router.post('/send-otp', async (req: Request, res: Response) => {
    try {
        // 1. Validate incoming request body
        const validatedData = sendOtpValidation.parse(req.body);

        // 2. Format phone number with country code
        const formattedPhoneNumber = formatPhoneNumber(validatedData.phoneNumber);

        // 3. Check if user exists with this phone number
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: validatedData.phoneNumber }
        });

        if (!existingUser) {
            res.status(404).json({
                success: false,
                message: "User not found with this phone number"
            });
            return;
        }

        // 4. Send OTP using Twilio Verify
        const verification = await twilioClient.verify.v2
            .services(TWILIO_SERVICE_SID)
            .verifications
            .create({
                to: formattedPhoneNumber,
                channel: 'sms'
            });

        // 5. Return success response
        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error('Send OTP Error:', error);

        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors
            });
            return;
        }

        // Handle Twilio specific errors
        if (error && typeof error === 'object' && 'code' in error) {
            res.status(400).json({
                success: false,
                message: "Failed to send OTP. Please try again."
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Verify OTP and sign in user
user_router.post('/verify-otp', async (req: Request, res: Response) => {
    try {
        // 1. Validate incoming request body
        const validatedData = verifyOtpValidation.parse(req.body);

        // 2. Format phone number with country code
        const formattedPhoneNumber = formatPhoneNumber(validatedData.phoneNumber);

        // 3. Find user with this phone number
        const user = await prisma.user.findUnique({
            where: { phoneNumber: validatedData.phoneNumber }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found with this phone number"
            });
            return
        }

        // 4. Verify OTP using Twilio
        const verificationCheck = await twilioClient.verify.v2
            .services(TWILIO_SERVICE_SID)
            .verificationChecks
            .create({
                to: formattedPhoneNumber,
                code: validatedData.otp
            });

        // 5. Check if verification was successful
        if (verificationCheck.status !== 'approved') {
            res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
            return;
        }

        // 6. Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                phoneNumber: user.phoneNumber,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 7. Remove sensitive data from response
        const { password, ...userWithoutPassword } = user;

        // 8. Send success response
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);

        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors
            });
            return;
        }

        // Handle Twilio specific errors
        if (error && typeof error === 'object' && 'code' in error) {
            res.status(400).json({
                success: false,
                message: "Failed to send OTP. Please try again."
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});