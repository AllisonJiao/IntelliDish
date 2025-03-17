import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: User Basic Operations", () => {
    describe("GET /users", () => {
        // Input: A valid GET request to the /users endpoint
        // Expected status code: 200
        // Expected behavior: Returns a list of all users in the database
        // Expected output: An array of user objects
        test("getUsers returns list of users", async () => {
            const res = await request(API_BASE_URL)
                .get('/users')
                .agent(agent);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("GET /users/id/:id", () => {
        // Input: A GET request with an invalid MongoDB ID format
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("getUserById with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .get('/users/id/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A GET request with a valid but non-existent MongoDB ID
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An object with an 'error' property indicating user not found
        test("getUserById with non-existent ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .get(`/users/id/${nonExistentId}`)
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("GET /users/email/:email", () => {
        // Input: A GET request with a non-existent email address
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An object with an 'error' property indicating user not found
        test("getUserByEmail with non-existent email", async () => {
            const res = await request(API_BASE_URL)
                .get('/users/email/nonexistent@example.com')
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("PUT /users/:id/name", () => {
        // Input: A PUT request with an invalid MongoDB ID and a new name
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("updateUserName with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .put('/users/invalid-id/name')
                .send({ name: "New Name" })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with a valid but non-existent MongoDB ID and a new name
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An object with an 'error' property indicating user not found
        test("updateUserName with non-existent ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/users/${nonExistentId}/name`)
                .send({ name: "New Name" })
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("DELETE /users/:id", () => {
        // Input: A DELETE request with an invalid MongoDB ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("deleteUserAccount with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .delete('/users/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A DELETE request with a valid but non-existent MongoDB ID
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An object with an 'error' property indicating user not found
        test("deleteUserAccount with non-existent ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .delete(`/users/${nonExistentId}`)
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });
}); 