import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: User Friend Operations", () => {
    // Input: A POST request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("addFriend with invalid ID", async () => {
        const res = await request(app)
            .put('/users/invalid-id/addFriend')
            .send({
                _id: new mongoose.Types.ObjectId().toString()
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A POST request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating user not found
    // Expected output: An error response
    test("addFriend with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .put(`/users/${nonExistentId}/addFriend`)
            .send({
                _id: new mongoose.Types.ObjectId().toString()
            });
        
        expect(res.status).toBe(404);
    });

    // Input: A DELETE request with an invalid MongoDB ID
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with 'errors' property
    test("removeFriend with invalid ID", async () => {
        const res = await request(app)
            .put('/users/invalid-id/deleteFriend')
            .send({
                _id: new mongoose.Types.ObjectId().toString()
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A DELETE request with a valid but non-existent MongoDB ID
    // Expected status code: 404
    // Expected behavior: Returns error indicating user not found
    // Expected output: An error response
    test("removeFriend with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .put(`/users/${nonExistentId}/deleteFriend`)
            .send({
                _id: new mongoose.Types.ObjectId().toString()
            });
        
        expect(res.status).toBe(404);
    });
}); 