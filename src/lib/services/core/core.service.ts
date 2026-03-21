import prisma from "@/lib/prisma";

export class CoreService {
  protected db = prisma;
}
