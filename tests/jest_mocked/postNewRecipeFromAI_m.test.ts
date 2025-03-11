import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { RecipesController } from "../../controllers/RecipesController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";

jest.mock("../../controllers/RecipesController", () => {
    return {
        RecipesController: jest.fn().mockImplementation(() => ({
            postNewRecipeFromAI: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: POST /recipes/AI", () => {
    test("postNewRecipeFromAI throws", async () => {
        const res = await request(app)
            .post('/recipes/AI')
            .send({
                name: "Test Recipe"
            })
            .expect(500);
    }, 15000);
}); 