function attackEachOther() {
    let otherPlayer = (game.activePlayerIndex + 1) % game.players.length;
    while (game.players[otherPlayer].isDead()) {
        otherPlayer += 1 % game.players.length;
    }
    game.setSelectedPlayerIndex(otherPlayer);
    game.setState(GameState.ATTACK);
    input.triggerAction();
}