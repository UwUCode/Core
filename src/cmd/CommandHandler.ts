import Category from "./Category";
import Command from "./Command";
import * as Restrictions from "./Restrictions";
import ExtraHandlers from "./ExtraHandlers";
import CooldownHandler from "./CooldownHandler";
import AntiSpam from "./AntiSpam";
import CoreClient from "../CoreClient";
import { ArrayOneOrMore, ModuleImport } from "@uwu-codes/utils";
import path from "path";


export default class CommandHandler<C extends CoreClient> {
	categories: Array<Category<C>>;
	handlers: ExtraHandlers<C>;
	cool: CooldownHandler<C>;
	anti: AntiSpam;
	constructor() {
		this.categories = [];
		this.handlers = new ExtraHandlers<C>();
		this.cool = new CooldownHandler<C>();
		this.anti = new AntiSpam();
	}
	get restrictions() {
		return Restrictions;
	}

	get commands(): Array<Command<C>> {
		return [...this.categories.reduce((a, b) => a.concat(b.commands), [] as Array<Command<C>>)];
	}

	get triggers(): Array<ArrayOneOrMore<string>> {
		return [...this.categories.reduce((a, b) => a.concat(b.commands.reduce((c, d) => c.concat(d.triggers), [] as Array<ArrayOneOrMore<string>>)), [] as Array<ArrayOneOrMore<string>>)];
	}

	get categoryNames() {
		return this.categories.map((c) => c.name);
	}

	getCategory(data: string) {
		if (!data) throw new TypeError("Missing category.");
		return this.categories.find((c) => c.name === data) || null;
	}

	addCategory(data: Category<C>) {
		if (!data) throw new TypeError("Missing category.");
		if (this.categoryNames.includes(data.name)) throw new TypeError(`Duplicate category "${data.name}" in file "${data.file}" (duplicate: ${this.categories.find((c) => c.name === data.name)!.file})`);
		for (const cmd of data.commands) {
			for (const cmd2 of this.commands) {
				if (cmd2.triggers.some((t) => cmd.triggers.includes(t))) throw new TypeError(`Duplicate command "${cmd.triggers[0]}" (file: ${cmd.file}), duplicate file: ${cmd2.file}`);
			}
		}


		console.debug(["Command Handler"], `Added the category ${data.name} with ${data.commands.length} command${data.commands.length === 1 ? "" : "s"}.`);
		this.categories.push(data);
		return true;
	}

	removeCategory(data: Category<C> | string) {
		if (!data) throw new TypeError("Missing category.");
		if (typeof data === "string") data = this.categories.find((c) => c.name === data)!;
		if (!data || !this.categories.includes(data)) return false;
		console.debug(["Command Handler"], `Remove the category ${data.name}.`);
		this.categories.splice(this.categories.indexOf(data), 1);
		return true;
	}

	getCommand(data: Command<C> | string) {
		if (!data) throw new TypeError("Missing command.");
		const cmd = this.commands.find((c) => c.triggers.some((t) => data instanceof Command ? data.triggers.includes(t) : data === t));

		if (!cmd) {
			return {
				cmd: null,
				cat: null
			};
		}

		return {
			cmd,
			cat: cmd.category
		};
	}

	reloadCategory(cat: string | Category<C>) {
		if (typeof cat !== "string") cat = cat.name;

		const c = this.getCategory(cat);
		if (!c) return false;

		this.removeCategory(c.name);

		Object.keys(require.cache)
			.filter((k) => k.startsWith(c.file.split(path.sep.replace(/\\/, "\\\\")).slice(0, -1).join(path.sep.replace(/\\/, "\\\\")))) // because windows
			.map((f) => delete require.cache[require.resolve(f)]);

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const f = (require(c.file) as ModuleImport<Category<C>>).default;

		this.addCategory(f);

		return true;
	}
}
