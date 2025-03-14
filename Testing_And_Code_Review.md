# M5: Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Back-end Test Specification: APIs

### 2.1. Locations of Back-end Tests and Instructions to Run Them

#### 2.1.1. Tests

| **Interface**                                | **Describe Group Location, No Mocks**                                    | **Describe Group Location, With Mocks**                                | **Mocked Components**              |
|---------------------------------------------|------------------------------------------------------------------------|----------------------------------------------------------------------|-----------------------------------|
| **GET /ingredients**                         | `tests/jest_unmocked/getAllIngredients_um.test.ts`                      | `tests/jest_mocked/getAllIngredients_m.test.ts`                        | Ingredients DB                     |
| **GET /ingredients/id/:id**                  | `tests/jest_unmocked/getIngredientById_um.test.ts`                      | `tests/jest_mocked/getIngredientById_m.test.ts`                        | Ingredients DB                     |
| **GET /ingredients/name**                    | `tests/jest_unmocked/getIngredientByName_um.test.ts`                    | `tests/jest_mocked/getIngredientByName_m.test.ts`                      | Ingredients DB                     |
| **POST /ingredients**                        | `tests/jest_unmocked/postNewIngredient_um.test.ts`                      | `tests/jest_mocked/postNewIngredient_m.test.ts`                        | Ingredients DB                     |
| **PUT /ingredients/:id**                     | `tests/jest_unmocked/putIngredientById_um.test.ts`                      | `tests/jest_mocked/putIngredientById_m.test.ts`                        | Ingredients DB                     |
| **DELETE /ingredients/:id**                  | `tests/jest_unmocked/deleteIngredientById_um.test.ts`                   | `tests/jest_mocked/deleteIngredientById_m.test.ts`                     | Ingredients DB                     |
| **GET /recipes**                            | `tests/jest_unmocked/getAllRecipes_um.test.ts`                          | `tests/jest_mocked/getAllRecipes_m.test.ts`                            | Recipes DB                         |
| **GET /recipes/id/:id**                     | `tests/jest_unmocked/getRecipeById_um.test.ts`                          | `tests/jest_mocked/getRecipeById_m.test.ts`                            | Recipes DB                         |
| **GET /recipes/name**                       | `tests/jest_unmocked/getRecipeByName_um.test.ts`                        | `tests/jest_mocked/getRecipeByName_m.test.ts`                          | Recipes DB                         |
| **GET /recipes/:id/getIngredientDetails**   | `tests/jest_unmocked/getIngredientsFromRecipeId_um.test.ts`            | `tests/jest_mocked/getIngredientsFromRecipeId_m.test.ts`               | Recipes DB, Ingredients DB         |
| **POST /recipes**                           | `tests/jest_unmocked/postNewRecipe_um.test.ts`                          | `tests/jest_mocked/postNewRecipe_m.test.ts`                            | Recipes DB                         |
| **POST /recipes/AI**                        | `tests/jest_unmocked/postNewRecipeFromAI_um.test.ts`                    | `tests/jest_mocked/postNewRecipeFromAI_m.test.ts`                      | Recipes DB, OpenAI API             |
| **PUT /recipes/:_id**                       | `tests/jest_unmocked/putRecipeById_um.test.ts`                          | `tests/jest_mocked/putRecipeById_m.test.ts`                            | Recipes DB                         |
| **DELETE /recipes/:_id**                    | `tests/jest_unmocked/deleteRecipeById_um.test.ts`                       | `tests/jest_mocked/deleteRecipeById_m.test.ts`                         | Recipes DB                         |
| **GET /users**                              | `tests/jest_unmocked/userBasicOperations_um.test.ts`                    | `tests/jest_mocked/userBasicOperations_m.test.ts`                      | Users DB                           |
| **GET /users/id/:id**                       | `tests/jest_unmocked/userBasicOperations_um.test.ts`                    | `tests/jest_mocked/userBasicOperations_m.test.ts`                      | Users DB                           |
| **GET /users/email/:email**                 | `tests/jest_unmocked/userBasicOperations_um.test.ts`                    | `tests/jest_mocked/userBasicOperations_m.test.ts`                      | Users DB                           |
| **POST /users**                             | `tests/jest_unmocked/userBasicOperations_um.test.ts`                    | `tests/jest_mocked/userBasicOperations_m.test.ts`                      | Users DB                           |
| **PUT /users/:id/name**                     | `tests/jest_unmocked/userBasicOperations_um.test.ts`                    | `tests/jest_mocked/userBasicOperations_m.test.ts`                      | Users DB                           |
| **DELETE /users/:id**                       | `tests/jest_unmocked/userBasicOperations_um.test.ts`                    | `tests/jest_mocked/userBasicOperations_m.test.ts`                      | Users DB                           |
| **PUT /users/:id/addFriend**                | `tests/jest_unmocked/userFriendOperations_um.test.ts`                   | `tests/jest_mocked/userFriendOperations_m.test.ts`                     | Users DB                           |
| **PUT /users/:id/deleteFriend**             | `tests/jest_unmocked/userFriendOperations_um.test.ts`                   | `tests/jest_mocked/userFriendOperations_m.test.ts`                     | Users DB                           |
| **GET /users/:id/friends**                  | `tests/jest_unmocked/userFriendOperations_um.test.ts`                   | `tests/jest_mocked/userFriendOperations_m.test.ts`                     | Users DB                           |
| **GET /potluck**                            | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |
| **GET /potluck/:id**                        | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |
| **POST /potluck**                           | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |
| **PUT /potluck/:id/ingredients**            | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |
| **DELETE /potluck/:id/ingredients**         | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |
| **PUT /potluck/:id/participants**           | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |
| **PUT /potluck/AI/:id**                     | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB, OpenAI API   |
| **DELETE /potluck/:id**                     | `tests/jest_unmocked/userPotluckOperations_um.test.ts`                  | `tests/jest_mocked/userPotluckOperations_m.test.ts`                    | Users DB, Potluck DB               |

#### 2.1.2. Commit Hash Where Tests Run

`[8d2c0a20309ba83a941876b4e66cb9d4d472a936]`

#### 2.1.3. Explanation on How to Run the Tests

1. **Clone the Repository**:

   - Open your terminal and run:
     ```
     git clone https://github.com/example/your-project.git
     ```
   - cd into Backend Folder
     ```
     cd updated_backend
     ```

2. **Run the Test with Coverage**
   - ```
     npm test --coverage
     ```

### 2.2. GitHub Actions Configuration Location

`~/.github/workflows/backend-tests.yml`

### 2.3. Jest Coverage Report Screenshots With Mocks

_(Placeholder for Jest coverage screenshot with mocks enabled)_

### 2.4. Jest Coverage Report Screenshots Without Mocks

_(Placeholder for Jest coverage screenshot without mocks)_

---

## 3. Back-end Test Specification: Tests of Non-Functional Requirements

### 3.1. Test Locations in Git

| **Non-Functional Requirement**  | **Location in Git**                              |
| ------------------------------- | ------------------------------------------------ |
| **Performance** | [`tests/jest_nonFunctionalReq/performance.test.ts`](#) |
| **Data Security**          | [`tests/jest_nonFunctionalReq/security.test.ts`](#) |

### 3.2. Test Verification and Logs

- **Performance**

  - **Verification:**
  This test suite focuses on the AI-driven recipe endpoint (POST /recipes/AI) to capture performance under worst-case conditions, such as large ingredient lists and occasional heavy loads. We send multiple sequential calls (e.g., 20 calls) in a single test run and measure how many complete in under 10 seconds. Our acceptance criterion is that 90% of calls finish below this threshold, ensuring acceptable user experience even in resource-intensive scenarios.
  - **Log Output**
    ```
       -------- Performance Results (All Responses) --------
         at tests/jest_nonFunctionalReq/performance.test.ts:58:15
     console.log
       Total calls:       20
         at tests/jest_nonFunctionalReq/performance.test.ts:59:15
     console.log
       Under 10s count:    19
         at tests/jest_nonFunctionalReq/performance.test.ts:60:15
     console.log
       Under 10s ratio:    95.0%
         at tests/jest_nonFunctionalReq/performance.test.ts:61:15
     console.log
       Average time (ms): 6340.70
         at tests/jest_nonFunctionalReq/performance.test.ts:62:15
     console.log
       -----------------------------------------------------
         at tests/jest_nonFunctionalReq/performance.test.ts:63:15
    PASS  tests/jest_nonFunctionalReq/performance.test.ts (128.541 s)
     Performance: All /recipes/AI calls, measure ratio <10s
       ✓ At least 90% of 20 calls respond under 10s (including errors) (126850 ms)
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
      Time:        128.587 s, estimated 205 s
      Ran all test suites matching /performance.test.ts/i.
    ```

- **Data Security**
  - **Verification:**
  In these tests, we ensure that sensitive user data (e.g., passwords, tokens, private notes) is never returned by the endpoints. The suite includes tests like:
     - ``GET /users/:id or GET /users/:id/friends``: verifying no password or tokens fields appear in the response.
     - ``GET /users/:id/recipes``: confirming that privateNotes or other private fields are omitted.
     - Rejecting malformed input (e.g., invalid user IDs) or unauthorized deletions with correct status codes.
Any endpoint that could potentially leak sensitive info is tested by performing real or mocked calls (depending on the test setup) and asserting that the response body does not contain disallowed fields.
  - **Log Output**
    ```
    PASS  tests/jest_nonFunctionalReq/security.test.ts (9.789 s)
     Unmocked Security Tests (Live API)
       Create User and Verify No Sensitive Fields
         ✓ POST /users with valid data => 201, no 'password' or 'tokens' (466 ms)
         ✓ POST /users with missing fields => 400 (287 ms)
         ✓ GET /users/email/:email => ensures no 'password' or 'tokens' (1250 ms)
       Friend List Security
         ✓ Create a friend user, then add to main user => no 'password' in final friend list (2117 ms)
       Saved Recipes Security
         ✓ GET /users/:id/recipes => no 'privateNotes' (1457 ms)
       Additional Data Security Checks
         ✓ GET /users/:id with invalid ID => 400 (578 ms)
         ✓ DELETE /users/:id => unauthorized if no auth => 404 (570 ms)
         ✓ GET /users/email/:email => ensures no 'password' or 'tokens' (832 ms)
      Test Suites: 1 passed, 1 total
      Tests:       8 passed, 8 total
      Snapshots:   0 total
      Time:        9.844 s
      Ran all test suites matching /security.test.ts/i.
    ```
---

## 4. Front-end Test Specification

### 4.1. Location in Git of Front-end Test Suite:

`frontend/src/androidTest/java/com/studygroupfinder/`

### 4.2. Tests

- **Use Case: Get Full Recipe Recommendation**

  - **Expected Behaviors:**
    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | 1. The user clicks the "Get Recommendation" button on the main page to access the "Get Recipe Recommendation" feature. | Open "Get Recommendation" page |
    | 2. The app displays the following UI components:<br> - Text Field labeled "Enter ingredients"<br> - Add Ingredient (button)<br> - Upload Image (button)<br> - View Image (button)<br> - Ingredient List Display (large rectangular container for added ingredients)<br> - Clear Ingredients (button)<br> - Cuisine Type (button)<br> - Preferences (button)<br> - Reset Cuisine Type and Preferences (button)<br> - Allow Partial Recipe Recommendations (toggle switch)<br> - Generate Recipes (button) | Check all UI components are present|
    | 3a. The user attempts to add an ingredient without entering any text input. | Click "Add Ingredient" |
    | 3a1. Display an error message: "Please enter at least one ingredient!" | Check dialog is opened with text: "Please enter at least one ingredient!" |
    | 3. The user enters a list of available ingredients and selects cuisine preferences. | Input "egg" in text field<br> Click "Add Ingredient" button<br> Input "tomato" in text field<br> Click "Add Ingredient" button<br> Check "egg" and "tomato" are added to the ingredient list recycler view<br> Click "Cuisine Type"<br> Select "Chinese"<br> Click "Apply"<br> Click "Preferences"<br> Change "Recipe Complexity" to "2" |
    | 4. The app sends a request to the AI API with the provided inputs. | Click "Generate Recipes" |
    | 5. The AI API returns a possible recipe to the user. | Requires backend API (not tested) |
    

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **Use Case: Participate In PotLuck**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | ...                | ...                 |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

- **Use Case: Manage Friends**

  - **Expected Behaviors:**

    | **Scenario Steps** | **Test Case Steps** |
    | ------------------ | ------------------- |
    | ...                | ...                 |

  - **Test Logs:**
    ```
    [Placeholder for Espresso test execution logs]
    ```

---

## 5. Automated Code Review Results

### 5.1. Commit Hash Where Codacy Ran

`[Insert Commit SHA here]`

### 5.2. Unfixed Issues per Codacy Category

_(Placeholder for screenshots of Codacy's Category Breakdown table in Overview)_

### 5.3. Unfixed Issues per Codacy Code Pattern

_(Placeholder for screenshots of Codacy's Issues page)_

### 5.4. Justifications for Unfixed Issues

- **Code Pattern: [Usage of Deprecated Modules](#)**

  1. **Issue**

     - **Location in Git:** [`src/services/chatService.js#L31`](#)
     - **Justification:** ...

  2. ...

- ...
