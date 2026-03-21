export function getImageUrl(imageUrl: string) {
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }
  return (
    "https://nkkuehjtdudabogzwibw.supabase.co/storage/v1/object/public/CryptoX/" +
    imageUrl
  );
}
