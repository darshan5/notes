# Notes API Documentation

Base URL: `https://notes.darshanp.workers.dev`

## Authentication

All endpoints require authentication via one of:

- **API Key** — `x-api-key` header with a user-generated key (created in Settings)
- **Session Cookie** — `session` cookie set after login
- **Bearer Token** — `Authorization: Bearer <token>` header

### Generate an API Key

Log in to the app, go to **Settings > API Keys**, enter a name, and click **Create**. Copy the key immediately — it won't be shown again.

---

## Endpoints

### List Notes

```
GET /api/notes
```

Returns all notes for the authenticated user, ordered by pinned first, then most recently updated.

**Response:**

```json
{
  "notes": [
    {
      "id": "8c94e980-eabd-4986-99fc-c6f478353223",
      "title": "My Note",
      "body": "Note content here",
      "pinned": false,
      "tags": ["work", "ideas"],
      "createdAt": "2026-06-16T08:46:22.000Z",
      "updatedAt": "2026-06-18T04:04:06.000Z"
    }
  ]
}
```

**Example:**

```bash
curl -s -H "x-api-key: YOUR_API_KEY" \
  https://notes.darshanp.workers.dev/api/notes
```

---

### Search Notes

```
GET /api/notes/search?q=<query>
```

Full-text search across title, body, and tags. Tag matches are prioritized in results. Pinned notes appear first within each group.

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `q`   | Yes      | Search query string |

**Response:** Same format as List Notes.

**Example:**

```bash
curl -s -H "x-api-key: YOUR_API_KEY" \
  "https://notes.darshanp.workers.dev/api/notes/search?q=ideas"
```

---

### Get Note

```
GET /api/notes/:id
```

Returns a single note by ID.

**Response:**

```json
{
  "id": "8c94e980-eabd-4986-99fc-c6f478353223",
  "title": "My Note",
  "body": "Note content here",
  "pinned": false,
  "tags": ["work", "ideas"],
  "createdAt": "2026-06-16T08:46:22.000Z",
  "updatedAt": "2026-06-18T04:04:06.000Z"
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 404    | Note not found or not owned by user |

**Example:**

```bash
curl -s -H "x-api-key: YOUR_API_KEY" \
  https://notes.darshanp.workers.dev/api/notes/8c94e980-eabd-4986-99fc-c6f478353223
```

---

### Create Note

```
POST /api/notes
```

**Request Body:**

| Field    | Type     | Required | Default | Description |
|----------|----------|----------|---------|-------------|
| `title`  | string   | No       | `""`    | Note title |
| `body`   | string   | No       | `""`    | Note body (plaintext) |
| `tags`   | string[] | No       | `[]`    | Free-form tags (lowercase) |
| `pinned` | boolean  | No       | `false` | Pin to top of list |

**Response:** `201` with the created note object.

```json
{
  "id": "bc6ae0e7-b178-4023-99f3-b5a67ea66909",
  "title": "API Test",
  "body": "Created via API",
  "pinned": false,
  "tags": ["test", "api"],
  "createdAt": "2026-06-18T04:07:31.751Z",
  "updatedAt": "2026-06-18T04:07:31.751Z"
}
```

**Example:**

```bash
curl -s -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Meeting Notes","body":"Discuss Q3 roadmap","tags":["work","meetings"]}' \
  https://notes.darshanp.workers.dev/api/notes
```

---

### Update Note

```
PUT /api/notes/:id
```

Partial updates — only include fields you want to change.

**Request Body:**

| Field    | Type     | Description |
|----------|----------|-------------|
| `title`  | string   | New title |
| `body`   | string   | New body |
| `tags`   | string[] | Replace all tags |
| `pinned` | boolean  | Pin/unpin |

**Response:** `200` with the full updated note object.

**Errors:**

| Status | Description |
|--------|-------------|
| 404    | Note not found or not owned by user |

**Example:**

```bash
curl -s -X PUT \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"body":"Updated content","tags":["work","updated"]}' \
  https://notes.darshanp.workers.dev/api/notes/8c94e980-eabd-4986-99fc-c6f478353223
```

---

### Delete Note

```
DELETE /api/notes/:id
```

Hard deletes a note. This cannot be undone.

**Response:**

```json
{
  "success": true
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 404    | Note not found or not owned by user |

**Example:**

```bash
curl -s -X DELETE \
  -H "x-api-key: YOUR_API_KEY" \
  https://notes.darshanp.workers.dev/api/notes/8c94e980-eabd-4986-99fc-c6f478353223
```

---

## Common Errors

| Status | Description |
|--------|-------------|
| 401    | Missing or invalid authentication |
| 400    | Bad request (missing required fields) |
| 404    | Resource not found |
| 409    | Conflict (e.g. duplicate email) |

All error responses follow this format:

```json
{
  "error": "Description of the error"
}
```
