# Brave Extension Store
(work in progress)

What will be the official experience for finding/installing extensions for the [Brave web browser](https://github.com/brave/brave-browser).

## Running from source
This project contains both the client and server portion of the extension store.

### server side
The server side uses [hapi.js](https://hapijs.com/) to host a REST API with a few important routes:
- `/brave-extension-store` - fetch (in JSON) all extensions available from Brave Extension Store
- `/brave-extension-store/{extensionId}` - fetch all data (in JSON) about a single extension from Brave Extension Store
- `/store` - the page exposed to clients (entry point for the web experience)


### client side
The "client" is a static HTML page being served using hapi.js ([see `server side` notes above](#server-side)). Before running, webpack compiles the resources needed for a proper React environment. The client (when served) then makes server side calls to fetch the data needed.

### how to run
After cloning, running should be as easy as:
```
npm install
npm run server
```

At this point, you can connect using a browser to http://localhost:8000/store
