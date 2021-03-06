// / <reference path="../@types/global.d.ts" />
import Category from "./Category";
import CommandError from "./CommandError";
import ExtendedMessage from "../general/ExtendedMessage";
import CoreClient from "../CoreClient";
import { CommandRestrictions, ErisPermissions } from "../@types/General";
import { ArrayOneOrMore } from "@uwu-codes/utils";
import path from "path";

type OverrideReturn = void | "DEFAULT";

export default class Command<C extends CoreClient> {
	triggers: ArrayOneOrMore<string>;
	permissions: {
		bot: Array<ErisPermissions>;
		// permissions that can be omitted but shouldn't
		botUseful: Array<ErisPermissions>;
		user: Array<ErisPermissions>;
	};
	restrictions: Array<CommandRestrictions>;
	usage: string;
	description: string;
	cooldown: number;
	donatorCooldown: number;
	category: Category<C>;
	hasSlashVariant: boolean;
	run: (this: C, msg: ExtendedMessage<C>, cmd: Command<C>) => Promise<void>;
	// allow isn't used right now but it can be a bypass system in the future
	overrides:
	{
		permissionError: (this: C, msg: ExtendedMessage<C>, cmd: Command<C>, type: "user" | "bot", permissions: Array<ErisPermissions>) => Promise<OverrideReturn> | OverrideReturn;
		invalidUsage: (this: C, msg: ExtendedMessage<C>, cmd: Command<C>, err: CommandError<C>) => Promise<OverrideReturn> | OverrideReturn;
		help: (this: C, msg: ExtendedMessage<C>, cmd: Command<C>) => Promise<OverrideReturn> | OverrideReturn;
		cooldown: (this: C, msg: ExtendedMessage<C>, cmd: Command<C>, time: number) => Promise<OverrideReturn> | OverrideReturn;
	} & {
		[k in CommandRestrictions]: (this: C, msg: ExtendedMessage<C>, cmd: Command<C>) => Promise<OverrideReturn> | OverrideReturn;
	};
	file: string;
	constructor(triggers: ArrayOneOrMore<string>, file: string) {
		if (!triggers) throw new TypeError("One or more triggers must be provided.");

		this.triggers = triggers;
		this.permissions = {
			bot: [],
			botUseful: [],
			user: []
		};
		this.restrictions = [];
		this.usage = "";
		this.description = "";
		this.cooldown = 0;
		this.donatorCooldown = 0;
		this.category = null!;
		this.run = null!;
		this.overrides = {
			permissionError: () => "DEFAULT",
			invalidUsage: () => "DEFAULT",
			help: () => "DEFAULT",
			beta: () => "DEFAULT",
			developer: () => "DEFAULT",
			donator: () => "DEFAULT",
			guildOwner: () => "DEFAULT",
			nsfw: () => "DEFAULT",
			premium: () => "DEFAULT",
			supportServer: () => "DEFAULT",
			cooldown: () => "DEFAULT"
		};
		this.file = file;
		this.hasSlashVariant = false;
	}

	get lang() {
		return `commands.${this.category.name}.${this.triggers[0]}`;
	}
	get tsFile() {
		return `${path.dirname(this.file).replace(/build(\\|\/)/, "")}/${path.basename(this.file).replace(/.js/, ".ts")}`;
	}

	setTriggers(data: Command<C>["triggers"]) {
		if (!data) throw new TypeError("One or more triggers must be provided.");
		this.triggers = data;
		return this;
	}

	setBotPermissions(data: Command<C>["permissions"]["bot"], data2?: Command<C>["permissions"]["botUseful"]) {
		this.permissions.bot = data || [];
		this.permissions.botUseful = data2 || [];
		return this;
	}

	setUserPermissions(data: Command<C>["permissions"]["user"]) {
		this.permissions.user = data || [];
		return this;
	}

	setPermissions(data: Command<C>["permissions"]["bot"], data2: Command<C>["permissions"]["botUseful"], data3: Command<C>["permissions"]["user"]) {
		this.setBotPermissions(data || this.permissions.bot, data2 || this.permissions.botUseful);
		this.setUserPermissions(data3 || this.permissions.user);
	}

	setRestrictions(data: Command<C>["restrictions"]) {
		this.restrictions = data ?? [];
		return this;
	}

	setUsage(data: Command<C>["usage"]) {
		this.usage = data;
		return this;
	}

	setDescription(data: Command<C>["description"]) {
		this.description = data;
		return this;
	}

	setCooldown(data: Command<C>["cooldown"], donatorSame = true) {
		this.cooldown = data;
		if (donatorSame) this.donatorCooldown = data;
		return this;
	}

	setDonatorCooldown(data: Command<C>["donatorCooldown"]) {
		this.donatorCooldown = data;
		return this;
	}

	setCategory(data: Category<C>) {
		this.category = data;
		return this;
	}

	setExecutor(data: Command<C>["run"]) {
		this.run = data;
		return this;
	}

	setOverride<K extends keyof Command<C>["overrides"]>(type: K, override: Command<C>["overrides"][K]) {
		this.overrides[type] = override;
		return this;
	}

	runOverride<K extends keyof Command<C>["overrides"]>(type: K, client: C, ...args: (Parameters<Command<C>["overrides"][K]>)): OverrideReturn | Promise<OverrideReturn> {
		// this shit is too complicated
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return this.overrides[type].call(client, ...args);
	}

	setHasSlashVariant(data: boolean) {
		this.hasSlashVariant = data;
		return this;
	}
}
