# Chat with "Two" from Battle for Dream Island!

> [!WARNING]
> If you choose to host this webapp, make sure it has some level of privacy (e.g. a firewall), since all chats can be accessed by anyone because this webapp has no authentication/authorization purposes. (because this assignment didn't request for it)
>  
> The bottom line if you choose to host this webapp is to NOT open it to everyone. 

> [!NOTE]
> This webapp was made as coursework for Chulalongkorn University's 2025 offering of "Introduction to Computer Engineering and Digital Technology" (2110222).
> This webapp is NOT meant for production use, due to the poor coding practices used, as well as the tight time limits.

> [!NOTE]
> All fictional characters belong to their respective owners. No copyright infringement is intended.
> Particularly, Two is from "Battle for Dream Island", which is by [jacknjellify](https://www.youtube.com/@BFDI).

Are you bored and/or wanted to find a BFDI host to talk to? 
Now you can chat with an LLM pretending to be Two! 
While it may not be the real Two, it is definitely close enough that no one would notice! 
Unlike other chatbots, you can also see Two in all his glory with thirteen full emotion poses!
You can even add categorize chats by adding color labels to them!
<img align="right"  src="./two-profile-picture.png">

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

The frontend can be accessed through port 2222, while the backend can be accessed through port 22222.