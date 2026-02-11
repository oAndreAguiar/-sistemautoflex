package org.acme.inventory.api;

import java.net.URI;
import java.util.List;

import org.acme.inventory.domain.Product;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    @GET
    public List<Product> list() {
        return Product.listAll();
    }

    @POST
    @Transactional
    public Response create(Product product) {
        if (product == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid payload."))
                    .build();
        }

        if (product.code == null || product.code.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Product code is required."))
                    .build();
        }

        if (product.name == null || product.name.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Product name is required."))
                    .build();
        }

        if (product.unitPrice == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Unit price is required."))
                    .build();
        }

        String code = product.code.trim().toLowerCase();
        String name = product.name.trim().toLowerCase();

        boolean codeExists = Product.find("lower(code)", code).firstResultOptional().isPresent();
        if (codeExists) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("Product code already exists."))
                    .build();
        }

        boolean nameExists = Product.find("lower(name)", name).firstResultOptional().isPresent();
        if (nameExists) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("Product name already exists."))
                    .build();
        }

        product.id = null;
        product.code = product.code.trim();
        product.name = product.name.trim();

        product.persist();

        return Response.created(URI.create("/products/" + product.id))
                .entity(product)
                .build();
    }

    @GET
    @Path("/{id}")
    public Product findById(@PathParam("id") Long id) {
        Product product = Product.findById(id);
        if (product == null) throw new NotFoundException();
        return product;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, Product data) {

        Product entity = Product.findById(id);
        if (entity == null) throw new NotFoundException();

        // Validate + enforce uniqueness (case-insensitive) when updating code/name
        if (data.code != null) {
            String newCode = data.code.trim();
            if (newCode.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse("Product code cannot be empty."))
                        .build();
            }

            boolean codeExists = Product.find("lower(code) = ?1 and id <> ?2",
                    newCode.toLowerCase(), id).firstResultOptional().isPresent();
            if (codeExists) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(new ErrorResponse("Product code already exists."))
                        .build();
            }

            entity.code = newCode;
        }

        if (data.name != null) {
            String newName = data.name.trim();
            if (newName.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse("Product name cannot be empty."))
                        .build();
            }

            boolean nameExists = Product.find("lower(name) = ?1 and id <> ?2",
                    newName.toLowerCase(), id).firstResultOptional().isPresent();
            if (nameExists) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(new ErrorResponse("Product name already exists."))
                        .build();
            }

            entity.name = newName;
        }

        if (data.unitPrice != null) entity.unitPrice = data.unitPrice;

        return Response.ok(entity).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        if (!Product.deleteById(id)) {
            throw new NotFoundException();
        }
    }
}
