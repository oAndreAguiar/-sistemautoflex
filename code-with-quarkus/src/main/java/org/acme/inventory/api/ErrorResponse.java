package org.acme.inventory.api;

public class ErrorResponse {
    public String message;

    public ErrorResponse() {}
    public ErrorResponse(String message) {
        this.message = message;
    }
}
