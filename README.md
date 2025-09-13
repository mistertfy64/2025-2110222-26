# Chat with "Hatsune Miku"!

> [!NOTE]
> This webapp was made as coursework for Chulalongkorn University's 2025 offering of 2110222 (Introduction to Computer Engineering and Digital Technology).
> This webapp is NOT meant for production use, due to the poor coding practices used, as well as the tight time limits.

> [!NOTE]
> All fictional characters belong to their respective owners. No copyright infringement is intended.

Are you bored and/or wanted to find a Vocaloid to talk to? 
Now you can chat with an LLM pretend to be Hatsune Miku! 
While it may not be the real Hatsune Miku, it is definitely close enough that no one would notice! 

## Setup
To use this webapp, manual configuration is required for two parts of this web application: the MongoDB database and the OpenRouter API key.
After receiving the connection string for the MongoDB database and the token for the OpenRouter API, create a `.env` file in `/backend` with the following content:
```
OPENROUTER_API_KEY=[openrouter api token, without the bearer prefix]
MONGODB_URI=[mongodb connection string]
```

After that, install the dependencies required by the webapp on both the frontend and backend.

```bash
cd backend
npm i
```

```bash
cd frontend
npm i
```

Once complete, start both the frontend and backend. The webapp should now be usable.

The frontend can be accessed through port 39393, while the backend can be accessed through port 39399.