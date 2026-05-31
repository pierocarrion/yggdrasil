# Workflow: Run Local Dev Environment

1. Copy `.env.local.example` to `.env.local` and fill in your credentials.
2. Start Firebase emulators: `firebase emulators:start --only auth,firestore,storage,functions`
3. In a separate terminal: `npm run dev`
4. App runs at http://localhost:3000
5. Emulator UI at http://localhost:4000
6. To run Functions locally: `cd functions && npm run serve`
