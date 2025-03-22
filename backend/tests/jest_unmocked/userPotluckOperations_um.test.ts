import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: User Potluck Operations", () => {
    // Input: A POST request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("createPotluck with invalid ID", async () => {
        const res = await request(app)
            .post('/potluck')
            .send({
                name: "Test Potluck",
                date: new Date().toISOString(),
                host: "invalid-id",
                participants: [],
                ingredients: []
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toContainEqual(
            expect.objectContaining({
                msg: "Valid host ID is required"
            })
        );
    });

    // Input: A POST request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating user not found
    // Expected output: An error response
    test("createPotluck with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .post('/potluck')
            .send({
                name: "Test Potluck",
                date: new Date().toISOString(),
                host: nonExistentId,
                participants: [],
                ingredients: []
            });
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    // Input: A GET request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("getPotlucks with invalid ID", async () => {
        const res = await request(app)
            .get('/potluck/host/invalid-id');
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    // Input: A GET request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating user not found
    // Expected output: An error response
    test("getPotlucks with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .get(`/potluck/host/${nonExistentId}`);
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
}); 