import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: PUT /recipes/:_id", () => {
    // Input: A PUT request with an invalid MongoDB ID and valid recipe data
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("putRecipeById with invalid ID", async () => {
        const res = await request(API_BASE_URL)
            .put('/recipes/invalid-id')
            .send({
                name: "Updated Recipe",
                ingredients: ["ingredient1"],
                procedure: ["step1"],
                cuisineType: "Italian",
                recipeComplexity: "Easy",
                spiceLevel: "Medium Spice",
                preparationTime: 30
            })
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A PUT request with a valid but non-existent MongoDB ID and valid recipe data
    // Expected status code: 404
    // Expected behavior: Returns error indicating recipe not found
    // Expected output: An object with 'error' property
    test("putRecipeById with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(API_BASE_URL)
            .put(`/recipes/${nonExistentId}`)
            .send({
                name: "Updated Recipe",
                ingredients: ["ingredient1"],
                procedure: ["step1"],
                cuisineType: "Italian",
                recipeComplexity: "Easy",
                spiceLevel: "Medium Spice",
                preparationTime: 30
            })
            .agent(agent);
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
}); 