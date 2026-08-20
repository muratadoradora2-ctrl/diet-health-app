import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const notAllowedMessage =
    error === "not_allowed"
      ? "このアカウントは利用が許可されていません。"
      : undefined;

  return <LoginForm notAllowedMessage={notAllowedMessage} />;
}
