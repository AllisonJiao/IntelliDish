import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: POST /recipes/AI", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields (name and imgPath)
    // Expected output: An object with 'errors' property listing missing required fields
    test("postNewRecipeFromAI with empty request", async () => {
        const res = await request(app)
            .post('/recipes/AI')
            .send({});
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    }, 15000);
}); 