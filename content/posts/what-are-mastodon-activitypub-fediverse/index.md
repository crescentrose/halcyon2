---
title: "Mastodon, ActivityPub and the Fediverse - what are they, and why should you care?"
date: 2022-11-18T00:00:00+01:00
draft: false
categories:
  - One-offs
cover: "images/masto.jpg"
cover_alt: "two grey elephants on grass plain during sunset"
description: "If I told you that you have to make an account on Yahoo Mail to receive an invoice I want to send you because you only have a Gmail account, you would be mildly miffed, and rightly so! So why do we keep up with it on our social media?"
summary: "If I told you that you have to make an account on Yahoo Mail to receive an invoice I want to send you because you only have a Gmail account, you would be mildly miffed, and rightly so! So why do we keep up with it on our social media?"
---

For absolutely [no reason at all](https://www.theverge.com/2022/4/11/23019836/elon-musk-twitter-board-of-directors-news-updates), Mastodon and "federated social networking" have been getting a lot of attention lately. But most people, even techies like me, do not fully understand what this purported Twitter replacement is supposed to be, how does it work and why should they even consider using it – or, for that matter, how to even *start* using it. So, when that one friend of yours (you know who I mean) starts babbling on about "the Fediverse" and "Mastodon" and "owning your own data", what do they ACTUALLY want to tell you?

## Like email for your social media

Mastodon and many other federated social networks are powered by a technology called **ActivityPub**. It is like email for your social media posts. When you’re using a service that supports ActivityPub, you can communicate with anyone else on any other service that also supports it, just like it doesn’t matter whether the person you’re emailing is using Gmail, iCloud Mail, or their own mail server.

{{<aside icon="🤔">}}
Well, if you have a friend who hosts their own email server, that's kind of a red flag. You have to be a very specific kind of person to expose yourself to that kind of pain.
{{</aside>}}

ActivityPub is an established [web standard,](https://www.w3.org/TR/activitypub/) but up until recently it has mostly been on the outskirts of the tech world, used by a handful of open source enthusiasts. After the recent Twitter meltdown, people are realising that giving one company full control of their online identity is kinda bad, actually, and federated social media is a potential way out of that conundrum.

{{<figure src="images/mstdn.png" caption="The charming quaintness of mstdn.party, one of many Mastodon servers in existence.">}}

{{<figure src="images/lemmy.png" caption="Lemmy.ml, a link sharing platform powered by, well, Lemmy.">}}

So, how does it work?

## Layers, like ogres

When we talk about the "fediverse", we're actually talking about two separate layers unified under one banner:

* **the client → server protocol,** which lets you use an app on your device to connect to a server. This puts the control of the experience into the hands of the user. Hate how your [Instagram app suddenly turned into TikTok](https://techcrunch.com/2022/05/03/instagram-test-full-screen-video-home-feed/)? If Instagram supported ActivityPub that would not be a problem - you could just install an alternative client that would still let you view the same posts and interact with the same people!
* **the server → server federation protocol**, which lets multiple servers talk to each other and connects users between platforms. Want to share a [funny cat picture](https://knowyourmeme.com/photos/48689-cheezburger) to your friend but they are primarily on WhatsApp and you really, really like Discord? If both platforms supported ActivityPub, that would not be an issue - you could use your hypothetical ActivityPub enabled Discord client to DM your friend who would then get that message on their preferred platform without even needing an account on your preferred platform!

For literal decades we’ve kept up with the “I sent you something on Twitter! Ah, but you’re only on Twitter once a week, check your DMs!” shenanigans when email has EXISTED all that time. If I told you that you have to make an account on Yahoo Mail to receive an invoice I want to send you because you only have a Gmail account, you would be mildly miffed, and rightly so!

ActivityPub promises to rid us of that hell - if the corporations let us out of their walled gardens, the federated internet becomes mainstream, or [the EU bureaucrats get their way](https://techcrunch.com/2022/03/24/dma-political-agreement/), whichever happens first.

## What happens next?

Whether Mastodon and similar platforms live or die will depend on their ability to market their product in a way that makes sense to an average user, and to monetize.

With Twitter slowly turning into whatever Elon Musk's most recent fever dream is, the marketing part seems to be taking care of itself, at least for now. Whether the *fediverse* ultimately draws enough people to form a critical mass and snowball into the mainstream is anyone's guess.  The number of Mastodon instances alone has doubled in the past month and the amount of users has quadrupled, but explaining the concept of a federated social network to a civilian still takes much more effort than necessary.

Then, there is monetization. Even with the development costs spread across community volunteers (which I believe to be unsustainable long-term - developers should be paid for their work!), servers still cost money and that money either comes from donations, purchases or… ads. Larger Mastodon servers are probably feeling this burn already.

Finally, there is the human factor. When your small-time community-run server suddenly gets joined by the likes of [George Takei and his small army of followers](https://universeodon.com/@georgetakei), it puts a different kind of pressure on you. There are expectations and, again, costs to that kind of venture. No one actually enjoys being a volunteer janitor.

Ultimately, if fediverse is to live, it will likely have to find its Gmail - a large, polished, streamlined instance likely backed by a corporation with the funds to keep it in order that will always be at odds with the rest of the community.  But that has always been the nature of the internet.

_Cover photo by [Mylon Ollila](https://unsplash.com/@ollila?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)._
