# IntelliDish
CPEN 321 Project
## Workflow
Since we haven't deploy to cloud yet, you can test the project on your local machine.
1. Connect to **MongoDB**, the default client address is `mongodb://localhost:27017/`, you may change this in your local `services.ts` and add it to `.gitignore`.
2. Add the OpenAI key to your `.env` and name it as `OPENAI_API_KEY` to enable AI functionalities.
3. Under the main folder `/IntelliDish`, use command line to run `npx ts-node index.ts`.
