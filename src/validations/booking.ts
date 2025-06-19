import * as z from "zod";

export const createBookingValidation = z.object({
    productId: z.string().min(1, "Product ID is required"),
    bookingQuery: z.string().optional(),
    from: z.string().datetime("Invalid from date format"),
    to: z.string().datetime("Invalid to date format"),
    contactNumber: z.string().min(1, "Contact number is required"),
    address: z.string().min(1, "Address is required"),
}).refine((data) => {
    const fromDate = new Date(data.from);
    const toDate = new Date(data.to);
    return fromDate < toDate;
}, {
    message: "From date must be before to date",
    path: ["from"],
}).refine((data) => {
    const fromDate = new Date(data.from);
    const now = new Date();
    return fromDate > now;
}, {
    message: "From date must be in the future",
    path: ["from"],
});