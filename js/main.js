/*
 * Game of Knights
 * Copyright (C) 2026 TheWatermelon
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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