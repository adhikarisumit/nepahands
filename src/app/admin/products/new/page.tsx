import { redirect } from "next/navigation";

// The product form now opens as a popup on the Products page.
export default function NewProductPage() {
  redirect("/admin/products?new=1");
}
