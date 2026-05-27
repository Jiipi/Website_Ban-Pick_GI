import type { CostCatalog } from "@/domain/cost/CostCatalog";

export interface CostCatalogRepository {
  read(): Promise<CostCatalog>;
  write(catalog: CostCatalog): Promise<CostCatalog>;
}
