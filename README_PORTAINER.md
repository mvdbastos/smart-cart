# Deploying Smart Cart to Portainer

This project includes Dockerfiles and a `docker-compose.yml` suitable for deployment via Portainer (Stacks).

## Architecture

| Service    | Role                            | Externally accessible |
|------------|---------------------------------|-----------------------|
| `postgres` | PostgreSQL 16 database          | No — internal only    |
| `server`   | Express/Prisma API (port 3001)  | No — internal only    |
| `client`   | React SPA served by nginx       | Yes — `CLIENT_PORT`   |

The `client` nginx container proxies `/api/*` requests to the `server` container internally, so only one port needs to be open to the outside.

## Deployment steps

1. In Portainer → **Stacks** → **Add stack**, paste or upload `docker-compose.yml`.

2. Set the following environment variables in the Portainer stack editor (see `.env.example` for all defaults):

   | Variable            | Description                                      | Default                                                         |
   |---------------------|--------------------------------------------------|-----------------------------------------------------------------|
   | `CLIENT_PORT`       | Host port for the web UI                         | `8081`                                                          |
   | `DATABASE_URL`      | Full Postgres connection string                  | `postgres://smartcart:smartcart_dev@postgres:5432/smartcart`   |
   | `JWT_SECRET`        | Secret used to sign auth tokens                  | *(required — set a strong random value)*                        |
   | `POSTGRES_USER`     | Postgres username                                | `smartcart`                                                     |
   | `POSTGRES_PASSWORD` | Postgres password                                | `smartcart_dev`                                                 |
   | `POSTGRES_DB`       | Postgres database name                           | `smartcart`                                                     |
   | `CLIENT_URL`        | Allowed CORS origin for the server               | `http://localhost:8081`                                         |
   | `VITE_API_URL`      | API base URL used by the React client at runtime | `http://localhost:3001/api`                                     |

3. Click **Deploy the stack**. Portainer will build the `server` and `client` images from source using the included Dockerfiles.

4. Access the app at `http://<your-host>:<CLIENT_PORT>` (default `:8081`).

## Notes

- No `.env` file is required on the host — all variables are supplied through the Portainer stack editor.
- `postgres` and `server` are not exposed outside the Docker network; all external traffic goes through the `client` nginx container which reverse-proxies `/api/` calls.
- `DATABASE_URL` must use the service name `postgres` as the host (already the default) so the server can reach the database container.

## Optional

- To use pre-built images instead of building from source, push the images to a registry and replace the `build:` blocks in `docker-compose.yml` with `image:` references.

## Troubleshooting

- **Prisma client errors at startup**: ensure `DATABASE_URL` is set correctly. Prisma client is generated at build time; migrations need to be applied separately or via a startup entrypoint.
- **nginx 502 on `/api/`**: the `server` container may still be starting. Check server logs with `docker logs smart-cart-server`.
- **Port conflict**: change `CLIENT_PORT` in the stack environment variables to a free port on your host.
