# Arena Dash — 2D Multiplayer Starter

A small real-time multiplayer browser game built with Node.js, Express, Socket.IO, and HTML Canvas.

## Requirements

- Node.js 18 or newer
- A browser

## Run on your computer

1. Extract this project folder.
2. Open a terminal in the `arena-dash` folder.
3. Run:

   ```bash
   npm install
   npm start
   ```

4. Open http://localhost:3000
5. Open the same address in a second browser tab to test two players.

## Upload to GitHub

1. Sign in at https://github.com/.
2. Create a new repository named `arena-dash`. For the simplest setup, make it private or public and do not add a README or other files (this folder already has one).
3. In a terminal opened inside this folder, run:

   ```bash
   git init
   git add .
   git commit -m "Create Arena Dash multiplayer game"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/arena-dash.git
   git push -u origin main
   ```

4. Replace `YOUR-USERNAME` with your GitHub username. Git may ask you to sign in through your browser.

If you don't have Git installed, use GitHub's web interface to create the repository and upload the extracted files and the `public` folder. Keep the folder structure exactly as shown.

## Deploy on Render for free

1. Sign in at https://render.com/.
2. Select **New + → Web Service**.
3. Connect your GitHub account and select `arena-dash`.
4. Configure:
   - **Name:** `arena-dash` (or another available name)
   - **Language/Runtime:** Node
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Create the Web Service and wait for the deploy to finish.
6. Open the `https://YOUR-SERVICE-NAME.onrender.com` URL shown by Render.
7. Open the URL in two tabs or ask a friend to open it. Choose different nicknames and move around.

## Updating your game

Edit the files, then run:

```bash
git add .
git commit -m "Describe your change"
git push
```

Render can automatically redeploy when you push to the connected branch.

## Important free-hosting notes

- Free Render web services can sleep after 15 minutes without inbound traffic and may take about a minute to wake up.
- The game is an early prototype: the shared world is in server memory, so positions and connected players reset when the server restarts.
- There are no accounts, persistent stats, matchmaking rooms, or anti-cheat system yet.
- Do not put passwords, API keys, or other secrets in the repository.
