# 🧪 Manual API Testing Commands

## 1. Health Check
```bash
curl http://localhost:3000/health
```
**Expected:** `{"status":"healthy","timestamp":"...","uptime":...}`

## 2. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123!\",\"role\":\"agent\"}"
```
**Expected:** `{"message":"User registered successfully","user":{...}}`

## 3. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123!\"}"
```
**Expected:** `{"token":"eyJ...","user":{...}}`

## 4. Get Accounts (Replace YOUR_TOKEN)
```bash
curl -X GET http://localhost:3000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
**Expected:** `{"data":[],"total":0,"page":1,"limit":50,"totalPages":0}`

## 5. Create Account (Replace YOUR_TOKEN)
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"account_number\":\"TEST001\",\"customer_name\":\"Test Customer\",\"balance\":1000}"
```
**Expected:** Account object with ID

## 6. Test Rate Limiting (Run multiple times quickly)
```bash
for i in {1..10}; do curl http://localhost:3000/health; done
```
**Expected:** Should work fine (rate limit is 1000/minute)

## 7. Test Invalid Endpoints
```bash
curl http://localhost:3000/invalid-endpoint
```
**Expected:** `{"error":"Route not found"}`