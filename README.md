# Building Maintenance Manager

A mobile-first Progressive Web App for managing building maintenance, collections, and expenses.

## Files

```
dist/
├── index.html      — Main HTML (single page app)
├── app.js          — All JavaScript logic
├── styles.css      — All CSS styles
├── manifest.json   — PWA manifest
├── sw.js           — Service worker (offline support)
├── .nojekyll       — Required for GitHub Pages
└── README.md       — This file
```

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push the contents of this `dist/` folder to the **root** of the repo (or `gh-pages` branch)
3. Go to **Settings → Pages** → set source to `main` branch, `/ (root)` folder
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/`

## Login

- **Username:** `admin`
- **Password:** `admin123`

## Features

- Dashboard with live fund summary
- Maintenance — generate monthly records, mark paid
- Other Collection — painting fund, festival, donations, etc.
- Expenses — track all building expenses
- Reports — monthly/yearly/custom with Print & CSV export
- Flats — manage up to 12 flats
- Settings — building name, default amount, custom types
- PWA — installable, works offline after first load
- All data stored in browser LocalStorage (no server needed)
