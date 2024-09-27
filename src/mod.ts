import path from "node:path";
import fs from "node:fs";
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { VFS } from "@spt/utils/VFS";
import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class Main implements IPostDBLoadMod {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  private config = require("../config/config.json");

  public postDBLoad(container: DependencyContainer): void {
    const logger = container.resolve<ILogger>("WinstonLogger");
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
    const keys = Object.keys(dump);
    const missing = itemsToDump.filter((id) => !keys.includes(id));
    logger.info(`${keys.length} matching items found`);
    if (missing.length > 0) {
      logger.warning(
        `${missing.length} IDs were not found.\nCould not find templates with the following IDs:\n${missing.join(", ")}`,
      );
    }
    const dest = path.resolve(__dirname, "../data", `${Date.now()}.json`);
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory at ${dir}`);
    }

    fs.writeFileSync(dest, JSON.stringify(dump));
    logger.info(`Dumped retrieved templates into ${dest}`);
  }
}

export const mod = new Main();
