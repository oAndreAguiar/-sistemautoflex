package org.acme.inventory.api;

import java.net.URI;
import java.util.List;

import org.acme.inventory.domain.MaterialUsage;
import org.acme.inventory.domain.Product;
import org.acme.inventory.domain.RawMaterial;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/material-usage")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MaterialUsageResource {

    @GET
    public List<MaterialUsage> listAll() {
        return MaterialUsage.listAll();
    }

    @POST
    @Transactional
    public Response create(MaterialUsageDTO dto) {

        // valida produto
        Product product = Product.findById(dto.productId);
        if (product == null) {
            throw new NotFoundException("Product not found: " + dto.productId);
        }

        // valida matéria-prima
        RawMaterial rm = RawMaterial.findById(dto.rawMaterialId);
        if (rm == null) {
            throw new NotFoundException("RawMaterial not found: " + dto.rawMaterialId);
        }

        // cria a associação
        MaterialUsage usage = new MaterialUsage();
        usage.product = product;
        usage.rawMaterial = rm;
        usage.consumptionPerUnit = dto.consumptionPerUnit;

        usage.persist();

        return Response
                .created(URI.create("/material-usage/" + usage.id))
                .entity(usage)
                .build();
    }

    @GET
    @Path("/{id}")
    public MaterialUsage find(@PathParam("id") Long id) {
        MaterialUsage mu = MaterialUsage.findById(id);
        if (mu == null) throw new NotFoundException();
        return mu;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public MaterialUsage update(@PathParam("id") Long id, MaterialUsageDTO dto) {

        MaterialUsage entity = MaterialUsage.findById(id);
        if (entity == null) throw new NotFoundException();

        if (dto.consumptionPerUnit != null) {
            entity.consumptionPerUnit = dto.consumptionPerUnit;
        }

        return entity;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        if (!MaterialUsage.deleteById(id)) {
            throw new NotFoundException();
        }
    }
}
