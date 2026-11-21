/** Server va klient ikkalasi ishlatadigan sidebar doimiylari. */
export const SIDEBAR_COOKIE = "aiops_sidebar";

export type SidebarState = "expanded" | "collapsed";

export function parseSidebarState(value: string | undefined): SidebarState {
  return value === "collapsed" ? "collapsed" : "expanded";
}
