package org.acme.inventory.api;

import java.util.ArrayList;
import java.util.List;

import org.acme.inventory.domain.MaterialUsage;
import org.acme.inventory.domain.Product;
import org.acme.inventory.domain.RawMaterial;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/production-check")
@Produces(MediaType.APPLICATION_JSON)
public class ProductionCheckResource {

    @GET
    public List<ProductionCheckResult> checkProduction() {

        List<ProductionCheckResult> results = new ArrayList<>();

        List<Product> products = Product.listAll();

        for (Product product : products) {

            // CORREÇÃO DA CONSULTA
            List<MaterialUsage> uses = MaterialUsage.list("product.id = ?1", product.id);

            if (uses.isEmpty()) {
                continue; // produto sem BOM não pode ser produzido
            }

            int max = Integer.MAX_VALUE;

            for (MaterialUsage usage : uses) {

                RawMaterial rm = usage.rawMaterial;

                if (rm.availableStock <= 0 || usage.consumptionPerUnit <= 0) {
                    max = 0;
                    break;
                }

                int possible = rm.availableStock / usage.consumptionPerUnit;

                if (possible < max) {
                    max = possible;
                }
            }

            ProductionCheckResult r = new ProductionCheckResult();
            r.productId = product.id;
            r.productName = product.name;
            r.maxCanProduce = max;

            results.add(r);
        }

        return results;
    }

    public static class ProductionCheckResult {
        public Long productId;
        public String productName;
        public Integer maxCanProduce;
    }
}
