import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { RecipesController } from "../../controllers/RecipesController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/RecipesController", () => {
    return {
        RecipesController: jest.fn().mockImplementation(() => ({
            postNewRecipe: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!req.body.name) {
                    res.status(400).json({ error: "Recipe name is required." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

jest.mock('express-validator', () => {
    const chainable = () => {
        const chain = {
            isString: () => chain,
            isInt: () => chain,
            isArray: () => chain,
            isIn: () => chain,
            matches: () => chain,
            notEmpty: () => chain,
            isMongoId: () => chain,
            withMessage: () => chain,
            isEmail: () => chain,
            optional: () => chain
        };
        return chain;
    };

    const validationFn = (req: any, res: any, next: any) => { next(); };

    return {
        body: () => {
            const chain = chainable();
            return Object.assign(validationFn, chain);
        },
        param: () => {
            const chain = chainable();
            return Object.assign(validationFn, chain);
        },
        query: () => {
            const chain = chainable();
            return Object.assign(validationFn, chain);
        },
        validationResult: () => ({ isEmpty: () => true, array: () => [] })
    };
});

const mockedController = new RecipesController();

jest.mock('../../routes/RecipesRoutes', () => ({
    RecipesRoutes: [
        {
            method: "post",
            route: "/recipes",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new RecipesController();
                return controller.postNewRecipe(req, res, next);
            }
        },
        {
            method: "put",
            route: "/recipes/:_id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new RecipesController();
                return controller.putRecipeById(req, res, next);
            }
        }
    ]
}));

jest.mock('../../routes/IngredientsRoutes', () => ({
    IngredientsRoutes: []
}));

jest.mock('../../routes/UsersRoutes', () => ({
    UsersRoutes: []
}));

describe("Mocked: POST /recipes", () => {
    test("postNewRecipe throws with missing name", async () => {
        const controller = new RecipesController();
        
        const mockReq = {
            body: {}
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.postNewRecipe(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("postNewRecipe throws with valid data", async () => {
        const res = await request(app)
            .post('/recipes')
            .send({
                name: "Test Recipe",
                ingredients: ["ingredient1", "ingredient2"],
                procedure: ["step1", "step2"],
                cuisineType: "Italian",
                recipeComplexity: "Easy",
                spiceLevel: "Medium Spice",
                preparationTime: 30,
                calories: 500,
                nutritionLevel: "Medium",
                price: 20
            })
            .expect(500);
    });
});

test("putRecipeById throws with valid ID format", async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
        .put(`/recipes/${validId}`)
        .send({
            name: "Updated Recipe",
            ingredients: ["ingredient1"],
            procedure: ["step1"],
            cuisineType: "Italian",
            recipeComplexity: "Easy",
            spiceLevel: "Medium Spice",
            preparationTime: 30
        })
        .expect(500);
}); 