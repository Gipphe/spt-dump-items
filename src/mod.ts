import path from "node:path";
import fs from "node:fs";
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt/models/spt/utils/ILogger";

export class Main implements IPostDBLoadMod {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  private config = require("../config/config.json");
  private logger: ILogger = null;

  public postDBLoad(container: DependencyContainer): void {
    this.logger = container.resolve<ILogger>("WinstonLogger");
    const db = container.resolve<DatabaseServer>("DatabaseServer");
    const tables = db.getTables();
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
    if (missing.length > 0) {
      this.warning(
        `${missing.length} IDs were not found.\nCould not find templates with the following IDs:\n${missing.join(", ")}`,
      );
    }

    if (keys.length <= 0) {
      this.warning("No matching items found. Nothing to dump.");
      return;
    }
    this.info(`${keys.length} matching items found`);
    const dest = path.resolve(__dirname, "../data", `${Date.now()}.json`);
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.debug(`Created directory at ${dir}`);
    }

    fs.writeFileSync(dest, JSON.stringify(dump));
    this.info(`Dumped retrieved templates into ${dest}`);
  }

  private info(msg: string): void {
    this.log(this.logger.info, msg);
  }
  private warning(msg: string): void {
    this.log(this.logger.warning, msg);
  }
  private debug(msg: string): void {
    this.log(this.logger.debug, msg);
  }
  private log(logFn: (m: string) => void, msg: string): void {
    logFn(`[SPT-DUMP-ITEMS]: ${msg}`);
  }
}

export const mod = new Main();
