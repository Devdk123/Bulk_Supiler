export type InstallInstructionsKey =
  | "iosInstructions"
  | "samsungInstructions"
  | "androidInstructions"
  | "firefoxInstructions"
  | "desktopInstructions"
  | "manualInstructions";

export function getInstallInstructionsKey(userAgent: string): InstallInstructionsKey {
  const agent = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(agent) || (/macintosh/.test(agent) && /mobile/.test(agent))) {
    return "iosInstructions";
  }
  if (/samsungbrowser/.test(agent)) return "samsungInstructions";
  if (/android/.test(agent) && /firefox|fxios/.test(agent)) return "firefoxInstructions";
  if (/android/.test(agent)) return "androidInstructions";
  if (/chrome|edg\//.test(agent)) return "desktopInstructions";
  return "manualInstructions";
}
