---
title: "DRYing up your code and your database with Rails, Postgres and STI."
date: 2018-08-06T22:30:00+02:00
draft: false
categories:
  - Ruby
  - Rails
cover: "images/trello.jpg"
cover_alt: "a wall full of colorful post-it notes with various pro-love anti-hate messages"
description: "Single Table Inheritance is a difficult beast to wrangle, but Rails gives us the tools - all we have to do is use them properly."
summary: "DRYing up your code and your database with Rails, Postgres and STI."
---

{{<aside icon="💭">}}
This post originally appeared on [my Medium blog](https://medium.com/@somwhatparanoid/drying-up-your-code-and-your-database-with-rails-postgres-and-sti-3026ef581075).
{{</aside>}}

You’ve been employed by an up-and-coming startup to provide a backend for their hip new productivity app, Notes McNotesface, which will easily let their valued customers add various types of notes to make them feel like they are getting something done. Bob, your Product Owner, originally only wants two kinds of notes: reminders and alerts, but in his infinite enthusiasm as a new hire Bob can foresee many other types of reminders that the user will be able to create, it’s just that the ideas are pretty vague right now. However, Bob knows that you _definitely_ want to have more than one user, you _definitely_ want to have a way to mark the reminders as completed, they will all _definitely_ have a title and there will _definitely_ be in-app purchases, though that last part is not really relevant to us now.

# The Conundrum
As the requirements slowly start dripping in, you figure you might as well work on a proof-of-concept to pass some time. You quickly resist the urge to just dump everything in MongoDB, call it “event sourcing” and leave the company at the first sign of issues, instead opting to think about all the types of data that the system should know about. You then recall entity relationships charts from your brief tenure at a public university that left you jaded for life and figure that drawing up a relationship diagram is as good of a start as any.

{{<figure src="images/dry1.png" caption="That student loan is practically repaying itself at this point.">}}

Immediatelly, your OO-senses start tingling. If you follow through with this structure, you will have a minimal and sufficiently normalized database, like they taught you at the aforementioned university. However, you’re obviously duplicating definitions of three fields. Moreover, how are you going to query for both Reminders and Alerts together? You could work out something with UNIONs, but that is so cumbersome and SQL is so 1986, and you aren’t sure if Ruby on Rails even lets you use SQL these days. Maybe ActiveRecord has transitioned into a full blown ActiveRDBMS and you can only ActiveQuery it over ten layers of ActiveAbstraction. You also can’t add more types without updating the database for every type you add. No, you need something better.

If you were modelling this without any database concerns, you would obviously recognize that both Reminder and Alert could share the same superclass, like a Note. Something like this would be the apex of Good Design.

{{<figure src="images/dry2.png" caption="You are pretty sure Martin Fowler said empty classes are bad at some point, but who’s keeping track, really?">}}

# The Epiphany
Suddenly, an epiphany hits you. Many moons ago, you have read that Rails has a somewhat obscure feature called “Single Table Inheritance”, allowing you to dump several types into one table. The reactions were mostly mellow, due to the fact that you still needed to have separate fields on the actual table and Rails would merely hide them out of sight; this would inevitably cause your schema to become bloated and full of useless, nullable fields. However, you also remember that PostgreSQL came out with a JSONB field relatively recently, which lets you use PostgreSQL as a makeshift document storage database, while still being relatively performant and usable. Not to mention that PostgreSQL, being the serious database that it is, actually saves data to the disk. This just might be the silver bullet to keeping your architecture DRY and the future DBA happy, or at least not pulling his hair out.

One issue remains, however, and that is actually deserializing the data into our models. Thankfully, the good folks on The Internet have thought of a solution to that issue as well, and produced an [activerecord-typedstore](https://github.com/byroot/activerecord-typedstore) gem which will pull the data out from the JSON, cast it into the necessary types and save it into the model. And since it sits on top of `ActiveRecord::Store`, it should function completely transparently.

# The Solution

You quickly whip up a migration for your new silver-bullet table, carefully making note to use the GIN index so that you could later [query by the contents of the JSON](https://www.postgresql.org/docs/current/static/datatype-json.html)…

```ruby
class AddNotes < ActiveRecord::Migration[5.2]
  def change
    create_table :notes do |t|
      t.string :type # this tells Rails we plan on using STI
      t.string :title
      t.boolean :is_completed
      t.jsonb :data, default: {}
      t.timestamps
    end

    add_index :notes, :data, using: :gin
  end
end
```

You hurry up to craft your domain models, making sure to tell activerecord-typedstore what kind of extra parameters you have on your model.

```ruby
class Note < ActiveRecord::Base
  def completed?
    is_completed
  end
end

class Reminder < Note; end

class Alert < Note
  typed_store :data, coder: JSON do |s|
    s.datetime :alert_at
  end
end
```

In your haste, you have forgotten to practice TDD!! You aren’t sure whether writing a test _after_ you’ve written the implementation will save your soul from burning in the 69th circle of hell in which you are forced in eternity to code Wordpress plugins, but you do it nonetheless…

```yaml
# Fixtures
sample_alert:
  type: "Alert"
  title: "Buy milk"
  is_completed: false
  data: '{"alert_at": "2018-08-06 17:08:24 +0200"}'

sample_reminder:
  type: "Reminder"
  title: "Short AAPL before autumn keynote"
  is_completed: false
```

```ruby
require 'test_helper'
require 'time'

class ReminderTest < ActiveSupport::TestCase
  setup do
    @reminder = Reminder.first
  end

  test 'should access methods from base class' do
    assert_equal false, @reminder.completed?
  end

  test 'should not have data from alerts' do
    assert_not_respond_to @reminder, :alert_at
  end
end

class AlertTest < ActiveSupport::TestCase
  setup do
    @alert = Alert.first
  end

  test 'should access data from json' do
    assert_equal Time.parse("2018-08-06 17:08:24 +0200"), @alert.alert_at
  end
end

class NotesTest < ActiveSupport::TestCase
  setup do
    @notes = Note.all
  end

  test 'should return our domain model instead of base class' do
    @notes.each do |n|
      assert n.class == Alert || n.class == Reminder
    end
  end
end
```

{{<aside icon="💡">}}
This is just a demonstration. Don’t actually write tests like this. Or is that just what you tell yourself to fall asleep easier?
{{</aside>}}

And voila, your implementation is fully functional! You now have ample room to adapt to your PO’s wishes, you don’t duplicate yourself and everything is nicely in its place! You can also query by the fields inside of the JSON, and you can even perform all the standard Rails stuff on it, such as validation. Truly, this is the most elegant piece of code you have written.

# The Epilogue

Seven months have passed since you’ve written this code. As Bob has so enthusiastically announced, the amount of different reminder types has indeed grown — to 12. After your accident with the cat two months in the project a junior has taken over, and they have failed to see the poignant beauty of your code and just kept cramming new properties inside the JSON field instead of carefully thinking about which fields should be extracted outside. Coupled with your marketing department’s curious fascination with averaging the amount of colours that the users have attached to the tags on the notes, which were of course stored in JSON as well, [your database became completely thrashed](https://heapanalytics.com/blog/engineering/when-to-avoid-jsonb-in-a-postgresql-schema). Instead of to Google, your startup was sold to IBM, who are planning on integrating your product into IBM Notes, where it will be cursed at by millions of executives worldwide.

As for you, your recovery is going well. In fact, you are just finishing up your presentation for the next big conference, titled “Why is PostgreSQL not Web Scale”.

---

All scenarios and names were made up, however I do believe there is a real application to this, and it is a part of a project I am working on. Source code for this small exercise is located [here on GitHub](https://github.com/crescentrose/rails-sti-jsonb-example). My employer had nothing to do with this abomination of a post, but I’d still like it if you checked out [Ars Futura](http://arsfutura.co/)'s website. Title photo by [Kyle Glenn](https://unsplash.com/photos/kvIAk3J_A1c?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/search/photos/notes?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).
