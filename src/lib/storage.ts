import { supabase } from "@/integrations/supabase/client";

export function productImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "";
  const { data } = supabase.storage.from("products").getPublicUrl(imagePath);
  return data.publicUrl;
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp"];
  if (!allowed.includes(ext)) {
    throw new Error("Only JPG, JPEG, PNG or WEBP images are allowed");
  }
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
