import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";
import { z } from "zod";

import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";
import { safeRedirect } from "~/utils";
import type { inferSafeParseErrors } from "~/utils";
import {
  Button,
  Checkbox,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Please use a longer password"),
  remember: z.boolean().default(false),
  redirectTo: z.string(),
});

type SchemaFields = z.infer<typeof schema>;
type SchemaFieldsErrors = inferSafeParseErrors<typeof schema>;

type ActionData = {
  errors?: SchemaFieldsErrors;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const fields = Object.fromEntries(
    formData.entries()
  ) as unknown as SchemaFields;
  const result = schema.safeParse(fields);
  if (!result.success) {
    return json<ActionData>(
      { errors: result.error.flatten() },
      { status: 400 }
    );
  }

  const user = await verifyLogin(result.data.email, result.data.password);

  if (!user) {
    return json<ActionData>(
      { errors: { fieldErrors: { email: ["Invalid email or password"] } } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: result.data.remember,
    redirectTo: safeRedirect(result.data.redirectTo),
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/notes";
  const actionData = useActionData() as ActionData;
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.fieldErrors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.fieldErrors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  console.log(actionData);

  return (
    <Container size="xs">
      <Title>Log in</Title>
      <Form method="post">
        <Stack>
          <TextInput
            name="email"
            type="email"
            error={actionData?.errors?.fieldErrors?.email}
            autoFocus
            required
            autoComplete="email"
            ref={emailRef}
            label="Email"
          />
          <PasswordInput
            name="password"
            error={actionData?.errors?.fieldErrors.password}
            required
            autoComplete="current-password"
            ref={passwordRef}
            label="Password"
          />
          <Checkbox name="remember" label="Remember me" />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button type="submit">Log in</Button>
        </Stack>
      </Form>
      <Text>
        Don't have an account?{" "}
        <Link
          to={{
            pathname: "/join",
            search: searchParams.toString(),
          }}
        >
          Sign up
        </Link>
      </Text>
    </Container>
  );
}
