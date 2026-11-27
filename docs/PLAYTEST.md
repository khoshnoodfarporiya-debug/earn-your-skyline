# Playtesting with an outside player

The game has been played by its tests and its bots, never by someone who did
not build it. This is the kit for the first sessions: what to set up, what to
say, what to watch for, and a sheet to fill in. Aim for three to five players
(`docs/WORKING_PLAN.md`, section 2).

One session takes about 40 minutes: 5 to set up, 25 of play, 10 of questions.

## Before the session

- **The build:** the live site, earn-your-skyline.vercel.app, on the version
  in `lib/version.ts`. Write the version on the sheet.
- **The device:** the player's own phone if they will let you, in Safari or
  Chrome. Otherwise a phone you hand them. Not a computer: the game is built
  phone-first.
- **A fresh start:** they make their own profile at the front door. Do not
  give them a save in progress.
- **Their career:** let them choose. If they ask, suggest the Physician (the
  deepest) or the Chef (the most visual). Note what they picked and why.
- **Recording:** ask if you may take notes, and, if they agree, record the
  screen. Do not record their face or voice without asking. Keep names out of
  the notes; use "Player 1", "Player 2".

## What to say

Read this, or say it in your own words:

> I'm testing the game, not you. You can't do anything wrong. Please think out
> loud: say what you're looking at, what you expect to happen, and when
> something surprises or confuses you. I'll mostly stay quiet, because I want
> to see where the game explains itself and where it doesn't. If you're truly
> stuck, say so and I'll help. You can stop whenever you like.

Then: "Start a new game and play however you like."

## While they play

**Do not help, unless they are stuck for more than about a minute.** When they
ask "what does this do?", answer with "What do you think it does?" and write
the question down. Every question a player has to ask is a finding.

If they go quiet, prompt with "What are you thinking now?"

After about 15 minutes, if they have not committed a week yet, ask them to
plan and commit one. If they have played several weeks, let them carry on.

### What to watch for

| Moment | What it tells you |
| --- | --- |
| How long until they commit their first week | Whether the Week screen says what to do |
| Whether they read or skip the mentor's cards | Whether three cards is right |
| Where they tap first on the Week screen | What the screen leads with, in practice |
| Whether they understand the week's review | Whether cause and effect is visible |
| The first time they say "why?" or "what?" | A rule the game does not explain |
| Any time they try to tap something that is not a button | A layout that promises the wrong thing |
| Whether they find the phone, and what they do with it | Whether the phone earns its place |
| When they look bored, or check the time | Pacing |
| Whether they want to keep going when you stop them | The real verdict |

## After they play

Ask these in order, and write the answers down in their words:

1. In one sentence, what is this game about?
2. What were you trying to do in your career?
3. What was the most confusing moment?
4. What was the most interesting decision you made?
5. Was there anything you wanted to do and couldn't?
6. Would you play again tomorrow? Why, or why not?
7. Who would you tell about it, if anyone?

Do not explain the design or defend it. If they misread something, that is
the finding.

## The notes sheet

Copy this for each player.

```
Player:            (Player 1, 2, …; no names)
Date:
Version:           (from the BETA badge)
Device / browser:
Career chosen:     Why:
Plays games like this? (never / sometimes / often)

Time to first committed week:   min
Weeks played:
Mentor cards:      read all / skipped / read some
Got stuck (time, screen, what they were trying to do):
  -
  -
Questions they asked out loud:
  -
  -
Tapped something that was not a button:
  -
Moments of interest or delight:
  -
Moments of boredom:
  -

After-play answers:
  1 What it is about:
  2 What they were trying to do:
  3 Most confusing:
  4 Most interesting decision:
  5 Wanted to do and couldn't:
  6 Play again tomorrow:
  7 Who they would tell:

Wanted to keep playing when stopped?  yes / no
```

## After all the sessions

Sort the findings by how many players hit them, not by how strongly one
player felt. Anything three or more players hit goes into
`docs/WORKING_PLAN.md` as a task, with the players' own words. Add a
session-log entry to `docs/COMMUNICATION.md` saying how many players, which
careers, and the top three findings. Keep the filled-in sheets out of the
repository: they are notes about people.
