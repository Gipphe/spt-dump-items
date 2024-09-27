import path from "node:path";
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { VFS } from "@spt/utils/VFS";
import { DependencyContainer } from "tsyringe";

export class Main implements IPostDBLoadMod {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  private config = require("../config/config.json");

  public postDBLoad(container: DependencyContainer): void {
    const db = container.resolve<DatabaseServer>("DatabaseServer");
    const tables = db.getTables();
    const vfs = container.resolve<VFS>("VFS");
    const { items } = tables.templates;
    const itemsToDump: string[] = this.config.item_ids;
    const dump: Record<string, ITemplateItem> = Object.entries(items).reduce(
      (acc, [key, val]) => {
        if (itemsToDump.includes(key)) {
          acc[key] = val;
        }
        return acc;
      },
      {},
    );
    const dest = path.resolve(__dirname, "../data", `${Date.now()}.json`);
    vfs.writeFile(dest, JSON.stringify(dump));
  }
}

export const mod = new Main();
