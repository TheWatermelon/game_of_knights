const game = new Game();
const renderer = new Renderer(game);
const animationManager = new CardAnimationManager();
const input = new InputController(renderer, animationManager, game);

let previousTime = performance.now();

function main(now) {
    const deltaTime = now - previousTime;
    previousTime = now;

    animationManager.update(deltaTime);

    renderer.render();
    animationManager.draw(renderer);

    requestAnimationFrame(main);
}

requestAnimationFrame(main);