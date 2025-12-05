//身份验证中间件

/*
请求首先经过这个中间件
NextAuth 根据 authConfig 中的配置进行身份验证检查
特别是 callbacks.authorized 函数会被调用来决定用户是否有权限访问请求的页面
如果用户未登录且试图访问受保护的页面（如 /dashboard），会被重定向到登录页面
如果用户已登录且试图访问公共页面，可能会被重定向到仪表板
*/

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
 
export default NextAuth(authConfig).auth;
 
//路由匹配规则，以/api开头的API路由,以/_next/static开头的静态资源,以/_next/image开头的图片优化请求，以及所有以.png结尾的图片文件
export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};