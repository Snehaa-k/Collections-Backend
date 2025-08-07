# 🔐 Password Examples for Testing

## ✅ Current Validation (Simple)
- **Rule:** Minimum 8 characters
- **Examples:**
  - `password123` ✅
  - `admin1234` ✅
  - `test12345` ✅
  - `simple123` ✅

## 🔒 Strong Password Validation (Optional)
If you want to enable strong passwords later, use this regex:
```javascript
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain: lowercase, uppercase, number, special character')
```

**Strong Password Examples:**
- `Password123!` ✅
- `Admin@2024` ✅
- `Test$123` ✅
- `Secure#456` ✅

## 🧪 Test in Swagger
1. Go to: http://localhost:3000/api-docs
2. Try POST /api/auth/register
3. Use any password with 8+ characters