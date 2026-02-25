# Mongoose Conversion Quick Reference

## Common Prisma to Mongoose Conversions

### 1. Find Operations

| Prisma | Mongoose |
|--------|----------|
| `db.model.findUnique({ where: { id } })` | `Model.findById(id)` |
| `db.model.findUnique({ where: { email } })` | `Model.findOne({ email })` |
| `db.model.findMany()` | `Model.find()` |
| `db.model.findMany({ where: { status } })` | `Model.find({ status })` |
| `db.model.findFirst()` | `Model.findOne()` |

### 2. Create Operations

| Prisma | Mongoose |
|--------|----------|
| `db.model.create({ data: { ... } })` | `Model.create({ ... })` |
| `db.model.createMany({ data: [...] })` | `Model.insertMany([...])` |

### 3. Update Operations

| Prisma | Mongoose |
|--------|----------|
| `db.model.update({ where: { id }, data: { ... } })` | `Model.findByIdAndUpdate(id, { ... }, { new: true, runValidators: true })` |
| `db.model.updateMany({ where: { ... }, data: { ... } })` | `Model.updateMany({ ... }, { ... })` |
| `db.model.upsert({ where, create, update })` | `Model.findOneAndUpdate(where, update, { upsert: true, new: true })` |

### 4. Delete Operations

| Prisma | Mongoose |
|--------|----------|
| `db.model.delete({ where: { id } })` | `Model.findByIdAndDelete(id)` |
| `db.model.deleteMany({ where: { ... } })` | `Model.deleteMany({ ... })` |

### 5. Query Modifiers

| Prisma | Mongoose |
|--------|----------|
| `select: { field1: true, field2: true }` | `.select('field1 field2')` |
| `where: { field: value }` | `{ field: value }` |
| `orderBy: { field: 'asc' }` | `.sort({ field: 1 })` |
| `orderBy: { field: 'desc' }` | `.sort({ field: -1 })` |
| `skip: 10` | `.skip(10)` |
| `take: 20` | `.limit(20)` |
| `include: { relation: true }` | `.populate('relation')` |

### 6. Aggregation

| Prisma | Mongoose |
|--------|----------|
| `db.model.count({ where: { ... } })` | `Model.countDocuments({ ... })` |
| `db.model.aggregate({ _count: true })` | `Model.aggregate([...])` |

### 7. Transactions

**Prisma:**
```javascript
await db.$transaction([
  db.model1.create({ data: ... }),
  db.model2.create({ data: ... })
]);
```

**Mongoose:**
```javascript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await Model1.create([...], { session });
  await Model2.create([...], { session });
});
session.endSession();
```

### 8. Relations

**Prisma (nested create):**
```javascript
await db.submission.create({
  data: {
    sourceCode: "...",
    user: { connect: { id: userId } },
    problem: { connect: { id: problemId } }
  }
});
```

**Mongoose (direct reference):**
```javascript
await Submission.create({
  sourceCode: "...",
  userId: userId,  // Direct ObjectId reference
  problemId: problemId
});
```

### 9. Populate (Include)

**Prisma:**
```javascript
const submission = await db.submission.findUnique({
  where: { id },
  include: {
    user: true,
    problem: true
  }
});
```

**Mongoose:**
```javascript
const submission = await Submission.findById(id)
  .populate('userId')
  .populate('problemId');
```

**Mongoose (with field selection):**
```javascript
const submission = await Submission.findById(id)
  .populate('userId', 'name email')
  .populate('problemId', 'title difficulty');
```

### 10. Error Handling

**Prisma:**
```javascript
catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
    }
  }
}
```

**Mongoose:**
```javascript
catch (error) {
  if (error.name === 'ValidationError') {
    // Validation error
  }
  if (error.name === 'CastError') {
    // Invalid ObjectId
  }
  if (error.code === 11000) {
    // Duplicate key error
  }
}
```

## Important Differences

### 1. ID Field
- **Prisma**: `id` (string UUID)
- **Mongoose**: `_id` (ObjectId)
- **Always convert to string**: `user._id.toString()`

### 2. Enum Values
- **Prisma**: `UserRole.ADMIN` (imported enum)
- **Mongoose**: `'ADMIN'` (string with schema validation)

### 3. JSON Fields
- **Prisma**: `Json` type
- **Mongoose**: `Schema.Types.Mixed`

### 4. Timestamps
- **Prisma**: `@default(now())` and `@updatedAt`
- **Mongoose**: `timestamps: true` option

### 5. Unique Constraints
- **Prisma**: `@unique` decorator
- **Mongoose**: `unique: true` in schema + `sparse: true` for nullable fields

### 6. Default Values
- **Prisma**: `@default(value)`
- **Mongoose**: `default: value` in schema

### 7. Required Fields
- **Prisma**: Field without `?` is required
- **Mongoose**: `required: true` in schema

## Performance Tips

1. **Use lean() for read-only queries:**
   ```javascript
   const users = await User.find().lean(); // Returns plain objects
   ```

2. **Select only needed fields:**
   ```javascript
   const users = await User.find().select('name email');
   ```

3. **Use indexes:**
   ```javascript
   schema.index({ field: 1 });
   schema.index({ field1: 1, field2: 1 }); // Compound index
   ```

4. **Batch operations:**
   ```javascript
   await Model.insertMany(documents); // Faster than multiple creates
   ```

## Common Pitfalls

1. **Forgetting `new: true` in updates:**
   ```javascript
   // ❌ Returns old document
   await Model.findByIdAndUpdate(id, data);
   
   // ✅ Returns updated document
   await Model.findByIdAndUpdate(id, data, { new: true });
   ```

2. **Not handling null from findById:**
   ```javascript
   const doc = await Model.findById(id);
   if (!doc) {
     return res.status(404).json({ error: 'Not found' });
   }
   ```

3. **Forgetting to convert ObjectId to string:**
   ```javascript
   // ❌ Sends ObjectId object
   res.json({ id: user._id });
   
   // ✅ Sends string
   res.json({ id: user._id.toString() });
   ```

4. **Not enabling validators on update:**
   ```javascript
   // ❌ Skips validation
   await Model.findByIdAndUpdate(id, data);
   
   // ✅ Runs validation
   await Model.findByIdAndUpdate(id, data, { runValidators: true });
   ```
