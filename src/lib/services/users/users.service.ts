import { Prisma } from "@prisma/client";
import { CoreService } from "../core/core.service";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

class UsersService extends CoreService {
  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isValid = await this.verifyPassword(password, user.password);

    if (!isValid) {
      throw new Error("Invalid password");
    }

    return user;
  }

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: {
        posts: {
          include: {
            user: true,
            comments: true,
            likes: true,
          },
        },
        followers: true,
        followings: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.db.user.create({
      data: {
        ...data,
        password: await this.hashPassword(data.password),
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async follow(toId: string) {
    const session = await auth();
    if (!session) {
      throw redirect("/login");
    }

    const {
      user: { email },
    } = session;

    const user = await this.db.user.update({
      where: {
        id: toId,
      },
      data: {
        followers: {
          connect: {
            email,
          },
        },
      },
    });
    return user;
  }

  async unfollow(toId: string) {
    const session = await auth();
    if (!session) {
      throw redirect("/login");
    }

    const {
      user: { email },
    } = session;

    const user = await this.db.user.update({
      where: {
        id: toId,
      },
      data: {
        followers: {
          disconnect: {
            email,
          },
        },
      },
    });
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}

export const usersService = new UsersService();
