
import { authFetch } from "./AuthService";

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon_name: string | null;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  icon_name?: string | null;
}

export type CategoryUpdate = Partial<CategoryCreate>;

// Get all categories
export function getAllCategories(): Promise<Category[]> {
  return authFetch("/categories/");
}

// Get category by ID
export function getCategoryById(
  categoryId: number
): Promise<Category> {
  return authFetch(`/categories/${categoryId}`);
}

// Create category
export function createCategory(
  payload: CategoryCreate
): Promise<Category> {
  return authFetch("/categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Update category
export function updateCategory(
  categoryId: number,
  payload: CategoryUpdate
): Promise<Category> {
  return authFetch(`/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Delete category
export async function deleteCategory(
  categoryId: number
): Promise<void> {
  await authFetch(`/categories/${categoryId}`, {
    method: "DELETE",
  });
}
