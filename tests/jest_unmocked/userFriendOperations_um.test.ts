import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: User Friend Operations", () => {
    describe("PUT /users/:id/addFriend", () => {
        // Input: A PUT request with an invalid user ID and valid friend ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid user ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("addNewFriend with invalid user ID", async () => {
            const validFriendId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put('/users/invalid-id/addFriend')
                .send({ _id: validFriendId })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with a valid user ID and invalid friend ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid friend ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("addNewFriend with invalid friend ID", async () => {
            const validUserId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/users/${validUserId}/addFriend`)
                .send({ _id: 'invalid-id' })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with a valid but non-existent user ID and valid friend ID
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An object with an 'error' property indicating user not found
        test("addNewFriend with non-existent user", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const friendId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/users/${nonExistentId}/addFriend`)
                .send({ _id: friendId })
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("PUT /users/:id/deleteFriend", () => {
        // Input: A PUT request with an invalid user ID and valid friend ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid user ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("deleteFriend with invalid user ID", async () => {
            const validFriendId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put('/users/invalid-id/deleteFriend')
                .send({ _id: validFriendId })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with a valid user ID and invalid friend ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid friend ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("deleteFriend with invalid friend ID", async () => {
            const validUserId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/users/${validUserId}/deleteFriend`)
                .send({ _id: 'invalid-id' })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with a valid but non-existent user ID and valid friend ID
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An empty response with 404 status
        test("deleteFriend with non-existent user", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const friendId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/users/${nonExistentId}/deleteFriend`)
                .send({ _id: friendId })
                .agent(agent);
            
            expect(res.status).toBe(404);
        });
    });

    describe("GET /users/:id/friends", () => {
        // Input: A GET request with an invalid MongoDB ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with 'errors' property describing the validation failure
        test("getFriends with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .get('/users/invalid-id/friends')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A GET request with a valid but non-existent MongoDB ID
        // Expected status code: 404
        // Expected behavior: Returns not found error
        // Expected output: An object with an 'error' property indicating user not found
        test("getFriends with non-existent user", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .get(`/users/${nonExistentId}/friends`)
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });
}); 