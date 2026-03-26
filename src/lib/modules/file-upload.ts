import { createBrowserClient } from "@supabase/ssr";

export class FileUploadModule {
  private client = createClient();
  private bucket = "CryptoX";

  async upload(file: File) {
    let fileName = Date.now() + "-" + file.name;
    if (!this.isValidKey(fileName)) {
      fileName = this.convertToValidKey(fileName);
    }

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(fileName, file, {
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error.message, error);
      throw new Error(error.message);
    }

    return data;
  }

  isValidKey(key: string): boolean {
    return /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/.test(key);
  }

  convertToValidKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9-_.]/g, "_");
  }
}

const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
