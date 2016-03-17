import GameClass from './gameClass';

/**
 * Export a singleton of the GameClass to maintain state across modules
 *
 * @public
 */
let Game = new GameClass();
export default Game;