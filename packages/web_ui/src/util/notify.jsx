import { notification } from "antd";


export default function notify(message, type = "info", description = undefined) {
	notification[type]({
		message: typeof message === "string" ? message : "ERROR: See console",
		description,
		placement: "bottomRight",
	});
	if (typeof message !== "string") console.error(message);
}

/**
 * Promise rejection handler notifying the user
 *
 * Shows the error occuring in a notification card.
 *
 * @param {string} message -
 *     User facing message to give context to the error.  Should say which
 *     operation failed.
 * @returns {function(err)} function showing the error passed to it.
 */
export function notifyErrorHandler(message) {
	return function handler(err) {
		console.error(err);
		notification.error({
			message,
			description: err.message,
			duration: 0,
			placement: "bottomRight",
		});
	};
}