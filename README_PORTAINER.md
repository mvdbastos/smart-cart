# Deploying Smart Cart to Portainer

This project includes Dockerfiles and a docker-compose stack suitable for deployment via Portainer (Stacks).

Steps:

1. Copy `.env.example` to `.env` and update secrets (JWT, DB password) before deploying.

2. In Portainer > Stacks > Add stack:
   - Upload or paste the `docker-compose.yml` from this repo.
   - Provide any environment variables (from `.env`) in the Stack editor or use a `.env` in the same folder on the Docker host.

3. Deploy the stack. Portainer will build the `server` and `client` images from the repository using the included Dockerfiles.

Notes:
- The `server` container exposes port 3001 and connects to the `postgres` service.
- The `client` is served by nginx on port 8080 (mapped to container port 80).
- The docker-compose uses the service name `postgres` so the DATABASE_URL defaults to `postgres://smartcart:smartcart_dev@postgres:5432/smartcart`.

Optional:
- If your registry is private or you prefer pre-building images, build and push images to your registry and change `docker-compose.yml` to use image tags instead of `build`.

Troubleshooting:
- If Prisma fails during build, ensure the DATABASE_URL is reachable or run `npx prisma generate` in the builder stage (it's attempted already).
- For production, consider running Prisma migrations separately or include a startup script to run migrations on first start.
