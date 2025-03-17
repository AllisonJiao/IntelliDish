import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: PUT /ingredients/:id", () => {
    // Input: A PUT request with an invalid MongoDB ID and valid ingredient data
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("putIngredientById with invalid ID", async () => {
        const res = await request(API_BASE_URL)
            .put('/ingredients/invalid-id')
            .send({
                name: "Updated Tomato",
                category: "Vegetables",
                quantity: 1,
                unit: "kg"
            })
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A PUT request with a valid but non-existent MongoDB ID and valid ingredient data
    // Expected status code: 404
    // Expected behavior: Returns error indicating ingredient not found
    // Expected output: An object with 'error' property
    test("putIngredientById with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(API_BASE_URL)
            .put(`/ingredients/${nonExistentId}`)
            .send({
                name: "Updated Tomato",
                category: "Vegetables",
                quantity: 1,
                unit: "kg"
            })
            .agent(agent);
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
}); 