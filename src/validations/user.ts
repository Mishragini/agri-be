import * as z from 'zod'

export const RoleEnum = z.enum(['lender', 'borrower'])

export const createUserValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
        .string()
        .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    role: RoleEnum,
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
    image: z.string().url("Image must be a valid URL").optional(),
})

export const sendOtpValidation = z.object({
    phoneNumber: z.string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d{10}$/, "Phone number must contain only numbers")
});

export const verifyOtpValidation = z.object({
    phoneNumber: z.string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^\d{10}$/, "Phone number must contain only numbers"),
    otp: z.string()
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only numbers")
});