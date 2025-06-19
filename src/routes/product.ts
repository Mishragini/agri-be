// routes/product.ts
import { Router } from "express";
import { authMiddleware, requireLender } from "../middlewares/middleware";
import { createProductValidation, updateProductValidation } from "../validations/product";
import { prisma } from "../lib/db";
import { z } from "zod";

export const product_router = Router();

// Create product - requires auth and lender role
product_router.post('/create-product', authMiddleware, requireLender, async (req, res) => {
    try {
        // Validate request body
        const validatedData = createProductValidation.parse(req.body);

        // Create product with the current user's ID
        const product = await prisma.product.create({
            data: {
                ...validatedData,
                createdById: req.user!.id, // asserted since authMiddleware guarantees it
            },
        });

        res.status(201).json({
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
            return;
        }

        console.error("Error creating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all products - requires auth only
product_router.get('/', authMiddleware, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            message: "Products retrieved successfully",
            data: products,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get products by specific user - requires auth only
product_router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId is a valid format (assuming it's a number or UUID)
        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }

        const products = await prisma.product.findMany({
            where: {
                createdById: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            message: "User products retrieved successfully",
            data: products,
        });
    } catch (error) {
        console.error("Error fetching user products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get current user's products - requires auth only
product_router.get('/my-products', authMiddleware, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                createdById: req.user!.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            message: "Your products retrieved successfully",
            data: products,
        });
    } catch (error) {
        console.error("Error fetching user's products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get particular product by ID - requires auth only
product_router.get('/:productId', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }

        const product = await prisma.product.findUnique({
            where: {
                id: productId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        res.status(200).json({
            message: "Product retrieved successfully",
            data: product,
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete product - requires auth and lender role
product_router.delete('/:productId', authMiddleware, requireLender, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }

        // First check if product exists and belongs to the current user
        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        });

        if (!existingProduct) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        // Check if the current user owns this product
        if (existingProduct.createdById !== req.user!.id) {
            res.status(403).json({ message: "You can only delete your own products" });
            return;
        }

        // Delete the product
        await prisma.product.delete({
            where: {
                id: productId,
            },
        });

        res.status(200).json({
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update product - requires auth and lender role (bonus endpoint)
product_router.put('/:productId', authMiddleware, requireLender, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }

        // Validate request body
        const validatedData = updateProductValidation.parse(req.body);

        // First check if product exists and belongs to the current user
        const existingProduct = await prisma.product.findUnique({
            where: {
                id: productId,
            },
        });

        if (!existingProduct) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        // Check if the current user owns this product
        if (existingProduct.createdById !== req.user!.id) {
            res.status(403).json({ message: "You can only update your own products" });
            return;
        }

        // Update the product
        const updatedProduct = await prisma.product.update({
            where: {
                id: productId,
            },
            data: {
                ...validatedData,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(200).json({
            message: "Product updated successfully",
            data: updatedProduct,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation failed",
                errors: error.errors,
            });
            return;
        }

        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});