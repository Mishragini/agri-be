import { Router, Request, Response } from "express";
import { authMiddleware, requireBorrower } from "../middlewares/middleware";
import { createBookingValidation } from "../validations/booking";
import { prisma } from "../lib/db";
import { z } from "zod";

export const booking_router = Router();

// Create a booking (only borrowers can book)
booking_router.post("/create-booking", authMiddleware, requireBorrower, async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validatedData = createBookingValidation.parse(req.body);

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: validatedData.productId }
        });

        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        if (product.createdById === req.user!.id) {
            res.status(400).json({ message: "You cannot book your own product" });
            return;
        }

        // Check for overlapping bookings
        const overlappingBooking = await prisma.booking.findFirst({
            where: {
                productId: validatedData.productId,
                OR: [
                    {
                        from: {
                            lte: new Date(validatedData.to)
                        },
                        to: {
                            gte: new Date(validatedData.from)
                        }
                    }
                ]
            }
        });

        if (overlappingBooking) {
            res.status(409).json({
                message: "Product is already booked for the selected time period"
            });
            return;
        }

        // Create the booking
        const booking = await prisma.booking.create({
            data: {
                userId: req.user!.id,
                productId: validatedData.productId,
                bookingQuery: validatedData.bookingQuery,
                from: new Date(validatedData.from),
                to: new Date(validatedData.to),
                contactNumber: validatedData.contactNumber,
                address: validatedData.address,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                        address: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors
            });
            return;
        }

        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all bookings for the authenticated user
booking_router.get("/my-bookings", authMiddleware, async (req: Request, res: Response) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user!.id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                        address: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({
            message: "Bookings retrieved successfully",
            bookings
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get a specific booking by ID
booking_router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                        address: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }

        // Check if user owns this booking
        if (booking.userId !== req.user!.id) {
            res.status(403).json({ message: "You can only view your own bookings" });
            return;
        }

        res.status(200).json({
            message: "Booking retrieved successfully",
            booking
        });

    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

booking_router.delete("/:id", authMiddleware, requireBorrower, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find the booking first
        const booking = await prisma.booking.findUnique({
            where: { id }
        });

        if (!booking) {
            res.status(404).json({ message: "Booking not found" });
            return;
        }

        // Check if the authenticated user owns this booking
        if (booking.userId !== req.user!.id) {
            res.status(403).json({
                message: "You can only delete your own bookings"
            });
            return;
        }

        // Check if booking is in the past (optional business rule)
        const now = new Date();
        if (booking.from <= now) {
            res.status(400).json({
                message: "Cannot delete a booking that has already started or is in the past"
            });
            return;
        }

        // Delete the booking
        await prisma.booking.delete({
            where: { id }
        });

        res.status(200).json({
            message: "Booking deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});