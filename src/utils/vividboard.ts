/** Veřejná URL nástěnky ve VividBoard (UUID z app). */
export function vividboardSetupUrl(boardId: string): string {
  return `https://app.vividboard.cz/setup/${boardId}`;
}
