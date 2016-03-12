# Tanks

An online multiplayer tanks game based off Wii Tanks and inspired by Agario. This project was started in early 2015 and has been progressing ever since, but I am taking an indefinite pause from it to work on other more useful ventures. It's been an amazing learning experience and I'll try to document the important parts I've learned about game development. A live (old) version of the game can be found at http://tankti.me; tell your friends to connect to that link to see how the multiplayer works.

I will post the majority of that information on my blog.

## General Code Structure

The server and client share much of their code through the use of ES6 modules, which are compiled using BabelJS, RollupJS, and Gulp (to actually run the aforementioned 2 tools). There is a bit of cruft in the code and I will clean it up eventually.

* The core of the game logic is done in common/game.js.
* Client and server communication are done in client/connect.js and server/main.js, respectively.
* State management code can be found in common/state/state/, the code uses a state machine and publish-subscribe for communication between ES6 classes

## Conclusion

Feel free to do whatever you want with the code and ask questions.
