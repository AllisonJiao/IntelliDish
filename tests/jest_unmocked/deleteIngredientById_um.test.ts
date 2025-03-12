import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: DELETE /ingredients/:id", () => {
    // Input: A DELETE request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("deleteIngredientById with invalid ID", async () => {
        const res = await request(API_BASE_URL)
            .delete('/ingredients/invalid-id')
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A DELETE request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating ingredient not found
    // Expected output: An error response
    test("deleteIngredientById with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(API_BASE_URL)
            .delete(`/ingredients/${nonExistentId}`)
            .agent(agent);
        
        expect(res.status).toBe(404);
    });
}); 