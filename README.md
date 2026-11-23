# Book Management System

A beginner-friendly book catalog built with Node.js, Express, and plain HTML, CSS, and JavaScript. The browser uses the Fetch API for every catalog operation.

## Requirements

- Node.js 18 or newer (the API test script uses the built-in Fetch API)
- npm

## Run in VS Code

Open this folder in VS Code, then run these commands in the integrated terminal:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in a browser. Use `npm run dev` to restart the server automatically when server files change, or `npm test` to exercise the API.

## REST API

Every response uses JSON for API routes. Book IDs are compared without regard to letter case.

| Method and route | Purpose | Successful response |
| --- | --- | --- |
| `GET /books` | Return the complete catalog. | `200` with an array of books |
| `GET /books/:id` | Find one book by ID. | `200` with the book; `404` if missing |
| `POST /books` | Add `{ "id", "title", "author", "price" }`. | `201`; `400` for invalid fields; `409` for duplicate ID |
| `PUT /books/:id` | Replace title, author, and price for an existing ID. | `200`; `400` for invalid fields; `404` if missing |
| `DELETE /books/:id` | Remove a book. | `200`; `404` if missing |

Prices must be finite, non-negative numbers. IDs, titles, and author names cannot be blank. Invalid JSON and unknown routes return JSON error messages.

## Application workflow

When the dashboard opens, it fetches the catalog and displays the current total and table. The add form sends a `POST`; the ID search fetches an individual book; Edit loads that book into the form and saves with `PUT`; Delete asks for confirmation and sends `DELETE`. After each successful change, the dashboard fetches the catalog again.

The sample books and all changes are kept in an in-memory JavaScript array. **Book data resets to the sample books whenever the server restarts.**
