export const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/CryptoX/`;

export function getImageUrl(imageUrl: string) {
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }
  return (
    SUPABASE_STORAGE_URL + imageUrl
  );
}
