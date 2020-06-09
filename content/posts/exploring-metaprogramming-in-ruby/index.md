---
title: "Exploring Metaprogramming in Ruby"
date: 2020-06-09T08:30:00+02:00
draft: false
categories:
  - Ruby
cover: "images/ruby.jpg"
cover_alt: "a dark red irregularly shaped piece of ruby mineral with many sharp corners"
description: "Metaprogramming is an integral part of Ruby, more so than in any other language. This article explains the hows and whys."
summary: "Metaprogramming is an integral part of Ruby, more so than in any other language. Many frameworks and libraries rely on it, so if you want to know how those tools function, you will have to learn what goes on under the hood."
---

# Summary

Metaprogramming is an integral part of Ruby, more so than in any other language. Many frameworks and libraries rely on it, so if you want to know how those tools function, you will have to learn what goes on under the hood. Learning the basics of metaprogramming will not only help you discover the foundations that your code lays upon, but will also help you understand the Ruby object model better.

This article is aimed at **intermediate Ruby developers,** but most of it should also be readable by the general programmer audience regardless of their knowledge of Ruby. It should take you about **20 minutes** to read and understand.

# Introduction

> Metaprogramming is a programming technique in which computer programs have the ability to treat other programs as their data.

*- Wikipedia’s definition of [metaprogramming](https://en.m.wikipedia.org/wiki/Metaprogramming)*

When I first started programming in Ruby, I felt incredibly overwhelmed. For whatever instruction you can imagine, there are at least five different, yet equally valid, ways of writing it. The language is filled with aliases, the frameworks are rife with macros and monkey-patched methods. This was very confusing for my young brain. It especially contrasted my previous involvement with PHP, where everything was well structured, and every method had One Job™️. If you introduced another way of saying something, you’d be shunned as a non-believer in the laundry list of PHP standards that kept growing by the day.

It took me some time to adjust to my new reality, but soon I realized that metaprogramming is perhaps the sharpest in Ruby’s collection of [sharp knives](https://m.signalvnoise.com/provide-sharp-knives/). It permeates through the language, yet it stays on the sidelines. Learning the generous assortment of metaprogramming tools that Ruby provides is crucial to becoming a good Ruby developer. Even if you never write a single line of DSL yourself.

In this article, I'm running through my favorite uses of metaprogramming. For each one, I will explain how and why it pertains to the language. I'll also pull the curtain on the most common techniques and show you how they work behind the scenes. Join me on this journey!

# Metaprogramming - What’s it suitable for, anyway?

It's very easy to reject metaprogramming as *magic*, a dark ritual that inevitably results in subtle bugs and undefined behaviors. That is a valid criticism. It's easy for metaprogramming to spiral into an unmaintainable mess - but it's just as easy for it to serve the programmer as a force of good. Consider how Rails code might look like without the framework defining relationship methods on your models on the fly:

```ruby
user = User.find(1)
post = Post.where(user_id: user.id).first
comments = Comment.where(post_id: post.id)
```

Contrast the previous code to how you would actually write it in Rails:

```ruby
user = User.find(1)
post = user.posts.first
comments = post.comments
```

The first version is verbose. It takes you some time to process what's going on. The second version is functionally equivalent, but it reads much more nicely. It's almost plain English.

There's an important caveat, though - we know we can fetch relationships like that because the Rails documentation says so. We trust the documentation to be accurate and up-to-date, and we believe the framework itself won't redefine `nil?` or another common method. This trust is unthinkable in many programming languages, but in the Ruby community, it seems to work. This also leads to the first and probably most crucial maxim of metaprogramming.

{{<aside icon="👉">}}
**Extensively test and document any potentially obscure additions to your code.** Writing documentation and tests not only lets others know what to expect, but also cuts down significantly on potential bugs and issues down the line.
{{</aside>}}

# Monkey-patching your way to happiness

There are few things more poetic about Rails than being able to specify "yesterday" as `1.day.ago`, "last week" as `1.week.ago` or "in 40 minutes" as `40.minutes`. This relatively minor feature (it's only [around 70 lines of code](https://github.com/rails/rails/blob/v6.0.3.1/activesupport/lib/active_support/core_ext/numeric/time.rb)) has become almost synonymous with the framework - and, by extension, the power of Ruby. Many attempts have been made to bring this functionality to other languages, yet none of them came close.

Adding time methods to a `Numeric` type makes perfect sense in hindsight, but coming up with it required a flagrant disregard for all established programming practices and the boldness to change a core type of the language. However, we should not all start running to define custom operations on core types - the world might not fall apart, but you should be sure that what you're doing is worth the potential trouble.

A better approach might be to create a wrapper class that will act like the class you want to replace, but with your own additions. This makes the behavior opt-in and self-contained, and it's going to be much easier to avoid potential pitfalls. Rails 5.1 even added [a method to automatically "extend" an existing class](https://github.com/rails/rails/issues/23824) (does this count as meta-metaprogramming?). I've used this pattern several times, and it always turned out to be more obvious than just monkey-patching existing classes.

{{<aside icon="👉">}}
**Monkey-patching existing classes is dangerous - make sure you understand all trade-offs**. This especially applies to core types - it is so easy to shoot yourself in the foot just to figure out that "foot" is redefined as "head". Consider defining wrapper classes to redefine or extend behavior.
{{</aside>}}

## How do you do it?

It's reasonably straightforward - all you have to do is re-open an existing class. Remember that in Ruby, **everything** is an object, including strings, numbers, and even nils and booleans!

```ruby
"javascript bad".spongify # => NoMethodError

class String
  def spongify
    # Ruby, like Perl, can also be a write-only language.
    self.split('').map.with_index { |c, i| i % 2 == 0 ? c : c.upcase }.join('')
  end
end

"javascript bad".spongify # => "jAvAsCrIpT bAd"
```

For the wrapper variant, you will definitely want to delegate at least some functionality - or all of it. Here you have several options:

- If you only want to delegate some methods, just [extend the Forwardable module](https://ruby-doc.org/stdlib-2.7.1/libdoc/forwardable/rdoc/Forwardable.html). Then you can define which methods you want the original class to receive.
- If you wish to delegate all methods, use the [built-in SimpleDelegator class](https://hashrocket.com/blog/posts/using-simpledelegator-for-your-decorators). This will quietly proxy all missing method calls to the wrapped class.
- Both of the options above mean that you are creating a new type that doesn't fit in the existing type hierarchy. If you have to maintain the same type, your wrapper class can inherit from the one that you're wrapping, and then you can use the previously discussed `delegate_missing_to` method to proxy the missing methods to the wrapped class. Note that this is generally not necessary due to Ruby's lack of static typing and reliance on duck typing, but code that actively checks types still exists (such as, oddly enough, ActiveStorage)

Here's our previous example rewritten using SimpleDelegator:

```ruby
class StringWithSpongify < SimpleDelegator
  def spongify
    self.split('').map.with_index { |c, i| i % 2 == 0 ? c : c.upcase }.join('')
  end
end

foo = StringWithSpongify.new("inheritance bad")
foo.spongify # => "iNhErItAnCe bAd
```

# Describing class attributes with macros

We commonly see classes as containers for a particular state (instance variables) and operations on that state (class methods). However, there's always that *one thing missing* when it comes to implementing classes in the real world - I'd postulate that it's **class attributes.** These pieces of data describe how a class should behave in the context of the entire application. There are many different solutions for this puzzle - Java and PHP use annotations liberally, Rust and C++ use attributes, and in Ruby, that niche is filled by class macros.

Class macros are standard in Ruby and everywhere in Rails. If you've ever written an `attr_accessor` or a `has_many`, you've written a macro. In contrast to their counterparts from other languages, they are *not* a language feature. Instead, they stem from the simple fact that **a Ruby class definition is nothing more than a block of executable code**, and the result of that code is a Class object that gets assigned to the constant you specified as a class name. That's right - in Ruby, **a class is an object in and of itself**. In other words, these two snippets of code are equivalent:

```ruby
class Foo
  def say_hi
    puts "Hello from Foo!"
  end
end # => Foo

Bar = Class.new do
  def say_hi
    puts "Hello from Bar!"
  end
end # => Bar

Foo.new.say_hi # => "Hello from Foo!"
Bar.new.say_hi # => "Hello from Bar!"
```

At first glance, it might seem simple, but it's anything but. Treating a class definition as just another block of code leads to incredibly powerful features like the Rails macros mentioned above, without which it is hard to imagine modern web development. The best part is that macros are hiding in plain sight, existing as a fundamental property of the language instead of as a special case.

{{<aside icon="👉">}}
**Macros are a powerful way of describing class attributes** and replicating specific behavior across many similar classes. If you foresee writing a lot of similar code between classes that are in the same domain, think about creating a macro for that code.
{{</aside>}}

## How do you do it?

Since a class definition is essentially just another block of code, you can run whatever code you want inside of them, and it will run when the class is being defined. This **only** happens when the class is defined, **not** when you create an instance of that class.

```ruby
class Foo
  puts "I am being created!"
end # => "I am being created!"

Foo.new # nothing is printed here
```

If we can run `puts`, we can run any method - let's try with a method that defines a method.

```ruby
class Foo
  define_method :say_hi do
    puts "Hello!"
  end
end

Foo.new.say_hi # => Hello!
```

Cool, that works. However, just defining a method is pretty useless - we probably want to store some data in the class so that we can reference it later. For that, we need to turn back to our previous discovery: a class is itself an object. To be pedantic, a class that you create is an instance of the `Class` class. 

Therefore, we should be able to create instance variables *on the instance of the class itself.* Take as much time as you need here - it took me about three months to understand this concept fully. We will define our macros and the data it keeps **on the Class object**. Think of it this way - a class is a template for your objects, and we are going to change the template for your class.

We do this by defining methods on `self`, and then accessing the class's object (also known as the *eigenclass* or the *singleton class* - more on that later) using `self.class`.

```ruby
class Hello
  # Provide a way to access the data
  def self.hi_to
    @hi_to ||= ""
  end

  # Define the method that we are going to use as a macro
  def self.says_hi_to(name)
    @hi_to = name
  end

  def say_hi
    puts "Hello, #{self.class.hi_to}"
  end
end

class HelloWorld < Hello
  says_hi_to "world"
end

class HelloReader < Hello
  says_hi_to "dear reader"
end

HelloWorld.new.say_hi # => "Hello, world"
HelloReader.new.say_hi # => "Hello, dear reader"
```

Congratulations, you have written a macro!

It is also possible to use a module as a container for the macro and its methods instead of a parent class. You can use a [Rails concern](https://api.rubyonrails.org/classes/ActiveSupport/Concern.html), or you can do it yourself - here's [an example gist](https://gist.github.com/crescentrose/d85e2e12e7f3530652d5e4164907cef1) of how that would look like.

# Domain-specific languages: writing data as code

Another freqent use of metaprogramming is specifying data as code - also known as writing a domain-specific language. Ruby’s flexibility makes it perfect for creating DSLs, and there are many popular applications that (ab)use that flexibility. Provisioning tools Chef and Puppet are the first examples that come to mind, there are DSLs in your Gemfile and Rakefile, and of course, Rails itself is full of DSLs.

DSLs are great at solving very particular, niche problems. Writing a DSL lets you encapsulate your problem and solve it “behind the scenes”, while providing the API user with a beautiful, fluent interface and letting them focus on *their* issue at hand. Most importantly, they are easily parsable by humans and will quickly pay off their investment. As an example, if you're using Rails, you probably don't have many obscure `ALTER TABLE` SQL statements in your migrations. A DSL lets you abstract away the issues of manipulating various databases and enables you to focus on building your models.

{{<aside icon="👉">}}
**A domain-specific language is a great tool to cut down on boilerplate code and allow for pretty, fluent interfaces**. However, writing and maintaining one takes some time, and you’re not removing complexity - instead, you’re moving it to your DSL. Remember that your DSL is only as useful as the amount of use cases it covers - if you’re only going to use it once or twice, it doesn’t make sense to write it.
{{</aside>}}

## How do you do it?

Most Ruby DSLs are “parsed” by either liberally applying the `instance_eval` method (which executes a Proc in the context of a class) or by yielding a specific “container” variable on which you then call the DSL methods.

Using `instance_eval`, you *shift* the execution context of a passed block into your own class, effectively hijacking the method calls that would exist in the original context and replacing them with your own. This looks more like a proper DSL, but it makes it slightly more difficult to reason about the DSL; suddenly, you’re in the middle of someone else’s code, and your own variables and methods might not be accessible. An excellent example is Bundler - you generally aren’t putting a Gemfile in the middle of your application, so it makes sense to use the `instance_eval` method here.

A more straightforward and more obvious method is to just `yield` a specific “configuration” object into a block. This simply provides the user with an interface to your code. You won't be rudely shifting them to the middle of your library. A good example is Rails’ migration DSL - you’re going to cram it right in the middle of your Rails app, so you probably don’t want to play games with scoping.

Both methods are valid and used to various degrees, and there are many articles on the web detailing how to make a DSL with either one. In the interest of time, I will only demonstrate the simpler method.

There are two components to either method - the DSL class that will hold the DSL methods, and the “runner” class that will read from the defined DSL object and act upon it. Let's say you were to create an HTTP client - you might want to provide a nice interface for specifying headers. You might write it something like this:

```ruby
module HttpClient
  class Dsl
    # These are the methods that your users are going to call
    def user_agent(agent)
      @user_agent = agent
    end

    def accept(accept)
      @accept = accept
    end

    # You can call this to get the data from the DSL object
    def params
      { accept: @accept, user_agent: @user_agent }
    end
  end

  def self.get(url)
    # Get a new "container" and pass it into a block
    dsl = Dsl.new
    yield dsl
    # voila, now your properties are in the "dsl" variable!

    puts "GET #{url}"
    puts "User-Agent: #{dsl.params[:user_agent]}"
    puts "Accept: #{dsl.params[:accept]}"
  end
end

HttpClient.get('https://example.com') do |request|
  request.user_agent "Ruby"
  request.accept "text/plain"
end
```

Adapting this to use `instance_eval` is also fairly simple - try it on your own! Or, if you don't feel like it, [click here to see the solution](https://gist.github.com/crescentrose/53acfca6f3f4a49d594f0f8a29583cc7).

# Lesser used techniques

I've covered the most frequently used techniques, but there are many other Ruby tricks and hacks that you can use. I'll introduce you to a few more ways of metaprogramming that might interest you, which aren't used so often.

## Singleton classes

Just mentioning the word "singleton" is enough to bring tears to faces of many OOP purists. However, "singleton" in Ruby means something very different. In Ruby, a singleton is the "hidden" class that's contained within every instance of every object. It's also known as the *eigenclass*. Singleton classes allow you to define methods on a *single instance* of a given class, so you can do something like this:

```ruby
hello = "Hello, world!"
class << hello
  def output
    puts self
  end
end

hello.output
```

## Dynamically defining methods

There are many ways in which you can define a method on the fly in Ruby:

- You can use **method_missing**, which is a special method that Ruby will call as a last resort in case it can't find the method you're calling on a particular object. This is useful for various fluent interfaces, but you shouldn't rely on it too much as it can get overwhelming to keep track of what exactly gets caught by method_missing and what doesn't.
- You can define methods using the **define_method** method. This will take a proc (or a block) and then bind it to the given class or instance. Make sure you document precisely what gets added and under which conditions - you don't want rogue define_methods that define something unexpected.
- Finally, you can use the good old `eval` methods to write Ruby in your Ruby and then execute it in the context of your class. This can be very powerful, but it suffers from many caveats, the least of which include security concerns and the inability to be parsed by code analyzers. Use it at your own peril!

## Templates and generators

Code generators are a very popular feature of Rails. The templates provided are like scaffolding, allowing you to rapidly generate code that might be repetitive to write on your own. Rails even ships with its own *generator generator*, which you can read more about [in this blog post](https://arsfutura.com/magazine/diy-create-your-own-rails-generator/).

---

Thanks for reading! If you learned something new or if you found the article useful or entertaining, please add it to your bookmarks and/or your RSS reader of choice. I'm trying to publish an article every two weeks or so. I hope to see you again soon!

_Cover photo by [Jason D](https://unsplash.com/@jasondeblooisphotography) on [Unsplash](https://unsplash.com/photos/VKLJ-BJlszE)_
