/// <reference path="../../../core/src/types/fs-access.d.ts" />

declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export function gfm(service: TurndownService): void;
}
