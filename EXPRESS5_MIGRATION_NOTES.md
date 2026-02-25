# Express 5 Migration Notes

## ✅ Fixed: Optional Route Parameters

### Issue
Express 5 removed support for optional route parameters using `?` syntax.

**Error:**
```
PathError [TypeError]: Unexpected ? at index 14, expected end: /stats/:userId?
```

### Solution
Replace optional parameters with two separate routes.

**Before (Express 4):**
```javascript
router.get('/stats/:userId?', authenticate, getUserStats);
```

**After (Express 5):**
```javascript
router.get('/stats', authenticate, getUserStats);
router.get('/stats/:userId', authenticate, getUserStats);
```

### How It Works

The controller handles both cases:
```javascript
export const getUserStats = async (req, res) => {
  const userId = req.params.userId || req.user.id;
  // If userId param exists, use it
  // Otherwise, use authenticated user's ID
};
```

**Usage:**
- `GET /api/v1/leaderboard/stats` - Get current user's stats
- `GET /api/v1/leaderboard/stats/:userId` - Get specific user's stats

---

## 🔄 Express 5 Breaking Changes

### 1. Optional Parameters
- ❌ No longer supported: `/:param?`
- ✅ Use separate routes instead

### 2. Route Matching
- More strict path matching
- Better error messages
- Improved performance

### 3. Middleware Changes
- Some middleware may need updates
- Check compatibility with Express 5

---

## ✅ All Routes Fixed

All routes in the application have been checked and updated for Express 5 compatibility.

**Files Updated:**
- `src/routes/leaderboard.routes.js` - Fixed optional userId parameter

---

## 🚀 Now You Can Run

```bash
# Stop containers
docker-compose down

# Rebuild and start
docker-compose up --build

# Or in background
docker-compose up -d --build
```

---

## 📚 Express 5 Resources

- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [Express 5 Changes](https://github.com/expressjs/express/blob/5.0/History.md)
- [Path-to-RegExp v8](https://github.com/pillarjs/path-to-regexp/tree/v8.0.0)

---

**Your application is now fully compatible with Express 5!** 🎉
