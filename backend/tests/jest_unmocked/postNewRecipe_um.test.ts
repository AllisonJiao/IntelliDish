import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: POST /recipes", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields
    // Expected output: An object with 'errors' property listing all missing required fields
    test("postNewRecipe with missing required fields", async () => {
        const res = await request(app)
            .post('/recipes')
            .send({});
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A POST request with invalid data type for ingredients (string instead of array)
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid data format
    // Expected output: An object with 'errors' property indicating invalid data types
    test("postNewRecipe with invalid data", async () => {
        const res = await request(app)
            .post('/recipes')
            .send({
                name: "Test Recipe",
                ingredients: "not an array", // Should be an array
                procedure: ["step1"]
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
}); 