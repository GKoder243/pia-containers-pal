#!/bin/bash

curl -X POST http://localhost:3001/api/auth/login \\
-H "Content-Type: application/json" \\
-d '{
  "email": "admin@pia.tg",
  "mot_de_passe": "mot_de_passe_en_clair"
}'
