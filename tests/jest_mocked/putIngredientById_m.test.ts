import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { IngredientsController } from "../../controllers/IngredientsController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/IngredientsController", () => {
    return {
        IngredientsController: jest.fn().mockImplementation(() => ({
            putIngredientById: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid ingredient ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: PUT /ingredients/:id", () => {
    test("putIngredientById throws with invalid ID", async () => {
        const controller = new IngredientsController();
        
        const mockReq = {
            params: { id: 'invalid-id' },
            body: { name: "Updated Tomato" }
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.putIngredientById(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("putIngredientById throws with valid ID", async () => {
        const validId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .put(`/ingredients/${validId}`)
            .send({ name: "Updated Tomato" })
            .expect(500);
    });
}); 