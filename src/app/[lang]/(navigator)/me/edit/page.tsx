import Container from "@/components/ui/container";
import { getUser } from "./actions";
import { EditForm } from "./edit-form";

type TEdit = {};

const Edit: React.FC<TEdit> = async ({}) => {
  const [user] = await Promise.all([getUser()]);
  if (!user) {
    return;
  }
  return (
    <Container className="flex flex-col gap-6 py-12 max-md:px-4 px-6">
      <EditForm user={user} />
    </Container>
  );
};

export default Edit;
