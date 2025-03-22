import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: User Basic Operations", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields
    // Expected output: An object with 'errors' property
    test("postNewUser with empty request", async () => {
        const res = await request(app)
            .post('/users')
            .send({});
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A POST request with invalid email format
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid email format
    // Expected output: An object with 'errors' property
    test("postNewUser with invalid email", async () => {
        const res = await request(app)
            .post('/users')
            .send({
                email: "invalid-email",
                password: "password123",
                name: "Test User"
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A GET request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("getUserById with invalid ID", async () => {
        const res = await request(app)
            .get('/users/id/invalid-id');
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A GET request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating user not found
    // Expected output: An error response
    test("getUserById with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .get(`/users/id/${nonExistentId}`);
        
        expect(res.status).toBe(404);
    });
}); 