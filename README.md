# Pomodoro Art

A simple timer website with a bit of art in it.

## What the app is

A Pomodoro timer (a countdown that helps you focus) that shows a real painting from the Metropolitan Museum of Art in New York.

- The painting starts out very blurry.
- As the time counts down, it slowly gets clearer.
- At 00:00 it is fully sharp.

## How it works

- **Start**: the countdown begins and the painting starts to clear up.
- **Pause**: the countdown stops and the blur stays where it is. The button changes to **Resume**.
- **Resume**: the countdown carries on from where you stopped.
- **Reset**: the timer goes back to the start and the painting goes back to very blurry. It is the same painting.
- **At 00:00**:
  - A bell rings once.
  - The painting is fully sharp.
  - The painting's name, artist and year appear, with a link to its page on the Met's website. The link opens in a new tab. If the artist or year is missing, it says "Unknown".
  - A **Restart session** button appears. It sets the timer back to the start and picks a new painting.

Good to know:

- The timer is set to **25 minutes**. You can't change the length from the page yet.
- The time stays correct even if you switch to another browser tab while it runs.
- Refreshing the page also gives you a new painting.

## Where the paintings come from

The paintings and their details come from the Met's free Collection API. The app only uses paintings that are in the public domain and have a picture. The code doesn't use any API key, so you don't need one.

## What happens when something goes wrong

There is no error message yet. If the Met can't be reached, the painting area stays empty, and the timer still works. At 00:00 the details box will be empty in that case.

## The live link

[add live link here]

## Credits

- The Metropolitan Museum of Art, for the paintings and their details.
- Built by [your name]
