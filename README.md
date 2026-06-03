# GDmanCoaching

## Running with Railway MongoDB only

You do not need to keep MongoDB running on your computer if the app is deployed to Railway.

### Recommended setup

1. In Railway, add/provision MongoDB for the project.
2. In the web service variables, set one of these variables to the Railway MongoDB connection string:
   - `MONGO_URI` (preferred)
   - `MONGODB_URI`
   - `MONGO_URL`
   - `DATABASE_URL`
3. Redeploy the Railway service.
4. Use the Railway URL for the live site and sign in there.

### Local frontend with Railway backend

If you only want to edit the frontend locally and use Railway for the server/database, set this in the root `.env` file:

```bash
VITE_API_URL=https://YOUR-RAILWAY-APP.up.railway.app/api
```

Then run the frontend locally with `npm run dev`. Authentication, admin pages, and saved records will go through Railway instead of a local MongoDB instance.

### Local API without MongoDB

If the local API starts without a MongoDB connection string, database-backed requests now fail quickly with a clear `503` message instead of waiting on Mongoose buffering and eventually showing a generic server error.
