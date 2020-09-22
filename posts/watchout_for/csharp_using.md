```
Func<DbConnection, Task<T>> dbQuery = ...;

using (var db = new DbConnection()) {
    return dbQuery(db);
}
```

```
Func<Task<T>> thisWillFail = ...;

try {
    return thisWillFail();
} catch(Exception e) {
    Console.log("Why does this never log?");
}
```