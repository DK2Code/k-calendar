# Sunny Week

Sunny Week is a private-by-default family activity planner. Parents can add, edit, duplicate, delete, and filter activities, switch between week and month views, and export a kid-friendly PDF with printable checkboxes.

Calendar data stays in the browser's local storage. No account, backend, or paid service is required.

## Run locally

Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Verify the project

```bash
npm test
npm run typecheck
npm run build
```

The production site is generated in `dist/client`.

## Export a PDF

Choose **Week** or **Month**, select any filters you want, and press **Export PDF**. In the browser print dialog, choose **Save as PDF**. The print layout uses landscape orientation and works with A4 and US Letter paper.

## Calendar backups

Open **Data** to download all saved activities as JSON, restore a previous JSON backup, or clear the calendar. Importing a backup replaces the current activity list, so download a backup first if needed.

## Publish with GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Run the **Deploy Sunny Week to GitHub Pages** workflow, or push another commit to `main`.

The included workflow automatically configures the repository subpath, runs the tests, builds the static site, and publishes `dist/client`.

## Browser support and privacy

Sunny Week works in current versions of Chrome, Edge, Firefox, and Safari. Activities are saved only on the current device and browser unless a parent downloads and transfers a JSON backup.
