# Campaign Chronicle

Campaign Chronicle is a static D&D campaign workspace built for GitHub Pages with Firebase handling live data and file storage.

## What this app does

- Create or join campaigns with a 6-character code
- Upload multiple maps and switch between them
- Upload player markers, move them freely, and resize them
- Draw directly on maps
- Use fog of war with reveal and cover tools
- Save shared campaign notes and private notes
- Show live player cursors and online presence
- Work on desktop and phones without a build step

## Project structure

- `index.html` - app layout
- `styles.css` - responsive UI and board styling
- `js/firebase.js` - Firebase app, auth, Firestore, and Storage setup
- `js/workspace.js` - live campaign logic
- `firestore.rules` - Firestore permissions
- `storage.rules` - Firebase Storage permissions

## Firebase setup

This project is already pointed at Firebase project `campaign-chronicle-pro`.

### 1. Enable Firebase products

In the Firebase console for `campaign-chronicle-pro`, enable:

- Authentication
- Firestore Database
- Storage

### 2. Enable Anonymous Auth

In Firebase Authentication:

1. Open `Authentication`
2. Open `Sign-in method`
3. Enable `Anonymous`

The app uses anonymous auth automatically so players can join fast without making accounts first.

### 3. Deploy Firestore and Storage rules

Install the Firebase CLI if you do not already have it:

```bash
npm install -g firebase-tools
```

Log in once:

```bash
firebase login
```

From this project folder, deploy the rules:

```bash
firebase deploy --only firestore:rules,storage
```

Because `firebase.json` and `.firebaserc` are included, the command above will use the rules already in this repo.

## GitHub Pages hosting

This app is plain HTML, CSS, and JavaScript, so GitHub Pages can host it directly.

### Option A: publish from the repository root

1. Push this project to GitHub
2. Open the repository on GitHub
3. Open `Settings`
4. Open `Pages`
5. Set the source to your main branch and the `/ (root)` folder
6. Save

GitHub Pages will then serve the root `index.html`.

### Option B: keep a separate deploy branch

If you want to keep unfinished work private on one branch and publish from another, use a `gh-pages` branch and point GitHub Pages at that branch instead.

## Local testing

Because this app uses ES modules, test it with a small local server instead of opening the file directly.

If Python is installed:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## First-time test checklist

After Firebase and GitHub Pages are set up:

1. Open the app
2. Save a player name and color
3. Create a campaign
4. Copy the join code
5. Open the app in a second browser or phone
6. Join the same campaign with the code
7. Upload a map
8. Upload a marker
9. Move the marker and confirm the other device sees it
10. Draw on the map
11. Turn fog on and reveal part of the map
12. Create a shared note page and a private note page

## Notes about security

The included Firebase rules are a solid starting point for a live prototype, but they are still broad:

- Any signed-in user can read a campaign document if they know the code
- Storage currently allows any signed-in user to read and write under `/campaigns/...`

That is usually okay for an early shared-table app, but if you want stricter permissions next, the next step should be locking Storage and campaign reads to verified members only.

## Next good upgrades

- DM-only controls for fog and map uploads
- Marker ownership locks
- Rich text notes
- Delete cleanup for Storage files and old subcollections
- Invite links instead of typed join codes
