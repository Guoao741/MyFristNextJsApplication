import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';

//创建连接对象
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
//获取用户函数
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
    return user[0];
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            //类似于表单验证
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials);
        //如果验证通过,获取从用户输入拿到的数据
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          //根据邮箱去数据库查找是否存在该用户
          const user = await getUser(email);
          //如果用户不存在
          if (!user) {
            return null;
          }
          //如果用户存在，则拿用户输入的密码和数据库的密码做对比
          const passwordMatch = await bcrypt.compare(password, user.password);
          //如果密码匹配成功
          if (passwordMatch) {
            return user;
          }
        }
        //验证不通过
        console.log('Invalid credentials');
        return null;
      }
    })
  ]
});
