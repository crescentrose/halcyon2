---
title: "Errors in Rust: A Deep Dive"
date: 2020-06-02T22:30:00+02:00
draft: false
categories:
  - Rust
cover: "images/crustacean.jpg"
cover_alt: "a small orange crab in a white shell walking across a sandy beach"
description: "Rust's error handling is precise and curious - and in this article, we are going to take a look at why that is the case."
summary: "Rust's error handling is precise and curious - and in this article, we are going to take a look at why that is the case. I'll introduce you to the basics of errors in Rust and then explain some more advanced concepts of dealing with errors."
---

# Summary

Rust's error handling is precise and curious - and in this article, we are going to take a look at why that is the case. I'll introduce you to [**the basics**](#Option-what-if-null-but-sane) of errors in Rust and then explain some [**more advanced concepts**](#Making-your-own-error-types) of dealing with errors. Finally, I am **sharing a few tips of my own** that I wish I knew when I first started working with Rust.

This article is aimed at **Rust beginners and people who are curious about Rust** but are yet to make the jump. It should take you about **15 minutes** to read and understand, and you don't need any specific prior knowledge besides basic programming literacy.

---

# Introduction

Humans are decidedly not perfect. Errors and mistakes have been commonplace throughout history and have, in fact, shaped history. If Napoleon packed boots, us Europeans might still all be speaking French today.

Computers are as fallible as their creators, so today, there are about as many ways to deal with errors as there are programming languages. Let's take a look at some representative examples:

- C solves the problem of potential errors rather elegantly by having no direct error handling, so the obvious solution is just not to make mistakes. If you do accidentally make a mistake, your program will happily trudge through until it confuses itself enough to [segfault](https://en.wikipedia.org/wiki/Segmentation_fault). That thankfully never happens, and if it does happen, then it's your fault, not the language's, and you obviously should have predicted that.
- Ruby ~~throws exceptions~~ raises errors for the most egregious violations, but you also get an occasional `nil` in the mix. Ruby follows the [principle of least surprise](https://en.wikipedia.org/wiki/Principle_of_least_astonishment), so you will not be surprised in the least to get yet another notification of a `NoMethodFound` on a `nil` object from your  alerting tool.
- PHP developers are genuinely spoilt for choice - you can drop errors, exceptions, you may decide to return `null`, your method can return a `0` or, if you're feeling adventurous, even a `-1`. Most sane PHP developers have settled on using Java-style exceptions in modern code-bases, only resorting to handling error codes when dealing with obscure functions such as most of the ones in the standard library. Unfortunately, you will not always be dealing with modern code-bases, or, for that matter, with sane PHP developers.

Notice a pattern: the languages listed above treat errors as an **accidental byproduct.** Error handling is seemingly shoehorned into languages as an afterthought, as if someone on the design committee remembered that mistakes could only happen when most of the language was already designed and then saddled a poor intern with the task to find the best hack.

Rust does it differently - errors are **first-class citizens**, as equal in importance as any other data type. In fact, errors **are** data types, and its handling is enforced at compile time. You literally **can not compile a Rust program** that does not handle **all** of the errors that might pop up.

Let's take a look at some common patterns of handling errors in Rust.

# Option - what if `null`, but sane?

An `Option` is Rust's way of saying that your function might return something, but it also might not - in other words, you're getting `Some` or `None`. Let's take a look at this extremely contrived function that might return an Option.

```rust
fn how_many_bananas(banana_count: u8) -> Option<u8> {
  if banana_count > 0 {
    Some(banana_count)
  } else {
    None
  }
}

let some_bananas = how_many_bananas(10); // Some(10)
let no_bananas = how_many_bananas(0); // None
```

This code lets you express the possibility that there is a *lack* of something very concisely, and the function on the receiving end *must* deal with your `Option`. There's no way to extract the `banana_count` from the return value without doing something about the possibility of there being `None` bananas, even if that *something* is consciously ignoring it. 

An `Option` is Rust's answer to `null`, but just like `null` it tells us only that something is not there - not *why* is it not there. For that, you have to read on.

# Result - when something goes wrong

A `Result` expresses the possibility of something breaking in your function. A lot of Rust functions return various `Result` types, so expect to be seeing it a lot. The `Result` type will let you know if something went `Ok`, or if there was an `Err` - and which types to expect out of those two values. Let's rewrite our banana counter to return a `Result`:

```rust
fn how_many_bananas(banana_count: u8) -> Result<u8, String> {
    if banana_count > 0 {
        Ok(banana_count)
    } else {
        Err(String::from("We have no bananas!"))
    }
}

let some_bananas = how_many_bananas(10); // => Ok(10)
let no_bananas = how_many_bananas(0); // => Err("We have no bananas!")
```

Think of this pattern as being able to return *two* types from your function. Returning an error type also means that it's now someone else's problem, which is great if you're working in a team, but a little bit worse if that someone else is future you. As with an `Option`, you must deal with the possibility of the function returning an error before you can proceed with the happy path.

# Extracting data from Results

Having a Result is all nice and dandy, but you usually want to extract the value from inside of it and get on with your code. There are several different ways to do this - and it all depends on what you want to do.

## Pattern matching errors

A simple way of figuring out what's going on is to use [pattern matching](https://doc.rust-lang.org/book/ch06-02-match.html) on the result type.

```rust
match how_many_bananas(0) {
    Ok(number) => println!("You have {} bananas.", number),
    Err(error) => println!("{}", error)
}
```

In this case, we extract the `number` from our `Ok` Result, or `error` from our error result, and then do *something* with them. Pattern matching is an easy and obvious way of dealing with errors, but it can get a little bit verbose or messy if you wish to chain multiple method calls or if you are dealing with many functions that can return errors inside one function. For example, this pattern is common:

```rust
match do_something() {
    Ok(result) => do_something_else(result),
    Err(error) => return Err(error)
}
```

Writing 4 lines just to bubble up an error is not very efficient - we will soon discover how to make this more palatable, but before that, we will look at another common method of error handling.

## Unwrapping and expecting

Sometimes you have no patience for tedious pattern matching and just want to get on with it.

The `unwrap()` method lets you access the "good" value immediately at a slight cost - if the `Result` is an `Err`, your program panics and stops executing. This method is excellent when you're learning or rapidly prototyping something, but it could be pretty disastrous in a more extensive program. `unwrap()`  disregards Rust's error handling strategy by daring the compiler to fail if it *really* cares that much about the error that was raised.

```rust
let some_bananas = how_many_bananas(10).unwrap(); // => 10
let no_bananas = how_many_bananas(0).unwrap(); // => panic!
```

You can also use `expect()`, `unwrap()`'s older brother. `expect()` lets you provide your error message, but it won't do much more than that.

Another way of dealing with a Result is to **provide a default value** using the `unwrap_or()` function. `unwrap_or` lets you quietly fall back on a known good value in case of an error.

```rust
let no_bananas = how_many_bananas(0).unwrap_or(0); // => 0
```

Providing a default value is occasionally useful, but might be a source of subtle bugs - you will not know that an error happened and that a default was used, which might lead to confusion down the line.

{{<aside icon="💡">}}
There's an interesting interaction between the lifetime system and the *unwrap* function when chaining multiple instructions (e.g., `something.unwrap() .do_something_else()`) - the *unwrap* function will "swallow" the original value and return a temporary value, which does not live long enough to have methods called on it. The details are too complicated to explain here, but there's an interesting explanation on the [Rust forums](https://users.rust-lang.org/t/borrowed-value-does-not-live-long-enough/7225). Either way, remember not to be surprised if you're happily chaining method calls, and then the compiler suddenly complains that a "borrowed value does not live long enough".
{{</aside>}}

# Making your own error types

So far, our functions have returned a `String` as the error type. This works for smaller programs, but you don't want to rely on that for more than simple toy apps. A much more powerful way of dealing with errors is to use Rust's `std::error::Error` trait, which is implemented by all standard library errors and should be implemented by your errors as well. 

A **trait** is what you would call an **interface** in a language such as Java. There are, of course, differences, but that's a topic for another time.

A simple way to create custom error is to define them via an enum. 

```rust
#[derive(Debug)]
enum CustomErrors {
    NoBananas,
    TooManyBananas
}
```

Notice the `#[derive(Debug)]` attribute - this tells the compiler that you want to automatically generate code used to display debug information about your type. Attributes are a compelling feature of Rust - you can read more about them in the [Rust reference book](https://doc.rust-lang.org/reference/attributes.html).

To promote the `CustomErrors` enum to a full-blown error type, we need to implement the `Error` trait. Thankfully, Rust automatically generates most of the required code for us, so the implementation looks something like this:

```rust
use std::error::Error;

impl Error for CustomErrors {}
```

However, if we try to compile this, the compiler will complain:

```
error[E0277]: `CustomErrors` doesn't implement `std::fmt::Display`
 --> src/main.rs:9:6
  |
9 | impl Error for CustomErrors {}
  |      ^^^^^ `CustomErrors` cannot be formatted with the default formatter
  |
  = help: the trait `std::fmt::Display` is not implemented for `CustomErrors`
  = note: in format strings you may be able to use `{:?}` (or {:#?} for pretty-print) instead
```

The compiler helpfully lets us know that lack an implementation of the  `std::fmt::Display` trait on our error type. We need to implement this type so that Rust knows how to format our errors for output properly.

Implementing that is relatively easy - all we need to do is provide a `fmt` function that takes a reference to the error and a reference to the formatter struct. We can then use a handy `write!` macro to display details about our error message. To keep it simple, we will just say that there was an error and then output its name, which we can do thanks to the `#[derive(Debug)]` attribute on our errors enum.

```rust
use std::fmt;
impl fmt::Display for CustomErrors {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "error: {:?}", self)
    }
}
```

{{<aside icon="💡">}}
If this looks scary or complex, don't worry - it will all make sense when you delve deeper into Rust. For now, you can just think of this as a way to tell Rust what kind of message you want to see when your custom error gets triggered.
{{</aside>}}

From now on, we can use a  `Result<u8, CustomErrors>` return type for our functions and return `Err(CustomErrors::NoBananas)`. Since `CustomErrors` is just an enum, you can add your custom logic to it to determine how it will be displayed.

You can [click here to open this code in the Rust playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=d900da2059f5d2b8c3a206d7d3587c4f) and play around with it. Try changing the values or adding your errors (for example, `ExactlyFiveBananas`). 

# Bubble up your errors with `?`

When writing idiomatic Rust, you generally do not want to cause any side-effects in your libraries. Even if you're creating a CLI tool, you want to separate the output logic inside of your `main.rs` and offload computations and performing actions to a `lib.rs`. This pattern lets you re-use various parts of your CLI tools, as well as test them in isolation - but, more importantly for this article, it means that we don't want to cause any panics (as much as we can help it) or output anything to stdout/stderr.

So, if we don't want to deal with possible errors immediately, we need a way to bubble them up so that the caller function - ultimately `main()` or something as close to the top level of our program - can deal with them. You can do that with pattern matching, but it gets tedious:

```rust
fn thing_doer() -> Result<u8, CustomError> {
    match do_something() {
        Ok(value) => match do_something_else(value) {
            Ok(final_value) => Ok(final_value),
            Err(error) => return Err(error)
        },
        Err(error) => return Err(error)
    }
}

fn do_something() -> Result<u8, CustomError> { /* ... */ }
fn do_something_else(value: u8) -> Result<u8, CustomError> { /* ... */ }
```

Instead of doing this, we can instruct Rust to do the same thing using the `?` operator. The question-mark means "execute this statement, and if it returns an error, return with an error, otherwise unwrap the result." In practice, it might look something like this:

```rust
fn thing_doer() -> Result<u8, CustomError> {
    value = do_something()?;
    do_something_else(value)?
}
```

This is much cleaner! This code is functionally equivalent to its previous version, but reads nicer.

# Mixing and matching different errors

This works great if you're calling functions that all have the same error type - unfortunately, that is often not the case. Let's say that, for some reason, you're also opening a file in the middle of your `thing_doer` - and [as we can tell from the documentation](https://doc.rust-lang.org/std/fs/struct.File.html#method.open), the `File::open` function returns a Result that may contain a [std::io::Error](https://doc.rust-lang.org/std/io/struct.Error.html) type. 

This is not the same as `CustomError` . Your first instinct may be to change the return type so that it returns a `std::error::Error`, after all, that is the trait that is implemented both by our custom error types and the standard library ones. 

However, it turns out it's not so simple: since those are ultimately different types and the compiler won't know how much memory to allocate for each one, Rust refuses to build that program. This has 

To alleviate that, you can [use the Box type](https://doc.rust-lang.org/std/boxed/index.html). Using a Box, we allocate the memory required for our errors dynamically on the heap. Our code then looks something like this:

```rust
fn cold_banana_count() -> Result<u8, Box<dyn std::error::Error>> {
    let mut fridge = File::open("fridge.txt")?;
    /* ... some very important banana counting logic ... */
}
```

## Converting between error types

If you don't want to box your errors, an alternative approach is to convert between standard error types and your custom error types. I prefer this approach because it seems less leaky - I'm not propagating a random `std::io::Error` from the middle of my codebase. Instead, I can decide what does that error mean in the context of my library (maybe the cache is missing? maybe I can even recover from it further up the call stack) and provide more information to the end-user.

We can handle this with the `map_err` function on the `Result` type. `map_err` passes through a successful result or apply a provided closure to a potential error value. This lets you map one error type into another one, and then you can use the `?` operator on that result.:

```rust
use std::fs::File;

enum CustomErrors {
    NoFridge
}

fn cold_banana_count() -> Result<u8, CustomErrors> {
    let mut fridge = File::open("fridge.txt")
        .map_err(|_| CustomErrors::NoFridge)?; // don't forget the `?`
    /* ... */
}
```

While this works, it is much typing. To cut down on that, you can define a conversion function on your `CustomErrors` enum, which takes a specific kind of error and convert it to your custom one. The conversion function is automatically called by the `?` operator.

```rust
impl From<std::io::Error> for CustomErrors {
    fn from(error: std::io::Error) -> CustomErrors {
        CustomErrors::NoFridge
    }
}
```

Then, you can simply call `File::open` with a `?` operator at the end, and the error converts automatically into your `NoFridge` error.

# Less typing, more functionality

If you think this is a *lot* of typing, it's because it is. Thankfully, the Rust community recognizes this and created crates that help with much of the boilerplate.

One of those crates is [Snafu](https://docs.rs/snafu/0.6.8/snafu/), which works similarly to our conversion example, but cuts down significantly on the amount of busywork necessary. There is a full example in the Snafu user's guide, but the gist is: you create your error enum as you would, derive  `Snafu` and add attributes to individual errors to teach Snafu how you want them to be displayed. Then, you can call the `context` function on a Result to provide context for the custom error quickly. 

Snafu is still not entirely stable - if you are looking for something that's past version 0, you could try out [anyhow](https://github.com/dtolnay/anyhow). Anyhow is more geared towards applications than libraries - it simplifies dealing with errors significantly, but it won't provide custom errors. For that, you will have to turn to its sister library [thiserror](https://github.com/dtolnay/thiserror), which you can use easily in tandem with Anyhow.

---

Thanks so much for reading! I hope I did a good job at explaining the ins and outs of Rust error handling and that you learned something new. I’ll be posting more articles like this soon, so keep an eye out on the blog via the RSS feed.

_Cover photo by [Tanushree Rao](https://unsplash.com/@tanushreerao) on [Unsplash](https://unsplash.com/s/photos/crustacean)_

