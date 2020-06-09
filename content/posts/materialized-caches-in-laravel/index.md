---
title: "Speeding up your database lookups with materialized views"
date: 2016-08-13T22:30:00+02:00
draft: false
categories:
  - PostgreSQL
  - PHP
cover: "images/ancient-database.jpg"
cover_alt: "an old filing cabinet, rumored by some to be a 'data base'"
description: "Building a cache does not have to be hard - leverage PostgreSQL's built-in materialized views to speed your application up!"
summary: "Building a cache does not have to be hard - leverage PostgreSQL's built-in materialized views to speed your application up!"
---

{{<aside icon="💭">}}
This post is somewhat old - it originally appeared on [my Medium blog](https://medium.com/@somwhatparanoid/were-gonna-build-a-great-cache-and-make-postgresql-pay-for-it-c45994b4ba05). I've learned a lot since then so I'd do some things differently, but the main point of the post is still valid.
{{</aside>}}

Two things are important to me here at Thronebutt HQ — making the user happy, and making me as a developer happy. Even though the choice of PHP as a programming language sheds some doubt on the latter, my goal was always to write as few code lines as possible to achieve the most. Short code is (generally) faster, prettier and more maintainable.

Unfortunately, a project like Thronebutt (for the uninitiated: a website that collects and analyses scores for [Vlambeer’s](http://vlambeer.com/) latest hit game [Nuclear Throne](http://nuclearthrone.com/)) doesn’t easily lend itself to the simplicity that [Laravel and Eloquent](https://laravel.com/docs/5.2/eloquent) provide. Custom queries are often necessary to achieve the level of detail that I need. Therefore, I can’t easily use something like [Rememberable](https://github.com/dwightwatson/rememberable) which would let me cache queries that regularly take several seconds to execute.

To reduce the atrocious load times that would, thanks to hundreds of thousands of scores with thousands more arriving every day, often reach five to ten seconds, I had to implement some kind of a cache. The most naive and simple approach was to cache certain values, like the amount of times the player placed first on the leaderboard and their overall rank, in Redis. Implementing that was simple enough, and load times reduced, but not as much as I wanted — the queries that analysed a particular user’s profile were still very slow. And since I wanted to perform various SQL queries on the data, using Redis or a similar solution would greatly increase the complexity of the application code.

Enter [materialized views](https://www.postgresql.org/docs/current/static/sql-creatematerializedview.html) — a feature of PostgreSQL that takes a query, executes it, saves its result and lets it be easily refreshed in the future with new data. This lets me easily cache the generated player rankings — the user no longer has to wait for several seconds while the database crunches the latest data for them. Moreover, materialized views behave just like any other table, meaning that I don’t have to adjust my existing queries. It’s the perfect lazy man’s cache.

The trade-off, of course, like with any cache, is not having the freshest data all the time. However, that’s something that we can live with. An advanced project might utilise a combination of cached and fresh data, however for my purposes this is more than enough.

# Implementing materialized views

Initialising a materialized view is trivial and can be done as a Laravel migration.

```php
class AddRanksView extends Migration
{

    public function up()
    {
        DB::statement("CREATE MATERIALIZED VIEW ranks AS
         SELECT *,
         rank() over (partition by leaderboard_id order by score desc)
         FROM throne_scores
         WHERE is_hidden = false");
    }
    public function down()
    {
        DB::statement("DROP MATERIALIZED VIEW ranks");
    }
}
```

Once initialised, we can access the data from it just like we’d access any other table. As a useful side effect, this also lets me set up Eloquent models for the scores (since Eloquent doesn’t have support for the PostgreSQL rank window function, that was not an option before) and simplify several other queries.

To update the view, I’ve set up a command with [Laravel’s task scheduler](https://laravel.com/docs/5.2/scheduling) that runs every five minutes and updates the entire view.

```php
use DB;
class UpdateRanks extends Command
{
    // ...
    public function handle()
    {
        DB::statement("REFRESH MATERIALIZED VIEW ranks");
    }
}
```

Of course, it’s possible to update the materialised view with every new score using triggers, however in this case it would not be optimal, since the environment that I’m running on here is very write-heavy, and stale data is acceptable to a degree. If you’re interested in lazy materialised views, there’s a great writeup on [HashRocket](https://hashrocket.com/blog/posts/materialized-view-strategies-using-postgresql).

# Conclusion
The effect of the new system was evident almost immediately — and by using the fantastic New Relic app monitoring system, I can display it in a neat graph.

{{<figure src="images/chart.png" caption="Difference in application responsiveness. Dashed: yesterday’s data (before implementing the cache). Solid: today’s data (after implementing the cache)">}}

Under a similar load, we can see that the improvement was hilariously huge, making sure that Thronebutt can happily store and process even more scores in the future.

All in all, materialised views are a pretty great feature of PostgreSQL that let you implement super easy caches that have a great positive impact on your application’s performance. If you’re in need of a simple solution and don’t want to spend days implementing your own caching system, materialised views just might be what you’re looking for.

---

_Cover photo by [@jankolario](https://unsplash.com/photos/lRoX0shwjUQ) on [Unsplash](https://unsplash.com/photos/lRoX0shwjUQ)_
