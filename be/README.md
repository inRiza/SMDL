# SMDL Backend

## Setup

```sh
bun install
cp .env.example .env
```

## Database (Docker)

Jalankan PostgreSQL saja via Docker:

```sh
# start db
bun run db:up

# create tables + seed (first time setup)
bun run db:setup
```

Atau step-by-step:

```sh
bun run db:push   # sync schema ke database
bun run db:seed   # insert sample data
```

Stop database:

```sh
bun run db:down
```

## Development

```sh
bun run dev
```

Backend berjalan di `http://localhost:3001`

## Scripts

| Script | Description |
|--------|-------------|
| `db:up` | Start PostgreSQL container |
| `db:down` | Stop PostgreSQL container |
| `db:push` | Sync Prisma schema ke database |
| `db:generate:schema` | Generate Prisma client |
| `db:seed` | Insert sample documents |
