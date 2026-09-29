import { redirect } from "next/navigation";

// The product form now opens as a popup on the Products page (e.g. dashboard low-stock links).
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/products?edit=${encodeURIComponent(id)}`);
}
