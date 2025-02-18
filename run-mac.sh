#!/bin/bash
open "http://localhost:3000"
cd "$(dirname "$0")" && npm run start
