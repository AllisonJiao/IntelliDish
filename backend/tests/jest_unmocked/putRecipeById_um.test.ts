import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: PUT /recipes/:_id", () => {
    // Input: A PUT request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("putRecipeById with invalid ID", async () => {
        const res = await request(app)
            .put('/recipes/invalid-id')
            .send({
                name: "Updated Recipe",
                ingredients: ["ingredient1"],
                procedure: ["step1"]
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A PUT request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating recipe not found
    // Expected output: An error response
    test("putRecipeById with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .put(`/recipes/_id/${nonExistentId}`)
            .send({
                name: "Updated Recipe",
                ingredients: ["ingredient1"],
                procedure: ["step1"]
            });
        
        expect(res.status).toBe(404);
    });
}); 