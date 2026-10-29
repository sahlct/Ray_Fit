import { redirect } from "next/navigation";

export default async function TenantRootPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  redirect(`/${slug}/dashboard`);
}
