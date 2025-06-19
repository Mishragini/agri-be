import * as z from "zod";

export const createProductValidation = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    image: z.array(z.string().url({ message: "Image must be a valid URL" })),
    address: z.string().min(1, "Address is required"),
});

export const updateProductValidation = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    image: z.array(z.string().url({ message: "Image must be a valid URL" })).optional(),
    address: z.string().min(1).optional(),
});