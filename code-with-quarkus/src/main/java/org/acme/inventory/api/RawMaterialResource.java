package org.acme.inventory.api;

import java.net.URI;
import java.util.List;

import org.acme.inventory.domain.RawMaterial;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/raw-materials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RawMaterialResource {

    @GET
    public List<RawMaterial> list() {
        return RawMaterial.listAll();
    }

    @POST
    @Transactional
    public Response create(RawMaterial rawMaterial) {

        if (rawMaterial == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid payload."))
                    .build();
        }

        if (rawMaterial.code == null || rawMaterial.code.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Raw material code is required."))
                    .build();
        }

        if (rawMaterial.description == null || rawMaterial.description.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Raw material description is required."))
                    .build();
        }

        if (rawMaterial.availableStock == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Available stock is required."))
                    .build();
        }

        String code = rawMaterial.code.trim().toLowerCase();
        String desc = rawMaterial.description.trim().toLowerCase();

        boolean codeExists = RawMaterial.find("lower(code)", code).firstResultOptional().isPresent();
        if (codeExists) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("Raw material code already exists."))
                    .build();
        }

        boolean descExists = RawMaterial.find("lower(description)", desc).firstResultOptional().isPresent();
        if (descExists) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("Raw material description already exists."))
                    .build();
        }

        rawMaterial.id = null;
        rawMaterial.code = rawMaterial.code.trim();
        rawMaterial.description = rawMaterial.description.trim();

        rawMaterial.persist();

        return Response
                .created(URI.create("/raw-materials/" + rawMaterial.id))
                .entity(rawMaterial)
                .build();
    }

    @GET
    @Path("/{id}")
    public RawMaterial find(@PathParam("id") Long id) {
        RawMaterial rm = RawMaterial.findById(id);
        if (rm == null) throw new NotFoundException();
        return rm;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, RawMaterial data) {

        RawMaterial entity = RawMaterial.findById(id);
        if (entity == null) throw new NotFoundException();

        if (data.code != null) {
            String newCode = data.code.trim();
            if (newCode.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse("Raw material code cannot be empty."))
                        .build();
            }

            boolean codeExists = RawMaterial.find("lower(code) = ?1 and id <> ?2",
                    newCode.toLowerCase(), id).firstResultOptional().isPresent();
            if (codeExists) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(new ErrorResponse("Raw material code already exists."))
                        .build();
            }

            entity.code = newCode;
        }

        if (data.description != null) {
            String newDesc = data.description.trim();
            if (newDesc.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse("Raw material description cannot be empty."))
                        .build();
            }

            boolean descExists = RawMaterial.find("lower(description) = ?1 and id <> ?2",
                    newDesc.toLowerCase(), id).firstResultOptional().isPresent();
            if (descExists) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(new ErrorResponse("Raw material description already exists."))
                        .build();
            }

            entity.description = newDesc;
        }

        if (data.availableStock != null) entity.availableStock = data.availableStock;

        return Response.ok(entity).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        if (!RawMaterial.deleteById(id)) {
            throw new NotFoundException();
        }
    }
}
