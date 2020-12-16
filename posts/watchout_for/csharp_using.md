> :Hero src=https://unsplash.com/photos/S47fH1-Bk_s,
>       mode=light,
>       target=desktop,
>       leak=156px

> :Hero src=https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=600&fit=crop,
>       mode=light,
>       target=mobile,
>       leak=96px

> :Title
>
> CSharp Using statements with Task

> :Author name=Nathan Sweeney, 
>         avatar=../img/nathan_headshot.jpg, 
>         date=2020-09-18


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