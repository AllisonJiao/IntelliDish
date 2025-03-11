import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: User Basic Operations", () => {
    describe("GET /users", () => {
        test("getUsers returns list of users", async () => {
            const res = await request(API_BASE_URL)
                .get('/users')
                .agent(agent);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("GET /users/id/:id", () => {
        test("getUserById with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .get('/users/id/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

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
        test("getUserByEmail with non-existent email", async () => {
            const res = await request(API_BASE_URL)
                .get('/users/email/nonexistent@example.com')
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("PUT /users/:id/name", () => {
        test("updateUserName with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .put('/users/invalid-id/name')
                .send({ name: "New Name" })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

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
        test("deleteUserAccount with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .delete('/users/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

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