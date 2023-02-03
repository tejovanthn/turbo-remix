import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";
import { z } from "zod";

import { getUserId, createUserSession } from "~/session.server";

import { createUser, getUserByEmail } from "~/models/user.server";
import { safeRedirect } from "~/utils";
import type { inferSafeParseErrors } from "~/utils";

import {
  Button,
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
  const existingUser = await getUserByEmail(result.data.email);
  if (existingUser) {
    return json<ActionData>(
      {
        errors: {
          fieldErrors: { email: ["A user already exists with this email"] },
        },
      },
      { status: 400 }
    );
  }

  const user = await createUser(result.data.email, result.data.password);

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo: safeRedirect(result.data.redirectTo),
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Sign Up",
  };
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData() as ActionData;
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.fieldErrors.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.fieldErrors.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

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
            autoComplete="new-password"
            ref={passwordRef}
            label="Password"
          />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Button type="submit">Create account</Button>
        </Stack>
      </Form>
      <Text>
        Already have an account?{" "}
        <Link
          to={{
            pathname: "/login",
            search: searchParams.toString(),
          }}
        >
          Sign up
        </Link>
      </Text>
    </Container>
  );
}
