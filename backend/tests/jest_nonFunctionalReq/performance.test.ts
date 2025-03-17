import { describe, expect, test } from "@jest/globals";
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const largeIngredientList: string[] = [
    "chicken breast",
    "red onion",
    "garlic cloves",
    "olive oil",
    "balsamic vinegar",
    "tomatoes",
    "spinach",
    "bell peppers",
    "cilantro",
    "mushrooms"
  ];
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function api() {
  return request(API_BASE_URL);
}

describe("Performance: All /recipes/AI calls, measure ratio <10s", () => {
    test("At least 90% of 20 calls respond under 10s (including errors)", async () => {
      const totalCalls = 20;
      const thresholdMs = 10000;
  
      const durations: number[] = [];
  
      for (let i = 0; i < totalCalls; i++) {
        const startTime = Date.now();
        try {
          // The AI call. Adjust body as needed.
          await api()
            .post("/recipes/AI")
            .agent(httpsAgent)
            .send({
              ingredients: largeIngredientList, 
            })
            ;
        } catch {
          // even if there's a request error, measure the time
        } finally {
          const elapsed = Date.now() - startTime;
          durations.push(elapsed);
        }
      }
  
      const underCount = durations.filter((d) => d < thresholdMs).length;
      const ratio = underCount / totalCalls;
  
      // 2) Average time across all calls (including errors)
      const sumMs = durations.reduce((a, b) => a + b, 0);
      const avgMs = sumMs / totalCalls;
  
      console.log("-------- Performance Results (All Responses) --------");
      console.log(`Total calls:       ${totalCalls}`);
      console.log(`Under 10s count:    ${underCount}`);
      console.log(`Under 10s ratio:    ${(ratio * 100).toFixed(1)}%`);
      console.log(`Average time (ms): ${avgMs.toFixed(2)}`);
      console.log("-----------------------------------------------------");
  
      expect(ratio).toBeGreaterThanOrEqual(0.9);
    }, 600000);
  });