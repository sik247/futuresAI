import Container from "@/components/ui/container";
import PostNewForm from "./new-form";

export default async function PostNew({}: {}) {
  return (
    <Container className="flex flex-col gap-16 pb-16 max-md:px-4">
      <PostNewForm />
    </Container>
  );
}
