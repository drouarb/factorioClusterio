const libLink = require("@clusterio/lib/link");
const libPlugin = require("@clusterio/lib/plugin");
const libErrors = require("@clusterio/lib/errors");
const version = require("../../package.json").version;

/**
 * Format a parsed Factorio output message
 *
 * Formats a parsed Factorio output from lib/factorio back into the
 * text string it was parsed from.
 *
 * @param {Object} output - Factorio server output.
 * @returns {string} origial output text.
 * @private
 */
function formatOutput(output) {
	let time = "";
	if (output.format === "seconds") {
		time = `${output.time.padStart(8)} `;
	} else if (output.format === "date") {
		time = `${output.time} `;
	}

	let info = "";
	if (output.type === "log") {
		info = `${output.level} ${output.file}: `;

	} else if (output.type === "action") {
		info = `[${output.action}] `;
	}

	return `${time}${info}${output.message}`;
}

/**
 * Connector for control connection to master server
 * @private
 */
export class ControlConnector extends libLink.WebSocketClientConnector {
	constructor(url, reconnectDelay) {
		super(url, reconnectDelay);
		this.token = null;
	}

	register() {
		if (!this.token) {
			throw new Error("Token not set");
		}

		console.log("SOCKET | registering control");
		this.sendHandshake("register_control", {
			token: this.token,
			agent: "Clusterio Web UI",
			version,
		});
	}
}

/**
 * Handles running the control
 *
 * Connects to the master server over WebSocket and sends commands to it.
 * @static
 */
export class Control extends libLink.Link {
	constructor(connector, controlPlugins) {
		super("control", "master", connector);
		libLink.attachAllMessages(this);

		/**
		 * Mapping of plugin names to their instance for loaded plugins.
		 * @type {Map<string, module:lib/plugin.BaseControlPlugin>}
		 */
		this.plugins = controlPlugins;
		for (let controlPlugin of controlPlugins.values()) {
			libPlugin.attachPluginMessages(this, controlPlugin.info, controlPlugin);
		}
	}

	async instanceOutputEventHandler(message) {
		let { instance_id, output } = message.data;
		console.log(formatOutput(output));
		if (window.instanceOutputEventHandler) {
			window.instanceOutputEventHandler({instance_id, output});
		}
	}

	async debugWsMessageEventHandler(message) {
		console.log("WS", message.data.direction, message.data.content);
	}

	async shutdown() {
		this.connector.setTimeout(30);

		try {
			await libLink.messages.prepareDisconnect.send(this);
		} catch (err) {
			if (!(err instanceof libErrors.SessionLost)) {
				throw err;
			}
		}

		await this.connector.close(1001, "Control Quit");
	}
}
