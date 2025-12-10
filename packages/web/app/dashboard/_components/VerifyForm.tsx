"use client";

import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/aevr/button";
import { Card } from "@/components/ui/aevr/card";
import { ShieldTick } from "iconsax-react";
import { UserProfile } from "@/app/dashboard/page";

interface VerifyFormProps {
  email: string;
  onSuccess: (token: string, user: UserProfile) => void;
  onBack: () => void;
}

const VerifySchema = Yup.object().shape({
  code: Yup.string()
    .length(6, "Must be exactly 6 characters")
    .required("Required"),
});

export const VerifyForm: React.FC<VerifyFormProps> = ({
  email,
  onSuccess,
  onBack,
}) => {
  return (
    <Card
      title="Verify Email"
      subtitle={`Enter the code sent to ${email}`}
      className="w-full max-w-md"
      variant="default"
      elevation="raised"
      icon={
        <ShieldTick
          variant="Bulk"
          color="currentColor"
          className="text-green-500 icon"
        />
      }
    >
      <Formik
        initialValues={{ code: "" }}
        validationSchema={VerifySchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            const res = await fetch("/api/auth/verify", {
              method: "POST",
              body: JSON.stringify({ email, code: values.code }),
              headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
              const data = await res.json();
              onSuccess(data.token, data.user);
            } else {
              setStatus("Invalid verification code. Please try again.");
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
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Verification Code
              </label>
              <Field
                name="code"
                type="text"
                maxLength={6}
                className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white ${
                  errors.code && touched.code
                    ? "border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 focus:border-app-theme-500 focus:ring-app-theme-500/20 dark:border-gray-700"
                }`}
                placeholder="123456"
              />
              {errors.code && touched.code ? (
                <div className="mt-1 text-xs text-red-500">{errors.code}</div>
              ) : null}
            </div>

            {status && (
              <div className="text-sm text-red-500 text-center">{status}</div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Card>
  );
};
