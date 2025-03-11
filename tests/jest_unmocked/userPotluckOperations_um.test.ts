import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: Potluck Operations", () => {
    describe("GET /potluck", () => {
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
        test("getPotluckSessionsById with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .get('/potluck/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

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
        test("createPotluckSession with missing required fields", async () => {
            const res = await request(API_BASE_URL)
                .post('/potluck')
                .send({})
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

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
        test("updatePotluckRecipesByAI with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .put('/potluck/AI/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

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
        test("endPotluckSession with invalid ID", async () => {
            const res = await request(API_BASE_URL)
                .delete('/potluck/invalid-id')
                .agent(agent);
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });

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