firefox web extension to block twitch ads

last updated november 2020

how to install:

- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#Installing

what does it do:

- rewrites the ttnvw hls playlists removing any ad .ts segment urls before they reach the js/webasm player

limitations:

- only tested on firefox. probably does not work in chrome
- it does not make the real stream viewable earlier than if it had ads: there may still be a 30s black screen to sit through

feel free to take this code / idea and make a better version

license: public domain
