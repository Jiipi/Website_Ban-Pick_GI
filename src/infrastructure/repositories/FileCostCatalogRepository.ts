import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import {
  defaultCostCatalog,
  normalizeCostCatalog,
  type CostCatalog,
} from "@/domain/cost/CostCatalog";

const DEFAULT_CATALOG_PATH = join(process.cwd(), "data", "cost-catalog.json");

export class FileCostCatalogRepository implements CostCatalogRepository {
  constructor(private readonly catalogPath = process.env.COST_CATALOG_PATH ?? DEFAULT_CATALOG_PATH) {}

  async read(): Promise<CostCatalog> {
    try {
      const source = await readFile(this.catalogPath, "utf8");
      return normalizeCostCatalog(JSON.parse(source));
    } catch (error) {
      if (isMissingFileError(error)) {
        return normalizeCostCatalog(defaultCostCatalog);
      }
      if (error instanceof SyntaxError) {
        return normalizeCostCatalog(defaultCostCatalog);
      }
      throw error;
    }
  }

  async write(catalog: CostCatalog): Promise<CostCatalog> {
    const normalized = normalizeCostCatalog(catalog);
    await mkdir(dirname(this.catalogPath), { recursive: true });
    await writeFile(this.catalogPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
    return normalized;
  }
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
