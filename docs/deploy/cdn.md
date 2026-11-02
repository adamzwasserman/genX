# Deploying to cdn.genx.software

The CDN serves the R2 bucket `genx-cdn`. Object keys mirror the URL path, so
`cdn-deploy/v1/bindx.min.js` is served at `https://cdn.genx.software/v1/bindx.min.js`.

## 1. Build

`npm run build` runs `scripts/build-hashed.js`. It copies the minified files
into `cdn-deploy/v1`, adds an 8-character md5 hash to each name, writes
`cdn-deploy/v1/manifest.json`, and updates the bootloader reference in
`site/genx-demo.html`. Commit the manifest and the demo page with the code.

## 2. Find the changed files

Compare each file in `cdn-deploy/v1` with the live copy and upload only the
ones that differ:

```sh
cd cdn-deploy/v1
for f in $(find . -type f | sed 's|^\./||'); do
  curl -s -o /tmp/live.bin "https://cdn.genx.software/v1/$f"
  cmp -s "$f" /tmp/live.bin || echo "$f"
done > /tmp/genx-changed.txt
```

Before uploading, save the live copies of those files so you can roll back.

## 3. Upload with wrangler

Wrangler reads the API token from the environment. Set the account ID and
upload each changed file, then upload `manifest.json` last:

```sh
export CLOUDFLARE_ACCOUNT_ID=<genX Cloudflare account ID>
while read -r f; do
  ct=application/javascript; [ "$f" = manifest.json ] && ct=application/json
  wrangler r2 object put "genx-cdn/v1/$f" --file "$f" --content-type "$ct" --remote
done < <(grep -v "^manifest.json$" /tmp/genx-changed.txt; grep "^manifest.json$" /tmp/genx-changed.txt)
```

`--remote` is required; without it wrangler writes to a local emulator.

## 4. Purge only the changed URLs

Purge with `CF_ZONE_ID_GENX` and `CF_API_TOKEN` from the environment, the same
call `.githooks/pre-commit` makes. Never paste a token into the command or a
file:

```sh
URLS=$(sed 's|^|https://cdn.genx.software/v1/|' /tmp/genx-changed.txt \
  | node -e 'const l=require("fs").readFileSync(0,"utf8").trim().split("\n");console.log(JSON.stringify({files:l}))')
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID_GENX}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$URLS"
```

The response must contain `"success":true`.

## 5. Verify

Rerun the loop in step 2. It should print nothing; every live file should
be byte-identical to `cdn-deploy/v1`, the manifest included.
