import Command from "./Command";
import CoreClient from "../CoreClient";

export default class CooldownHandler<C extends CoreClient> {
	private cooldowns: Array<{
		command: string;
		start: number;
		time: number;
		userId: string;
	}>;
	constructor() {
		this.cooldowns = [];
	}

	addCooldown(userId: string, command: Command<C>) {
		console.debug("CooldownHandler", `Set cooldown for user "${userId}" on command ${command.triggers[0]} for ${command.cooldown}ms.`);
		const start = Date.now();
		this.cooldowns.push({
			command: command.triggers[0],
			start,
			time: command.cooldown,
			userId
		});
		return start;
	}

	checkCooldown(userId: string, command: Command<C>) {
		const d = Date.now(),
			e = this.cooldowns.find((c) => c.userId === userId && c.command === command.triggers[0]),
			time = Math.round(!e ? 0 : (e.start + e.time) - d);
		if (e && d > (e.start + e.time)) {
			this.removeCooldown(userId, command);
			return {
				active: false,
				time: 0
			};
		}


		return {
			active: !!e,
			time: time < 1000 ? 1000 : time
		};
	}

	removeCooldown(userId: string, command: Command<C>) {
		console.debug("CooldownHandler", `Removed cooldown for user "${userId}" on command ${command.triggers[0]}`);
		const e = this.cooldowns.find((c) => c.userId === userId && c.command === command.triggers[0]);
		if (!e) return false;
		this.cooldowns.splice(this.cooldowns.indexOf(e), 1);
		return true;
	}
}
