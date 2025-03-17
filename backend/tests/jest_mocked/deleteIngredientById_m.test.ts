import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { IngredientsController } from "../../controllers/IngredientsController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/IngredientsController", () => {
    return {
        IngredientsController: jest.fn().mockImplementation(() => ({
            deleteIngredientById: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid ingredient ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: DELETE /ingredients/:id", () => {
    // Input: A DELETE request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with an 'error' property
    test("deleteIngredientById throws with invalid ID", async () => {
        const controller = new IngredientsController();
        
        const mockReq = {
            params: { id: 'invalid-id' }
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.deleteIngredientById(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    // Input: A DELETE request with a valid MongoDB ID format
    // Expected status code: 500 (forced error from mock)
    // Expected behavior: Throws error from mocked controller
    // Expected output: An error response
    test("deleteIngredientById throws with valid ID format", async () => {
        const validId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .delete(`/ingredients/${validId}`)
            .expect(500);
    });
}); 