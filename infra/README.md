# Atlas production services

Deploy the Next.js application and `services/market-gateway` as separate ECS
services behind TLS-enabled load balancers. The gateway needs `DATABENTO_API_KEY`
and `REDIS_URL` from AWS Secrets Manager; neither value belongs in the browser.

For local gateway development:

```powershell
$env:DATABENTO_API_KEY = "replace-me"
docker compose -f infra/docker-compose.live.yml up --build
```

Set `NEXT_PUBLIC_LIVE_GATEWAY_URL=wss://market.your-domain.com/ws` in the web
service for production. Configure health checks against `/health` and keep the
gateway in the same AWS region used for its Redis instance.
