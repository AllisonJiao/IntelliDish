# IntelliDish
CPEN 321 Project
## Workflow
Since we haven't deploy to cloud yet, you can test the project on your local machine.
1. Connect to **MongoDB**, the default client address is `mongodb://localhost:27017/`, you may change this in your local `services.ts` and add it to `.gitignore`.
2. Add the OpenAI key to your `.env` and name it as `OPENAI_API_KEY` to enable AI functionalities.
3. Under the main folder `/IntelliDish`, use command line to run `npm run dev`.
## Deploy
To run our App on the docker, please ensure that you:
1. Stop all previous docker containers that run on the same port
2. Run the container named 'cpen321_intellidish' which is indicated in `docker-compose.yml`
3. Execute `docker compose up` in your terminal
4. If you changes anything and need to rebuild the docker,
    4.1 Run `docker compose down`
    4.2 Then `docker compose up --build`
