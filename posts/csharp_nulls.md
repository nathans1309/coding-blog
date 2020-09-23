> :Title lead=an unknown crack in the foundation of your code
>
> NULL


> :Author name=Nathan Sweeney, 
>         avatar=img/nathan_headshot.jpg, 
>         date=2020-09-18


My number one rule during a code review is to find, expose and exterminate run-time errors. There is one who is well known as the best deceiver, convincing your compiler that 'there is nothing to see here'.  It comes in different forms, but best known as `Null Reference Exception`. I have gotten pretty good at whack-a-mole with null reference exceptions over the years but I'm occasionally surprised by the new and ingenious ways our opponent exploits. *In this article I'll be sharing what I've learned about handling nulls at the edge of my application and how to wrap them in a type that converts runtime errors into compile time errors.*

# Why null is bad
What does the following function return?
```csharp
Car BuyACar(int cost);
```
The obvious answer is that it returns a `Car` but let's look at the implementation to be sure.
```csharp
public Car BuyACar(int cost){
    return (Car) null;
}
```
Woops, actually it's null and when we use it like this
```csharp
var car = BuyACar(15000);
car.Start();
```
The compiler incorrectly and happily assures us that everything is ok. As good developers, we test our own code, so we would find this obvious flaw easily, but most of the time it's not so obvious. Maybe the following implementation is more realistic.
```csharp
public Car BuyACar(int cost){
    return FindCarAtTheDealershipInMyPriceRange(cost);
}
```
Now we can't be sure if the dealership will have the car when we go to pick it up. So our calling code might change to 
```csharp
var car = BuyACar(15000);

if(car == null) {
    car.Start();
}
```
This is acceptable code however I still feel uneasy that I'm relying on another developer to realize this null check. This makes the code that much less maintainable and I would rather let the compiler do it for us.

# What to watch for
In C#, theoretically any reference type can possibly be null and we should pay extra attention to code that interacts with external sources such as Database interactions, IO streams and Controller endpoints. These interactions are known as [side effects](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) which make our code harder to maintain, and harder to test. 

# How to handle nulls correctly
The bad news is that nulls will exist, but the good news is that we can get better and handling them. The best way to deal with a null is to wrap it into a type that forces calling code to handle it appropriately. If something is maybe null, then calling code should be forced to handle both a possible value or a possible null. Here is the first pass at a Maybe class.

```csharp
public class Maybe<T> {
  private T Value { get; set; }

  public Maybe(T value) {
    this.Value = value;
  }

  public U Match<U>(Func<T, U> handleValue, Func<U> handleNull) {
    if (Value == null) {
      return handleNull();
    } else {
      return handleValue(Value);
    }
  }
}
```

Now we can wrap null with this type as soon as possible and the type system will force us to handle the null case. This is great because now it becomes a compile-time error instead of a runtime error.
```csharp
public Maybe<Car> BuyACar(int cost){
    return new Maybe(FindCarAtTheDealershipInMyPriceRange(cost));
}
```

```csharp
BuyACar(15000);
  .Match(car => car.Start(), () => Log.Warning("No car found"));
```

Now anyone that calls our code will have to appease the type system!!
I really like how chaining makes the flow of the program readable and, in turn, more maintainable. As we add to this chain, we can think of it as a manufacturing line. Some raw data goes into the pipe and flows through a sequence of translations until being output as a usable product. The only problem is that the value is hidden inside the Maybe<>. Matching and constructing that type over and over is going to get really redundant and exhausting. So let's add another feature that gives us easy access.

```csharp
public class Maybe<T> {
  private T Value { get; set; }

  public Maybe(T value) {
    this.Value = value;
  }

  public U Match<U>(Func<T, U> handleValue, Func<U> handleNull) {
    if (Value == null) {
      return handleNull();
    } else {
      return handleValue(Value);
    }
  }

/*+*/ public Maybe<U> Map<U>(Func<T,U> handleValue) {
/*+*/   if(Value != null) {
/*+*/     return new Maybe(handleValue(Value));
/*+*/   }
/*+*/ }
}
```
 If the caller wants to Map the value to something else, the type system will force the map to happen inside of a null check.
 Also, since we didn't actually get the value out, we don't need to handle the null case. This is a perfect way to build the pipeline.
```csharp
BuyACar(15000);
  .Map(car => car.PutOnNewWheels())
  .Match(car => car.Start(), () => Log.Warning("No car found"));
```

If you found this interesting, I'll share the library that I have been using lately [LanguageExt](https://github.com/louthy/language-ext)