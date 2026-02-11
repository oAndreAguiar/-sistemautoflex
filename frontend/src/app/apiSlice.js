import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:8080" }),
  tagTypes: ["Products", "RawMaterials", "MaterialUsage", "Production"],
  endpoints: (builder) => ({
    // Products
    getProducts: builder.query({
      query: () => "/products",
      providesTags: ["Products"],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ["Products"],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products", "Production"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: "PUT", body }),
      invalidatesTags: ["Products", "Production"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products", "Production", "MaterialUsage"],
    }),

    // Raw materials
    getRawMaterials: builder.query({
      query: () => "/raw-materials",
      providesTags: ["RawMaterials"],
    }),
    createRawMaterial: builder.mutation({
      query: (body) => ({ url: "/raw-materials", method: "POST", body }),
      invalidatesTags: ["RawMaterials", "Production"],
    }),
    updateRawMaterial: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/raw-materials/${id}`, method: "PUT", body }),
      invalidatesTags: ["RawMaterials", "Production"],
    }),
    deleteRawMaterial: builder.mutation({
      query: (id) => ({ url: `/raw-materials/${id}`, method: "DELETE" }),
      invalidatesTags: ["RawMaterials", "Production", "MaterialUsage"],
    }),

    // Material usage (BOM)
    getMaterialUsage: builder.query({
      query: () => "/material-usage",
      providesTags: ["MaterialUsage"],
    }),
    createMaterialUsage: builder.mutation({
      query: (body) => ({ url: "/material-usage", method: "POST", body }),
      invalidatesTags: ["MaterialUsage", "Production"],
    }),
    updateMaterialUsage: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/material-usage/${id}`, method: "PUT", body }),
      invalidatesTags: ["MaterialUsage", "Production"],
    }),
    deleteMaterialUsage: builder.mutation({
      query: (id) => ({ url: `/material-usage/${id}`, method: "DELETE" }),
      invalidatesTags: ["MaterialUsage", "Production"],
    }),

    // Production
    produce: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `/production/${productId}/produce/${quantity}`,
        method: "POST",
      }),
      invalidatesTags: ["RawMaterials", "Production", "MaterialUsage"],
    }),
    productionCheck: builder.query({
      query: () => "/production-check",
      providesTags: ["Production"],
    }),
    productionPriority: builder.query({
      query: () => "/production-priority",
      providesTags: ["Production"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,

  useGetRawMaterialsQuery,
  useCreateRawMaterialMutation,
  useUpdateRawMaterialMutation,
  useDeleteRawMaterialMutation,

  useGetMaterialUsageQuery,
  useCreateMaterialUsageMutation,
  useUpdateMaterialUsageMutation,
  useDeleteMaterialUsageMutation,

  useProduceMutation,
  useProductionCheckQuery,
  useProductionPriorityQuery,
} = api;
