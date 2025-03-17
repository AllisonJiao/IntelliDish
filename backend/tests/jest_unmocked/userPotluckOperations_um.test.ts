import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: Potluck Operations", () => {
    describe("GET /potluck", () => {
        // Input: A valid GET request to the /potluck endpoint
        // Expected status code: 200
        // Expected behavior: Returns a list of all potluck sessions
        // Expected output: An object with 'potlucks' array containing potluck objects, each with name, date, host, participants, ingredients, and recipes
        test("getPotluckSessions returns list of potlucks", async () => {
            const res = await request(API_BASE_URL)
                .get('/potluck')
                .agent(agent);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('potlucks');
            expect(Array.isArray(res.body.potlucks)).toBe(true);
        });
    });

    describe("GET /potluck/:id", () => {
        // Input: A GET request with an invalid MongoDB ID format
        // Expected status code: 400
        // Expected behavior: Returns an error for invalid ID format
        // Expected output: An object with an 'error' property describing the validation failure
        test("getPotluckSessionsById with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .get('/potluck/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        // Input: A GET request with a valid but non-existent MongoDB ID
        // Expected status code: 404
        // Expected behavior: Returns a not found error
        // Expected output: An object with an 'error' property indicating the potluck was not found
        test("getPotluckSessionsById with non-existent ID", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .get(`/potluck/${nonExistentId}`)
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("POST /potluck", () => {
        // Input: A POST request with an empty body
        // Expected status code: 400
        // Expected behavior: Returns validation error for missing required fields
        // Expected output: An object with 'errors' property listing the missing required fields
        test("createPotluckSession with missing required fields", async () => {
            const res = await request(API_BASE_URL)
                .post('/potluck')
                .send({})
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A POST request with an invalid host ID format
        // Expected status code: 500
        // Expected behavior: Returns server error due to invalid MongoDB ID format
        // Expected output: An object with an 'error' property describing the server error
        test("createPotluckSession with invalid host ID format", async () => {
            const res = await request(API_BASE_URL)
                .post('/potluck')
                .send({
                    name: "Test Potluck",
                    date: new Date(),
                    host: "invalid-id",
                    participants: [],
                    ingredients: []
                })
                .agent(agent);
            
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        });

        // Input: A POST request with a valid but non-existent host ID
        // Expected status code: 404
        // Expected behavior: Returns not found error for non-existent host
        // Expected output: An object with an 'error' property indicating the host was not found
        test("createPotluckSession with non-existent host", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .post('/potluck')
                .send({
                    name: "Test Potluck",
                    date: new Date(),
                    host: nonExistentId,
                    participants: [],
                    ingredients: []
                })
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("PUT /potluck/:id/ingredients", () => {
        // Input: A PUT request with an invalid potluck ID and valid participant data
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with 'errors' property describing the validation failure
        test("addPotluckIngredientsToParticipant with invalid potluck ID", async () => {
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put('/potluck/invalid-id/ingredients')
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1"]
                })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with valid IDs but empty ingredients array
        // Expected status code: 400
        // Expected behavior: Returns validation error for empty ingredients array
        // Expected output: An object with 'errors' property indicating ingredients array cannot be empty
        test("addPotluckIngredientsToParticipant with empty ingredients", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/potluck/${validId}/ingredients`)
                .send({
                    participantId: validParticipantId,
                    ingredients: []
                })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with non-existent potluck ID and valid ingredients
        // Expected status code: 404
        // Expected behavior: Returns not found error for non-existent potluck
        // Expected output: An object with an 'error' property indicating the potluck was not found
        test("addPotluckIngredientsToParticipant with non-existent potluck", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/potluck/${nonExistentId}/ingredients`)
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1", "ingredient2"]
                })
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("DELETE /potluck/:id/ingredients", () => {
        // Input: A DELETE request with an invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with 'errors' property describing the validation failure
        test("removePotluckIngredientsFromParticipant with invalid potluck ID", async () => {
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .delete('/potluck/invalid-id/ingredients')
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1"]
                })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A DELETE request with non-existent potluck ID and valid ingredients
        // Expected status code: 404
        // Expected behavior: Returns not found error for non-existent potluck
        // Expected output: An object with an 'error' property indicating the potluck was not found
        test("removePotluckIngredientsFromParticipant with non-existent potluck", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .delete(`/potluck/${nonExistentId}/ingredients`)
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1", "ingredient2"]
                })
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("PUT /potluck/:id/participants", () => {
        // Input: A PUT request with an invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with 'errors' property describing the validation failure
        test("addPotluckParticipants with invalid potluck ID", async () => {
            const res = await request(API_BASE_URL)
                .put('/potluck/invalid-id/participants')
                .send({
                    participants: [new mongoose.Types.ObjectId().toString()]
                })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with valid potluck ID but empty participants array
        // Expected status code: 400
        // Expected behavior: Returns validation error for empty participants array
        // Expected output: An object with 'error' property indicating participants array cannot be empty
        test("addPotluckParticipants with empty participants", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/potluck/${validId}/participants`)
                .send({
                    participants: []
                })
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        // Input: A PUT request with non-existent potluck ID and valid participants
        // Expected status code: 404
        // Expected behavior: Returns not found error for non-existent potluck
        // Expected output: An object with an 'error' property indicating the potluck was not found
        test("addPotluckParticipants with non-existent potluck", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/potluck/${nonExistentId}/participants`)
                .send({
                    participants: [new mongoose.Types.ObjectId().toString()]
                })
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("PUT /potluck/AI/:id", () => {
        // Input: A PUT request with an invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with 'errors' property describing the validation failure
        test("updatePotluckRecipesByAI with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .put('/potluck/AI/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A PUT request with non-existent potluck ID
        // Expected status code: 404
        // Expected behavior: Returns not found error for non-existent potluck
        // Expected output: An object with an 'error' property indicating the potluck was not found
        test("updatePotluckRecipesByAI with non-existent potluck", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .put(`/potluck/AI/${nonExistentId}`)
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("DELETE /potluck/:id", () => {
        // Input: A DELETE request with an invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with 'errors' property describing the validation failure
        test("endPotluckSession with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .delete('/potluck/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

        // Input: A DELETE request with non-existent potluck ID
        // Expected status code: 404
        // Expected behavior: Returns not found error for non-existent potluck
        // Expected output: An object with an 'error' property indicating the potluck was not found
        test("endPotluckSession with non-existent potluck", async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const res = await request(API_BASE_URL)
                .delete(`/potluck/${nonExistentId}`)
                .agent(agent);
            
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });
}); 