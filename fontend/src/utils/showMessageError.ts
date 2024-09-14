import { ErrorMessages, ItemMessages } from "@/enum/errorCode";

export function showErrorMessage(code: keyof typeof ErrorMessages, 
    item?: keyof typeof ItemMessages, msg = '') {
  const message = ErrorMessages[code];
  if (message && item) {
    const itemMessage = ItemMessages[item];
    return message(itemMessage);
  }
  else if (message) {
    return message("");
  } 
  return "An error occurred. Please try again later. " + msg;
}