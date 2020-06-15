---
title: "Automatic Dark Mode Switching for Vim and Terminal"
date: 2020-06-15T12:00:00+02:00
draft: false
categories: ["Vim", "Workflow"]
cover: "images/night.jpg"
cover_alt: "a dark night sky full of stars"
description: "Dark mode rules, but it can cause eye-strain during the day. With some terminal trickery, we can have both!"
summary: "Dark mode rules, but it can cause eye-strain during the day. Using a small CLI tool you can change Vim's and your terminal's color schemes based on the time of the day!"
---
# Summary

I wrote a small and fast CLI program to let you determine accurate sunset and sunrise times in your area so that you can dynamically change your terminal's theme as well as Vim's color scheme based on time of day. Got no time for the pleasantries? [**Click here to skip ahead to the code**](#automatically-switch-between-light-and-dark-mode-on-sunset).

# Introduction

Dark mode has long been a staple in many developer setups, but it's only recently started to gain mainstream traction. Following macOS's lead a year earlier, Windows 10, iOS 13, and Android 10 all released dark mode support pretty much simultaneously, which made many app developers rush to implement dark mode for their applications.

This new hotness soon trickled down to the web. We have a [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) media query, which lets websites adapt to the OS theme settings. There's also [surprisingly high](https://caniuse.com/#search=prefers-color-scheme) browser support for such a new feature. This very blog also adjusts to your OS settings - give it a shot!

**I love dark mode**, and not being blinded by Slack or many other apps while working at night is **lovely**, but the jury is still out on whether using dark mode is better or healthy for your eyes. There are people to whom this is obvious: if you have astigmatism, you're probably reading this in light mode and cursing dark-by-default apps. However, it took me solid six months of squinting at my screen during daylight to recognize that the problem isn't my worsening eyesight but that *the words are too damn dim*.

That's right - if you're like most of the civilized society and you generally work during the day, in a well-lit room full of sunlight (as you should! [Sunshine makes you happy](https://www.healthline.com/health/depression/benefits-sunlight)) dark mode is **a literal nightmare**. Or a daymare. **Are you reading this during the day?** Come on, switch off that dark mode toggle. Try it out.

Did you?

Well, I can hear you grumbling, but after the initial blast of light, I'm sure your eyes breathed a proverbial sigh of relief.

However, **light mode honestly still sucks at night**. Most operating systems have an "automatic" toggle for dark mode, which turns your screen dark whenever the sun goes down. Unfortunately, I work primarily out of a terminal. When the ancient humans hooked up teletypes to computers back in the stone age, they were more concerned about things like being able to edit files and having a functioning file system than aesthetics.

Times have changed, however, and with the recent advances in technology, we can give our eyes a rest during the night while still exercising them properly during the day.

{{<aside icon="👀">}}
Coincidentally, Kev Quirk published an interesting article titled [Is Dark Mode Such A Good Idea?](https://kevq.uk/is-dark-mode-such-a-good-idea/) just as I was in the middle of writing this post. It's an interesting read so go ahead and check it out once you're done here!
{{</aside>}}


# Dynamically changing colors in the terminal

There are plenty of terminal emulators available for your platform of choice. A popular choice for macOS users is [iTerm2](https://www.iterm2.com), but after much soul-searching, I've settled on the faster and a little bit more bare-bones [kitty terminal](https://sw.kovidgoyal.net/kitty/). Kitty uses GPU rendering, so it's pretty fast, but unlike its ascetic cousin [alacritty](https://github.com/alacritty/alacritty), it ships with a delightful set of additional features without sacrificing almost any performance. The main Kitty feature that I use for this trick is the **remote control option** - you can control the terminal emulator straight from the command line. And one of the remote control options is changing the color scheme.

For this to work, you need to enable remote control - adding `allow_remote_control yes`  to your `~/.config.kitty/kitty.conf` file will do the trick. Remember to restart the application after editing the configuration file.

What you want to do once you've turned on the remote control functionality is to place your themes into your `~/.config/kitty/themes` directory. I love the [base16 themes](https://github.com/chriskempson/base16), so I went with `base16-tomorrow` for light mode and `base16-twilight` for dark mode. To switch, you can issue a command like this:

```bash
kitty @ set-colors -a -c "$HOME/.config/kitty/themes/base16-tomorrow.conf"
```

Kitty has a wonderful help system: you can append `--help` to pretty much any command and get a nice list of available options and what they do. In this case, `-a` means we're setting color in all windows and `-c` means we're going to provide a path to the config file that has the colors listed.

From there on, it's trivial to wrap this in a small shell script to which you can pass a parameter to change the theme. I named mine `chtheme` so I can easily override the theme. You can [check out my implementation in my dotfiles repository.](https://github.com/crescentrose/dotfiles/blob/fed147052acb3a9249e0c5b5a042d97abcb70c55/bin/chtheme)

{{<aside icon="💡">}}
If you are using iTerm2, you can use [a custom escape code to change the profile](https://stackoverflow.com/questions/8598021/iterm-2-profiles). On Linux, you can try using the emulator-independent [setterm command](https://linux.die.net/man/1/setterm) - or just use `kitty`, it's cross-platform!.
{{</aside>}}

# Light mode and dark mode switches for Vim

I use Vim as my primary text editor - am I a hipster? Maybe, but I've found out that using editors that don't scream at me while I'm in the middle of writing a line of code and that don't have more switches and buttons than a lunar landing module makes me much saner and much more productive.

My theme of choice is [Oceanic Next](https://github.com/mhartington/oceanic-next), which thankfully ships with a light color variant as well. Switching between themes in Vim is relatively easy; you only need to invoke the `colorscheme` command.

If you're using a plugin with custom themes like [Lightline](https://github.com/itchyny/lightline.vim), it's a little bit more involved. Since Lightline ships with its own set of themes, I just picked a random light theme and a random dark theme and forced Lightline to reload its configuration, and wrapped the entire logic in `LightMode` and `DarkMode` functions. The [functions involved are also in my dotfiles](https://github.com/itchyny/lightline.vim) - it's no more than 15 lines of code.

If you're not using Lightline you can safely skip that step, although writing `:LightMode` is still easier than writing `:colorscheme OceanicNextLight`, if only for the reason that you don't have to keep remembering what's your theme's name.

# Automatically switch between light and dark mode on sunset

If you've only been skimming until now, it's time for you to tune in because this is where the magic happens.

There are plenty of methods you can use to determine whether your system is in light mode or dark mode. If you're on macOS, you can use AppleScript - however, the script takes around 300ms to run, which is going to be pretty noticeable when booting up another shell or Vim instance. So, I've developed [a small Rust program named Sunshine](https://github.com/crescentrose/sunshine) that lets you **determine the accurate sunrise and sunset times for a given location in your system's timezone**. Plus, it was an excuse to write Rust code, which I'll always take given the opportunity.

You can install Sunshine via Homebrew or manually. It knows how to fetch the location from your Mac's GPS (if you have a Mac), from your public IP (using [FreeGeoIP API](https://freegeoip.app), or a name (using the [Nominatim API](http://nominatim.openstreetmap.org)), you can pass the coordinates yourself, or, for frequent fliers, combine automatic detection with a sensible fallback.

It's also very fast: if you're using CoreLocation or passing in the coordinates manually, you are going to get a result within 25 milliseconds. Similarly, network queries are cached, so you don't have to worry about that either.

So, how does it fit into the theme of the post? Well, my `zshrc` and `vimrc` both call `sunshine` - this lets me determine whether it's day or night outside. With that knowledge, I can change the theme based on the time of day whenever I open up my terminal or Vim. Using the `--simple` switch, I can easily get just "day" or "night" so that I don't have to do calculations in Bash or Vimscript.

The final piece of the puzzle is the **timers and job features released with Vim 8**, which let you run functions in the background on set intervals. With timers, we can transition nicely from light mode to dark mode on sunset and the other way around. I've set the timer to 30 seconds, but you can probably bump it up to five minutes or something similar. The switcher will run asynchronously, so there should be no real performance penalty.

Anyway, enough rambling, here's the code. Of course, you will need to replace my location with yours.

```vim
" Automatic light mode / dark mode switcher
function! ChangeColorScheme(channel, msg)
  let time = trim(a:msg)
  if time ==# "day"
    call LightMode()
  else
    call DarkMode()
  endif
endfunction

function! Sunshine(timer)
  if executable("sunshine")
    let job = job_start(["sunshine", "-s", "@45 15"], {"out_cb": "ChangeColorScheme"})
  else
    call DarkMode()
  endif
endfunction

function! AutoDarkModeSetup()
  let timer = timer_start(30000, 'Sunshine', {'repeat': -1})
  call Sunshine(timer) " Initial call to setup the theme
endfunction

call AutoDarkModeSetup()

```

I am very much a VimScript noob, so this is probably not the optimal solution,
but it works and it's reasonably performant so I am happy with it!

For the terminal I went with more of a low tech approach - I put this in my `zshrc` so the theme will only change when you open a new shell. I do this frequently enough that it usually happens naturally, but if you use something like `tmux` you might consider extracting this in a separate file and running it as a cron job.

```bash
# automatically change kitty colors based on time of day
if command -v "sunshine" >/dev/null; then
  # Replace "@45 15" with your location string, e.g. "#Barcelona"
  if [[ "$(sunshine -s "@45 15")" = "day" ]]; then
    chtheme light
  else
    chtheme dark
  fi
fi
```

You might say that it's not synced precisely to your OS, but it's close enough that I don't notice it while working during sunset.

Now you can code as happily during the day as you would during the night!

---

{{<aside icon="🇳🇱">}}
Hey! I am looking for a job in or around **Utrecht, Netherlands**. If you know someone who is looking for a backend web developer with 5 years of experience, please let me know - my email is on [the about page](/about). Thanks!
{{</aside>}}

*Cover photo by [Nathan Anderson](https://unsplash.com/photos/L95xDkSSuWw) on [Unsplash](https://unsplash.com/@nathananderson)*
