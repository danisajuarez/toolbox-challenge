#!/usr/bin/env sh
# Exercise 2: POST to httpbin.org reproducing the expected echo response.
# The body is passed with literal newlines and no indentation so that it is
# exactly 59 bytes, matching the expected Content-Length.
curl 'https://httpbin.org/post?type=authorization' \
  -H 'Content-Type: application/json' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: close' \
  -A 'curl/7.29.0' \
  --data-binary '{
"client_id": "1234",
"mail": "1@1.com",
"country": "AR"
}'
