﻿
import { Vec2 } from "./math.js";
import { IGraph, IRenderer } from "./IRenderer.js";

import { Sprite } from "./Sprite.js";


window.m_draw_animation_texture_info = false;

class IAnimation {
	constructor(raw, url) {
		this._raw = raw;
		this._url = url;

		this.frame = 0;
		this.time = 0;
		this.delta = 0;//total time

		/** @type {Sprite[]} */
		this.textures = [];
		
		/** @type {boolean} */
		this.is_loop = true;
		
		/** @type {boolean} */
		this.is_end = false;
	}
	
	clone() {
		let newAnim = new this.constructor(this._raw, this._url);
		newAnim.textures = this.textures;
		return newAnim;
	}
	
	load() {
		throw new Error("Not implement");
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		throw new Error("Not implement");
	}
	
	reset() {
		this.frame = 0;
		this.time = 0;
		this.is_end = false;
	}
	
	get texture() {
		throw new Error("Not implement");
	}
	
	destroy() {
	}
}

/**
 * process animation
 */
export class AnimationBase extends IAnimation {
	/**
	 * @param {!any} raw
	 * @param {!string} url
	 */
	constructor(raw, url) {
		super(raw, url);
	}

	/**
	 * @returns {Promise<Sprite>}
	 */
	async load() {

		for (let i = 0; i in this._raw; ++i) {
			let url = this._url + "/" + i;

			let texture = new Sprite(this._raw[i]);

			texture._url = "/images/" + url;

			this.textures[i] = texture;
		}
		
		if (this.textures[0]) {
			if (!this.textures[0].isLoaded()) {
				this.textures[0].__loadTexture();
			}
		}
	}

	/**
	 * aways loop
	 * @param {number} stamp
	 */
	_update(stamp) {
		const fc = this.textures.length;

		if (fc > 1) {
			this.time = this.time + stamp;

			if (this.time > this.texture.delay) {
				this.frame = ++this.frame % fc;
				this.time = 0;
			}
			//this.frame = Math.trunc(this.time / 1000) % fc;
		}

		this.delta += stamp;
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		const fc = this.textures.length;

		if (fc > 1) {
			this.time = this.time + stamp;

			if (this.time > this.texture.delay) {
				this.frame = this.frame + 1;
				if (this.frame >= fc) {
					if (this.is_loop) {
						this.reset();//make loop
					}
					else {
						this.is_end = true;
						return;
					}
				}
				this.time = 0;
			}
		}
		
		this.delta += stamp;
	}
	
	isEnd() {
		return this.is_end;
	}
	
	get texture() {
		return this.textures[this.frame];
	}
}

/**
 * animation rendering
 */
export class Animation extends AnimationBase {
	constructor(raw, url) {
		super(raw, url);

		this.draw = this._draw_and_preload;
	}

	/**
	 * @param {IRenderer} renderer - GraphLayerRenderer
	 * @param {number} x
	 * @param {number} y
	 */
	draw(renderer, x, y, angle, flip) {
		let texture = this.texture;
		renderer.drawRotaGraph(texture, x, y, angle, flip);
	}

	/**
	 * draw and load next frame
	 * @param {IRenderer} renderer - GraphLayerRenderer
	 * @param {number} x
	 * @param {number} y
	 */
	_draw_and_preload(renderer, x, y, angle, flip) {
		let frame;

		// if current frame is not loaded then render prev frame
		for (frame = this.frame; frame >= 0; --frame) {
			let texture = this.textures[frame];

			if (texture.isLoaded()) {
				renderer.drawRotaGraph(texture, x, y, angle, flip);
				break;
			}
		}

		//preload next frame
		let texture = this.textures[++frame];
		if (texture) {//if frame < this.textures.length
			if (!texture.isLoaded()) {
				texture.__loadTexture();
			}
		}
		else {//if all testure are loaded
			delete this.draw;
		}
	}
}
