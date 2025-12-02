'use server';
import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
// 表单数据验证模式,要符合数据库的结构
const FormDataSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string()
});

// 创建发票表单数据验证,默认隐藏id和date
const CreateInvoice = FormDataSchema.omit({ id: true, date: true });
const UpdateInvoice = FormDataSchema.omit({ id: true, date: true });

//创建发票
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status')
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  //直接执行aql可能报错，使用try/catch捕获错误

  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch (error) {
    console.log(error);
    return {
      message: 'Database Error: Failed to Create Invoice.'
    };
  }
  revalidatePath('/dashboard/invoices'); //相当于强制刷新
  redirect('/dashboard/invoices');
}

//根据id更新发票
export async function updateInvoice(id: string, formData: FormData) {
  //获取需要更新的字段
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status')
  });
  //更改发票单位
  const amountInCents = amount * 100;
  //书写sql
  try {
    await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`;
  } catch (error) {
    console.log(error);
    return {
      message: 'Database Error: Failed to Update Invoice.'
    };
  }
  //重新验证路径
  revalidatePath('/dashboard/invoices');
  //重定向
  redirect('/dashboard/invoices');
}

//删除发票
export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
