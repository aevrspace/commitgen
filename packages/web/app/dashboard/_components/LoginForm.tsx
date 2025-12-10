"use client";

import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/aevr/button";
import { Card } from "@/components/ui/aevr/card"; // Fixed import
import { Sms } from "iconsax-react";

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
});

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  return (
    <Card
      title="Login to CommitGen"
      subtitle="Enter your email to receive a verification code"
      className="w-full max-w-md"
      variant="default"
      elevation="raised"
      icon={
        <Sms
          variant="Bulk"
          color="currentColor"
          className="text-app-theme-500 icon"
        />
      }
    >
      <Formik
        initialValues={{ email: "" }}
        validationSchema={LoginSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({ email: values.email }),
              headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
              onSuccess(values.email);
            } else {
              setStatus("Failed to send verification code. Please try again.");
            }
          } catch {
            setStatus("An error occurred. Please try again.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Email Address
              </label>
              <Field
                name="email"
                type="email"
                className={`w-full rounded-xl border bg-neutral-50 px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:text-white ${
                  errors.email && touched.email
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-neutral-200 focus:border-app-theme-500 focus:ring-app-theme-500/20 dark:border-neutral-700"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && touched.email ? (
                <div className="mt-1 text-xs text-red-500">{errors.email}</div>
              ) : null}
            </div>

            {status && (
              <div className="text-sm text-red-500 text-center">{status}</div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Code"}
            </Button>
          </Form>
        )}
      </Formik>
    </Card>
  );
};
